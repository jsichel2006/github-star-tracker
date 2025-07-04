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
      
      // Load growth data from sorting CSV
      console.log(`Loading growth data from ${growthMetric}.csv`);
      const growthResponse = await fetch(`/${growthMetric}.csv`, {
        headers: {
          'Accept': 'text/csv, text/plain, */*',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!growthResponse.ok) {
        throw new Error(`HTTP error! status: ${growthResponse.status}`);
      }
      
      const growthCsvText = await growthResponse.text();
      
      if (growthCsvText.includes('<!DOCTYPE html>')) {
        if (attempt === maxRetries) {
          return [];
        }
        continue;
      }
      
      const growthData = parseCSV(growthCsvText);
      console.log(`Loaded ${growthData.length} repositories from growth CSV`);
      
      // Load complete repository metadata
      console.log('Loading complete repository metadata from repo_filters.csv');
      const filterResponse = await fetch('/repo_filters.csv');
      if (!filterResponse.ok) {
        console.warn('Could not load repo_filters.csv, using growth data only');
        // Fallback to old behavior if filter data unavailable
        return growthData.map(row => {
          const repoName = row.repo_name || row.full_name || row.repository || row.name || '';
          
          let growthValue = 0;
          
          if (row.raw_30d_growth) {
            growthValue = parseFloat(row.raw_30d_growth);
          } else if (row.raw_5d_growth) {
            growthValue = parseFloat(row.raw_5d_growth);
          } else if (row.raw_1d_growth) {
            growthValue = parseFloat(row.raw_1d_growth);
          } else if (row.post_raw_5d_growth) {
            growthValue = parseFloat(row.post_raw_5d_growth);
          } else if (row.post_raw_day_growth) {
            growthValue = parseFloat(row.post_raw_day_growth);
          }
          else {
            for (let day = 1; day <= 29; day++) {
              if (row[`raw_post_day_${day}_growth`]) {
                growthValue = parseFloat(row[`raw_post_day_${day}_growth`]);
                break;
              }
            }
          }
          
          if (growthValue === 0) {
            if (row.pct_30d_growth) {
              growthValue = parseFloat(row.pct_30d_growth);
            } else if (row.pct_5d_growth) {
              growthValue = parseFloat(row.pct_5d_growth);
            } else if (row.pct_1d_growth) {
              growthValue = parseFloat(row.pct_1d_growth);
            } else if (row.post_pct_5d_growth) {
              growthValue = parseFloat(row.post_pct_5d_growth);
            } else if (row.post_pct_day_growth) {
              growthValue = parseFloat(row.post_pct_day_growth);
            }
            else {
              for (let day = 1; day <= 29; day++) {
                if (row[`pct_post_day_${day}_growth`]) {
                  growthValue = parseFloat(row[`pct_post_day_${day}_growth`]);
                  break;
                }
              }
            }
            
            if (growthValue === 0 && row.growth_value) {
              growthValue = parseFloat(row.growth_value);
            }
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
      }
      
      const filterCsvText = await filterResponse.text();
      
      if (filterCsvText.includes('<!DOCTYPE html>')) {
        console.warn('Received HTML instead of CSV for repo_filters');
        // Fallback to growth data only - same logic as above
        return growthData.map(row => {
          const repoName = row.repo_name || row.full_name || row.repository || row.name || '';
          
          let growthValue = 0;
          
          if (row.raw_30d_growth) {
            growthValue = parseFloat(row.raw_30d_growth);
          } else if (row.raw_5d_growth) {
            growthValue = parseFloat(row.raw_5d_growth);
          } else if (row.raw_1d_growth) {
            growthValue = parseFloat(row.raw_1d_growth);
          } else if (row.post_raw_5d_growth) {
            growthValue = parseFloat(row.post_raw_5d_growth);
          } else if (row.post_raw_day_growth) {
            growthValue = parseFloat(row.post_raw_day_growth);
          }
          else {
            for (let day = 1; day <= 29; day++) {
              if (row[`raw_post_day_${day}_growth`]) {
                growthValue = parseFloat(row[`raw_post_day_${day}_growth`]);
                break;
              }
            }
          }
          
          if (growthValue === 0) {
            if (row.pct_30d_growth) {
              growthValue = parseFloat(row.pct_30d_growth);
            } else if (row.pct_5d_growth) {
              growthValue = parseFloat(row.pct_5d_growth);
            } else if (row.pct_1d_growth) {
              growthValue = parseFloat(row.pct_1d_growth);
            } else if (row.post_pct_5d_growth) {
              growthValue = parseFloat(row.post_pct_5d_growth);
            } else if (row.post_pct_day_growth) {
              growthValue = parseFloat(row.post_pct_day_growth);
            }
            else {
              for (let day = 1; day <= 29; day++) {
                if (row[`pct_post_day_${day}_growth`]) {
                  growthValue = parseFloat(row[`pct_post_day_${day}_growth`]);
                  break;
                }
              }
            }
            
            if (growthValue === 0 && row.growth_value) {
              growthValue = parseFloat(row.growth_value);
            }
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
      }
      
      const filterData = parseCSV(filterCsvText);
      console.log(`Loaded ${filterData.length} repositories from filter CSV`);
      
      // Create a map of repo metadata for quick lookup
      const repoMetadataMap = new Map<string, any>();
      filterData.forEach(repo => {
        if (repo.repo_name) {
          repoMetadataMap.set(repo.repo_name, repo);
        }
      });
      
      // Merge growth data with complete repository metadata
      // Keep ALL repositories from growth data, enhance with metadata when available
      const mergedData = growthData.map(growthRow => {
        const repoName = growthRow.repo_name || growthRow.full_name || growthRow.repository || growthRow.name || '';
        const metadata = repoMetadataMap.get(repoName); // This may be undefined, and that's OK
        
        let growthValue = 0;
        
        if (growthRow.raw_30d_growth) {
          growthValue = parseFloat(growthRow.raw_30d_growth);
        } else if (growthRow.raw_5d_growth) {
          growthValue = parseFloat(growthRow.raw_5d_growth);
        } else if (growthRow.raw_1d_growth) {
          growthValue = parseFloat(growthRow.raw_1d_growth);
        } else if (growthRow.post_raw_5d_growth) {
          growthValue = parseFloat(growthRow.post_raw_5d_growth);
        } else if (growthRow.post_raw_day_growth) {
          growthValue = parseFloat(growthRow.post_raw_day_growth);
        }
        else {
          for (let day = 1; day <= 29; day++) {
            if (growthRow[`raw_post_day_${day}_growth`]) {
              growthValue = parseFloat(growthRow[`raw_post_day_${day}_growth`]);
              break;
            }
          }
        }
        
        if (growthValue === 0) {
          if (growthRow.pct_30d_growth) {
            growthValue = parseFloat(growthRow.pct_30d_growth);
          } else if (growthRow.pct_5d_growth) {
            growthValue = parseFloat(growthRow.pct_5d_growth);
          } else if (growthRow.pct_1d_growth) {
            growthValue = parseFloat(growthRow.pct_1d_growth);
          } else if (growthRow.post_pct_5d_growth) {
            growthValue = parseFloat(growthRow.post_pct_5d_growth);
          } else if (growthRow.post_pct_day_growth) {
            growthValue = parseFloat(growthRow.post_pct_day_growth);
          }
          else {
            for (let day = 1; day <= 29; day++) {
              if (growthRow[`pct_post_day_${day}_growth`]) {
                growthValue = parseFloat(growthRow[`pct_post_day_${day}_growth`]);
                break;
              }
            }
          }
          
          if (growthValue === 0 && growthRow.growth_value) {
            growthValue = parseFloat(growthRow.growth_value);
          }
        }
        
        // Use metadata if available, otherwise fall back to growth data or defaults
        return {
          repo_name: repoName,
          html_url: metadata?.html_url || `https://github.com/${repoName}`,
          created_at: metadata?.created_at || growthRow.created_at || '',
          stargazers_count: parseInt(growthRow.current_stars || metadata?.stargazers_count || growthRow.stargazers_count || '0'),
          pushed_at: metadata?.pushed_at || growthRow.pushed_at || '',
          forks_count: parseInt(metadata?.forks_count || growthRow.forks_count || '0'),
          topics: metadata?.topics || growthRow.topics || '',
          license_spdx: metadata?.license_spdx || growthRow.license_spdx || '',
          owner_type: metadata?.owner_type || growthRow.owner_type || 'User',
          upcoming: (metadata?.upcoming === 'true' || metadata?.upcoming === true) || (growthRow.upcoming === 'true' || growthRow.upcoming === true),
          growth_value: growthValue,
          current_stars: parseInt(growthRow.current_stars || metadata?.stargazers_count || growthRow.stargazers_count || '0')
        };
      });
      
      console.log(`Successfully merged data for ${mergedData.length} repositories`);
      console.log('Sample merged repository:', mergedData[0]);
      
      // Count how many had metadata vs didn't
      const withMetadata = mergedData.filter(repo => repoMetadataMap.has(repo.repo_name)).length;
      const withoutMetadata = mergedData.length - withMetadata;
      console.log(`Repositories with metadata: ${withMetadata}, without metadata: ${withoutMetadata}`);
      
      return mergedData;
      
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
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