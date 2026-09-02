import os
import json
import glob
import re
from collections import defaultdict

# --- CONFIGURACIÓN ---
INPUT_DIRS = [
    "public/data/monday_marathon", 
    "public/data/fun_friday"
]
OUTPUT_FILE = "public/data/elo/driver_elos.json"

STARTING_ELO = 1500
K_FACTOR = 3 

def normalize_name(raw_name):
    """
    BLINDAJE 1: Normalización agresiva de nombres.
    Elimina etiquetas de equipo para no duplicar pilotos.
    Ej: "Marsi Bella [SL]" -> "Marsi Bella"
    """
    if not raw_name: return "Unknown"
    # Elimina contenido entre corchetes [], paréntesis () y detrás de un |
    name = re.sub(r'\[.*?\]|\(.*?\)|\|.*', '', raw_name)
    # Limpia espacios extra y normaliza a formato Título
    return re.sub(r'\s+', ' ', name).strip().title()

def extract_races_recursively(node):
    """
    BLINDAJE 2: Búsqueda recursiva. Encuentra carreras sin importar
    cuántos niveles de profundidad tenga el JSON de la liga.
    """
    races = []
    if isinstance(node, dict):
        if "results" in node and isinstance(node["results"], list) and len(node["results"]) > 0:
            if "timestamp" in node and isinstance(node["timestamp"], (int, float)) and node["timestamp"] > 0:
                races.append(node)
        for key, value in node.items():
            races.extend(extract_races_recursively(value))
    elif isinstance(node, list):
        for item in node:
            races.extend(extract_races_recursively(item))
    return races

def get_all_races():
    all_races = []
    for directory in INPUT_DIRS:
        if not os.path.exists(directory):
            print(f"⚠️ Directorio no encontrado: {directory}")
            continue
        for filepath in glob.glob(os.path.join(directory, "*.json")):
            with open(filepath, 'r', encoding='utf-8') as f:
                try:
                    data = json.load(f)
                    all_races.extend(extract_races_recursively(data))
                except json.JSONDecodeError:
                    continue
                    
    # ORDEN CRONOLÓGICO ABSOLUTO PARA EL ELO
    all_races.sort(key=lambda x: x.get("timestamp", 0))
    return all_races

def calculate_elo():
    races = get_all_races()
    if not races:
        print("❌ No se encontraron carreras válidas para calcular el ELO.")
        return

    elos = {}
    original_names = {} # Para devolver el nombre original a la UI
    history = defaultdict(list)
    
    for race in races:
        results = race.get("results", [])
        
        # BLINDAJE 4: Conversión segura de posiciones (DSQ, DNS, etc)
        def get_pos(x):
            p = str(x.get("pos", "DNF")).strip().upper()
            if p in ["DNF", "DSQ", "DNS", "-", ""]: return 9999
            try: return int(p)
            except ValueError: return 9999
            
        sorted_results = sorted(results, key=get_pos)
        
        race_drivers_norm = []
        for r in sorted_results:
            raw = r.get("name", "Unknown")
            norm = normalize_name(raw)
            race_drivers_norm.append(norm)
            original_names[norm] = raw # Guarda el nombre más reciente (Ej con [SL])
            
            if norm not in elos:
                elos[norm] = STARTING_ELO
        
        changes = {d: 0 for d in race_drivers_norm}
        
        # Free-For-All
        for i in range(len(race_drivers_norm)):
            for j in range(i + 1, len(race_drivers_norm)):
                d_a = race_drivers_norm[i]
                d_b = race_drivers_norm[j]
                
                # Expectativa de victoria de A
                ea = 1 / (1 + 10 ** ((elos[d_b] - elos[d_a]) / 400))
                eb = 1 - ea
                
                pos_a = get_pos(sorted_results[i])
                pos_b = get_pos(sorted_results[j])
                
                # BLINDAJE 3: Anti-farmeo DNF. Si ambos se estrellan, el cambio entre ellos es 0.
                if pos_a == 9999 and pos_b == 9999:
                    continue
                    
                # Como están ordenados, A siempre está por delante de B
                score_a, score_b = 1.0, 0.0
                    
                changes[d_a] += K_FACTOR * (score_a - ea)
                changes[d_b] += K_FACTOR * (score_b - eb)
                
        # Aplicar variaciones a la base de datos
        for norm_name in race_drivers_norm:
            elos[norm_name] += changes[norm_name]
            history[norm_name].append({
                "date": race.get("date", "Unknown Date"),
                "timestamp": race.get("timestamp", 0),
                "race_name": race.get("name", "Unknown Race"),
                "elo_change": round(changes[norm_name], 1),
                "new_elo": round(elos[norm_name])
            })
            
    # Formatear el JSON final
    final_output = []
    for norm_name, elo in elos.items():
        final_output.append({
            "name": original_names[norm_name], # Restauramos su nombre para React
            "current_elo": round(elo),
            "races_completed": len(history[norm_name]),
            "history": history[norm_name]
        })
        
    final_output.sort(key=lambda x: x["current_elo"], reverse=True)
    
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(final_output, f, indent=2, ensure_ascii=False)
        
    print(f"✅ Motor ELO blindado completado: {len(races)} carreras procesadas.")
    print(f"💾 Guardado en: {OUTPUT_FILE}")

if __name__ == "__main__":
    calculate_elo()