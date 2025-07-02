
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Repository, StarHistoryPoint } from '@/types/repository';
import { loadFilterData, loadStarHistory } from '@/utils/dataLoader';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import StarHistoryChart from '@/components/StarHistoryChart';

const RepositoryDetail = () => {
  const { owner, name } = useParams<{ owner: string; name: string }>();
  const navigate = useNavigate();
  const [repository, setRepository] = useState<Repository | null>(null);
  const [starHistory, setStarHistory] = useState<StarHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (owner && name) {
      loadRepositoryDetails();
    }
  }, [owner, name]);

  const loadRepositoryDetails = async () => {
    if (!owner || !name) return;
    
    setLoading(true);
    try {
      // Load repository metadata
      const allRepos = await loadFilterData();
      const repo = allRepos.find(r => r.full_name === `${owner}/${name}`);
      setRepository(repo || null);

      // Load star history
      const history = await loadStarHistory(owner, name);
      setStarHistory(history);
    } catch (error) {
      console.error('Error loading repository details:', error);
    }
    setLoading(false);
  };

  const handleClose = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Loading Repository Details...</div>
          <div className="text-muted-foreground">Please wait while we load the data</div>
        </div>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Repository Not Found</div>
          <div className="text-muted-foreground mb-4">
            Unable to find repository {owner}/{name}
          </div>
          <Button onClick={handleClose}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const formatLicense = (license: string) => {
    if (!license || license === 'NOASSERTION') return 'No License';
    if (!['MIT', 'Apache-2.0', 'GPL-3.0', 'AGPL-3.0'].includes(license)) return 'Other';
    return license;
  };

  const formatTopics = (topics: string) => {
    if (!topics.trim()) return 'None';
    const topicList = topics.split('|').filter(t => t.trim());
    if (topicList.length <= 3) return topicList.join(', ');
    return topicList.slice(0, 3).join(', ') + '...';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Repository Details</h1>
          <Button variant="ghost" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Repository Information */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <h2 className="text-xl font-semibold text-blue-600 mb-2">
                {repository.full_name}
              </h2>
              <a 
                href={repository.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 underline text-sm"
              >
                {repository.html_url}
              </a>
            </div>
            
            <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm font-medium text-gray-700">Stars</div>
                <div className="text-lg font-semibold">{repository.stargazers_count}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm font-medium text-gray-700">Forks</div>
                <div className="text-lg font-semibold">{repository.forks_count}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm font-medium text-gray-700">Last Push</div>
                <div className="text-sm">{formatDate(repository.pushed_at)}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm font-medium text-gray-700">Date Created</div>
                <div className="text-sm">{formatDate(repository.created_at)}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm font-medium text-gray-700">Topics</div>
                <div className="text-sm">{formatTopics(repository.topics)}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm font-medium text-gray-700">License</div>
                <div className="text-sm">{formatLicense(repository.license_spdx)}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm font-medium text-gray-700">Ownership</div>
                <div className="text-sm">{repository.owner_type}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm font-medium text-gray-700">Upcoming</div>
                <div className="text-sm">{repository.upcoming ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Star History Chart */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Star History</h3>
          <StarHistoryChart data={starHistory} />
        </div>
      </div>
    </div>
  );
};

export default RepositoryDetail;