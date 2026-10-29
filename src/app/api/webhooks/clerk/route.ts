import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { connectToDatabase } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user";

/**
 * Clerk webhook receiver.
 *
 * Clerk session claims (publicMetadata.role) are the authoritative source of
 * truth for a user's role. The role stored in MongoDB is a denormalized copy
 * kept in sync by this webhook so that server-side queries and display logic
 * can reference it without calling Clerk on every request.
 */

// Minimal shapes for the Clerk event payload fields we consume
interface ClerkEmailAddress {
  email_address: string;
  id: string;
}

interface ClerkUserEventData {
  id: string;
  email_addresses: ClerkEmailAddress[];
  primary_email_address_id: string;
  first_name: string | null;
  last_name: string | null;
  public_metadata?: { role?: string };
}

interface ClerkWebhookEvent {
  type: string;
  data: ClerkUserEventData;
}

/**
 * Extracts the primary email address from the Clerk event payload.
 */
function extractPrimaryEmail(data: ClerkUserEventData): string {
  const primary = data.email_addresses.find(
    (e) => e.id === data.primary_email_address_id
  );
  return (primary?.email_address || data.email_addresses[0]?.email_address || "").toLowerCase();
}

/**
 * POST /api/webhooks/clerk
 *
 * Receives Clerk webhook events (user.created, user.updated, user.deleted).
 * Verifies the Svix signature against CLERK_WEBHOOK_SECRET before processing.
 * Uses upsert for idempotent handling of create/update events.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[Clerk Webhook] CLERK_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Read the raw body for signature verification
  const body = await req.text();

  // Extract Svix headers
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing Svix verification headers" },
      { status: 400 }
    );
  }

  // Verify the signature
  let event: ClerkWebhookEvent;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as unknown as ClerkWebhookEvent;
  } catch (err) {
    console.error("[Clerk Webhook] Signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 }
    );
  }

  const { type, data } = event;

  try {
    await connectToDatabase();

    switch (type) {
      case "user.created":
      case "user.updated": {
        const email = extractPrimaryEmail(data);
        const role = data.public_metadata?.role === "ADMIN" ? "ADMIN" : "USER";

        // Build $unset for names that Clerk sends as null/empty
        const unsetFields: Record<string, 1> = {};
        if (!data.first_name) unsetFields.firstName = 1;
        if (!data.last_name) unsetFields.lastName = 1;

        // Build $set with only truthy name values
        const setFields: Record<string, unknown> = {
          clerkId: data.id,
          email,
          role,
        };
        if (data.first_name) setFields.firstName = data.first_name;
        if (data.last_name) setFields.lastName = data.last_name;

        const update: Record<string, unknown> = { $set: setFields };
        if (Object.keys(unsetFields).length > 0) {
          update.$unset = unsetFields;
        }

        await User.findOneAndUpdate(
          { clerkId: data.id },
          update,
          { upsert: true, new: true }
        );

        console.log(`[Clerk Webhook] ${type}: synced user ${data.id}`);
        break;
      }

      case "user.deleted": {
        const deleted = await User.findOneAndUpdate(
          { clerkId: data.id },
          {
            $set: {
              subscription: null,
              email: `deleted-${data.id}@removed.local`,
            },
            $unset: {
              firstName: 1,
              lastName: 1,
            },
          }
        );

        if (deleted) {
          console.log(`[Clerk Webhook] user.deleted: cleared user ${data.id}`);
        } else {
          console.log(`[Clerk Webhook] user.deleted: no document found for ${data.id}`);
        }
        break;
      }

      default:
        console.log(`[Clerk Webhook] Unhandled event type: ${type}`);
    }
  } catch (err) {
    console.error(`[Clerk Webhook] Error processing ${type}:`, err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
