
import { Repository, StarHistoryPoint } from '@/types/repository';

export const parseCSV = (csvText: string): any[] => {
  console.log('parseCSV called with text length:', csvText.length);
  console.log('First 200 chars of CSV:', csvText.substring(0, 200));
  
  // Handle different line endings and split properly
  const lines = csvText.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  console.log('Number of lines:', lines.length);
  
  if (lines.length < 2) {
    console.log('Not enough lines in CSV');
    return [];
  }
  
  // Clean headers by removing any carriage returns
  const headers = lines[0].split(',').map(header => header.trim().replace(/\r/g, ''));
  console.log('Headers found (cleaned):', headers);
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
  
  console.log('Parsed data sample:', data.slice(0, 2));
  console.log('Sample row keys:', Object.keys(data[0] || {}));
  console.log('Sample row values for first item:', data[0]);
  return data;
};

export const loadRepositoryData = async (growthMetric: string): Promise<Repository[]> => {
  try {
    console.log('Loading repository data for:', growthMetric);
    const response = await fetch(`/${growthMetric}.csv`);
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const csvText = await response.text();
    
    // Check if we got HTML instead of CSV
    if (csvText.includes('<!DOCTYPE html>')) {
      console.error('Received HTML instead of CSV data');
      console.log('Response was HTML, not CSV');
      return [];
    }
    
    const rawData = parseCSV(csvText);
    
    console.log('=== DETAILED CSV ANALYSIS ===');
    console.log('Raw CSV data sample:', rawData.slice(0, 3));
    console.log('CSV headers:', Object.keys(rawData[0] || {}));
    console.log('Total rows parsed:', rawData.length);
    
    // Let's check each possible column name
    const firstRow = rawData[0] || {};
    console.log('Checking for repository name columns:');
    console.log('- repo_name:', firstRow.repo_name);
    console.log('- full_name:', firstRow.full_name);
    console.log('- repository:', firstRow.repository);
    console.log('- name:', firstRow.name);
    console.log('- All keys in first row:', Object.keys(firstRow));
    console.log('- First row values:', Object.values(firstRow));
    
    return rawData.map((row, index) => {
      // Enhanced debugging for each row
      if (index < 3) {
        console.log(`=== ROW ${index} ANALYSIS ===`);
        console.log(`Row ${index} data:`, row);
        console.log(`Row ${index} keys:`, Object.keys(row));
        
        // Try different possible column names
        const possibleRepoNames = [
          row.repo_name,
          row.full_name,
          row.repository,
          row.name,
          row.Repository,
          row.REPO_NAME,
          row.FULL_NAME
        ];
        
        console.log(`Possible repo names for row ${index}:`, possibleRepoNames);
      }
      
      // Try to extract repo name from various possible columns
      const repoName = row.repo_name || row.full_name || row.repository || row.name || '';
      
      console.log(`Final repo name for row ${index}: "${repoName}"`);
      
      // Validate that we have a proper repo name in owner/name format
      if (!repoName || !repoName.includes('/')) {
        console.warn(`Invalid or missing repo name for row ${index}:`, repoName);
        console.warn(`Row data:`, row);
      }
      
      const repository: Repository = {
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
        growth_value: parseFloat(row.pct_1d_growth || row.current_stars || '0'),
        current_stars: parseInt(row.current_stars || row.stargazers_count || '0')
      };
      
      if (index < 3) {
        console.log(`Final repository object for row ${index}:`, repository);
      }
      
      return repository;
    });
  } catch (error) {
    console.error('Error loading repository data:', error);
    return [];
  }
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