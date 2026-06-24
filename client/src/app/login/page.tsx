// "use client";

// import { useEffect, useState, type FormEvent } from "react";
// import { useSearchParams } from "next/navigation";
// import { Loader2 } from "lucide-react";
// import { toast } from "sonner";
// import Link from "next/link";
// import { useAuth } from "@/components/providers/auth-provider";
// import { AuthBrandHeader } from "@/components/auth/AuthBrandHeader";
// import { AuthPageShell } from "@/components/auth/AuthPageShell";
// import { AuthStatusMessage } from "@/components/auth/AuthStatusMessage";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";

// export default function LoginPage() {
//   const { login, isLoading } = useAuth();
//   const searchParams = useSearchParams();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [submitting, setSubmitting] = useState(false);

//   useEffect(() => {
//     document.title = "Login | ITMS";
//   }, []);

//   useEffect(() => {
//     if (searchParams.get("message") === "password-changed") {
//       toast.success("Password changed successfully! You can now login with your new password.");
//       window.history.replaceState({}, "", "/login");
//     }
//   }, [searchParams]);

//   const handleSubmit = async (event: FormEvent) => {
//     event.preventDefault();
//     setError("");
//     setSubmitting(true);

//     try {
//       await login({ email, password });
//     } catch (err: any) {
//       if (err.code === "ERR_NETWORK" || err.message?.includes("Network Error")) {
//         setError("Login failed, please try again or check your internet connection.");
//       } else {
//         const errorMessage =
//           err.response?.data?.message || "Login failed. Please check your credentials.";
//         setError(errorMessage);
//         toast.error(errorMessage);
//       }
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <AuthPageShell>
//       <Card className="w-full max-w-md">
//         <CardHeader className="space-y-4 text-center">
//           <AuthBrandHeader />
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="email">Email</Label>
//               <Input
//                 id="email"
//                 type="email"
//                 placeholder="your.email@institution.edu"
//                 value={email}
//                 onChange={(event) => setEmail(event.target.value)}
//                 required
//                 disabled={isLoading}
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="password">Password</Label>
//               <Input
//                 id="password"
//                 type="password"
//                 placeholder="••••••••"
//                 value={password}
//                 onChange={(event) => setPassword(event.target.value)}
//                 required
//                 disabled={isLoading}
//               />
//             </div>

//             <div className="flex justify-end">
//               <Link href="/forgot-password" className="text-sm text-primary hover:underline">
//                 Forgot password?
//               </Link>
//             </div>

//             <AuthStatusMessage type="error" message={error} />

//             <Button type="submit" className="w-full" disabled={submitting || isLoading}>
//               {submitting || isLoading ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Signing in...
//                 </>
//               ) : (
//                 "Sign In"
//               )}
//             </Button>
//           </form>
//         </CardContent>
//       </Card>
//     </AuthPageShell>
//   );
// }

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
        <Title ta="center" className={classes.title} mt="md">
          Welcome back!
        </Title>
        <Text className={classes.subtitle} size="sm">
          Industrial Training Management System
        </Text>
        <Paper withBorder p={30} mt={30} radius="md" pos="relative">
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
              <Anchor component={Link} href="/forgot-password" size="sm" c="itmsBlue.8">
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
