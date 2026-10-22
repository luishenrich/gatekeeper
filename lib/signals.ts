import "server-only";

export interface StopForumSpamResult {
  appears: boolean;
  frequency: number;
  confidence: number;
}

export interface GitHubResult {
  exists: boolean;
  account_age_days: number;
  public_repos: number;
}

export interface DevpostResult {
  projects_found: number;
}

const cache = new Map<string, { data: any; expires: number }>();

function cached<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const existing = cache.get(key);
  if (existing && existing.expires > now) {
    return Promise.resolve(existing.data as T);
  }
  return fn().then((data) => {
    cache.set(key, { data, expires: now + ttl });
    return data;
  });
}

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  const timeout = new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms));
  return Promise.race([promise, timeout]);
}

export async function checkStopForumSpam(email?: string | null, username?: string | null): Promise<StopForumSpamResult | null> {
  if (!email && !username) return null;
  
  const params = new URLSearchParams();
  if (email) params.set("email", email);
  if (username) params.set("username", username);
  params.set("json", "1");

  const key = `sfs:${params.toString()}`;
  const ttl = 3600 * 1000;

  return withTimeout(
    cached(key, ttl, async () => {
      const res = await fetch(`https://api.stopforumspam.org/api?${params}`, {
        headers: { "User-Agent": "Greenlight/1.0" },
      });
      if (!res.ok) throw new Error(`SFS ${res.status}`);
      const data = await res.json();
      
      const emailData = data.email;
      const usernameData = data.username;
      const appears = emailData?.appears === 1 || usernameData?.appears === 1;
      const frequency = Math.max(emailData?.frequency ?? 0, usernameData?.frequency ?? 0);
      const confidence = Math.max(emailData?.confidence ?? 0, usernameData?.confidence ?? 0);
      
      return { appears, frequency, confidence };
    }),
    2000,
    null
  ).catch(() => null);
}

export async function checkGitHub(username?: string | null): Promise<GitHubResult | null> {
  if (!username) return null;

  const cleanUsername = username.replace(/^@/, "").replace(/[^a-zA-Z0-9-]/g, "");
  if (!cleanUsername) return null;

  const key = `gh:${cleanUsername}`;
  const ttl = 3600 * 1000;

  return withTimeout(
    cached(key, ttl, async () => {
      const res = await fetch(`https://api.github.com/users/${cleanUsername}`, {
        headers: {
          "User-Agent": "Greenlight/1.0",
          Accept: "application/vnd.github.v3+json",
        },
      });
      if (res.status === 404) return { exists: false, account_age_days: 0, public_repos: 0 };
      if (!res.ok) throw new Error(`GitHub ${res.status}`);
      
      const data = await res.json();
      const created = new Date(data.created_at);
      const account_age_days = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
      const public_repos = data.public_repos ?? 0;
      
      return { exists: true, account_age_days, public_repos };
    }),
    2000,
    null
  ).catch(() => null);
}

export async function checkDevpost(handle?: string | null): Promise<DevpostResult | null> {
  if (!handle) return null;

  const cleanHandle = handle.replace(/^@/, "").toLowerCase();
  const key = `devpost:${cleanHandle}`;
  const ttl = 3600 * 1000;

  return withTimeout(
    cached(key, ttl, async () => {
      const res = await fetch(`https://devpost.com/software/search?query=${encodeURIComponent(cleanHandle)}`, {
        headers: {
          "User-Agent": "Greenlight/1.0",
          Accept: "application/json",
        },
      });
      if (!res.ok) throw new Error(`Devpost ${res.status}`);
      
      const data = await res.json();
      const projects = data.software ?? [];
      const matching = projects.filter((p: any) => {
        const authors = p.user_name?.toLowerCase() ?? "";
        return authors.includes(cleanHandle);
      });
      
      return { projects_found: matching.length };
    }),
    2000,
    null
  ).catch(() => null);
}
