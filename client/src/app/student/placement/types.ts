export interface PlacementFormData {
  companyName: string;
  companyAddress: string;
  companySector: string;
  companyEmail: string;
  companyPhone: string;
  position: string;
  startDate: string;
  endDate: string;
  workStartTime: string;
  workEndTime: string;
  supervisorName: string;
  supervisorEmail: string;
  supervisorPhone: string;
  supervisorPosition: string;
  acceptanceLetterFile?: File | null;
  acceptanceLetterName?: string;
  acceptanceLetterPath?: string;
  removeAcceptanceLetter?: boolean;
}

export type PlacementStatus = "approved" | "pending" | "rejected" | "withdrawn" | string;
