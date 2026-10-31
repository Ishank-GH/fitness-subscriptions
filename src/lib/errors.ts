import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiResponse } from "@/types";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, string[]>;

  constructor(
    message: string,
    statusCode: number = 400,
    code: string = "BAD_REQUEST",
    details?: Record<string, string[]>
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function badRequest(
  message: string = "Bad Request",
  code: string = "BAD_REQUEST",
  details?: Record<string, string[]>
): never {
  throw new AppError(message, 400, code, details);
}

export function unauthorized(
  message: string = "Unauthorized access",
  code: string = "UNAUTHORIZED"
): never {
  throw new AppError(message, 401, code);
}

export function forbidden(
  message: string = "Forbidden",
  code: string = "FORBIDDEN"
): never {
  throw new AppError(message, 403, code);
}

export function notFound(
  message: string = "Resource not found",
  code: string = "NOT_FOUND"
): never {
  throw new AppError(message, 404, code);
}

export function conflict(
  message: string = "Resource conflict",
  code: string = "CONFLICT"
): never {
  throw new AppError(message, 409, code);
}

/**
 * Maps application and database errors into a consistent response envelope.
 * Uncaught internal errors are logged server-side and masked from clients.
 */
export function handleApiError(error: unknown): NextResponse<ApiResponse<never>> {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Input validation failed",
          details: error.flatten().fieldErrors as Record<string, string[]>,
        },
      },
      { status: 400 }
    );
  }

  // Handle Mongoose invalid ObjectId / CastError
  if (
    typeof error === "object" &&
    error !== null &&
    (error as { name?: string }).name === "CastError"
  ) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_IDENTIFIER",
          message: "Invalid resource identifier format",
        },
      },
      { status: 400 }
    );
  }

  // Handle MongoDB duplicate key error (code 11000)
  if (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: number }).code === 11000
  ) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "DUPLICATE_ENTRY",
          message: "A resource with this unique value already exists",
        },
      },
      { status: 409 }
    );
  }

  // Log unexpected errors server-side without leaking internals to clients
  console.error("[INTERNAL_SERVER_ERROR]", error);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An internal server error occurred. Please try again later.",
      },
    },
    { status: 500 }
  );
}

/**
 * Standard success response wrapper.
 */
export function apiSuccess<T>(data: T, status: number = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}