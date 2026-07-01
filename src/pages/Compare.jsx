import { useState, useMemo, useEffect } from 'react';
import { Swords, ArrowLeft, AlertTriangle, Clock, Award, Flag } from 'lucide-react'; 
import { useLeagueData } from '../hooks/useLeagueData';
import { getDriverProfile } from '../config/driversConfig';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const msToTimeStr = (ms) => {
  if (!ms || ms === Infinity) return "-";
  let minutes = Math.floor(ms / 60000);
  let seconds = Math.floor((ms % 60000) / 1000);
  let milis = Math.floor(ms % 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${milis.toString().padStart(3, '0')}`;
};

// 🧹 LIMPIADOR DE NOMBRES GLOBAL
const normalizeName = (name) => {
  if (!name) return "";
  return name.replace(/\[.*?\]|\|.*/g, '').trim();
};

export const Compare = ({ onNavigate }) => {
  // 🚀 ESTADOS DE LIGA Y TEMPORADA
  const [activeLeague, setActiveLeague] = useState('fun_friday');
  const [activeSeason, setActiveSeason] = useState('season_1');
  
  const [d1Name, setD1Name] = useState('');
  const [d2Name, setD2Name] = useState('');
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);

  // 🚀 HOOK DINÁMICO
  const { leagueData, loading, error } = useLeagueData(activeLeague, activeSeason);

  const rawDriversList = leagueData?.global || [];
  const sessions = leagueData?.sessions || [];

  // Extraemos nombres limpios únicos para los selectores
  const uniqueCleanDrivers = useMemo(() => {
    return Array.from(new Set(rawDriversList.map(d => normalizeName(d.name)))).sort();
  }, [rawDriversList]);

  // Buscamos los stats originales usando el nombre limpio
  const d1Stats = rawDriversList.find(d => normalizeName(d.name) === d1Name);
  const d2Stats = rawDriversList.find(d => normalizeName(d.name) === d2Name);
  
  const p1 = d1Name ? getDriverProfile(d1Name) : null;
  const p2 = d2Name ? getDriverProfile(d2Name) : null;

  // Reset track selection when drivers or league/season change
  useEffect(() => { 
    setSelectedTrackIndex(0); 
    setD1Name('');
    setD2Name('');
  }, [activeLeague, activeSeason]);

  // Procesamiento profundo de datos para gráficas
  const { chartData, sharedRaces, telemetryData } = useMemo(() => {
    if (!d1Name || !d2Name) return { chartData: [], sharedRaces: [], telemetryData: [] };

    const cData = [];
    const sRaces = [];

    sessions.forEach((session, index) => {
      const track = session.name.split(':').pop().trim();
      
      // 🚀 BUSCAMOS A LOS PILOTOS EN LA CARRERA USANDO EL NOMBRE LIMPIO
      const r1 = session.results?.find(r => normalizeName(r.name) === d1Name);
      const r2 = session.results?.find(r => normalizeName(r.name) === d2Name);
      
      if (r1 || r2) {
        sRaces.push({ index, track, r1, r2 });

        // Procesar incidentes (Tiempo perdido vs Avg Lap propio)
        let d1Lost = 0, d2Lost = 0;
        if (r1?.lap_history && r1?.avg_lap_ms) {
          r1.lap_history.forEach(l => { if (l.is_incident) d1Lost += (l.time_ms - r1.avg_lap_ms); });
        }
        if (r2?.lap_history && r2?.avg_lap_ms) {
          r2.lap_history.forEach(l => { if (l.is_incident) d2Lost += (l.time_ms - r2.avg_lap_ms); });
        }

        // Procesar Gaps
        const parseGap = (ms) => {
          if (ms == null || ms === "-") return null;
          let secs = ms / 1000;
          return track.toLowerCase().includes("nurburgring") ? parseFloat((secs / 4).toFixed(3)) : parseFloat(secs.toFixed(3));
        };

        cData.push({
          track,
          // Posiciones
          D1Pos: r1 && String(r1.pos).toUpperCase() !== "DNF" ? parseInt(r1.pos || r1.class_pos) : null,
          D2Pos: r2 && String(r2.pos).toUpperCase() !== "DNF" ? parseInt(r2.pos || r2.class_pos) : null,
          // Incidentes perdidos (Segundos)
          D1Lost: parseFloat((d1Lost / 1000).toFixed(1)),
          D2Lost: parseFloat((d2Lost / 1000).toFixed(1)),
          // Gaps de Ritmo
          D1PaceGap: parseGap(r1?.gap_pace_ms),
          D2PaceGap: parseGap(r2?.gap_pace_ms),
        });
      }
    });

    // Procesar telemetría de la carrera seleccionada
    const tData = [];
    const activeRace = sRaces[selectedTrackIndex];
    if (activeRace) {
      const maxLaps = Math.max(activeRace.r1?.lap_history?.length || 0, activeRace.r2?.lap_history?.length || 0);
      for (let i = 0; i < maxLaps; i++) {
        tData.push({
          lap: `L${i + 1}`,
          D1Lap: activeRace.r1?.lap_history?.[i] && !activeRace.r1?.lap_history?.[i].is_incident ? parseFloat((activeRace.r1?.lap_history?.[i].time_ms / 1000).toFixed(3)) : null,
          D2Lap: activeRace.r2?.lap_history?.[i] && !activeRace.r2?.lap_history?.[i].is_incident ? parseFloat((activeRace.r2?.lap_history?.[i].time_ms / 1000).toFixed(3)) : null,
        });
      }
    }

    return { chartData: cData, sharedRaces: sRaces, telemetryData: tData };
  }, [sessions, d1Name, d2Name, selectedTrackIndex]);

  return (
    <div className="min-h-screen bg-black font-['Inter'] text-gray-300 py-8">
      <div className="max-w-[1200px] mx-auto px-4">
        
        <button onClick={() => onNavigate('hall-of-fame')} className="flex items-center space-x-2 text-yellow-500 hover:text-yellow-400 font-bold uppercase tracking-widest mb-8 transition-colors text-sm">
          <ArrowLeft className="w-5 h-5" /><span>Back to The Grid</span>
        </button>

        <div className="text-center mb-12 border-b border-gray-800 pb-8">
          <Swords className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="font-['Teko'] text-6xl md:text-8xl font-bold text-white mb-2 uppercase tracking-wide">
            Head-to-<span className="text-yellow-400">Head</span>
          </h1>
          <p className="text-gray-400 text-sm uppercase tracking-widest font-bold mb-8">Comprehensive Telemetry & Stats Comparison</p>
        
          {/* 🚀 SELECTORES DE LIGA Y TEMPORADA INTEGRADOS */}
          <div className="flex flex-col md:flex-row gap-6 max-w-3xl mx-auto">
            <div className="flex-1 space-y-2">
              <label className="font-['Teko'] text-xl text-gray-500 uppercase tracking-widest text-left block">League</label>
              <div className="flex space-x-2">
                <button onClick={() => { setActiveLeague('monday_marathon'); setActiveSeason(null); }} className={`flex-1 py-2 px-4 transform -skew-x-12 transition-all duration-200 border border-gray-800 ${activeLeague === 'monday_marathon' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(250,204,21,0.3)]' : 'bg-[#0a0a0a] text-gray-400 hover:text-white'}`}>
                  <span className="font-['Teko'] text-xl uppercase tracking-widest block transform skew-x-12">Monday</span>
                </button>
                <button onClick={() => { setActiveLeague('fun_friday'); setActiveSeason(null); }} className={`flex-1 py-2 px-4 transform -skew-x-12 transition-all duration-200 border border-gray-800 ${activeLeague === 'fun_friday' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(250,204,21,0.3)]' : 'bg-[#0a0a0a] text-gray-400 hover:text-white'}`}>
                  <span className="font-['Teko'] text-xl uppercase tracking-widest block transform skew-x-12">Friday</span>
                </button>
              </div>
            </div>

            <div className={`flex-1 space-y-2 transition-opacity duration-300 ${activeLeague ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
              <label className="font-['Teko'] text-xl text-gray-500 uppercase tracking-widest text-left block">Season</label>
              <div className="flex space-x-2">
                <button onClick={() => setActiveSeason('season_1')} className={`flex-1 py-2 px-4 transform -skew-x-12 transition-all duration-200 border border-gray-800 ${activeSeason === 'season_1' ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-[#0a0a0a] text-gray-400 hover:text-white'}`}>
                  <span className="font-['Teko'] text-xl uppercase tracking-widest block transform skew-x-12">Season 1</span>
                </button>
                <button onClick={() => setActiveSeason('season_2')} className={`flex-1 py-2 px-4 transform -skew-x-12 transition-all duration-200 border border-gray-800 ${activeSeason === 'season_2' ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-[#0a0a0a] text-gray-400 hover:text-white'}`}>
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
            <h2 className="font-['Teko'] text-4xl text-gray-400 uppercase tracking-widest mb-2">Awaiting Selection</h2>
            <p className="text-gray-500 uppercase tracking-widest font-bold">Please select a League and a Season to begin comparison.</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 p-8 text-center border border-red-500/30">
            <p className="text-red-400 uppercase tracking-widest font-bold">{error}</p>
          </div>
        ) : uniqueCleanDrivers.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-800 bg-[#0a0a0a] rounded-lg">
            <AlertTriangle className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 text-lg font-bold uppercase tracking-widest">No drivers found in this season.</p>
          </div>
        ) : (
          <>
            {/* SELECTORES DE PILOTO */}
            <div className="bg-[#0a0a0a] border border-gray-800 p-6 md:p-8 mb-12 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-2xl">
              <div className="flex flex-col">
                <label className="text-[10px] text-blue-400 uppercase font-bold tracking-widest mb-2">Driver 1 (Blue)</label>
                <select value={d1Name} onChange={(e) => setD1Name(e.target.value)} className="bg-black border border-gray-700 text-white p-3 font-bold uppercase tracking-widest outline-none focus:border-blue-500">
                  <option value="">-- Select Driver --</option>
                  {uniqueCleanDrivers.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] text-red-400 uppercase font-bold tracking-widest mb-2">Driver 2 (Red)</label>
                <select value={d2Name} onChange={(e) => setD2Name(e.target.value)} className="bg-black border border-gray-700 text-white p-3 font-bold uppercase tracking-widest outline-none focus:border-red-500">
                  <option value="">-- Select Driver --</option>
                  {uniqueCleanDrivers.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
            </div>

            {/* ESTADÍSTICAS COMPLETAS */}
            {d1Stats && d2Stats && (
              <div className="bg-[#0a0a0a] border border-gray-800 p-6 md:p-8 shadow-2xl mb-12 animate-fade-in">
                <div className="flex justify-between items-end mb-8 border-b border-gray-800 pb-6">
                  <div className="text-left w-1/3">
                    {p1?.avatar && <img src={p1.avatar} className="w-16 h-16 rounded-full border-2 border-blue-500 object-cover mb-3" />}
                    <h2 className="font-['Teko'] text-3xl md:text-5xl font-bold text-blue-400 uppercase leading-none">{d1Name}</h2>
                  </div>
                  <div className="text-center w-1/3">
                    <div className="font-['Teko'] text-4xl md:text-5xl text-gray-700 italic">VS</div>
                  </div>
                  <div className="text-right w-1/3 flex flex-col items-end">
                    {p2?.avatar && <img src={p2.avatar} className="w-16 h-16 rounded-full border-2 border-red-500 object-cover mb-3" />}
                    <h2 className="font-['Teko'] text-3xl md:text-5xl font-bold text-red-400 uppercase leading-none">{d2Name}</h2>
                  </div>
                </div>

                <div className="space-y-1">
                  {[
                    { label: 'Total Points', v1: d1Stats.points, v2: d2Stats.points, lowerIsBetter: false },
                    { label: 'Races Completed', v1: d1Stats.races, v2: d2Stats.races, lowerIsBetter: false },
                    { label: 'Avg Race Pos', v1: `P${d1Stats.avg_pos || '-'}`, v2: `P${d2Stats.avg_pos || '-'}`, raw1: d1Stats.avg_pos, raw2: d2Stats.avg_pos, lowerIsBetter: true },
                    { label: 'Avg Pace Pos', v1: `P${d1Stats.avg_pace_pos || '-'}`, v2: `P${d2Stats.avg_pace_pos || '-'}`, raw1: d1Stats.avg_pace_pos, raw2: d2Stats.avg_pace_pos, lowerIsBetter: true },
                    { label: 'Avg Qualy Pos', v1: `P${d1Stats.avg_qualy_pos || '-'}`, v2: `P${d2Stats.avg_qualy_pos || '-'}`, raw1: d1Stats.avg_qualy_pos, raw2: d2Stats.avg_qualy_pos, lowerIsBetter: true },
                    { label: 'Avg Race Gap', v1: d1Stats.avg_gap || '-', v2: d2Stats.avg_gap || '-', raw1: parseFloat(d1Stats.avg_gap), raw2: parseFloat(d2Stats.avg_gap), lowerIsBetter: true },
                    { label: 'Avg Qualy Gap', v1: d1Stats.avg_qualy_gap || '-', v2: d2Stats.avg_qualy_gap || '-', raw1: parseFloat(d1Stats.avg_qualy_gap), raw2: parseFloat(d2Stats.avg_qualy_gap), lowerIsBetter: true },
                    { label: 'Net vs Pace', v1: `${d1Stats.net_pos_gained>0?'+':''}${d1Stats.net_pos_gained||0}`, v2: `${d2Stats.net_pos_gained>0?'+':''}${d2Stats.net_pos_gained||0}`, raw1: d1Stats.net_pos_gained, raw2: d2Stats.net_pos_gained, lowerIsBetter: false },
                    { label: 'Net vs Qualy', v1: `${d1Stats.net_pos_gained_qualy>0?'+':''}${d1Stats.net_pos_gained_qualy||0}`, v2: `${d2Stats.net_pos_gained_qualy>0?'+':''}${d2Stats.net_pos_gained_qualy||0}`, raw1: d1Stats.net_pos_gained_qualy, raw2: d2Stats.net_pos_gained_qualy, lowerIsBetter: false },
                  ].map((stat, i) => {
                    const val1 = stat.raw1 !== undefined ? stat.raw1 : parseFloat(stat.v1) || 0;
                    const val2 = stat.raw2 !== undefined ? stat.raw2 : parseFloat(stat.v2) || 0;
                    let c1 = 'text-gray-400', c2 = 'text-gray-400';
                    
                    if (val1 !== val2 && !isNaN(val1) && !isNaN(val2)) {
                      if (stat.lowerIsBetter) {
                        c1 = val1 < val2 ? 'text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]' : 'text-gray-600';
                        c2 = val2 < val1 ? 'text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]' : 'text-gray-600';
                      } else {
                        c1 = val1 > val2 ? 'text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]' : 'text-gray-600';
                        c2 = val2 > val1 ? 'text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]' : 'text-gray-600';
                      }
                    }

                    return (
                      <div key={i} className="grid grid-cols-3 text-center border-b border-gray-800/50 py-3 items-center hover:bg-gray-900/30 transition-colors">
                        <div className={`font-['Teko'] text-3xl md:text-4xl font-bold ${c1}`}>{stat.v1}</div>
                        <div className="text-[10px] md:text-xs text-gray-500 uppercase font-bold tracking-widest">{stat.label}</div>
                        <div className={`font-['Teko'] text-3xl md:text-4xl font-bold ${c2}`}>{stat.v2}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* GRÁFICAS COMPARTIDAS */}
            {d1Stats && d2Stats && chartData.length > 0 && (
              <div className="space-y-6 mb-12 animate-fade-in">
                {/* POSICIÓN */}
                <div className="bg-[#0a0a0a] border border-gray-800 p-6 md:p-8 shadow-2xl">
                  <h3 className="font-['Teko'] text-3xl font-bold text-white mb-6 uppercase tracking-wide flex items-center"><Award className="w-6 h-6 mr-2 text-yellow-400"/> Position History</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="track" stroke="#6b7280" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis reversed={true} stroke="#6b7280" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#374151', color: '#fff' }} />
                        <Legend />
                        <Line type="monotone" dataKey="D1Pos" name={d1Name} stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} connectNulls={true} />
                        <Line type="monotone" dataKey="D2Pos" name={d2Name} stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} connectNulls={true} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* INCIDENTES */}
                  <div className="bg-[#0a0a0a] border border-gray-800 p-6 shadow-2xl">
                    <h3 className="font-['Teko'] text-3xl font-bold text-white mb-6 uppercase tracking-wide flex items-center"><AlertTriangle className="w-6 h-6 mr-2 text-yellow-400"/> Incident Time Lost (s)</h3>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                          <XAxis dataKey="track" stroke="#6b7280" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                          <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#374151', color: '#fff' }} />
                          <Legend />
                          <Area type="monotone" dataKey="D1Lost" name={d1Name} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                          <Area type="monotone" dataKey="D2Lost" name={d2Name} stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* PACE GAPS */}
                  <div className="bg-[#0a0a0a] border border-gray-800 p-6 shadow-2xl">
                    <h3 className="font-['Teko'] text-3xl font-bold text-white mb-6 uppercase tracking-wide flex items-center"><Clock className="w-6 h-6 mr-2 text-yellow-400"/> Race Pace Gap (s)</h3>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                          <XAxis dataKey="track" stroke="#6b7280" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                          <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#374151', color: '#fff' }} />
                          <Legend />
                          <Line type="monotone" dataKey="D1PaceGap" name={d1Name} stroke="#3b82f6" strokeWidth={2} connectNulls={true} />
                          <Line type="monotone" dataKey="D2PaceGap" name={d2Name} stroke="#ef4444" strokeWidth={2} connectNulls={true} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* TELEMETRÍA LIMPIA */}
                {sharedRaces.length > 0 && (
                  <div className="bg-[#0a0a0a] border border-gray-800 p-6 md:p-8 shadow-2xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
                      <h3 className="font-['Teko'] text-3xl font-bold text-white uppercase tracking-wide">Clean Lap Telemetry</h3>
                      <select 
                        className="bg-black border border-gray-700 text-gray-300 font-bold uppercase tracking-widest rounded-sm px-4 py-2 outline-none focus:border-yellow-500 text-xs"
                        value={selectedTrackIndex}
                        onChange={(e) => setSelectedTrackIndex(Number(e.target.value))}
                      >
                        {sharedRaces.map((race, idx) => (
                          <option key={idx} value={idx}>{race.track}</option>
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
                          <Line type="monotone" dataKey="D1Lap" name={d1Name} stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} connectNulls={true} />
                          <Line type="monotone" dataKey="D2Lap" name={d2Name} stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} connectNulls={true} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};