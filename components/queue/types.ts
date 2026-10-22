export type Decision = "accept" | "ask" | "decline";
export type Channel = "whatsapp" | "discord" | "web";
export type SignalKey =
  | "rules_fit"
  | "spam_text"
  | "stopforumspam"
  | "github"
  | "devpost"
  | "blocklist";
export type SignalStatus = "pass" | "fail" | "unknown";

export type ApiSignals = {
  rules_fit?: { score?: number; rule_refs?: string[] } | boolean | null;
  spam_text?: { score?: number; matched_patterns?: string[] } | boolean | null;
  stopforumspam?: {
    appears?: boolean;
    frequency?: number;
    confidence?: number;
  } | boolean | null;
  github?: {
    exists?: boolean;
    account_age_days?: number;
    public_repos?: number;
  } | boolean | null;
  devpost?: { projects_found?: number } | boolean | null;
  blocklist_hit?: boolean;
  auto?: boolean;
};

export type BlocklistMatch = {
  matched_on?: string[];
  status?: string;
  reported_at?: string;
  hash_prefix?: string;
  prior_community_name?: string;
  prior_reason?: string;
  matched_handle?: string;
};

export type QueueApp = {
  id: string;
  community_id?: string;
  community_slug: string;
  community_name: string;
  channel?: Channel | string | null;
  channel_user_id?: string | null;
  name: string;
  handle: string;
  phone?: string | null;
  email?: string | null;
  github?: string | null;
  text: string;
  created_at?: string;
  decision: Decision;
  score: number;
  reason: string;
  final?: boolean;
  signals: ApiSignals;
  blocklist_match?: BlocklistMatch | null;
  auto_sent?: boolean;
};

export type UiSignal = {
  key: SignalKey;
  label: string;
  status: SignalStatus;
  evidence: string;
};

export type UndoSnapshot = {
  item: QueueApp;
  index: number;
  pendingDecision: Decision;
  replyText: string;
  toastLabel: string;
};
