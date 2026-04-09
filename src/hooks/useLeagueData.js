import { useState, useEffect } from 'react';
import { getDriverProfile, isLegendDriver } from '../config/driversConfig';

const LEAGUE_URLS = {
  monday: 'https://raw.githubusercontent.com/brulonga/ACC-Scottish-Legends-Leaderboard/refs/heads/main/dashboard_data.json',
  multiclass: 'https://raw.githubusercontent.com/brulonga/ACC-Scottish-Legends-Leaderboard-Multiclass/refs/heads/main/dashboard_data.json'
};

export const useLeagueData = () => {
  const [mondayData, setMondayData] = useState(null);
  const [multiclassData, setMulticlassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [mondayResponse, multiclassResponse] = await Promise.all([
          fetch(LEAGUE_URLS.monday),
          fetch(LEAGUE_URLS.multiclass)
        ]);

        const monday = await mondayResponse.json();
        const multiclass = await multiclassResponse.json();

        setMondayData(monday);
        setMulticlassData(multiclass);
        setError(null);
      } catch (err) {
        setError('Failed to fetch league data');
        console.error('Error fetching league data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 300000); // Actualiza cada 5 mins
    return () => clearInterval(interval);
  }, []);

  const getLeagueData = (type) => {
    return type === 'monday' ? mondayData : multiclassData;
  };

  return {
    mondayData,
    multiclassData,
    loading,
    error,
    getLeagueData
  };
};