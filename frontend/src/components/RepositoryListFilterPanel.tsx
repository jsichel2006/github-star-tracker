import { useState } from 'react';
import { FilterState } from '@/types/repository';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { X, ChevronDown, ChevronUp, Check } from 'lucide-react';

interface RepositoryListFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  title: string;
}

const RepositoryListFilterPanel: React.FC<RepositoryListFilterPanelProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  title
}) => {
  const [tempFilters, setTempFilters] = useState<FilterState>(filters);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [newIncludeTopic, setNewIncludeTopic] = useState('');
  const [newExcludeTopic, setNewExcludeTopic] = useState('');

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const handleApply = () => {
    onFiltersChange(tempFilters);
    onClose();
  };

  const addTopic = (type: 'include' | 'exclude') => {
    const topic = type === 'include' ? newIncludeTopic : newExcludeTopic;
    if (!topic.trim()) return;

    setTempFilters(prev => ({
      ...prev,
      [type === 'include' ? 'includeTopics' : 'excludeTopics']: [
        ...prev[type === 'include' ? 'includeTopics' : 'excludeTopics'],
        topic.trim()
      ]
    }));

    if (type === 'include') {
      setNewIncludeTopic('');
    } else {
      setNewExcludeTopic('');
    }
  };

  const removeTopic = (type: 'include' | 'exclude', index: number) => {
    setTempFilters(prev => ({
      ...prev,
      [type === 'include' ? 'includeTopics' : 'excludeTopics']: 
        prev[type === 'include' ? 'includeTopics' : 'excludeTopics'].filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="w-80 bg-white shadow-xl border-r h-full overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Growth Metrics */}
          <div>
            <button
              onClick={() => toggleSection('growth')}
              className="flex items-center justify-between w-full text-left font-medium"
            >
              Growth Metrics
              {expandedSections.has('growth') ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </button>
            
            {expandedSections.has('growth') && (
              <div className="mt-2 space-y-3">
                <div className="flex space-x-2">
                  <Button
                    variant={tempFilters.growthMetric.format === 'pct' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTempFilters(prev => ({
                      ...prev,
                      growthMetric: { ...prev.growthMetric, format: 'pct' }
                    }))}
                  >
                    %
                  </Button>
                  <Button
                    variant={tempFilters.growthMetric.format === 'raw' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTempFilters(prev => ({
                      ...prev,
                      growthMetric: { ...prev.growthMetric, format: 'raw' }
                    }))}
                  >
                    Raw
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {[
                    { type: '30d', label: '30-Day' },
                    { type: '5d', label: '5-Day' },
                    { type: '1d', label: '1-Day' },
                    { type: 'post_5d', label: 'Post-Maximum 5-Day' },
                    { type: 'post_day', label: 'Post-Day __' }
                  ].map(metric => (
                    <div key={metric.type} className="flex items-center space-x-2">
                      <Checkbox
                        checked={tempFilters.growthMetric.type === metric.type}
                        onCheckedChange={() => setTempFilters(prev => ({
                          ...prev,
                          growthMetric: { ...prev.growthMetric, type: metric.type as any }
                        }))}
                      />
                      <label className="text-sm">{metric.label}</label>
                    </div>
                  ))}
                </div>
                
                {tempFilters.growthMetric.type === 'post_day' && (
                  <div>
                    <label className="text-sm font-medium">Day: {tempFilters.growthMetric.day || 1}</label>
                    <Slider
                      value={[tempFilters.growthMetric.day || 1]}
                      onValueChange={([value]) => setTempFilters(prev => ({
                        ...prev,
                        growthMetric: { ...prev.growthMetric, day: value }
                      }))}
                      min={1}
                      max={30}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stars */}
          <div>
            <button
              onClick={() => toggleSection('stars')}
              className="flex items-center justify-between w-full text-left font-medium"
            >
              Stars
              {expandedSections.has('stars') ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </button>
            
            {expandedSections.has('stars') && (
              <div className="mt-2">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>{tempFilters.stars[0]}</span>
                  <span>{tempFilters.stars[1]}</span>
                </div>
                <Slider
                  value={tempFilters.stars}
                  onValueChange={(value) => setTempFilters(prev => ({
                    ...prev,
                    stars: value as [number, number]
                  }))}
                  min={250}
                  max={5000}
                  step={50}
                />
              </div>
            )}
          </div>

          {/* Topics */}
          <div>
            <button
              onClick={() => toggleSection('topics')}
              className="flex items-center justify-between w-full text-left font-medium"
            >
              Topic
              {expandedSections.has('topics') ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </button>
            
            {expandedSections.has('topics') && (
              <div className="mt-2 space-y-3">
                <div>
                  <label className="text-sm font-medium">Include</label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      value={newIncludeTopic}
                      onChange={(e) => setNewIncludeTopic(e.target.value)}
                      placeholder="Topic name"
                      className="flex-1"
                    />
                    <Button size="sm" onClick={() => addTopic('include')}>
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tempFilters.includeTopics.map((topic, index) => (
                      <div key={index} className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {topic}
                        <button
                          onClick={() => removeTopic('include', index)}
                          className="ml-1 hover:text-blue-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Exclude</label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      value={newExcludeTopic}
                      onChange={(e) => setNewExcludeTopic(e.target.value)}
                      placeholder="Topic name"
                      className="flex-1"
                    />
                    <Button size="sm" onClick={() => addTopic('exclude')}>
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tempFilters.excludeTopics.map((topic, index) => (
                      <div key={index} className="flex items-center bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                        {topic}
                        <button
                          onClick={() => removeTopic('exclude', index)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t">
          <Button onClick={handleApply} className="w-full">
            Apply
          </Button>
        </div>
      </div>
      
      <div 
        className="flex-1 bg-black bg-opacity-50"
        onClick={onClose}
      />
    </div>
  );
};

export default RepositoryListFilterPanel;