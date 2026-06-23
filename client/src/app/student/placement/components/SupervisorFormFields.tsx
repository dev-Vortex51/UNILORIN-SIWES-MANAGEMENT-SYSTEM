import type { PlacementFormData } from "../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SupervisorFormFieldsProps {
  formData: PlacementFormData;
  setFormData: (data: PlacementFormData) => void;
}

export function SupervisorFormFields({ formData, setFormData }: SupervisorFormFieldsProps) {
  return (
    <div className="pt-4 border-t">
      <h4 className="font-semibold mb-3">Industrial Supervisor Details</h4>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="supervisorName">Supervisor Name *</Label>
          <Input
            id="supervisorName"
            value={formData.supervisorName}
            onChange={(e) =>
              setFormData({
                ...formData,
                supervisorName: e.target.value,
              })
            }
            required
            placeholder="John Doe"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="supervisorEmail">Supervisor Email *</Label>
            <Input
              id="supervisorEmail"
              type="email"
              value={formData.supervisorEmail}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  supervisorEmail: e.target.value,
                })
              }
              required
              placeholder="supervisor@company.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supervisorPhone">Supervisor Phone *</Label>
            <Input
              id="supervisorPhone"
              type="tel"
              value={formData.supervisorPhone}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  supervisorPhone: e.target.value,
                })
              }
              required
              placeholder="+234 800 000 0000"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="supervisorPosition">Supervisor Position *</Label>
          <Input
            id="supervisorPosition"
            value={formData.supervisorPosition}
            onChange={(e) =>
              setFormData({
                ...formData,
                supervisorPosition: e.target.value,
              })
            }
            required
            placeholder="e.g., Senior Software Engineer"
          />
        </div>
      </div>
    </div>
  );
}
