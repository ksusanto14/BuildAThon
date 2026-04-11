import { NextResponse } from "next/server";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { auth } from "@/lib/auth";
import { formatUserDataForAI } from "@/lib/ai/formatter";
import { prisma } from "@/lib/prisma";

const MOCK_FORMULA = {
  conditions: [
    {
      factor: "Sleep Duration",
      optimalRange: "7.5-8.5 hours",
      impact: "Recovery scores are 35% higher when sleep exceeds 7.5 hours",
      direction: "range_optimal",
    },
    {
      factor: "HRV Baseline",
      optimalRange: "> 55ms",
      impact: "Training capacity increases significantly above this threshold",
      direction: "higher_better",
    },
    {
      factor: "Pre-training Nutrition",
      optimalRange: "Balanced meal 2-3 hours before",
      impact: "Performance ratings correlate strongly with proper fueling",
      direction: "range_optimal",
    },
    {
      factor: "Stress Level",
      optimalRange: "< 4/10",
      impact: "Low stress days show 28% better recovery the following day",
      direction: "lower_better",
    },
    {
      factor: "Sleep Efficiency",
      optimalRange: "> 85%",
      impact: "High efficiency sleep predicts next-day HRV improvement",
      direction: "higher_better",
    },
  ],
  formulaText:
    "You perform best when you get 7.5-8.5 hours of high-efficiency sleep, maintain an HRV above 55ms, and keep daily stress below 4/10. Your data shows a strong connection between pre-training nutrition timing and session quality.",
  confidenceScore: 72,
  recommendations: [
    "Prioritize consistent bedtimes to maintain sleep efficiency above 85%",
    "Schedule high-intensity sessions on days when HRV is above your 55ms baseline",
    "Eat a balanced meal 2-3 hours before training for optimal performance",
    "Incorporate stress-reduction practices on days when stress exceeds 4/10",
    "Track your mood score — sessions rated highest correlate with mood scores of 7+",
  ],
};

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { systemPrompt, userPrompt, sessionCount } =
    await formatUserDataForAI(userId);

  if (sessionCount < 7) {
    return NextResponse.json(
      { error: "Need at least 7 days of data" },
      { status: 400 }
    );
  }

  // Demo mode: return mock formula if no API key is configured
  if (!process.env.ANTHROPIC_API_KEY) {
    // Save the mock formula to the database
    const existingFormulas = await prisma.performanceFormula.count({
      where: { userId },
    });

    const formula = await prisma.performanceFormula.create({
      data: {
        userId,
        formulaText: MOCK_FORMULA.formulaText,
        conditions: JSON.stringify(MOCK_FORMULA.conditions),
        confidenceScore: MOCK_FORMULA.confidenceScore,
        sessionsAnalyzed: sessionCount,
        version: existingFormulas + 1,
      },
    });

    return NextResponse.json({
      formula: {
        ...formula,
        conditions: MOCK_FORMULA.conditions,
      },
      mock: true,
    });
  }

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    prompt: userPrompt,
    maxOutputTokens: 2000,
    temperature: 0.3,
  });

  return result.toTextStreamResponse();
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formula = await prisma.performanceFormula.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  if (!formula) {
    return NextResponse.json({ formula: null });
  }

  return NextResponse.json({
    formula: {
      ...formula,
      conditions: JSON.parse(formula.conditions),
    },
  });
}
