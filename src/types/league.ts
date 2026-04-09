export interface DriverStanding {
  position: number;
  driver: string;
  points: number;
  netVsQualy?: number;
  netVsPace?: number;
  avgQualyPos?: number;
  avgQualyGap?: string;
  avgRacePos?: number;
  avgRacePaceGap?: string;
  races: number;
  bestLap?: string;
  incidents?: number;
  [key: string]: string | number | undefined;
}

export interface RoundResult {
  round: number;
  track: string;
  date: string;
  results: DriverStanding[];
}

export interface LeagueData {
  leagueName: string;
  season: string;
  overallStandings: DriverStanding[];
  rounds?: RoundResult[];
  lastUpdated?: string;
}

export type LeagueType = 'monday' | 'multiclass';

export interface CombinedDriverData extends DriverStanding {
  fotoPerfil: string;
  nacionalidad: string;
  equipo: string;
  acronimo: string;
  dorsal: string;
  isLegend: boolean;
}
