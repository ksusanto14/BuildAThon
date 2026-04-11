import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SUPPORTED_PROVIDERS = ["WHOOP", "GARMIN", "OURA", "APPLE_HEALTH"];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connections = await prisma.wearableConnection.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      provider: true,
      syncStatus: true,
      lastSyncAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json(connections);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { provider, accessToken } = body as {
    provider: string;
    accessToken: string;
  };

  if (!provider || !accessToken) {
    return NextResponse.json(
      { error: "provider and accessToken are required" },
      { status: 400 }
    );
  }

  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    return NextResponse.json(
      { error: `Unsupported provider. Must be one of: ${SUPPORTED_PROVIDERS.join(", ")}` },
      { status: 400 }
    );
  }

  // Check if connection already exists
  const existing = await prisma.wearableConnection.findUnique({
    where: {
      userId_provider: {
        userId: session.user.id,
        provider,
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Provider already connected" },
      { status: 409 }
    );
  }

  const connection = await prisma.wearableConnection.create({
    data: {
      userId: session.user.id,
      provider,
      accessToken,
      syncStatus: "connected",
    },
  });

  return NextResponse.json(connection, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { provider } = body as { provider: string };

  if (!provider) {
    return NextResponse.json(
      { error: "provider is required" },
      { status: 400 }
    );
  }

  await prisma.wearableConnection.delete({
    where: {
      userId_provider: {
        userId: session.user.id,
        provider,
      },
    },
  });

  return NextResponse.json({ ok: true });
}
