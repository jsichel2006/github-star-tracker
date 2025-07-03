
import { StarHistoryPoint } from '@/types/repository';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StarHistoryChartProps {
  data: StarHistoryPoint[];
}

const StarHistoryChart: React.FC<StarHistoryChartProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center border rounded">
        <p className="text-muted-foreground">No star history data available</p>
      </div>
    );
  }

  // Calculate Y-axis bounds
  const starCounts = data.map(d => d.stars);
  const minStars = Math.min(...starCounts);
  const maxStars = Math.max(...starCounts);
  const yAxisMin = Math.floor(minStars / 100) * 100;
  const yAxisMax = Math.ceil(maxStars / 100) * 100;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">{formatDate(data.date)}</p>
          <p className="text-blue-600">Stars: {data.stars}</p>
        </div>
      );
    }
    return null;
  };

  const getAdjustedTickDates = (data: StarHistoryPoint[], step = 2, start = 1) =>
    data
      .filter((_, index) => index >= start && (index - start) % step === 0)
      .map(d => d.date);

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            ticks={getAdjustedTickDates(data, 2, 1)}
            interval="preserveStartEnd"
            label={{
              value: 'Date',
              position: 'insideBottom',
              offset: -18,
              dx: -20,
              style: { textAnchor: 'middle' }
            }}           
          />
          <YAxis 
            domain={[yAxisMin, yAxisMax]}
            label={{ 
              value: 'Star Count', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle' },
              offset: -5
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="stars" 
            stroke="#2563eb" 
            strokeWidth={2}
            dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StarHistoryChart;