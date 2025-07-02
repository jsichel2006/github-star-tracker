
import { Repository } from '@/types/repository';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface RepositoryListProps {
  repositories: Repository[];
  growthMetricLabel: string;
  onFilterClick: () => void;
  visitedRepos: Set<string>;
  onRepoClick: (fullName: string) => void;
}

const RepositoryList: React.FC<RepositoryListProps> = ({
  repositories,
  growthMetricLabel,
  onFilterClick,
  visitedRepos,
  onRepoClick
}) => {
  const navigate = useNavigate();

  const handleRepoClick = (repo: Repository) => {
    const [owner, name] = repo.full_name.split('/');
    onRepoClick(repo.full_name);
    navigate(`/repository/${owner}/${name}`);
  };

  return (
    <div className="w-full">
      <div className="border-t pt-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold">
              Repository List: Sorted by {growthMetricLabel}
            </h2>
            <span className="text-muted-foreground">
              ({repositories.length} repositories)
            </span>
          </div>
          <Button variant="outline" onClick={onFilterClick}>
            Sort & Filter
          </Button>
        </div>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {repositories.map((repo, index) => {
            const isVisited = visitedRepos.has(repo.full_name);
            return (
              <div
                key={index}
                onClick={() => handleRepoClick(repo)}
                className={`p-4 border rounded cursor-pointer hover:shadow-md transition-shadow ${
                  isVisited ? 'bg-yellow-50 border-yellow-200' : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-blue-600 hover:text-blue-800">
                  {repo.full_name}
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                  <span>Growth: {repo.growth_value?.toFixed(2)}%</span>
                  <span>Stars: {repo.current_stars || repo.stargazers_count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RepositoryList;