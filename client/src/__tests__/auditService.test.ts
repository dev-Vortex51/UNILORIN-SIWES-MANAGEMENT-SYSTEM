import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("auditService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gets audit logs with pagination", async () => {
    const { apiClient } = await import("@/lib/api-client");
    const mockResponse = { data: { success: true, data: [], pagination: { totalItems: 0 } } };
    (apiClient.get as any).mockResolvedValue(mockResponse);

    const { auditService } = await import("@/services/audit.service");
    const result = await auditService.getAuditLogs({ page: 1, limit: 50 });

    expect(apiClient.get).toHaveBeenCalledWith("/audit-logs", {
      params: { page: 1, limit: 50 },
    });
    expect(result.success).toBe(true);
  });

  it("filters audit logs by action", async () => {
    const { apiClient } = await import("@/lib/api-client");
    const mockResponse = { data: { success: true, data: [], pagination: { totalItems: 0 } } };
    (apiClient.get as any).mockResolvedValue(mockResponse);

    const { auditService } = await import("@/services/audit.service");
    await auditService.getAuditLogs({ action: "CREATE", entity: "Placement" });

    expect(apiClient.get).toHaveBeenCalledWith("/audit-logs", {
      params: { action: "CREATE", entity: "Placement" },
    });
  });
});
