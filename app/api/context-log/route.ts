import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { mealType, musicGenre, moodScore, stressLevel, timeOfDay, performanceRating } = body;

  // Validate ranges
  if (moodScore !== undefined && (moodScore < 1 || moodScore > 10)) {
    return NextResponse.json({ error: "Mood must be 1-10" }, { status: 400 });
  }
  if (stressLevel !== undefined && (stressLevel < 1 || stressLevel > 10)) {
    return NextResponse.json({ error: "Stress must be 1-10" }, { status: 400 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const log = await prisma.contextLog.create({
    data: {
      userId: session.user.id,
      date: today,
      mealType: mealType ?? null,
      musicGenre: musicGenre ?? null,
      moodScore: moodScore ?? null,
      stressLevel: stressLevel ?? null,
      timeOfDay: timeOfDay ?? null,
      performanceRating: performanceRating ?? null,
    },
  });

  return NextResponse.json(log, { status: 201 });
}
