export interface Repository {
  repo_name: string;
  score: number;
  current_stars: number;
}

export interface StarHistoryPoint {
  date: string;
  stars: number;
}