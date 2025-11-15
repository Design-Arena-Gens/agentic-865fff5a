import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getInstagramConfig } from "@/lib/config";

const settingsSchema = z.object({
  accessToken: z.string().min(1),
  instagramBusinessAccountId: z.string().min(1),
  verifyToken: z.string().min(1),
  followerMessage: z.string().min(1),
  likeMessage: z.string().min(1),
  followerAutomationEnabled: z.boolean(),
  likeAutomationEnabled: z.boolean(),
});

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(null);
  }

  const config = await getInstagramConfig();
  return NextResponse.json(config);
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured." },
      { status: 500 },
    );
  }

  const payload = await request.json();
  const result = settingsSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten() },
      { status: 400 },
    );
  }

  const data = result.data;

  await prisma.instagramConfig.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      accessToken: data.accessToken,
      instagramBusinessAccountId: data.instagramBusinessAccountId,
      verifyToken: data.verifyToken,
      followerMessage: data.followerMessage,
      likeMessage: data.likeMessage,
      followerAutomationEnabled: data.followerAutomationEnabled,
      likeAutomationEnabled: data.likeAutomationEnabled,
    },
    update: {
      accessToken: data.accessToken,
      instagramBusinessAccountId: data.instagramBusinessAccountId,
      verifyToken: data.verifyToken,
      followerMessage: data.followerMessage,
      likeMessage: data.likeMessage,
      followerAutomationEnabled: data.followerAutomationEnabled,
      likeAutomationEnabled: data.likeAutomationEnabled,
    },
  });

  return NextResponse.json({ ok: true });
}
