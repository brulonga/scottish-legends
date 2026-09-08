export const getCategoryByElo = (elo) => {
  if (elo === undefined || elo === null) {
    return { name: 'UNRANKED', short: 'UNR', color: 'text-gray-500' };
  }
  
  // 🚀 NUEVA CATEGORÍA SUPREMA
  if (elo >= 3500) return { name: 'SCOTTISH-LEGEND', short: 'SL', color: 'text-blue-900' };
  
  if (elo >= 2700) return { name: 'ALIEN', short: 'ALN', color: 'text-fuchsia-500' };
  
  if (elo >= 2600) return { name: 'DIAMOND I', short: 'DIA1', color: 'text-cyan-400' };
  if (elo >= 2500) return { name: 'DIAMOND II', short: 'DIA2', color: 'text-cyan-400' };
  if (elo >= 2400) return { name: 'DIAMOND III', short: 'DIA3', color: 'text-cyan-400' };
  
  if (elo >= 2300) return { name: 'PLATINUM I', short: 'PLA1', color: 'text-slate-300' };
  if (elo >= 2200) return { name: 'PLATINUM II', short: 'PLA2', color: 'text-slate-300' };
  if (elo >= 2100) return { name: 'PLATINUM III', short: 'PLA3', color: 'text-slate-300' };
  
  if (elo >= 2000) return { name: 'GOLD I', short: 'GLD1', color: 'text-yellow-400' };
  if (elo >= 1900) return { name: 'GOLD II', short: 'GLD2', color: 'text-yellow-400' };
  if (elo >= 1800) return { name: 'GOLD III', short: 'GLD3', color: 'text-yellow-400' };
  
  if (elo >= 1700) return { name: 'SILVER I', short: 'SIL1', color: 'text-zinc-300' };
  if (elo >= 1600) return { name: 'SILVER II', short: 'SIL2', color: 'text-zinc-300' };
  if (elo >= 1500) return { name: 'SILVER III', short: 'SIL3', color: 'text-zinc-300' };
  
  if (elo >= 1400) return { name: 'BRONZE I', short: 'BRZ1', color: 'text-amber-600' };
  if (elo >= 1300) return { name: 'BRONZE II', short: 'BRZ2', color: 'text-amber-600' };
  if (elo >= 1200) return { name: 'BRONZE III', short: 'BRZ3', color: 'text-amber-600' };
  
  return { name: 'ROOKIE', short: 'ROO', color: 'text-green-500' };
};


export const getDriverCategories = (rawDrivers) => {
  if (elo === undefined || elo === null) {
    return { name: 'UNRANKED', short: 'UNR', color: 'text-gray-500' };
  }
  
  // 🚀 NUEVA CATEGORÍA SUPREMA
  if (elo >= 3500) return { name: 'SCOTTISH-LEGEND', short: 'SL', color: 'text-blue-900' };
  
  if (elo >= 2700) return { name: 'ALIEN', short: 'ALN', color: 'text-fuchsia-500' };
  
  if (elo >= 2600) return { name: 'DIAMOND I', short: 'DIA1', color: 'text-cyan-400' };
  if (elo >= 2500) return { name: 'DIAMOND II', short: 'DIA2', color: 'text-cyan-400' };
  if (elo >= 2400) return { name: 'DIAMOND III', short: 'DIA3', color: 'text-cyan-400' };
  
  if (elo >= 2300) return { name: 'PLATINUM I', short: 'PLA1', color: 'text-indigo-200 font-bold drop-shadow-[0_0_8px_rgba(165,180,252,0.6)]' };
  if (elo >= 2200) return { name: 'PLATINUM II', short: 'PLA2', color: 'text-indigo-200 font-bold drop-shadow-[0_0_8px_rgba(165,180,252,0.6)]' };
  if (elo >= 2100) return { name: 'PLATINUM III', short: 'PLA3', color: 'text-indigo-200 font-bold drop-shadow-[0_0_8px_rgba(165,180,252,0.6)]' };

  if (elo >= 2000) return { name: 'GOLD I', short: 'GLD1', color: 'text-yellow-400' };
  if (elo >= 1900) return { name: 'GOLD II', short: 'GLD2', color: 'text-yellow-400' };
  if (elo >= 1800) return { name: 'GOLD III', short: 'GLD3', color: 'text-yellow-400' };
  
  if (elo >= 1700) return { name: 'SILVER I', short: 'SIL1', color: 'text-zinc-300' };
  if (elo >= 1600) return { name: 'SILVER II', short: 'SIL2', color: 'text-zinc-300' };
  if (elo >= 1500) return { name: 'SILVER III', short: 'SIL3', color: 'text-zinc-300' };
  
  if (elo >= 1400) return { name: 'BRONZE I', short: 'BRZ1', color: 'text-amber-600' };
  if (elo >= 1300) return { name: 'BRONZE II', short: 'BRZ2', color: 'text-amber-600' };
  if (elo >= 1200) return { name: 'BRONZE III', short: 'BRZ3', color: 'text-amber-600' };
  
  return { name: 'ROOKIE', short: 'ROO', color: 'text-green-500' };
};