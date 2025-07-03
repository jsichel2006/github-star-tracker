
import { Repository, HistogramBin } from '@/types/repository';

export const generateHistogram = (repositories: Repository[]): HistogramBin[] => {
  console.log('=== HISTOGRAM GENERATION DEBUG ===');
  console.log('Input repositories count:', repositories.length);
  
  if (repositories.length === 0) {
    console.log('No repositories, returning empty bins');
    return [];
  }
  
  const values = repositories.map(repo => repo.growth_value || 0);
  console.log('Growth values extracted:', values.slice(0, 10)); // First 10 values
  console.log('Min growth value:', Math.min(...values));
  console.log('Max growth value:', Math.max(...values));
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  console.log('Statistics:');
  console.log('- Mean:', mean);
  console.log('- Standard deviation:', stdDev);
  console.log('- Variance:', variance);
  
  // Set range to mean ± 2 standard deviations
  const min = Math.max(0, mean - 2 * stdDev);
  const max = mean + 2 * stdDev;
  
  console.log('Histogram range:');
  console.log('- Min:', min);
  console.log('- Max:', max);
  
  const binCount = 5;
  const binWidth = (max - min) / binCount;
  console.log('Bin width:', binWidth);
  
  const bins: HistogramBin[] = [];
  
  for (let i = 0; i < binCount; i++) {
    const binMin = min + i * binWidth;
    const binMax = i === binCount - 1 ? Infinity : min + (i + 1) * binWidth;
    
    const valuesInBin = values.filter(val => val >= binMin && val < binMax);
    const count = valuesInBin.length;
    
    console.log(`Bin ${i}:`);
    console.log(`- Range: ${binMin} to ${binMax === Infinity ? 'Infinity' : binMax}`);
    console.log(`- Count: ${count}`);
    console.log(`- Sample values in bin:`, valuesInBin.slice(0, 5));
    
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
  
  console.log('Final bins:', bins);
  console.log('Total items in all bins:', bins.reduce((sum, bin) => sum + bin.count, 0));
  
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