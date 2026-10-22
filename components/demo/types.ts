export type DemoStep = {
  n: number;
  label: string;
  payload?: unknown;
  http_status?: number;
  signature_verified?: boolean;
  matched?: boolean;
  hash_prefix?: string;
  matched_on?: string[];
  prior_community_name?: string | null;
  application_id?: string;
  decision?: string;
  score?: number | null;
  reason?: string;
  rule_refs?: string[];
  signals?: Record<string, unknown>;
  auto_mode?: boolean;
  auto_sent?: boolean;
  outcome?: string;
  queue_path?: string;
};

export type DemoResponse = {
  ok?: boolean;
  error?: string;
  steps?: DemoStep[];
};

export type DemoStatus = "idle" | "loading" | "done" | "error";
