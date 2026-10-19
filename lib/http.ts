import type { NextRequest } from "next/server";
import { z } from "zod";
import { toResponse, validationError } from "@/lib/errors";
import { requireUser, type UserDTO } from "@/lib/session";

type Params = Record<string, string>;
type Ctx<P extends Params> = { params: Promise<P> };

type Handler<P extends Params> = (args: { req: NextRequest; user: UserDTO; params: P }) => Promise<Response>;
type PublicHandler<P extends Params> = (args: { req: NextRequest; params: P }) => Promise<Response>;

/** Wraps a route handler: resolves the session user, awaits params, maps every error to `{ error }`. */
export function route<P extends Params = Params>(handler: Handler<P>) {
  return async (req: NextRequest, ctx: Ctx<P>) => {
    try {
      const user = await requireUser();
      return await handler({ req, user, params: await ctx.params });
    } catch (err) {
      return toResponse(err);
    }
  };
}

export function publicRoute<P extends Params = Params>(handler: PublicHandler<P>) {
  return async (req: NextRequest, ctx: Ctx<P>) => {
    try {
      return await handler({ req, params: await ctx.params });
    } catch (err) {
      return toResponse(err);
    }
  };
}

export function parse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const issue = result.error.issues[0];
  const field = issue?.path.join(".");
  throw validationError(field ? `${field}: ${issue.message}` : (issue?.message ?? "Invalid request"));
}

/** Reads a JSON body; an empty or malformed body becomes `{}` so Zod reports the missing fields. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
