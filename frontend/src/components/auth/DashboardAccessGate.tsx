"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DashboardAccessGateProps = {
  children: React.ReactNode;
};

function readRoleFromStoredUser(): string | null {
  try {
    const rawUser = localStorage.getItem("ganesha_user");
    if (!rawUser) return null;
    const user = JSON.parse(rawUser) as { role?: string };
    return user.role ?? null;
  } catch {
    return null;
  }
}

export default function DashboardAccessGate({ children }: DashboardAccessGateProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const role = readRoleFromStoredUser();
    const token = localStorage.getItem("ganesha_token");

    if (!token || role !== "admin") {
      router.replace("/login?error=forbidden");
      return;
    }

    setReady(true);
  }, [router]);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
