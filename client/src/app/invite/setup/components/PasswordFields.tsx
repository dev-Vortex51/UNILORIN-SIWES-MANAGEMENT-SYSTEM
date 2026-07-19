import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SetupFormData } from "../types";

interface PasswordFieldsProps {
  formData: SetupFormData;
  showPassword: boolean;
  onToggleShowPassword: () => void;
  showConfirmPassword: boolean;
  onToggleShowConfirmPassword: () => void;
  onFieldChange: (field: keyof SetupFormData, value: string) => void;
}

export function PasswordFields({
  formData,
  showPassword,
  onToggleShowPassword,
  showConfirmPassword,
  onToggleShowConfirmPassword,
  onFieldChange,
}: PasswordFieldsProps) {
  return (
    <div className="border-t pt-4">
      <h3 className="mb-4 font-semibold">Set Your Password</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password">
            Password <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={formData.password}
              onChange={(event) => onFieldChange("password", event.target.value)}
              required
              autocomplete="new-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={onToggleShowPassword}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">
            Confirm Password <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={(event) => onFieldChange("confirmPassword", event.target.value)}
              required
              autocomplete="new-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={onToggleShowConfirmPassword}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
