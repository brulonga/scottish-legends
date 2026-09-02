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
BASE_K_FACTOR = 3  # K-factor base para una carrera de referencia de 60 minutos
REFERENCE_DURATION_MINUTES = 60.0 # Duración de referencia estándar

def normalize_name(raw_name):
    """Limpieza y normalización de nombres para evitar duplicados por etiquetas de equipo."""
    if not raw_name: return "Unknown"
    name = re.sub(r'\[.*?\]|\(.*?\)|\|.*', '', raw_name)
    return re.sub(r'\s+', ' ', name).strip().title()

def extract_races_recursively(node):
    """Búsqueda recursiva para encontrar carreras en cualquier nivel de profundidad del JSON."""
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

def parse_timestamp(ts):
    """Convierte marcas de tiempo numéricas o en texto plano a formato numérico de manera segura."""
    if isinstance(ts, (int, float)):
        return float(ts)
    if isinstance(ts, str):
        try:
            from datetime import datetime
            dt = datetime.strptime(ts, "%Y-%m-%d %H:%M:%S")
            return dt.timestamp()
        except ValueError:
            pass
    return 0.0

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
                    races_found = extract_races_recursively(data)
                    for r in races_found:
                        r["parsed_timestamp"] = parse_timestamp(r.get("timestamp"))
                    all_races.extend(races_found)
                except json.JSONDecodeError:
                    continue
                    
    # Orden cronológico absoluto
    all_races.sort(key=lambda x: x.get("parsed_timestamp", 0.0))
    return all_races

def calculate_race_duration_minutes(results):
    """Calcula la duración de la carrera en base al tiempo total del ganador (posición 1)"""
    winner_time_ms = 0
    for r in results:
        p = str(r.get("pos", "")).strip().upper()
        if p == "1" or r.get("race_gap") == "WINNER":
            winner_time_ms = r.get("total_time_ms", r.get("total_time", 0))
            break
    
    # Si no encuentra explícitamente el puesto 1, usa el primer tiempo disponible como respaldo
    if not winner_time_ms and results:
        winner_time_ms = results[0].get("total_time_ms", results[0].get("total_time", 0))
        
    if winner_time_ms and winner_time_ms < 2000000000:
        return winner_time_ms / 60000.0 # Convertir milisegundos a minutos
        
    return REFERENCE_DURATION_MINUTES # Valor por defecto si no hay datos de tiempo

def calculate_elo():
    races = get_all_races()
    if not races:
        print("❌ No se encontraron carreras válidas para calcular el ELO.")
        return

    elos = {}
    original_names = {} 
    history = defaultdict(list)
    
    for race in races:
        results = race.get("results", [])
        if not results: continue
        
        # Calcular el multiplicador proporcional basado en la duración de esta carrera específica
        duration_mins = calculate_race_duration_minutes(results)
        # Evitamos factores absurdos limitándolo a un mínimo de 0.2 (sprints ultra cortos) y máximo de 4.0
        duration_multiplier = max(0.2, min(4.0, duration_mins / REFERENCE_DURATION_MINUTES))
        
        # Ajustamos el K-Factor de esta carrera de forma proporcional a su duración
        effective_k = BASE_K_FACTOR * duration_multiplier

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
            original_names[norm] = raw 
            
            if norm not in elos:
                elos[norm] = STARTING_ELO
        
        changes = {d: 0 for d in race_drivers_norm}
        
        # Enfrentamientos Free-For-All
        for i in range(len(race_drivers_norm)):
            for j in range(i + 1, len(race_drivers_norm)):
                d_a = race_drivers_norm[i]
                d_b = race_drivers_norm[j]
                
                ea = 1 / (1 + 10 ** ((elos[d_b] - elos[d_a]) / 400))
                eb = 1 - ea
                
                pos_a = get_pos(sorted_results[i])
                pos_b = get_pos(sorted_results[j])
                
                # Ignorar si ambos son DNF
                if pos_a == 9999 and pos_b == 9999:
                    continue
                    
                score_a, score_b = 1.0, 0.0
                    
                # Aplicamos el K-Factor escalado por la duración de la carrera
                changes[d_a] += effective_k * (score_a - ea)
                changes[d_b] += effective_k * (score_b - eb)
                
        # Guardar cambios
        for norm_name in race_drivers_norm:
            elos[norm_name] += changes[norm_name]
            history[norm_name].append({
                "date": race.get("date", "Unknown Date"),
                "timestamp": race.get("parsed_timestamp", 0),
                "race_name": race.get("name", "Unknown Race"),
                "duration_minutes": round(duration_mins, 1),
                "elo_change": round(changes[norm_name], 1),
                "new_elo": round(elos[norm_name])
            })
            
    final_output = []
    for norm_name, elo in elos.items():
        final_output.append({
            "name": original_names[norm_name],
            "current_elo": round(elo),
            "races_completed": len(history[norm_name]),
            "history": history[norm_name]
        })
        
    final_output.sort(key=lambda x: x["current_elo"], reverse=True)
    
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(final_output, f, indent=2, ensure_ascii=False)
        
    print(f"✅ Motor ELO con ponderación de duración finalizado: {len(races)} carreras procesadas.")
    print(f"💾 Guardado en: {OUTPUT_FILE}")

if __name__ == "__main__":
    calculate_elo()