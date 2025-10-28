"use client";

import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import {GalleryVerticalEnd} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Field, FieldDescription, FieldGroup, FieldLabel} from "@/components/ui/field";
import {Input} from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [systemName, setSystemName] = useState("");
  const [allowRegistration, setAllowRegistration] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
  });

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const response = await fetch("/api/setup/status");
        const data = await response.json();

        if (!data.data.isSetupComplete) {
          router.push("/setup");
          return;
        }

        if (!data.data.systemPreference?.allowRegistration) {
          setAllowRegistration(false);
        } else {
          setAllowRegistration(true);
          setSystemName(data.data.systemPreference.systemName);
        }
      } catch (err) {
        setError("Failed to check system status");
      } finally {
        setCheckingSetup(false);
      }
    };

    checkSetup();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      router.push("/login");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSetup) {
    return (
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div>Loading...</div>
      </div>
    );
  }

  if (!allowRegistration) {
    return (
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Registration Disabled</CardTitle>
            <CardDescription>
              Registration is currently not allowed. Please contact an administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          {systemName || "System"}
        </a>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Create an account</CardTitle>
            <CardDescription>
              Enter your information to create an account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    required
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({...formData, fullName: e.target.value})
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="username">Username</FieldLabel>
                  <Input
                    id="username"
                    type="text"
                    placeholder="johndoe"
                    required
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({...formData, username: e.target.value})
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({...formData, password: e.target.value})
                    }
                  />
                </Field>

                {error && (
                  <div className="text-sm text-destructive">{error}</div>
                )}

                <Field>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating account..." : "Create account"}
                  </Button>
                  <FieldDescription className="text-center">
                    Already have an account?{" "}
                    <a href="/login" className="underline">
                      Sign in
                    </a>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

