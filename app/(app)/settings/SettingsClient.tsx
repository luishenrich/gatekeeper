"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, ExternalLink, Link2, Loader2, UserCheck, Zap } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Dialog,
  ErrorState,
  PageHeader,
  Skeleton,
  Switch,
  focusRing,
  toast,
} from "@/components/ui";
import { communityName, type CommunitySlug } from "@/lib/ui/communities";
import { ApiError, apiFetch, useApi } from "@/lib/ui/useApi";
import { useCommunity } from "@/lib/ui/useCommunity";

type CommunitySettings = { slug: string; name: string; auto_mode: boolean };

const AUTO_MODE_EXPLANATION =
  "Auto-sends clarifying questions and strong accepts (score ≥ 80). Declines and blocklist hits always wait for a lead.";

export default function SettingsClient({ useMocks }: { useMocks: boolean }) {
  const [community] = useCommunity();
  // Mock mode has no settings route: keep auto mode in memory per community.
  const [mockAuto, setMockAuto] = useState<Partial<Record<CommunitySlug, boolean>>>({});
  const name = communityName(community);

  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title={name}
        description="Automation and sharing for this community."
        actions={
          useMocks ? (
            <Badge className="border border-amber-200 bg-amber-50/80 text-amber-900">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
              Mock mode — not saved
            </Badge>
          ) : null
        }
      />
      <div className="max-w-3xl space-y-5">
        <AutoModeCard
          key={community}
          community={community}
          name={name}
          useMocks={useMocks}
          mockValue={mockAuto[community] ?? false}
          setMockValue={(v) => setMockAuto((m) => ({ ...m, [community]: v }))}
        />
        <ApplyLinkCard community={community} name={name} />
      </div>
    </div>
  );
}

/* ---------- Auto mode ---------- */

function AutoModeCard({
  community,
  name,
  useMocks,
  mockValue,
  setMockValue,
}: {
  community: CommunitySlug;
  name: string;
  useMocks: boolean;
  mockValue: boolean;
  setMockValue: (v: boolean) => void;
}) {
  const url = `/api/communities/${encodeURIComponent(community)}/settings`;
  const { data, error, status, refetch, setData } = useApi<CommunitySettings>(useMocks ? null : url);
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const autoMode = useMocks ? mockValue : data?.auto_mode ?? false;

  async function commit(next: boolean) {
    if (pending) return;
    if (useMocks) {
      setMockValue(next);
      toast.success(next ? `Auto mode on for ${name} (mock, not saved)` : `Auto mode off for ${name} (mock, not saved)`);
      return;
    }
    setPending(true);
    setData((d) => (d ? { ...d, auto_mode: next } : d)); // optimistic
    try {
      const saved = await apiFetch<CommunitySettings>(url, {
        method: "PATCH",
        body: JSON.stringify({ auto_mode: next }),
      });
      setData(saved);
      toast.success(saved.auto_mode ? `Auto mode is on for ${name}` : `Auto mode is off for ${name}`);
    } catch (err) {
      setData((d) => (d ? { ...d, auto_mode: !next } : d)); // rollback
      const msg = err instanceof ApiError ? err.message : "Unknown error";
      toast.error(`Couldn't save auto mode — ${msg}`);
    } finally {
      setPending(false);
    }
  }

  function onSwitch(next: boolean) {
    if (next) setConfirmOpen(true);
    else void commit(false);
  }

  if (!useMocks && status === "error" && error) {
    return (
      <ErrorState
        title="Couldn't load auto mode"
        message={error.message}
        details={error.details}
        onRetry={() => void refetch()}
      />
    );
  }

  const loading = !useMocks && !data;

  return (
    <Card as="section" className="p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary ring-1 ring-foreground/10" aria-hidden>
            <Zap className="h-4 w-4" />
          </span>
          <div className="min-w-0">
          <h2 id="auto-mode-label" className="font-display text-3xl leading-tight text-foreground">
            Auto mode
          </h2>
          {loading ? (
            <Skeleton className="mt-2 h-5 w-56" />
          ) : (
            <p className="mt-1 inline-flex items-center gap-2 text-[15px]" aria-live="polite">
              <span
                aria-hidden
                className={clsx("h-1.5 w-1.5 rounded-full", autoMode ? "bg-emerald-500" : "bg-foreground/25")}
              />
              {autoMode ? (
                <span className="text-emerald-800">On — sending safe replies automatically</span>
              ) : (
                <span className="text-muted-foreground">Off — every reply waits for a lead</span>
              )}
            </p>
          )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 pt-2">
          {pending ? (
            <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
              Saving…
            </span>
          ) : null}
          {loading ? (
            <Skeleton className="h-5 w-9 rounded-full" />
          ) : (
            <Switch
              checked={autoMode}
              onChange={onSwitch}
              disabled={pending}
              label={`Auto mode for ${name}`}
            />
          )}
        </div>
      </div>

      <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{AUTO_MODE_EXPLANATION}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/50 p-5">
          <h3 className="flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-wider text-emerald-900/70">
            <Zap className="h-3.5 w-3.5" aria-hidden />
            Sent automatically
          </h3>
          <ul className="mt-3 space-y-2 text-[15px] text-foreground/85">
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              Clarifying questions (Ask)
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              Accepts with score ≥ 80
            </li>
          </ul>
        </div>
        <div className="rounded-2xl border border-rose-200/70 bg-rose-50/50 p-5">
          <h3 className="flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-wider text-rose-900/70">
            <UserCheck className="h-3.5 w-3.5" aria-hidden />
            Always waits for a lead
          </h3>
          <ul className="mt-3 space-y-2 text-[15px] text-foreground/85">
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" aria-hidden />
              Declines
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" aria-hidden />
              Blocklist hits
            </li>
          </ul>
        </div>
      </div>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={`Turn on auto mode for ${name}?`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="accept"
              icon={<Zap className="h-4 w-4" aria-hidden />}
              onClick={() => {
                setConfirmOpen(false);
                void commit(true);
              }}
            >
              Turn on auto mode
            </Button>
          </>
        }
      >
        <p>{AUTO_MODE_EXPLANATION}</p>
        <p className="mt-3">You can turn it off here at any time.</p>
      </Dialog>
    </Card>
  );
}

/* ---------- Apply link ---------- */

function ApplyLinkCard({ community, name }: { community: CommunitySlug; name: string }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const path = `/apply?community=${encodeURIComponent(community)}`;
  const link = `${origin}${path}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copied");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select the link and copy it manually");
    }
  }

  return (
    <Card as="section" className="p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary ring-1 ring-foreground/10" aria-hidden>
          <Link2 className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-3xl leading-tight text-foreground">Apply link</h2>
          <p className="mt-1 text-[15px] text-muted-foreground">
            Share this link so people can apply to {name}. Every application is scored and lands in your queue.
          </p>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="apply-link" className="sr-only">
          Apply link for {name}
        </label>
        <input
          id="apply-link"
          readOnly
          value={origin ? link : path}
          onFocus={(e) => e.currentTarget.select()}
          className={clsx(
            "h-10 min-w-0 flex-1 rounded-xl border border-border bg-muted/50 px-4 font-mono text-[14px] text-foreground/85",
            focusRing
          )}
        />
        <div className="flex gap-2">
          <Button
            onClick={() => void copy()}
            disabled={!origin}
            icon={copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            className="flex-1 sm:flex-none"
          >
            {copied ? "Copied" : "Copy"}
          </Button>
          <a
            href={path}
            target="_blank"
            rel="noreferrer"
            className={clsx(
              "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-border bg-card px-4 text-[15px] font-medium text-foreground transition-colors duration-150 hover:bg-accent sm:flex-none",
              focusRing
            )}
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            Open
          </a>
        </div>
      </div>
    </Card>
  );
}

/* ---------- Skeleton ---------- */

export function SettingsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading settings">
      <div className="pb-8">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="mt-3 h-12 w-72 max-w-full" />
        <Skeleton className="mt-3 h-5 w-80 max-w-full" />
      </div>
      <div className="max-w-3xl space-y-5">
        <Card className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-8 w-36" />
                <Skeleton className="mt-2 h-5 w-56" />
              </div>
            </div>
            <Skeleton className="mt-2 h-5 w-9 rounded-full" />
          </div>
          <Skeleton className="mt-5 h-5 w-full" />
          <Skeleton className="mt-2 h-5 w-3/4" />
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        </Card>
        <Card className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="mt-2 h-5 w-2/3" />
            </div>
          </div>
          <Skeleton className="mt-6 h-10 w-full" />
        </Card>
      </div>
    </div>
  );
}
