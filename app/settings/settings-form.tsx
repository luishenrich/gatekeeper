"use client";

import { useEffect, useState } from "react";

const COMMUNITIES = [
  { slug: "london-agent-builders", name: "London Agent Builders" },
  { slug: "south-london-hack-nights", name: "South London Hack Nights" },
] as const;

type Row = {
  slug: string;
  name: string;
  auto_mode: boolean;
  error: string | null;
  pending: boolean;
};

export default function SettingsForm() {
  const [rows, setRows] = useState<Row[]>(
    COMMUNITIES.map((c) => ({
      slug: c.slug,
      name: c.name,
      auto_mode: false,
      error: null,
      pending: true,
    }))
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next = await Promise.all(
        COMMUNITIES.map(async (c) => {
          try {
            const res = await fetch(`/api/communities/${c.slug}/settings`, {
              credentials: "include",
            });
            if (!res.ok) throw new Error(`Could not load (${res.status})`);
            const data = await res.json();
            return {
              slug: c.slug,
              name: data.name || c.name,
              auto_mode: data.auto_mode === true,
              error: null,
              pending: false,
            };
          } catch (e) {
            return {
              slug: c.slug,
              name: c.name,
              auto_mode: false,
              error: e instanceof Error ? e.message : "Could not load",
              pending: false,
            };
          }
        })
      );
      if (!cancelled) setRows(next);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle(slug: string, auto_mode: boolean) {
    setRows((list) =>
      list.map((row) =>
        row.slug === slug ? { ...row, pending: true, error: null } : row
      )
    );
    try {
      const res = await fetch(`/api/communities/${slug}/settings`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto_mode }),
      });
      if (!res.ok) throw new Error(`Could not save (${res.status})`);
      const data = await res.json();
      setRows((list) =>
        list.map((row) =>
          row.slug === slug
            ? { ...row, auto_mode: data.auto_mode === true, pending: false, error: null }
            : row
        )
      );
    } catch (e) {
      setRows((list) =>
        list.map((row) =>
          row.slug === slug
            ? {
                ...row,
                pending: false,
                error: e instanceof Error ? e.message : "Could not save",
              }
            : row
        )
      );
    }
  }

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li
          key={row.slug}
          className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-4"
        >
          <div>
            <p className="font-semibold">{row.name}</p>
            <p className="text-sm text-slate-600">
              {row.pending ? "Loading…" : row.auto_mode ? "Auto mode on" : "Auto mode off"}
            </p>
            {row.error && <p className="text-sm text-rose-700">{row.error}</p>}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={row.auto_mode}
            disabled={row.pending}
            onClick={() => toggle(row.slug, !row.auto_mode)}
            className={`relative h-8 w-14 rounded-full transition disabled:opacity-50 ${
              row.auto_mode ? "bg-emerald-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
                row.auto_mode ? "left-7" : "left-1"
              }`}
            />
            <span className="sr-only">
              {row.auto_mode ? "Turn auto mode off" : "Turn auto mode on"}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
