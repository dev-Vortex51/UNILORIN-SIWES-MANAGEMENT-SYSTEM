"use client";

import { AlertInline } from "@/components/design-system/alert-inline";
import { CheckCircle2, XCircle } from "lucide-react";

interface ParsedRow {
  row: number;
  email: string;
  role: string;
  valid: boolean;
  errors: string[];
}

interface BulkInvitePreviewTableProps {
  rows: ParsedRow[];
  onBack: () => void;
}

export function BulkInvitePreviewTable({ rows, onBack }: BulkInvitePreviewTableProps) {
  const validCount = rows.filter((r) => r.valid).length;
  const invalidCount = rows.filter((r) => !r.valid).length;

  return (
    <div className="space-y-4">
      <AlertInline
        tone={invalidCount > 0 ? "warning" : "success"}
        message={
          invalidCount > 0
            ? `${validCount} valid, ${invalidCount} invalid row(s). Fix the CSV and re-upload or proceed with valid rows only.`
            : `${validCount} valid row(s). Ready to send.`
        }
      />

      <div className="max-h-60 overflow-y-auto border rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-muted sticky top-0">
            <tr>
              <th className="p-2 text-left w-8">#</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Role</th>
              <th className="p-2 text-left w-10">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.row}
                className={`border-t ${!row.valid ? "bg-destructive/5" : ""}`}
              >
                <td className="p-2 text-muted-foreground">{row.row}</td>
                <td className="p-2">{row.email || <span className="text-muted-foreground italic">(missing)</span>}</td>
                <td className="p-2">{row.role || <span className="text-muted-foreground italic">(missing)</span>}</td>
                <td className="p-2">
                  {row.valid ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" title={row.errors.join("; ")} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.filter((r) => !r.valid).length > 0 ? (
        <div className="space-y-1">
          <p className="text-xs font-medium text-destructive">Errors:</p>
          {rows
            .filter((r) => !r.valid)
            .map((r) => (
              <p key={r.row} className="text-xs text-destructive">
                Row {r.row} ({r.email || "no email"}): {r.errors.join("; ")}
              </p>
            ))}
        </div>
      ) : null}
    </div>
  );
}
