import { useState, useMemo, useEffect } from 'react';
import { User, ArrowLeft, AlertTriangle, Clock, Award, Flag, Timer, Activity, Trophy, TrendingUp } from 'lucide-react';
import { useLeagueData } from '../hooks/useLeagueData';
import { getDriverProfile, DRIVER_PROFILES } from '../config/driversConfig';
import { getCategoryByElo } from '../utils/categoryEngine'; 
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LeagueSelector } from './LeagueSelector';
import driverHistoryDB from '../config/driver_history.json'; 

// 🧹 LIMPIADOR DE NOMBRES GLOBAL
const normalizeName = (name) => {
  if (!name) return "";
  return name.replace(/\[.*?\]|\|.*/g, '').trim();
};

const msToTimeStr = (ms) => { 
  if (!ms || ms === Infinity || ms >= 2000000000) return "-"; 
  let minutes = Math.floor(ms / 60000); 
  let seconds = Math.floor((ms % 60000) / 1000); 
  let milis = Math.floor(ms % 1000); 
  return `${minutes > 0 ? minutes + ':' : ''}${seconds.toString().padStart(2, '0')}.${milis.toString().padStart(3, '0')}`; 
};

// 💡 TOOLTIP PERSONALIZADO PARA LA GRÁFICA DE ELO
const EloTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isPositive = data.change && data.change.toString().includes('+');
    return (
      <div className="bg-black border border-gray-700 p-4 shadow-2xl rounded-lg">
        <p className="text-white font-bold font-['Teko'] text-2xl mb-2">{data.raceName}</p>
        <p className="text-gray-300 font-bold uppercase tracking-widest text-xs mb-1">
          New ELO: <span className="text-yellow-400 text-lg">{data.elo}</span>
        </p>
        <p className={`font-bold uppercase tracking-widest text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          Change: {data.change}
        </p>
      </div>
    );
  }
  return null;
};

export const DriverProfile = ({ driverName: propsDriverName, onNavigate }) => {
  const [activeLeague, setActiveLeague] = useState(null);
  const [activeSeason, setActiveSeason] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedRaceIdx, setSelectedRaceIdx] = useState(0);
  const [allEloData, setAllEloData] = useState([]);

  const { leagueData, loading, error } = useLeagueData(activeLeague, activeSeason);
  const globalData = leagueData?.global || [];
  const sessions = leagueData?.sessions || [];

  // 🚀 LECTURA DEL ARCHIVO DE ELO
  useEffect(() => {
    fetch('/data/elo/driver_elos.json')
      .then(res => res.json())
      .then(data => {
         if (Array.isArray(data)) setAllEloData(data);
      })
      .catch(err => console.warn("No se pudo cargar el historial de ELO", err));
  }, []);

  // 🚀 LISTA GLOBAL DE PILOTOS UNIFICADA
  const allKnownDrivers = useMemo(() => {
    const set = new Set(Object.keys(DRIVER_PROFILES).map(normalizeName));
    globalData.forEach(d => set.add(normalizeName(d.name)));
    allEloData.forEach(d => set.add(normalizeName(d.name)));
    return Array.from(set).sort();
  }, [globalData, allEloData]);

  useEffect(() => {
    if (propsDriverName) setSelectedDriver(normalizeName(propsDriverName));
  }, [propsDriverName]);

  useEffect(() => { setSelectedRaceIdx(0); }, [selectedDriver, activeLeague, activeSeason]);

  // 🚀 PROCESAMIENTO DEL PILOTO SELECCIONADO
  const profile = selectedDriver ? getDriverProfile(selectedDriver) : null;
  const dStats = globalData.find(d => normalizeName(d.name) === selectedDriver);
  const driverHistory = driverHistoryDB[selectedDriver] || profile?.history || [];
  
  const driverEloInfo = useMemo(() => {
    return allEloData.find(d => normalizeName(d.name) === selectedDriver) || null;
  }, [allEloData, selectedDriver]);

  const currentElo = driverEloInfo ? driverEloInfo.current_elo : null;
  const categoryInfo = getCategoryByElo(currentElo);

  // 🚀 CÁLCULO DE RANKING Y PERCENTIL
  const { rank, percentile, totalDriversCount } = useMemo(() => {
    if (!currentElo || allEloData.length === 0 || !selectedDriver) return { rank: '-', percentile: '-', totalDriversCount: 0 };
    
    const sortedList = [...allEloData].sort((a, b) => b.current_elo - a.current_elo);
    const driverIndex = sortedList.findIndex(d => normalizeName(d.name).toLowerCase() === selectedDriver.toLowerCase());
    
    if (driverIndex === -1) return { rank: '-', percentile: '-', totalDriversCount: sortedList.length };

    const driverRank = driverIndex + 1;
    const total = sortedList.length;
    const calcPercentil = Math.round(((total - driverIndex) / total) * 100);

    return {
      rank: `#${driverRank}`,
      percentile: `Top ${Math.max(1, 100 - calcPercentil)}%`,
      totalDriversCount: total
    };
  }, [allEloData, currentElo, selectedDriver]);

  const eloChartData = useMemo(() => {
    if (!driverEloInfo || !driverEloInfo.history) return [];
    return driverEloInfo.history.map((h, index) => ({
      raceNumber: `Race ${index + 1}`,
      raceName: h.race_name,
      elo: h.new_elo,
      change: h.elo_change > 0 ? `+${h.elo_change}` : h.elo_change
    }));
  }, [driverEloInfo]);

  // 🚀 HISTORIAL MATRIZ (Ligas x Temporadas)
  const historyMatrix = useMemo(() => {
    const defaultLeagues = ["Monday Marathon", "Fun Friday"];
    const defaultSeasons = ["Season 1", "Season 2"];

    let leagues = [...defaultLeagues];
    let seasons = [...defaultSeasons];

    if (driverHistory.length > 0) {
      const histLeagues = driverHistory.map(h => h.league);
      const histSeasons = driverHistory.map(h => h.season);
      leagues = Array.from(new Set([...defaultLeagues, ...histLeagues]));
      seasons = Array.from(new Set([...defaultSeasons, ...histSeasons])).sort();
    }

    return { leagues, seasons };
  }, [driverHistory]);

  // 🚀 PROCESAMIENTO DE GRÁFICAS DE LA TEMPORADA
  const { chartData, personalBests, telemetryData, availableRaces } = useMemo(() => {
    if (!selectedDriver || !sessions.length || !dStats) return { chartData: [], personalBests: [], telemetryData: [], availableRaces: [] };
    
    const cData = [];
    const pb = {};
    const aRaces = [];
    
    sessions.forEach((event) => {
      const subSessions = Array.isArray(event.sessions) ? event.sessions : [event];
      
      subSessions.forEach((session) => {
        const track = session.name || event.name;
        const r = session.results?.find(res => normalizeName(res.name) === selectedDriver);
        const q = session.qualy_results?.find(res => normalizeName(res.name) === selectedDriver);
        const winner = session.results?.[0]; 
        
        if (!pb[track]) pb[track] = { qualy: Infinity, race: Infinity, car: '-' };
        
        if (q && q.best_lap_ms && q.best_lap_ms < pb[track].qualy) {
            pb[track].qualy = q.best_lap_ms;
            pb[track].car = q.car_class || pb[track].car;
        }
        if (r && r.best_lap_ms && r.best_lap_ms < pb[track].race) {
            pb[track].race = r.best_lap_ms;
            pb[track].car = r.car_class || pb[track].car;
        }

        if (r) {
            const calcLost = (res) => {
              if (!res || !res.lap_history || !res.avg_lap_ms) return 0;
              let lost = 0;
              res.lap_history.forEach(l => { if (l.is_incident) lost += (l.time_ms - res.avg_lap_ms); });
              return parseFloat((lost / 1000).toFixed(1));
            };

            const parseGap = (ms) => {
              if (ms == null || ms === "-") return null;
              let secs = ms / 1000;
              return track.toLowerCase().includes("nurburgring") ? parseFloat((secs / 4).toFixed(3)) : parseFloat(secs.toFixed(3));
            };
            
            cData.push({
                track: track,
                Pos: String(r.pos).toUpperCase() !== "DNF" ? parseInt(r.class_pos || r.pos) : null,
                QualyPos: String(r.qualy_pos) !== "-" ? parseInt(r.qualy_pos) : null,
                PacePos: String(r.pace_pos) !== "-" ? parseInt(r.pace_pos) : null,
                IncLost: calcLost(r),
                WinnerLost: calcLost(winner),
                PaceGap: parseGap(r.gap_pace_ms),
                WinnerPaceGap: parseGap(winner?.gap_pace_ms) || 0
            });

            aRaces.push({
                name: track,
                history: r.lap_history || [],
                winnerHistory: winner?.lap_history || []
            });
        }
      });
    });

    const tData = [];
    const activeRace = aRaces[selectedRaceIdx];
    if (activeRace) {
        const maxLaps = Math.max(activeRace.history?.length || 0, activeRace.winnerHistory?.length || 0);
        for (let i = 0; i < maxLaps; i++) {
            const dLap = activeRace.history?.[i];
            const wLap = activeRace.winnerHistory?.[i];
            
            tData.push({
                lap: `L${i + 1}`,
                Time: dLap && !dLap.is_incident ? parseFloat((dLap.time_ms / 1000).toFixed(3)) : null,
                WinnerTime: wLap && !wLap.is_incident ? parseFloat((wLap.time_ms / 1000).toFixed(3)) : null
            });
        }
    }

    return { 
        chartData: cData, 
        personalBests: Object.entries(pb).map(([t, times]) => ({ track: t, ...times })),
        telemetryData: tData,
        availableRaces: aRaces
    };
  }, [sessions, selectedDriver, selectedRaceIdx, dStats]);

  return (
    <div className="min-h-screen bg-black font-['Inter'] text-gray-300 py-8">
      <div className="max-w-[1200px] mx-auto px-4">
        
        <button onClick={() => onNavigate('hall-of-fame')} className="flex items-center space-x-2 text-yellow-500 hover:text-yellow-400 font-bold uppercase tracking-widest mb-8 transition-colors text-sm">
          <ArrowLeft className="w-5 h-5" /><span>Back to The Grid</span>
        </button>

        {/* SELECTOR GLOBAL DE PILOTO */}
        <div className="bg-[#0a0a0a] border border-gray-800 p-6 md:p-8 shadow-2xl text-left max-w-3xl mx-auto mb-12 rounded-lg">
          <label className="text-[10px] text-yellow-500 uppercase font-bold tracking-widest mb-2 block">1. Select Driver</label>
          <select value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)} className="w-full bg-black border border-gray-700 text-white p-4 font-bold uppercase tracking-widest outline-none focus:border-yellow-500 cursor-pointer rounded">
            <option value="">-- Choose a Driver --</option>
            {allKnownDrivers.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>

        {!selectedDriver ? (
          <div className="bg-[#0a0a0a] p-16 text-center border border-gray-800 rounded-lg">
            <User className="w-20 h-20 text-gray-700 mx-auto mb-6 animate-pulse" />
            <h2 className="font-['Teko'] text-4xl text-gray-400 uppercase tracking-widest mb-2">Awaiting Driver</h2>
            <p className="text-gray-500 uppercase tracking-widest font-bold">Please select a driver from the list above.</p>
          </div>
        ) : (
          <>
            {/* BLOQUE 1: CABECERA DEL PILOTO */}
            <div className="bg-[#0a0a0a] border border-gray-800 p-6 md:p-8 shadow-2xl mb-12 animate-fade-in relative overflow-hidden rounded-lg">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <User className="w-64 h-64 text-white" />
              </div>
              
              <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-8 relative z-10">
                {profile?.avatar ? (
                  <img src={profile.avatar} className="w-32 h-32 rounded-full border-4 border-gray-700 object-cover shadow-[0_0_30px_rgba(0,0,0,0.5)] mb-4 md:mb-0" alt="Avatar" />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-gray-700 bg-gray-900 flex items-center justify-center mb-4 md:mb-0 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                    <User className="w-12 h-12 text-gray-600" />
                  </div>
                )}
                <div className="text-center md:text-left flex-1">
                  <h2 className="font-['Teko'] text-5xl md:text-7xl font-bold text-white uppercase leading-none">{selectedDriver}</h2>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                    
                    <span className={`border px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-sm border-gray-700 bg-gray-900 shadow-md ${categoryInfo.color}`}>
                      {categoryInfo.name}
                    </span>

                    {currentElo && (
                      <span className="bg-gray-800 text-white border border-gray-600 px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-sm flex items-center shadow-md">
                        <TrendingUp className="w-3 h-3 mr-2 text-blue-400" /> {currentElo} ELO
                      </span>
                    )}
                    
                    {profile?.equipo && (
                      <span className="bg-gray-800 text-gray-300 border border-gray-700 px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-sm shadow-md">
                        {profile.equipo}
                      </span>
                    )}
                    {profile?.dorsal && (
                      <span className="bg-blue-900/30 text-blue-400 border border-blue-500/30 px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-sm shadow-md">
                        #{profile.dorsal}
                      </span>
                    )}
                    {profile?.nacionalidad && (
                      <span className="text-2xl ml-2 drop-shadow-md">
                        {profile.nacionalidad}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* BLOQUE 2: GRÁFICA DE ELO Y RANKING GLOBAL */}
            {eloChartData.length > 0 && (
              <div className="bg-[#0a0a0a] border border-gray-800 p-6 md:p-8 shadow-2xl mb-12 animate-fade-in rounded-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                  <h3 className="font-['Teko'] text-3xl font-bold text-white uppercase tracking-wide flex items-center mb-4 md:mb-0">
                    <TrendingUp className="w-6 h-6 mr-3 text-purple-500"/> ELO Progression
                  </h3>

                  {/* ESTADÍSTICAS DE RANKING Y PERCENTIL */}
                  <div className="flex items-center space-x-4 bg-black border border-gray-800 px-4 py-2 rounded-lg">
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Global Rank</span>
                      <span className="font-['Teko'] text-2xl font-bold text-yellow-400 leading-none">{rank} <span className="text-xs text-gray-600 font-sans">/ {totalDriversCount}</span></span>
                    </div>
                    <div className="h-8 w-px bg-gray-800"></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Standing</span>
                      <span className="font-['Teko'] text-2xl font-bold text-cyan-400 leading-none">{percentile}</span>
                    </div>
                  </div>
                </div>

                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={eloChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis dataKey="raceNumber" stroke="#6b7280" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis domain={['auto', 'auto']} stroke="#6b7280" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <Tooltip content={<EloTooltip />} cursor={{ stroke: '#374151', strokeWidth: 2 }} />
                      <Area 
                        type="monotone" 
                        dataKey="elo" 
                        name="ELO Rating" 
                        stroke="#a855f7" 
                        fill="#a855f7" 
                        fillOpacity={0.15} 
                        strokeWidth={3} 
                        dot={{ r: 4, fill: '#a855f7', strokeWidth: 2, stroke: '#000' }} 
                        activeDot={{ r: 6, fill: '#fff', stroke: '#a855f7' }} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* BLOQUE 3: HISTORIAL MATRIZ */}
            {driverHistory.length > 0 && (
              <div className="bg-[#0a0a0a] border border-gray-800 p-6 md:p-8 shadow-2xl mb-12 animate-fade-in rounded-lg">
                <h3 className="font-['Teko'] text-3xl font-bold text-white mb-6 uppercase tracking-wide flex items-center">
                  <Trophy className="w-6 h-6 mr-3 text-yellow-500"/> Career History
                </h3>
                <div className="bg-black border border-gray-800 overflow-x-auto shadow-xl rounded-lg">
                  <table className="w-full text-center whitespace-nowrap">
                    <thead className="bg-[#111] border-b border-gray-800">
                      <tr>
                        <th className="px-6 py-4 text-left font-['Teko'] text-2xl text-gray-500 uppercase tracking-widest border-r border-gray-800/50">Season</th>
                        {historyMatrix.leagues.map(league => (
                          <th key={league} className="px-6 py-4 font-['Teko'] text-2xl text-white uppercase tracking-widest">{league}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {historyMatrix.seasons.map(season => (
                        <tr key={season} className="hover:bg-gray-900/50 transition-colors">
                          <td className="px-6 py-4 text-left font-bold text-gray-400 uppercase tracking-widest text-sm bg-gray-900/20 border-r border-gray-800/50">
                            {season}
                          </td>
                          {historyMatrix.leagues.map(league => {
                            const record = driverHistory.find(h => h.league === league && h.season === season);
                            
                            if (!record) return <td key={league} className="px-6 py-4 text-gray-700 font-bold text-xl">-</td>;

                            let trophyColor = "text-gray-400";
                            let glow = "";
                            if (record.position === 1) { trophyColor = "text-yellow-400"; glow = "drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]"; }
                            else if (record.position === 2) { trophyColor = "text-gray-300"; glow = "drop-shadow-[0_0_8px_rgba(209,213,219,0.8)]"; }
                            else if (record.position === 3) { trophyColor = "text-amber-600"; glow = "drop-shadow-[0_0_8px_rgba(217,119,6,0.8)]"; }

                            return (
                              <td key={league} className="px-6 py-4">
                                <div className="flex items-center justify-center space-x-3">
                                  <span className={`font-['Teko'] text-4xl font-bold leading-none ${trophyColor} ${glow}`}>
                                    P{record.position}
                                  </span>
                                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-sm border border-gray-700 bg-gray-900 text-gray-400">
                                    {record.category || 'ROOKIE'}
                                  </span>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* BLOQUE 4: SELECTOR DE TEMPORADA Y TELEMETRÍA */}
            <div className="border-t-2 border-dashed border-gray-800 pt-12 mt-12 mb-8 text-center">
              <h2 className="font-['Teko'] text-5xl font-bold text-white mb-2 uppercase tracking-wide">
                Season <span className="text-blue-400">Analysis</span>
              </h2>
              <p className="text-gray-400 text-sm uppercase tracking-widest font-bold mb-8">Select a league to view detailed telemetry</p>
              
              <div className="max-w-3xl mx-auto">
                <LeagueSelector 
                  activeLeague={activeLeague} 
                  setActiveLeague={setActiveLeague} 
                  activeSeason={activeSeason} 
                  setActiveSeason={setActiveSeason} 
                />
              </div>
            </div>

            {!activeLeague || !activeSeason ? (
              <div className="py-12"></div>
            ) : loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-900/20 p-8 text-center border border-red-500/30 rounded-lg">
                <p className="text-red-400 uppercase tracking-widest font-bold">{error}</p>
              </div>
            ) : !dStats ? (
              <div className="bg-[#0a0a0a] p-16 text-center border border-gray-800 shadow-2xl animate-fade-in rounded-lg">
                <Flag className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <h3 className="font-['Teko'] text-3xl font-bold text-gray-400 uppercase tracking-wide">No Data Available</h3>
                <p className="text-gray-500 uppercase tracking-widest font-bold">This driver did not participate in the selected season.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 animate-fade-in">
                  {[
                    { label: 'Total Points', value: dStats.points },
                    { label: 'Races Run', value: dStats.races },
                    { label: 'Avg Pos', value: `P${dStats.avg_pos || '-'}` },
                    { label: 'Avg Qualy', value: `P${dStats.avg_qualy_pos || '-'}` },
                    { label: 'Avg Pace Gap', value: dStats.avg_gap || '-' },
                    { label: 'Avg Qualy Gap', value: dStats.avg_qualy_gap || '-' },
                    { label: 'Net Pos Gained', value: dStats.net_pos_gained > 0 ? `+${dStats.net_pos_gained}` : dStats.net_pos_gained },
                    { label: 'Favorite Car', value: dStats.favorite_car || '-' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-black border border-gray-800 p-4 text-center hover:border-blue-500/50 transition-colors rounded-lg">
                      <div className="font-['Teko'] text-4xl text-white font-bold">{stat.value}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {personalBests.length > 0 && (
                  <div className="bg-[#0a0a0a] border border-gray-800 shadow-2xl mb-12 animate-fade-in rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-gray-800 bg-black flex items-center space-x-3">
                      <Timer className="w-6 h-6 text-blue-400" />
                      <h3 className="font-['Teko'] text-3xl font-bold text-white uppercase tracking-wide">Personal Best Times</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-black text-gray-500 uppercase tracking-widest text-xs border-b border-gray-800">
                          <tr>
                            <th className="px-6 py-4 font-bold">Track</th>
                            <th className="px-6 py-4 font-bold">Class</th>
                            <th className="px-6 py-4 font-bold text-purple-400">Best Qualy</th>
                            <th className="px-6 py-4 font-bold text-blue-400">Best Race</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                          {personalBests.map((pb, idx) => (
                            <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                              <td className="px-6 py-4 font-bold text-gray-200 uppercase tracking-wide">{pb.track}</td>
                              <td className="px-6 py-4"><span className="bg-gray-800 text-gray-300 px-2 py-1 text-xs font-bold rounded">{pb.car}</span></td>
                              <td className="px-6 py-4 font-mono text-purple-400 font-bold">{msToTimeStr(pb.qualy)}</td>
                              <td className="px-6 py-4 font-mono text-blue-400 font-bold">{msToTimeStr(pb.race)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {chartData.length > 0 && (
                  <div className="space-y-6 mb-12 animate-fade-in">
                    <div className="bg-[#0a0a0a] border border-gray-800 p-6 md:p-8 shadow-2xl rounded-lg">
                      <h3 className="font-['Teko'] text-3xl font-bold text-white mb-6 uppercase tracking-wide flex items-center"><Award className="w-6 h-6 mr-2 text-blue-400"/> Position History</h3>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                            <XAxis dataKey="track" stroke="#6b7280" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                            <YAxis reversed={true} stroke="#6b7280" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#374151', color: '#fff' }} />
                            <Legend />
                            <Line type="monotone" dataKey="Pos" name="Finish Position" stroke="#eab308" strokeWidth={3} dot={{ r: 4, fill: '#eab308' }} connectNulls={true} />
                            <Line type="monotone" dataKey="QualyPos" name="Qualy Position" stroke="#eab308" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls={true} />
                            <Line type="monotone" dataKey="PacePos" name="Pace Position" stroke="#eab308" strokeWidth={2} strokeDasharray="3 3" dot={false} connectNulls={true} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-[#0a0a0a] border border-gray-800 p-6 shadow-2xl rounded-lg">
                        <h3 className="font-['Teko'] text-3xl font-bold text-white mb-6 uppercase tracking-wide flex items-center"><AlertTriangle className="w-6 h-6 mr-2 text-red-500"/> Incident Time Lost (s)</h3>
                        <div className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                              <XAxis dataKey="track" stroke="#6b7280" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                              <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                              <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#374151', color: '#fff' }} />
                              <Legend />
                              <Area type="monotone" dataKey="WinnerLost" name="Winner Baseline" stroke="#eab308" fill="#eab308" fillOpacity={0.1} strokeWidth={2} />
                              <Area type="monotone" dataKey="IncLost" name="Driver Time Lost" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} strokeWidth={2} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="bg-[#0a0a0a] border border-gray-800 p-6 shadow-2xl rounded-lg">
                        <h3 className="font-['Teko'] text-3xl font-bold text-white mb-6 uppercase tracking-wide flex items-center"><Clock className="w-6 h-6 mr-2 text-blue-400"/> Race Pace Gap (s)</h3>
                        <div className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                              <XAxis dataKey="track" stroke="#6b7280" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                              <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                              <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#374151', color: '#fff' }} />
                              <Legend />
                              <Line type="monotone" dataKey="WinnerPaceGap" name="Winner Baseline" stroke="#eab308" strokeWidth={2} strokeDasharray="3 3" connectNulls={true} />
                              <Line type="monotone" dataKey="PaceGap" name="Driver Pace Gap" stroke="#3b82f6" strokeWidth={2} connectNulls={true} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {availableRaces.length > 0 && (
                      <div className="bg-[#0a0a0a] border border-gray-800 p-6 md:p-8 shadow-2xl rounded-lg">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
                          <h3 className="font-['Teko'] text-3xl font-bold text-white uppercase tracking-wide flex items-center">
                            <Activity className="w-6 h-6 mr-2 text-green-400"/> Clean Lap Telemetry
                          </h3>
                          <select 
                            className="bg-black border border-gray-700 text-gray-300 font-bold uppercase tracking-widest rounded-sm px-4 py-2 outline-none focus:border-blue-500 text-xs"
                            value={selectedRaceIdx}
                            onChange={(e) => setSelectedRaceIdx(Number(e.target.value))}
                          >
                            {availableRaces.map((race, idx) => (
                              <option key={idx} value={idx}>{race.name}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="h-[350px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={telemetryData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                              <XAxis dataKey="lap" stroke="#6b7280" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                              <YAxis domain={['auto', 'auto']} stroke="#6b7280" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} 
                                     tickFormatter={(val) => msToTimeStr(val * 1000)} />
                              <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#374151', color: '#fff' }} />
                              <Legend />
                              <Line type="monotone" dataKey="WinnerTime" name="Race Winner" stroke="#eab308" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls={true} />
                              <Line type="monotone" dataKey="Time" name="Driver Lap Time" stroke="#22c55e" strokeWidth={2} dot={{ r: 2 }} connectNulls={true} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};