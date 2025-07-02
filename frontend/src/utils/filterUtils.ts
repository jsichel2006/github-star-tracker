
import { Repository, FilterState } from '@/types/repository';

export const applyFilters = (repositories: Repository[], filters: FilterState): Repository[] => {
  return repositories.filter(repo => {
    // Stars filter
    if (repo.stargazers_count < filters.stars[0] || repo.stargazers_count > filters.stars[1]) {
      return false;
    }
    
    // Forks filter
    if (repo.forks_count < filters.forks[0] || repo.forks_count > filters.forks[1]) {
      return false;
    }
    
    // Date filters
    const createdDate = new Date(repo.created_at);
    const pushedDate = new Date(repo.pushed_at);
    const startCreated = new Date(filters.dateCreated[0]);
    const endCreated = new Date(filters.dateCreated[1]);
    const startPushed = new Date(filters.lastPush[0]);
    const endPushed = new Date(filters.lastPush[1]);
    
    if (createdDate < startCreated || createdDate > endCreated) {
      return false;
    }
    
    if (pushedDate < startPushed || pushedDate > endPushed) {
      return false;
    }
    
    // Topics filter
    const repoTopics = repo.topics.toLowerCase().split('|').filter(t => t.trim());
    
    if (filters.includeTopics.length > 0) {
      const hasIncludedTopic = filters.includeTopics.some(topic => 
        repoTopics.includes(topic.toLowerCase())
      );
      if (!hasIncludedTopic) return false;
    }
    
    if (filters.excludeTopics.length > 0) {
      const hasExcludedTopic = filters.excludeTopics.some(topic => 
        repoTopics.includes(topic.toLowerCase())
      );
      if (hasExcludedTopic) return false;
    }
    
    // License filter
    if (filters.licenses.length > 0) {
      let repoLicense = repo.license_spdx;
      if (!repoLicense || repoLicense === 'NOASSERTION') {
        repoLicense = 'No License';
      } else if (!['MIT', 'Apache-2.0', 'GPL-3.0', 'AGPL-3.0'].includes(repoLicense)) {
        repoLicense = 'Other';
      }
      
      if (!filters.licenses.includes(repoLicense)) {
        return false;
      }
    }
    
    // Ownership filter
    if (filters.ownership.length > 0 && !filters.ownership.includes(repo.owner_type)) {
      return false;
    }
    
    // Upcoming filter
    if (filters.upcoming !== null && repo.upcoming !== filters.upcoming) {
      return false;
    }
    
    return true;
  });
};

export const getDefaultFilters = (): FilterState => {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return {
    growthMetric: { type: '30d', format: 'pct' },
    stars: [250, 5000],
    forks: [0, 2000],
    lastPush: [oneYearAgo.toISOString().split('T')[0], yesterday.toISOString().split('T')[0]],
    dateCreated: [oneYearAgo.toISOString().split('T')[0], thirtyDaysAgo.toISOString().split('T')[0]],
    includeTopics: [],
    excludeTopics: [],
    licenses: ['MIT', 'Apache-2.0', 'GPL-3.0', 'AGPL-3.0', 'No License', 'Other'],
    ownership: ['User', 'Organization'],
    upcoming: null
  };
};