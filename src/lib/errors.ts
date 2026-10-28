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
 * Normalizes Zod validation errors into a field -> string[] dictionary.
 */
export function formatZodError(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "general";
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }
  return formatted;
}

/**
 * Consistent error response handler for API routes.
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
          details: formatZodError(error),
        },
      },
      { status: 400 }
    );
  }

  const message =
    error instanceof Error ? error.message : "An unexpected server error occurred";

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message,
      },
    },
    { status: 500 }
  );
}

/**
 * Standard success response generator for API routes.
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

