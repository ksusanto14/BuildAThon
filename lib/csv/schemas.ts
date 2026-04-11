import { z } from "zod/v4";

// All RITE health data fields a CSV can contain
export const RITE_FIELDS = [
  { key: "date", label: "Date", required: true },
  { key: "sleepHours", label: "Sleep Hours" },
  { key: "sleepEfficiency", label: "Sleep Efficiency (%)" },
  { key: "sleepConsistency", label: "Sleep Consistency (%)" },
  { key: "sleepStress", label: "Sleep Stress (0-100)" },
  { key: "deepSleepHrs", label: "Deep Sleep (hrs)" },
  { key: "remSleepHrs", label: "REM Sleep (hrs)" },
  { key: "lightSleepHrs", label: "Light Sleep (hrs)" },
  { key: "awakeHrs", label: "Awake (hrs)" },
  { key: "hrv", label: "HRV (ms)" },
  { key: "restingHr", label: "Resting HR (bpm)" },
  { key: "respiratoryRate", label: "Respiratory Rate" },
  { key: "recoveryScore", label: "Recovery Score (0-100)" },
  { key: "borgRpe", label: "Borg RPE (6-20)" },
  { key: "hrZone1Mins", label: "HR Zone 1 (mins)" },
  { key: "hrZone2Mins", label: "HR Zone 2 (mins)" },
  { key: "hrZone3Mins", label: "HR Zone 3 (mins)" },
  { key: "hrZone4Mins", label: "HR Zone 4 (mins)" },
  { key: "hrZone5Mins", label: "HR Zone 5 (mins)" },
  { key: "activityMins", label: "Activity (mins)" },
  { key: "steps", label: "Steps" },
] as const;

export type RiteFieldKey = (typeof RITE_FIELDS)[number]["key"];

// Zod schema for a single row of health data
export const healthDataRowSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  sleepHours: z.coerce.number().min(0).max(24).optional(),
  sleepEfficiency: z.coerce.number().min(0).max(100).optional(),
  sleepConsistency: z.coerce.number().min(0).max(100).optional(),
  sleepStress: z.coerce.number().min(0).max(100).optional(),
  deepSleepHrs: z.coerce.number().min(0).max(24).optional(),
  remSleepHrs: z.coerce.number().min(0).max(24).optional(),
  lightSleepHrs: z.coerce.number().min(0).max(24).optional(),
  awakeHrs: z.coerce.number().min(0).max(24).optional(),
  hrv: z.coerce.number().min(0).max(300).optional(),
  restingHr: z.coerce.number().min(20).max(120).optional(),
  respiratoryRate: z.coerce.number().min(5).max(40).optional(),
  recoveryScore: z.coerce.number().min(0).max(100).optional(),
  borgRpe: z.coerce.number().min(6).max(20).optional(),
  hrZone1Mins: z.coerce.number().min(0).max(1440).optional(),
  hrZone2Mins: z.coerce.number().min(0).max(1440).optional(),
  hrZone3Mins: z.coerce.number().min(0).max(1440).optional(),
  hrZone4Mins: z.coerce.number().min(0).max(1440).optional(),
  hrZone5Mins: z.coerce.number().min(0).max(1440).optional(),
  activityMins: z.coerce.number().min(0).max(1440).optional(),
  steps: z.coerce.number().int().min(0).max(100000).optional(),
});

export type HealthDataRow = z.infer<typeof healthDataRowSchema>;

// Cross-field validation: sleep stages should roughly sum to total sleep
export function validateSleepStages(row: HealthDataRow): string | null {
  if (row.sleepHours == null) return null;
  const deep = row.deepSleepHrs ?? 0;
  const rem = row.remSleepHrs ?? 0;
  const light = row.lightSleepHrs ?? 0;
  const awake = row.awakeHrs ?? 0;
  const stageSum = deep + rem + light + awake;
  if (stageSum > 0 && Math.abs(stageSum - row.sleepHours) > 0.5) {
    return `Sleep stages sum (${stageSum.toFixed(1)}h) differs from total sleep (${row.sleepHours}h) by more than 0.5h`;
  }
  return null;
}

// Fuzzy match CSV header to RITE field
const HEADER_ALIASES: Record<string, RiteFieldKey> = {
  date: "date",
  day: "date",
  "sleep hours": "sleepHours",
  "sleep_hours": "sleepHours",
  "total sleep": "sleepHours",
  "sleep efficiency": "sleepEfficiency",
  "sleep_efficiency": "sleepEfficiency",
  "efficiency": "sleepEfficiency",
  "sleep consistency": "sleepConsistency",
  "sleep_consistency": "sleepConsistency",
  "consistency": "sleepConsistency",
  "sleep stress": "sleepStress",
  "sleep_stress": "sleepStress",
  "deep sleep": "deepSleepHrs",
  "deep_sleep": "deepSleepHrs",
  "deep sleep hrs": "deepSleepHrs",
  "rem sleep": "remSleepHrs",
  "rem_sleep": "remSleepHrs",
  "rem": "remSleepHrs",
  "light sleep": "lightSleepHrs",
  "light_sleep": "lightSleepHrs",
  "awake": "awakeHrs",
  "awake hrs": "awakeHrs",
  hrv: "hrv",
  "heart rate variability": "hrv",
  "resting hr": "restingHr",
  "resting_hr": "restingHr",
  "resting heart rate": "restingHr",
  rhr: "restingHr",
  "respiratory rate": "respiratoryRate",
  "respiratory_rate": "respiratoryRate",
  "resp rate": "respiratoryRate",
  "recovery score": "recoveryScore",
  "recovery_score": "recoveryScore",
  recovery: "recoveryScore",
  "borg rpe": "borgRpe",
  "borg_rpe": "borgRpe",
  rpe: "borgRpe",
  "hr zone 1": "hrZone1Mins",
  "hr_zone_1": "hrZone1Mins",
  "zone 1": "hrZone1Mins",
  "hr zone 2": "hrZone2Mins",
  "hr_zone_2": "hrZone2Mins",
  "zone 2": "hrZone2Mins",
  "hr zone 3": "hrZone3Mins",
  "hr_zone_3": "hrZone3Mins",
  "zone 3": "hrZone3Mins",
  "hr zone 4": "hrZone4Mins",
  "hr_zone_4": "hrZone4Mins",
  "zone 4": "hrZone4Mins",
  "hr zone 5": "hrZone5Mins",
  "hr_zone_5": "hrZone5Mins",
  "zone 5": "hrZone5Mins",
  "activity mins": "activityMins",
  "activity_mins": "activityMins",
  "activity minutes": "activityMins",
  steps: "steps",
  "step count": "steps",
};

export function autoMapHeader(header: string): RiteFieldKey | null {
  const normalized = header.toLowerCase().trim();
  // Direct match
  if (normalized in HEADER_ALIASES) return HEADER_ALIASES[normalized];
  // Check if header contains a known alias
  for (const [alias, field] of Object.entries(HEADER_ALIASES)) {
    if (normalized.includes(alias) || alias.includes(normalized)) return field;
  }
  // camelCase match against field keys
  const fieldMatch = RITE_FIELDS.find(
    (f) => f.key.toLowerCase() === normalized.replace(/[_\s]/g, "")
  );
  return fieldMatch?.key ?? null;
}

export type ValidationError = {
  row: number;
  field: string;
  value: string;
  message: string;
};

export function validateRows(
  rows: Record<string, string>[],
  columnMap: Record<string, RiteFieldKey | "__ignore__">
): { validRows: HealthDataRow[]; errors: ValidationError[] } {
  const validRows: HealthDataRow[] = [];
  const errors: ValidationError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const mapped: Record<string, unknown> = {};

    for (const [csvCol, riteField] of Object.entries(columnMap)) {
      if (riteField === "__ignore__" || !raw[csvCol]) continue;
      const value = raw[csvCol].trim();
      if (value === "") continue;
      mapped[riteField] = value;
    }

    if (!mapped.date) {
      errors.push({
        row: i + 1,
        field: "date",
        value: "",
        message: "Date is required",
      });
      continue;
    }

    const result = healthDataRowSchema.safeParse(mapped);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          row: i + 1,
          field: String(issue.path[0] ?? "unknown"),
          value: String(mapped[String(issue.path[0])] ?? ""),
          message: issue.message,
        });
      }
      continue;
    }

    // Cross-field validation
    const stageError = validateSleepStages(result.data);
    if (stageError) {
      errors.push({
        row: i + 1,
        field: "sleepHours",
        value: String(result.data.sleepHours),
        message: stageError,
      });
      continue;
    }

    validRows.push(result.data);
  }

  return { validRows, errors };
}
