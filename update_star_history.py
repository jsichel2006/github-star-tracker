import os
import csv
import json
import gzip
from datetime import datetime, timedelta
import pytz
import requests
import logging
from concurrent.futures import ProcessPoolExecutor

# Constants
GITHUB_ARCHIVE_URL = "https://data.gharchive.org"
REPO_INDEX_FILE = "repo_index.csv"
STAR_HISTORY_DIR = "star_history"
DAYS_HISTORY = 30
HOURS_PER_DAY = list(range(24))

# Configure logging
os.makedirs("logs", exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'logs/{datetime.now(pytz.utc).strftime("%Y-%m-%d")}.log'),
        logging.StreamHandler()
    ]
)

def is_first_run():
    if not os.path.exists(STAR_HISTORY_DIR):
        return True
    for filename in os.listdir(STAR_HISTORY_DIR):
        if filename.endswith(".csv"):
            filepath = os.path.join(STAR_HISTORY_DIR, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                lines = list(reader)
                if len(lines) < DAYS_HISTORY:
                    return True
    return False

def clear_star_history():
    for filename in os.listdir(STAR_HISTORY_DIR):
        if filename.endswith('.csv'):
            os.remove(os.path.join(STAR_HISTORY_DIR, filename))

def get_active_repos():
    active_repos = set()
    try:
        with open(REPO_INDEX_FILE, 'r', newline='', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader)
            for row in reader:
                if row:
                    active_repos.add(row[0])
    except FileNotFoundError:
        logging.warning("No repository index found.")
    return active_repos

def download_archive(date, hour):
    url = f"{GITHUB_ARCHIVE_URL}/{date.strftime('%Y-%m-%d')}-{hour}.json.gz"
    local_path = f"temp_{date.strftime('%Y-%m-%d')}-{hour}.json.gz"
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        with open(local_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        return local_path
    except requests.exceptions.RequestException:
        return None

def process_archive(file_path, active_repos):
    counts = {}
    try:
        with gzip.open(file_path, 'rt', encoding='utf-8') as f:
            for line in f:
                try:
                    event = json.loads(line)
                    if event["type"] == "WatchEvent":
                        repo_name = event["repo"]["name"]
                        if repo_name in active_repos:
                            counts[repo_name] = counts.get(repo_name, 0) + 1
                except Exception:
                    continue
    finally:
        os.remove(file_path)
    return counts

def update_csv(repo_name, date_str, count):
    os.makedirs(STAR_HISTORY_DIR, exist_ok=True)
    clean_name = repo_name.replace('/', '_')
    file_path = os.path.join(STAR_HISTORY_DIR, f"{clean_name}.csv")

    lines = []
    if os.path.exists(file_path):
        with open(file_path, 'r', newline='', encoding='utf-8') as f:
            reader = csv.reader(f)
            lines = list(reader)

    if len(lines) >= DAYS_HISTORY:
        lines = lines[1:]

    lines.append([date_str, count])
    lines.sort(key=lambda x: x[0])

    with open(file_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerows(lines)

def process_day_wrapper(args):
    day_str, active_repos = args
    process_day(day_str, active_repos)

def process_day(date_str, active_repos):
    logging.info(f"Processing day: {date_str}")
    date = datetime.strptime(date_str, '%Y-%m-%d').replace(tzinfo=pytz.utc)
    total_counts = {repo: 0 for repo in active_repos}
    any_data_found = False

    for hour in HOURS_PER_DAY:
        archive_file = download_archive(date, hour)
        if archive_file:
            any_data_found = True
            logging.info(f"Processing archive: {date_str} hour {hour}")
            hourly_counts = process_archive(archive_file, active_repos)
            for repo in hourly_counts:
                total_counts[repo] += hourly_counts[repo]

    if any_data_found:
        for repo, count in total_counts.items():
            update_csv(repo, date_str, count)
    else:
        logging.warning(f"No data available for {date_str}, inserting NA for all repos")
        for repo in active_repos:
            update_csv(repo, date_str, "NA")

def cleanup_temp_files():
    for filename in os.listdir('.'):
        if filename.startswith('temp_') and filename.endswith('.json.gz'):
            try:
                os.remove(filename)
                logging.info(f"Deleted leftover temp file: {filename}")
            except Exception as e:
                logging.warning(f"Failed to delete temp file {filename}: {e}")

def main():
    logging.info("Starting parallelized star history update (by day)")

    if not os.path.exists(STAR_HISTORY_DIR):
        os.makedirs(STAR_HISTORY_DIR)

    if is_first_run():
        logging.info("First run detected — clearing old star history")
        clear_star_history()

    active_repos = get_active_repos()
    if not active_repos:
        logging.warning("No active repositories found. Exiting.")
        return

    now = datetime.now(pytz.utc)
    day_strings = [
        (now - timedelta(days=(DAYS_HISTORY - i))).strftime('%Y-%m-%d')
        for i in range(DAYS_HISTORY)
    ]

    with ProcessPoolExecutor() as executor:
        executor.map(process_day_wrapper, [(day, active_repos) for day in day_strings])

    cleanup_temp_files()
    logging.info("Star history update complete.")

if __name__ == "__main__":
    main()
