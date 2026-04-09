import { ShieldCheck, Target, MessageSquare, Wrench, BarChart2, Crown } from 'lucide-react';
import { getDriverProfile } from '../config/driversConfig';

export const AboutUs = () => {
  // Obtenemos los perfiles para extraer los avatares (asegúrate de que los nombres coinciden con tu driversConfig.js)
  const raymondProfile = getDriverProfile("Raymond Crawford");
  const martyProfile = getDriverProfile("Marty Fox");
  const brunoProfile = getDriverProfile("Bruno Longarela");

  return (
    <div className="min-h-screen bg-black font-['Inter'] text-gray-300 py-16">
      <div className="max-w-[1200px] mx-auto px-4">
        
        {/* CABECERA */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center space-x-2 border border-yellow-500/30 px-6 py-2 rounded-full mb-6 bg-yellow-500/10">
            <ShieldCheck className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest">The Core Team</span>
          </div>
          <h1 className="font-['Teko'] text-7xl md:text-9xl font-bold text-white mb-4 uppercase tracking-wide drop-shadow-lg">
            About <span className="text-yellow-400">Us</span>
          </h1>
        </div>

        {/* 🚀 NUESTRA FILOSOFÍA */}
        <div className="bg-[#0a0a0a] border border-gray-800 p-8 md:p-12 shadow-2xl relative overflow-hidden mb-16 group hover:border-yellow-500/30 transition-colors">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50"></div>
          
          <div className="flex items-center space-x-4 mb-6 border-b border-gray-800 pb-6">
            <Target className="w-10 h-10 text-yellow-400" />
            <h2 className="font-['Teko'] text-4xl md:text-5xl font-bold text-white uppercase tracking-wide leading-none">Our Vision</h2>
          </div>
          
          <div className="space-y-6 text-gray-300 text-lg md:text-xl leading-relaxed font-medium">
            <p>
              <strong className="text-white">Scottish Legends</strong> is an open-entry Assetto Corsa Competizione league where new drivers take to the track every single week. 
            </p>
            <p>
              We created this community to hit the perfect sweet spot in sim racing: providing a <strong className="text-yellow-400">highly respectful and structured racing environment</strong> that leaves the chaos of open lobbies behind, but without the overwhelming pressure and strictness of hardcore pro leagues like LFM. 
            </p>
            <p>
              Beyond our weekly championships, we are a deeply active community. We host private events, facilitate constructive post-race incident debates, and most importantly, we share a genuine passion for clean racing.
            </p>
          </div>
        </div>

        {/* 👔 EL STAFF */}
        <div className="mb-8">
          <h2 className="font-['Teko'] text-5xl font-bold text-white uppercase tracking-wide text-center mb-10">Meet The Staff</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* RAYMOND (CEO) */}
            <div className="bg-black border border-gray-800 p-8 shadow-2xl relative group hover:border-yellow-500/50 transition-all duration-300 transform hover:-translate-y-1 flex flex-col">
              <div className="absolute top-4 right-4 text-yellow-500 opacity-50 group-hover:opacity-100 transition-opacity">
                <Crown className="w-8 h-8" />
              </div>
              <div className="mt-4 flex-grow">
                <div className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-2">CEO & Founder</div>
                
                <div className="flex items-center space-x-3 mb-6">
                  {raymondProfile?.avatar && (
                    <img src={raymondProfile.avatar} alt="Raymond Avatar" className="w-12 h-12 rounded-full border border-gray-700 object-cover" />
                  )}
                  <h3 className="font-['Teko'] text-4xl font-bold text-white uppercase tracking-wide leading-none">Raymond Crawford</h3>
                </div>
              </div>
              <div className="flex items-center space-x-3 bg-[#0a0a0a] border border-gray-800 p-3 mt-auto">
                <MessageSquare className="w-5 h-5 text-[#5865F2]" />
                <span className="font-mono text-gray-300 text-sm">@pukpuk84</span>
              </div>
            </div>

            {/* MARTY (VICE-PRESIDENT) */}
            <div className="bg-black border border-gray-800 p-8 shadow-2xl relative group hover:border-yellow-500/50 transition-all duration-300 transform hover:-translate-y-1 flex flex-col">
              <div className="absolute top-4 right-4 text-gray-500 opacity-50 group-hover:opacity-100 transition-opacity">
                <Wrench className="w-8 h-8" />
              </div>
              <div className="mt-4 flex-grow">
                <div className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-2">Vice-President</div>
                
                <div className="flex items-center space-x-3 mb-2">
                  {martyProfile?.avatar && (
                    <img src={martyProfile.avatar} alt="Marty Avatar" className="w-12 h-12 rounded-full border border-gray-700 object-cover" />
                  )}
                  <h3 className="font-['Teko'] text-4xl font-bold text-white uppercase tracking-wide leading-none">Marty Fox</h3>
                </div>
                <p className="text-gray-500 text-sm italic mb-6">"The wannabe mechanic"</p>
              </div>
              <div className="flex items-center space-x-3 bg-[#0a0a0a] border border-gray-800 p-3 mt-auto">
                <MessageSquare className="w-5 h-5 text-[#5865F2]" />
                <span className="font-mono text-gray-300 text-sm">@foxface_marty</span>
              </div>
            </div>

            {/* BRUNO (DATA GUY) */}
            <div className="bg-black border border-gray-800 p-8 shadow-2xl relative group hover:border-yellow-500/50 transition-all duration-300 transform hover:-translate-y-1 flex flex-col">
              <div className="absolute top-4 right-4 text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity">
                <BarChart2 className="w-8 h-8" />
              </div>
              <div className="mt-4 flex-grow">
                <div className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-2">The Data Guy</div>
                
                <div className="flex items-center space-x-3 mb-6">
                  {brunoProfile?.avatar && (
                    <img src={brunoProfile.avatar} alt="Bruno Avatar" className="w-12 h-12 rounded-full border border-gray-700 object-cover" />
                  )}
                  <h3 className="font-['Teko'] text-4xl font-bold text-white uppercase tracking-wide leading-none">Bruno Longarela</h3>
                </div>
              </div>
              <div className="flex items-center space-x-3 bg-[#0a0a0a] border border-gray-800 p-3 mt-auto">
                <MessageSquare className="w-5 h-5 text-[#5865F2]" />
                <span className="font-mono text-gray-300 text-sm">@lilbru7157</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};