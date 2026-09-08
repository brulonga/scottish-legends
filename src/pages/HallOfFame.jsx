import { useState, useMemo, useEffect } from 'react'; 
import { Medal, Swords, Search, TrendingUp, Flag } from 'lucide-react'; 
import { useLeagueData } from '../hooks/useLeagueData'; 
import { isLegendDriver, getDriverProfile, DRIVER_PROFILES } from '../config/driversConfig'; 
import { getCategoryByElo } from '../utils/categoryEngine'; // 🚀 IMPORTAMOS EL MOTOR DE ELO

const getInitials = (name) => { 
  if (!name) return "DR"; 
  const cleanName = name.replace(/\[.*?\]|\|.*/g, '').trim(); 
  const parts = cleanName.split(' '); 
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase(); 
  return cleanName.substring(0, 2).toUpperCase(); 
}; 

// 🧹 LIMPIADOR DE NOMBRES
const normalizeName = (name) => {
  if (!name) return "";
  return name.replace(/\[.*?\]|\|.*/g, '').trim();
};

// 🎨 MAPEADOR DE COLORES PARA LAS TARJETAS SEGÚN CATEGORÍA
const getCategoryStyles = (categoryName) => {
  const baseName = categoryName ? categoryName.split(' ')[0] : 'ROOKIE';

  switch(baseName) {
    // 🚀 NUEVO ESTILO PARA SCOTTISH-LEGEND (Azul oscuro / Marino)
    case 'SCOTTISH-LEGEND': return { border: 'border-blue-900/80', bg: 'bg-blue-950', text: 'text-blue-400', hover: 'hover:border-blue-600 shadow-[0_0_20px_rgba(30,58,138,0.4)]' };
    
    case 'ALIEN': return { border: 'border-fuchsia-500/50', bg: 'bg-fuchsia-500', text: 'text-fuchsia-400', hover: 'hover:border-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.15)]' };
    case 'DIAMOND': return { border: 'border-cyan-400/50', bg: 'bg-cyan-400', text: 'text-cyan-400', hover: 'hover:border-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.15)]' };
    case 'PLATINUM': return { border: 'border-indigo-300/60', bg: 'bg-indigo-950/40', text: 'text-indigo-200', hover: 'hover:border-indigo-200 shadow-[0_0_20px_rgba(129,140,248,0.25)]' };
    case 'GOLD': return { border: 'border-yellow-400/50', bg: 'bg-yellow-400', text: 'text-yellow-400', hover: 'hover:border-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.15)]' };
    case 'SILVER': return { border: 'border-zinc-400/50', bg: 'bg-zinc-400', text: 'text-zinc-400', hover: 'hover:border-zinc-300 shadow-[0_0_15px_rgba(161,161,170,0.15)]' };
    case 'BRONZE': return { border: 'border-amber-600/50', bg: 'bg-amber-600', text: 'text-amber-600', hover: 'hover:border-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.15)]' };
    case 'UNRANKED': return { border: 'border-gray-500/50', bg: 'bg-gray-500', text: 'text-gray-500', hover: 'hover:border-gray-400 shadow-[0_0_15px_rgba(107,114,128,0.15)]' };
    default: return { border: 'border-green-500/50', bg: 'bg-green-500', text: 'text-green-500', hover: 'hover:border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.15)]' };
  }
};

export const HallOfFame = ({ onDriverClick, onNavigate }) => { 
  const { allLeaguesData, loading } = useLeagueData(); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [eloData, setEloData] = useState([]);
  const [loadingElo, setLoadingElo] = useState(true);

  // 🚀 CARGAMOS EL ELO DIRECTAMENTE DESDE EL JSON
  useEffect(() => {
    fetch('/data/elo/driver_elos.json')
      .then(res => res.json())
      .then(data => {
         if (Array.isArray(data)) setEloData(data);
         setLoadingElo(false);
      })
      .catch(err => {
         console.warn("No se pudo cargar el archivo ELO", err);
         setLoadingElo(false);
      });
  }, []);

  const allDriversData = useMemo(() => { 
    const driversMap = new Map();

    // 1. Base principal: Extraemos el ELO y las carreras jugadas del JSON
    eloData.forEach(d => {
      const cleanName = normalizeName(d.name);
      driversMap.set(cleanName, {
        name: cleanName,
        rawName: d.name,
        elo: d.current_elo,
        races: d.races_completed
      });
    });

    // 2. Pilotos en ligas recientes que quizás aún no tengan ELO procesado (se les da 1500)
    allLeaguesData.forEach(league => {
      (league.global || []).forEach(d => {
        const cleanName = normalizeName(d.name);
        if (!driversMap.has(cleanName)) {
          driversMap.set(cleanName, { name: cleanName, rawName: d.name, elo: 1500, races: d.races || 0 });
        }
      });
    });

    // 3. Pilotos en Configuración (por si hay retirados o reservas)
    Object.keys(DRIVER_PROFILES).forEach(name => {
      const cleanName = normalizeName(name);
      if (!driversMap.has(cleanName)) {
        driversMap.set(cleanName, { name: cleanName, rawName: name, elo: 1500, races: 0 });
      }
    });

    // 🚀 ORDENAMOS POR ELO DESCENDENTE
    return Array.from(driversMap.values())
      .sort((a, b) => b.elo - a.elo); 
  }, [allLeaguesData, eloData]); 

  const filteredCards = allDriversData.filter(d => { 
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase(); 
    return d.name.toLowerCase().includes(query);
  }); 

  if (loading || loadingElo) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-500"></div></div>; 

  return ( 
    <div className="min-h-screen bg-black font-['Inter'] text-gray-300 py-8"> 
      <div className="max-w-[1536px] mx-auto px-4"> 
         
        <div className="text-center mb-12"> 
          <div className="inline-flex items-center justify-center space-x-2 border border-yellow-500/30 px-6 py-2 rounded-full mb-6 bg-yellow-500/10"> 
            <Medal className="w-4 h-4 text-yellow-400" /> 
            <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest">Global Ranking</span> 
          </div> 
          <h1 className="font-['Teko'] text-7xl md:text-9xl font-bold text-white mb-4 uppercase tracking-wide drop-shadow-lg"> 
            The <span className="text-yellow-400">Grid</span> 
          </h1> 
        </div> 

        <div className="mb-12 flex justify-center"> 
          <button  
            onClick={() => onNavigate('compare')} 
            className="group relative px-10 py-4 bg-[#0a0a0a] border border-yellow-500/50 hover:bg-yellow-500 text-yellow-400 hover:text-black font-['Teko'] text-4xl uppercase tracking-widest flex items-center space-x-4 transition-all transform -skew-x-12 shadow-[0_0_20px_rgba(250,204,21,0.2)]" 
          > 
            <div className="flex items-center space-x-3 transform skew-x-12"> 
              <Swords className="w-8 h-8" /> 
              <span className="mt-1">Enter Head-to-Head Arena</span> 
            </div> 
          </button> 
        </div> 

        <div className="max-w-2xl mx-auto mb-10"> 
          <div className="relative"> 
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"> 
              <Search className="w-8 h-8 text-yellow-500" /> 
            </div> 
            <input 
              type="text" 
              placeholder="Search driver..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full bg-[#0a0a0a] border-2 border-gray-800 text-white font-['Teko'] text-3xl px-16 py-4 outline-none focus:border-yellow-500 transition-colors placeholder-gray-600 tracking-wide uppercase shadow-inner" 
            /> 
          </div> 
        </div> 

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pb-20"> 
          {filteredCards.map((driver, idx) => { 
            const profile = getDriverProfile(driver.rawName);
            const isLegend = isLegendDriver(driver.rawName);
            const initials = profile?.siglas || getInitials(driver.name);
            
            // 🚀 OBTENEMOS EL COLOR DE LA CATEGORÍA BASADO EN EL ELO
            const categoryInfo = getCategoryByElo(driver.elo);
            const style = getCategoryStyles(categoryInfo.name);

            return ( 
              <div  
                key={driver.name}  
                onClick={() => onDriverClick(driver.rawName)} 
                className={`bg-[#0a0a0a] border ${style.border} ${style.hover} p-6 cursor-pointer group transition-all duration-300 transform hover:-translate-y-1`} 
              > 
                <div className="flex items-start justify-between space-x-4"> 
                  <div className="flex items-center space-x-4">
                    <div className={`w-14 h-14 ${style.bg} flex items-center justify-center font-['Teko'] text-3xl font-black text-black uppercase shadow-inner`}> 
                      {initials} 
                    </div> 
                    <div className="flex-1 min-w-0"> 
                      <h3 className="font-['Teko'] text-3xl font-bold text-white truncate uppercase">{driver.name}</h3> 
                      {/* Categoría y Leyenda */}
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-[10px] px-1.5 py-0.5 border ${style.border} ${style.text} bg-black font-bold uppercase tracking-widest`}>
                          {categoryInfo.name}
                        </span>
                        {isLegend && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-purple-600 text-white font-bold uppercase tracking-widest rounded-sm">
                            LEGEND
                          </span>
                        )}
                      </div>
                    </div> 
                  </div>
                  {/* Puesto Global */}
                  <span className="font-['Teko'] text-3xl text-gray-700 font-bold opacity-50 group-hover:opacity-100 transition-opacity">
                    #{idx + 1}
                  </span>
                </div> 
                
                {/* 🚀 ESTADÍSTICAS INFERIORES: CARRERAS Y ELO */}
                <div className="mt-6 flex justify-between items-end border-t border-gray-800/50 pt-4">
                  <div className="flex flex-col">
                    <span className="text-gray-500 flex items-center space-x-1 font-bold uppercase tracking-widest text-[10px]">
                      <Flag className="w-3 h-3" /> <span>Races</span>
                    </span>
                    <span className="font-['Teko'] text-3xl font-bold text-gray-300 ml-4">{driver.races}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-gray-500 flex items-center space-x-1 font-bold uppercase tracking-widest text-[10px]">
                       <span>Rating</span> <TrendingUp className="w-3 h-3" />
                    </span>
                    <span className={`font-['Teko'] text-5xl font-bold leading-none ${style.text}`}>{driver.elo}</span>
                  </div>
                </div>
              </div> 
            ); 
          })} 
        </div> 
      </div> 
    </div> 
  ); 
};