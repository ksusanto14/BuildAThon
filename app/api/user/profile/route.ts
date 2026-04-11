import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, sportType, timezone, onboardingComplete } = body;

  // Validate name if provided
  if (name !== undefined) {
    if (typeof name !== "string" || name.length < 2 || name.length > 50) {
      return NextResponse.json(
        { error: "Name must be 2-50 characters" },
        { status: 400 }
      );
    }
  }

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (sportType !== undefined) updateData.sportType = sportType;
  if (timezone !== undefined) updateData.timezone = timezone;
  if (onboardingComplete !== undefined)
    updateData.onboardingComplete = onboardingComplete;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      sportType: true,
      timezone: true,
      onboardingComplete: true,
    },
  });

  return NextResponse.json(user);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      sportType: true,
      timezone: true,
      avatarUrl: true,
      onboardingComplete: true,
      createdAt: true,
    },
  });

  return NextResponse.json(user);
}
