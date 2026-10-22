"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { Ban, Check, Copy, ExternalLink, HelpCircle, Link2, Loader2, UserCheck, X, Zap } from "lucide-react";
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
            <Badge className="border-2 border-amber-500 bg-amber-50 text-amber-900">Mock mode — not saved</Badge>
          ) : null
        }
      />
      <div className="max-w-3xl space-y-6">
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
    <Card as="section" className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="auto-mode-label" className="flex items-center gap-2 text-xl font-bold">
            <Zap className="h-5 w-5" aria-hidden />
            Auto mode
          </h2>
          {loading ? (
            <Skeleton className="mt-2 h-5 w-56" />
          ) : (
            <p className="mt-1 font-semibold" aria-live="polite">
              {autoMode ? (
                <span className="text-emerald-700">On — sending safe replies automatically</span>
              ) : (
                <span className="text-slate-700">Off — every reply waits for a lead</span>
              )}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3 pt-1">
          {pending ? (
            <span className="inline-flex items-center gap-1.5 text-[15px] font-medium text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
              Saving…
            </span>
          ) : null}
          {loading ? (
            <Skeleton className="h-8 w-14 rounded-full" />
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

      <p className="mt-4 text-slate-700">{AUTO_MODE_EXPLANATION}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border-2 border-emerald-600/40 bg-emerald-50 p-4">
          <h3 className="text-[15px] font-bold uppercase tracking-wide text-emerald-900">Sent automatically</h3>
          <ul className="mt-2 space-y-1.5 text-slate-800">
            <li className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 shrink-0 text-amber-700" aria-hidden strokeWidth={3} />
              Clarifying questions (Ask)
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden strokeWidth={3} />
              Accepts with score ≥ 80
            </li>
          </ul>
        </div>
        <div className="rounded-xl border-2 border-slate-300 bg-slate-50 p-4">
          <h3 className="flex items-center gap-1.5 text-[15px] font-bold uppercase tracking-wide text-slate-800">
            <UserCheck className="h-4 w-4" aria-hidden />
            Always waits for a lead
          </h3>
          <ul className="mt-2 space-y-1.5 text-slate-800">
            <li className="flex items-center gap-2">
              <X className="h-4 w-4 shrink-0 text-rose-700" aria-hidden strokeWidth={3} />
              Declines
            </li>
            <li className="flex items-center gap-2">
              <Ban className="h-4 w-4 shrink-0 text-rose-700" aria-hidden strokeWidth={3} />
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
    <Card as="section" className="p-6">
      <h2 className="flex items-center gap-2 text-xl font-bold">
        <Link2 className="h-5 w-5" aria-hidden />
        Apply link
      </h2>
      <p className="mt-1 text-slate-700">Share this link so people can apply to {name}. Every application is scored and lands in your queue.</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="apply-link" className="sr-only">
          Apply link for {name}
        </label>
        <input
          id="apply-link"
          readOnly
          value={origin ? link : path}
          onFocus={(e) => e.currentTarget.select()}
          className={clsx(
            "h-11 min-w-0 flex-1 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 font-mono text-[15px] text-slate-900",
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
              "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 font-semibold text-slate-900 transition-colors duration-150 hover:border-slate-400 hover:bg-slate-50 sm:flex-none",
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
        <Skeleton className="h-5 w-20" />
        <Skeleton className="mt-3 h-10 w-72 max-w-full" />
        <Skeleton className="mt-3 h-6 w-80 max-w-full" />
      </div>
      <div className="max-w-3xl space-y-6">
        <div className="rounded-2xl border-2 border-slate-200 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Skeleton className="h-7 w-36" />
              <Skeleton className="mt-2 h-5 w-56" />
            </div>
            <Skeleton className="h-8 w-14 rounded-full" />
          </div>
          <Skeleton className="mt-5 h-5 w-full" />
          <Skeleton className="mt-2 h-5 w-3/4" />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </div>
        <div className="rounded-2xl border-2 border-slate-200 p-6">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="mt-2 h-5 w-2/3" />
          <Skeleton className="mt-4 h-11 w-full" />
        </div>
      </div>
    </div>
  );
}
