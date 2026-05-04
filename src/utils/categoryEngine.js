export const getDriverCategories = (rawDrivers) => {
  if (!rawDrivers || rawDrivers.length === 0) return {};
  
  const cats = {};
  const eligible = rawDrivers.filter(d => d.races >= 2);
  
  const withMetric = eligible.map(d => {
    let sum = 0, count = 0;
    if (!isNaN(parseFloat(d.avg_pos))) { sum += parseFloat(d.avg_pos); count++; }
    if (!isNaN(parseFloat(d.avg_pace_pos))) { sum += parseFloat(d.avg_pace_pos); count++; }
    if (!isNaN(parseFloat(d.avg_qualy_pos))) { sum += parseFloat(d.avg_qualy_pos); count++; }
    
    const metric = count === 0 ? 999 : sum / count;
    return { name: d.name, metric };
  }).sort((a, b) => a.metric - b.metric);

  const N = withMetric.length;
  const base = Math.floor(N / 4);
  const rem = N % 4;

  const platSize = base; 
  const goldSize = base + (rem === 3 ? 1 : 0);
  const silverSize = base + (rem >= 2 ? 1 : 0);

  withMetric.forEach((d, index) => {
    const expectedPos = index + 1;
    if (index < platSize) {
      cats[d.name] = { name: 'PLATINUM', rank: 1, expectedPos, color: 'bg-emerald-500 text-white shadow-emerald-500/50' };
    } else if (index < platSize + goldSize) {
      cats[d.name] = { name: 'GOLD', rank: 2, expectedPos, color: 'bg-yellow-500 text-black shadow-yellow-500/50' };
    } else if (index < platSize + goldSize + silverSize) {
      cats[d.name] = { name: 'SILVER', rank: 3, expectedPos, color: 'bg-gray-300 text-black shadow-gray-300/50' };
    } else {
      cats[d.name] = { name: 'BRONZE', rank: 4, expectedPos, color: 'bg-amber-700 text-white shadow-amber-700/50' };
    }
  });

  rawDrivers.forEach(d => {
    if (!cats[d.name]) cats[d.name] = { name: 'ROOKIE', rank: 5, expectedPos: 999, color: 'bg-red-600 text-white shadow-red-600/50' };
  });
  
  return cats;
};