export interface Visit {
  id: string;
  studentId: string;
  supervisorId: string;
  visitDate: string;
  type: "physical" | "virtual";
  status: "scheduled" | "completed" | "cancelled";
  objective?: string;
  location?: string;
  feedback?: string;
  understandingScore?: number;
  relevanceScore?: number;
  industryFeedback?: number;
  professionalism?: number;
  completedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    matricNumber: string;
    departmentId?: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  supervisor: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  placement?: {
    id: string;
    companyName: string;
    status: string;
  } | null;
}

export interface StudentOption {
  id: string;
  matricNumber: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface VisitFormState {
  student: string;
  visitDate: string;
  type: "physical" | "virtual";
  objective: string;
  location: string;
}
