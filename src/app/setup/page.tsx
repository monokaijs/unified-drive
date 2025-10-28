"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {GalleryVerticalEnd} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Field, FieldGroup, FieldLabel} from "@/components/ui/field";
import {Input} from "@/components/ui/input";

export default function SetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    systemName: "",
    allowRegistration: false,
    adminUsername: "",
    adminPassword: "",
    adminFullName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Setup failed");
      }

      router.push("/login");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          System Setup
        </a>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">System Setup</CardTitle>
            <CardDescription>
              Configure your system and create an admin account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="systemName">System Name</FieldLabel>
                  <Input
                    id="systemName"
                    type="text"
                    placeholder="My System"
                    required
                    value={formData.systemName}
                    onChange={(e) =>
                      setFormData({...formData, systemName: e.target.value})
                    }
                  />
                </Field>

                <Field>
                  <div className="flex items-center gap-2">
                    <input
                      id="allowRegistration"
                      type="checkbox"
                      checked={formData.allowRegistration}
                      onChange={(e) =>
                        setFormData({...formData, allowRegistration: e.target.checked})
                      }
                      className="h-4 w-4 rounded border-input"
                    />
                    <FieldLabel htmlFor="allowRegistration" className="!mb-0">
                      Allow user registration
                    </FieldLabel>
                  </div>
                </Field>

                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-medium mb-4">Admin Account</h3>
                  
                  <Field>
                    <FieldLabel htmlFor="adminFullName">Full Name</FieldLabel>
                    <Input
                      id="adminFullName"
                      type="text"
                      placeholder="John Doe"
                      required
                      value={formData.adminFullName}
                      onChange={(e) =>
                        setFormData({...formData, adminFullName: e.target.value})
                      }
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="adminUsername">Username</FieldLabel>
                    <Input
                      id="adminUsername"
                      type="text"
                      placeholder="admin"
                      required
                      value={formData.adminUsername}
                      onChange={(e) =>
                        setFormData({...formData, adminUsername: e.target.value})
                      }
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="adminPassword">Password</FieldLabel>
                    <Input
                      id="adminPassword"
                      type="password"
                      required
                      value={formData.adminPassword}
                      onChange={(e) =>
                        setFormData({...formData, adminPassword: e.target.value})
                      }
                    />
                  </Field>
                </div>

                {error && (
                  <div className="text-sm text-destructive">{error}</div>
                )}

                <Field>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Setting up..." : "Complete Setup"}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

