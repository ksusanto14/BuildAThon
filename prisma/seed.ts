import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate physiologically realistic correlated data
function generateDayData(dayOffset: number, userProfile: { baseHrv: number; baseRhr: number; baseSleep: number }) {
  const isWeekend = dayOffset % 7 >= 5;
  const fatigueFactor = Math.sin(dayOffset / 7) * 0.15; // Weekly fatigue cycle

  // Sleep (correlated: weekends tend to be better)
  const sleepHours = Math.max(4, Math.min(10,
    userProfile.baseSleep + (isWeekend ? 0.5 : 0) + randomBetween(-1.5, 1.5) - fatigueFactor
  ));
  const sleepEfficiency = Math.max(60, Math.min(99,
    85 + (sleepHours > 7 ? 5 : -5) + randomBetween(-8, 8)
  ));
  const deepSleepHrs = Math.max(0.5, sleepHours * randomBetween(0.15, 0.25));
  const remSleepHrs = Math.max(0.5, sleepHours * randomBetween(0.18, 0.28));
  const lightSleepHrs = Math.max(0.5, sleepHours - deepSleepHrs - remSleepHrs - randomBetween(0.1, 0.5));
  const awakeHrs = Math.max(0, sleepHours - deepSleepHrs - remSleepHrs - lightSleepHrs);
  const sleepConsistency = Math.max(50, Math.min(100, 80 + randomBetween(-15, 15)));
  const sleepStress = Math.max(0, Math.min(100, 30 + randomBetween(-20, 40) + fatigueFactor * 100));

  // Recovery (correlated with sleep)
  const sleepQualityFactor = (sleepHours - 6) / 4; // 0-1 scale
  const hrv = Math.max(20, Math.min(150,
    userProfile.baseHrv + sleepQualityFactor * 15 + randomBetween(-12, 12) - fatigueFactor * 20
  ));
  const restingHr = Math.max(40, Math.min(80,
    userProfile.baseRhr - sleepQualityFactor * 4 + randomBetween(-3, 3) + fatigueFactor * 5
  ));
  const respiratoryRate = Math.max(12, Math.min(20, 14.5 + randomBetween(-1.5, 1.5)));
  const recoveryScore = Math.max(0, Math.min(100,
    (hrv / userProfile.baseHrv) * 50 + sleepQualityFactor * 30 + randomBetween(-10, 10)
  ));

  // Strain (inversely correlated with recovery on high strain days)
  const isRestDay = recoveryScore < 40 || (isWeekend && Math.random() > 0.5);
  const borgRpe = isRestDay
    ? randomBetween(6, 10)
    : randomBetween(10, 18);
  const totalActivityMins = isRestDay ? randomInt(10, 30) : randomInt(30, 90);
  const hrZone1Mins = totalActivityMins * randomBetween(0.2, 0.4);
  const hrZone2Mins = totalActivityMins * randomBetween(0.15, 0.3);
  const hrZone3Mins = totalActivityMins * randomBetween(0.1, 0.25);
  const hrZone4Mins = isRestDay ? 0 : totalActivityMins * randomBetween(0.05, 0.15);
  const hrZone5Mins = isRestDay ? 0 : totalActivityMins * randomBetween(0, 0.08);
  const steps = randomInt(isRestDay ? 3000 : 6000, isRestDay ? 8000 : 15000);

  return {
    sleepHours: Math.round(sleepHours * 10) / 10,
    sleepEfficiency: Math.round(sleepEfficiency * 10) / 10,
    sleepConsistency: Math.round(sleepConsistency * 10) / 10,
    sleepStress: Math.round(sleepStress * 10) / 10,
    deepSleepHrs: Math.round(deepSleepHrs * 100) / 100,
    remSleepHrs: Math.round(remSleepHrs * 100) / 100,
    lightSleepHrs: Math.round(lightSleepHrs * 100) / 100,
    awakeHrs: Math.round(awakeHrs * 100) / 100,
    hrv: Math.round(hrv * 10) / 10,
    restingHr: Math.round(restingHr * 10) / 10,
    respiratoryRate: Math.round(respiratoryRate * 10) / 10,
    recoveryScore: Math.round(recoveryScore * 10) / 10,
    borgRpe: Math.round(borgRpe * 10) / 10,
    hrZone1Mins: Math.round(hrZone1Mins),
    hrZone2Mins: Math.round(hrZone2Mins),
    hrZone3Mins: Math.round(hrZone3Mins),
    hrZone4Mins: Math.round(hrZone4Mins),
    hrZone5Mins: Math.round(hrZone5Mins),
    activityMins: totalActivityMins,
    steps,
  };
}

const mealTypes = ["Fasted", "Light", "Medium", "Heavy"];
const musicGenres = ["None", "Lo-fi", "Hip-hop", "Rock", "EDM", "Classical", "Podcast"];
const timesOfDay = ["Morning", "Midday", "Afternoon", "Evening"];

async function main() {
  console.log("Seeding RITE database...");

  // Clear existing data
  await prisma.notification.deleteMany();
  await prisma.dataImport.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.userGoal.deleteMany();
  await prisma.trainingPlan.deleteMany();
  await prisma.performanceFormula.deleteMany();
  await prisma.wearableConnection.deleteMany();
  await prisma.contextLog.deleteMany();
  await prisma.healthSession.deleteMany();
  await prisma.user.deleteMany();

  // Create 3 test users
  const users = [
    {
      name: "Alex Runner",
      email: "athlete@rite.demo",
      password: "demo1234",
      role: "ATHLETE",
      sportType: "Running",
      timezone: "America/New_York",
      onboardingComplete: true,
      profile: { baseHrv: 65, baseRhr: 55, baseSleep: 7.5 },
    },
    {
      name: "Jordan Cross",
      email: "jordan@rite.demo",
      password: "demo1234",
      role: "ATHLETE",
      sportType: "CrossFit",
      timezone: "America/Chicago",
      onboardingComplete: true,
      profile: { baseHrv: 55, baseRhr: 60, baseSleep: 7.0 },
    },
    {
      name: "Sam Coach",
      email: "coach@rite.demo",
      password: "demo1234",
      role: "COACH",
      sportType: "General Fitness",
      timezone: "America/Los_Angeles",
      onboardingComplete: true,
      profile: { baseHrv: 70, baseRhr: 52, baseSleep: 8.0 },
    },
  ];

  for (const userData of users) {
    const { profile, ...userFields } = userData;

    const user = await prisma.user.create({ data: userFields });
    console.log(`  Created user: ${user.name} (${user.email})`);

    // Generate 90 days of health data
    const today = new Date();
    const healthSessions = [];
    const contextLogs = [];

    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dayData = generateDayData(i, profile);

      healthSessions.push({
        userId: user.id,
        date,
        ...dayData,
      });

      // Context logs for ~60% of days
      if (Math.random() > 0.4) {
        contextLogs.push({
          userId: user.id,
          date,
          mealType: mealTypes[randomInt(0, mealTypes.length - 1)],
          musicGenre: musicGenres[randomInt(0, musicGenres.length - 1)],
          moodScore: randomInt(4, 9),
          stressLevel: randomInt(2, 8),
          timeOfDay: timesOfDay[randomInt(0, timesOfDay.length - 1)],
          performanceRating: randomInt(5, 10),
        });
      }
    }

    await prisma.healthSession.createMany({ data: healthSessions });
    await prisma.contextLog.createMany({ data: contextLogs });

    console.log(`  → ${healthSessions.length} health sessions, ${contextLogs.length} context logs`);

    // Create some goals
    await prisma.userGoal.createMany({
      data: [
        { userId: user.id, metric: "sleep_hours", targetValue: 8.0, progress: 75 },
        { userId: user.id, metric: "sleep_consistency", targetValue: 90, progress: 85 },
        { userId: user.id, metric: "weekly_strain", targetValue: 14, progress: 68 },
      ],
    });

    // Create a welcome notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "FORMULA_UPDATE",
        title: "Welcome to RITE!",
        body: "Import your health data or connect a wearable to get started.",
        status: "unread",
      },
    });
  }

  console.log("\nSeed complete!");
  console.log("Demo login: athlete@rite.demo / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
