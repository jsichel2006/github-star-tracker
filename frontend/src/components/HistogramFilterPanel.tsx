
import { useState } from 'react';
import { FilterState } from '@/types/repository';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

interface HistogramFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  title: string;
}

const HistogramFilterPanel: React.FC<HistogramFilterPanelProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  title
}) => {
  const [tempFilters, setTempFilters] = useState<FilterState>(filters);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['growth']));

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
                    { type: 'post_day', label: 'Post-__ Day' }
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
                      isPostDaySlider={true}
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

export default HistogramFilterPanel;