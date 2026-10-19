import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicRoute } from "@/lib/http";

export const GET = publicRoute(async () => {
  const users = await db.user.findMany({
    select: { id: true, email: true, name: true },
    orderBy: { email: "asc" },
  });
  return NextResponse.json({ users });
});
