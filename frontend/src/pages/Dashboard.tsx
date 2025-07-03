
import { useState, useEffect } from 'react';
import { Repository, FilterState, HistogramBin, GrowthMetric } from '@/types/repository';
import { loadRepositoryData } from '@/utils/dataLoader';
import { generateHistogram } from '@/utils/histogramUtils';
import { getDefaultFilters, applyFilters } from '@/utils/filterUtils';
import Histogram from '@/components/Histogram';
import Legend from '@/components/Legend';
import RepositoryList from '@/components/RepositoryList';
import HistogramFilterPanel from '@/components/HistogramFilterPanel';
import RepositoryListFilterPanel from '@/components/RepositoryListFilterPanel';

const Dashboard = () => {
  const [allRepositories, setAllRepositories] = useState<Repository[]>([]);
  const [filteredRepositories, setFilteredRepositories] = useState<Repository[]>([]);
  const [histogramBins, setHistogramBins] = useState<HistogramBin[]>([]);
  
  // Separate states for histogram and list filters
  const [histogramGrowthMetric, setHistogramGrowthMetric] = useState<GrowthMetric>({ type: '30d', format: 'pct' });
  const [listFilters, setListFilters] = useState<FilterState>(getDefaultFilters());
  
  const [showHistogramFilter, setShowHistogramFilter] = useState(false);
  const [showListFilter, setShowListFilter] = useState(false);
  const [visitedRepos, setVisitedRepos] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [dataKey, setDataKey] = useState(0);

  const histogramGrowthMetricLabel = `${histogramGrowthMetric.type === '30d' ? '30-Day' : 
                                        histogramGrowthMetric.type === '5d' ? '5-Day' :
                                        histogramGrowthMetric.type === '1d' ? '1-Day' :
                                        histogramGrowthMetric.type === 'post_5d' ? 'Post-Maximum 5-Day' :
                                        'Post-Day'} Growth (${histogramGrowthMetric.format === 'pct' ? '%' : 'Raw'})`;

  const listGrowthMetricLabel = `${listFilters.growthMetric.type === '30d' ? '30-Day' : 
                                   listFilters.growthMetric.type === '5d' ? '5-Day' :
                                   listFilters.growthMetric.type === '1d' ? '1-Day' :
                                   listFilters.growthMetric.type === 'post_5d' ? 'Post-Maximum 5-Day' :
                                   'Post-Day'} Growth (${listFilters.growthMetric.format === 'pct' ? '%' : 'Raw'})`;

  // Load histogram data when histogram growth metric changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadHistogramData();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [histogramGrowthMetric]);

  // Load repository list data when list filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadListData();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [listFilters.growthMetric]);

  // Apply filters to repository list when filters change
  useEffect(() => {
    if (allRepositories.length > 0) {
      const filtered = applyFilters(allRepositories, listFilters);
      setFilteredRepositories(filtered);
    }
  }, [allRepositories, listFilters]);

  const loadHistogramData = async () => {
    setLoading(true);
    
    try {
      const filename = `sorted_${histogramGrowthMetric.format}_${histogramGrowthMetric.type}${
        histogramGrowthMetric.day ? `_${histogramGrowthMetric.day}` : ''
      }`;
      
      const repos = await loadRepositoryData(filename);
      const bins = generateHistogram(repos);
      
      setTimeout(() => {
        setHistogramBins(bins);
        setDataKey(prev => prev + 1);
        setLoading(false);
      }, 0);
      
    } catch (error) {
      console.error('Error in loadHistogramData:', error);
      setLoading(false);
    }
  };

  const loadListData = async () => {
    try {
      const filename = `sorted_${listFilters.growthMetric.format}_${listFilters.growthMetric.type}${
        listFilters.growthMetric.day ? `_${listFilters.growthMetric.day}` : ''
      }`;
      
      const repos = await loadRepositoryData(filename);
      setAllRepositories(repos);
      
    } catch (error) {
      console.error('Error in loadListData:', error);
    }
  };

  const handleRepoClick = (repoName: string) => {
    setVisitedRepos(prev => new Set([...prev, repoName]));
  };

  // Handler for histogram filter changes (only growth metric)
  const handleHistogramFiltersChange = (filters: FilterState) => {
    setHistogramGrowthMetric(filters.growthMetric);
  };

  // Handler for repository list filter changes (all filters)
  const handleListFiltersChange = (filters: FilterState) => {
    setListFilters(filters);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Loading GitHub Star Tracker...</div>
          <div className="text-muted-foreground">Please wait while we load the repository data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" key={dataKey}>
      <div className="container mx-auto px-8 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">GitHub Star Tracker</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Histogram
              key={`histogram-${dataKey}`}
              bins={histogramBins}
              xAxisLabel={histogramGrowthMetricLabel}
              onFilterClick={() => setShowHistogramFilter(true)}
            />
          </div>
          <div>
            <Legend />
          </div>
        </div>
        
        <RepositoryList
          key={`list-${listFilters.growthMetric.type}-${listFilters.growthMetric.format}`}
          repositories={filteredRepositories}
          growthMetricLabel={listGrowthMetricLabel}
          onFilterClick={() => setShowListFilter(true)}
          visitedRepos={visitedRepos}
          onRepoClick={handleRepoClick}
        />
      </div>

      <HistogramFilterPanel
        isOpen={showHistogramFilter}
        onClose={() => setShowHistogramFilter(false)}
        filters={{ ...getDefaultFilters(), growthMetric: histogramGrowthMetric }}
        onFiltersChange={handleHistogramFiltersChange}
        title="Histogram Filters"
      />
      
      <RepositoryListFilterPanel
        isOpen={showListFilter}
        onClose={() => setShowListFilter(false)}
        filters={listFilters}
        onFiltersChange={handleListFiltersChange}
        title="Repository List Filters"
      />
    </div>
  );
};

export default Dashboard;