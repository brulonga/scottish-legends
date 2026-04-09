import { useState, useMemo, useEffect } from 'react';
import { Swords, ArrowLeft, AlertTriangle, Clock, Award } from 'lucide-react'; // 🚀 AQUÍ FALTABA "Award"
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

export const Compare = ({ onNavigate }) => {
  const [league, setLeague] = useState('monday');
  const [d1Name, setD1Name] = useState('');
  const [d2Name, setD2Name] = useState('');
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);

  const { getLeagueData, loading } = useLeagueData();
  const leagueData = getLeagueData(league);

  const driversList = leagueData?.global || [];
  const sessions = leagueData?.sessions || [];

  const d1Stats = driversList.find(d => d.name === d1Name);
  const d2Stats = driversList.find(d => d.name === d2Name);
  const p1 = d1Name ? getDriverProfile(d1Name) : null;
  const p2 = d2Name ? getDriverProfile(d2Name) : null;

  // Reset track selection when drivers change
  useEffect(() => { setSelectedTrackIndex(0); }, [d1Name, d2Name, league]);

  // Procesamiento profundo de datos para gráficas
  const { chartData, sharedRaces, telemetryData } = useMemo(() => {
    if (!d1Name || !d2Name) return { chartData: [], sharedRaces: [], telemetryData: [] };

    const cData = [];
    const sRaces = [];

    sessions.forEach((session, index) => {
      const track = session.name.split(':').pop().trim();
      const r1 = session.results?.find(r => r.name === d1Name);
      const r2 = session.results?.find(r => r.name === d2Name);
      
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
          D1Pos: r1 && r1.pos !== "DNF" ? parseInt(r1.pos) : null,
          D2Pos: r2 && r2.pos !== "DNF" ? parseInt(r2.pos) : null,
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

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-500"></div></div>;

  return (
    <div className="min-h-screen bg-black font-['Inter'] text-gray-300 py-8">
      <div className="max-w-[1200px] mx-auto px-4">
        
        <button onClick={() => onNavigate('hall-of-fame')} className="flex items-center space-x-2 text-yellow-500 hover:text-yellow-400 font-bold uppercase tracking-widest mb-8 transition-colors text-sm">
          <ArrowLeft className="w-5 h-5" /><span>Back to The Grid</span>
        </button>

        <div className="text-center mb-12">
          <Swords className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="font-['Teko'] text-6xl md:text-8xl font-bold text-white mb-2 uppercase tracking-wide">
            Head-to-<span className="text-yellow-400">Head</span>
          </h1>
          <p className="text-gray-400 text-sm uppercase tracking-widest font-bold">Comprehensive Telemetry & Stats Comparison</p>
        </div>

        {/* SELECTORES */}
        <div className="bg-[#0a0a0a] border border-gray-800 p-6 md:p-8 mb-12 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-2xl">
          <div className="flex flex-col">
            <label className="text-[10px] text-yellow-500 uppercase font-bold tracking-widest mb-2">Championship</label>
            <select value={league} onChange={(e) => { setLeague(e.target.value); setD1Name(''); setD2Name(''); }} className="bg-black border border-gray-700 text-white p-3 font-bold uppercase tracking-widest outline-none focus:border-yellow-500">
              <option value="monday">Monday Marathon</option>
              <option value="multiclass">Multiclass Friday</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] text-blue-400 uppercase font-bold tracking-widest mb-2">Driver 1 (Blue)</label>
            <select value={d1Name} onChange={(e) => setD1Name(e.target.value)} className="bg-black border border-gray-700 text-white p-3 font-bold uppercase tracking-widest outline-none focus:border-blue-500">
              <option value="">-- Select Driver --</option>
              {driversList.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] text-red-400 uppercase font-bold tracking-widest mb-2">Driver 2 (Red)</label>
            <select value={d2Name} onChange={(e) => setD2Name(e.target.value)} className="bg-black border border-gray-700 text-white p-3 font-bold uppercase tracking-widest outline-none focus:border-red-500">
              <option value="">-- Select Driver --</option>
              {driversList.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
            </select>
          </div>
        </div>

        {/* ESTADÍSTICAS COMPLETAS */}
        {d1Stats && d2Stats && (
          <div className="bg-[#0a0a0a] border border-gray-800 p-6 md:p-8 shadow-2xl mb-12">
            <div className="flex justify-between items-end mb-8 border-b border-gray-800 pb-6">
              <div className="text-left w-1/3">
                {p1?.avatar && <img src={p1.avatar} className="w-16 h-16 rounded-full border-2 border-blue-500 object-cover mb-3" />}
                <h2 className="font-['Teko'] text-3xl md:text-5xl font-bold text-blue-400 uppercase leading-none">{d1Stats.name}</h2>
              </div>
              <div className="text-center w-1/3">
                <div className="font-['Teko'] text-4xl md:text-5xl text-gray-700 italic">VS</div>
              </div>
              <div className="text-right w-1/3 flex flex-col items-end">
                {p2?.avatar && <img src={p2.avatar} className="w-16 h-16 rounded-full border-2 border-red-500 object-cover mb-3" />}
                <h2 className="font-['Teko'] text-3xl md:text-5xl font-bold text-red-400 uppercase leading-none">{d2Stats.name}</h2>
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
          <div className="space-y-6 mb-12">
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

      </div>
    </div>
  );
};