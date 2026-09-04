export const getCategoryByElo = (elo) => {
  if (elo === undefined || elo === null) {
    return { name: 'ROOKIE', color: 'text-green-500' };
  }
  
  if (elo >= 2500) return { name: 'ALIEN', color: 'text-fuchsia-500' };
  if (elo >= 2200) return { name: 'DIAMOND', color: 'text-cyan-400' };
  if (elo >= 1900) return { name: 'PLATINUM', color: 'text-slate-300' };
  if (elo >= 1600) return { name: 'GOLD', color: 'text-yellow-400' };
  if (elo >= 1300) return { name: 'SILVER', color: 'text-zinc-400' };
  if (elo >= 1000) return { name: 'BRONZE', color: 'text-amber-600' };
  
  return { name: 'ROOKIE', color: 'text-green-500' };
};

export const getDriverCategories = (rawDrivers) => {
  if (elo === undefined || elo === null) {
    return { name: 'ROOKIE', color: 'text-green-500' };
  }
  
  if (elo >= 2500) return { name: 'ALIEN', color: 'text-fuchsia-500' };
  if (elo >= 2200) return { name: 'DIAMOND', color: 'text-cyan-400' };
  if (elo >= 1900) return { name: 'PLATINUM', color: 'text-slate-300' };
  if (elo >= 1600) return { name: 'GOLD', color: 'text-yellow-400' };
  if (elo >= 1300) return { name: 'SILVER', color: 'text-zinc-400' };
  if (elo >= 1000) return { name: 'BRONZE', color: 'text-amber-600' };
  
  return { name: 'ROOKIE', color: 'text-green-500' };
};