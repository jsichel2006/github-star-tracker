import os
import csv
import logging
from urllib.parse import urlparse

STAR_HISTORY_DIR = "star_history"
REPO_INDEX_FILE = "repo_index.csv"
CONVERTED_DIR = "frontend/public/converted_star_history"
OUTPUT_5D = "frontend/public/converted_sorted_growth_5d.csv"
OUTPUT_30D = "frontend/public/converted_sorted_growth_30d.csv"

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

def clear_converted_dir():
    if os.path.exists(CONVERTED_DIR):
        for file in os.listdir(CONVERTED_DIR):
            path = os.path.join(CONVERTED_DIR, file)
            if os.path.isfile(path):
                os.remove(path)
    else:
        os.makedirs(CONVERTED_DIR)

def main():
    logging.info("Starting conversion and growth-based sorting")

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

        cumulative = convert_to_cumulative(history, star_counts[repo_name])
        converted_path = os.path.join(CONVERTED_DIR, f"{repo_name}.csv")
        os.makedirs(os.path.dirname(converted_path), exist_ok=True)

        with open(converted_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(["date", "stars"])
            for date, stars in cumulative:
                writer.writerow([date, stars if stars is not None else "NA"])

        values = [v for (_, v) in cumulative if v is not None]

        growth_5d_pct = None
        growth_30d_pct = None

        if len(values) >= 5:
            start_5d = values[-5]
            end_5d = values[-1]
            if start_5d > 0:
                growth_5d_pct = ((end_5d - start_5d) / start_5d) * 100

        if len(values) >= 30:
            start_30d = values[-30]
            end_30d = values[-1]
            if start_30d > 0:
                growth_30d_pct = ((end_30d - start_30d) / start_30d) * 100

        repos_data.append({
            "name": repo_name,
            "current_stars": star_counts[repo_name],
            "growth_5d_pct": growth_5d_pct,
            "growth_30d_pct": growth_30d_pct
        })

    # Write 5-day sorted CSV
    sorted_5d = sorted(repos_data, key=lambda x: (x["growth_5d_pct"] is None, -x["growth_5d_pct"] if x["growth_5d_pct"] is not None else 0, x["name"]))
    with open(OUTPUT_5D, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(["repo_name", "growth_5d_pct", "current_stars"])
        for repo in sorted_5d:
            writer.writerow([
                repo["name"],
                f"{repo['growth_5d_pct']:.2f}" if repo["growth_5d_pct"] is not None else "",
                repo["current_stars"]
            ])

    # Write 30-day sorted CSV
    sorted_30d = sorted(repos_data, key=lambda x: (x["growth_30d_pct"] is None, -x["growth_30d_pct"] if x["growth_30d_pct"] is not None else 0, x["name"]))
    with open(OUTPUT_30D, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(["repo_name", "growth_30d_pct", "current_stars"])
        for repo in sorted_30d:
            writer.writerow([
                repo["name"],
                f"{repo['growth_30d_pct']:.2f}" if repo["growth_30d_pct"] is not None else "",
                repo["current_stars"]
            ])

    logging.info("Generated sorted CSVs: 5-day and 30-day percentage growth rankings")

if __name__ == "__main__":
    main()