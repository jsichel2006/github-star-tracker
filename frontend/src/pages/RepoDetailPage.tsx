import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Github, Star, TrendingUp, ExternalLink } from 'lucide-react';
import { StarHistoryPoint } from '../types';
import { parseStarHistory } from '../utils/csvParser';
import { markRepoAsVisited } from '../utils/localStorage';
import { StarChart } from '../components/StarChart';

const RepoDetailPage: React.FC = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const [starHistory, setStarHistory] = useState<StarHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const repoName = `${owner}/${repo}`;
  const githubUrl = `https://github.com/${repoName}`;

  useEffect(() => {
    if (!owner || !repo) return;

    // Mark repo as visited
    markRepoAsVisited(repoName);

    const fetchStarHistory = async () => {
      try {
        console.log(`Fetching star history for ${repoName}...`);
        const response = await fetch(`/converted_star_history/${owner}/${repo}.csv`);
        if (!response.ok) {
          throw new Error(`Failed to fetch star history: ${response.status}`);
        }
        const csvText = await response.text();
        console.log('Star history CSV data fetched, parsing...');
        const history = parseStarHistory(csvText);
        console.log(`Parsed ${history.length} data points`);
        setStarHistory(history);
      } catch (err) {
        console.error('Error fetching star history:', err);
        setError(err instanceof Error ? err.message : 'Failed to load star history');
      } finally {
        setLoading(false);
      }
    };

    fetchStarHistory();
  }, [owner, repo, repoName]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading star history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to repositories
          </Link>
          
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
      </div>
    );
  }

  const currentStars = starHistory.length > 0 ? starHistory[starHistory.length - 1].stars : 0;
  const initialStars = starHistory.length > 0 ? starHistory[0].stars : 0;
  const starGrowth = currentStars - initialStars;
  const growthPercentage = initialStars > 0 ? ((starGrowth / initialStars) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Navigation */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to repositories
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{repoName}</h1>
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-lg transition-colors"
              >
                <Github className="w-5 h-5" />
                View on GitHub
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center border-l-4 border-blue-500">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-600">Current Stars</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{currentStars.toLocaleString()}</p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 text-center border-l-4 border-green-500">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-600">30-Day Growth</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  +{starGrowth.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 font-medium">
                  {growthPercentage > 0 ? `+${growthPercentage.toFixed(1)}%` : '0%'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Star History (Past 30 Days)
          </h2>
          
          {starHistory.length > 0 ? (
            <StarChart data={starHistory} />
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No star history data available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RepoDetailPage;