import "server-only";

export interface SpamScore {
  score: number;
  matched_patterns: string[];
}

const PATTERNS = [
  { name: "guaranteed_returns", regex: /guarante(e|ed)\s*(returns?|profit|income|gains?|10x|100x|\d+%)/i, weight: 0.3 },
  { name: "crypto", regex: /(crypto|forex|bitcoin|btc|eth|token|presale|whitelist|airdrop|nft)/i, weight: 0.2 },
  { name: "urgency", regex: /(urgent|limited (spots?|time)|act now|don'?t miss|hurry|expires?|closing soon|last chance)/i, weight: 0.25 },
  { name: "dm_lure", regex: /(dm me|message me|whatsapp|telegram|add me|contact me|inbox me)/i, weight: 0.25 },
  { name: "link_shortener", regex: /(bit\.ly|tinyurl|short\.link|t\.co|goo\.gl)\/\w+/i, weight: 0.3 },
  { name: "fake_recruiter", regex: /(passport|bank details|ID card|social security|wire transfer|processing fee|no interview)/i, weight: 0.35 },
  { name: "unrealistic_pay", regex: /\$\d{4,}.*week|£\d{4,}.*week|\d{4,}\s*(usd|gbp|eur).*week/i, weight: 0.2 },
  { name: "impersonation", regex: /(official admin|verify your account|account suspended|click here to verify)/i, weight: 0.4 },
];

export function classifySpamText(text: string): SpamScore {
  const matched: string[] = [];
  let totalWeight = 0;

  for (const pattern of PATTERNS) {
    if (pattern.regex.test(text)) {
      matched.push(pattern.name);
      totalWeight += pattern.weight;
    }
  }

  const score = Math.min(1, totalWeight);
  return { score: Number(score.toFixed(2)), matched_patterns: matched };
}
