#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR" || exit

echo "----------------------------------------"
echo "Starting daily GitHub repo tracking"
echo "Date: $(date -u)"
echo "Script directory: $SCRIPT_DIR"
echo "Current directory: $(pwd)"
echo "----------------------------------------"

# Activate virtual environment
echo "Activating Python virtual environment..."
source "$SCRIPT_DIR/venv/bin/activate"

# Check if files exist in backend/utils directory
echo "Checking for required files in backend/utils directory..."
[ -f "$SCRIPT_DIR/backend/fetch_repos.py" ] || { echo "Error: fetch_repos.py not found"; exit 1; }
[ -f "$SCRIPT_DIR/backend/update_star_history.py" ] || { echo "Error: update_star_history.py not found"; exit 1; }
[ -f "$SCRIPT_DIR/backend/cleanup_old_repos.py" ] || { echo "Error: cleanup_old_repos.py not found"; exit 1; }
[ -f "$SCRIPT_DIR/backend/convert_and_sort_star_history.py" ] || { echo "Error: convert_and_sort_star_history.py not found"; exit 1; }

# Run scripts with correct paths
echo "Running repository discovery..."
python "$SCRIPT_DIR/backend/fetch_repos.py" || exit 1

echo "Updating star histories..."
python "$SCRIPT_DIR/backend/update_star_history.py" || exit 1

echo "Cleaning up old repositories..."
python "$SCRIPT_DIR/backend/cleanup_old_repos.py" || exit 1

echo "Converting and sorting star history..."
python "$SCRIPT_DIR/backend/convert_and_sort_star_history.py" || exit 1

echo "----------------------------------------"
echo "Daily tracking completed successfully"
echo "----------------------------------------"

# Start frontend
echo "Starting frontend..."
cd "$SCRIPT_DIR/frontend"
npm run dev &

# Optional: Open the frontend in browser (Mac-specific)
if command -v open &> /dev/null; then
    echo "Opening frontend in browser..."
    open http://localhost:8080
fi