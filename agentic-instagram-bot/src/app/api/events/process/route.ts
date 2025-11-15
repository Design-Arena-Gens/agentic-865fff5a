import { NextResponse } from "next/server";

import { processPendingEvents } from "@/lib/event-processor";
import { getInstagramConfig } from "@/lib/config";

export async function POST() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured." },
      { status: 500 },
    );
  }

  const config = await getInstagramConfig();

  if (!config) {
    return NextResponse.json(
      { error: "Instagram credentials are not configured yet." },
      { status: 400 },
    );
  }

  const processedCount = await processPendingEvents();

  return NextResponse.json({ processedCount });
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
