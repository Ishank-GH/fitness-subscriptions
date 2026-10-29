import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { unauthorized, forbidden } from "@/lib/errors";

export interface AuthSession {
  userId: string;
  role: "ADMIN" | "USER";
  email?: string;
}

/**
 * Retrieves the current authenticated user session and role from Clerk session claims.
 */
export async function getAuthSession(): Promise<AuthSession | null> {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return null;
  }

  const metadata = (sessionClaims?.metadata || sessionClaims?.publicMetadata) as
    | { role?: string }
    | undefined;

  const role = metadata?.role === "ADMIN" ? "ADMIN" : "USER";

  return {
    userId,
    role,
  };
}

/**
 * Server Component / Layout guard: requires authenticated user.
 * Redirects to /sign-in if not authenticated.
 */
export async function requireUser(): Promise<AuthSession> {
  const session = await getAuthSession();

  if (!session) {
    redirect("/sign-in");
  }

  return session;
}

/**
 * Server Component / Layout guard: requires ADMIN role.
 * Redirects non-admins to /dashboard.
 */
export async function requireAdmin(): Promise<AuthSession> {
  const session = await getAuthSession();

  if (!session) {
    redirect("/sign-in");
  }

  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return session;
}

/**
 * API Route Handler guard: enforces user authentication.
 * Throws 401 AppError if unauthenticated.
 */
export async function requireApiUser(): Promise<AuthSession> {
  const session = await getAuthSession();

  if (!session) {
    unauthorized("You must be signed in to perform this action");
  }

  return session;
}

/**
 * API Route Handler guard: enforces ADMIN role.
 * Throws 403 AppError if role is not ADMIN.
 */
export async function requireApiAdmin(): Promise<AuthSession> {
  const session = await getAuthSession();

  if (!session) {
    unauthorized("You must be signed in to perform this action");
  }

  if (session.role !== "ADMIN") {
    forbidden("Administrative privileges are required for this action");
  }

  return session;
}

