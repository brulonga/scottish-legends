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

const gt4CarIds = [50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61];
const getCarClass = (carId, explicitClass) => explicitClass ? explicitClass : (gt4CarIds.includes(Number(carId)) ? 'GT4' : 'GT3');

export const Records = ({ onDriverClick }) => {
  const { getLeagueData, loading } = useLeagueData();
  const mondayData = getLeagueData('monday');
  const multiclassData = getLeagueData('multiclass');

  const { gt3Records, gt4Records } = useMemo(() => {
    const rGT3 = {};
    const rGT4 = {};

    const processSession = (session) => {
      const track = session.name.split(':').pop().trim();
      
      (session.results || []).forEach(res => {
        const carClass = getCarClass(res.car_model || res.car, res.class);
        const targetMap = carClass === 'GT4' ? rGT4 : rGT3;
        
        if (!targetMap[track]) {
          targetMap[track] = { bestQualyTime: Infinity, bestRaceTime: Infinity };
        }

        if (res.qualy_time_ms && res.qualy_time_ms < targetMap[track].bestQualyTime) {
          targetMap[track].bestQualyTime = res.qualy_time_ms;
          targetMap[track].bestQualyDriver = res.name;
        }
        if (res.best_lap_ms && res.best_lap_ms < targetMap[track].bestRaceTime) {
          targetMap[track].bestRaceTime = res.best_lap_ms;
          targetMap[track].bestRaceDriver = res.name;
        }
      });
    };

    (mondayData?.sessions || []).forEach(s => processSession(s));
    (multiclassData?.sessions || []).forEach(s => processSession(s));

    return { gt3Records: Object.entries(rGT3), gt4Records: Object.entries(rGT4) };
  }, [mondayData, multiclassData]);

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
        {gt3Records.length > 0 && <RecordTable title="Overall GT3 Records" records={gt3Records} />}
        {gt4Records.length > 0 && <RecordTable title="Overall GT4 Records" records={gt4Records} />}
      </div>
    </div>
  );
};