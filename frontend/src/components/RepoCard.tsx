import React from 'react';
import { Link } from 'react-router-dom';
import { Star, TrendingUp } from 'lucide-react';
import { Repository } from '../types';
import { isRepoVisited } from '../utils/localStorage';

interface RepoCardProps {
  repo: Repository;
}

export const RepoCard: React.FC<RepoCardProps> = ({ repo }) => {
  const visited = isRepoVisited(repo.repo_name);
  
  return (
    <Link
      to={`/repo/${repo.repo_name}`}
      className={`block p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
        visited ? 'bg-yellow-50 border-yellow-300' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 truncate">
          {repo.repo_name}
        </h3>
        {visited && (
          <div className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full">
            Visited
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span className="font-medium text-green-600">
            {repo.score.toFixed(2)}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-500" />
          <span className="font-medium">
            {repo.current_stars.toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  );
};