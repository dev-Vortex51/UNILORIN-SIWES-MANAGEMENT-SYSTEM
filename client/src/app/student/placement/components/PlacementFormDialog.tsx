"use client";

import { PlacementFormData, PlacementStatus } from "../types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AcceptanceLetterField } from "./AcceptanceLetterField";
import { SupervisorFormFields } from "./SupervisorFormFields";

interface PlacementFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placementStatus?: PlacementStatus;
  formData: PlacementFormData;
  setFormData: (data: PlacementFormData) => void;
  onCreate: () => void;
  onUpdate: () => void;
  isCreating: boolean;
  isUpdating: boolean;
}

export function PlacementFormDialog({
  open,
  onOpenChange,
  placementStatus,
  formData,
  setFormData,
  onCreate,
  onUpdate,
  isCreating,
  isUpdating,
}: PlacementFormDialogProps) {
  const isEditing =
    placementStatus && !["withdrawn", "rejected"].includes(placementStatus);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Update Placement Details" : "Submit Placement Details"}
          </DialogTitle>
          <DialogDescription>
            {placementStatus
              ? placementStatus === "approved"
                ? "Update your placement and resubmit for coordinator review"
                : ["withdrawn", "rejected"].includes(placementStatus)
                  ? "Submit a new placement application"
                  : "Update your placement details before approval"
              : "Provide information about your industrial training placement"}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (isEditing) {
              onUpdate();
              return;
            }
            onCreate();
          }}
        >
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    companyName: e.target.value,
                  })
                }
                required
                placeholder="ABC Corporation Ltd"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyAddress">Company Address *</Label>
              <Input
                id="companyAddress"
                value={formData.companyAddress}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    companyAddress: e.target.value,
                  })
                }
                required
                placeholder="123 Business Street, City, State"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companySector">Company Sector</Label>
              <Input
                id="companySector"
                value={formData.companySector}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    companySector: e.target.value,
                  })
                }
                placeholder="e.g., Information Technology, Manufacturing"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyEmail">Company Email *</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={formData.companyEmail}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      companyEmail: e.target.value,
                    })
                  }
                  required
                  placeholder="hr@company.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyPhone">Company Phone *</Label>
                <Input
                  id="companyPhone"
                  type="tel"
                  value={formData.companyPhone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      companyPhone: e.target.value,
                    })
                  }
                  required
                  placeholder="+234 800 000 0000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Your Position/Role *</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    position: e.target.value,
                  })
                }
                required
                placeholder="e.g., Software Development Intern"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      startDate: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      endDate: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-3">Working Hours</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="workStartTime">Opening Time *</Label>
                  <Input
                    id="workStartTime"
                    type="time"
                    value={formData.workStartTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        workStartTime: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workEndTime">Closing Time *</Label>
                  <Input
                    id="workEndTime"
                    type="time"
                    value={formData.workEndTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        workEndTime: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
            </div>

            <AcceptanceLetterField formData={formData} setFormData={setFormData} />

            <SupervisorFormFields formData={formData} setFormData={setFormData} />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isEditing ? isUpdating : isCreating}>
              {isEditing
                ? isUpdating
                  ? "Updating..."
                  : "Update Placement"
                : isCreating
                  ? "Submitting..."
                  : "Submit Placement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
