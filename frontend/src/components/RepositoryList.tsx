
import { Repository } from '@/types/repository';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface RepositoryListProps {
  repositories: Repository[];
  growthMetricLabel: string;
  onFilterClick: () => void;
  visitedRepos: Set<string>;
  onRepoClick: (repoName: string) => void;
  isRawGrowth?: boolean;
}

const RepositoryList: React.FC<RepositoryListProps> = ({
  repositories,
  growthMetricLabel,
  onFilterClick,
  visitedRepos,
  onRepoClick,
  isRawGrowth = false
}) => {
  const navigate = useNavigate();

  const handleRepoClick = (repo: Repository) => {
    if (!repo) {
      return;
    }
    
    // Check if repo_name exists and is not empty
    if (!repo.repo_name) {
      return;
    }
    
    // Check if repo_name contains slash
    if (!repo.repo_name.includes('/')) {
      return;
    }
    
    const parts = repo.repo_name.split('/');
    
    if (parts.length !== 2) {
      return;
    }
    
    const [owner, name] = parts;
    
    // Validate that both owner and name exist and are not empty
    if (!owner || !name || owner.trim() === '' || name.trim() === '') {
      return;
    }
    
    onRepoClick(repo.repo_name);
    navigate(`/repository/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`);
  };

  const formatGrowthValue = (value: number | undefined) => {
    if (value === undefined || value === null) return '0';
    
    if (isRawGrowth) {
      return value.toFixed(0);
    } else {
      return value.toFixed(2) + '%';
    }
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
            const isVisited = visitedRepos.has(repo.repo_name);
            return (
              <div
                key={index}
                onClick={() => {
                  handleRepoClick(repo);
                }}
                className={`p-4 border rounded cursor-pointer hover:shadow-md transition-shadow ${
                  isVisited ? 'bg-yellow-50 border-yellow-200' : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-blue-600 hover:text-blue-800">
                  {repo.repo_name || 'Unknown Repository'}
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                  <span>Growth: {formatGrowthValue(repo.growth_value)}</span>
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