import os
import csv
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

REPO_INDEX_FILE = "repo_index.csv"
STAR_HISTORY_DIR = "star_history"

def get_active_repos():
    active = set()
    with open(REPO_INDEX_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            repo_name = row["repo_name"]  # Expect it to exist — raise KeyError if not
            if not repo_name:
                raise ValueError(f"Empty repo_name in row: {row}")
            active.add(repo_name.strip())
    return active

def cleanup_files(active_repos):
    removed = 0
    if not os.path.exists(STAR_HISTORY_DIR):
        return removed
    for file in os.listdir(STAR_HISTORY_DIR):
        if not file.endswith(".csv"):
            continue
        repo_name = file[:-4].replace('_', '/', 1)
        if repo_name not in active_repos:
            os.remove(os.path.join(STAR_HISTORY_DIR, file))
            logging.info(f"Removed outdated: {repo_name}")
            removed += 1
    return removed

def main():
    logging.info("Starting repository cleanup")
    active = get_active_repos()
    removed = cleanup_files(active)
    logging.info(f"Removed {removed} outdated repository histories")

if __name__ == "__main__":
    main()