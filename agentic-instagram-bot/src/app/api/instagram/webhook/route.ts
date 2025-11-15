import { EventType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { recordAndProcessEvents } from "@/lib/event-processor";
import {
  extractFollowerEvents,
  extractLikeEvents,
  type InstagramWebhookPayload,
  verifyInstagramSignature,
} from "@/lib/instagram";
import { getInstagramConfig } from "@/lib/config";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured." },
      { status: 500 },
    );
  }

  const config = await getInstagramConfig();

  if (
    mode === "subscribe" &&
    challenge &&
    token &&
    config &&
    token === config.verifyToken
  ) {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ error: "Verification failed." }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const bodyText = await request.text();
  const signature = request.headers.get("x-hub-signature-256") ?? undefined;

  if (!verifyInstagramSignature(bodyText, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured." },
      { status: 500 },
    );
  }

  let payload: InstagramWebhookPayload;

  try {
    payload = JSON.parse(bodyText) as InstagramWebhookPayload;
  } catch (error) {
    return NextResponse.json(
      { error: `Invalid JSON payload: ${String(error)}` },
      { status: 400 },
    );
  }

  const config = await getInstagramConfig();

  if (!config) {
    return NextResponse.json(
      { error: "Instagram configuration missing." },
      { status: 500 },
    );
  }

  const followerEvents = extractFollowerEvents(payload).map((event) => ({
    ...event,
    eventType: EventType.FOLLOW,
  }));

  const likeEvents = extractLikeEvents(payload).map((event) => ({
    ...event,
    eventType: EventType.LIKE,
  }));

  await recordAndProcessEvents([...followerEvents, ...likeEvents]);

  return NextResponse.json({ ok: true });
}
