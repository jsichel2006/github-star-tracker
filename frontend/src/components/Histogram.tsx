
import { HistogramBin } from '@/types/repository';
import { Button } from '@/components/ui/button';

interface HistogramProps {
  bins: HistogramBin[];
  xAxisLabel: string;
  onFilterClick: () => void;
}

const Histogram: React.FC<HistogramProps> = ({ bins, xAxisLabel, onFilterClick }) => {
  if (bins.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center border rounded">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  const maxCount = Math.max(...bins.map(bin => bin.count));
  const yAxisMax = Math.ceil(maxCount * 1.1 / 10) * 10;

  return (
    <div className="w-full">
      <div className="flex justify-end mb-2">
        <Button variant="outline" onClick={onFilterClick}>
          Filter & Sort
        </Button>
      </div>
      
      <div className="relative bg-white border rounded p-4" style={{ height: '300px' }}>
        {/* Y-axis */}
        <div className="absolute left-0 top-4 bottom-12 w-12 flex flex-col justify-between text-sm text-muted-foreground">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="text-right pr-2">
              {Math.round((yAxisMax * (5 - i)) / 5)}
            </div>
          ))}
          <div className="text-right pr-2 font-medium">Frequency</div>
        </div>
        
        {/* Chart area */}
        <div className="ml-12 mr-4 h-full pb-12 pt-4 flex items-end justify-around space-x-1">
          {bins.map((bin, index) => {
            const height = (bin.count / yAxisMax) * 100;
            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center"
              >
                <div
                  className="w-full bg-blue-500 min-h-[2px]"
                  style={{
                    height: `${height}%`,
                    maxHeight: '220px'
                  }}
                />
              </div>
            );
          })}
        </div>
        
        {/* X-axis */}
        <div className="absolute bottom-0 left-12 right-4 h-12 flex justify-around items-center text-sm text-muted-foreground">
          {bins.map((bin, index) => (
            <div key={index} className="text-center flex-1">
              {bin.min.toFixed(bin.min < 1 ? 1 : 0)}
            </div>
          ))}
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 font-medium">
            {xAxisLabel}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Histogram;