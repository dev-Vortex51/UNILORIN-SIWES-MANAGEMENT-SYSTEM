import { apiClient } from "@/lib/api-client";
import { LoginCredentials, LoginResponse, User } from "@/types/auth";

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiClient.post("/auth/login", credentials);
    return response.data;
  },

  getProfile: async (): Promise<User | null> => {
    try {
      const response = await apiClient.get("/auth/profile");
      return response.data.data;
    } catch (error) {
      return null;
    }
  },

  resetPasswordWithToken: async (
    token: string,
    password: string
  ): Promise<void> => {
    await apiClient.post("/auth/reset-password", { token, password });
  },

  changePassword: async (
    oldPassword: string,
    newPassword: string
  ): Promise<void> => {
    await apiClient.post("/auth/change-password", { oldPassword, newPassword });
  },

  resetPasswordFirstLogin: async (password: string): Promise<void> => {
    const userId = sessionStorage.getItem("resetUserId");
    if (!userId) {
      throw new Error("Missing user ID for first login password reset");
    }
    await apiClient.post("/auth/reset-password-first-login", {
      userId,
      newPassword: password,
    });
  },

  logout: async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Ignore logout errors
    }
  },

  logoutAllDevices: async (): Promise<{
    accessToken: string;
    refreshToken: string;
  }> => {
    const response = await apiClient.post("/auth/logout-all-devices");
    return response.data.data;
  },
};
