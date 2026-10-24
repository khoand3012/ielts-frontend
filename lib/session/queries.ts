"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/browser";
import type { ApiError } from "@/lib/api/errors";
import type { SessionDetail, SessionMode } from "@/lib/api/types";
import { unwrap } from "@/lib/api/unwrap";

export const sessionKey = (id: string) => ["session", id] as const;

export function useStartSession() {
  const router = useRouter();
  return useMutation<SessionDetail, ApiError, { test_id: string; mode: SessionMode }>({
    mutationFn: (body) => unwrap(api.POST("/sessions", { body })),
    // No cache seeding: the session screen refetches so its clock offset is fresh.
    onSuccess: (session) => router.push(`/sessions/${session.id}`),
  });
}
