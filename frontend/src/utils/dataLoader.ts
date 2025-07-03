import { Repository, StarHistoryPoint } from '@/types/repository';

export const parseCSV = (csvText: string): any[] => {
  const lines = csvText.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  
  if (lines.length < 2) {
    return [];
  }
  
  const headers = lines[0].split(',').map(header => header.trim().replace(/\r/g, ''));
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row: any = {};
    
    headers.forEach((header, index) => {
      const value = values[index]?.trim().replace(/\r/g, '');
      row[header] = value;
    });
    
    data.push(row);
  }
  
  return data;
};

export const loadRepositoryData = async (growthMetric: string): Promise<Repository[]> => {
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
      
      const response = await fetch(`/${growthMetric}.csv`, {
        headers: {
          'Accept': 'text/csv, text/plain, */*',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      
      if (csvText.includes('<!DOCTYPE html>')) {
        if (attempt === maxRetries) {
          return [];
        }
        continue;
      }
      
      const rawData = parseCSV(csvText);
      
      return rawData.map(row => {
        const repoName = row.repo_name || row.full_name || row.repository || row.name || '';
        
        let growthValue = 0;
        if (row.pct_30d_growth) {
          growthValue = parseFloat(row.pct_30d_growth);
        } else if (row.pct_5d_growth) {
          growthValue = parseFloat(row.pct_5d_growth);
        } else if (row.pct_1d_growth) {
          growthValue = parseFloat(row.pct_1d_growth);
        } else if (row.growth_value) {
          growthValue = parseFloat(row.growth_value);
        }
        
        return {
          repo_name: repoName,
          html_url: `https://github.com/${repoName}`,
          created_at: row.created_at || '',
          stargazers_count: parseInt(row.current_stars || row.stargazers_count || '0'),
          pushed_at: row.pushed_at || '',
          forks_count: parseInt(row.forks_count || '0'),
          topics: row.topics || '',
          license_spdx: row.license_spdx || '',
          owner_type: row.owner_type || 'User',
          upcoming: row.upcoming === 'true',
          growth_value: growthValue,
          current_stars: parseInt(row.current_stars || row.stargazers_count || '0')
        };
      });
      
    } catch (error) {
      if (attempt === maxRetries) {
        return [];
      }
    }
  }
  
  return [];
};

export const loadFilterData = async (): Promise<Repository[]> => {
  try {
    console.log('Loading filter data from repo_filters.csv');
    const response = await fetch('/repo_filters.csv');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const csvText = await response.text();
    
    // Check if we got HTML instead of CSV
    if (csvText.includes('<!DOCTYPE html>')) {
      console.error('Received HTML instead of CSV data for repo_filters');
      return [];
    }
    
    const rawData = parseCSV(csvText);
    
    return rawData.map(row => ({
      repo_name: row.repo_name || '',
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
    console.log('Loading star history for:', `${owner}/${name}`);
    // Updated path to match your file structure: converted_star_history/[owner]/[repo_name].csv
    const response = await fetch(`/converted_star_history/${owner}/${name}.csv`);
    console.log('Star history response status:', response.status);
    
    if (!response.ok) {
      console.warn(`Star history not found for ${owner}/${name}, status: ${response.status}`);
      return [];
    }
    const csvText = await response.text();
    console.log('Star history CSV length:', csvText.length);
    console.log('Star history CSV preview:', csvText.substring(0, 100));
    
    // Check if we got HTML instead of CSV
    if (csvText.includes('<!DOCTYPE html>')) {
      console.error('Received HTML instead of CSV data for star history');
      return [];
    }
    
    const rawData = parseCSV(csvText);
    
    const starHistory = rawData.map(row => ({
      date: row.date || '',
      stars: parseInt(row.stars || '0')
    }));
    
    console.log('Parsed star history:', starHistory.length, 'data points');
    console.log('Star history sample:', starHistory.slice(0, 3));
    return starHistory;
  } catch (error) {
    console.error('Error loading star history:', error);
    return [];
  }
};