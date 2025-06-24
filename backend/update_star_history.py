import os
import csv
import json
import gzip
import time
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
MAX_WORKERS = 12

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
    max_retries = 2
    backoff = 1

    for attempt in range(max_retries + 1):
        start_time = time.time()
        try:
            response = requests.get(url, stream=True, timeout=15)
            response.raise_for_status()

            download_time = time.time() - start_time
            if download_time > 10:
                logging.warning(f"Slow download detected ({download_time:.2f}s): {url}")
            else:
                logging.info(f"Downloaded in {download_time:.2f}s: {url}")

            with open(local_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            return local_path

        except requests.exceptions.RequestException as e:
            logging.warning(f"Attempt {attempt + 1} failed to download {url}: {e}")
            if attempt < max_retries:
                time.sleep(backoff)
                backoff *= 2
            else:
                logging.warning(f"Giving up on {url} after {max_retries + 1} attempts.")
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

def write_batch_updates(date_str, daily_counts):
    os.makedirs(STAR_HISTORY_DIR, exist_ok=True)
    for repo_name, count in daily_counts.items():
        clean_name = repo_name.replace('/', '_')
        file_path = os.path.join(STAR_HISTORY_DIR, f"{clean_name}.csv")
        new_line = [date_str, count]

        lines = []
        seen = False
        if os.path.exists(file_path):
            with open(file_path, 'r', newline='', encoding='utf-8') as f:
                reader = csv.reader(f)
                for row in reader:
                    if row and row[0] == date_str:
                        row[1] = str(count)
                        seen = True
                    lines.append(row)
        if not seen:
            lines.append(new_line)

        lines = sorted(lines, key=lambda x: x[0])[-DAYS_HISTORY:]

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
        write_batch_updates(date_str, total_counts)
    else:
        logging.warning(f"No data available for {date_str}, inserting NA for all repos")
        na_counts = {repo: "NA" for repo in active_repos}
        write_batch_updates(date_str, na_counts)

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

    with ProcessPoolExecutor(max_workers=MAX_WORKERS) as executor:
        executor.map(process_day_wrapper, [(day, active_repos) for day in day_strings])

    cleanup_temp_files()
    logging.info("Star history update complete.")

if __name__ == "__main__":
    main()