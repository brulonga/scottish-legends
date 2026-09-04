import { Trophy, ChevronUp, ChevronDown } from 'lucide-react';
import { isLegendDriver } from '../config/driversConfig';

export const ModernStandings = ({ drivers, calendar, sortConfig, requestSort, onDriverClick }) => {
  const hasCalendar = calendar && calendar.length > 0;

  const SortableHeader = ({ title, sortKey, align = 'center' }) => {
    const isActive = sortConfig?.key === sortKey;
    const alignClasses = { left: 'text-left', center: 'text-center', right: 'text-right' };
    
    return (
      <th 
        className={`px-2 py-3 ${alignClasses[align]} font-['Teko'] text-xl font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:bg-gray-800 hover:text-white transition-colors group select-none`}
        onClick={() => requestSort(sortKey)}
      >
        <div className={`flex items-center space-x-1 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
          <span>{title}</span>
          <span className={`flex flex-col opacity-50 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100 text-yellow-400' : ''}`}>
            {(!isActive || sortConfig.direction === 'asc') && <ChevronUp className="w-3 h-3 -mb-1" />}
            {(!isActive || sortConfig.direction === 'desc') && <ChevronDown className="w-3 h-3" />}
          </span>
        </div>
      </th>
    );
  };

  return (
    <div className="bg-[#0a0a0a] border border-gray-800 shadow-2xl overflow-x-auto rounded-lg">
      <table className="w-full whitespace-nowrap">
        <thead className="bg-black border-b border-gray-800">
          <tr>
            <SortableHeader title="Pos" sortKey="position" align="left" />
            <SortableHeader title="Driver" sortKey="driver" align="left" />
            <SortableHeader title="Total Pts" sortKey="points" />
            
            {hasCalendar && calendar.map(race => (
              <th key={race.id} className="px-2 py-3 text-center font-['Teko'] text-lg text-gray-400 uppercase border-l border-gray-800/50">
                {race.id}
                <div className="text-[10px] text-gray-600 truncate max-w-[80px] mx-auto">{race.track}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {drivers.map((driver) => {
            const isLegend = isLegendDriver(driver.driver);
            
            return (
              <tr key={`modern-${driver.id}`} onClick={() => onDriverClick(driver.rawName)} className="cursor-pointer hover:bg-gray-800/40 transition-colors">
                
                <td className="px-3 py-4 text-sm font-bold text-white">
                  <div className="flex items-center space-x-2">
                    {driver.position <= 3 && <Trophy className={`w-5 h-5 ${driver.position === 1 ? 'text-yellow-500' : driver.position === 2 ? 'text-gray-400' : 'text-orange-600'}`} />}
                    <span className={`font-['Teko'] text-3xl ${driver.position > 3 ? "ml-7" : ""}`}>{driver.position}</span>
                  </div>
                </td>

                <td className="px-2 py-4">
                  <div className="flex items-center justify-between pr-4">
                    <div className="flex items-center">
                      <span className={`font-bold tracking-wide text-lg ${isLegend ? 'text-purple-400' : 'text-white'}`}>
                        {driver.driver}
                      </span>
                      {isLegend && (
                        <span className="ml-2 px-1.5 py-0.5 bg-purple-600 text-white text-[10px] font-bold rounded shadow-md uppercase tracking-widest">LEGEND</span>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-gray-700 ${driver.category.color}`}>
                      {driver.category.name.substring(0, 3)}
                    </span>
                  </div>
                </td>

                <td className="px-2 py-4 text-center bg-gray-900/30">
                  <span className="font-['Teko'] text-4xl font-bold text-yellow-400 drop-shadow-md">
                    {driver.points}
                  </span>
                </td>

                {hasCalendar && calendar.map(race => {
                  const roundData = driver.rounds[race.id];
                  if (!roundData) return <td key={race.id} className="px-2 py-4 text-center border-l border-gray-800/30 text-gray-700 font-['Teko'] text-2xl">-</td>;
                  
                  return (
                    <td key={race.id} className="px-2 py-4 text-center border-l border-gray-800/30">
                      <div className="flex flex-col items-center justify-center">
                        <div className="font-['Teko'] text-3xl font-bold flex items-center justify-center">
                          <span className={roundData.isDropped ? 'line-through text-red-900/80 decoration-2' : 'text-gray-200'}>
                            {roundData.points !== null ? roundData.points : 'DNS'}
                          </span>
                          {roundData.bonusPoints > 0 && !roundData.isDropped && (
                            <span className="text-yellow-500 text-sm ml-1 mb-2">+{roundData.bonusPoints}</span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">
                          {roundData.position ? `P${roundData.position}` : ''}
                        </div>
                        {roundData.isDropped && <div className="text-[9px] text-red-800 font-bold uppercase tracking-widest mt-1">Dropped</div>}
                      </div>
                    </td>
                  );
                })}

              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};