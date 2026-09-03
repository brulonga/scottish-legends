export const getDriverCategories = (drivers) => {
  if (!drivers || drivers.length === 0) return {};

  // 1. Filtrar pilotos válidos y ordenar de MAYOR a MENOR ELO
  const sortedDrivers = [...drivers]
    .map(d => ({ ...d, elo: parseFloat(d.elo) || 0 }))
    .sort((a, b) => b.elo - a.elo);

  const totalDrivers = sortedDrivers.length;
  const categories = {};

  // 2. Asignación de categorías por percentiles de ELO
  sortedDrivers.forEach((d, index) => {
    let catName = '';
    let colorClass = '';

    // pct va de 0.0 (mejor ELO) a 1.0 (peor ELO)
    const pct = index / totalDrivers;

    if (pct < 0.10) {
      catName = 'PLATINUM';
      colorClass = 'bg-emerald-500';
    } else if (pct < 0.25) {
      catName = 'GOLD';
      colorClass = 'bg-yellow-500';
    } else if (pct < 0.65) {
      catName = 'SILVER';
      colorClass = 'bg-gray-300';
    } else if (pct < 0.90) {
      catName = 'BRONZE';
      colorClass = 'bg-amber-600';
    } else {
      // 10% inferior (menor ELO)
      catName = 'ROOKIE';
      colorClass = 'bg-red-600';
    }

    categories[d.name] = {
      name: catName,
      expectedPos: index + 1,
      rank: index + 1,
      color: colorClass,
      elo: d.elo
    };
  });

  return categories;
};