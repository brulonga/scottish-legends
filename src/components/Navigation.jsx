import { Menu, X, Flag, Trophy, Medal, Users, Timer } from 'lucide-react';
import { useState } from 'react';

export const Navigation = ({ currentPage, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Flag },
    { id: 'standings', label: 'Standings', icon: Trophy },
    { id: 'records', label: 'Records', icon: Timer },
    { id: 'hall-of-fame', label: 'Hall of Fame', icon: Medal },
    { id: 'community', label: 'Community', icon: Users },
  ];

  const handleNavClick = (id) => {
    onNavigate(id);
    setIsOpen(false); 
  };

  return (
    <nav className="bg-[#0a0a0a] border-b border-yellow-500/30 sticky top-0 z-50 shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
      <div className="max-w-[1536px] mx-auto px-4">
        <div className="flex justify-between h-20">
          
          <div className="flex-shrink-0 flex items-center cursor-pointer group" onClick={() => handleNavClick('home')}>
            <div className="flex items-center space-x-3 transform -skew-x-12 transition-transform group-hover:scale-105">
              <div className="w-12 h-12 bg-yellow-400 flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.3)] border border-yellow-300/50">
                <span className="font-['Teko'] text-3xl font-black text-black uppercase mt-1 pr-0.5">SL</span>
              </div>
              <div className="mt-1">
                <span className="font-['Teko'] text-4xl md:text-5xl font-bold text-white uppercase tracking-wider italic drop-shadow-md">
                  Scottish <span className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.4)]">Legends</span>
                </span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id || (item.id === 'standings' && currentPage === 'driver-profile');
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`inline-flex items-center px-1 pt-1 border-b-4 font-['Teko'] text-2xl uppercase tracking-widest transition-all duration-200 ${
                    isActive ? 'border-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-2 mb-1 ${isActive ? 'text-yellow-400' : 'text-gray-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none transition-colors">
              {isOpen ? <X className="block h-8 w-8 text-yellow-400" /> : <Menu className="block h-8 w-8 text-yellow-400" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-black border-b border-yellow-500/30 overflow-hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id || (item.id === 'standings' && currentPage === 'driver-profile');
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center px-3 py-4 rounded-md font-['Teko'] text-2xl uppercase tracking-widest transition-colors ${
                    isActive ? 'bg-yellow-500/10 text-yellow-400 border-l-4 border-yellow-400' : 'text-gray-400 hover:bg-gray-900 hover:text-white border-l-4 border-transparent'
                  }`}
                >
                  <Icon className={`w-6 h-6 mr-3 ${isActive ? 'text-yellow-400' : 'text-gray-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};