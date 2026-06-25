import { API_URL, apiClient } from "@/lib/api-client";
import axios from "axios";

// Create a public axios instance for unauthenticated requests
const publicClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface Invitation {
  _id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
  invitedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  invitedByRole: string;
  status: "pending" | "accepted" | "expired" | "cancelled";
  metadata?: {
    department?: {
      _id: string;
      name: string;
      code: string;
    };
    faculty?: {
      _id: string;
      name: string;
      code: string;
    };
    matricNumber?: string;
    level?: number;
    session?: string;
  };
  resendCount: number;
  lastResentAt?: string;
  acceptedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvitationData {
  email: string;
  role: string;
  metadata?: {
    department?: string;
    faculty?: string;
    matricNumber?: string;
    level?: number;
    session?: string;
  };
}

export interface CompleteSetupData {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
  phone?: string;
  matricNumber?: string;
  level?: number;
  session?: string;
  specialization?: string;
}

export interface InvitationStats {
  total: number;
  pending: number;
  accepted: number;
  expired: number;
  cancelled: number;
}

const baseUrl = "/invitations";

const createInvitation = async (data: CreateInvitationData) => {
  try {
    const response = await apiClient.post(baseUrl, data);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

const getInvitations = async (filters?: {
  status?: string;
  role?: string;
  email?: string;
}) => {
  const response = await apiClient.get(baseUrl, { params: filters });
  return response.data;
};

const getInvitationById = async (id: string) => {
  const response = await apiClient.get(`${baseUrl}/${id}`);
  return response.data;
};

const verifyToken = async (token: string) => {
  const response = await publicClient.get(`${baseUrl}/verify/${token}`);
  return response.data;
};

const completeSetup = async (data: CompleteSetupData) => {
  const response = await publicClient.post(`${baseUrl}/complete-setup`, data);
  return response.data;
};

const resendInvitation = async (id: string) => {
  const response = await apiClient.post(`${baseUrl}/${id}/resend`);
  return response.data;
};

const cancelInvitation = async (id: string) => {
  const response = await apiClient.delete(`${baseUrl}/${id}`);
  return response.data;
};

const getStatistics = async () => {
  const response = await apiClient.get(`${baseUrl}/stats`);
  return response.data;
};

const cleanupExpired = async () => {
  const response = await apiClient.post(`${baseUrl}/cleanup`);
  return response.data;
};

export interface BulkInvitationRow {
  email: string;
  role: string;
  department?: string;
  matricNumber?: string;
  level?: number;
  session?: string;
  companyName?: string;
  companyAddress?: string;
  position?: string;
  yearsOfExperience?: number;
}

export interface BulkInvitationResult {
  total: number;
  succeeded: Array<{ email: string; role: string; id: string }>;
  failed: Array<{ row: number; email: string; role: string; error: string }>;
}

const bulkCreateInvitations = async (
  invitations: BulkInvitationRow[],
): Promise<BulkInvitationResult> => {
  const response = await apiClient.post(`${baseUrl}/bulk`, { invitations });
  return response.data.data;
};

export const invitationService = {
  createInvitation,
  getInvitations,
  getInvitationById,
  verifyToken,
  completeSetup,
  resendInvitation,
  cancelInvitation,
  getStatistics,
  cleanupExpired,
  bulkCreateInvitations,
};

export default invitationService;
