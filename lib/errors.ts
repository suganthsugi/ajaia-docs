import { NextResponse } from "next/server";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_CONTENT"
  | "CANNOT_SHARE_WITH_SELF"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "USER_NOT_FOUND"
  | "ALREADY_SHARED"
  | "FILE_TOO_LARGE"
  | "PAYLOAD_TOO_LARGE"
  | "UNSUPPORTED_FILE_TYPE"
  | "CORRUPT_FILE"
  | "INTERNAL";

/** An error that is safe to show to the user; carries its HTTP status and API error code. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const validationError = (message: string) => new AppError(400, "VALIDATION_ERROR", message);
export const invalidContent = (message = "This document content isn't valid for the editor.") =>
  new AppError(400, "INVALID_CONTENT", message);
export const cannotShareWithSelf = () =>
  new AppError(400, "CANNOT_SHARE_WITH_SELF", "You already own this document.");
export const unauthenticated = () => new AppError(401, "UNAUTHENTICATED", "Please sign in.");
export const forbidden = (message = "You don't have permission to do that.") =>
  new AppError(403, "FORBIDDEN", message);
export const notFound = (message = "Document not found.") => new AppError(404, "NOT_FOUND", message);
export const userNotFound = (email: string) =>
  new AppError(404, "USER_NOT_FOUND", `No user with the email ${email}.`);
export const alreadyShared = (name: string) =>
  new AppError(409, "ALREADY_SHARED", `${name} already has access to this document.`);
export const payloadTooLarge = () =>
  new AppError(413, "PAYLOAD_TOO_LARGE", "This document is too large to save (max 1 MB).");

export function toResponse(err: unknown): NextResponse {
  if (err instanceof AppError) {
    return NextResponse.json({ error: { code: err.code, message: err.message } }, { status: err.status });
  }
  console.error(err);
  return NextResponse.json(
    { error: { code: "INTERNAL", message: "Something went wrong. Please try again." } },
    { status: 500 },
  );
}
