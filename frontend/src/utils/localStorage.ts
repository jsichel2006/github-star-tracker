const VISITED_REPOS_KEY = 'visitedRepos';

export const getVisitedRepos = (): Set<string> => {
  try {
    const visited = localStorage.getItem(VISITED_REPOS_KEY);
    return visited ? new Set(JSON.parse(visited)) : new Set();
  } catch {
    return new Set();
  }
};

export const markRepoAsVisited = (repoName: string): void => {
  try {
    const visited = getVisitedRepos();
    visited.add(repoName);
    localStorage.setItem(VISITED_REPOS_KEY, JSON.stringify([...visited]));
  } catch (error) {
    console.error('Failed to save visited repo:', error);
  }
};

export const isRepoVisited = (repoName: string): boolean => {
  return getVisitedRepos().has(repoName);
};