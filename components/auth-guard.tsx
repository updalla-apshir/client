"use client";

import { useEffect, useState, type ReactNode } from "react";

export function AuthGuard({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
    } else {
      setHasToken(true);
    }
    setMounted(true);
  }, []);

  if (!mounted || !hasToken) return null;

  return <>{children}</>;
}
