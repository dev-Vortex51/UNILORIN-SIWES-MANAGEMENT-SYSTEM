import { apiClient } from "@/lib/api-client";

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditLogsResponse {
  success: boolean;
  message: string;
  data: AuditLog[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const auditService = {
  getAuditLogs: async (params?: {
    page?: number;
    limit?: number;
    action?: string;
    entity?: string;
    entityId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await apiClient.get("/audit-logs", { params });
    return response.data as AuditLogsResponse;
  },

  getAuditLogById: async (id: string) => {
    const response = await apiClient.get(`/audit-logs/${id}`);
    return response.data;
  },
};
