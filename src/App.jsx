import { useState } from 'react';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer'; // 🚀 IMPORTAMOS EL FOOTER
import { Home } from './pages/Home';
import { Standings } from './pages/Standings';
import { DriverProfile } from './pages/DriverProfile';
import { HallOfFame } from './pages/HallOfFame';
import { Records } from './pages/Records';
import { Compare } from './pages/Compare';
import { Community } from './pages/Community';
import { AboutUs } from './pages/AboutUs'; // 🚀 IMPORTAMOS LA NUEVA PÁGINA
import { Results } from './pages/Results';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedDriver, setSelectedDriver] = useState(null);

  const handleDriverClick = (driverName) => {
    setSelectedDriver(driverName);
    setCurrentPage('driver-profile');
  };

  const handleBackFromProfile = () => {
    setCurrentPage('standings');
    setSelectedDriver(null);
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
    if (page !== 'driver-profile') {
      setSelectedDriver(null);
    }
    // Sube la pantalla al inicio de forma suave al cambiar de página
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={handleNavigate} />;
      case 'standings':
        return <Standings onDriverClick={handleDriverClick} />;
      case 'driver-profile':
        return selectedDriver ? (
          <DriverProfile driverName={selectedDriver} onBack={handleBackFromProfile} />
        ) : (
          <Standings onDriverClick={handleDriverClick} />
        );
      case 'hall-of-fame':
        return <HallOfFame onDriverClick={handleDriverClick} onNavigate={handleNavigate} />;
      case 'records':
        return <Records onDriverClick={handleDriverClick} />;
      case 'compare':
        return <Compare onNavigate={handleNavigate} />;
      case 'community':
        return <Community onNavigate={handleNavigate} />; // 🚀 AÑADE ESTO
      case 'about-us': // 🚀 AÑADIMOS LA RUTA AL SWITCH
        return <AboutUs />;
      case 'results':
        return <Results onDriverClick={handleDriverClick} />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    // Hemos añadido flex y flex-col para que el Footer siempre se vaya abajo
    <div className="min-h-screen bg-black flex flex-col">
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      
      {/* flex-grow empuja el footer hacia el final aunque la página esté vacía */}
      <main className="flex-grow">
        {renderPage()}
      </main>

      {/* 🚀 EL FOOTER APARECE AQUÍ PARA TODA LA WEB */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default App;