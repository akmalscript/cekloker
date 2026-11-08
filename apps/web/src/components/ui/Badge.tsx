import React from "react";
import { ShieldCheck, TriangleAlert, OctagonAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RiskLevel, FlagSeverity } from "@/types";

interface BadgeProps {
  status: RiskLevel | FlagSeverity;
  className?: string;
  label?: string;
}

export function RiskBadge({ status, className, label }: BadgeProps) {
  const normalized = status.toLowerCase();

  if (normalized === "aman") {
    return (
      <span className={cn("badge badge-aman", className)}>
        <ShieldCheck aria-hidden="true" />
        <span>{label ?? "Aman"}</span>
      </span>
    );
  }

  if (normalized === "waspada") {
    return (
      <span className={cn("badge badge-bahaya", className)}>
        <TriangleAlert aria-hidden="true" />
        <span>{label ?? "Waspada"}</span>
      </span>
    );
  }

  return (
    <span className={cn("badge badge-bahaya", className)}>
      <OctagonAlert aria-hidden="true" />
      <span>{label ?? "Bahaya"}</span>
    </span>
  );
}

