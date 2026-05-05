import { useState, useMemo, useEffect } from 'react';  
import { Trophy, Timer, Flag, Calendar } from 'lucide-react';  
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

// 🚀 EXTRAEMOS QUALYTABLE FUERA PARA EVITAR CRASHES
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
              if (!row) return null; // Safeguard contra filas nulas

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
                    <div className="flex items-center cursor-pointer group w-fit" onClick={() => onDriverClick && onDriverClick(row.name)}>  
                      <span className="text-blue-400 font-bold group-hover:text-yellow-400 transition-colors">  
                        {row.name || "Unknown Driver"}  
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

// 🚀 EXTRAEMOS RACETABLE FUERA DEL COMPONENTE PRINCIPAL
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
              if (!row) return null; // Safeguard contra filas nulas

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
                    <div className="flex items-center cursor-pointer group w-fit" onClick={() => onDriverClick && onDriverClick(row.name)}>  
                      <span className="text-blue-400 font-bold group-hover:text-yellow-400 transition-colors">  
                        {row.name || "Unknown Driver"}  
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
export const Results = ({ onDriverClick }) => {  
  const [league, setLeague] = useState('monday');  
  const [selectedRound, setSelectedRound] = useState(0);  
  
  const { getLeagueData, loading } = useLeagueData();  
  const leagueData = getLeagueData(league);  
  const sessions = leagueData?.sessions || [];  
  
  useEffect(() => {  
    setSelectedRound(0);  
  }, [league]);  
  
  const currentSession = sessions[selectedRound];  
  
  const groupedClassData = useMemo(() => {  
    if (!currentSession) return [];  
  
    // 🚀 FILTER BOOLEAN PARA ELIMINAR NULOS ANTES DE MAPEAR
    const rawQualy = (currentSession.qualy_results || []).filter(Boolean);  
    const rawRace = (currentSession.results || []).filter(Boolean);  
 
    const classes = new Set([ 
      ...rawQualy.map(r => r?.car_class || r?.class || 'GT3'), 
      ...rawRace.map(r => r?.car_class || r?.class || 'GT3') 
    ]); 
 
    return Array.from(classes).sort().map(className => { 
      const qClassRaw = rawQualy.filter(r => (r?.car_class || r?.class || 'GT3') === className); 
      const rClassRaw = rawRace.filter(r => (r?.car_class || r?.class || 'GT3') === className); 
 
      const qResults = [...qClassRaw].sort((a, b) => {  
        const posA = parseInt(a?.class_pos || a?.pos) || 999;  
        const posB = parseInt(b?.class_pos || b?.pos) || 999;  
        return posA - posB;  
      });  
    
      const rResults = [...rClassRaw].sort((a, b) => {  
        const isDnfA = String(a?.pos).toUpperCase() === "DNF" || String(a?.pos).toUpperCase() === "DSQ" || String(a?.class_pos).toUpperCase() === "DNF";  
        const isDnfB = String(b?.pos).toUpperCase() === "DNF" || String(b?.pos).toUpperCase() === "DSQ" || String(b?.class_pos).toUpperCase() === "DNF";  
        if (isDnfA && !isDnfB) return 1;  
        if (!isDnfA && isDnfB) return -1;  
        if (isDnfA && isDnfB) return (parseInt(b?.laps) || 0) - (parseInt(a?.laps) || 0);  
        return (parseInt(a?.class_pos || a?.pos) || 999) - (parseInt(b?.class_pos || b?.pos) || 999);  
      });  
    
      let bestLap = Infinity;  
      let bestPace = Infinity;  
      let bSectors = [Infinity, Infinity, Infinity];  
    
      qResults.forEach(r => {  
        const msS1 = timeStrToMs(r?.s1);  
        const msS2 = timeStrToMs(r?.s2);  
        const msS3 = timeStrToMs(r?.s3);  
        if (msS1 < bSectors[0]) bSectors[0] = msS1;  
        if (msS2 < bSectors[1]) bSectors[1] = msS2;  
        if (msS3 < bSectors[2]) bSectors[2] = msS3;  
      });  
    
      rResults.forEach(r => {  
        if (r?.best_lap_ms && r.best_lap_ms > 0 && r.best_lap_ms < bestLap) bestLap = r.best_lap_ms;  
        if (r?.avg_lap_ms && r.avg_lap_ms > 0 && r.avg_lap_ms < bestPace) bestPace = r.avg_lap_ms;  
      });  
 
      return { 
        className, 
        qualyResults: qResults, 
        raceResults: rResults, 
        bestLap, 
        bestPace, 
        bestSectors: bSectors 
      }; 
    }); 
  }, [currentSession]);  
  
  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-500"></div></div>;  
  
  return (  
    <div className="min-h-screen bg-black font-['Inter'] text-gray-300 py-8">  
      <div className="max-w-[1536px] mx-auto px-4">  
          
        <div className="text-center mb-12">  
          <div className="inline-flex items-center justify-center space-x-2 border border-yellow-500/30 px-6 py-2 rounded-full mb-6 bg-yellow-500/10">  
            <Trophy className="w-4 h-4 text-yellow-400" />  
            <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest">Race Reports</span>  
          </div>  
          <h1 className="font-['Teko'] text-7xl md:text-9xl font-bold text-white mb-4 uppercase tracking-wide drop-shadow-lg">  
            Event <span className="text-yellow-400">Results</span>  
          </h1>  
          <p className="text-gray-400 text-lg max-w-2xl mx-auto uppercase tracking-widest font-medium">  
            Advanced telemetry, gaps, and session highlights.  
          </p>  
        </div>  
  
        <div className="bg-[#0a0a0a] p-6 border border-gray-800 mb-10 shadow-xl flex flex-col md:flex-row gap-6">  
          <div className="flex-1">  
            <label className="text-[10px] text-yellow-500 uppercase font-bold tracking-widest mb-2 block">Championship</label>  
            <select   
              value={league}   
              onChange={(e) => setLeague(e.target.value)}   
              className="w-full bg-black border border-gray-700 text-white p-3 font-bold uppercase tracking-widest outline-none focus:border-yellow-500"  
            >  
              <option value="monday">Monday Marathon</option>  
              <option value="multiclass">Multiclass Friday</option>  
            </select>  
          </div>  
              
          <div className="flex-1">  
            <label className="text-[10px] text-blue-400 uppercase font-bold tracking-widest mb-2 block">Select Round</label>  
            <select   
              value={selectedRound}   
              onChange={(e) => setSelectedRound(Number(e.target.value))}   
              className="w-full bg-black border border-gray-700 text-white p-3 font-bold uppercase tracking-widest outline-none focus:border-blue-500"  
            >  
              {sessions.map((session, idx) => (  
                <option key={idx} value={idx}>{session.name}</option>  
              ))}  
            </select>  
          </div>  
        </div>  
  
        {sessions.length > 0 && currentSession && groupedClassData.length > 0 ? (  
          groupedClassData.map((group) => ( 
            <div key={group.className} className="mb-16"> 
              {groupedClassData.length > 1 && ( 
                <div className="mb-6 flex items-center border-b border-gray-800 pb-2"> 
                  <div className="w-1.5 h-8 bg-yellow-500 mr-4"></div> 
                  <h2 className="font-['Teko'] text-5xl font-bold text-white uppercase tracking-wide"> 
                    {group.className} Class 
                  </h2> 
                </div> 
              )} 
 
              {group.qualyResults.length > 0 && <QualyTable data={group.qualyResults} bestSectors={group.bestSectors} onDriverClick={onDriverClick} />}  
              {group.raceResults.length > 0 && <RaceTable data={group.raceResults} bestLap={group.bestLap} bestPace={group.bestPace} onDriverClick={onDriverClick} />}  
            </div> 
          )) 
        ) : (  
          <div className="text-center py-20 border border-dashed border-gray-800">  
            <Calendar className="w-16 h-16 text-gray-700 mx-auto mb-4" />  
            <p className="text-gray-400 text-lg font-bold uppercase tracking-widest">No session data available</p>  
          </div>  
        )}  
  
      </div>  
    </div>  
  );  
};