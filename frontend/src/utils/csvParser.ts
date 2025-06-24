export const parseRepositoryList = (csvText: string): Array<{repo_name: string, score: number, current_stars: number}> => {
  const lines = csvText.trim().split('\n');
  const repositories = [];
  
  for (let i = 1; i < lines.length; i++) { // Skip header
    const line = lines[i].trim();
    if (line) {
      const [repo_name, scoreStr, starsStr] = line.split(',');
      repositories.push({
        repo_name: repo_name,
        score: parseFloat(scoreStr),
        current_stars: parseInt(starsStr)
      });
    }
  }
  
  return repositories;
};

export const parseStarHistory = (csvText: string): Array<{date: string, stars: number}> => {
  const lines = csvText.trim().split('\n');
  const history = [];
  
  for (let i = 1; i < lines.length; i++) { // Skip header
    const line = lines[i].trim();
    if (line) {
      const [date, starsStr] = line.split(',');
      history.push({
        date: date,
        stars: parseInt(starsStr)
      });
    }
  }
  
  return history;
};