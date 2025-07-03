const Legend: React.FC = () => {
  const metrics = [
    { name: '30-Day Growth', description: 'total growth over 30-day period' },
    { name: '5-Day Growth', description: 'maximum growth across all 5-day intervals' },
    { name: '1-Day Growth', description: 'maximum growth across all 1-day intervals' },
    { name: 'Post-Maximum 5-Day Growth', description: 'growth after maximum 5-Day Growth (%) interval' },
    { name: 'Post-Day __ Growth', description: 'growth after a specified day' }
  ];

  return (
    <div className="bg-white border rounded p-4" style={{ height: '396px' }}>
      <h3 className="font-semibold mb-6">Legend: Growth Metrics (% and raw)</h3>
      <div className="space-y-6">
        {metrics.map((metric, index) => (
          <div key={index} className="flex items-start space-x-2">
            <div className="w-2 h-2 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
            <div className="text-sm">
              <div className="font-medium">{metric.name}:</div>
              <div className="text-muted-foreground text-xs leading-relaxed">{metric.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Legend;