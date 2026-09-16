import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { TeamShareStatus } from "../../utils/teamShare";
import { needsUnlockPrompt } from "../../utils/teamShare";
import { TeamShareUnlockModal } from "./TeamShareUnlockModal";

/**
 * Asks for the team-share master password once, at startup.
 *
 * The master password is deliberately not persisted anywhere, so the shared
 * credentials are unavailable until it is typed — that is the whole point of
 * the feature, and why this prompt comes back on every launch. Mounted once
 * at the App level so it shows over whatever page opens first.
 */
export function TeamShareGate() {
  const [status, setStatus] = useState<TeamShareStatus | null>(null);
  const [isPromptOpen, setIsPromptOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    invoke<TeamShareStatus>("get_team_share_status")
      .then((current) => {
        if (cancelled) return;
        setStatus(current);
        setIsPromptOpen(needsUnlockPrompt(current));
      })
      .catch((e) => {
        console.error("Failed to read the team share status:", e);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUnlocked = useCallback((next: TeamShareStatus) => {
    setStatus(next);
    setIsPromptOpen(false);
  }, []);

  const handleClose = useCallback(() => setIsPromptOpen(false), []);

  return (
    <TeamShareUnlockModal
      isOpen={isPromptOpen}
      status={status}
      onUnlocked={handleUnlocked}
      onClose={handleClose}
    />
  );
}
