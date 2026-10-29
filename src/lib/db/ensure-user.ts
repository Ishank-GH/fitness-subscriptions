import { connectToDatabase } from "@/lib/db/connection";
import { User, type IUser } from "@/lib/db/models/user";
import type { UserRole } from "@/types";

interface EnsureUserParams {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

/**
 * Ensures a MongoDB User document exists for the given Clerk user.
 * Uses an atomic upsert so concurrent calls from the webhook and a
 * page request cannot produce a duplicate-key error.
 */
export async function ensureUserDocument(params: EnsureUserParams): Promise<IUser> {
  await connectToDatabase();

  const user = await User.findOneAndUpdate(
    { clerkId: params.clerkId },
    {
      $setOnInsert: {
        clerkId: params.clerkId,
        email: params.email.toLowerCase(),
        firstName: params.firstName || undefined,
        lastName: params.lastName || undefined,
        role: params.role || "USER",
      },
    },
    { upsert: true, new: true }
  );

  return user;
}
