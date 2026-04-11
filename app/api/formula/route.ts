import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
