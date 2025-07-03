import { Repository } from '@/types/repository';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface RepositoryListProps {
  repositories: Repository[];
  growthMetricLabel: string;
  onFilterClick: () => void;
  visitedRepos: Set<string>;
  onRepoClick: (repoName: string) => void;
}

const RepositoryList: React.FC<RepositoryListProps> = ({
  repositories,
  growthMetricLabel,
  onFilterClick,
  visitedRepos,
  onRepoClick
}) => {
  const navigate = useNavigate();

  // Debug the repositories data
  console.log('RepositoryList received repositories:', repositories.length);
  console.log('First few repositories:', repositories.slice(0, 3));

  const handleRepoClick = (repo: Repository) => {
    console.log('🔥 CLICK HANDLER CALLED - START');
    console.log('🔥 Raw repo parameter:', repo);
    console.log('🔥 Type of repo:', typeof repo);
    console.log('🔥 Is repo null/undefined?', repo === null || repo === undefined);
    
    if (!repo) {
      console.error('🔥 ERROR: repo parameter is null/undefined');
      return;
    }
    
    console.log('🔥 repo.repo_name value:', repo.repo_name);
    console.log('🔥 repo.repo_name type:', typeof repo.repo_name);
    console.log('🔥 repo.repo_name stringified:', JSON.stringify(repo.repo_name));
    console.log('🔥 All repo keys:', Object.keys(repo || {}));
    
    // Check if repo_name exists and is not empty
    if (!repo.repo_name) {
      console.error('🔥 ERROR: repo_name is falsy:', repo.repo_name);
      console.error('🔥 Available repo properties:', Object.entries(repo));
      return;
    }
    
    // Check if repo_name contains slash
    if (!repo.repo_name.includes('/')) {
      console.error('🔥 ERROR: repo_name does not contain slash:', repo.repo_name);
      return;
    }
    
    const parts = repo.repo_name.split('/');
    console.log('🔥 Split parts:', parts);
    console.log('🔥 Parts length:', parts.length);
    
    if (parts.length !== 2) {
      console.error('🔥 ERROR: Invalid repository name format, expected 2 parts:', repo.repo_name);
      console.error('🔥 Got parts:', parts);
      return;
    }
    
    const [owner, name] = parts;
    console.log('🔥 Extracted owner:', JSON.stringify(owner));
    console.log('🔥 Extracted name:', JSON.stringify(name));
    console.log('🔥 Owner type:', typeof owner);
    console.log('🔥 Name type:', typeof name);
    console.log('🔥 Owner empty check:', owner === '' || !owner);
    console.log('🔥 Name empty check:', name === '' || !name);
    
    // Validate that both owner and name exist and are not empty
    if (!owner || !name || owner.trim() === '' || name.trim() === '') {
      console.error('🔥 ERROR: Missing or empty owner/name:', { owner, name });
      return;
    }
    
    console.log('🔥 SUCCESS: Valid owner/name extracted');
    console.log('🔥 About to navigate to:', `/repository/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`);
    console.log('🔥 Calling onRepoClick with:', repo.repo_name);
    
    onRepoClick(repo.repo_name);
    
    console.log('🔥 About to call navigate...');
    navigate(`/repository/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`);
    console.log('🔥 Navigate called successfully');
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
                  console.log('🔥 DIV CLICKED for repo:', repo.repo_name);
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