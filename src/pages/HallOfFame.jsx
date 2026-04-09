import { useState, useMemo } from 'react';
import { Medal, Swords, Search } from 'lucide-react'; // 🚀 Lupa añadida
import { useLeagueData } from '../hooks/useLeagueData';
import { isLegendDriver, getDriverProfile, DRIVER_PROFILES } from '../config/driversConfig';

const getInitials = (name) => {
  if (!name) return "DR";
  const cleanName = name.replace(/\[.*?\]/g, '').trim();
  const parts = cleanName.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return cleanName.substring(0, 2).toUpperCase();
};

const catColors = { PLATINUM: 'text-emerald-400', GOLD: 'text-yellow-400', SILVER: 'text-gray-300', BRONZE: 'text-amber-600', ROOKIE: 'text-red-500' };

const calcLeagueStats = (leagueDrivers) => {
  const cats = {};
  const eligible = leagueDrivers.filter(d => d.races >= 2);
  const withMetric = eligible.map(d => {
    let sum = 0, count = 0;
    if (!isNaN(parseFloat(d.avg_pos))) { sum += parseFloat(d.avg_pos); count++; }
    if (!isNaN(parseFloat(d.avg_pace_pos))) { sum += parseFloat(d.avg_pace_pos); count++; }
    if (!isNaN(parseFloat(d.avg_qualy_pos))) { sum += parseFloat(d.avg_qualy_pos); count++; }
    return { name: d.name, metric: count === 0 ? 999 : sum / count };
  }).sort((a, b) => a.metric - b.metric);

  withMetric.forEach((d, index) => {
    const expectedPos = index + 1;
    if (index < 10) cats[d.name] = { name: 'PLATINUM', expectedPos };
    else if (index < 20) cats[d.name] = { name: 'GOLD', expectedPos };
    else if (index < 30) cats[d.name] = { name: 'SILVER', expectedPos };
    else if (index < 40) cats[d.name] = { name: 'BRONZE', expectedPos };
    else cats[d.name] = { name: 'ROOKIE', expectedPos };
  });

  leagueDrivers.forEach(d => { if (!cats[d.name]) cats[d.name] = { name: 'ROOKIE', expectedPos: '-' }; });
  return cats;
};

export const HallOfFame = ({ onDriverClick, onNavigate }) => {
  const { getLeagueData, loading } = useLeagueData();
  const mondayData = getLeagueData('monday');
  const multiclassData = getLeagueData('multiclass');

  const [filterRole, setFilterRole] = useState('ALL'); 
  const [filterMonday, setFilterMonday] = useState('ALL');
  const [filterFriday, setFilterFriday] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState(''); // 🚀 NUEVO ESTADO PARA EL BUSCADOR

  const allDriversData = useMemo(() => {
    const mondayRaw = mondayData?.global || [];
    const fridayRaw = multiclassData?.global || [];
    const mondayStats = calcLeagueStats(mondayRaw);
    const fridayStats = calcLeagueStats(fridayRaw);

    const uniqueNames = new Set([...mondayRaw.map(d => d.name), ...fridayRaw.map(d => d.name), ...Object.keys(DRIVER_PROFILES)]);

    return Array.from(uniqueNames).map(name => {
      const mData = mondayRaw.find(d => d.name === name);
      const fData = fridayRaw.find(d => d.name === name);
      const profile = getDriverProfile(name);
      
      return {
        name,
        isLegend: isLegendDriver(name),
        profile,
        initials: profile.siglas || getInitials(name),
        totalPoints: (mData ? mData.points : 0) + (fData ? fData.points : 0),
        monday: mData ? { points: mData.points, expectedPos: mondayStats[name].expectedPos, cat: mondayStats[name].name } : null,
        friday: fData ? { points: fData.points, expectedPos: fridayStats[name].expectedPos, cat: fridayStats[name].name } : null,
      };
    }).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [mondayData, multiclassData]);

  // 🚀 LÓGICA DE FILTRADO ACTUALIZADA (Filtros + Buscador)
  const filteredCards = allDriversData.filter(d => {
    // Filtros de los selectores
    if (filterRole === 'LEGEND' && !d.isLegend) return false;
    if (filterRole === 'STANDARD' && d.isLegend) return false;
    if (filterMonday !== 'ALL' && (!d.monday || d.monday.cat !== filterMonday)) return false;
    if (filterFriday !== 'ALL' && (!d.friday || d.friday.cat !== filterFriday)) return false;
    
    // Buscador Inteligente
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = d.name.toLowerCase().includes(query);
      const matchesTeam = d.profile?.equipo?.toLowerCase().includes(query);
      const matchesDorsal = d.profile?.dorsal?.toString().includes(query);
      const matchesInitials = d.initials.toLowerCase().includes(query);
      
      if (!matchesName && !matchesTeam && !matchesDorsal && !matchesInitials) {
        return false;
      }
    }
    
    return true;
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
          <p className="text-gray-400 text-lg max-w-2xl mx-auto uppercase tracking-widest font-medium">The drivers who forge the history of Scottish Legends.</p>
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

        {/* 🚀 CAJA COMBINADA DE BÚSQUEDA Y FILTROS */}
        <div className="bg-[#0a0a0a] p-6 border border-gray-800 mb-10 shadow-xl">
          
          {/* BUSCADOR GIGANTE */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-8 h-8 text-yellow-500" />
            </div>
            <input
              type="text"
              placeholder="Search by driver name, team, number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border-2 border-gray-800 text-white font-['Teko'] text-3xl px-16 py-4 outline-none focus:border-yellow-500 transition-colors placeholder-gray-600 tracking-wide uppercase shadow-inner"
            />
          </div>

          {/* FILTROS TRADICIONALES */}
          <div className="flex flex-wrap gap-4 border-t border-gray-800 pt-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Driver Role</span>
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="bg-black border border-gray-700 text-white text-sm py-2 px-3 outline-none focus:border-yellow-500">
                <option value="ALL">All Drivers</option><option value="LEGEND">Legends Only</option><option value="STANDARD">Standard</option>
              </select>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Monday Marathon</span>
              <select value={filterMonday} onChange={(e) => setFilterMonday(e.target.value)} className="bg-black border border-gray-700 text-white text-sm py-2 px-3 outline-none focus:border-yellow-500">
                <option value="ALL">All Categories</option><option value="PLATINUM">Platinum</option><option value="GOLD">Gold</option><option value="SILVER">Silver</option><option value="BRONZE">Bronze</option><option value="ROOKIE">Rookie</option>
              </select>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Multiclass Friday</span>
              <select value={filterFriday} onChange={(e) => setFilterFriday(e.target.value)} className="bg-black border border-gray-700 text-white text-sm py-2 px-3 outline-none focus:border-yellow-500">
                <option value="ALL">All Categories</option><option value="PLATINUM">Platinum</option><option value="GOLD">Gold</option><option value="SILVER">Silver</option><option value="BRONZE">Bronze</option><option value="ROOKIE">Rookie</option>
              </select>
            </div>
          </div>
        </div>

        {/* GRID DE TARJETAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
          {filteredCards.length > 0 ? (
            filteredCards.map((driver) => {
              const borderColor = driver.isLegend ? 'border-purple-500/50' : 'border-yellow-500/50';
              const bgColor = driver.isLegend ? 'bg-purple-500' : 'bg-yellow-500';
              const textColor = driver.isLegend ? 'text-purple-400' : 'text-yellow-400';
              const hoverShadow = driver.isLegend ? 'hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]' : 'hover:shadow-[0_0_30px_rgba(250,204,21,0.15)]';

              return (
                <div 
                  key={driver.name} 
                  onClick={() => onDriverClick(driver.name)}
                  className={`relative bg-[#0a0a0a] border ${borderColor} p-6 overflow-hidden cursor-pointer group transition-all duration-300 ${hoverShadow} transform hover:-translate-y-1`}
                >
                  <div className="absolute -bottom-6 -right-4 font-['Teko'] text-9xl font-black text-white/[0.03] select-none pointer-events-none group-hover:text-white/[0.05] transition-colors">
                    #{driver.profile.dorsal}
                  </div>

                  <div className="flex items-start space-x-4 mb-6 relative z-10">
                    <div className={`w-14 h-14 ${bgColor} flex items-center justify-center shrink-0 shadow-lg`}>
                      <span className="font-['Teko'] text-3xl font-black text-black uppercase pt-1">{driver.initials}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        {driver.profile.avatar && <img src={driver.profile.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-gray-700" />}
                        <h3 className="font-['Teko'] text-3xl font-bold text-white truncate tracking-wide uppercase">{driver.name}</h3>
                      </div>
                      <div className={`text-xs font-bold uppercase tracking-widest mt-1 ${textColor} truncate`}>
                        #{driver.profile.dorsal} • {driver.profile.equipo}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 relative z-10">
                    <div className="bg-black border border-gray-800 p-3 flex flex-col justify-between">
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2 border-b border-gray-800 pb-1">Monday Marathon</div>
                      {driver.monday ? (
                        <>
                          <div className="flex justify-between items-end mb-1">
                            <span className="text-2xl font-['Teko'] font-bold text-white">{driver.monday.points} <span className="text-sm text-gray-600">PTS</span></span>
                            <span className="text-xl font-['Teko'] font-bold text-blue-400">P{driver.monday.expectedPos}</span>
                          </div>
                          <span className={`text-[9px] uppercase font-bold ${catColors[driver.monday.cat]}`}>{driver.monday.cat}</span>
                        </>
                      ) : <div className="text-gray-600 text-xs font-mono">- No Data -</div>}
                    </div>

                    <div className="bg-black border border-gray-800 p-3 flex flex-col justify-between">
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2 border-b border-gray-800 pb-1">Multiclass Friday</div>
                      {driver.friday ? (
                        <>
                          <div className="flex justify-between items-end mb-1">
                            <span className="text-2xl font-['Teko'] font-bold text-white">{driver.friday.points} <span className="text-sm text-gray-600">PTS</span></span>
                            <span className="text-xl font-['Teko'] font-bold text-blue-400">P{driver.friday.expectedPos}</span>
                          </div>
                          <span className={`text-[9px] uppercase font-bold ${catColors[driver.friday.cat]}`}>{driver.friday.cat}</span>
                        </>
                      ) : <div className="text-gray-600 text-xs font-mono">- No Data -</div>}
                    </div>
                  </div>
                  
                  {driver.isLegend && (
                    <div className="absolute top-4 right-4 border border-purple-500/50 bg-purple-500/10 px-2 py-0.5 rounded text-[9px] font-bold text-purple-400 uppercase tracking-widest z-10">
                      Legend
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="col-span-1 md:col-span-2 xl:col-span-3 text-center py-20 border border-dashed border-gray-800">
              <Search className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400 text-lg font-bold uppercase tracking-widest">No drivers found matching your search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};