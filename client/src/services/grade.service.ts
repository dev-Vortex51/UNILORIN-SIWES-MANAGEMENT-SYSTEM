import { apiClient } from "@/lib/api-client";

export interface FinalGrade {
  id: string;
  studentId: string;
  placementId?: string;
  entryCompletion: number;
  industryReview: number;
  submissionConsistency: number;
  visitationEval: number;
  attendanceScore: number;
  technical: number;
  initiative: number;
  conduct: number;
  communication: number;
  defenseScore: number;
  totalScore: number;
  grade: string;
  isFinalized: boolean;
  finalizedById?: string;
  finalizedAt?: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    matricNumber: string;
    user: { firstName: string; lastName: string; email: string };
    department?: { name: string; code: string };
  };
  placement?: { companyName: string; startDate: string; endDate: string };
}

const BASE = "/grades";

export const gradeService = {
  getMyGrade: async () => {
    const res = await apiClient.get(`${BASE}/my-grade`);
    return res.data.data as FinalGrade | null;
  },

  getStudentGrade: async (studentId: string) => {
    const res = await apiClient.get(`${BASE}/${studentId}`);
    return res.data.data as FinalGrade;
  },

  getAllGrades: async (params?: { department?: string; grade?: string; isFinalized?: boolean }) => {
    const res = await apiClient.get(BASE, { params });
    return res.data.data as FinalGrade[];
  },

  recalculateGrade: async (studentId: string) => {
    const res = await apiClient.post(`${BASE}/recalculate/${studentId}`);
    return res.data.data as FinalGrade;
  },

  inputDefenseScore: async (studentId: string, defenseScore: number) => {
    const res = await apiClient.post(`${BASE}/defense/${studentId}`, { defenseScore });
    return res.data.data as FinalGrade;
  },

  finalizeGrade: async (studentId: string) => {
    const res = await apiClient.post(`${BASE}/finalize/${studentId}`);
    return res.data.data as FinalGrade;
  },

  exportCsv: async (params?: { department?: string; grade?: string }) => {
    const res = await apiClient.get(`${BASE}/export`, { params, responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "grades.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
