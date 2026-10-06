"use client";

import { useEffect } from "react";
import { setTimezone } from "@/app/actions/cook";

export function TimezoneCapture() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("lb-tz-set")) return;
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!tz) return;
      sessionStorage.setItem("lb-tz-set", "1");
      void setTimezone(tz);
    } catch {
      // ignore
    }
  }, []);
  return null;
}
