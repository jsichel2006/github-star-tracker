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
python "$SCRIPT_DIR/backend/fetch_repos.py"
if [ $? -ne 0 ]; then
    echo "Error: Failed to fetch repositories"
    exit 1
fi

echo "Updating star histories..."
python "$SCRIPT_DIR/backend/update_star_history.py"
if [ $? -ne 0 ]; then
    echo "Error: Failed to update star history"
    exit 1
fi

echo "Cleaning up old repositories..."
python "$SCRIPT_DIR/backend/cleanup_old_repos.py"
if [ $? -ne 0 ]; then
    echo "Error: Failed to clean up old repositories"
    exit 1
fi

echo "Converting and sorting star history..."
python "$SCRIPT_DIR/backend/convert_and_sort_star_history.py"
if [ $? -ne 0 ]; then
    echo "Error: Failed to convert and sort star history"
    exit 1
fi

echo "----------------------------------------"
echo "Daily tracking completed successfully"
echo "----------------------------------------"