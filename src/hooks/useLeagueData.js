import { useState, useEffect } from 'react';

// 🚀 RUTAS A TUS ARCHIVOS LOCALES
const LEAGUE_FILES = {
  monday_marathon: ['season_1'], // Añade aquí 'season_2', etc. cuando existan
  fun_friday: ['season_1', 'season_2'] 
};

export const useLeagueData = (leagueId, seasonId) => {
  const [leagueData, setLeagueData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allLeaguesData, setAllLeaguesData] = useState([]); // Nuevo estado para los récords

  // 1. Efecto para cargar UNA liga/temporada (para Standings, Results, Profile)
  useEffect(() => {
    if (!leagueId || !seasonId) {
      setLeagueData(null);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/data/${leagueId}/${seasonId}.json`);
        
        if (!response.ok) throw new Error('Datos de esta temporada aún no disponibles.');

        const data = await response.json();
        setLeagueData(data);
      } catch (err) {
        setError(err.message);
        setLeagueData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [leagueId, seasonId]); 

  // 2. 🚀 Efecto para cargar TODAS las ligas y temporadas (Para los Récords globales)
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const fetchPromises = [];
        
        // Iteramos sobre nuestra configuración de archivos y creamos una promesa por cada uno
        Object.entries(LEAGUE_FILES).forEach(([league, seasons]) => {
          seasons.forEach(season => {
            fetchPromises.push(
              fetch(`/data/${league}/${season}.json`)
                .then(res => res.ok ? res.json() : null)
                .catch(() => null)
            );
          });
        });

        // Esperamos a que se descarguen todos los archivos JSON
        const results = await Promise.all(fetchPromises);
        
        // Filtramos los nulos (archivos que fallaron o no existen aún)
        setAllLeaguesData(results.filter(data => data !== null));
      } catch (err) {
        console.error("Error cargando los datos globales para récords:", err);
      }
    };

    fetchAllData();
  }, []);

  return { leagueData, allLeaguesData, loading, error };
};