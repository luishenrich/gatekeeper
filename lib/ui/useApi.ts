"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ApiStatus = "idle" | "loading" | "success" | "error";

export type ApiErrorKind = "unauthorized" | "rate_limited" | "timeout" | "network" | "http";

export class ApiError extends Error {
  kind: ApiErrorKind;
  status?: number;
  details?: string;
  constructor(kind: ApiErrorKind, message: string, status?: number, details?: string) {
    super(message);
    this.kind = kind;
    this.status = status;
    this.details = details;
  }
}

const TIMEOUT_MS = 15_000;

export function loginUrl(): string {
  if (typeof window === "undefined") return "/login";
  const next = window.location.pathname + window.location.search;
  return `/login?next=${encodeURIComponent(next)}`;
}

/**
 * fetch + JSON with a timeout, typed errors and a 401 → /login redirect.
 * Pass `redirectOn401: false` for public endpoints.
 */
export async function apiFetch<T>(
  url: string,
  init: RequestInit & { timeoutMs?: number; redirectOn401?: boolean } = {}
): Promise<T> {
  const { timeoutMs = TIMEOUT_MS, redirectOn401 = true, signal, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("timeout"), timeoutMs);
  const onAbort = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", onAbort);

  try {
    const res = await fetch(url, {
      ...rest,
      signal: controller.signal,
      headers: {
        ...(rest.body ? { "Content-Type": "application/json" } : {}),
        ...rest.headers,
      },
      credentials: "same-origin",
    });
    const text = await res.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }
    if (!res.ok) {
      const message =
        (body && typeof body === "object" && "error" in body && typeof body.error === "string"
          ? body.error
          : null) || `Request failed (${res.status})`;
      if (res.status === 401) {
        if (redirectOn401 && typeof window !== "undefined") {
          window.location.assign(loginUrl());
        }
        throw new ApiError("unauthorized", "Please sign in again.", 401);
      }
      if (res.status === 429) {
        throw new ApiError("rate_limited", "Too many tries — wait a minute.", 429);
      }
      throw new ApiError("http", message, res.status, text.slice(0, 500));
    }
    return body as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (controller.signal.aborted && controller.signal.reason === "timeout") {
      throw new ApiError("timeout", "The server took too long to answer.");
    }
    if (signal?.aborted) throw err;
    throw new ApiError("network", "Couldn't reach the server. Check your connection.");
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

export type UseApiResult<T> = {
  data: T | null;
  error: ApiError | null;
  status: ApiStatus;
  refetch: () => Promise<void>;
  setData: (updater: T | null | ((prev: T | null) => T | null)) => void;
};

/**
 * GET a JSON endpoint. `url = null` keeps it idle. `pollMs` refetches in the
 * background (paused while the tab is hidden) without flashing a loading state.
 */
export function useApi<T>(
  url: string | null,
  opts: { pollMs?: number; redirectOn401?: boolean } = {}
): UseApiResult<T> {
  const { pollMs, redirectOn401 = true } = opts;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [status, setStatus] = useState<ApiStatus>(url ? "loading" : "idle");
  const controllerRef = useRef<AbortController | null>(null);
  const hasDataRef = useRef(false);

  const load = useCallback(
    async (background: boolean) => {
      if (!url) return;
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      if (!background) setStatus("loading");
      try {
        const result = await apiFetch<T>(url, { signal: controller.signal, redirectOn401 });
        if (controller.signal.aborted) return;
        hasDataRef.current = true;
        setData(result);
        setError(null);
        setStatus("success");
      } catch (err) {
        if (controller.signal.aborted) return;
        // A failed background poll keeps showing the last good data.
        if (background && hasDataRef.current) return;
        setError(err instanceof ApiError ? err : new ApiError("network", String(err)));
        setStatus("error");
      }
    },
    [url, redirectOn401]
  );

  useEffect(() => {
    hasDataRef.current = false;
    setData(null);
    setError(null);
    if (!url) {
      setStatus("idle");
      return;
    }
    void load(false);
    return () => controllerRef.current?.abort();
  }, [url, load]);

  useEffect(() => {
    if (!url || !pollMs) return;
    const tick = () => {
      if (document.visibilityState === "visible") void load(true);
    };
    const id = setInterval(tick, pollMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [url, pollMs, load]);

  const refetch = useCallback(() => load(false), [load]);

  return { data, error, status, refetch, setData };
}
