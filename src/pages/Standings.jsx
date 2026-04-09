import { useState, useMemo } from 'react';
import { Trophy, Award, ChevronUp, ChevronDown, Filter, Shield } from 'lucide-react';
import { useLeagueData } from '../hooks/useLeagueData';
import { isLegendDriver } from '../config/driversConfig';

export const Standings = ({ onDriverClick }) => {
  const [activeLeague, setActiveLeague] = useState('monday');
  const [sortConfig, setSortConfig] = useState({ key: 'points', direction: 'desc' });
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  
  const { getLeagueData, loading } = useLeagueData();
  const leagueData = getLeagueData(activeLeague);
  const rawDrivers = leagueData?.global || [];
  
  // 🚀 MOTOR DE CATEGORÍAS Y POSICIÓN ESPERADA
  const driverCategories = useMemo(() => {
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

    withMetric.forEach((d, index) => {
      const expectedPos = index + 1; // 🚀 Esta es la posición esperada real (Power Ranking)
      if (index < 10) cats[d.name] = { name: 'PLATINUM', rank: 1, expectedPos, color: 'bg-emerald-500 text-white shadow-emerald-500/50' };
      else if (index < 20) cats[d.name] = { name: 'GOLD', rank: 2, expectedPos, color: 'bg-yellow-500 text-black shadow-yellow-500/50' };
      else if (index < 30) cats[d.name] = { name: 'SILVER', rank: 3, expectedPos, color: 'bg-gray-300 text-black shadow-gray-300/50' };
      else if (index < 40) cats[d.name] = { name: 'BRONZE', rank: 4, expectedPos, color: 'bg-amber-700 text-white shadow-amber-700/50' };
      else cats[d.name] = { name: 'ROOKIE', rank: 5, expectedPos, color: 'bg-red-600 text-white shadow-red-600/50' };
    });

    // A los que tienen menos de 2 carreras les ponemos un Expected Pos muy alto para que salgan al final
    rawDrivers.forEach(d => {
      if (!cats[d.name]) cats[d.name] = { name: 'ROOKIE', rank: 5, expectedPos: 999, color: 'bg-red-600 text-white shadow-red-600/50' };
    });
    
    return cats;
  }, [rawDrivers]);

  const baseDriversList = useMemo(() => {
    return [...rawDrivers]
      .sort((a, b) => b.points - a.points)
      .map((d, index) => ({
        driver: d.name, 
        position: index + 1, 
        category: driverCategories[d.name],
        expectedPos: driverCategories[d.name].expectedPos, // 🚀 Guardamos el dato para la tabla
        points: d.points, 
        avgPoints: d.avg_points, 
        avgQualyPos: d.avg_qualy_pos, 
        avgQualyGap: d.avg_qualy_gap,
        avgRacePos: d.avg_pos, 
        avgPaceGap: d.avg_gap, 
        races: d.races
      }));
  }, [rawDrivers, driverCategories]);

  const filteredDrivers = useMemo(() => {
    if (categoryFilter === 'ALL') return baseDriversList;
    return baseDriversList.filter(d => d.category.name === categoryFilter);
  }, [baseDriversList, categoryFilter]);

  const sortedDrivers = useMemo(() => {
    let sortableItems = [...filteredDrivers];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key], bValue = b[sortConfig.key];
        
        if (sortConfig.key === 'category') { 
          aValue = a.category.rank; 
          bValue = b.category.rank; 
        } 
        else if (sortConfig.key === 'avgQualyGap' || sortConfig.key === 'avgPaceGap') {
          aValue = aValue === '-' ? Infinity : parseFloat(aValue.toString().replace('+', ''));
          bValue = bValue === '-' ? Infinity : parseFloat(bValue.toString().replace('+', ''));
        } 
        else if (sortConfig.key === 'avgQualyPos' || sortConfig.key === 'avgRacePos') {
          aValue = aValue === '-' ? Infinity : parseFloat(aValue);
          bValue = bValue === '-' ? Infinity : parseFloat(bValue);
        } 
        else if (typeof aValue === 'string') { 
          return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue); 
        }
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredDrivers, sortConfig]);

  const requestSort = (key) => {
    let direction = 'desc';
    // Añadimos expectedPos a la lista de métricas donde lo menor (P1) es mejor (ascendente)
    if (['driver', 'category', 'expectedPos', 'avgQualyGap', 'avgPaceGap', 'avgQualyPos', 'avgRacePos'].includes(key)) direction = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === direction) direction = direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const categoryTooltipText = "Category assigned based on the average of average pace position, average quali position and average final race position. Minimum 2 races.";
  const legendTooltipText = "Legends are the most dedicated members of the community: they follow the rules, race cleanly, and are very fast.";
  
  const SortableHeader = ({ title, sortKey, align = 'center' }) => {
    const isActive = sortConfig?.key === sortKey;
    return (
      <th 
        className={`px-2 py-3 text-${align} font-['Teko'] text-lg font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:bg-gray-800 hover:text-white transition-colors group select-none`}
        onClick={() => requestSort(sortKey)}
      >
        <div className={`flex items-center space-x-1 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
          <span>{title}</span>
          <span className={`flex flex-col opacity-50 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100 text-yellow-400' : ''}`}>
            {(!isActive || sortConfig.direction === 'asc') && <ChevronUp className="w-3 h-3 -mb-1" />}
            {(!isActive || sortConfig.direction === 'desc') && <ChevronDown className="w-3 h-3" />}
          </span>
        </div>
      </th>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black font-['Inter'] text-gray-300 py-8">
      <div className="max-w-[1536px] mx-auto px-4">
        <div className="mb-8">
          <h1 className="font-['Teko'] text-6xl font-bold text-white mb-2 uppercase tracking-wide">Championship Standings</h1>
          <p className="text-gray-400 text-sm max-w-3xl uppercase tracking-widest font-bold">Track positions and performance across both leagues. Final standings will be made with the best 10 results.</p>
        </div>

        {/* SELECTORES DE LIGA */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => { setActiveLeague('monday'); setCategoryFilter('ALL'); }}
            className={`flex-1 py-3 px-6 transform -skew-x-12 transition-all duration-200 border border-gray-800 ${
              activeLeague === 'monday' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(250,204,21,0.3)]' : 'bg-[#0a0a0a] text-gray-400 hover:border-yellow-500/50 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center space-x-2 transform skew-x-12">
              <Trophy className="w-5 h-5" />
              <span className="font-['Teko'] text-2xl uppercase tracking-widest mt-1">Monday Marathon</span>
            </div>
          </button>
          <button
            onClick={() => { setActiveLeague('multiclass'); setCategoryFilter('ALL'); }}
            className={`flex-1 py-3 px-6 transform -skew-x-12 transition-all duration-200 border border-gray-800 ${
              activeLeague === 'multiclass' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(250,204,21,0.3)]' : 'bg-[#0a0a0a] text-gray-400 hover:border-yellow-500/50 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center space-x-2 transform skew-x-12">
              <Trophy className="w-5 h-5" />
              <span className="font-['Teko'] text-2xl uppercase tracking-widest mt-1">Multiclass Friday</span>
            </div>
          </button>
        </div>

        {/* BARRA DE FILTROS */}
        {baseDriversList.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6 bg-[#0a0a0a] p-3 border border-gray-800 shadow-lg">
            <div className="flex items-center space-x-2 mr-2 text-gray-400">
              <Filter className="w-4 h-4" />
              <span className="font-['Teko'] text-xl uppercase tracking-widest mt-1">Filter:</span>
            </div>
            {['ALL', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE', 'ROOKIE'].map(cat => (
              <button 
                key={cat}
                onClick={() => setCategoryFilter(cat)} 
                className={`px-4 py-1.5 font-['Teko'] text-xl uppercase tracking-widest transition-all ${
                  categoryFilter === cat 
                    ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(250,204,21,0.3)]' 
                    : 'bg-black text-gray-400 border border-gray-800 hover:border-yellow-500/50 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {sortedDrivers.length > 0 ? (
          <div className="bg-[#0a0a0a] border border-gray-800 shadow-2xl overflow-x-auto pb-32">
            <table className="w-full whitespace-nowrap relative">
              <thead className="bg-black border-b border-gray-800">
                <tr>
                  <SortableHeader title="Pos" sortKey="position" align="left" />
                  <SortableHeader title="Driver" sortKey="driver" align="left" />
                  <SortableHeader title="Cat" sortKey="category" />
                  <SortableHeader title="Exp Pos" sortKey="expectedPos" />
                  <SortableHeader title="Pts" sortKey="points" />
                  <SortableHeader title="Avg Pts" sortKey="avgPoints" />
                  <SortableHeader title="Avg Q Pos" sortKey="avgQualyPos" />
                  <SortableHeader title="Avg Q Gap" sortKey="avgQualyGap" />
                  <SortableHeader title="Avg R Pos" sortKey="avgRacePos" />
                  <SortableHeader title="Avg P Gap" sortKey="avgPaceGap" />
                  <SortableHeader title="Races" sortKey="races" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {sortedDrivers.map((driver) => {
                  const isLegend = isLegendDriver(driver.driver);
                  const cat = driver.category;

                  return (
                    <tr
                      key={driver.driver}
                      onClick={() => onDriverClick(driver.driver)}
                      className={`cursor-pointer transition-all duration-200 ${
                        isLegend
                          ? 'bg-purple-900/10 hover:bg-purple-900/30 border-l-4 border-purple-500'
                          : 'hover:bg-gray-800/30'
                      }`}
                    >
                      <td className="px-2 py-3 text-sm font-bold text-white">
                        <div className="flex items-center space-x-1">
                          {(driver.position <= 3 || (categoryFilter !== 'ALL' && sortedDrivers.indexOf(driver) <= 2 && sortConfig.key === 'points')) && (
                            <Trophy className={`w-4 h-4 ${
                              (driver.position === 1 || sortedDrivers.indexOf(driver) === 0) ? 'text-yellow-500 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]' : 
                              (driver.position === 2 || sortedDrivers.indexOf(driver) === 1) ? 'text-gray-400' : 
                              'text-orange-600'
                            }`} />
                          )}
                          <span className={`font-['Teko'] text-2xl ${driver.position > 3 ? "ml-5" : ""}`}>{driver.position}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-sm">
                        <div className="flex items-center">
                          <span className={`font-bold tracking-wide ${isLegend ? 'text-purple-400' : 'text-white'}`}>
                            {driver.driver}
                          </span>
                          {isLegend && (
                            <div className="group relative inline-block ml-2" onClick={(e) => e.stopPropagation()}>
                              <span className="px-1.5 py-0.5 bg-purple-600 text-white text-[10px] font-bold rounded shadow-md cursor-help uppercase tracking-widest">
                                LEGEND
                              </span>
                              <div className="opacity-0 invisible group-hover:opacity-100 group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 p-2 bg-[#0a0a0a] text-gray-300 text-xs shadow-[0_0_15px_rgba(168,85,247,0.2)] border border-purple-500/30 transition-all duration-200 z-50 whitespace-normal text-center font-medium leading-tight pointer-events-none">
                                {legendTooltipText}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-[#0a0a0a]"></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-1 py-3 text-center">
                        <div className="group relative inline-block" onClick={(e) => e.stopPropagation()}>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold shadow-md cursor-help uppercase tracking-widest ${cat.color}`}>
                            {cat.name.substring(0, 4)}
                          </span>
                          <div className="opacity-0 invisible group-hover:opacity-100 group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-[#0a0a0a] text-gray-300 text-xs shadow-[0_0_15px_rgba(250,204,21,0.1)] border border-gray-700 transition-all duration-200 z-50 whitespace-normal text-center font-medium leading-tight pointer-events-none">
                            {categoryTooltipText}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-[#0a0a0a]"></div>
                          </div>
                        </div>
                      </td>
                      
                      {/* 🚀 NUEVA COLUMNA: POSICIÓN ESPERADA (Power Ranking) */}
                      <td className="px-2 py-3 text-center font-['Teko'] text-3xl font-bold text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.3)]">
                        {driver.expectedPos !== 999 ? `P${driver.expectedPos}` : '-'}
                      </td>

                      <td className="px-2 py-3 text-center font-['Teko'] text-3xl font-bold text-yellow-400">
                        {driver.points}
                      </td>
                      <td className="px-2 py-3 text-center font-bold text-gray-400 text-sm">
                        {driver.avgPoints ? parseFloat(driver.avgPoints).toFixed(1) : '-'}
                      </td>
                      <td className="px-2 py-3 text-center text-gray-300 font-bold text-sm">
                        {driver.avgQualyPos !== "-" && driver.avgQualyPos != null ? `P${driver.avgQualyPos}` : '-'}
                      </td>
                      <td className="px-2 py-3 text-center text-gray-500 font-medium text-xs font-mono">
                        {driver.avgQualyGap}
                      </td>
                      <td className="px-2 py-3 text-center text-gray-300 font-bold text-sm">
                        {driver.avgRacePos !== "-" && driver.avgRacePos != null ? `P${driver.avgRacePos}` : '-'}
                      </td>
                      <td className="px-2 py-3 text-center text-gray-500 font-medium text-xs font-mono">
                        {driver.avgPaceGap}
                      </td>
                      <td className="px-2 py-3 text-center font-['Teko'] text-2xl text-gray-400">
                        {driver.races || 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-[#0a0a0a] p-12 text-center border border-gray-800">
            <Shield className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 text-lg uppercase tracking-widest font-bold">No hay pilotos que coincidan con este filtro.</p>
          </div>
        )}
      </div>
    </div>
  );
};