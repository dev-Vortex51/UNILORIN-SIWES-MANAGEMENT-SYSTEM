export interface AssessmentScore {
  technical: number;
  communication: number;
  punctuality: number;
  initiative: number;
  teamwork: number;
  professionalism?: number;
  problemSolving?: number;
  adaptability?: number;
}

export interface Assessment {
  id: string;
  studentId: string;
  type: "industrial" | "departmental" | "final";
  status: "pending" | "submitted" | "completed";
  technical: number;
  communication: number;
  punctuality: number;
  initiative: number;
  teamwork: number;
  professionalism?: number;
  problemSolving?: number;
  adaptability?: number;
  grade?: string;
  recommendation?: string;
  strengths?: string;
  areasForImprovement?: string;
  comment?: string;
  createdAt: string;
  student?: {
    id: string;
    matricNumber: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface StudentOption {
  id: string;
  matricNumber: string;
  user: {
    firstName: string;
    lastName: string;
  };
}
