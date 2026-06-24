import { useState, useMemo } from 'react';
import { ArrowLeft, Award, Clock, AlertTriangle, Car, Shield } from 'lucide-react';
import { useLeagueData } from '../hooks/useLeagueData';
import { getDriverProfile, isLegendDriver } from '../config/driversConfig';
import { getDriverCategories } from '../utils/categoryEngine';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const carNames = {
  0: "Porsche 991 GT3 R", 1: "Mercedes-AMG GT3", 2: "Ferrari 488 GT3", 3: "Audi R8 LMS",
  4: "Lamborghini Huracan GT3", 5: "McLaren 650S GT3", 6: "Nissan GT-R Nismo GT3 '18",
  7: "BMW M6 GT3", 8: "Bentley Continental GT3 '18", 9: "Porsche 991.2 GT3 Cup",
  10: "Nissan GT-R Nismo GT3 '15", 11: "Bentley Continental GT3 '15", 12: "Aston Martin V12 Vantage GT3",
  13: "Reiter Gallardo R-EX", 14: "Emil Frey Jaguar G3", 15: "Lexus RC F GT3",
  16: "Lamborghini Huracan ST", 17: "Honda NSX GT3", 18: "Lamborghini Huracan GT3 Evo",
  19: "Audi R8 LMS Evo", 20: "Aston Martin V8 Vantage GT3", 21: "Honda NSX GT3 Evo",
  22: "McLaren 720S GT3", 23: "Porsche 911 GT3 R (991.2)", 24: "Ferrari 488 GT3 Evo",
  25: "Mercedes-AMG GT3 '20", 26: "Ferrari 488 Challenge Evo", 27: "BMW M2 CS Racing",
  28: "Porsche 911 GT3 Cup (992)", 29: "Lamborghini Huracan ST EVO2", 30: "BMW M4 GT3",
  31: "Audi R8 LMS Evo II", 32: "Ferrari 296 GT3", 33: "Lamborghini Huracan GT3 Evo2",
  34: "Porsche 911 GT3 R (992)", 35: "McLaren 720S GT3 Evo", 36: "Ford Mustang GT3",
  50: "Alpine A110 GT4", 51: "Aston Martin V8 Vantage GT4", 52: "Audi R8 LMS GT4", 
  53: "BMW M4 GT4", 54: "Chevrolet Camaro GT4.R", 55: "Ginetta G55 GT4", 
  56: "KTM X-Bow GT4", 57: "Maserati MC GT4", 58: "McLaren 570S GT4", 
  59: "Mercedes-AMG GT4", 60: "Porsche 718 Cayman GT4"
};

const getBrandBg = (carId) => {
  if (carId === null || carId === undefined) return 'none';
  const name = carNames[carId]?.toLowerCase() || '';

  if (name.includes('porsche')) return '/assets/cars/porsche.jpg';
  if (name.includes('ferrari')) return '/assets/cars/ferrari.jpg';
  if (name.includes('mercedes')) return '/assets/cars/mercedes.jpg';
  if (name.includes('audi')) return '/assets/cars/audi.jpg';
  if (name.includes('lamborghini') || name.includes('reiter')) return '/assets/cars/lamborghini.jpg';
  if (name.includes('mclaren')) return '/assets/cars/mclaren.jpg';
  if (name.includes('nissan')) return '/assets/cars/nissan.jpg';
  if (name.includes('bmw')) return '/assets/cars/bmw.jpg';
  if (name.includes('bentley')) return '/assets/cars/bentley.jpg';
  if (name.includes('aston')) return '/assets/cars/aston-martin.jpg';
  if (name.includes('jaguar')) return '/assets/cars/jaguar.jpg';
  if (name.includes('lexus')) return '/assets/cars/lexus.jpg';
  if (name.includes('honda')) return '/assets/cars/honda.jpg';
  if (name.includes('ford')) return '/assets/cars/ford.jpg';
  if (name.includes('alpine')) return '/assets/cars/alpine.jpg';
  if (name.includes('chevrolet') || name.includes('camaro')) return '/assets/cars/chevrolet.jpg';
  if (name.includes('ginetta')) return '/assets/cars/ginetta.jpg';
  if (name.includes('ktm')) return '/assets/cars/ktm.jpg';
  if (name.includes('maserati')) return '/assets/cars/maserati.jpg';

  return 'none';
};

const gt4CarIds = [50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61];

const categoryThemes = {
  PLATINUM: { text: 'text-emerald-400', border: 'border-emerald-500', shadow: 'shadow-emerald-500/30', gradient: 'from-emerald-900', bgBadge: 'bg-emerald-500 text-white', bgCard: 'bg-[#0a0a0a] border-emerald-500/30' },
  GOLD: { text: 'text-yellow-400', border: 'border-yellow-500', shadow: 'shadow-yellow-500/30', gradient: 'from-yellow-900', bgBadge: 'bg-yellow-500 text-black', bgCard: 'bg-[#0a0a0a] border-yellow-500/30' },
  SILVER: { text: 'text-gray-300', border: 'border-gray-400', shadow: 'shadow-gray-400/30', gradient: 'from-gray-700', bgBadge: 'bg-gray-300 text-black', bgCard: 'bg-[#0a0a0a] border-gray-600' },
  BRONZE: { text: 'text-amber-600', border: 'border-amber-600', shadow: 'shadow-amber-600/30', gradient: 'from-amber-900', bgBadge: 'bg-amber-600 text-white', bgCard: 'bg-[#0a0a0a] border-amber-600/30' },
  ROOKIE: { text: 'text-red-500', border: 'border-red-600', shadow: 'shadow-red-600/30', gradient: 'from-red-900', bgBadge: 'bg-red-600 text-white', bgCard: 'bg-[#0a0a0a] border-red-600/30' }
};

const msToTimeStr = (ms) => {
  if (!ms || ms === Infinity || ms === 0 || ms === "0" || ms === "-") return "-";
  let val = Number(ms);
  if (isNaN(val)) return ms;
  let minutes = Math.floor(val / 60000);
  let seconds = Math.floor((val % 60000) / 1000);
  let milis = Math.floor(val % 1000);
  return `${minutes > 0 ? minutes + ':' : ''}${seconds.toString().padStart(2, '0')}.${milis.toString().padStart(3, '0')}`;
};

// EXTRAE GAPS DESDE TEXTO (Soluciona Monday Marathon)
const gapStrToMs = (gapStr) => {
  if (gapStr === null || gapStr === undefined || gapStr === "-" || gapStr === "") return null;
  if (typeof gapStr === 'number') return gapStr;
  const str = String(gapStr).toUpperCase().trim();
  if (str === "POLE" || str === "WINNER" || str === "PACE REF" || str === "BEST LAP") return 0;
  if (str === "DNF" || str === "DSQ") return null;

  const cleanStr = str.replace('+', '').replace('S', '');
  if (cleanStr.includes(':')) {
      const parts = cleanStr.split(':');
      const mins = parseInt(parts[0]) || 0;
      const secsAndMs = parts[1].split('.');
      const secs = parseInt(secsAndMs[0]) || 0;
      const ms = parseInt((secsAndMs[1] || "0").padEnd(3, '0')) || 0;
      return (mins * 60000) + (secs * 1000) + ms;
  }
  if (cleanStr.includes('.')) {
      const parts = cleanStr.split('.');
      const secs = parseInt(parts[0]) || 0;
      const ms = parseInt((parts[1] || "0").padEnd(3, '0')) || 0; 
      return (secs * 1000) + ms;
  }
  return parseInt(cleanStr) || null;
};

// EXTRAE VUELTAS DESDE TEXTO
const timeStrToMs = (timeStr) => { 
  if (!timeStr || timeStr === "-" || timeStr === "NO TIME") return Infinity;
  if (typeof timeStr === 'number') return timeStr;
  const str = String(timeStr).trim();
  if (str.includes(':')) {
      const parts = str.split(':');
      const mins = parseInt(parts[0]) || 0;
      const secsAndMs = parts[1].split('.');
      const secs = parseInt(secsAndMs[0]) || 0;
      const ms = parseInt((secsAndMs[1] || "0").padEnd(3, '0')) || 0;
      return (mins * 60000) + (secs * 1000) + ms;
  }
  return Infinity; 
};

export const DriverProfile = ({ driverName, onBack }) => {
  const [activeLeague, setActiveLeague] = useState('monday');
  const [activeClass, setActiveClass] = useState('GT3');
  const [selectedRaceIndex, setSelectedRaceIndex] = useState(0);
  const { getLeagueData } = useLeagueData();

  const profile = getDriverProfile(driverName);
  const isLegend = isLegendDriver(driverName);
  const leagueData = getLeagueData(activeLeague);

  const availableClasses = useMemo(() => {
    if (activeLeague !== 'multiclass' || !leagueData?.global) return ['GT3'];
    const classes = new Set();
    leagueData.global.forEach(d => {
      if (d.class_stats) {
        Object.keys(d.class_stats).forEach(c => classes.add(c));
      }
    });
    return ['OVERALL', ...Array.from(classes).sort()]; // Añadimos OVERALL aquí
  }, [leagueData, activeLeague]);
  
  const getCarClass = (carId, explicitClass, carClassField) => {
    if (carClassField) return carClassField;
    if (explicitClass) return explicitClass;
    
    const id = Number(carId);
    if (id >= 50 && id <= 61) return 'GT4';
    if ((id >= 80 && id <= 86) || id === 18 || id === 29 || id === 26) return 'GT2';
    if (id === 9 || id === 28) return 'Cup';
    if (id === 27) return 'TCX';
    if (id >= 0 && id <= 45) return 'GT3';
    
    return 'GT3'; 
  };

  let rawDrivers = []; 
  if (activeLeague === 'multiclass') {
    if (activeClass === 'OVERALL') {
      rawDrivers = leagueData?.global || [];
    } else {
      rawDrivers = (leagueData?.global || [])
        .filter(d => d.class_stats && d.class_stats[activeClass])
        .map(d => ({
          ...d,
          ...d.class_stats[activeClass], 
          name: d.name
        }));
    }
  } else { 
    rawDrivers = leagueData?.global || []; 
  }
  
  const categories = useMemo(() => getDriverCategories(rawDrivers), [rawDrivers]);
  const driverCategory = categories[driverName] || { name: 'ROOKIE', rank: 5, expectedPos: 999, color: 'bg-red-600' };

  const driversList = [...rawDrivers].sort((a, b) => b.points - a.points).map((d, index) => ({ ...d, driver: d.name, position: index + 1 }));
  const stats = driversList.find(d => d.driver === driverName);
  
  const favCarId = stats ? stats.favorite_car : null;
  const favCarName = stats ? (carNames[favCarId] || "Unknown Car") : "N/A";
  const theme = stats ? categoryThemes[driverCategory.name] : categoryThemes.ROOKIE;
  
  const bgUrl = getBrandBg(favCarId);
  const bgImage = bgUrl !== 'none' ? `url(${bgUrl})` : 'none';
  const bgColorClass = bgImage === 'none' ? 'bg-[#050505]' : ''; 

  const sessions = leagueData?.sessions || [];
  const raceHistory = [];
  const pbData = {};

  sessions.forEach((session, index) => {
    const roundMatch = session.name.match(/Round (\d+)/i);
    const roundPrefix = roundMatch ? `R${roundMatch[1]}` : `R${index + 1}`;
    const trackOnly = session.name.split(':').pop().trim();
    const displayTrack = `${roundPrefix}: ${trackOnly}`;

    let classResults = session.results || []; 
    let qualyClassResults = session.qualy_results || classResults;  

    // Si NO estamos en OVERALL, filtramos por la clase activa. Si estamos en OVERALL, lo cogemos todo.
    if (activeLeague === 'multiclass' && activeClass !== 'OVERALL') { 
      classResults = classResults.filter(r => getCarClass(r.car_model || r.car, r.class, r.car_class) === activeClass); 
      qualyClassResults = qualyClassResults.filter(r => getCarClass(r.car_model || r.car, r.class, r.car_class) === activeClass); 
    } 
      
    const result = classResults.find(r => r.name === driverName); 
    const qResult = qualyClassResults.find(r => r.name === driverName); 
    
    // Obtenemos qué clase corrió este piloto en esta carrera en particular
    const resultClass = result?.car_class || getCarClass(result?.car_model || qResult?.car_model);
    
    // Buscamos al ganador de SU misma clase, no al general de la carrera
    const winner = classResults.find(r => 
       (r.car_class || getCarClass(r.car_model)) === resultClass && 
       (r.pos === 1 || r.pos === "1" || r.class_pos === 1 || r.class_pos === "1")
    );

    // Si estamos en la pestaña OVERALL, añadimos la clase al nombre del circuito (ej: "R1: Nurburgring [GT4]")
    const finalDisplayTrack = (activeLeague === 'multiclass' && activeClass === 'OVERALL' && resultClass)
      ? `${displayTrack} [${resultClass}]`
      : displayTrack;

    if (result || qResult) { 
      const pGapMs = result?.gap_pace_ms ?? gapStrToMs(result?.gap_pace); 
      const bGapMs = result?.gap_best_ms ?? gapStrToMs(result?.gap_best); 
      const qGapMs = qResult?.gap_pole_ms ?? qResult?.qualy_gap_ms ?? gapStrToMs(qResult?.gap_pole || qResult?.qualy_gap); 
        
      const qTimeMs = qResult?.qualy_time_ms ?? timeStrToMs(qResult?.best_lap || qResult?.qualy_time); 
      const rTimeMs = result?.best_lap_ms ?? timeStrToMs(result?.best_lap); 

      raceHistory.push({ 
        sessionName: finalDisplayTrack, // USAMOS EL NOMBRE NUEVO
        pos: result?.class_pos || result?.pos,
        pacePos: result?.pace_pos, 
        qualyPos: qResult?.class_pos || qResult?.qualy_pos || qResult?.pos || result?.qualy_pos, 
        laps: result?.lap_history || [], 
        avgLapMs: result?.avg_lap_ms, 
        gapPaceMs: pGapMs,
        gapBestMs: bGapMs, 
        qualyGapMs: qGapMs, 
        winnerData: winner,
        participated: true
      });

      if (!pbData[trackOnly]) pbData[trackOnly] = { qualy: Infinity, race: Infinity };
      if (qTimeMs && qTimeMs > 0 && qTimeMs !== Infinity && qTimeMs < pbData[trackOnly].qualy) pbData[trackOnly].qualy = qTimeMs;
      if (rTimeMs && rTimeMs > 0 && rTimeMs !== Infinity && rTimeMs < pbData[trackOnly].race) pbData[trackOnly].race = rTimeMs;
    } else {
      raceHistory.push({
        sessionName: displayTrack, 
        pos: null, pacePos: null, qualyPos: null,
        laps: [], avgLapMs: null, gapPaceMs: null, gapBestMs: null, qualyGapMs: null, winnerData: winner,
        participated: false
      });
    }
  });

  const posChartData = raceHistory.map(h => ({ 
    track: h.sessionName, 
    Race: (h.pos && h.pos !== "DNF") ? parseInt(h.pos) : null, 
    Qualy: (h.qualyPos && h.qualyPos !== "-") ? parseInt(h.qualyPos) : null, 
    Pace: (h.pacePos && h.pacePos !== "-") ? parseInt(h.pacePos) : null 
  }));

  const incidentsChartData = raceHistory.map(h => {
    let driverLost = null, winnerLost = null;
    if (h.participated && h.laps && h.avgLapMs) {
      driverLost = 0;
      h.laps.forEach(l => { if (l.is_incident) driverLost += (l.time_ms - h.avgLapMs); });
    }
    if (h.winnerData?.lap_history && h.winnerData?.avg_lap_ms) {
      winnerLost = 0;
      h.winnerData.lap_history.forEach(l => { if (l.is_incident) winnerLost += (l.time_ms - h.winnerData.avg_lap_ms); });
    }
    return { 
      track: h.sessionName, 
      DriverLost: driverLost !== null ? parseFloat((driverLost / 1000).toFixed(1)) : null, 
      WinnerLost: winnerLost !== null ? parseFloat((winnerLost / 1000).toFixed(1)) : null 
    };
  });

  const gapsChartData = raceHistory.map(h => {
    const processGap = (ms, track) => { 
      if (ms === null || ms === undefined || ms === Infinity) return null; 
      let secs = ms / 1000; 
      return track.toLowerCase().includes("nurburgring") ? parseFloat((secs / 4).toFixed(3)) : parseFloat(secs.toFixed(3)); 
    };
    return { 
      track: h.sessionName, 
      PaceGap: processGap(h.gapPaceMs, h.sessionName), 
      BestLapGap: processGap(h.gapBestMs, h.sessionName), 
      QualyGap: processGap(h.qualyGapMs, h.sessionName) 
    };
  });

  const participatedRaces = raceHistory.filter(r => r.participated);
  const selectedRaceData = participatedRaces[selectedRaceIndex];
  
  let telemetryData = [];
  if (selectedRaceData) {
    const maxLaps = Math.max(selectedRaceData.laps?.length || 0, selectedRaceData.winnerData?.lap_history?.length || 0);
    for (let i = 0; i < maxLaps; i++) {
      telemetryData.push({
        lap: `L${i + 1}`,
        Driver: selectedRaceData.laps?.[i] && !selectedRaceData.laps?.[i].is_incident ? parseFloat((selectedRaceData.laps?.[i].time_ms / 1000).toFixed(3)) : null,
        Winner: selectedRaceData.winnerData?.lap_history?.[i] && !selectedRaceData.winnerData?.lap_history?.[i].is_incident ? parseFloat((selectedRaceData.winnerData?.lap_history?.[i].time_ms / 1000).toFixed(3)) : null,
      });
    }
  }

  const StatBlock = ({ label, value, colorClass = "text-white" }) => (
    <div className={`p-4 border text-center flex flex-col justify-center transform skew-x-[-5deg] ${theme.bgCard}`}>
      <div className="text-gray-500 text-[10px] uppercase font-bold mb-1 tracking-widest transform skew-x-5">{label}</div>
      <div className={`font-['Teko'] text-4xl lg:text-5xl font-bold transform skew-x-5 ${colorClass}`}>{value}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black font-['Inter'] text-gray-300 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <button onClick={onBack} className="flex items-center space-x-2 text-yellow-500 hover:text-yellow-400 font-bold uppercase tracking-widest mb-6 transition-colors text-sm">
          <ArrowLeft className="w-5 h-5" /><span>Back to Standings</span>
        </button>

        <div className={`overflow-hidden mb-6 border-2 transition-all duration-500 ${theme.border} shadow-2xl ${theme.shadow} ${bgColorClass}`}>
          <div className="h-[550px] bg-cover bg-center relative" style={{ backgroundImage: bgImage }}>
            {bgImage !== 'none' && <div className={`absolute inset-0 bg-gradient-to-t ${theme.gradient} via-black/80 to-transparent opacity-90`}></div>}
            
            <div className="absolute bottom-8 left-8 flex items-end space-x-6">
              {profile.avatar && (
                <div className="relative z-10 hidden sm:block">
                  <img src={profile.avatar} alt={driverName} className={`w-36 h-36 md:w-44 md:h-44 rounded-full border-4 ${theme.border} object-cover shadow-[0_0_30px_rgba(0,0,0,0.8)]`} />
                </div>
              )}

              <div className="relative z-10 mb-2">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h1 className={`font-['Teko'] text-6xl md:text-8xl font-bold mr-2 uppercase tracking-wide drop-shadow-md ${theme.text}`}>
                    {driverName}
                  </h1>
                  {stats && (
                    <span className={`px-3 py-1 text-xs font-bold rounded shadow-lg flex items-center space-x-1 uppercase tracking-wider ${theme.bgBadge}`}>
                      <Shield className="w-4 h-4" /><span>{driverCategory.name}</span>
                    </span>
                  )}
                  {isLegend && (
                    <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded shadow-lg flex items-center space-x-1 tracking-wider uppercase">
                      <Award className="w-4 h-4" /><span>LEGEND</span>
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-3 text-gray-400 font-bold mt-4 text-sm uppercase tracking-widest">
                  <span className="text-3xl" title="Nationality">{profile.nacionalidad}</span>
                  <span className="bg-black/80 px-5 py-2.5 border border-gray-800 shadow-md">{profile.equipo}</span>
                  {stats && (
                    <span className="bg-black/80 px-5 py-2.5 border border-gray-800 shadow-md flex items-center space-x-2">
                      <Car className="w-5 h-5 text-gray-500" /><span>{favCarName}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="absolute top-8 right-8 z-20">
              <span className={`font-['Teko'] text-8xl md:text-9xl font-bold drop-shadow-2xl ${theme.text}`}>#{profile.dorsal}</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-2 mb-4">
          <button onClick={() => { setActiveLeague('monday'); setActiveClass('GT3'); setSelectedRaceIndex(0); }} className={`flex-1 py-3 px-6 font-['Teko'] text-2xl uppercase tracking-widest transition-all duration-200 transform -skew-x-12 border border-gray-800 ${activeLeague === 'monday' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(250,204,21,0.3)]' : 'bg-[#0a0a0a] text-gray-400 hover:text-white'}`}><span className="block transform skew-x-12">Monday Marathon</span></button>
          <button onClick={() => { setActiveLeague('multiclass'); setSelectedRaceIndex(0); }} className={`flex-1 py-3 px-6 font-['Teko'] text-2xl uppercase tracking-widest transition-all duration-200 transform -skew-x-12 border border-gray-800 ${activeLeague === 'multiclass' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(250,204,21,0.3)]' : 'bg-[#0a0a0a] text-gray-400 hover:text-white'}`}><span className="block transform skew-x-12">Multiclass Friday</span></button>
        </div>

        {activeLeague === 'multiclass' && availableClasses.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-6 bg-[#0a0a0a] p-3 w-full max-w-2xl mx-auto border border-gray-800 rounded">
            {availableClasses.map(cls => (
              <button
                key={cls}
                onClick={() => { setActiveClass(cls); setSelectedRaceIndex(0); }}
                className={`py-2 px-4 font-bold text-sm uppercase tracking-widest transition-all ${
                  activeClass === cls 
                    ? 'bg-yellow-500 text-black shadow-md' 
                    : 'bg-black border border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {cls} Class
              </button>
            ))}
          </div>
        )}

        {stats && participatedRaces.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <StatBlock label="Points" value={stats.points} colorClass={theme.text} />
              <StatBlock label="Avg Points" value={stats.avg_points || '-'} />
              <StatBlock label="Races" value={stats.races} />
              <StatBlock label="Avg Race Pos" value={`P${stats.avg_pos || '-'}`} colorClass={theme.text} />
              <StatBlock label="Avg Pace Pos" value={`P${stats.avg_pace_pos || '-'}`} />
              <StatBlock label="Net vs Pace" value={`${stats.net_pos_gained > 0 ? '+' : ''}${stats.net_pos_gained || 0}`} colorClass={stats.net_pos_gained > 0 ? 'text-green-500' : stats.net_pos_gained < 0 ? 'text-red-500' : 'text-gray-400'} />
              <StatBlock label="Avg Qualy Pos" value={`P${stats.avg_qualy_pos || '-'}`} />
              <StatBlock label="Avg Qualy Gap" value={stats.avg_qualy_gap || '-'} />
              <StatBlock label="Net vs Qualy" value={`${stats.net_pos_gained_qualy > 0 ? '+' : ''}${stats.net_pos_gained_qualy || 0}`} colorClass={stats.net_pos_gained_qualy > 0 ? 'text-green-500' : stats.net_pos_gained_qualy < 0 ? 'text-red-500' : 'text-gray-400'} />
              <StatBlock label="Avg Race Gap" value={stats.avg_gap || '-'} />
            </div>

            <div className="bg-[#0a0a0a] border border-gray-800 shadow-xl mb-8">
              <div className="p-4 border-b border-gray-800 bg-black flex items-center space-x-3">
                <Clock className="w-6 h-6 text-yellow-400" />
                <h3 className="font-['Teko'] text-3xl font-bold text-white uppercase tracking-wide">Personal Bests</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-black text-gray-500 uppercase tracking-widest text-xs border-b border-gray-800">
                    <tr>
                      <th className="px-6 py-4 font-bold">Track</th>
                      <th className="px-6 py-4 font-bold">Best Qualy</th>
                      <th className="px-6 py-4 font-bold">Best Race</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {Object.entries(pbData).map(([track, times]) => (
                      <tr key={track} className="hover:bg-gray-800/30">
                        <td className="px-6 py-4 font-bold text-gray-200 uppercase tracking-wide">{track}</td>
                        <td className="px-6 py-4 font-mono text-gray-300"><span className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded-sm text-[10px] font-bold mr-3 border border-yellow-500/30">Q</span>{msToTimeStr(times.qualy)}</td>
                        <td className="px-6 py-4 font-mono text-gray-300"><span className="bg-emerald-500/20 text-emerald-500 px-2 py-1 rounded-sm text-[10px] font-bold mr-3 border border-emerald-500/30">R</span>{msToTimeStr(times.race)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-[#0a0a0a] p-6 border border-gray-800 relative overflow-hidden">
                <h3 className="font-['Teko'] text-3xl font-bold text-white mb-6 uppercase tracking-wide">Position History</h3>
                <div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={posChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} /><XAxis dataKey="track" stroke="#6b7280" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} /><YAxis reversed={true} stroke="#6b7280" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#374151', color: '#fff' }} /><Legend /><Line connectNulls={true} type="monotone" dataKey="Race" name="Race Pos" stroke="#eab308" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} /><Line connectNulls={true} type="monotone" dataKey="Qualy" name="Qualy Pos" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" /><Line connectNulls={true} type="monotone" dataKey="Pace" name="Pace Pos" stroke="#f97316" strokeWidth={2} strokeDasharray="3 3" /></LineChart></ResponsiveContainer></div>
              </div>
              <div className="bg-[#0a0a0a] p-6 border border-gray-800 relative overflow-hidden">
                <h3 className="font-['Teko'] text-3xl font-bold text-white mb-6 uppercase tracking-wide flex items-center space-x-2"><AlertTriangle className="w-6 h-6 text-red-500" /><span>Time Lost to Incidents (Vs Leader)</span></h3>
                <div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={incidentsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} /><XAxis dataKey="track" stroke="#6b7280" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} /><YAxis stroke="#6b7280" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#374151', color: '#fff' }} /><Legend /><Area connectNulls={true} type="monotone" dataKey="DriverLost" name="Your Lost Time" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} strokeWidth={2} /><Area connectNulls={true} type="monotone" dataKey="WinnerLost" name="Leader Lost Time" stroke="#9ca3af" fill="transparent" strokeWidth={2} strokeDasharray="4 4" dot={false} /></AreaChart></ResponsiveContainer></div>
              </div>
            </div>
            
            <div className="bg-[#0a0a0a] p-6 border border-gray-800 mb-8">
              <h3 className="font-['Teko'] text-3xl font-bold text-white mb-6 uppercase tracking-wide">Gaps Evolution (Seconds vs Leader)</h3>
              <div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={gapsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} /><XAxis dataKey="track" stroke="#6b7280" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} /><YAxis stroke="#6b7280" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#374151', color: '#fff' }} /><Legend /><Line connectNulls={true} type="monotone" dataKey="PaceGap" name="Race Pace Gap" stroke="#06b6d4" strokeWidth={2} /><Line connectNulls={true} type="monotone" dataKey="BestLapGap" name="Best Lap Gap" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" /><Line connectNulls={true} type="monotone" dataKey="QualyGap" name="Qualy Gap" stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" /></LineChart></ResponsiveContainer></div>
            </div>

            <div className="bg-[#0a0a0a] p-6 border border-gray-800 mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
                <h3 className="font-['Teko'] text-3xl font-bold text-white uppercase tracking-wide">Clean Lap Telemetry</h3>
                <select 
                  className="bg-black border border-gray-700 text-gray-300 font-bold uppercase tracking-widest rounded-sm px-4 py-2 outline-none focus:border-yellow-500 text-xs"
                  value={selectedRaceIndex}
                  onChange={(e) => setSelectedRaceIndex(Number(e.target.value))}
                >
                  {participatedRaces.map((race, idx) => (
                    <option key={idx} value={idx}>{race.sessionName}</option>
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
                    <Line type="monotone" dataKey="Driver" name="Your Clean Laps" stroke="#10B981" strokeWidth={2} dot={{ r: 2 }} connectNulls={true} />
                    <Line type="monotone" dataKey="Winner" name="Leader's Clean Laps" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls={true} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-[#0a0a0a] p-12 text-center border border-gray-800">
            <Shield className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h2 className="font-['Teko'] text-4xl font-bold text-white mb-2 uppercase tracking-wide">No Participation</h2>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">This driver does not have any data for this category yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};