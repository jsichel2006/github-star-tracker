import { useState, useEffect } from 'react';
import { Repository, FilterState, HistogramBin } from '@/types/repository';
import { loadRepositoryData } from '@/utils/dataLoader';
import { generateHistogram } from '@/utils/histogramUtils';
import { getDefaultFilters } from '@/utils/filterUtils';
import Histogram from '@/components/Histogram';
import Legend from '@/components/Legend';
import RepositoryList from '@/components/RepositoryList';
import FilterPanel from '@/components/FilterPanel';

const Dashboard = () => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [histogramBins, setHistogramBins] = useState<HistogramBin[]>([]);
  const [filters, setFilters] = useState<FilterState>(getDefaultFilters());
  const [showHistogramFilter, setShowHistogramFilter] = useState(false);
  const [showListFilter, setShowListFilter] = useState(false);
  const [visitedRepos, setVisitedRepos] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [dataKey, setDataKey] = useState(0);

  const growthMetricLabel = `${filters.growthMetric.type === '30d' ? '30-Day' : 
                               filters.growthMetric.type === '5d' ? '5-Day' :
                               filters.growthMetric.type === '1d' ? '1-Day' :
                               filters.growthMetric.type === 'post_5d' ? 'Post-Maximum 5-Day' :
                               'Post-Day'} Growth (${filters.growthMetric.format === 'pct' ? '%' : 'Raw'})`;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadData();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [filters.growthMetric]);

  const loadData = async () => {
    setLoading(true);
    
    try {
      const filename = `sorted_${filters.growthMetric.format}_${filters.growthMetric.type}${
        filters.growthMetric.day ? `_${filters.growthMetric.day}` : ''
      }`;
      
      const repos = await loadRepositoryData(filename);
      const bins = generateHistogram(repos);
      
      setTimeout(() => {
        setRepositories(repos);
        setHistogramBins(bins);
        setDataKey(prev => prev + 1);
        setLoading(false);
      }, 0);
      
    } catch (error) {
      console.error('Error in loadData:', error);
      setLoading(false);
    }
  };

  const handleRepoClick = (repoName: string) => {
    setVisitedRepos(prev => new Set([...prev, repoName]));
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
              xAxisLabel={growthMetricLabel}
              onFilterClick={() => setShowHistogramFilter(true)}
            />
          </div>
          <div>
            <Legend />
          </div>
        </div>
        
        <RepositoryList
          key={`list-${dataKey}`}
          repositories={repositories}
          growthMetricLabel={growthMetricLabel}
          onFilterClick={() => setShowListFilter(true)}
          visitedRepos={visitedRepos}
          onRepoClick={handleRepoClick}
        />
      </div>

      <FilterPanel
        isOpen={showHistogramFilter}
        onClose={() => setShowHistogramFilter(false)}
        filters={filters}
        onFiltersChange={setFilters}
        title="Histogram Filters"
      />
      
      <FilterPanel
        isOpen={showListFilter}
        onClose={() => setShowListFilter(false)}
        filters={filters}
        onFiltersChange={setFilters}
        title="Repository List Filters"
      />
    </div>
  );
};

export default Dashboard;