"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {GalleryVerticalEnd} from "lucide-react";
import {LoginForm} from "@/components/login-form";

export default function LoginPage() {
  const router = useRouter();
  const [systemName, setSystemName] = useState("");
  const [allowRegistration, setAllowRegistration] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const response = await fetch("/api/setup/status");
        const data = await response.json();

        if (!data.data.isSetupComplete) {
          router.push("/setup");
          return;
        }

        setSystemName(data.data.systemPreference?.systemName || "System");
        setAllowRegistration(data.data.systemPreference?.allowRegistration || false);
      } catch (err) {
        console.error("Failed to check system status", err);
      } finally {
        setLoading(false);
      }
    };

    checkSetup();
  }, [router]);

  if (loading) {
    return (
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div>Loading...</div>
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
          {systemName}
        </a>
        <LoginForm allowRegistration={allowRegistration} />
      </div>
    </div>
  );
}
