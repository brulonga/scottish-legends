export const Footer = ({ onNavigate }) => {
  return (
    <footer className="bg-[#050505] border-t border-yellow-500/20 pt-16 pb-8 font-['Inter']">
      <div className="max-w-[1536px] mx-auto px-4">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-12">
          {/* COLUMNA 1: LOGO Y DESCRIPCIÓN */}
          <div>
            <div 
              className="flex items-center space-x-3 transform -skew-x-12 mb-6 cursor-pointer w-fit group" 
              onClick={() => onNavigate('home')}
            >
              <div className="w-10 h-10 bg-yellow-400 flex items-center justify-center shadow-[0_0_10px_rgba(250,204,21,0.3)] border border-yellow-300/50 group-hover:scale-105 transition-transform">
                <span className="font-['Teko'] text-2xl font-black text-black uppercase mt-1 pr-0.5">SL</span>
              </div>
              <div className="mt-1">
                <span className="font-['Teko'] text-3xl font-bold text-white uppercase tracking-wider italic drop-shadow-md">
                  Scottish <span className="text-yellow-400">Legends</span>
                </span>
              </div>
            </div>
            <p className="text-gray-400 text-sm max-w-xs leading-relaxed font-medium">
              Assetto Corsa Competizione community and league. Speed, competition, and brotherhood in every corner.
            </p>
          </div>

          {/* COLUMNA 2: NAVEGACIÓN */}
          <div>
            <h4 className="font-['Teko'] text-2xl text-white uppercase tracking-widest mb-6">Navigation</h4>
            <ul className="space-y-3">
              {[
                { id: 'home', label: 'Home' },
                { id: 'standings', label: 'Standings' },
                { id: 'records', label: 'Track Records' },
                { id: 'hall-of-fame', label: 'The Grid (Hall of Fame)' },
                { id: 'community', label: 'Community' },
                { id: 'about-us', label: 'About Us' }
              ].map((item) => (
                <li key={item.id}>
                  <button 
                    onClick={() => onNavigate(item.id)} 
                    className="text-gray-400 hover:text-yellow-400 transition-colors text-sm font-bold uppercase tracking-widest"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* COLUMNA 3: CONECTA */}
          <div>
            <h4 className="font-['Teko'] text-2xl text-white uppercase tracking-widest mb-6">Connect</h4>
            <ul className="space-y-3">
              <li>
                {/* Botón de Discord te lleva a la sección de la Comunidad */}
                <button 
                  onClick={() => onNavigate('community')} 
                  className="text-gray-400 hover:text-[#5865F2] transition-colors text-sm font-bold uppercase tracking-widest"
                >
                  Discord
                </button>
              </li>
              <li>
                <a 
                  href="https://www.youtube.com/@TheRookieDriver-LFM" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-400 hover:text-red-500 transition-colors text-sm font-bold uppercase tracking-widest"
                >
                  YouTube - Rookie Driver
                </a>
              </li>
              <li>
                <a 
                  href="https://www.youtube.com/@foxfaceracing" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-400 hover:text-red-500 transition-colors text-sm font-bold uppercase tracking-widest"
                >
                  YouTube - Fox Face
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* LÍNEA FINAL (COPYRIGHT) */}
        <div className="border-t border-gray-800/80 pt-8 flex justify-center md:justify-start">
          <p className="text-gray-600 text-xs font-bold tracking-widest uppercase">
            © {new Date().getFullYear()} Scottish Legends. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
};