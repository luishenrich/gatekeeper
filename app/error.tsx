"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button, ErrorState } from "@/components/ui";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <ErrorState
        title="This page hit a problem"
        message="Nothing you did is lost. Try again, and if it keeps happening, copy the details below into an issue so we can fix it."
        details={[error.message, error.digest ? `digest: ${error.digest}` : ""].filter(Boolean).join("\n")}
        onRetry={reset}
      />
      <div className="mt-6 flex gap-3">
        <Link href="/">
          <Button variant="ghost">Go home</Button>
        </Link>
      </div>
    </main>
  );
}
