"use client";

import { useSyncExternalStore } from "react";
import { isLocalDevOtpBypassEnabled } from "@/lib/otp";

export function useLocalDevOtpBypassEnabled() {
  return useSyncExternalStore(
    () => () => {},
    () => isLocalDevOtpBypassEnabled(),
    () => false
  );
}
