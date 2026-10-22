export type StatsRecent = {
  application_id: string;
  name: string;
  decision: string;
  score: number;
  channel: string;
  created_at: string;
};

export type StatsResponse = {
  handled_today: number;
  accepted: number;
  asked: number;
  declined: number;
  blocklist_hits_cross_community: number;
  auto_sent: number;
  time_saved_minutes_estimate: number;
  recent: StatsRecent[];
};

export function emptyStats(): StatsResponse {
  return {
    handled_today: 0,
    accepted: 0,
    asked: 0,
    declined: 0,
    blocklist_hits_cross_community: 0,
    auto_sent: 0,
    time_saved_minutes_estimate: 0,
    recent: [],
  };
}
