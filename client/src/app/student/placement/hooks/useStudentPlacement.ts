import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { studentService, placementService } from "@/services/student.service";
import { toast } from "sonner";
import type { PlacementFormData } from "../types";

const defaultFormData: PlacementFormData = {
  companyName: "",
  companyAddress: "",
  companySector: "",
  companyEmail: "",
  companyPhone: "",
  position: "",
  startDate: "",
  endDate: "",
  workStartTime: "08:00",
  workEndTime: "17:00",
  supervisorName: "",
  supervisorEmail: "",
  supervisorPhone: "",
  supervisorPosition: "",
  acceptanceLetterFile: null,
  acceptanceLetterName: "",
  acceptanceLetterPath: "",
  removeAcceptanceLetter: false,
};

export function useStudentPlacement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<PlacementFormData>(defaultFormData);

  const studentProfileId = user?.profileData?.id;

  const studentQuery = useQuery({
    queryKey: ["student", studentProfileId],
    queryFn: async () => {
      if (!studentProfileId) {
        throw new Error("Student profile not found");
      }
      return studentService.getStudentById(studentProfileId);
    },
    enabled: !!studentProfileId,
  });

  useEffect(() => {
    if (studentQuery.error) {
      toast.error("Failed to load student data. Please refresh.");
    }
  }, [studentQuery.error]);

  const student = studentQuery.data;

  const placementQuery = useQuery({
    queryKey: ["placement", student?.id],
    queryFn: () => studentService.getStudentPlacement(student!.id),
    enabled: !!student?.id,
    retry: false,
  });

  const placement = placementQuery.data;

  const invalidatePlacementQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["student", studentProfileId] });
    queryClient.invalidateQueries({ queryKey: ["placement"] });
    queryClient.refetchQueries({ queryKey: ["placement", student?.id] });
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => placementService.createPlacement(data),
    onSuccess: () => {
      invalidatePlacementQueries();
      setIsDialogOpen(false);
      setFormData(defaultFormData);
      toast.success("Placement submitted successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to submit placement");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => {
      if (!placement?.id) throw new Error("Placement not found");
      return placementService.updatePlacement(placement.id, data);
    },
    onSuccess: () => {
      invalidatePlacementQueries();
      setIsDialogOpen(false);
      toast.success("Placement updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update placement");
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: () => {
      if (!placement?.id) throw new Error("Placement not found");
      return placementService.withdrawPlacement(placement.id);
    },
    onSuccess: () => {
      invalidatePlacementQueries();
      toast.success("Placement withdrawn successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to withdraw placement");
    },
  });

  const openEditDialog = () => {
    if (!placement) return;
    setFormData({
      companyName: placement.companyName || "",
      companyAddress: placement.companyAddress || "",
      companySector: placement.companySector || "",
      companyEmail: placement.companyEmail || "",
      companyPhone: placement.companyPhone || "",
      position: placement.position || "",
      startDate: placement.startDate?.split("T")[0] || "",
      endDate: placement.endDate?.split("T")[0] || "",
      workStartTime: placement.workStartTime || "08:00",
      workEndTime: placement.workEndTime || "17:00",
      supervisorName: placement.supervisorName || "",
      supervisorEmail: placement.supervisorEmail || "",
      supervisorPhone: placement.supervisorPhone || "",
      supervisorPosition: placement.supervisorPosition || "",
      acceptanceLetterFile: null,
      acceptanceLetterName: placement.acceptanceLetter || "",
      acceptanceLetterPath: placement.acceptanceLetterPath || "",
      removeAcceptanceLetter: false,
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const buildPayload = (includeStudent = false) => {
    const payload = new FormData();
    if (includeStudent && student?.id) {
      payload.append("student", student.id);
    }
    payload.append("companyName", formData.companyName);
    payload.append("companyAddress", formData.companyAddress);
    payload.append("companySector", formData.companySector);
    payload.append("companyEmail", formData.companyEmail);
    payload.append("companyPhone", formData.companyPhone);
    payload.append("position", formData.position);
    payload.append("startDate", formData.startDate);
    payload.append("endDate", formData.endDate);
    payload.append("workStartTime", formData.workStartTime);
    payload.append("workEndTime", formData.workEndTime);
    payload.append("supervisorName", formData.supervisorName);
    payload.append("supervisorEmail", formData.supervisorEmail);
    payload.append("supervisorPhone", formData.supervisorPhone);
    payload.append("supervisorPosition", formData.supervisorPosition);
    if (formData.acceptanceLetterFile) {
      payload.append("acceptanceLetter", formData.acceptanceLetterFile);
    } else if (formData.removeAcceptanceLetter) {
      payload.append("removeAcceptanceLetter", "true");
    }
    return payload;
  };

  return {
    student,
    placement,
    isDialogOpen,
    setIsDialogOpen,
    formData,
    setFormData,
    openEditDialog,
    openNewDialog,
    createMutation,
    updateMutation,
    withdrawMutation,
    buildCreatePayload: () => {
      if (!student?.id) return null;
      return buildPayload(true);
    },
    buildUpdatePayload: () => buildPayload(false),
    isLoadingStudent: studentQuery.isLoading,
    isLoadingPlacement: placementQuery.isLoading,
    isErrorStudent: studentQuery.isError,
    isErrorPlacement: placementQuery.isError,
    refetchStudent: studentQuery.refetch,
    refetchPlacement: placementQuery.refetch,
  };
}
