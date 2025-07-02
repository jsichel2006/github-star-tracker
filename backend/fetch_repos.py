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
FRONTEND_FILTERS_FILE = "frontend/public/repo_filters.csv"

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
    query = (
        f"stars:250..5000 created:{date_range[0]}..{date_range[1]} archived:false"
    )
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
        
        # 🔽 Filter out mirrored and template repos here
        filtered = [
            r for r in items
            if not r.get("mirror_url") and not r.get("is_template")
        ]
        repos.extend(filtered)

        if len(items) < 100:
            break

    if len(repos) >= 1000:
        logging.warning(f"Hit max page limit (1000 repos) for range: {date_range[0]} to {date_range[1]}")
    return repos

def save_repo_index(repos):
    with open(REPO_INDEX_FILE, "w", newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            "repo_name", "html_url", "created_at", "stargazers_count",
            "pushed_at", "forks_count", "topics", "license_spdx", "owner_type"
        ])
        for repo in repos:
            writer.writerow([
                repo.get("repo_name"),
                repo.get("html_url"),
                repo.get("created_at"),
                repo.get("stargazers_count"),
                repo.get("pushed_at"),
                repo.get("forks_count"),
                "|".join(repo.get("topics", [])),  # Pipe-separated
                (repo.get("license") or {}).get("spdx_id", ""),
                (repo.get("owner") or {}).get("type", "")
            ])

def copy_for_frontend():
    os.makedirs(os.path.dirname(FRONTEND_FILTERS_FILE), exist_ok=True)
    with open(REPO_INDEX_FILE, 'r', encoding='utf-8') as src, \
         open(FRONTEND_FILTERS_FILE, 'w', encoding='utf-8', newline='') as dest:
        dest.write(src.read())
    logging.info(f"Copied repo_index.csv to {FRONTEND_FILTERS_FILE}")

def main():
    logging.info("Starting repository discovery")
    all_repos, seen = [], set()
    for r in get_date_ranges():
        logging.info(f"Searching date range: {r[0]} to {r[1]}")
        repos = search_repositories(r)
        for repo in repos:
            if repo["repo_name"] not in seen:
                seen.add(repo["repo_name"])
                all_repos.append(repo)
    save_repo_index(all_repos)
    copy_for_frontend()
    logging.info(f"Saved {len(all_repos)} repositories to {REPO_INDEX_FILE} and copied to frontend")

if __name__ == "__main__":
    main()