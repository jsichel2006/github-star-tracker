import React, { useState, useEffect } from 'react';
import { Github, TrendingUp } from 'lucide-react';
import { Repository } from '../types';
import { parseRepositoryList } from '../utils/csvParser';
import { VirtualizedRepoList } from '../components/VirtualizedRepoList';

const HomePage: React.FC = () => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        console.log('Fetching repository list...');
        const response = await fetch('/converted_sorted_growth_30d.csv');
        if (!response.ok) {
          throw new Error(`Failed to fetch repository list: ${response.status}`);
        }
        const csvText = await response.text();
        console.log('CSV data fetched, parsing...');
        const repos = parseRepositoryList(csvText);
        console.log(`Parsed ${repos.length} repositories`);
        setRepositories(repos);
      } catch (err) {
        console.error('Error fetching repositories:', err);
        setError(err instanceof Error ? err.message : 'Failed to load repositories');
      } finally {
        setLoading(false);
      }
    };

    fetchRepositories();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading repositories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Github className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              GitHub Monthly Star History
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Discover trending open-source repositories based on their star growth over the past 30 days
          </p>
        </div>

        {/* Repository List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Trending Repositories
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({repositories.length} total)
            </span>
          </h2>
          
          <VirtualizedRepoList repositories={repositories} />
        </div>
      </div>
    </div>
  );
};

export default HomePage;