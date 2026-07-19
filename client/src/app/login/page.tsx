"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Anchor,
  Button,
  Checkbox,
  Container,
  Group,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
  Box,
  Image,
} from "@mantine/core";
import { useDocumentTitle } from "@mantine/hooks";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { AuthStatusMessage } from "@/components/auth/AuthStatusMessage";
import classes from "./AuthenticationTitle.module.css";

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const searchParams = useSearchParams();

  useDocumentTitle("Login | ITMS");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (searchParams.get("message") === "password-changed") {
      toast.success("Password changed successfully!");
      window.history.replaceState({}, "", "/login");
    }
  }, [searchParams]);

  // Show session expired message from token invalidation redirect
  useEffect(() => {
    const message = (window as any).__sessionExpiredMessage;
    if (message) {
      delete (window as any).__sessionExpiredMessage;
      setError(message);
    }
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login({ email, password });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Login failed.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const isBusy = submitting;

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4">
      <Container size={420} m={0}>
        <Image
          src="/icons/login-logo.svg"
          alt="ITMS Logo"
          // w={80}
          // h={80}
          fit="contain"
          mx="auto"
          // mb="sm"
        />
        <Paper withBorder p={30} mt={10} radius="md" pos="relative">
          {isLoading ? (
            <Text size="xs" c="dimmed" mb="sm">
              Checking existing session...
            </Text>
          ) : null}
          <form onSubmit={handleSubmit}>
            <TextInput
              label="Email address"
              placeholder="you@institution.edu"
              required
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              disabled={isBusy}
            />

            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              mt="md"
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
              disabled={isBusy}
            />

            <Group justify="space-between" mt="lg">
              <Checkbox label="Remember me" />
              <Anchor
                component={Link}
                href="/forgot-password"
                size="sm"
                c="itmsBlue.8"
              >
                Forgot password?
              </Anchor>
            </Group>

            {error && (
              <Box mt="md">
                <AuthStatusMessage type="error" message={error} />
              </Box>
            )}

            <Button
              fullWidth
              mt="xl"
              size="md"
              type="submit"
              loading={isBusy}
              color="itmsBlue"
            >
              Sign in
            </Button>
          </form>
        </Paper>
      </Container>
    </div>
  );
}
