import { ChevronDown } from 'lucide-react';

export const LEAGUE_SEASONS = {
  monday_marathon: [
    { id: 'season_1', name: 'Season 1' },
    { id: 'season_2', name: 'Season 2' }
  ],
  fun_friday: [
    { id: 'season_1', name: 'Season 1' },
    { id: 'season_2', name: 'Season 2' },
    { id: 'season_3', name: 'Season 3' }
  ]
};

export const LeagueSelector = ({ activeLeague, setActiveLeague, activeSeason, setActiveSeason }) => {
  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1 space-y-2">
        <label className="font-['Teko'] text-xl text-gray-500 uppercase tracking-widest">1. Select League</label>
        <div className="flex space-x-2">
          <button
            onClick={() => { setActiveLeague('monday_marathon'); setActiveSeason(null); }}
            className={`flex-1 py-3 px-4 transform -skew-x-12 transition-all duration-200 border border-gray-800 ${
              activeLeague === 'monday_marathon' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(250,204,21,0.3)]' : 'bg-[#0a0a0a] text-gray-400 hover:border-yellow-500/50 hover:text-white'
            }`}
          >
            <span className="font-['Teko'] text-2xl uppercase tracking-widest block transform skew-x-12">Monday Marathon</span>
          </button>
          <button
            onClick={() => { setActiveLeague('fun_friday'); setActiveSeason(null); }}
            className={`flex-1 py-3 px-4 transform -skew-x-12 transition-all duration-200 border border-gray-800 ${
              activeLeague === 'fun_friday' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(250,204,21,0.3)]' : 'bg-[#0a0a0a] text-gray-400 hover:border-yellow-500/50 hover:text-white'
            }`}
          >
            <span className="font-['Teko'] text-2xl uppercase tracking-widest block transform skew-x-12">Fun Friday</span>
          </button>
        </div>
      </div>

      <div className={`flex-1 space-y-2 transition-opacity duration-300 ${activeLeague ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
        <label className="font-['Teko'] text-xl text-gray-500 uppercase tracking-widest">2. Select Season</label>
        
        <div className="relative transform -skew-x-12">
          <select
            value={activeSeason || ''}
            onChange={(e) => setActiveSeason(e.target.value)}
            className={`w-full appearance-none py-3 px-4 transition-all duration-200 border cursor-pointer font-['Teko'] text-2xl uppercase tracking-widest outline-none shadow-inner ${
              activeSeason 
                ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                : 'bg-[#0a0a0a] border-gray-800 text-gray-400 hover:border-white/50 hover:text-white'
            }`}
          >
            <option value="" disabled className="bg-[#0a0a0a] text-gray-500">-- CHOOSE A SEASON --</option>
            {activeLeague && LEAGUE_SEASONS[activeLeague].map(season => (
              <option key={season.id} value={season.id} className="bg-[#0a0a0a] text-white">
                {season.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none transform skew-x-12">
            <ChevronDown className={`w-6 h-6 ${activeSeason ? 'text-black' : 'text-gray-500'}`} />
          </div>
        </div>
      </div>
    </div>
  );
};