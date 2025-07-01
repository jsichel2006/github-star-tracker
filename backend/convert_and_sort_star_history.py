import os
import csv
import logging
from urllib.parse import urlparse

STAR_HISTORY_DIR = "star_history"
REPO_INDEX_FILE = "repo_index.csv"
CONVERTED_DIR = "frontend/public/converted_star_history"
OUTPUT_PCT_1D = "frontend/public/sorted_pct_1d.csv"
OUTPUT_PCT_5D = "frontend/public/sorted_pct_5d.csv"
OUTPUT_PCT_30D = "frontend/public/sorted_pct_30d.csv"
OUTPUT_RAW_1D = "frontend/public/sorted_raw_1d.csv"
OUTPUT_RAW_5D = "frontend/public/sorted_raw_5d.csv"
OUTPUT_RAW_30D = "frontend/public/sorted_raw_30d.csv"

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

        pct_30d = raw_30d = pct_1d = raw_1d = pct_5d = raw_5d = None
        max_5d_index = None

        if len(values) >= 2:
            for i in range(len(values)-1):
                if values[i] is not None and values[i+1] is not None:
                    diff = values[i+1] - values[i]
                    pct = ((diff) / values[i]) * 100 if values[i] > 0 else None
                    if pct_1d is None or pct > pct_1d:
                        pct_1d = pct
                    if raw_1d is None or diff > raw_1d:
                        raw_1d = diff

        if len(values) >= 6:
            for i in range(len(values) - 5):
                segment = values[i:i+6]
                if None in segment:
                    continue
                start, end = segment[0], segment[5]
                diff = end - start
                if start == 0:
                    continue
                pct = (diff / start) * 100
                if pct_5d is None or pct > pct_5d:
                    pct_5d = pct
                    max_5d_index = i
                if raw_5d is None or diff > raw_5d:
                    raw_5d = diff

        if len(values) >= 30:
            start_30d = values[-30]
            end_30d = values[-1]
            diff = end_30d - start_30d
            if start_30d > 0:
                pct_30d = (diff / start_30d) * 100
            raw_30d = diff

        repos_data.append({
            "name": repo_name,
            "current_stars": star_counts[repo_name],
            "pct_1d": pct_1d,
            "raw_1d": raw_1d,
            "pct_5d": pct_5d,
            "raw_5d": raw_5d,
            "pct_30d": pct_30d,
            "raw_30d": raw_30d,
            "max_5d_index": max_5d_index
        })

    def write_sorted_output(output_file, key, label):
        sorted_data = sorted(repos_data, key=lambda x: (x[key] is None, -x[key] if x[key] is not None else 0, x["name"]))
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(["repo_name", label, "current_stars"])
            for repo in sorted_data:
                writer.writerow([
                    repo["name"],
                    f"{repo[key]:.2f}" if repo[key] is not None else "",
                    repo["current_stars"]
                ])

    write_sorted_output(OUTPUT_PCT_1D, "pct_1d", "pct_1d_growth")
    write_sorted_output(OUTPUT_RAW_1D, "raw_1d", "raw_1d_growth")
    write_sorted_output(OUTPUT_PCT_5D, "pct_5d", "pct_5d_growth")
    write_sorted_output(OUTPUT_RAW_5D, "raw_5d", "raw_5d_growth")
    write_sorted_output(OUTPUT_PCT_30D, "pct_30d", "pct_30d_growth")
    write_sorted_output(OUTPUT_RAW_30D, "raw_30d", "raw_30d_growth")

    logging.info("Generated sorted CSVs for 1d, 5d, and 30d in both % and raw growth")

if __name__ == "__main__":
    main()