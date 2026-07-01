import { useState, useMemo } from 'react'; 
import { Trophy, ChevronUp, ChevronDown, Filter, Flag, CalendarDays } from 'lucide-react'; 
import { useLeagueData } from '../hooks/useLeagueData'; 
import { isLegendDriver } from '../config/driversConfig'; 
import { getDriverCategories } from '../utils/categoryEngine'; 
 
export const Standings = ({ onDriverClick }) => { 
  const [activeLeague, setActiveLeague] = useState(null); 
  const [activeSeason, setActiveSeason] = useState(null); 
  
  const [sortConfig, setSortConfig] = useState({ key: 'points', direction: 'desc' }); 
  const [categoryFilter, setCategoryFilter] = useState('ALL'); 
   
  const { leagueData, loading, error } = useLeagueData(activeLeague, activeSeason); 
  
  const rawDrivers = leagueData?.global || []; 
  const driverCategories = useMemo(() => getDriverCategories(rawDrivers), [rawDrivers]); 

  const getCategoryDisplay = (driver) => {
    if (typeof driver.category === 'string') {
      const cat = driver.category.toUpperCase();
      const colors = {
        'PLATINUM': 'text-slate-300',
        'GOLD': 'text-yellow-400',
        'SILVER': 'text-zinc-400',
        'BRONZE': 'text-amber-600',
        'ROOKIE': 'text-green-500'
      };
      return { name: cat, color: colors[cat] || 'text-gray-500', expectedPos: driver.expectedPos };
    }
    return driverCategories[driver.name] || { name: 'ROOKIE', color: 'text-gray-500', expectedPos: 999 };
  };

  const baseDriversList = useMemo(() => { 
    return [...rawDrivers] 
      .sort((a, b) => (b.points || 0) - (a.points || 0)) 
      .map((d, index) => {
        const cat = getCategoryDisplay(d);
        const cleanName = d.name.replace(/\[.*?\]|\|.*/g, '').trim();
        const nameParts = cleanName.split(' ');
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : cleanName;

        return { 
          id: `${d.name}-${index}`,
          rawName: d.name,
          driver: cleanName,
          lastName: lastName,
          position: index + 1,  
          category: cat, 
          points: d.points || 0,  
          
          // 🚀 RECUPERAMOS EL EXPECTED POS DE LA CATEGORÍA O DEL JSON
          expectedPos: cat.expectedPos || d.expectedPos || 999,
          
          avgPoints: d.avg_points,  
          avgQualyPos: d.avg_qualy_pos,  
          avgQualyGap: d.avg_qualy_gap, 
          avgRacePos: d.avg_pos,  
          avgPaceGap: d.avg_gap,  
          races: d.races || 0,
          rounds: d.rounds || {} 
        };
      }); 
  }, [rawDrivers, driverCategories]); 
 
  const sortedAndFilteredDrivers = useMemo(() => { 
    let result = [...baseDriversList];
    
    if (categoryFilter !== 'ALL') {
      result = result.filter(d => d.category.name === categoryFilter);
    }

    result.sort((a, b) => {
      if (sortConfig.key === 'driver') {
        const nameA = `${a.lastName} ${a.driver}`.toLowerCase();
        const nameB = `${b.lastName} ${b.driver}`.toLowerCase();
        if (nameA < nameB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (nameA > nameB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      }

      // Safeguard numérico igual al que tenías originalmente
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (sortConfig.key === 'avgQualyGap' || sortConfig.key === 'avgPaceGap') { 
        valA = (valA === '-' || valA == null) ? Infinity : parseFloat(valA.toString().replace('+', '')); 
        valB = (valB === '-' || valB == null) ? Infinity : parseFloat(valB.toString().replace('+', '')); 
      } else if (sortConfig.key === 'avgQualyPos' || sortConfig.key === 'avgRacePos') { 
        valA = (valA === '-' || valA == null) ? Infinity : parseFloat(valA); 
        valB = (valB === '-' || valB == null) ? Infinity : parseFloat(valB); 
      }

      valA = valA ?? -999;
      valB = valB ?? -999;

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [baseDriversList, categoryFilter, sortConfig]); 

  // 🚀 RECUPERAMOS TU LÓGICA DE ORDENACIÓN ORIGINAL (Menor a mayor por defecto en posiciones/gaps)
  const requestSort = (key) => { 
    let direction = 'desc'; 
    if (['driver', 'category', 'expectedPos', 'avgQualyGap', 'avgPaceGap', 'avgQualyPos', 'avgRacePos'].includes(key)) {
      direction = 'asc'; 
    }
    if (sortConfig && sortConfig.key === key && sortConfig.direction === direction) {
      direction = direction === 'asc' ? 'desc' : 'asc'; 
    }
    setSortConfig({ key, direction }); 
  }; 

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

  const DriverNameCell = ({ driver }) => {
    const isLegend = isLegendDriver(driver.driver);
    return (
      <td className="px-2 py-3 text-sm">
        <div className="flex items-center">
          <span className={`font-bold tracking-wide ${isLegend ? 'text-purple-400' : 'text-white'}`}>
            {driver.driver}
          </span>
          {isLegend && (
            <span className="ml-2 px-1.5 py-0.5 bg-purple-600 text-white text-[10px] font-bold rounded shadow-md uppercase tracking-widest">
              LEGEND
            </span>
          )}
        </div>
      </td>
    );
  };

  const DriverPosCell = ({ position }) => (
    <td className="px-2 py-3 text-sm font-bold text-white">
      <div className="flex items-center space-x-1">
        {position <= 3 && <Trophy className={`w-4 h-4 ${position === 1 ? 'text-yellow-500' : position === 2 ? 'text-gray-400' : 'text-orange-600'}`} />}
        <span className={`font-['Teko'] text-2xl ${position > 3 ? "ml-5" : ""}`}>{position}</span>
      </div>
    </td>
  );

  return (
    <div className="min-h-screen bg-black font-['Inter'] text-gray-300 py-8">
      <div className="max-w-[1536px] mx-auto px-4">
        
        <div className="mb-10 text-center md:text-left border-b border-gray-800 pb-8">
          <h1 className="font-['Teko'] text-6xl font-bold text-white mb-6 uppercase tracking-wide">Championship Standings</h1>
          
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-2">
              <label className="font-['Teko'] text-xl text-gray-500 uppercase tracking-widest">1. Select League</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => { setActiveLeague('monday_marathon'); setActiveSeason(null); }}
                  className={`flex-1 py-3 px-4 transform -skew-x-12 transition-all duration-200 border border-gray-800 ${
                    activeLeague === 'monday_marathon' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(250,204,21,0.3)]' : 'bg-[#0a0a0a] text-gray-400 hover:border-yellow-500/50 hover:text-white'
                  }`}
                >
                  <span className="font-['Teko'] text-2xl uppercase tracking-widest block transform skew-x-12">Monday Marathon</span>
                </button>
                <button
                  onClick={() => { setActiveLeague('fun_friday'); setActiveSeason(null); }}
                  className={`flex-1 py-3 px-4 transform -skew-x-12 transition-all duration-200 border border-gray-800 ${
                    activeLeague === 'fun_friday' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(250,204,21,0.3)]' : 'bg-[#0a0a0a] text-gray-400 hover:border-yellow-500/50 hover:text-white'
                  }`}
                >
                  <span className="font-['Teko'] text-2xl uppercase tracking-widest block transform skew-x-12">Fun Friday</span>
                </button>
              </div>
            </div>

            <div className={`flex-1 space-y-2 transition-opacity duration-300 ${activeLeague ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
              <label className="font-['Teko'] text-xl text-gray-500 uppercase tracking-widest">2. Select Season</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveSeason('season_1')}
                  className={`flex-1 py-3 px-4 transform -skew-x-12 transition-all duration-200 border border-gray-800 ${
                    activeSeason === 'season_1' ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-[#0a0a0a] text-gray-400 hover:border-white/50 hover:text-white'
                  }`}
                >
                  <span className="font-['Teko'] text-2xl uppercase tracking-widest block transform skew-x-12">Season 1</span>
                </button>
                <button
                  onClick={() => setActiveSeason('season_2')}
                  className={`flex-1 py-3 px-4 transform -skew-x-12 transition-all duration-200 border border-gray-800 ${
                    activeSeason === 'season_2' ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-[#0a0a0a] text-gray-400 hover:border-white/50 hover:text-white'
                  }`}
                >
                  <span className="font-['Teko'] text-2xl uppercase tracking-widest block transform skew-x-12">Season 2 (Tournament)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {!activeLeague || !activeSeason ? (
          <div className="bg-[#0a0a0a] p-16 text-center border border-gray-800 rounded-lg">
            <Flag className="w-20 h-20 text-gray-700 mx-auto mb-6 animate-pulse" />
            <h2 className="font-['Teko'] text-4xl text-gray-400 uppercase tracking-widest mb-2">Welcome to the Paddock</h2>
            <p className="text-gray-500 uppercase tracking-widest font-bold">Please select a League and a Season above to view the standings.</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 p-8 text-center border border-red-500/30">
            <p className="text-red-400 uppercase tracking-widest font-bold">{error}</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-6 bg-[#0a0a0a] p-3 border border-gray-800 shadow-lg">
              <div className="flex items-center space-x-2 mr-2 text-gray-400">
                <Filter className="w-4 h-4" />
                <span className="font-['Teko'] text-xl uppercase tracking-widest mt-1">Filter by Category:</span>
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

            {activeSeason === 'season_2' && leagueData?.calendar ? (
              <div className="space-y-12">
                
                {/* TABLA 1: MARCADOR GENERAL Y ESTADÍSTICAS (Con Exp Pos) */}
                <div>
                  <h3 className="font-['Teko'] text-3xl text-yellow-500 uppercase tracking-widest mb-4 flex items-center">
                    <Trophy className="w-6 h-6 mr-2" /> Overall & Category Standings
                  </h3>
                  <div className="bg-[#0a0a0a] border border-gray-800 shadow-2xl overflow-x-auto">
                    <table className="w-full whitespace-nowrap">
                      <thead className="bg-black border-b border-gray-800">
                        <tr>
                          <SortableHeader title="Pos" sortKey="position" align="left" />
                          <SortableHeader title="Driver" sortKey="driver" align="left" />
                          <SortableHeader title="Cat" sortKey="category" />
                          {/* 🚀 VUELVE EL EXPECTED POS */}
                          <SortableHeader title="Exp Pos" sortKey="expectedPos" />
                          <SortableHeader title="Total Pts" sortKey="points" />
                          <SortableHeader title="Avg Pts" sortKey="avgPoints" />
                          <SortableHeader title="Avg Q Pos" sortKey="avgQualyPos" />
                          <SortableHeader title="Avg Q Gap" sortKey="avgQualyGap" />
                          <SortableHeader title="Avg R Pos" sortKey="avgRacePos" />
                          <SortableHeader title="Avg R Gap" sortKey="avgPaceGap" />
                          <SortableHeader title="Races" sortKey="races" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/50">
                        {sortedAndFilteredDrivers.map((driver) => (
                          <tr key={`stand-${driver.id}`} onClick={() => onDriverClick(driver.rawName)} className="cursor-pointer hover:bg-gray-800/30">
                            <DriverPosCell position={driver.position} />
                            <DriverNameCell driver={driver} />
                            <td className="px-2 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${driver.category.color}`}>
                                {driver.category.name}
                              </span>
                            </td>
                            {/* 🚀 DIBUJAMOS EL EXPECTED POS CON TU ESTILO */}
                            <td className="px-2 py-3 text-center font-['Teko'] text-3xl font-bold text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.3)]">
                              {driver.expectedPos !== 999 ? `P${driver.expectedPos}` : '-'}
                            </td>
                            <td className="px-2 py-3 text-center font-['Teko'] text-4xl font-bold text-yellow-400">
                              {driver.points}
                            </td>
                            <td className="px-2 py-3 text-center font-bold text-gray-400 text-sm">{driver.avgPoints || '-'}</td>
                            <td className="px-2 py-3 text-center text-gray-300 font-bold text-sm">{driver.avgQualyPos && driver.avgQualyPos !== '-' ? `P${driver.avgQualyPos}` : '-'}</td>
                            <td className="px-2 py-3 text-center text-gray-400 text-xs">{driver.avgQualyGap || '-'}</td>
                            <td className="px-2 py-3 text-center text-gray-300 font-bold text-sm">{driver.avgRacePos && driver.avgRacePos !== '-' ? `P${driver.avgRacePos}` : '-'}</td>
                            <td className="px-2 py-3 text-center text-gray-400 text-xs">{driver.avgPaceGap || '-'}</td>
                            <td className="px-2 py-3 text-center text-gray-500 font-bold text-sm">{driver.races}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* TABLA 2: RESULTADOS DETALLADOS Y DROP ROUNDS */}
                <div>
                  <h3 className="font-['Teko'] text-3xl text-white uppercase tracking-widest mb-4 flex items-center">
                    <CalendarDays className="w-6 h-6 mr-2 text-gray-400" /> Detailed Results & Drop Rounds
                  </h3>
                  <div className="bg-[#0a0a0a] border border-gray-800 shadow-2xl overflow-x-auto">
                    <table className="w-full whitespace-nowrap">
                      <thead className="bg-black border-b border-gray-800">
                        <tr>
                          <SortableHeader title="Driver" sortKey="driver" align="left" />
                          {leagueData.calendar.map(race => (
                            <th key={race.id} className="px-2 py-3 text-center font-['Teko'] text-lg text-gray-400 uppercase">
                              {race.id}
                              <div className="text-[10px] text-gray-600 truncate max-w-[80px]">{race.track}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/50">
                        {sortedAndFilteredDrivers.map(driver => (
                          <tr key={`grid-${driver.id}`} onClick={() => onDriverClick(driver.rawName)} className="cursor-pointer hover:bg-gray-800/30">
                            <DriverNameCell driver={driver} />
                            {leagueData.calendar.map(race => {
                              const roundData = driver.rounds[race.id];
                              if (!roundData) return <td key={race.id} className="px-2 py-3 text-center text-gray-700 font-['Teko'] text-2xl">-</td>;
                              
                              return (
                                <td key={race.id} className="px-2 py-3 text-center font-['Teko'] text-3xl font-bold">
                                  <span className={roundData.isDropped ? 'line-through text-red-900/60' : 'text-white'}>
                                    {roundData.points !== null ? roundData.points : 'DNS'}
                                  </span>
                                  {roundData.bonusPoints > 0 && !roundData.isDropped && (
                                    <span className="text-yellow-500 text-sm ml-1">+{roundData.bonusPoints}</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            ) : (
              
              /* VISTA TEMPORADA 1 (Clásica) */
              <div className="bg-[#0a0a0a] border border-gray-800 shadow-2xl overflow-x-auto">
                <table className="w-full whitespace-nowrap">
                  <thead className="bg-black border-b border-gray-800">
                    <tr>
                      <SortableHeader title="Pos" sortKey="position" align="left" />
                      <SortableHeader title="Driver" sortKey="driver" align="left" />
                      <SortableHeader title="Cat" sortKey="category" />
                      {/* 🚀 VUELVE EL EXPECTED POS */}
                      <SortableHeader title="Exp Pos" sortKey="expectedPos" />
                      <SortableHeader title="Pts" sortKey="points" />
                      <SortableHeader title="Avg Pts" sortKey="avgPoints" />
                      <SortableHeader title="Avg Q Pos" sortKey="avgQualyPos" />
                      <SortableHeader title="Avg R Pos" sortKey="avgRacePos" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {sortedAndFilteredDrivers.map((driver) => (
                      <tr key={`legacy-${driver.id}`} onClick={() => onDriverClick(driver.rawName)} className="cursor-pointer hover:bg-gray-800/30">
                        <DriverPosCell position={driver.position} />
                        <DriverNameCell driver={driver} />
                        <td className="px-1 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${driver.category.color}`}>
                            {driver.category.name.substring(0, 4)}
                          </span>
                        </td>
                        {/* 🚀 DIBUJAMOS EL EXPECTED POS */}
                        <td className="px-2 py-3 text-center font-['Teko'] text-3xl font-bold text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.3)]">
                          {driver.expectedPos !== 999 ? `P${driver.expectedPos}` : '-'}
                        </td>
                        <td className="px-2 py-3 text-center font-['Teko'] text-3xl font-bold text-yellow-400">{driver.points}</td>
                        <td className="px-2 py-3 text-center font-bold text-gray-400 text-sm">{driver.avgPoints || '-'}</td>
                        <td className="px-2 py-3 text-center text-gray-300 font-bold text-sm">{driver.avgQualyPos ? `P${driver.avgQualyPos}` : '-'}</td>
                        <td className="px-2 py-3 text-center text-gray-300 font-bold text-sm">{driver.avgRacePos ? `P${driver.avgRacePos}` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};