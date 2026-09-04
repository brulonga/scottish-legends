import { useState, useMemo, useEffect } from 'react'; 
import { Filter, Flag } from 'lucide-react'; 
import { useLeagueData } from '../hooks/useLeagueData'; 
import { getCategoryByElo } from '../utils/categoryEngine'; 
import { LeagueSelector } from './LeagueSelector';
import { LegacyStandings } from './LegacyStandings'; 
import { ModernStandings } from './ModernStandings'; 

// 💡 CALENDARIOS PREDEFINIDOS PARA TEMPORADAS EN CURSO
const FUTURE_CALENDARS = {
  'MM-season_2': [
    { id: 'R1', track: 'Monza' },
    { id: 'R2', track: 'Kyalami' },
    { id: 'R3', track: 'Misano' },
    { id: 'R4', track: 'Mount Panorama' },
    { id: 'R5', track: 'Suzuka' },
    { id: 'R6', track: 'Silverstone' }
  ],
  'FF-season_3': [
    { id: 'R1', track: 'Carbonara Cup (Imola / Misano)' },
    { id: 'R2', track: 'The Commonwealth (Silverstone / Bathurst)' },
    { id: 'R3', track: 'The Curbs Are Lava (Zolder)' },
    { id: 'R4', track: '4 Is More Than 3!? (Nürburgring 24H)' },
    { id: 'R5', track: 'Japanese Showdown (Suzuka)' },
    { id: 'R6', track: 'Which Way? (Indianapolis)' },
    { id: 'R7', track: 'Speed Kills (Monza)' },
    { id: 'R8', track: 'Mirror-Watching Masterclass (Watkins Glen)' }
  ]
};

export const Standings = ({ onDriverClick }) => { 
  const [activeLeague, setActiveLeague] = useState(null); 
  const [activeSeason, setActiveSeason] = useState(null); 
  const [sortConfig, setSortConfig] = useState({ key: 'points', direction: 'desc' }); 
  const [categoryFilter, setCategoryFilter] = useState('ALL'); 
  const [eloData, setEloData] = useState({}); 
   
  const { leagueData, loading, error } = useLeagueData(activeLeague, activeSeason); 
  const rawDrivers = leagueData?.global || []; 

  // 💡 LECTURA CORRECTA DE LA LISTA DE ELO (driver_elos.json)
  useEffect(() => {
    fetch('/data/driver_elos.json') 
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Convertimos la lista en un diccionario { "Nombre del Piloto": current_elo }
          const eloMap = {};
          data.forEach(driver => {
            eloMap[driver.name] = driver.current_elo;
          });
          setEloData(eloMap);
        } else {
          setEloData(data);
        }
      })
      .catch(err => console.warn("No se pudo cargar el ELO.", err));
  }, []);

  const baseDriversList = useMemo(() => { 
    return [...rawDrivers] 
      .sort((a, b) => (b.points || 0) - (a.points || 0)) 
      .map((d, index) => {
        // Buscamos el ELO usando el nombre exacto del piloto
        const driverElo = eloData[d.name] !== undefined ? eloData[d.name] : null; 
        const cat = getCategoryByElo(driverElo);
        
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
          avgPoints: d.avg_points,  
          avgQualyPos: d.avg_qualy_pos,  
          avgQualyGap: d.avg_qualy_gap, 
          avgRacePos: d.avg_pos,  
          avgPaceGap: d.avg_gap,  
          races: d.races || 0,
          rounds: d.rounds || {} 
        };
      }); 
  }, [rawDrivers, eloData]); 
 
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

  const requestSort = (key) => { 
    let direction = 'desc'; 
    if (['driver', 'category', 'avgQualyGap', 'avgPaceGap', 'avgQualyPos', 'avgRacePos', 'races'].includes(key)) {
      direction = 'asc'; 
    }
    if (sortConfig && sortConfig.key === key && sortConfig.direction === direction) {
      direction = direction === 'asc' ? 'desc' : 'asc'; 
    }
    setSortConfig({ key, direction }); 
  }; 

  const isLegacySeason = activeSeason === 'season_1';

  // Obtenemos el calendario de la liga/temporada, o usamos la plantilla predefinida si está vacía
  const activeCalendar = leagueData?.calendar?.length > 0 
    ? leagueData.calendar 
    : (FUTURE_CALENDARS[`${activeLeague}-${activeSeason}`] || []);

  return (
    <div className="min-h-screen bg-black font-['Inter'] text-gray-300 py-8">
      <div className="max-w-[1536px] mx-auto px-4">
        
        <div className="mb-10 text-center md:text-left border-b border-gray-800 pb-8">
          <h1 className="font-['Teko'] text-6xl font-bold text-white mb-6 uppercase tracking-wide">Championship Standings</h1>
          <LeagueSelector 
            activeLeague={activeLeague} 
            setActiveLeague={setActiveLeague} 
            activeSeason={activeSeason} 
            setActiveSeason={setActiveSeason} 
          />
        </div>

        {!activeLeague || !activeSeason ? (
          <div className="bg-[#0a0a0a] p-16 text-center border border-gray-800 rounded-lg">
            <Flag className="w-20 h-20 text-gray-700 mx-auto mb-6 animate-pulse" />
            <h2 className="font-['Teko'] text-4xl text-gray-400 uppercase tracking-widest mb-2">Welcome to the Paddock</h2>
            <p className="text-gray-500 uppercase tracking-widest font-bold">Please select a League and a Season above.</p>
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
              {['ALL', 'ALIEN', 'DIAMOND', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE', 'ROOKIE'].map(cat => (
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

            {isLegacySeason ? (
              <LegacyStandings 
                drivers={sortedAndFilteredDrivers} 
                sortConfig={sortConfig}
                requestSort={requestSort}
                onDriverClick={onDriverClick}
              />
            ) : (
              <ModernStandings 
                drivers={sortedAndFilteredDrivers} 
                calendar={activeCalendar}
                sortConfig={sortConfig}
                requestSort={requestSort}
                onDriverClick={onDriverClick}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};