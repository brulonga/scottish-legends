// src/config/driversConfig.js

// 🏆 LISTA DE LEYENDAS
export const LEGEND_DRIVERS = [
  "Bruno Longarela",
  "Dominic [LZRT] Zimmermann",
  "Marsi Bella [RRT]", 
  "Raymond Crawford [SL]",
  "Czech Blackness [SL]",
  "Gael Duchêne ESP [SL]",
  "Tommy Williamson",
  "Kevin Kerp",
  "Alan Mcleod",
  "Cla Rens", 
  "KeVin peeters",
  "Micha Nieuwkoop",
  "Tanno Raayman",
  "Luna Lethil",
  "Marty Fox",
  "Luca Maggiolo",
];

// 🚩 EL TRADUCTOR MÁGICO DE BANDERAS
const getFlagEmoji = (countryCode) => {
  if (!countryCode) return "🌍"; 
  
  // 🚀 EXCEPCIÓN ESPECIAL PARA ESCOCIA (Usando su código informático puro)
  if (countryCode === "SCO") {
    return "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}";
  }

  if (countryCode.length !== 2) return "🌍";
  
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
    
  return String.fromCodePoint(...codePoints);
};
// 👤 INFORMACIÓN MANUAL DE LOS PILOTOS
// ¡AQUÍ AHORA SOLO TIENES QUE PONER LAS 2 LETRAS!
// 👤 INFORMACIÓN MANUAL DE LOS PILOTOS
export const DRIVER_PROFILES = {
  "Marsi Bella [RRT]": {
    nacionalidad: "DE",
    equipo: "Rookie Racing Team",
    siglas: "BLA",
    dorsal: "64",
  },
  "Tommy Williamson": {
    nacionalidad: "GB",
    equipo: "Aston Martin Racing",
    siglas: "TJW",
    dorsal: "62",
  },
  "Seth Lindenhols": {
    nacionalidad: "NL",
    equipo: "ROAT",
    siglas: "LND",
    dorsal: "74",
  },
  "Antoni Mencik": {
    nacionalidad: "CZ",
    equipo: "Eminem",
    siglas: "MEN",
    dorsal: "56",
  },
  "Dominic [LZRT] Zimmermann": {
    nacionalidad: "DE",
    equipo: "Lizard Racing Team",
    siglas: "ZIM",
    dorsal: "950",
  },
  "Cla Rens": {
    nacionalidad: "DE",
    equipo: "Scottish Legends",
    siglas: "JCL",
    dorsal: "7",
  },
  "Micha Nieuwkoop": {
    nacionalidad: "NL",
    equipo: "SimRacingHub.nl E-Sports",
    siglas: "MNI",
    dorsal: "88",
  },
  "Matt Rigby": {
    nacionalidad: "GB",
    equipo: "MnN Racing",
    siglas: "MDR",
    dorsal: "69",
  },
  "Tanno Raayman": {
    nacionalidad: "NL",
    equipo: "Velocity Race team",
    siglas: "TSR",
    dorsal: "995",
  },
  "Nick [LZRT] ICE": {
    nacionalidad: "SE", // Suecia
    equipo: "Lizard Racing Team",
    siglas: "ICE",
    dorsal: "83",
  },
  "alex küch": {
    nacionalidad: "DE",
    equipo: "Leflikz",
    siglas: "ALE",
    dorsal: "251",
  },
  "Czech Blackness [SL]": {
    nacionalidad: "CZ",
    equipo: "Czech Motorsports",
    siglas: "KOS",
    dorsal: "30",
  },
  "Bruno Longarela": {
    nacionalidad: "ES",
    equipo: "Scottish Legends",
    siglas: "BLF",
    dorsal: "3",
    avatar: "/assets/avatar/avatar_bruno.png",
  },
  "Raymond Crawford [SL]": {
    nacionalidad: "SCO", 
    equipo: "Scottish Legends",
    siglas: "RAY",
    dorsal: "52",
  },
  "Marty Fox": {
    nacionalidad: "SCO", 
    equipo: "Velocity Race Team",
    siglas: "FOX",
    dorsal: "27",
  },
  "Luca Maggiolo": {
    nacionalidad: "IT",
    equipo: "Maggio",
    siglas: "MAG",
    dorsal: "40",
  },
  "Vis Nalu": {
    nacionalidad: "DE",
    equipo: "Danube Apex Predators",
    siglas: "NAL",
    dorsal: "222",
  },
  "Wesley Oakes": {
    nacionalidad: "GB",
    equipo: "Oakes Racing",
    siglas: "WXO",
    dorsal: "999",
  },
  "Kevin Kerp": {
    nacionalidad: "NL",
    equipo: "Kerpstone Racing",
    siglas: "KKP",
    dorsal: "777",
  },
  "Mike Weber [RRT]": {
    nacionalidad: "DE",
    equipo: "Rookie Racing Team",
    siglas: "MWE",
    dorsal: "89",
  },
  "Sebastian Franken": {
    nacionalidad: "DE",
    equipo: "Danube Apex Predators",
    siglas: "SFR",
    dorsal: "42",
  },
  "Gael Duchêne ESP [SL]": {
    nacionalidad: "ES",
    equipo: "gdgcars",
    avatar: "assets/avatar/avatar_gael.png",
    siglas: "GDG",
    dorsal: "14",
  },
  "Stefan Kailuweit": {
    nacionalidad: "DE",
    equipo: "Danube Apex Predators",
    siglas: "SKA",
    dorsal: "333",
  },
  "Aaron Hussain": {
    nacionalidad: "GB",
    equipo: "AHU",
    siglas: "AHU",
    dorsal: "26",
  },
  "Kai Weber": {
    nacionalidad: "DE",
    equipo: "Rookie Racing Team",
    siglas: "WEK",
    dorsal: "24",
  },
  "Max Haupt": {
    nacionalidad: "DE",
    equipo: "Rookie Racing team",
    siglas: "HAU",
    dorsal: "557",
  },
  "Marco Heldt": {
    nacionalidad: "DE",
    equipo: "Rookie Racing Team",
    siglas: "HEL",
    dorsal: "33",
  },
  "Luna Lethil": {
    nacionalidad: "DE",
    equipo: "Fullmoon Racing",
    avatar:"assets/avatar/avatar_luna.png",
    siglas: "LLE",
    dorsal: "26",
  }
};

// ---------------------------------------------------------
// ⚙️ FUNCIONES INTERNAS DE LA WEB 
// ---------------------------------------------------------

export const isLegendDriver = (driverName) => {
  return LEGEND_DRIVERS.includes(driverName);
};

// Cuando la web pide los datos del piloto, esta función intercepta el país y lo convierte a bandera
export const getDriverProfile = (driverName) => {
  const profile = DRIVER_PROFILES[driverName];
  
  if (profile) {
    return {
      ...profile,
      nacionalidad: getFlagEmoji(profile.nacionalidad) // ← ¡Aquí ocurre la magia!
    };
  }

  // Datos por defecto si el piloto no está en la lista de arriba
  return {
    nacionalidad: "🌍",
    equipo: "Piloto Privado",
    dorsal: "00",
  };
};