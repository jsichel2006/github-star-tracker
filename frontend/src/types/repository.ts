
export interface Repository {
  repo_name: string;
  html_url: string;
  created_at: string;
  stargazers_count: number;
  pushed_at: string;
  forks_count: number;
  topics: string;
  license_spdx: string;
  owner_type: string;
  upcoming: boolean;
  growth_value?: number;
  pct_1d_growth?: number;
  current_stars?: number;
}

export interface StarHistoryPoint {
  date: string;
  stars: number;
}

export interface GrowthMetric {
  type: '30d' | '5d' | '1d' | 'post_5d' | 'post_day';
  format: 'pct' | 'raw';
  day?: number; // for post_day metrics
}

export interface FilterState {
  growthMetric: GrowthMetric;
  stars: [number, number];
  forks: [number, number];
  lastPush: [string, string];
  dateCreated: [string, string];
  includeTopics: string[];
  excludeTopics: string[];
  licenses: string[];
  ownership: string[];
  upcoming: boolean | null;
}

export interface HistogramBin {
  min: number;
  max: number;
  count: number;
  label: string;
}