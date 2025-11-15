import { EventType, MessageStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getInstagramConfig } from "@/lib/config";
import { renderTemplate } from "@/lib/template";
import { sendDirectMessage } from "@/lib/instagram";

const schema = z.object({
  recipientId: z.string().min(1),
  message: z.string().optional(),
  messageType: z.nativeEnum(EventType).optional(),
  username: z.string().optional(),
});

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured." },
      { status: 500 },
    );
  }

  const payload = await request.json();
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { recipientId, message, username } = parsed.data;
  const messageType = parsed.data.messageType ?? EventType.FOLLOW;

  const config = await getInstagramConfig();

  if (!config) {
    return NextResponse.json(
      { error: "Instagram credentials are not configured." },
      { status: 400 },
    );
  }

  const override = typeof message === "string" ? message.trim() : "";

  const template =
    override.length > 0
      ? override
      : messageType === EventType.FOLLOW
        ? config.followerMessage
        : config.likeMessage;

  const renderedMessage = renderTemplate(template, {
    username: username ?? null,
  });

  const log = await prisma.messageLog.create({
    data: {
      instagramUserId: recipientId,
      instagramUsername: username ?? null,
      messageType,
      status: MessageStatus.PENDING,
    },
  });

  try {
    await sendDirectMessage({
      accessToken: config.accessToken,
      instagramBusinessAccountId: config.instagramBusinessAccountId,
      recipientId,
      message: renderedMessage,
    });

    await prisma.messageLog.update({
      where: { id: log.id },
      data: {
        status: MessageStatus.SENT,
        error: null,
      },
    });

    return NextResponse.json({ ok: true, logId: log.id });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : JSON.stringify(error);

    await prisma.messageLog.update({
      where: { id: log.id },
      data: {
        status: MessageStatus.FAILED,
        error: errorMessage,
      },
    });

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
