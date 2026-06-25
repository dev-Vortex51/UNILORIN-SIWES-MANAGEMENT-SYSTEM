"use client";

import { useCallback, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, FileText } from "lucide-react";
import Papa from "papaparse";
import { BulkInvitePreviewTable } from "./bulk-invite-preview-table";
import { BulkInviteResults } from "./bulk-invite-results";
import type { BulkInvitationRow } from "@/services/invitation.service";

interface ParsedRow {
  row: number;
  email: string;
  role: string;
  department?: string;
  matricNumber?: string;
  level?: string;
  session?: string;
  companyName?: string;
  companyAddress?: string;
  position?: string;
  yearsOfExperience?: string;
  valid: boolean;
  errors: string[];
}

interface BulkInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleOptions: { label: string; value: string }[];
  onSubmit: (invitations: BulkInvitationRow[]) => Promise<{
    total: number;
    succeeded: Array<{ email: string; role: string; id: string }>;
    failed: Array<{ row: number; email: string; role: string; error: string }>;
  }>;
  isPending?: boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = [
  "student",
  "coordinator",
  "academic_supervisor",
  "industrial_supervisor",
  "faculty",
];

export function BulkInviteDialog({
  open,
  onOpenChange,
  roleOptions,
  onSubmit,
  isPending,
}: BulkInviteDialogProps) {
  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const [csvText, setCsvText] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [step, setStep] = useState<"input" | "preview" | "results">("input");
  const [result, setResult] = useState<{
    total: number;
    succeeded: Array<{ email: string; role: string; id: string }>;
    failed: Array<{ row: number; email: string; role: string; error: string }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setMode("upload");
    setCsvText("");
    setRows([]);
    setStep("input");
    setResult(null);
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const validateRow = (row: Record<string, string>, index: number): ParsedRow => {
    const errors: string[] = [];
    const email = (row.email || "").trim();
    const role = (row.role || "").trim().toLowerCase().replace(/\s+/g, "_");

    if (!email) {
      errors.push("Email is required");
    } else if (!EMAIL_REGEX.test(email)) {
      errors.push("Invalid email format");
    }

    if (!role) {
      errors.push("Role is required");
    } else if (!VALID_ROLES.includes(role)) {
      errors.push(`Invalid role: "${role}". Valid: ${VALID_ROLES.join(", ")}`);
    }

    return {
      row: index + 1,
      email,
      role,
      department: (row.department || "").trim(),
      matricNumber: (row.matricNumber || "").trim(),
      level: (row.level || "").trim(),
      session: (row.session || "").trim(),
      companyName: (row.companyName || "").trim(),
      companyAddress: (row.companyAddress || "").trim(),
      position: (row.position || "").trim(),
      yearsOfExperience: (row.yearsOfExperience || "").trim(),
      valid: errors.length === 0,
      errors,
    };
  };

  const parseCSV = useCallback((text: string) => {
    const result = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/[\s-]/g, ""),
    });

    if (result.errors.length > 0) {
      toast.error(`CSV parsing error: ${result.errors[0].message}`);
      return;
    }

    if (result.data.length === 0) {
      toast.error("CSV is empty or has no data rows");
      return;
    }

    const parsed = result.data.map((row, i) => validateRow(row, i));
    setRows(parsed);
    setStep("preview");
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const handlePasteParse = () => {
    if (!csvText.trim()) {
      toast.error("Paste CSV content first");
      return;
    }
    parseCSV(csvText);
  };

  const handleSubmit = async () => {
    const validRows = rows.filter((r) => r.valid);
    if (validRows.length === 0) {
      toast.error("No valid rows to submit");
      return;
    }

    const invitations: BulkInvitationRow[] = validRows.map((r) => ({
      email: r.email,
      role: r.role,
      ...(r.department ? { department: r.department } : {}),
      ...(r.matricNumber ? { matricNumber: r.matricNumber } : {}),
      ...(r.level ? { level: parseInt(r.level, 10) } : {}),
      ...(r.session ? { session: r.session } : {}),
      ...(r.companyName ? { companyName: r.companyName } : {}),
      ...(r.companyAddress ? { companyAddress: r.companyAddress } : {}),
      ...(r.position ? { position: r.position } : {}),
      ...(r.yearsOfExperience ? { yearsOfExperience: parseInt(r.yearsOfExperience, 10) } : {}),
    }));

    try {
      const res = await onSubmit(invitations);
      setResult(res);
      setStep("results");
      toast.success(`${res.succeeded.length} invitations sent`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Bulk invitation failed");
    }
  };

  const validCount = rows.filter((r) => r.valid).length;
  const csvExample = `email,role,department,level,session,companyName\nstudent1@example.com,student,dept-uuid,400,2026/2027,\nsupervisor1@example.com,industrial_supervisor,,,,Acme Corp`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Bulk Invite Users</DialogTitle>
          <DialogDescription>
            Upload a CSV file or paste CSV data to invite multiple users at once.
          </DialogDescription>
        </DialogHeader>

        {step === "input" ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={mode === "upload" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("upload")}
              >
                <Upload className="h-4 w-4 mr-1" />
                Upload CSV
              </Button>
              <Button
                variant={mode === "paste" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("paste")}
              >
                <FileText className="h-4 w-4 mr-1" />
                Paste CSV
              </Button>
            </div>

            {mode === "upload" ? (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Click to select a CSV file</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Columns: email, role, department (optional), and more
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFile}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="csv-paste">Paste CSV content</Label>
                <Textarea
                  id="csv-paste"
                  placeholder={csvExample}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
                <Button variant="secondary" size="sm" onClick={handlePasteParse}>
                  Preview
                </Button>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Required columns: <code className="bg-muted px-1 rounded">email</code>, <code className="bg-muted px-1 rounded">role</code></p>
              <p className="font-medium mb-1">Optional columns: <code className="bg-muted px-1 rounded">department</code>, <code className="bg-muted px-1 rounded">matricNumber</code>, <code className="bg-muted px-1 rounded">level</code>, <code className="bg-muted px-1 rounded">session</code>, <code className="bg-muted px-1 rounded">companyName</code>, <code className="bg-muted px-1 rounded">companyAddress</code>, <code className="bg-muted px-1 rounded">position</code>, <code className="bg-muted px-1 rounded">yearsOfExperience</code></p>
            </div>

            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Available roles:</p>
              <div className="flex flex-wrap gap-1">
                {roleOptions.map((r) => (
                  <span key={r.value} className="inline-block bg-muted px-2 py-0.5 rounded text-xs">
                    {r.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {step === "preview" ? (
          <BulkInvitePreviewTable rows={rows} onBack={() => setStep("input")} />
        ) : null}

        {step === "results" && result ? (
          <BulkInviteResults result={result} />
        ) : null}

        <DialogFooter>
          {step === "preview" ? (
            <>
              <Button variant="outline" onClick={() => setStep("input")}>Back</Button>
              <Button onClick={handleSubmit} disabled={isPending || validCount === 0}>
                {isPending ? "Sending..." : `Send ${validCount} Invitation${validCount !== 1 ? "s" : ""}`}
              </Button>
            </>
          ) : step === "results" ? (
            <Button onClick={handleClose}>Done</Button>
          ) : (
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
