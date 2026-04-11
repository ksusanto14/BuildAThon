import { RITE_FIELDS } from "@/lib/csv/schemas";

export async function GET() {
  const headers = RITE_FIELDS.map((f) => f.key);
  const exampleRow = [
    "2026-01-15",
    "7.5",
    "92",
    "85",
    "25",
    "1.8",
    "2.0",
    "3.2",
    "0.5",
    "62",
    "56",
    "14.5",
    "74",
    "14",
    "15",
    "12",
    "10",
    "7",
    "3",
    "47",
    "8500",
  ];

  const csv = [headers.join(","), exampleRow.join(",")].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="rite-template.csv"',
    },
  });
}
