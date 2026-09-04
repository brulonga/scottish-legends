import { Trophy, ChevronUp, ChevronDown } from 'lucide-react'; 
import { isLegendDriver } from '../config/driversConfig'; 

export const LegacyStandings = ({ drivers, sortConfig, requestSort, onDriverClick }) => {

  const SortableHeader = ({ title, sortKey, align = 'center' }) => {
    const isActive = sortConfig?.key === sortKey;
    const alignClasses = { left: 'text-left', center: 'text-center', right: 'text-right' };
    
    return (
      <th 
        className={`px-2 py-3 ${alignClasses[align]} font-['Teko'] text-lg font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:bg-gray-800 hover:text-white transition-colors group select-none`}
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
    <div className="bg-[#0a0a0a] border border-gray-800 shadow-2xl overflow-x-auto">
      <table className="w-full whitespace-nowrap">
        <thead className="bg-black border-b border-gray-800">
          <tr>
            <SortableHeader title="Pos" sortKey="position" align="left" />
            <SortableHeader title="Driver" sortKey="driver" align="left" />
            <SortableHeader title="Cat" sortKey="category" />
            <SortableHeader title="Pts" sortKey="points" />
            <SortableHeader title="Avg Pts" sortKey="avgPoints" />
            <SortableHeader title="Avg Q Pos" sortKey="avgQualyPos" />
            <SortableHeader title="Avg Q Gap" sortKey="avgQualyGap" />
            <SortableHeader title="Avg R Pos" sortKey="avgRacePos" />
            <SortableHeader title="Avg R Gap" sortKey="avgPaceGap" />
            <SortableHeader title="Races" sortKey="races" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {drivers.map((driver) => {
            const isLegend = isLegendDriver(driver.driver);
            return (
              <tr key={`legacy-${driver.id}`} onClick={() => onDriverClick(driver.rawName)} className="cursor-pointer hover:bg-gray-800/30">
                <td className="px-2 py-3 text-sm font-bold text-white">
                  <div className="flex items-center space-x-1">
                    {driver.position <= 3 && <Trophy className={`w-4 h-4 ${driver.position === 1 ? 'text-yellow-500' : driver.position === 2 ? 'text-gray-400' : 'text-orange-600'}`} />}
                    <span className={`font-['Teko'] text-2xl ${driver.position > 3 ? "ml-5" : ""}`}>{driver.position}</span>
                  </div>
                </td>
                <td className="px-2 py-3 text-sm">
                  <div className="flex items-center">
                    <span className={`font-bold tracking-wide ${isLegend ? 'text-purple-400' : 'text-white'}`}>{driver.driver}</span>
                    {isLegend && <span className="ml-2 px-1.5 py-0.5 bg-purple-600 text-white text-[10px] font-bold rounded shadow-md uppercase tracking-widest">LEGEND</span>}
                  </div>
                </td>
                <td className="px-1 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${driver.category.color}`}>
                    {driver.category.name.substring(0, 4)}
                  </span>
                </td>
                <td className="px-2 py-3 text-center font-['Teko'] text-3xl font-bold text-yellow-400">{driver.points}</td>
                <td className="px-2 py-3 text-center font-bold text-gray-400 text-sm">{driver.avgPoints || '-'}</td>
                <td className="px-2 py-3 text-center text-gray-300 font-bold text-sm">{driver.avgQualyPos && driver.avgQualyPos !== '-' ? `P${driver.avgQualyPos}` : '-'}</td>
                <td className="px-2 py-3 text-center text-gray-400 text-xs">{driver.avgQualyGap || '-'}</td>
                <td className="px-2 py-3 text-center text-gray-300 font-bold text-sm">{driver.avgRacePos && driver.avgRacePos !== '-' ? `P${driver.avgRacePos}` : '-'}</td>
                <td className="px-2 py-3 text-center text-gray-400 text-xs">{driver.avgPaceGap || '-'}</td>
                <td className="px-2 py-3 text-center text-gray-500 font-bold text-sm">{driver.races}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  );
};