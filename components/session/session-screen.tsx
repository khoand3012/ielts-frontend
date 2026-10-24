"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ContentError, parseContent, type ParsedContent } from "@/lib/content/schema";
import { useSessionQuery } from "@/lib/session/queries";
import { PLAYABLE_SKILLS } from "@/lib/tests/skills";
import { ReadingScreen } from "./reading-screen";
import { SubmittedView } from "./submitted-view";

function Message({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-lg font-semibold">{title}</h1>
      {children}
      <Button asChild variant="outline" className="mt-6">
        <Link href="/tests">Back to tests</Link>
      </Button>
    </main>
  );
}

export function SessionScreen({ sessionId }: { sessionId: string }) {
  const [expired, setExpired] = useState(false);
  const query = useSessionQuery(sessionId, { poll: expired });
  const session = query.data?.session;

  const parsed = useMemo((): ParsedContent | null => {
    if (!session || !PLAYABLE_SKILLS.has(session.skill)) return null;
    try {
      return parseContent(session.skill, session.content);
    } catch (err) {
      if (err instanceof ContentError) return null;
      throw err;
    }
  }, [session]);

  if (query.isPending) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8" aria-busy="true">
        <div className="h-7 w-72 animate-pulse rounded bg-muted" />
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
        </div>
      </main>
    );
  }

  if (query.isError) {
    if (query.error.status === 404) return <Message title="Session not found" />;
    return (
      <Message title="Couldn't load this session">
        <p className="mt-2 text-sm text-muted-foreground">Check your connection and try again.</p>
        <Button className="mt-4" onClick={() => query.refetch()}>
          Try again
        </Button>
      </Message>
    );
  }

  const { offsetMs } = query.data;
  const current = query.data.session;
  if (current.status === "submitted") return <SubmittedView session={current} />;

  if (parsed?.skill !== "reading") {
    return <Message title="This test type isn't available yet" />;
  }

  return (
    <ReadingScreen
      session={current}
      content={parsed.content}
      offsetMs={offsetMs}
      expired={expired}
      onExpire={() => setExpired(true)}
      onClosed={() => void query.refetch()}
    />
  );
}
