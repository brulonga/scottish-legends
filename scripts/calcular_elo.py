import os
import json
import glob
import re
from datetime import datetime
from collections import defaultdict

# --- CONFIGURACIÓN ---
INPUT_DIRS = [
    "public/data/monday_marathon", 
    "public/data/fun_friday"
]
OUTPUT_FILE = "public/data/elo/driver_elos.json"

STARTING_ELO = 1500
BASE_K_FACTOR = 3  
REFERENCE_DURATION_MINUTES = 60.0 

def normalize_name(raw_name):
    if not raw_name: return "Unknown"
    name = re.sub(r'\[.*?\]|\(.*?\)|\|.*', '', raw_name)
    return re.sub(r'\s+', ' ', name).strip().title()

def parse_timestamp(ts):
    """Convierte marcas de tiempo numéricas, texto ISO o strings de fecha a formato numérico seguro."""
    if isinstance(ts, (int, float)) and ts > 0:
        return float(ts)
    if isinstance(ts, str):
        ts_clean = ts.strip()
        try:
            return float(ts_clean) # Por si es un string numérico tipo "1700000000.0"
        except ValueError:
            pass
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d"):
            try:
                dt = datetime.strptime(ts_clean, fmt)
                return dt.timestamp()
            except ValueError:
                continue
    return 0.0

def extract_timestamp_from_filename(filepath):
    """Fallback definitivo: extrae la fecha del nombre del archivo si el JSON no trae timestamp"""
    base_name = os.path.basename(filepath)
    match_acc = re.search(r'(\d{2})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})', base_name)
    if match_acc:
        yy, mm, dd, hh, mins, ss = match_acc.groups()
        try:
            return datetime.strptime(f"20{yy}-{mm}-{dd} {hh}:{mins}:{ss}", "%Y-%m-%d %H:%M:%S").timestamp()
        except:
            pass
    match_manual = re.search(r'(\d{1,2})-(\d{1,2})-(\d{2})', base_name)
    if match_manual:
        d, m, yy = match_manual.groups()
        try:
            return datetime.strptime(f"20{yy}-{int(m):02d}-{int(d):02d} 00:00:00", "%Y-%m-%d %H:%M:%S").timestamp()
        except:
            pass
    return os.path.getmtime(filepath)

def extract_races_recursively(node, fallback_timestamp=0.0):
    """
    Búsqueda recursiva blindada: Encuentra todas las sub-carreras y les asigna 
    un timestamp válido de forma heredada si el objeto carece de él.
    """
    races = []
    current_ts = parse_timestamp(node.get("timestamp") if isinstance(node, dict) else None)
    if current_ts == 0.0:
        current_ts = parse_timestamp(node.get("date") if isinstance(node, dict) else None)
    
    active_ts = current_ts if current_ts > 0.0 else fallback_timestamp

    if isinstance(node, dict):
        # Si el diccionario contiene resultados de una carrera
        if "results" in node and isinstance(node["results"], list) and len(node["results"]) > 0:
            race_copy = node.copy()
            if "timestamp" not in race_copy or parse_timestamp(race_copy.get("timestamp")) == 0.0:
                race_copy["timestamp"] = active_ts
            races.append(race_copy)
            
        # Seguir buscando dentro de las claves del diccionario
        for key, value in node.items():
            races.extend(extract_races_recursively(value, active_ts))
            
    elif isinstance(node, list):
        for item in node:
            races.extend(extract_races_recursively(item, active_ts))
            
    return races

def get_all_races():
    all_races = []
    for directory in INPUT_DIRS:
        if not os.path.exists(directory):
            print(f"⚠️ Directorio no encontrado: {directory}")
            continue
            
        pattern = os.path.join(directory, "**", "*.json")
        for filepath in glob.glob(pattern, recursive=True):
            with open(filepath, 'r', encoding='utf-8') as f:
                try:
                    data = json.load(f)
                    file_fallback_ts = extract_timestamp_from_filename(filepath)
                    races_found = extract_races_recursively(data, file_fallback_ts)
                    
                    for r in races_found:
                        ts = parse_timestamp(r.get("timestamp"))
                        if ts == 0.0:
                            ts = file_fallback_ts
                        r["parsed_timestamp"] = ts
                        
                    all_races.extend(races_found)
                except Exception as e:
                    continue
                    
    # Orden cronológico absoluto global
    all_races.sort(key=lambda x: x.get("parsed_timestamp", 0.0))
    return all_races

def calculate_race_duration_minutes(race):
    """
    Calcula la duración real analizando el tiempo total del ganador o sumando 
    los historiales de vueltas de los pilotos para que nunca devuelva siempre 60 min.
    """
    results = race.get("results", [])
    winner_time_ms = 0
    
    # 1. Intentar buscar el tiempo total del ganador explícitamente
    for r in results:
        p = str(r.get("pos", "")).strip().upper()
        if p == "1" or r.get("race_gap") == "WINNER":
            winner_time_ms = r.get("total_time_ms", r.get("total_time", 0))
            if winner_time_ms and winner_time_ms < 2000000000:
                break
                
    # 2. Si no viene el total acumulado, sumar el lap_history del primer clasificado que tenga vueltas
    if not winner_time_ms or winner_time_ms >= 2000000000:
        for r in results:
            lap_history = r.get("lap_history", [])
            if lap_history:
                total_from_laps = sum(lap.get("time_ms", 0) for lap in lap_history)
                if total_from_laps > 0:
                    winner_time_ms = total_from_laps
                    break

    if winner_time_ms and winner_time_ms < 2000000000:
        mins = winner_time_ms / 60000.0
        if mins > 0.5: # Validar que sea un tiempo coherente mayor a medio minuto
            return mins
            
    return REFERENCE_DURATION_MINUTES

def calculate_elo():
    races = get_all_races()
    if not races:
        print("❌ No se encontraron carreras válidas para calcular el ELO.")
        return

    print(f"🔍 Total de carreras detectadas y ordenadas para el ELO: {len(races)}")

    elos = {}
    original_names = {} 
    history = defaultdict(list)
    
    for race in races:
        results = race.get("results", [])
        if not results: continue
        
        duration_mins = calculate_race_duration_minutes(race)
        duration_multiplier = max(0.2, min(4.0, duration_mins / REFERENCE_DURATION_MINUTES))
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
        
        for i in range(len(race_drivers_norm)):
            for j in range(i + 1, len(race_drivers_norm)):
                d_a = race_drivers_norm[i]
                d_b = race_drivers_norm[j]
                
                ea = 1 / (1 + 10 ** ((elos[d_b] - elos[d_a]) / 400))
                eb = 1 - ea
                
                pos_a = get_pos(sorted_results[i])
                pos_b = get_pos(sorted_results[j])
                
                if pos_a == 9999 and pos_b == 9999:
                    continue
                    
                score_a, score_b = 1.0, 0.0
                    
                changes[d_a] += effective_k * (score_a - ea)
                changes[d_b] += effective_k * (score_b - eb)
                
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
        
    print(f"✅ Motor ELO completado: {len(races)} carreras procesadas correctamente.")
    print(f"💾 Guardado en: {OUTPUT_FILE}")

if __name__ == "__main__":
    calculate_elo()