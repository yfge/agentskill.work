"use client";

import { useEffect } from "react";

import { trackSkillVisit } from "@/lib/metrics";
import { getVisitorId } from "@/lib/visitor";

export function SkillDetailTracker({ skillId }: { skillId: number }) {
  useEffect(() => {
    const id = getVisitorId();
    trackSkillVisit(skillId, id).catch(() => null);
  }, [skillId]);

  return null;
}
