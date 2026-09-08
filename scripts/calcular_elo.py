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
# 🚀 1. EL BOTE TOTAL: Ajustado a 120 para equilibrar con la nueva referencia
BASE_K_TOTAL = 120  
# 🚀 2. REFERENCIA: 90 minutos es la carrera "Estándar" que da el 100% de puntos
REFERENCE_DURATION_MINUTES = 90.0 

def normalize_name(raw_name):
    if not raw_name: return "Unknown"
    name = re.sub(r'\[.*?\]|\(.*?\)|\|.*', '', raw_name)
    return re.sub(r'\s+', ' ', name).strip().title()

def parse_timestamp(ts):
    if isinstance(ts, (int, float)) and ts > 0:
        return float(ts)
    if isinstance(ts, str):
        ts_clean = ts.strip()
        try:
            return float(ts_clean)
        except ValueError:
            pass
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d"):
            try:
                return datetime.strptime(ts_clean, fmt).timestamp()
            except ValueError:
                continue
    return 0.0

def extract_timestamp_from_filename(filepath):
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
    races = []
    current_ts = parse_timestamp(node.get("timestamp") if isinstance(node, dict) else None)
    if current_ts == 0.0:
        current_ts = parse_timestamp(node.get("date") if isinstance(node, dict) else None)
    
    active_ts = current_ts if current_ts > 0.0 else fallback_timestamp

    if isinstance(node, dict):
        if "results" in node and isinstance(node["results"], list) and len(node["results"]) > 0:
            race_copy = node.copy()
            if "timestamp" not in race_copy or parse_timestamp(race_copy.get("timestamp")) == 0.0:
                race_copy["timestamp"] = active_ts
            races.append(race_copy)
            
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
                        r["parsed_timestamp"] = ts if ts > 0.0 else file_fallback_ts
                        
                    all_races.extend(races_found)
                except Exception:
                    continue
                    
    all_races.sort(key=lambda x: x.get("parsed_timestamp", 0.0))
    return all_races

def calculate_race_duration_minutes(race):
    results = race.get("results", [])
    winner_time_ms = 0
    
    for r in results:
        p = str(r.get("pos", "")).strip().upper()
        if p == "1" or r.get("race_gap") == "WINNER":
            winner_time_ms = r.get("total_time_ms", r.get("total_time", 0))
            if winner_time_ms and winner_time_ms < 2000000000:
                break
                
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
        if mins > 0.5:
            return mins
            
    return REFERENCE_DURATION_MINUTES

def calculate_elo():
    races = get_all_races()
    if not races:
        print("❌ No se encontraron carreras válidas para calcular el ELO.")
        return

    elos = {}
    original_names = {} 
    history = defaultdict(list)
    
    for race in races:
        raw_results = race.get("results", [])
        if not raw_results: continue
        
        def get_pos(x):
            p = str(x.get("pos", "DNF")).strip().upper()
            if p in ["DNF", "DSQ", "DNS", "-", ""]: return 9999
            try: return int(p)
            except ValueError: return 9999
            
        sorted_results = sorted(raw_results, key=get_pos)
        
        seen_in_race = set()
        deduped_results = []
        race_drivers_norm = []
        
        for r in sorted_results:
            pos_str = str(r.get("pos", "")).strip().upper()
            if pos_str == "DNS" or pos_str == "SPECTATOR":
                continue
                
            has_lap_info = any(k in r for k in ["lapCount", "lapsCount", "laps", "lap_history"])
            laps_completed = -1
            
            if has_lap_info:
                try:
                    if "lapCount" in r: laps_completed = int(r.get("lapCount", 0) or 0)
                    elif "lapsCount" in r: laps_completed = int(r.get("lapsCount", 0) or 0)
                    elif "laps" in r: 
                        val = r.get("laps", 0)
                        laps_completed = len(val) if isinstance(val, list) else int(val or 0)
                    elif "lap_history" in r: 
                        laps_completed = len(r.get("lap_history", []))
                except:
                    pass
            
            if has_lap_info and laps_completed == 0:
                continue

            raw = r.get("name", "Unknown")
            norm = normalize_name(raw)
            if norm in seen_in_race:
                continue
            seen_in_race.add(norm)
            deduped_results.append(r)
            race_drivers_norm.append(norm)
            original_names[norm] = raw
            
            if norm not in elos:
                elos[norm] = STARTING_ELO
        
        N = len(race_drivers_norm)
        if N <= 1: 
            continue
            
        duration_mins = calculate_race_duration_minutes(race)
        
        # 🚀 3. EL MULTIPLICADOR ESTRELLA: Mínimo 20% de los puntos, Máximo 100% (carreras de >= 90 mins)
        duration_multiplier = max(0.2, min(1.0, duration_mins / REFERENCE_DURATION_MINUTES))
        
        effective_k = (BASE_K_TOTAL * duration_multiplier) / (N - 1)
        
        pre_race_elos = {d: elos[d] for d in race_drivers_norm}
        sorted_by_elo = sorted(race_drivers_norm, key=lambda x: pre_race_elos[x], reverse=True)
        expected_positions = {d: idx + 1 for idx, d in enumerate(sorted_by_elo)}

        changes = {d: 0 for d in race_drivers_norm}
        
        for i in range(len(race_drivers_norm)):
            for j in range(i + 1, len(race_drivers_norm)):
                d_a = race_drivers_norm[i]
                d_b = race_drivers_norm[j]
                
                ea = 1 / (1 + 10 ** ((elos[d_b] - elos[d_a]) / 400))
                eb = 1 - ea
                
                pos_a = get_pos(deduped_results[i])
                pos_b = get_pos(deduped_results[j])
                
                if pos_a == 9999 and pos_b == 9999:
                    continue
                    
                score_a = 1.0 if pos_a < pos_b else (0.5 if pos_a == pos_b else 0.0)
                score_b = 1.0 - score_a
                    
                changes[d_a] += effective_k * (score_a - ea)
                changes[d_b] += effective_k * (score_b - eb)
        
        for d in race_drivers_norm:
            pos = get_pos(deduped_results[race_drivers_norm.index(d)])
            exp_pos = expected_positions[d]
            
            if pos != 9999:
                if changes[d] > 0:
                    changes[d] *= 2.0
                
                if pos == 1 and changes[d] > 0:
                    changes[d] *= 1.50
                elif pos == 2 and changes[d] > 0:
                    changes[d] *= 1.35
                elif pos == 3 and changes[d] > 0:
                    changes[d] *= 1.20
                elif pos <= 5 and changes[d] > 0:
                    changes[d] *= 1.10
                
                if pos <= exp_pos + 3 or pos <= 5:
                    if changes[d] < 0:
                        changes[d] = 2.0 
                        
                # 🚀 4. BONOS FIJOS MULTIPLICADOS POR LA DURACIÓN
                # Si ganas una sprint de 20 min te llevas un +6.6 extra, si es de 90 min te llevas el +30 íntegro
                if pos == 1:
                    changes[d] += (30.0 * duration_multiplier)
                elif pos == 2:
                    changes[d] += (20.0 * duration_multiplier)
                elif pos == 3:
                    changes[d] += (10.0 * duration_multiplier)
                elif pos <= 5:
                    changes[d] += (5.0 * duration_multiplier)
                    
        parsed_ts = race.get("parsed_timestamp", 0)
        race_date = race.get("date")
        if not race_date or race_date == "Unknown Date":
            if parsed_ts > 0:
                race_date = datetime.fromtimestamp(parsed_ts).strftime('%Y-%m-%d %H:%M')
            else:
                race_date = "Unknown Date"

        for norm_name in race_drivers_norm:
            elos[norm_name] += changes[norm_name]
            history[norm_name].append({
                "date": race_date,
                "timestamp": parsed_ts,
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
        
    print(f"✅ Motor ELO High-Inflation (Escalado x Tiempo) finalizado: {len(races)} carreras procesadas.")
    print(f"💾 Archivo actualizado en: {OUTPUT_FILE}")

if __name__ == "__main__":
    calculate_elo()