
import { Repository, StarHistoryPoint } from '@/types/repository';

export const parseCSV = (csvText: string): any[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',');
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row: any = {};
    
    headers.forEach((header, index) => {
      const value = values[index]?.trim();
      row[header] = value;
    });
    
    data.push(row);
  }
  
  return data;
};

export const loadRepositoryData = async (growthMetric: string): Promise<Repository[]> => {
  try {
    const response = await fetch(`/public/${growthMetric}.csv`);
    const csvText = await response.text();
    const rawData = parseCSV(csvText);
    
    return rawData.map(row => ({
      full_name: row.repo_name || row.full_name || '',
      html_url: `https://github.com/${row.repo_name || row.full_name || ''}`,
      created_at: row.created_at || '',
      stargazers_count: parseInt(row.current_stars || row.stargazers_count || '0'),
      pushed_at: row.pushed_at || '',
      forks_count: parseInt(row.forks_count || '0'),
      topics: row.topics || '',
      license_spdx: row.license_spdx || '',
      owner_type: row.owner_type || 'User',
      upcoming: row.upcoming === 'true',
      growth_value: parseFloat(row.pct_1d_growth || row.current_stars || '0'),
      current_stars: parseInt(row.current_stars || row.stargazers_count || '0')
    }));
  } catch (error) {
    console.error('Error loading repository data:', error);
    return [];
  }
};

export const loadFilterData = async (): Promise<Repository[]> => {
  try {
    const response = await fetch('/public/repo_filters.csv');
    const csvText = await response.text();
    const rawData = parseCSV(csvText);
    
    return rawData.map(row => ({
      full_name: row.full_name || '',
      html_url: row.html_url || '',
      created_at: row.created_at || '',
      stargazers_count: parseInt(row.stargazers_count || '0'),
      pushed_at: row.pushed_at || '',
      forks_count: parseInt(row.forks_count || '0'),
      topics: row.topics || '',
      license_spdx: row.license_spdx || '',
      owner_type: row.owner_type || 'User',
      upcoming: row.upcoming === 'true'
    }));
  } catch (error) {
    console.error('Error loading filter data:', error);
    return [];
  }
};

export const loadStarHistory = async (owner: string, name: string): Promise<StarHistoryPoint[]> => {
  try {
    const response = await fetch(`/public/converted_star_history/${owner}/${name}.csv`);
    const csvText = await response.text();
    const rawData = parseCSV(csvText);
    
    return rawData.map(row => ({
      date: row.date || '',
      stars: parseInt(row.stars || '0')
    }));
  } catch (error) {
    console.error('Error loading star history:', error);
    return [];
  }
};