export const getDriverCategories = (drivers) => {
  if (!drivers || drivers.length === 0) return {};

  // 1. Separamos a los pilotos en dos grupos: habituales (>= 2 carreras) y rookies (< 2 carreras)
  const validDrivers = drivers.filter(d => d.races >= 2);
  const rookieDrivers = drivers.filter(d => d.races < 2 || !d.races);

  // 2. Calcular la media de carreras SÓLO de los pilotos válidos
  let totalRaces = 0;
  validDrivers.forEach(d => { totalRaces += d.races; });
  const mediaCarrerasGrid = validDrivers.length > 0 ? (totalRaces / validDrivers.length) : 3;

  // 3. Fórmula del multiplicador de constancia
  let multiplicador = 0.325 - (0.015 * mediaCarrerasGrid);
  multiplicador = Math.max(0.05, Math.min(0.35, multiplicador));

  const categories = {};
  const scoredValidDrivers = [];

  // 4. Calcular el "Performance Score" exclusivamente para los válidos
  validDrivers.forEach(d => {
    const avgPos = parseFloat(d.avg_pos) || 99;
    const avgPace = parseFloat(d.avg_pace_pos) || 99;
    const avgQualy = parseFloat(d.avg_qualy_pos) || 99;

    let baseMean = 99;
    if (avgPos !== 99 && avgPace !== 99 && avgQualy !== 99) {
      baseMean = (avgPos + avgPace + avgQualy) / 3;
    } else if (avgPos !== 99) {
      baseMean = avgPos;
    }

    let internalScore = baseMean;
    
    // Aplicar el ajuste de constancia
    if (baseMean !== 99) {
      const ajuste = (mediaCarrerasGrid - d.races) * multiplicador;
      internalScore = baseMean + ajuste;
    }

    scoredValidDrivers.push({
      name: d.name,
      score: internalScore
    });
  });

  // 5. Ordenar a los pilotos válidos de MEJOR a PEOR
  scoredValidDrivers.sort((a, b) => a.score - b.score);

  const totalValid = scoredValidDrivers.length || 1;

  // 6. Repartir licencias, posiciones esperadas enteras y COLORES
  scoredValidDrivers.forEach((d, index) => {
    let catName = '';
    let colorClass = '';
    
    const pct = index / totalValid;
    
    if (pct < 0.15) {
      catName = 'PLATINUM';
      colorClass = 'bg-emerald-500';
    } else if (pct < 0.40) {
      catName = 'GOLD';
      colorClass = 'bg-yellow-500';
    } else if (pct < 0.75) {
      catName = 'SILVER';
      colorClass = 'bg-gray-300';
    } else {
      catName = 'BRONZE';
      colorClass = 'bg-amber-600';
    }

    categories[d.name] = {
      name: catName,
      expectedPos: index + 1,
      rank: index + 1,
      color: colorClass
    };
  });

  // 7. Procesar a los Rookies (no afectan a la media ni al ranking de expectedPos)
  rookieDrivers.forEach(d => {
    categories[d.name] = {
      name: 'ROOKIE',
      expectedPos: 999,
      rank: 999,
      color: 'bg-red-600'
    };
  });

  return categories;
};