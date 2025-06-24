import os
import csv
import logging
import statistics
from datetime import datetime
from urllib.parse import urlparse

STAR_HISTORY_DIR = "star_history"
REPO_INDEX_FILE = "repo_index.csv"
OUTPUT_FILE = "frontend/public/converted_sorted_star_history.csv"
CONVERTED_DIR = "frontend/public/converted_star_history"
DAYS_HISTORY = 30

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

def extract_repo_full_name(url):
    try:
        parts = urlparse(url).path.strip('/').split('/')
        if len(parts) >= 2:
            return f"{parts[0]}/{parts[1]}"
    except Exception:
        pass
    return None

def load_current_star_counts():
    star_counts = {}
    with open(REPO_INDEX_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            full_name = extract_repo_full_name(row["full_name"])
            if full_name:
                star_counts[full_name] = int(row["stargazers_count"])
    return star_counts

def load_repo_history(repo_filename):
    with open(os.path.join(STAR_HISTORY_DIR, repo_filename), 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        return [(row[0], None if row[1] == "NA" else int(row[1])) for row in reader]

def convert_to_cumulative(daily_deltas, current_count):
    cumulative = []
    running_total = current_count
    for date, delta in reversed(daily_deltas):
        if delta is None:
            cumulative.append((date, None))
        else:
            running_total -= delta
            cumulative.append((date, running_total))
    cumulative.reverse()
    return cumulative

def compute_metrics(star_data):
    values = [count for (_, count) in star_data if count is not None]
    if len(values) < 2:
        return 0.0, 0.0, 0.0

    growths = [j - i for i, j in zip(values[:-1], values[1:])]
    avg_growth = sum(growths) / len(growths)

    try:
        std_dev = statistics.stdev(growths)
        smoothness = 1 / std_dev if std_dev > 0 else 1.0
    except statistics.StatisticsError:
        smoothness = 1.0

    sign_matches = sum(
        (g1 > 0 and g2 > 0) or (g1 < 0 and g2 < 0)
        for g1, g2 in zip(growths[:-1], growths[1:])
    )
    consistency = sign_matches / max(len(growths) - 1, 1)

    return avg_growth, smoothness, consistency

def clear_converted_dir():
    if os.path.exists(CONVERTED_DIR):
        for file in os.listdir(CONVERTED_DIR):
            path = os.path.join(CONVERTED_DIR, file)
            if os.path.isfile(path):
                os.remove(path)
    else:
        os.makedirs(CONVERTED_DIR)

def main():
    logging.info("Starting conversion and sorting of star history")

    star_counts = load_current_star_counts()
    repos_data = []

    clear_converted_dir()

    for filename in os.listdir(STAR_HISTORY_DIR):
        if not filename.endswith(".csv"):
            continue

        repo_name = filename[:-4].replace("_", "/", 1)
        if repo_name not in star_counts:
            logging.error(f"Missing current star count for {repo_name}, skipping")
            continue

        try:
            history = load_repo_history(filename)
        except Exception as e:
            logging.warning(f"Failed to read history for {repo_name}: {e}")
            continue

        if len(history) < DAYS_HISTORY:
            logging.warning(f"Insufficient data for {repo_name}, skipping")
            continue

        cumulative_history = convert_to_cumulative(history, star_counts[repo_name])
        avg_growth, smoothness, consistency = compute_metrics(cumulative_history)
        score = avg_growth * smoothness * consistency

        # Write individual converted CSV
        converted_path = os.path.join(CONVERTED_DIR, f"{repo_name}.csv")
        os.makedirs(os.path.dirname(converted_path), exist_ok=True)
        with open(converted_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(["date", "stars"])
            for date, stars in cumulative_history:
                writer.writerow([date, stars if stars is not None else "NA"])

        repos_data.append({
            "name": repo_name,
            "score": score,
            "current_stars": star_counts[repo_name]
        })

    # Sort final ranking
    repos_data.sort(key=lambda x: (-x["score"], x["name"]))

    # Write sorted ranking CSV
    with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(["repo_name", "score", "current_stars"])
        for repo in repos_data:
            writer.writerow([repo["name"], f"{repo['score']:.4f}", repo["current_stars"]])

    logging.info(f"Written converted CSVs to {CONVERTED_DIR}/ and sorted ranking to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()