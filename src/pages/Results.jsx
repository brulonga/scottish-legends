import { useState, useMemo, useEffect } from 'react';  
import { Trophy, Timer, Flag, Calendar, AlertCircle } from 'lucide-react';  
import { useLeagueData } from '../hooks/useLeagueData';  

// --- FORMATEADORES 100% BLINDADOS ---
const msToTimeStr = (ms) => {  
  if (ms === null || ms === undefined || ms === Infinity || ms === 0 || ms === "0" || ms === "-") return "-";  
  let val = Number(ms);  
  if (isNaN(val)) return ms;   
  let minutes = Math.floor(val / 60000);  
  let seconds = Math.floor((val % 60000) / 1000);  
  let milis = Math.floor(val % 1000);  
  return `${minutes > 0 ? minutes + ':' : ''}${seconds.toString().padStart(2, '0')}.${milis.toString().padStart(3, '0')}`;  
};  

const formatGap = (gap) => {  
  if (gap === null || gap === undefined || gap === "-" || gap === 0 || gap === "0" || gap === "WINNER" || gap === "POLE" || gap === "DNF" || gap === "DSQ" || gap === Infinity) return "-";  
  if (typeof gap === 'string' && gap.startsWith('+')) return gap.endsWith('s') ? gap : `${gap}s`;  
  let val = Number(gap);  
  if (isNaN(val)) return String(gap); 
  let seconds = (val / 1000).toFixed(3);  
  return `+${seconds}s`;  
};  

const timeStrToMs = (timeStr) => {  
  if (timeStr === null || timeStr === undefined || timeStr === "-" || timeStr === "") return Infinity;  
  if (typeof timeStr === 'number') return timeStr; 
  const str = String(timeStr).trim(); 
  if (str.includes(':')) { 
    const parts = str.split(':'); 
    const mins = parseInt(parts[0]) || 0; 
    const secsAndMs = (parts[1] || "0").split('.'); 
    const secs = parseInt(secsAndMs[0]) || 0; 
    const ms = parseInt(secsAndMs[1]) || 0; 
    return (mins * 60000) + (secs * 1000) + ms; 
  } 
  if (str.includes('.')) { 
    const parts = str.split('.'); 
    const secs = parseInt(parts[0]) || 0; 
    const ms = parseInt(parts[1]) || 0; 
    return (secs * 1000) + ms; 
  } 
  const val = parseInt(str); 
  return isNaN(val) ? Infinity : val; 
};  

// --- ESTILOS NEÓN ---  
const textNeonPurple = "text-purple-400 font-bold drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]";  
const textNeonGold = "text-yellow-400 font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]";  
const textNeonRed = "text-red-500 font-bold drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]";  

// --- TABLA DE CLASIFICACIÓN (QUALY) ---
const QualyTable = ({ data = [], bestSectors = [Infinity, Infinity, Infinity], onDriverClick }) => {  
  return (  
    <div className="bg-[#0a0a0a] border border-gray-800 shadow-2xl mb-12 overflow-hidden">  
      <div className="p-4 border-b border-gray-800 bg-black flex items-center space-x-3">  
        <Timer className="w-6 h-6 text-blue-500" />  
        <h3 className="font-['Teko'] text-3xl font-bold text-white uppercase tracking-wide">Qualifying Results</h3>  
      </div>  
      <div className="overflow-x-auto">  
        <table className="w-full text-left whitespace-nowrap">  
          <thead className="bg-[#111] text-gray-400 uppercase tracking-widest text-[10px] border-b border-gray-800">  
            <tr>  
              <th className="px-4 py-3 font-bold text-center">Pos</th>  
              <th className="px-4 py-3 font-bold">Driver</th>  
              <th className="px-4 py-3 font-bold">Car</th>  
              <th className="px-4 py-3 font-bold text-center">Sector 1</th>  
              <th className="px-4 py-3 font-bold text-center">Sector 2</th>  
              <th className="px-4 py-3 font-bold text-center">Sector 3</th>  
              <th className="px-4 py-3 font-bold text-center">Best Lap</th>  
              <th className="px-4 py-3 font-bold text-center">Gap to Pole</th>  
            </tr>  
          </thead>  
          <tbody className="divide-y divide-gray-800/50 text-xs">  
            {data.map((row, index) => {  
              if (!row) return null;

              // 🧹 LIMPIADOR DE NOMBRES
              const cleanName = row.name ? row.name.replace(/\[.*?\]|\|.*/g, '').trim() : "Unknown Driver";

              const noTime = !row.best_lap || row.best_lap === "-" || row.best_lap === "NO TIME";  
              const isPole = !noTime && (row.gap_pole === "POLE" || row.gap_pole_ms === 0 || row.pos === 1 || row.pos === "1");  
                
              const isS1Best = timeStrToMs(row.s1) === bestSectors[0] && bestSectors[0] !== Infinity;  
              const isS2Best = timeStrToMs(row.s2) === bestSectors[1] && bestSectors[1] !== Infinity;  
              const isS3Best = timeStrToMs(row.s3) === bestSectors[2] && bestSectors[2] !== Infinity;  
               
              const displayPos = row.class_pos || row.pos || index + 1; 

              return (  
                <tr key={`qualy-${row.name || index}`} className="hover:bg-gray-800/30 transition-colors">  
                  <td className="px-4 py-3 text-center font-bold text-white text-sm">  
                    {displayPos}  
                  </td>  
                    
                  <td className="px-4 py-3">  
                    <div className="flex items-center cursor-pointer group w-fit" onClick={() => onDriverClick && onDriverClick(cleanName)}>  
                      <span className="text-blue-400 font-bold group-hover:text-yellow-400 transition-colors">  
                        {cleanName}  
                      </span>  
                    </div>  
                  </td>  
                    
                  <td className="px-4 py-3 text-gray-500">{row.car_model || row.car || "-"}</td>  
                    
                  <td className={`px-4 py-3 text-center font-mono ${isS1Best ? textNeonPurple : 'text-gray-400'}`}>  
                    {row.s1 || "-"}  
                  </td>  
                  <td className={`px-4 py-3 text-center font-mono ${isS2Best ? textNeonPurple : 'text-gray-400'}`}>  
                    {row.s2 || "-"}  
                  </td>  
                  <td className={`px-4 py-3 text-center font-mono ${isS3Best ? textNeonPurple : 'text-gray-400'}`}>  
                    {row.s3 || "-"}  
                  </td>  
                    
                  <td className="px-4 py-3 text-center font-mono">  
                    {noTime ? <span className="text-gray-600">NO TIME</span> : <span className={isPole ? textNeonPurple : "text-gray-200 font-bold"}>{row.best_lap}</span>}  
                  </td>  

                  <td className="px-4 py-3 text-center font-mono text-xs">  
                    {isPole ? <span className={textNeonPurple}>POLE</span> : (noTime ? "-" : <span className="text-red-400">{formatGap(row.gap_pole_ms || row.gap_pole)}</span>)}  
                  </td>  
                </tr>  
              );  
            })}  
          </tbody>  
        </table>  
      </div>  
    </div>  
  );  
};  

// --- TABLA DE CARRERA ---
const RaceTable = ({ data = [], bestLap = Infinity, bestPace = Infinity, onDriverClick }) => {  
  return (  
    <div className="bg-[#0a0a0a] border border-gray-800 shadow-2xl mb-12 overflow-hidden">  
      <div className="p-4 border-b border-gray-800 bg-black flex items-center space-x-3">  
        <Flag className="w-6 h-6 text-green-500" />  
        <h3 className="font-['Teko'] text-3xl font-bold text-white uppercase tracking-wide">Race Results</h3>  
      </div>  
      <div className="overflow-x-auto">  
        <table className="w-full text-left whitespace-nowrap">  
          <thead className="bg-[#111] text-gray-400 uppercase tracking-widest text-[10px] border-b border-gray-800">  
            <tr>  
              <th className="px-3 py-3 font-bold text-center">Pos</th>  
              <th className="px-3 py-3 font-bold text-center">Qualy</th>  
              <th className="px-3 py-3 font-bold text-center">Pace Pos</th>  
              <th className="px-3 py-3 font-bold text-center">Net vs Q</th>  
              <th className="px-3 py-3 font-bold">Driver</th>  
              <th className="px-3 py-3 font-bold">Car</th>  
              <th className="px-3 py-3 font-bold text-center">Pts</th>  
              <th className="px-3 py-3 font-bold text-center">Laps</th>  
              <th className="px-3 py-3 font-bold text-center">Race Gap</th>  
              <th className="px-3 py-3 font-bold text-center">Inc</th>  
              <th className="px-3 py-3 font-bold text-center">Avg Lap</th>  
              <th className="px-3 py-3 font-bold text-center">Pace Gap</th>  
              <th className="px-3 py-3 font-bold text-center">Best Lap</th>  
              <th className="px-3 py-3 font-bold text-center">Best Lap Gap</th>  
            </tr>  
          </thead>  
          <tbody className="divide-y divide-gray-800/50 text-xs">  
            {data.map((row, index) => {  
              if (!row) return null;

              // 🧹 LIMPIADOR DE NOMBRES
              const cleanName = row.name ? row.name.replace(/\[.*?\]|\|.*/g, '').trim() : "Unknown Driver";

              const displayPos = row.class_pos || row.pos; 
              const isWinner = displayPos === 1 || displayPos === "1" || row.race_gap === "WINNER";  
              const isDNF = String(row.pos).toUpperCase() === "DNF" || String(row.pos).toUpperCase() === "DSQ" || String(row.class_pos).toUpperCase() === "DNF";  
              const isPaceRef = row.avg_lap_ms === bestPace && bestPace > 0;  
              const isBestLap = row.best_lap_ms === bestLap && bestLap > 0;  
                
              let posClass = "font-bold text-white text-sm";  
              if (isWinner) posClass = "font-['Teko'] text-2xl text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]";  
              if (displayPos === 2 || displayPos === "2") posClass = "font-['Teko'] text-2xl text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.8)]";  
              if (displayPos === 3 || displayPos === "3") posClass = "font-['Teko'] text-2xl text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.8)]";  

              let netVsQStr = "-";  
              let netVsQColor = "text-gray-500";  
              const netVal = row.net_vs_q;  
              if (netVal !== undefined && netVal !== "-" && netVal !== null) {  
                const n = parseInt(netVal);  
                if (!isNaN(n)) {  
                  if (n > 0) {   
                    netVsQStr = `+${n}`; netVsQColor = "text-emerald-400 font-bold";   
                  } else if (n < 0) {   
                    netVsQStr = `${n}`; netVsQColor = "text-red-400 font-bold";   
                  } else {  
                    netVsQStr = "0"; netVsQColor = "text-gray-400 font-bold";  
                  }  
                }  
              }  

              let raceGapText = <span className="text-red-400 font-mono">{formatGap(row.race_gap || row.gap_ms)}</span>;  
              if (isDNF || row.race_gap === "DNF" || row.gap_ms === "DNF") raceGapText = <span className={textNeonRed}>DNF</span>;  
              else if (isWinner || row.race_gap === "WINNER" || row.gap_ms === "WINNER" || row.gap_ms === 0) raceGapText = <span className={textNeonGold}>WINNER</span>;  

              return (  
                <tr key={`race-${row.name || index}`} className="hover:bg-gray-800/30 transition-colors">  
                  <td className="px-3 py-3 text-center">  
                    {isDNF ? <span className="font-['Teko'] text-xl text-red-500 font-bold drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] tracking-widest">DNF</span> : <span className={posClass}>{displayPos}</span>}  
                  </td>  

                  <td className="px-3 py-3 text-center text-gray-400 font-mono">{row.qualy_pos && row.qualy_pos !== "-" ? `P${row.qualy_pos}` : "-"}</td>  
                  <td className="px-3 py-3 text-center text-gray-400 font-mono">{row.pace_pos && row.pace_pos !== "-" ? `P${row.pace_pos}` : "-"}</td>  
                  <td className={`px-3 py-3 text-center font-mono ${netVsQColor}`}>{netVsQStr}</td>  
                    
                  <td className="px-3 py-3">  
                    <div className="flex items-center cursor-pointer group w-fit" onClick={() => onDriverClick && onDriverClick(cleanName)}>  
                      <span className="text-blue-400 font-bold group-hover:text-yellow-400 transition-colors">  
                        {cleanName}  
                      </span>  
                    </div>  
                  </td>  
                    
                  <td className="px-3 py-3 text-gray-500 text-[11px] truncate max-w-[150px]">{row.car_model || row.car || "-"}</td>  
                    
                  <td className="px-3 py-3 text-center font-bold text-white">{row.points ?? "-"}</td>  
                  <td className="px-3 py-3 text-center text-gray-300 font-mono">{row.laps ?? "-"}</td>  
                    
                  <td className="px-3 py-3 text-center font-mono">{raceGapText}</td>  
                    
                  <td className="px-3 py-3 text-center text-gray-400 font-mono">{row.incidents ?? row.inc ?? "-"}</td>  
                    
                  <td className="px-3 py-3 text-center">  
                    <span className={`font-mono ${isPaceRef ? textNeonPurple : 'text-gray-300'}`}>  
                      {msToTimeStr(row.avg_lap_ms)}  
                    </span>  
                  </td>  

                  <td className="px-3 py-3 text-center text-red-400 font-mono">{isPaceRef ? <span className={textNeonPurple}>PACE REF</span> : formatGap(row.gap_pace_ms || row.gap_pace)}</td>  
                    
                  <td className="px-3 py-3 text-center">  
                    <span className={`font-mono ${isBestLap ? textNeonPurple : 'text-gray-300'}`}>  
                      {msToTimeStr(row.best_lap_ms)}  
                    </span>  
                  </td>  

                  <td className="px-3 py-3 text-center text-red-400 font-mono">{isBestLap ? <span className={textNeonPurple}>BEST LAP</span> : formatGap(row.gap_best_ms || row.gap_best)}</td>  
                </tr>  
              );  
            })}  
          </tbody>  
        </table>  
      </div>  
    </div>  
  );  
};  

// --- COMPONENTE PRINCIPAL ---
export const Results = ({ 
  onDriverClick,
  activeLeague: propsLeague,
  activeSeason: propsSeason
}) => {
  // 🚀 ESTADO LOCAL INDEPENDIENTE (Por si App.jsx no se lo pasa)
  const [activeLeague, setActiveLeague] = useState(propsLeague || null);
  const [activeSeason, setActiveSeason] = useState(propsSeason || null);
  const [selectedRound, setSelectedRound] = useState(0);

  // 🚀 HOOK DINÁMICO
  const { leagueData, loading, error } = useLeagueData(activeLeague, activeSeason);
  const sessions = leagueData?.sessions || [];

  // Resetear la carrera seleccionada cuando cambiamos de liga o temporada
  useEffect(() => {
    setSelectedRound(0);
  }, [activeLeague, activeSeason]);

  const currentEvent = sessions[selectedRound]; 

  const groupedClassData = useMemo(() => {
    if (!currentEvent) return [];

    const sessionsToProcess = Array.isArray(currentEvent.sessions)
      ? currentEvent.sessions
      : [currentEvent];

    return sessionsToProcess.flatMap((session, index) => {
      const rawQualy = Array.isArray(session?.qualy_results) ? session.qualy_results.filter(Boolean) : [];
      const rawRace = Array.isArray(session?.results) ? session.results.filter(Boolean) : [];

      const classes = new Set([
        ...rawQualy.map((r) => r?.car_class || r?.class || 'GT3'),
        ...rawRace.map((r) => r?.car_class || r?.class || 'GT3'),
      ]);

      return Array.from(classes).map((className) => {
        const qResults = rawQualy.filter((r) => (r?.car_class || r?.class || 'GT3') === className);
        const rResults = rawRace.filter((r) => (r?.car_class || r?.class || 'GT3') === className);

        let bestLap = Infinity;
        let bestPace = Infinity;
        let bSectors = [Infinity, Infinity, Infinity];

        qResults.forEach((r) => {
          const msS1 = timeStrToMs(r?.s1);
          const msS2 = timeStrToMs(r?.s2);
          const msS3 = timeStrToMs(r?.s3);
          if (msS1 < bSectors[0]) bSectors[0] = msS1;
          if (msS2 < bSectors[1]) bSectors[1] = msS2;
          if (msS3 < bSectors[2]) bSectors[2] = msS3;
        });

        rResults.forEach((r) => {
          if (r?.best_lap_ms && r.best_lap_ms > 0 && r.best_lap_ms < bestLap) bestLap = r.best_lap_ms;
          if (r?.avg_lap_ms && r.avg_lap_ms > 0 && r.avg_lap_ms < bestPace) bestPace = r.avg_lap_ms;
        });

        return {
          sessionName: session?.name || `Race ${index + 1}`,
          className,
          qualyResults: qResults,
          raceResults: rResults,
          bestLap,
          bestPace,
          bestSectors: bSectors,
          uniqueId: `session-${index}-${className}`
        };
      });
    });
  }, [currentEvent]);

  return (
    <div className="min-h-screen bg-black font-['Inter'] text-gray-300 py-8">
      <div className="max-w-[1536px] mx-auto px-4">

        <div className="text-center mb-10 border-b border-gray-800 pb-8">
          <div className="inline-flex items-center justify-center space-x-2 border border-yellow-500/30 px-6 py-2 rounded-full mb-6 bg-yellow-500/10">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest">Race Reports</span>
          </div>
          <h1 className="font-['Teko'] text-6xl font-bold text-white mb-6 uppercase tracking-wide">
            Event <span className="text-yellow-400">Results</span>
          </h1>
          
          {/* 🚀 SELECTORES DE LIGA Y TEMPORADA */}
          <div className="flex flex-col md:flex-row gap-6 mt-6 max-w-4xl mx-auto">
            <div className="flex-1 space-y-2">
              <label className="font-['Teko'] text-xl text-gray-500 uppercase tracking-widest text-left block">1. Select League</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => { setActiveLeague('monday_marathon'); setActiveSeason(null); }}
                  className={`flex-1 py-2 px-4 transform -skew-x-12 transition-all duration-200 border border-gray-800 ${
                    activeLeague === 'monday_marathon' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(250,204,21,0.3)]' : 'bg-[#0a0a0a] text-gray-400 hover:border-yellow-500/50 hover:text-white'
                  }`}
                >
                  <span className="font-['Teko'] text-xl uppercase tracking-widest block transform skew-x-12">Monday Marathon</span>
                </button>
                <button
                  onClick={() => { setActiveLeague('fun_friday'); setActiveSeason(null); }}
                  className={`flex-1 py-2 px-4 transform -skew-x-12 transition-all duration-200 border border-gray-800 ${
                    activeLeague === 'fun_friday' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(250,204,21,0.3)]' : 'bg-[#0a0a0a] text-gray-400 hover:border-yellow-500/50 hover:text-white'
                  }`}
                >
                  <span className="font-['Teko'] text-xl uppercase tracking-widest block transform skew-x-12">Fun Friday</span>
                </button>
              </div>
            </div>

            <div className={`flex-1 space-y-2 transition-opacity duration-300 ${activeLeague ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
              <label className="font-['Teko'] text-xl text-gray-500 uppercase tracking-widest text-left block">2. Select Season</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveSeason('season_1')}
                  className={`flex-1 py-2 px-4 transform -skew-x-12 transition-all duration-200 border border-gray-800 ${
                    activeSeason === 'season_1' ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-[#0a0a0a] text-gray-400 hover:border-white/50 hover:text-white'
                  }`}
                >
                  <span className="font-['Teko'] text-xl uppercase tracking-widest block transform skew-x-12">Season 1</span>
                </button>
                <button
                  onClick={() => setActiveSeason('season_2')}
                  className={`flex-1 py-2 px-4 transform -skew-x-12 transition-all duration-200 border border-gray-800 ${
                    activeSeason === 'season_2' ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-[#0a0a0a] text-gray-400 hover:border-white/50 hover:text-white'
                  }`}
                >
                  <span className="font-['Teko'] text-xl uppercase tracking-widest block transform skew-x-12">Season 2</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ESTADOS DE CARGA Y VACÍO */}
        {!activeLeague || !activeSeason ? (
          <div className="bg-[#0a0a0a] p-16 text-center border border-gray-800 rounded-lg">
            <Flag className="w-20 h-20 text-gray-700 mx-auto mb-6 animate-pulse" />
            <h2 className="font-['Teko'] text-4xl text-gray-400 uppercase tracking-widest mb-2">Welcome to the Race Control</h2>
            <p className="text-gray-500 uppercase tracking-widest font-bold">Please select a League and a Season above to view the results.</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 p-8 text-center border border-red-500/30">
            <p className="text-red-400 uppercase tracking-widest font-bold">{error}</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-800 bg-[#0a0a0a] rounded-lg">
            <Calendar className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 text-lg font-bold uppercase tracking-widest">No races have been held yet in this season.</p>
          </div>
        ) : (
          <>
            {/* SELECTOR DE CARRERA (ROUND) */}
            <div className="mb-10 max-w-xl mx-auto">
              <label className="text-gray-500 font-['Teko'] text-xl uppercase tracking-widest mb-2 block text-center">Select Race Event</label>
              <div className="relative">
                <select
                  value={selectedRound}
                  onChange={(e) => setSelectedRound(Number(e.target.value))}
                  className="w-full bg-[#0a0a0a] border border-gray-700 text-white p-4 font-['Teko'] text-2xl uppercase tracking-widest outline-none focus:border-yellow-500 transition-colors appearance-none cursor-pointer"
                >
                  {sessions.map((session, idx) => (
                    <option key={idx} value={idx}>{session.name || `Round ${idx + 1}`}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {/* TABLAS DE RESULTADOS POR CLASE */}
            {currentEvent && groupedClassData.length > 0 ? (
              groupedClassData.map((group) => (
                <div key={group.uniqueId} className="mb-16 animate-fade-in">

                  {/* TÍTULO DE LA SESIÓN Y CLASE */}
                  <div className="mb-6 flex flex-col border-b border-gray-800 pb-2">
                    <span className="text-blue-400 text-sm font-bold uppercase tracking-widest mb-1">
                      {group.sessionName}
                    </span>
                    <div className="flex items-center">
                      <div className="w-1.5 h-8 bg-yellow-500 mr-4"></div>
                      <h2 className="font-['Teko'] text-5xl font-bold text-white uppercase tracking-wide">
                        {group.className} Class
                      </h2>
                    </div>
                  </div>

                  {group.qualyResults.length > 0 && <QualyTable data={group.qualyResults} bestSectors={group.bestSectors} onDriverClick={onDriverClick} />}
                  {group.raceResults.length > 0 && <RaceTable data={group.raceResults} bestLap={group.bestLap} bestPace={group.bestPace} onDriverClick={onDriverClick} />}
                </div>
              ))
            ) : (
              <div className="text-center py-20 border border-dashed border-gray-800 bg-[#0a0a0a] rounded-lg">
                <AlertCircle className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400 text-lg font-bold uppercase tracking-widest">No valid results found for this event.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};