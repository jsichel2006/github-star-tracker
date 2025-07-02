
import { Repository, HistogramBin } from '@/types/repository';

export const generateHistogram = (repositories: Repository[]): HistogramBin[] => {
  if (repositories.length === 0) return [];
  
  const values = repositories.map(repo => repo.growth_value || 0);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Set range to mean ± 2 standard deviations
  const min = Math.max(0, mean - 2 * stdDev);
  const max = mean + 2 * stdDev;
  
  const binCount = 5;
  const binWidth = (max - min) / binCount;
  
  const bins: HistogramBin[] = [];
  
  for (let i = 0; i < binCount; i++) {
    const binMin = min + i * binWidth;
    const binMax = i === binCount - 1 ? Infinity : min + (i + 1) * binWidth;
    
    const count = values.filter(val => val >= binMin && val < binMax).length;
    
    const label = i === binCount - 1 
      ? `>${formatValue(binMin)}` 
      : `${formatValue(binMin)}-${formatValue(binMax)}`;
    
    bins.push({
      min: binMin,
      max: binMax,
      count,
      label
    });
  }
  
  return bins;
};

const formatValue = (value: number): string => {
  if (value < 1) {
    return (Math.round(value * 10) / 10).toString();
  } else if (value < 100) {
    return Math.round(value).toString();
  } else {
    return (Math.round(value / 100) * 100).toString();
  }
};