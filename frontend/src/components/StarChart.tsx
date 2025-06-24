import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StarHistoryPoint } from '../types';

interface StarChartProps {
  data: StarHistoryPoint[];
}

export const StarChart: React.FC<StarChartProps> = ({ data }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const chartData = data.map(point => ({
    ...point,
    formattedDate: formatDate(point.date)
  }));

  return (
    <div className="w-full h-96 bg-white rounded-lg p-4 shadow-lg border">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="formattedDate" 
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: '#e0e0e0' }}
          />
          <YAxis 
            domain={[0, 5000]}
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: '#e0e0e0' }}
          />
          <Tooltip 
            labelFormatter={(label) => `Date: ${label}`}
            formatter={(value) => [`${value} stars`, 'Stars']}
            contentStyle={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="stars" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};