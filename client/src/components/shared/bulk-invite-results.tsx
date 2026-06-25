"use client";

import { AlertInline } from "@/components/design-system/alert-inline";

interface BulkInviteResultsProps {
  result: {
    total: number;
    succeeded: Array<{ email: string; role: string; id: string }>;
    failed: Array<{ row: number; email: string; role: string; error: string }>;
  };
}

export function BulkInviteResults({ result }: BulkInviteResultsProps) {
  return (
    <div className="space-y-4">
      <AlertInline
        tone={result.failed.length > 0 ? "warning" : "success"}
        message={
          `${result.succeeded.length} succeeded, ${result.failed.length} failed out of ${result.total} total.`
        }
      />

      {result.succeeded.length > 0 ? (
        <div>
          <p className="text-sm font-medium mb-1 text-green-600">Succeeded:</p>
          <div className="max-h-32 overflow-y-auto border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Role</th>
                </tr>
              </thead>
              <tbody>
                {result.succeeded.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="p-2">{s.email}</td>
                    <td className="p-2">{s.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {result.failed.length > 0 ? (
        <div>
          <p className="text-sm font-medium mb-1 text-destructive">Failed:</p>
          <div className="max-h-32 overflow-y-auto border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="p-2 text-left w-8">#</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Error</th>
                </tr>
              </thead>
              <tbody>
                {result.failed.map((f) => (
                  <tr key={f.row} className="border-t">
                    <td className="p-2 text-muted-foreground">{f.row}</td>
                    <td className="p-2">{f.email}</td>
                    <td className="p-2 text-destructive text-xs">{f.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
