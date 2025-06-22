import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(req: NextRequest) {
  const session = liveblocks.prepareSession(`user-${Math.floor(Math.random() * 10)}`);
  session.allow(`sample_*`, session.FULL_ACCESS);

  const { status, body } = await session.authorize();

  return new NextResponse(body, { status });
}
