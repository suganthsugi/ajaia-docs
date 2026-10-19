"use client";

import { toast } from "sonner";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiInit = Omit<RequestInit, "body"> & { body?: unknown; silent?: boolean };

/**
 * fetch wrapper for our API: sends JSON (or FormData as is), turns `{ error: { code, message } }`
 * into an ApiError, shows it as a toast unless `silent`, and sends the user to /login on 401.
 */
export async function apiFetch<T = unknown>(url: string, init: ApiInit = {}): Promise<T> {
  const { body, silent, headers, ...rest } = init;
  const isForm = body instanceof FormData;

  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers: isForm || body === undefined ? headers : { "Content-Type": "application/json", ...headers },
      body: isForm ? body : body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    const err = new ApiError(0, "NETWORK_ERROR", "Can't reach the server. Check your connection.");
    if (!silent) toast.error(err.message);
    throw err;
  }

  if (res.ok) {
    return (res.status === 204 ? undefined : await res.json()) as T;
  }

  const payload = (await res.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null;
  let code = payload?.error?.code ?? "INTERNAL";
  let message = payload?.error?.message ?? "Something went wrong. Please try again.";
  if (res.status === 413 && !payload?.error) {
    // The hosting platform rejects oversized bodies before our handler runs.
    code = "FILE_TOO_LARGE";
    message = "File too large (max 4 MB)";
  }

  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login";
  }

  const err = new ApiError(res.status, code, message);
  if (!silent) toast.error(message);
  throw err;
}
