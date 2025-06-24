import os
import requests
from datetime import datetime, timedelta
import csv
import pytz
import logging
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

GITHUB_API_URL = "https://api.github.com/search/repositories"
HEADERS = {
    "Authorization": f"token {os.getenv('GITHUB_TOKEN')}",
    "Accept": "application/vnd.github.v3+json"
}
REPO_INDEX_FILE = "repo_index.csv"

def get_date_ranges():
    end_date = datetime.now(pytz.utc) - timedelta(days=30)
    start_date = end_date - timedelta(days=335)
    ranges = []
    while start_date < end_date:
        chunk_end = start_date + timedelta(days=30)
        if chunk_end > end_date:
            chunk_end = end_date
        ranges.append((start_date.strftime('%Y-%m-%d'), chunk_end.strftime('%Y-%m-%d')))
        start_date = chunk_end
    return ranges

def search_repositories(date_range):
    query = f"stars:250..5000 forks:>10 created:{date_range[0]}..{date_range[1]}"
    params = {
        "q": query,
        "sort": "stars",
        "order": "desc",
        "per_page": 100
    }
    repos = []
    for page in range(1, 11):
        params["page"] = page
        response = requests.get(GITHUB_API_URL, headers=HEADERS, params=params)
        response.raise_for_status()
        items = response.json().get("items", [])
        repos.extend(items)
        if len(items) < 100:
            break
    if len(repos) >= 1000:
        logging.warning(f"Hit max page limit (1000 repos) for range: {date_range[0]} to {date_range[1]}")
    return repos

def save_repo_index(repos):
    with open(REPO_INDEX_FILE, "w", newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(["full_name", "html_url", "created_at", "stargazers_count"])
        for repo in repos:
            writer.writerow([
                repo["full_name"],
                repo["html_url"],
                repo["created_at"],
                repo["stargazers_count"]
            ])

def main():
    logging.info("Starting repository discovery")
    all_repos, seen = [], set()
    for r in get_date_ranges():
        logging.info(f"Searching date range: {r[0]} to {r[1]}")
        repos = search_repositories(r)
        for repo in repos:
            if repo["full_name"] not in seen:
                seen.add(repo["full_name"])
                all_repos.append(repo)
    save_repo_index(all_repos)
    logging.info(f"Saved {len(all_repos)} repositories to {REPO_INDEX_FILE}")

if __name__ == "__main__":
    main()