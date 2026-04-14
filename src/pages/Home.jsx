import { Calendar, Trophy, Play, Users, ChevronRight, Video, MonitorPlay } from 'lucide-react';
import { useState, useEffect } from 'react';
import heroBg from '../assets/fondo.png'; 

// ⚙️ PANEL DE CONFIGURACIÓN RÁPIDA
const HOME_CONFIG = {
  tutorialVideoId: "f9OuVgCZS-o", 

  mondayRace: {
    track: "Paul Ricard",
    dateIso: "2026-04-20T22:00:00+02:00", 
    details: "20 Min Qualy • 1.5h Race"
  },
  
  fridayRace: {
    track: "Nordschleife",
    dateIso: "2026-04-17T20:00:00+02:00",
    details: "20 Min Qualy • 1h Race"
  },

  featuredChannels: [
    {
      name: "The Rookie Driver",
      description: "LFM Racing Content",
      url: "https://www.youtube.com/@TheRookieDriver-LFM",
      bgImage: "/assets/yt/fondo_yt.png",
      avatar: "/assets/yt/rookie_driver_avatar.jpg" 
    },
    {
      name: "Fox Face Racing",
      description: "Championship Highlights",
      url: "https://www.youtube.com/@foxfaceracing",
      bgImage: "/assets/yt/youtube_banner_fox.jpg",
      avatar: "/assets/yt/youtube_avatar_fox.jpg" 
    }
  ]
};

const calculateTimeLeft = (targetIsoStr) => {
  const targetDate = new Date(targetIsoStr).getTime();
  const now = new Date().getTime();
  const distance = targetDate - now;

  if (distance <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((distance % (1000 * 60)) / 1000)
  };
};

// 🚀 AQUÍ ESTÁ EL CAMBIO: Le pasamos onNavigate
export const Home = ({ onNavigate }) => {
  const [mondayTime, setMondayTime] = useState(calculateTimeLeft(HOME_CONFIG.mondayRace.dateIso));
  const [fridayTime, setFridayTime] = useState(calculateTimeLeft(HOME_CONFIG.fridayRace.dateIso));

  useEffect(() => {
    const timer = setInterval(() => {
      setMondayTime(calculateTimeLeft(HOME_CONFIG.mondayRace.dateIso));
      setFridayTime(calculateTimeLeft(HOME_CONFIG.fridayRace.dateIso));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const TimerBox = ({ label, value }) => (
    <div className="bg-black border border-gray-800 p-2 md:p-4 text-center transform skew-x-[-5deg] shadow-inner">
      <div className="transform skew-x-5">
        <div className="font-['Teko'] text-4xl md:text-5xl font-bold text-yellow-400 mb-0 leading-none drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]">
          {value.toString().padStart(2, '0')}
        </div>
        <div className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">{label}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black font-['Inter'] text-gray-300">
      
      {/* HERO SECTION */}
      <div
        className="relative h-[650px] flex items-center justify-center overflow-hidden border-b-4 border-yellow-500 shadow-[0_10px_30px_rgba(250,204,21,0.2)]"
        style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black"></div>

        <div className="relative z-10 text-center px-4 mt-16">
          <h1 className="font-['Teko'] text-7xl md:text-9xl font-bold text-white mb-2 tracking-wide uppercase italic transform -skew-x-6 drop-shadow-2xl">
            Scottish <span className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]">Legends</span>
          </h1>
          <p className="text-lg md:text-2xl text-gray-400 mb-10 max-w-2xl mx-auto uppercase tracking-[0.2em] font-semibold">
            Where Champions Are Forged on the Track
          </p>
          
          {/* 🚀 BOTÓN MODIFICADO PARA IR A COMMUNITY */}
          <button
            onClick={() => onNavigate('community')}
            className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-black transition-all duration-200 bg-yellow-400 font-['Teko'] text-3xl tracking-widest uppercase transform -skew-x-12 hover:bg-yellow-300 hover:scale-105 shadow-[0_0_20px_rgba(250,204,21,0.4)] cursor-pointer"
          >
            <div className="flex items-center space-x-3 transform skew-x-12">
              <Users className="w-7 h-7" />
              <span className="mt-1">Join Our Community</span>
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16 space-y-24">
        
        {/* VÍDEO EXPLICATIVO
        <div className="bg-[#0a0a0a] border border-gray-800 p-6 md:p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50"></div>
          
          <div className="flex items-center justify-center space-x-3 mb-8">
            <Video className="w-8 h-8 text-yellow-400" />
            <h2 className="font-['Teko'] text-4xl md:text-5xl font-bold text-white uppercase tracking-wide text-center">How It Works</h2>
          </div>
          
          <div className="relative w-full max-w-4xl mx-auto aspect-video border-2 border-gray-800 shadow-[0_0_30px_rgba(0,0,0,0.8)] rounded-sm overflow-hidden bg-black">
            <iframe 
              src={`https://www.youtube.com/embed/${HOME_CONFIG.tutorialVideoId}`}
              title="Scottish Legends Tutorial"
              className="absolute top-0 left-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
        </div> */}
        
        {/* PRÓXIMAS CARRERAS */}
        <div>
          <div className="flex items-center space-x-3 mb-8">
            <Calendar className="w-8 h-8 text-yellow-400" />
            <h2 className="font-['Teko'] text-4xl md:text-5xl font-bold text-white uppercase tracking-wide">Upcoming Events</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-[#0a0a0a] border border-blue-500/30 p-6 md:p-8 relative overflow-hidden group hover:border-blue-500/60 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>
              <div className="mb-6">
                <h3 className="font-['Teko'] text-white text-3xl md:text-4xl tracking-wide uppercase italic">Monday Marathon</h3>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2">
                  <span className="text-blue-400 font-bold uppercase tracking-widest text-lg md:text-xl font-['Teko']">📍 {HOME_CONFIG.mondayRace.track}</span>
                  <span className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1 sm:mt-0">{HOME_CONFIG.mondayRace.details}</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 md:gap-4">
                <TimerBox label="Days" value={mondayTime.days} />
                <TimerBox label="Hours" value={mondayTime.hours} />
                <TimerBox label="Mins" value={mondayTime.minutes} />
                <TimerBox label="Secs" value={mondayTime.seconds} />
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-orange-500/30 p-6 md:p-8 relative overflow-hidden group hover:border-orange-500/60 transition-colors shadow-[0_0_15px_rgba(249,115,22,0.1)]">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500"></div>
              <div className="mb-6">
                <h3 className="font-['Teko'] text-white text-3xl md:text-4xl tracking-wide uppercase italic">Multiclass Friday</h3>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2">
                  <span className="text-orange-400 font-bold uppercase tracking-widest text-lg md:text-xl font-['Teko']">📍 {HOME_CONFIG.fridayRace.track}</span>
                  <span className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1 sm:mt-0">{HOME_CONFIG.fridayRace.details}</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 md:gap-4">
                <TimerBox label="Days" value={fridayTime.days} />
                <TimerBox label="Hours" value={fridayTime.hours} />
                <TimerBox label="Mins" value={fridayTime.minutes} />
                <TimerBox label="Secs" value={fridayTime.seconds} />
              </div>
            </div>
          </div>
        </div>

        {/* CANALES DE YOUTUBE */}
        <div>
          <div className="flex items-center space-x-3 mb-8">
            <MonitorPlay className="w-8 h-8 text-red-500" />
            <h2 className="font-['Teko'] text-4xl md:text-5xl font-bold text-white uppercase tracking-wide">Featured Content</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {HOME_CONFIG.featuredChannels.map((channel, idx) => (
              <a
                key={idx}
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-[#0a0a0a] overflow-hidden border border-gray-800 hover:border-red-500 transition-all duration-300 relative block"
              >
                <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/10 transition-colors z-10 pointer-events-none"></div>
                <div
                  className="h-64 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-700 relative"
                  style={{ backgroundImage: `url(${channel.bgImage})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 w-full p-6 flex items-end space-x-4 z-20">
                    {channel.avatar && (
                      <div className="shrink-0 transform group-hover:-translate-y-2 transition-transform duration-300">
                        <img 
                          src={channel.avatar} 
                          alt={channel.name} 
                          className="w-16 h-16 rounded-full border-2 border-red-500 object-cover shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-['Teko'] text-3xl font-bold text-white mb-0 uppercase tracking-wide group-hover:text-red-400 transition-colors leading-tight">
                        {channel.name}
                      </h3>
                      <p className="text-gray-400 text-xs md:text-sm uppercase tracking-widest font-bold mt-1">
                        {channel.description}
                      </p>
                    </div>
                    <div className="shrink-0 bg-red-600 p-2 rounded-full transform translate-x-10 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 shadow-lg">
                      <Play className="w-4 h-4 text-white fill-current" />
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* TARJETAS INFERIORES */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-[#0a0a0a] border border-gray-800 p-8 hover:border-yellow-400 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-4 left-4"><Trophy className="w-8 h-8 text-yellow-500 opacity-20 group-hover:opacity-100 transition-opacity" /></div>
            <div className="mt-8 text-center">
              <h3 className="font-['Teko'] text-3xl font-bold text-white mb-2 uppercase tracking-wide">Two Championships</h3>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-6">Select to view standings</p>
              <div className="space-y-4">
                <button onClick={() => onNavigate('standings')} className="block w-full">
                  <div className="bg-black border border-gray-700 hover:border-blue-500 p-3 transition-all duration-300 shadow-[0_0_10px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] cursor-pointer transform -skew-x-6">
                    <span className="font-['Teko'] font-bold text-blue-400 text-xl tracking-widest transform skew-x-6 block">MONDAY'S MARATHON</span>
                  </div>
                </button>
                <button onClick={() => onNavigate('standings')} className="block w-full">
                  <div className="bg-black border border-gray-700 hover:border-orange-500 p-3 transition-all duration-300 shadow-[0_0_10px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(249,115,22,0.2)] cursor-pointer transform -skew-x-6">
                    <span className="font-['Teko'] font-bold text-orange-400 text-xl tracking-widest transform skew-x-6 block">MULTICLASS FRIDAY</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-gray-800 p-8 hover:border-yellow-400 transition-all duration-300 flex flex-col items-center justify-center text-center">
            <Users className="w-12 h-12 text-yellow-400 mb-4" />
            <h3 className="font-['Teko'] text-3xl font-bold text-white mb-4 uppercase tracking-wide">Active Community</h3>
            <div className="inline-flex items-center space-x-2 bg-black px-4 py-2 border border-gray-800 mb-6">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
              <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">+250 Members</span>
            </div>
            
            {/* 🚀 BOTÓN MODIFICADO PARA IR A COMMUNITY */}
            <button 
              onClick={() => onNavigate('community')}
              className="w-full py-3 px-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg transform -skew-x-6 cursor-pointer"
            >
              <div className="flex items-center space-x-2 transform skew-x-6">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 127.14 96.36"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a67.62,67.62,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.12,53,91.08,65.69,84.69,65.69Z"/></svg>
                <span className="font-['Teko'] text-xl tracking-wider uppercase mt-1">Join Community</span>
              </div>
            </button>
          </div>

          <div className="bg-[#0a0a0a] border border-gray-800 p-8 hover:border-red-500 transition-all duration-300 flex flex-col items-center justify-center text-center group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-red-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 relative z-10">Search for</h3>
            <h4 className="font-['Teko'] text-3xl font-bold text-yellow-400 mb-8 uppercase tracking-wide relative z-10">"Scottish Legends"</h4>
            <div className="bg-black border-2 border-red-600 px-6 py-3 transform -skew-x-12 shadow-[0_0_15px_rgba(220,38,38,0.3)] group-hover:shadow-[0_0_25px_rgba(220,38,38,0.6)] transition-all relative z-10">
              <span className="text-white font-['Teko'] font-bold text-5xl tracking-widest transform skew-x-12 block drop-shadow-md pr-2">ACC</span>
            </div>
            <div className="mt-4 text-[10px] text-gray-500 font-bold tracking-[0.2em] uppercase relative z-10">Assetto Corsa Competizione</div>
          </div>
        </div>

      </div>
    </div>
  );
};