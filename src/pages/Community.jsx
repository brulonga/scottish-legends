import { ShieldCheck, Sword, Users, Vote, FileText, MessageCircle, Mail } from 'lucide-react';

export const Community = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-black font-['Inter'] text-gray-300 py-8">
      <div className="max-w-[1536px] mx-auto px-4">
        
        {/* CABECERA */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center space-x-2 border border-yellow-500/30 px-6 py-2 rounded-full mb-6 bg-yellow-500/10">
            <Users className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest">Join The Clan</span>
          </div>
          <h1 className="font-['Teko'] text-7xl md:text-9xl font-bold text-white mb-4 uppercase tracking-wide drop-shadow-lg">
            Our <span className="text-yellow-400">Community</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto uppercase tracking-widest font-medium">
            Where speed meets brotherhood. And kilts.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 📜 COLUMNA IZQUIERDA: REGLAS Y ADMINS */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* REGLAS */}
            <div className="bg-[#0a0a0a] border border-gray-800 p-8 md:p-12 shadow-2xl relative overflow-hidden group hover:border-yellow-500/50 transition-colors">
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-yellow-400"></div>
              
              <div className="flex items-center space-x-3 mb-8 border-b border-gray-800 pb-6">
                <ShieldCheck className="w-10 h-10 text-yellow-400" />
                <div>
                  <h2 className="font-['Teko'] text-4xl md:text-5xl font-bold text-white uppercase tracking-wide leading-none">The Rules</h2>
                  <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mt-1">No one likes them - but we need them.</p>
                </div>
              </div>

              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 text-lg font-medium mb-6 italic">
                  This is what is expected of our members:
                </p>
                <ul className="space-y-4 text-gray-400 font-medium">
                  <li className="flex items-start">
                    <Sword className="w-5 h-5 text-yellow-500 mr-3 shrink-0 mt-0.5" />
                    <span>No flaming / griefing.</span>
                  </li>
                  <li className="flex items-start">
                    <Sword className="w-5 h-5 text-yellow-500 mr-3 shrink-0 mt-0.5" />
                    <span>Drive with consideration for others.</span>
                  </li>
                  <li className="flex items-start">
                    <Sword className="w-5 h-5 text-yellow-500 mr-3 shrink-0 mt-0.5" />
                    <span>Obey flags.</span>
                  </li>
                  <li className="flex items-start">
                    <Sword className="w-5 h-5 text-yellow-500 mr-3 shrink-0 mt-0.5" />
                    <span>Have a thorough understanding of Scottish history and literature.</span>
                  </li>
                  <li className="flex items-start">
                    <Sword className="w-5 h-5 text-yellow-500 mr-3 shrink-0 mt-0.5" />
                    <span>Respect. Respect others and maybe even yourself.</span>
                  </li>
                  <li className="flex items-start">
                    <Sword className="w-5 h-5 text-yellow-500 mr-3 shrink-0 mt-0.5" />
                    <span>Avoid spamming the chat during races. It can be used but try to be considerate of people racing.</span>
                  </li>
                  <li className="flex items-start">
                    <Sword className="w-5 h-5 text-yellow-500 mr-3 shrink-0 mt-0.5" />
                    <span>Watch Braveheart with your family at least once every 5 months. Be able to quote the late, great William Wallace's iconic real-life war speech.</span>
                  </li>
                  <li className="flex items-start">
                    <Sword className="w-5 h-5 text-yellow-500 mr-3 shrink-0 mt-0.5" />
                    <span>Understand basic Spanish.</span>
                  </li>
                  <li className="flex items-start">
                    <Sword className="w-5 h-5 text-yellow-500 mr-3 shrink-0 mt-0.5" />
                    <span>Be prepared to wear a kilt at our biannual gatherings.</span>
                  </li>
                </ul>
                <div className="mt-8 pt-6 border-t border-gray-800">
                  <p className="text-yellow-500/80 font-bold uppercase tracking-widest text-sm text-center">
                    That's about it, everyone is at least pretending to be an adult so let's assume we will all, mostly, act like one.
                  </p>
                </div>
              </div>
            </div>

            {/* ADMINS */}
            <div className="bg-[#0a0a0a] border border-gray-800 p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between">
              <div>
                <h3 className="font-['Teko'] text-3xl font-bold text-white uppercase tracking-wide mb-1">League Administrators</h3>
                <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">Contact them for any official league issues.</p>
              </div>
              <div className="flex space-x-4 mt-6 md:mt-0">
                <div className="bg-black border border-yellow-500/30 px-6 py-3 transform -skew-x-6 shadow-[0_0_15px_rgba(250,204,21,0.1)]">
                  <span className="font-['Teko'] text-2xl text-yellow-400 font-bold uppercase tracking-wider transform skew-x-6 block">Marty Fox</span>
                </div>
                <div className="bg-black border border-yellow-500/30 px-6 py-3 transform -skew-x-6 shadow-[0_0_15px_rgba(250,204,21,0.1)]">
                  <span className="font-['Teko'] text-2xl text-yellow-400 font-bold uppercase tracking-wider transform skew-x-6 block">Raymond Crawford</span>
                </div>
              </div>
            </div>

          </div>

          {/* 💬 COLUMNA DERECHA */}
          <div className="space-y-8">
            
            {/* BOTÓN DISCORD */}
            <div className="bg-[#0a0a0a] border border-[#5865F2]/50 p-8 shadow-[0_0_30px_rgba(88,101,242,0.15)] text-center group hover:border-[#5865F2] transition-colors">
              <MessageCircle className="w-16 h-16 text-[#5865F2] mx-auto mb-6 group-hover:scale-110 transition-transform" />
              <h2 className="font-['Teko'] text-4xl font-bold text-white uppercase tracking-wide mb-2">Join The Discord</h2>
              <p className="text-gray-400 text-sm font-medium mb-8">This is where the magic happens. Voice channels, race coordination, and daily banter.</p>
              <a
                href="https://discord.gg/MEcjZPJx"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-4 px-6 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold uppercase tracking-widest transition-all duration-200 shadow-lg transform -skew-x-6"
              >
                <span className="block transform skew-x-6">Connect Now</span>
              </a>
            </div>

            {/* VENTAJAS DISCORD */}
            <div className="bg-[#0a0a0a] border border-gray-800 p-6 shadow-2xl">
              <h3 className="font-['Teko'] text-2xl font-bold text-white uppercase tracking-wide mb-4 border-b border-gray-800 pb-2">Discord Member Perks</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <FileText className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
                  <span className="text-sm text-gray-300">Gain exclusive access to the official <strong>Entrylist</strong> for all server events.</span>
                </li>
                <li className="flex items-start">
                  <Vote className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                  <span className="text-sm text-gray-300"><strong>Vote weekly</strong> on which tracks we race next in the championships.</span>
                </li>
              </ul>
            </div>

            {/* 🚀 NUEVO: GET IN TOUCH */}
            <div className="bg-[#0a0a0a] border border-gray-800 p-8 shadow-2xl text-center group hover:border-yellow-500/30 transition-colors">
              <Mail className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="font-['Teko'] text-3xl font-bold text-white uppercase tracking-wide mb-2">Get In Touch!</h3>
              <p className="text-gray-400 text-sm mb-8 font-medium leading-relaxed">
                Need help, have a question, or want to report an on-track incident? Reach out to our admin team directly.
              </p>
              
              {/* Botón que lleva a About Us */}
              <button
                onClick={() => onNavigate && onNavigate('about-us')}
                className="w-full py-3 px-4 bg-transparent border-2 border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black font-bold uppercase tracking-widest transition-all duration-200 transform -skew-x-6"
              >
                <span className="block transform skew-x-6">Go to About Us</span>
              </button>
              
              <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mt-4">
                Visit the About Us page to message us privately on Discord.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};