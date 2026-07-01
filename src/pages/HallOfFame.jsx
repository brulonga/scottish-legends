import { useState, useMemo } from 'react'; 
import { Medal, Swords, Search } from 'lucide-react'; 
import { useLeagueData } from '../hooks/useLeagueData'; 
import { isLegendDriver, getDriverProfile, DRIVER_PROFILES } from '../config/driversConfig'; 

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

export const HallOfFame = ({ onDriverClick, onNavigate }) => { 
  const { allLeaguesData, loading } = useLeagueData(); 
  const [searchQuery, setSearchQuery] = useState(''); 

  const allDriversData = useMemo(() => { 
    const driversMap = new Map();

    // Sumamos puntos de todos los archivos JSON cargados
    allLeaguesData.forEach(league => {
      (league.global || []).forEach(d => {
        const cleanName = normalizeName(d.name);

        if (!driversMap.has(cleanName)) {
          driversMap.set(cleanName, {
            name: cleanName,
            rawName: d.name, // Para buscar el perfil
            totalPoints: 0
          });
        }
        driversMap.get(cleanName).totalPoints += (d.points || 0);
      });
    });

    // Añadimos pilotos que están en config pero no corrieron aún
    Object.keys(DRIVER_PROFILES).forEach(name => {
      const cleanName = normalizeName(name);
      if (!driversMap.has(cleanName)) {
        driversMap.set(cleanName, { name: cleanName, rawName: name, totalPoints: 0 });
      }
    });

    return Array.from(driversMap.values())
      .sort((a, b) => b.totalPoints - a.totalPoints); 
  }, [allLeaguesData]); 

  const filteredCards = allDriversData.filter(d => { 
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase(); 
    return d.name.toLowerCase().includes(query);
  }); 

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-500"></div></div>; 

  return ( 
    <div className="min-h-screen bg-black font-['Inter'] text-gray-300 py-8"> 
      <div className="max-w-[1536px] mx-auto px-4"> 
         
        <div className="text-center mb-12"> 
          <div className="inline-flex items-center justify-center space-x-2 border border-yellow-500/30 px-6 py-2 rounded-full mb-6 bg-yellow-500/10"> 
            <Medal className="w-4 h-4 text-yellow-400" /> 
            <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest">Scottish Legends</span> 
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-20"> 
          {filteredCards.map((driver, idx) => { 
            const profile = getDriverProfile(driver.rawName);
            const isLegend = isLegendDriver(driver.rawName);
            const initials = profile?.siglas || getInitials(driver.name);
            
            const borderColor = isLegend ? 'border-purple-500/50' : 'border-gray-800'; 
            const bgColor = isLegend ? 'bg-purple-500' : 'bg-yellow-500'; 

            return ( 
              <div  
                key={driver.name}  
                onClick={() => onDriverClick(driver.rawName)} 
                className={`bg-[#0a0a0a] border ${borderColor} p-6 cursor-pointer group hover:border-yellow-500 transition-all duration-300 transform hover:-translate-y-1`} 
              > 
                <div className="flex items-center space-x-4"> 
                  <div className={`w-12 h-12 ${bgColor} flex items-center justify-center font-['Teko'] text-2xl font-black text-black uppercase`}> 
                    {initials} 
                  </div> 
                  <div className="flex-1 min-w-0"> 
                    <h3 className="font-['Teko'] text-2xl font-bold text-white truncate uppercase">{driver.name}</h3> 
                  </div> 
                </div> 
                
                <div className="mt-6 flex justify-between items-end">
                    <span className="text-gray-500 font-['Teko'] uppercase tracking-widest text-sm">Total Points</span>
                    <span className="font-['Teko'] text-4xl font-bold text-yellow-400">{driver.totalPoints}</span>
                </div>
              </div> 
            ); 
          })} 
        </div> 
      </div> 
    </div> 
  ); 
};