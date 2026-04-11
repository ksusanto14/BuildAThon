import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Food Database                                                      */
/* ------------------------------------------------------------------ */

interface FoodItem {
  item: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const TRAINING_BREAKFAST: FoodItem[] = [
  { item: "Oatmeal with berries", portion: "1 cup", calories: 300, protein: 10, carbs: 54, fat: 5 },
  { item: "Greek yogurt", portion: "200g", calories: 130, protein: 20, carbs: 6, fat: 2 },
  { item: "Banana", portion: "1 medium", calories: 105, protein: 1, carbs: 27, fat: 0 },
  { item: "Whole grain toast with peanut butter", portion: "2 slices", calories: 320, protein: 12, carbs: 36, fat: 14 },
  { item: "Scrambled eggs", portion: "3 large", calories: 220, protein: 18, carbs: 2, fat: 15 },
  { item: "Orange juice", portion: "250ml", calories: 110, protein: 2, carbs: 26, fat: 0 },
  { item: "Protein smoothie (whey, banana, oats)", portion: "400ml", calories: 380, protein: 30, carbs: 48, fat: 6 },
];

const TRAINING_LUNCH: FoodItem[] = [
  { item: "Grilled chicken breast", portion: "200g", calories: 330, protein: 62, carbs: 0, fat: 7 },
  { item: "Brown rice", portion: "1.5 cups cooked", calories: 340, protein: 7, carbs: 72, fat: 3 },
  { item: "Steamed broccoli", portion: "1 cup", calories: 55, protein: 4, carbs: 11, fat: 0 },
  { item: "Sweet potato", portion: "1 medium", calories: 103, protein: 2, carbs: 24, fat: 0 },
  { item: "Quinoa bowl with black beans", portion: "1.5 cups", calories: 420, protein: 18, carbs: 68, fat: 8 },
  { item: "Grilled salmon fillet", portion: "170g", calories: 350, protein: 40, carbs: 0, fat: 20 },
  { item: "Mixed green salad with olive oil", portion: "large bowl", calories: 120, protein: 3, carbs: 8, fat: 9 },
];

const TRAINING_SNACK: FoodItem[] = [
  { item: "Rice cakes with almond butter", portion: "3 cakes", calories: 270, protein: 8, carbs: 36, fat: 12 },
  { item: "Trail mix (nuts, dried fruit)", portion: "1/3 cup", calories: 200, protein: 5, carbs: 22, fat: 12 },
  { item: "Protein bar", portion: "1 bar", calories: 220, protein: 20, carbs: 24, fat: 8 },
  { item: "Apple with peanut butter", portion: "1 apple + 2 tbsp", calories: 280, protein: 8, carbs: 34, fat: 16 },
  { item: "Energy bites (oats, honey, chocolate)", portion: "3 balls", calories: 210, protein: 6, carbs: 28, fat: 9 },
];

const TRAINING_DINNER: FoodItem[] = [
  { item: "Lean ground turkey stir-fry", portion: "250g", calories: 380, protein: 42, carbs: 12, fat: 18 },
  { item: "Jasmine rice", portion: "1.5 cups cooked", calories: 310, protein: 6, carbs: 68, fat: 1 },
  { item: "Roasted vegetables (bell peppers, zucchini)", portion: "1.5 cups", calories: 90, protein: 3, carbs: 14, fat: 3 },
  { item: "Pasta with marinara and lean beef", portion: "2 cups", calories: 520, protein: 32, carbs: 64, fat: 14 },
  { item: "Grilled chicken thighs", portion: "200g", calories: 360, protein: 44, carbs: 0, fat: 20 },
  { item: "Baked potato with cottage cheese", portion: "1 large", calories: 310, protein: 18, carbs: 48, fat: 4 },
  { item: "Steamed asparagus", portion: "8 spears", calories: 30, protein: 3, carbs: 5, fat: 0 },
];

const REST_BREAKFAST: FoodItem[] = [
  { item: "Egg white omelette with spinach", portion: "4 whites + 1 cup", calories: 140, protein: 22, carbs: 4, fat: 2 },
  { item: "Avocado toast on sourdough", portion: "1 slice", calories: 240, protein: 6, carbs: 22, fat: 15 },
  { item: "Cottage cheese with walnuts", portion: "200g + 30g", calories: 280, protein: 28, carbs: 8, fat: 16 },
  { item: "Green smoothie (spinach, protein, berries)", portion: "350ml", calories: 220, protein: 25, carbs: 18, fat: 5 },
  { item: "Turkey bacon", portion: "3 slices", calories: 90, protein: 10, carbs: 0, fat: 5 },
  { item: "Mixed berries", portion: "1 cup", calories: 70, protein: 1, carbs: 17, fat: 0 },
];

const REST_LUNCH: FoodItem[] = [
  { item: "Tuna salad (light mayo) on greens", portion: "1 can + greens", calories: 280, protein: 38, carbs: 6, fat: 12 },
  { item: "Lentil soup", portion: "2 cups", calories: 320, protein: 22, carbs: 42, fat: 6 },
  { item: "Grilled chicken Caesar salad (light dressing)", portion: "large", calories: 350, protein: 40, carbs: 12, fat: 16 },
  { item: "Turkey and avocado lettuce wraps", portion: "3 wraps", calories: 300, protein: 30, carbs: 8, fat: 18 },
  { item: "Hard boiled eggs", portion: "2 large", calories: 140, protein: 12, carbs: 1, fat: 10 },
  { item: "Cherry tomatoes", portion: "1 cup", calories: 30, protein: 1, carbs: 6, fat: 0 },
];

const REST_SNACK: FoodItem[] = [
  { item: "Greek yogurt with chia seeds", portion: "200g + 1 tbsp", calories: 180, protein: 22, carbs: 10, fat: 6 },
  { item: "Celery with hummus", portion: "4 sticks + 3 tbsp", calories: 130, protein: 4, carbs: 12, fat: 8 },
  { item: "Protein shake (whey + water)", portion: "1 scoop", calories: 120, protein: 24, carbs: 3, fat: 1 },
  { item: "Almonds", portion: "30g (23 almonds)", calories: 170, protein: 6, carbs: 6, fat: 14 },
  { item: "Edamame", portion: "1 cup shelled", calories: 190, protein: 17, carbs: 14, fat: 8 },
];

const REST_DINNER: FoodItem[] = [
  { item: "Baked cod with herbs", portion: "200g", calories: 200, protein: 42, carbs: 0, fat: 2 },
  { item: "Roasted Brussels sprouts", portion: "1.5 cups", calories: 80, protein: 4, carbs: 14, fat: 2 },
  { item: "Cauliflower mash", portion: "1 cup", calories: 80, protein: 3, carbs: 10, fat: 4 },
  { item: "Grilled shrimp", portion: "200g", calories: 200, protein: 40, carbs: 0, fat: 3 },
  { item: "Zucchini noodles with pesto", portion: "2 cups", calories: 180, protein: 5, carbs: 10, fat: 14 },
  { item: "Sauteed kale with garlic", portion: "2 cups", calories: 70, protein: 4, carbs: 8, fat: 3 },
  { item: "Bone broth", portion: "1 cup", calories: 40, protein: 8, carbs: 1, fat: 1 },
];

const ANTI_INFLAMMATORY_ADDITIONS: FoodItem[] = [
  { item: "Turmeric golden milk", portion: "1 cup", calories: 70, protein: 2, carbs: 8, fat: 3 },
  { item: "Tart cherry juice", portion: "250ml", calories: 120, protein: 1, carbs: 28, fat: 0 },
  { item: "Wild blueberries", portion: "1 cup", calories: 80, protein: 1, carbs: 20, fat: 0 },
  { item: "Ginger tea with honey", portion: "1 cup", calories: 30, protein: 0, carbs: 8, fat: 0 },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function pick<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function sumField(foods: FoodItem[], field: keyof Omit<FoodItem, "item" | "portion">): number {
  return foods.reduce((s, f) => s + f[field], 0);
}

interface Meal {
  name: string;
  time: string;
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

function buildMeal(name: string, time: string, foods: FoodItem[]): Meal {
  return {
    name,
    time,
    foods,
    totalCalories: sumField(foods, "calories"),
    totalProtein: sumField(foods, "protein"),
    totalCarbs: sumField(foods, "carbs"),
    totalFat: sumField(foods, "fat"),
  };
}

function generateTrainingDayPlan(recoveryScore: number) {
  const totalCal = 2200 + Math.floor(Math.random() * 600); // 2200-2800
  const targetProtein = Math.round((totalCal * 0.25) / 4);
  const targetCarbs = Math.round((totalCal * 0.5) / 4);
  const targetFat = Math.round((totalCal * 0.25) / 9);

  let breakfastFoods = pick(TRAINING_BREAKFAST, 3);
  let lunchFoods = pick(TRAINING_LUNCH, 3);
  let snackFoods = pick(TRAINING_SNACK, 2);
  let dinnerFoods = pick(TRAINING_DINNER, 3);

  // If low recovery, swap one snack for anti-inflammatory item
  if (recoveryScore < 50) {
    const antiItem = pick(ANTI_INFLAMMATORY_ADDITIONS, 1);
    snackFoods = [snackFoods[0], ...antiItem];
  }

  const meals: Meal[] = [
    buildMeal("Power Breakfast", "7:00 AM", breakfastFoods),
    buildMeal("Performance Lunch", "12:00 PM", lunchFoods),
    buildMeal("Pre-Workout Fuel", "3:30 PM", snackFoods),
    buildMeal("Recovery Dinner", "7:00 PM", dinnerFoods),
  ];

  let notes = "Training day — higher carb intake for energy. Focus on pre-workout fueling.";
  if (recoveryScore < 50) {
    notes = "Training day with low recovery — added anti-inflammatory foods. Prioritize hydration and sleep tonight.";
  }

  const hydration = recoveryScore < 50
    ? "Aim for 3.5L+ of water today. Add electrolytes before and after training. Consider tart cherry juice for inflammation."
    : "Aim for 3L+ of water today. Add electrolytes if training > 60 min.";

  return { trainingDay: true, targetCalories: totalCal, targetProtein, targetCarbs, targetFat, meals, notes, hydration };
}

function generateRestDayPlan(recoveryScore: number) {
  const totalCal = 1800 + Math.floor(Math.random() * 400); // 1800-2200
  const targetProtein = Math.round((totalCal * 0.35) / 4);
  const targetCarbs = Math.round((totalCal * 0.4) / 4);
  const targetFat = Math.round((totalCal * 0.25) / 9);

  let breakfastFoods = pick(REST_BREAKFAST, 3);
  let lunchFoods = pick(REST_LUNCH, 3);
  let snackFoods = pick(REST_SNACK, 2);
  let dinnerFoods = pick(REST_DINNER, 3);

  // If low recovery, add anti-inflammatory item to breakfast
  if (recoveryScore < 50) {
    const antiItem = pick(ANTI_INFLAMMATORY_ADDITIONS, 1);
    breakfastFoods = [...breakfastFoods.slice(0, 2), ...antiItem];
  }

  const meals: Meal[] = [
    buildMeal("Nourish Breakfast", "8:00 AM", breakfastFoods),
    buildMeal("Recovery Lunch", "12:30 PM", lunchFoods),
    buildMeal("Afternoon Snack", "3:00 PM", snackFoods),
    buildMeal("Light Dinner", "6:30 PM", dinnerFoods),
  ];

  let notes = "Rest day — higher protein to support muscle repair. Keep carbs moderate.";
  if (recoveryScore < 50) {
    notes = "Rest day with very low recovery — prioritizing anti-inflammatory nutrition and extra protein for repair.";
  }

  const hydration = recoveryScore < 50
    ? "Aim for 3L+ of water. Add lemon and a pinch of sea salt for electrolytes. Rest and hydrate."
    : "Aim for 2.5L of water today. Herbal teas count toward your goal.";

  return { trainingDay: false, targetCalories: totalCal, targetProtein, targetCarbs, targetFat, meals, notes, hydration };
}

/* ------------------------------------------------------------------ */
/*  GET Handler                                                        */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dateParam = request.nextUrl.searchParams.get("date");
  const dateStr = dateParam ?? new Date().toISOString().split("T")[0];
  const targetDate = new Date(dateStr + "T00:00:00.000Z");

  // Check if a plan already exists
  let existing;
  try {
    existing = await prisma.mealPlan.findUnique({
      where: { userId_date: { userId: session.user.id, date: targetDate } },
    });
  } catch {
    existing = null;
  }

  if (existing) {
    return NextResponse.json({
      date: dateStr,
      trainingDay: existing.trainingDay,
      targetCalories: existing.targetCalories,
      targetProtein: existing.targetProtein,
      targetCarbs: existing.targetCarbs,
      targetFat: existing.targetFat,
      meals: JSON.parse(existing.meals),
      notes: existing.notes,
      hydration: (existing as Record<string, unknown>).hydration ?? "Aim for 2.5-3L of water today.",
    });
  }

  // Fetch today's health session to determine training vs rest
  let healthSession;
  try {
    healthSession = await prisma.healthSession.findFirst({
      where: { userId: session.user.id, date: { gte: targetDate, lt: new Date(targetDate.getTime() + 86400000) } },
    });
  } catch {
    healthSession = null;
  }

  const recoveryScore = healthSession?.recoveryScore ?? 70;
  const borgRpe = healthSession?.borgRpe ?? 0;
  const activityMins = healthSession?.activityMins ?? 0;

  // Determine training day: has strain data or moderate+ activity
  const isTrainingDay = borgRpe >= 4 || activityMins >= 30;

  // Generate plan
  const plan = isTrainingDay
    ? generateTrainingDayPlan(recoveryScore)
    : generateRestDayPlan(recoveryScore);

  // Save to database
  try {
    await prisma.mealPlan.create({
      data: {
        userId: session.user.id,
        date: targetDate,
        trainingDay: plan.trainingDay,
        targetCalories: plan.targetCalories,
        targetProtein: plan.targetProtein,
        targetCarbs: plan.targetCarbs,
        targetFat: plan.targetFat,
        meals: JSON.stringify(plan.meals),
        notes: plan.notes + "\n\nHydration: " + plan.hydration,
      },
    });
  } catch {
    // Already exists or DB error — continue with generated plan
  }

  return NextResponse.json({
    date: dateStr,
    trainingDay: plan.trainingDay,
    targetCalories: plan.targetCalories,
    targetProtein: plan.targetProtein,
    targetCarbs: plan.targetCarbs,
    targetFat: plan.targetFat,
    meals: plan.meals,
    notes: plan.notes,
    hydration: plan.hydration,
  });
}

/* ------------------------------------------------------------------ */
/*  POST Handler                                                       */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { date, trainingDay, targetCalories, targetProtein, targetCarbs, targetFat, meals, notes, hydration } = body;

  if (!date || !meals) {
    return NextResponse.json({ error: "Missing required fields: date, meals" }, { status: 400 });
  }

  const targetDate = new Date(date + "T00:00:00.000Z");
  const notesWithHydration = hydration ? `${notes ?? ""}\n\nHydration: ${hydration}` : (notes ?? "");

  const saved = await prisma.mealPlan.upsert({
    where: { userId_date: { userId: session.user.id, date: targetDate } },
    update: {
      trainingDay: trainingDay ?? true,
      targetCalories: targetCalories ?? 2000,
      targetProtein: targetProtein ?? 150,
      targetCarbs: targetCarbs ?? 250,
      targetFat: targetFat ?? 65,
      meals: JSON.stringify(meals),
      notes: notesWithHydration,
    },
    create: {
      userId: session.user.id,
      date: targetDate,
      trainingDay: trainingDay ?? true,
      targetCalories: targetCalories ?? 2000,
      targetProtein: targetProtein ?? 150,
      targetCarbs: targetCarbs ?? 250,
      targetFat: targetFat ?? 65,
      meals: JSON.stringify(meals),
      notes: notesWithHydration,
    },
  });

  return NextResponse.json({
    id: saved.id,
    date,
    trainingDay: saved.trainingDay,
    targetCalories: saved.targetCalories,
    targetProtein: saved.targetProtein,
    targetCarbs: saved.targetCarbs,
    targetFat: saved.targetFat,
    meals: JSON.parse(saved.meals),
    notes: notes ?? "",
    hydration: hydration ?? "",
  });
}

/* ------------------------------------------------------------------ */
/*  DELETE Handler (for regeneration)                                   */
/* ------------------------------------------------------------------ */

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dateParam = request.nextUrl.searchParams.get("date");
  if (!dateParam) {
    return NextResponse.json({ error: "Missing date param" }, { status: 400 });
  }

  const targetDate = new Date(dateParam + "T00:00:00.000Z");

  await prisma.mealPlan.deleteMany({
    where: { userId: session.user.id, date: targetDate },
  });

  return NextResponse.json({ deleted: true, date: dateParam });
}
