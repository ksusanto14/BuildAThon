"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import {
  Upload,
  FileDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Download,
  Loader2,
} from "lucide-react";
import {
  RITE_FIELDS,
  autoMapHeader,
  validateRows,
  type RiteFieldKey,
  type ValidationError,
  type HealthDataRow,
} from "@/lib/csv/schemas";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

type Step = "upload" | "map" | "preview" | "importing" | "done";

export default function ImportPage() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<
    Record<string, RiteFieldKey | "__ignore__">
  >({});
  const [validRows, setValidRows] = useState<HealthDataRow[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [validated, setValidated] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    overwritten: number;
    total: number;
  } | null>(null);
  const [importMode, setImportMode] = useState<"skip" | "overwrite">("skip");
  const [importing, setImporting] = useState(false);

  // Step 1: File Upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 10MB.");
      return;
    }
    setFile(f);

    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const headers = results.meta.fields ?? [];
        const rows = results.data as Record<string, string>[];
        setCsvHeaders(headers);
        setRawRows(rows);

        // Auto-map headers
        const autoMap: Record<string, RiteFieldKey | "__ignore__"> = {};
        for (const h of headers) {
          const match = autoMapHeader(h);
          autoMap[h] = match ?? "__ignore__";
        }
        setColumnMap(autoMap);
        setStep("map");
      },
      error(err) {
        toast.error(`CSV parse error: ${err.message}`);
      },
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
  });

  // Step 2: Column Mapping
  const dateIsMapped = Object.values(columnMap).includes("date");
  const usedFields = new Set(
    Object.values(columnMap).filter((v) => v !== "__ignore__")
  );

  function handleMapChange(csvCol: string, riteField: string) {
    setColumnMap((prev) => ({
      ...prev,
      [csvCol]: riteField as RiteFieldKey | "__ignore__",
    }));
    setValidated(false);
  }

  // Step 3: Validate
  function runValidation() {
    const result = validateRows(rawRows, columnMap);
    setValidRows(result.validRows);
    setErrors(result.errors);
    setValidated(true);
  }

  // Step 4: Import
  async function executeImport() {
    setImporting(true);
    setStep("importing");

    try {
      const res = await fetch("/api/import/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: validRows,
          mode: importMode,
          filename: file?.name,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Import failed");
      }

      const result = await res.json();
      setImportResult(result);
      setStep("done");
      toast.success(`Imported ${result.imported + result.overwritten} rows!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
      setStep("preview");
    } finally {
      setImporting(false);
    }
  }

  function downloadErrorReport() {
    const csv = [
      "row,field,value,message",
      ...errors.map(
        (e) =>
          `${e.row},"${e.field}","${e.value.replace(/"/g, '""')}","${e.message.replace(/"/g, '""')}"`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rite-import-errors.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setStep("upload");
    setFile(null);
    setRawRows([]);
    setCsvHeaders([]);
    setColumnMap({});
    setValidRows([]);
    setErrors([]);
    setValidated(false);
    setImportResult(null);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Upload className="w-6 h-6 text-primary" />
          Import Data
        </h1>
        <p className="text-muted-foreground text-sm">
          Upload CSV files to import your health data into RITE
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 text-sm">
        {(["upload", "map", "preview", "done"] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-px bg-border" />}
            <div
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium",
                step === s || (step === "importing" && s === "preview")
                  ? "bg-primary text-primary-foreground"
                  : ["upload", "map", "preview", "importing", "done"].indexOf(step) >
                    ["upload", "map", "preview", "importing", "done"].indexOf(s)
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {i + 1}. {s === "done" ? "Complete" : s.charAt(0).toUpperCase() + s.slice(1)}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Step 1: Upload ─── */}
      {step === "upload" && (
        <>
          <div
            {...getRootProps()}
            className={cn(
              "p-12 rounded-xl border-2 border-dashed bg-card text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold">
              {isDragActive
                ? "Drop your CSV here..."
                : "Drag & drop your CSV here"}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              or click to browse — accepts .csv up to 10MB
            </p>
          </div>

          <a
            href="/api/export/csv-template"
            download
            className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
          >
            <FileDown className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Download CSV Template</p>
              <p className="text-xs text-muted-foreground">
                Get a properly formatted template with all required headers
              </p>
            </div>
          </a>
        </>
      )}

      {/* ─── Step 2: Column Mapping ─── */}
      {step === "map" && (
        <>
          <div className="p-6 rounded-xl border border-border bg-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">
                Column Mapping — {file?.name}{" "}
                <span className="text-muted-foreground font-normal">
                  ({rawRows.length} rows)
                </span>
              </h2>
            </div>

            <div className="space-y-2">
              {csvHeaders.map((header) => (
                <div
                  key={header}
                  className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                >
                  <span className="text-sm font-mono w-48 truncate text-muted-foreground">
                    {header}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  <select
                    value={columnMap[header] ?? "__ignore__"}
                    onChange={(e) => handleMapChange(header, e.target.value)}
                    className={cn(
                      "flex-1 px-3 py-1.5 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring",
                      columnMap[header] === "__ignore__"
                        ? "border-border text-muted-foreground"
                        : "border-primary/30 text-foreground"
                    )}
                  >
                    <option value="__ignore__">— Ignore —</option>
                    {RITE_FIELDS.map((f) => (
                      <option
                        key={f.key}
                        value={f.key}
                        disabled={
                          usedFields.has(f.key) &&
                          columnMap[header] !== f.key
                        }
                      >
                        {f.label}
                        {"required" in f && f.required ? " *" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {!dateIsMapped && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Date column must be
                mapped to proceed
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={reset}
              className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent"
            >
              <ArrowLeft className="w-4 h-4 inline mr-1" />
              Back
            </button>
            <button
              onClick={() => {
                setStep("preview");
                runValidation();
              }}
              disabled={!dateIsMapped}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              Preview & Validate
              <ArrowRight className="w-4 h-4 inline ml-1" />
            </button>
          </div>
        </>
      )}

      {/* ─── Step 3: Preview & Validate ─── */}
      {step === "preview" && (
        <>
          {/* Validation Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card text-center">
              <p className="text-2xl font-bold">{rawRows.length}</p>
              <p className="text-xs text-muted-foreground">Total Rows</p>
            </div>
            <div className="p-4 rounded-xl border border-recovery/30 bg-recovery/5 text-center">
              <p className="text-2xl font-bold text-recovery">
                {validRows.length}
              </p>
              <p className="text-xs text-muted-foreground">Valid</p>
            </div>
            <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-center">
              <p className="text-2xl font-bold text-destructive">
                {errors.length}
              </p>
              <p className="text-xs text-muted-foreground">Errors</p>
            </div>
          </div>

          {/* Preview Table */}
          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                    #
                  </th>
                  {Object.entries(columnMap)
                    .filter(([, v]) => v !== "__ignore__")
                    .map(([, v]) => (
                      <th
                        key={v}
                        className="px-3 py-2 text-left text-xs font-medium text-muted-foreground"
                      >
                        {RITE_FIELDS.find((f) => f.key === v)?.label ?? v}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {rawRows.slice(0, 10).map((row, i) => {
                  const rowErrors = errors.filter((e) => e.row === i + 1);
                  const hasError = rowErrors.length > 0;
                  return (
                    <tr
                      key={i}
                      className={cn(
                        "border-b border-border last:border-0",
                        hasError && "bg-destructive/5"
                      )}
                    >
                      <td className="px-3 py-2 text-muted-foreground">
                        {i + 1}
                        {hasError && (
                          <XCircle className="w-3 h-3 text-destructive inline ml-1" />
                        )}
                      </td>
                      {Object.entries(columnMap)
                        .filter(([, v]) => v !== "__ignore__")
                        .map(([csvCol, riteField]) => {
                          const cellError = rowErrors.find(
                            (e) => e.field === riteField
                          );
                          return (
                            <td
                              key={csvCol}
                              className={cn(
                                "px-3 py-2",
                                cellError && "text-destructive font-medium"
                              )}
                              title={cellError?.message}
                            >
                              {row[csvCol] ?? ""}
                            </td>
                          );
                        })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rawRows.length > 10 && (
              <p className="text-xs text-muted-foreground text-center py-2 border-t border-border">
                Showing 10 of {rawRows.length} rows
              </p>
            )}
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-destructive">
                  {errors.length} validation error{errors.length !== 1 ? "s" : ""}
                </p>
                <button
                  onClick={downloadErrorReport}
                  className="text-xs text-destructive hover:underline flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Download Error Report
                </button>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {errors.slice(0, 10).map((e, i) => (
                  <p key={i} className="text-xs text-destructive/80">
                    Row {e.row}: {e.field} = &quot;{e.value}&quot; — {e.message}
                  </p>
                ))}
                {errors.length > 10 && (
                  <p className="text-xs text-muted-foreground">
                    ...and {errors.length - 10} more
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Import Mode */}
          {validRows.length > 0 && (
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <p className="text-sm font-medium">Duplicate Handling</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="mode"
                    value="skip"
                    checked={importMode === "skip"}
                    onChange={() => setImportMode("skip")}
                    className="accent-primary"
                  />
                  Skip existing dates
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="mode"
                    value="overwrite"
                    checked={importMode === "overwrite"}
                    onChange={() => setImportMode("overwrite")}
                    className="accent-primary"
                  />
                  Overwrite existing dates
                </label>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep("map")}
              className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent"
            >
              <ArrowLeft className="w-4 h-4 inline mr-1" />
              Back
            </button>
            <button
              onClick={executeImport}
              disabled={validRows.length === 0}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              Import {validRows.length} Valid Rows
              <ArrowRight className="w-4 h-4 inline ml-1" />
            </button>
          </div>
        </>
      )}

      {/* ─── Importing ─── */}
      {step === "importing" && (
        <div className="p-12 rounded-xl border border-border bg-card text-center">
          <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
          <h2 className="text-lg font-semibold">Importing...</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Processing {validRows.length} rows
          </p>
        </div>
      )}

      {/* ─── Done ─── */}
      {step === "done" && importResult && (
        <>
          <div className="p-12 rounded-xl border border-recovery/30 bg-recovery/5 text-center">
            <CheckCircle2 className="w-12 h-12 text-recovery mx-auto mb-4" />
            <h2 className="text-lg font-semibold">Import Complete!</h2>
            <div className="flex justify-center gap-6 mt-4 text-sm">
              <div>
                <p className="text-2xl font-bold">{importResult.imported}</p>
                <p className="text-muted-foreground">New rows</p>
              </div>
              {importResult.overwritten > 0 && (
                <div>
                  <p className="text-2xl font-bold">
                    {importResult.overwritten}
                  </p>
                  <p className="text-muted-foreground">Overwritten</p>
                </div>
              )}
              {importResult.skipped > 0 && (
                <div>
                  <p className="text-2xl font-bold">{importResult.skipped}</p>
                  <p className="text-muted-foreground">Skipped</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={reset}
              className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent"
            >
              Import Another File
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
