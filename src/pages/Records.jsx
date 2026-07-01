import { useMemo } from 'react'; 
import { Trophy, Timer } from 'lucide-react'; 
import { useLeagueData } from '../hooks/useLeagueData'; 
import { getDriverProfile } from '../config/driversConfig'; 
 
const msToTimeStr = (ms) => { 
  if (!ms || ms === Infinity) return "-"; 
  let minutes = Math.floor(ms / 60000); 
  let seconds = Math.floor((ms % 60000) / 1000); 
  let milis = Math.floor(ms % 1000); 
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${milis.toString().padStart(3, '0')}`; 
}; 
 
export const Records = ({ onDriverClick }) => { 
  // Usamos el nuevo estado global allLeaguesData del hook
  const { allLeaguesData, loading } = useLeagueData(); 
 
  // 🚀 RECOPILACIÓN DINÁMICA DE RÉCORDS POR CLASE (Analizando TODOS los JSON)
  const recordsByClass = useMemo(() => { 
    const groupedRecords = {}; 
 
    const processSession = (session) => { 
      const track = session.name.split(':').pop().trim(); 
       
      (session.results || []).forEach(res => { 
        const carClass = res.car_class || 'GT3'; 
        
        if (!groupedRecords[carClass]) {
          groupedRecords[carClass] = {};
        }
         
        if (!groupedRecords[carClass][track]) { 
          groupedRecords[carClass][track] = { bestQualyTime: Infinity, bestRaceTime: Infinity }; 
        } 
        
        // 🧹 LIMPIADOR DE NOMBRES
        const cleanName = res.name ? res.name.replace(/\[.*?\]|\|.*/g, '').trim() : "Unknown";

        if (res.qualy_time_ms && res.qualy_time_ms < groupedRecords[carClass][track].bestQualyTime) { 
          groupedRecords[carClass][track].bestQualyTime = res.qualy_time_ms; 
          groupedRecords[carClass][track].bestQualyDriver = cleanName; 
        } 
        
        if (res.best_lap_ms && res.best_lap_ms < groupedRecords[carClass][track].bestRaceTime) { 
          groupedRecords[carClass][track].bestRaceTime = res.best_lap_ms; 
          groupedRecords[carClass][track].bestRaceDriver = cleanName; 
        } 
      }); 
    }; 
 
    // Iteramos por absolutamente todos los archivos JSON cargados
    allLeaguesData.forEach(leagueFile => {
      (leagueFile.sessions || []).forEach(s => processSession(s));
    });
 
    return groupedRecords; 
  }, [allLeaguesData]); 
 
  const RecordTable = ({ title, records }) => ( 
    <div className="bg-[#0a0a0a] border border-gray-800 shadow-2xl mb-12"> 
      <div className="p-4 border-b border-gray-800 bg-black flex items-center space-x-3"> 
        <Trophy className="w-6 h-6 text-yellow-400" /> 
        <h3 className="font-['Teko'] text-3xl font-bold text-white uppercase tracking-wide">{title}</h3> 
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
            {records.map(([track, data]) => ( 
              <tr key={track} className="hover:bg-gray-800/30 transition-colors"> 
                <td className="px-6 py-4 font-bold text-gray-200 uppercase tracking-wide">{track}</td> 
                 
                <td className="px-6 py-4"> 
                  {data.bestQualyTime !== Infinity ? ( 
                    <div className="flex items-center space-x-3"> 
                      <span className="font-mono text-yellow-400 text-base font-bold bg-yellow-400/10 px-3 py-1.5 rounded border border-yellow-400/30 whitespace-nowrap drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]"> 
                        {msToTimeStr(data.bestQualyTime)} 
                      </span> 
                      <div className="flex items-center cursor-pointer group" onClick={() => onDriverClick(data.bestQualyDriver)}> 
                        {getDriverProfile(data.bestQualyDriver)?.avatar && <img src={getDriverProfile(data.bestQualyDriver).avatar} className="w-6 h-6 rounded-full mr-2 object-cover border border-gray-700" alt="avatar" />} 
                        <span className="text-gray-300 font-semibold group-hover:text-yellow-400 transition-colors">{data.bestQualyDriver}</span> 
                      </div> 
                    </div> 
                  ) : <span className="text-gray-600">-</span>} 
                </td> 
                 
                <td className="px-6 py-4"> 
                  {data.bestRaceTime !== Infinity ? ( 
                    <div className="flex items-center space-x-3"> 
                      <span className="font-mono text-yellow-400 text-base font-bold bg-yellow-400/10 px-3 py-1.5 rounded border border-yellow-400/30 whitespace-nowrap drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]"> 
                        {msToTimeStr(data.bestRaceTime)} 
                      </span> 
                      <div className="flex items-center cursor-pointer group" onClick={() => onDriverClick(data.bestRaceDriver)}> 
                        {getDriverProfile(data.bestRaceDriver)?.avatar && <img src={getDriverProfile(data.bestRaceDriver).avatar} className="w-6 h-6 rounded-full mr-2 object-cover border border-gray-700" alt="avatar" />} 
                        <span className="text-gray-300 font-semibold group-hover:text-yellow-400 transition-colors">{data.bestRaceDriver}</span> 
                      </div> 
                    </div> 
                  ) : <span className="text-gray-600">-</span>} 
                </td> 
 
              </tr> 
            ))} 
          </tbody> 
        </table> 
      </div> 
    </div> 
  ); 
 
  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-500"></div></div>; 
 
  return ( 
    <div className="min-h-screen bg-black font-['Inter'] text-gray-300 py-8"> 
      <div className="max-w-[1536px] mx-auto px-4"> 
        <div className="text-center mb-16"> 
          <div className="inline-flex items-center justify-center space-x-2 border border-yellow-500/30 px-6 py-2 rounded-full mb-6 bg-yellow-500/10"> 
            <Timer className="w-4 h-4 text-yellow-400" /> 
            <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest">Track Records</span> 
          </div> 
          <h1 className="font-['Teko'] text-7xl md:text-9xl font-bold text-white mb-4 uppercase tracking-wide drop-shadow-lg"> 
            Track <span className="text-yellow-400">Records</span> 
          </h1> 
          <p className="text-gray-400 text-lg max-w-2xl mx-auto uppercase tracking-widest font-medium">The fastest laps recorded across all Scottish Legends championships.</p> 
        </div> 
        
        {Object.keys(recordsByClass).sort().map(carClass => (
          <RecordTable 
            key={carClass} 
            title={`Overall ${carClass} Records`} 
            records={Object.entries(recordsByClass[carClass])} 
          />
        ))}

        {Object.keys(recordsByClass).length === 0 && !loading && (
          <div className="text-center py-20 border border-dashed border-gray-800 bg-[#0a0a0a] rounded-lg">
            <Trophy className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 text-lg font-bold uppercase tracking-widest">No records established yet.</p>
          </div>
        )}

      </div> 
    </div> 
  ); 
};