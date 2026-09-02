import json
import os
import re
import unicodedata
from datetime import datetime

# ==========================================
# 1. CONFIGURACIÓN
# ==========================================

POINTS_SYSTEM = [180, 150, 135, 122, 111, 102, 94, 87, 81, 76, 71, 66, 62, 58, 54, 50, 46, 42, 38, 34, 30, 26, 22, 18, 14, 10, 8, 6, 4, 2, 1]

# Parámetros de validación de carrera
MIN_LAPS_STATS = 0.50        # 50% de las vueltas para calcular telemetría/ritmo
MIN_LAPS_CLASSIFIED = 0.80   # 80% de las vueltas para clasificar y recibir puntos
MIN_DRIVERS_VALID_RACE = 3   # Mínimo de clasificados en un grupo para repartir puntos

# 🚀 NUEVAS RUTAS PARA GITHUB ACTIONS Y G-DRIVE
BASE_SYNC_FOLDER = "public/data/gdrive_sync/FF/season_2"
OUTPUT_FILE = "public/data/fun_friday/season_2.json"

CATEGORIES = {
    "marsi bella": "PLATINUM", "sebastian franken": "PLATINUM", "vis nalu": "PLATINUM", 
    "mike weber": "PLATINUM", "antoni mencik": "PLATINUM", "dominic zimmermann": "PLATINUM",
    "alex küch": "GOLD", "moritz brandl": "GOLD", "cla rens": "GOLD", "bruno longarela": "GOLD", 
    "isaac melvatron": "GOLD", "lucas nierhaus": "GOLD", "he who-noms-on-tires": "GOLD", 
    "kai weber": "GOLD", "elliot heal": "GOLD", "luca maggiolo": "GOLD", "micha nieuwkoop": "GOLD",
    "czech blackness": "SILVER", "bence kamaras": "SILVER", "raymond crawford": "SILVER", 
    "frank john": "SILVER", "davide leone": "SILVER", "marty fox": "SILVER", "vexal santos": "SILVER", 
    "kevin peeters": "SILVER", "florian braun": "SILVER", "nick ice": "SILVER", "fiesta bonanza": "SILVER", 
    "vinicius ferreira": "SILVER", "ash goodliffe": "SILVER", "viktor ruga": "SILVER",
    "gael duchene esp": "BRONZE", "eerik liiva": "BRONZE", "tanno raayman": "BRONZE", 
    "andrew davidenko": "BRONZE", "andy mcdonald": "BRONZE", "joshua buller": "BRONZE", 
    "matt rigby": "BRONZE", "tony buller": "BRONZE", "danil kolbasenko": "BRONZE", "leonardo rigon": "BRONZE"
}

CAT_RANKS = {"PLATINUM": 5, "GOLD": 4, "SILVER": 3, "BRONZE": 2, "ROOKIE": 1}

CALENDAR = [
    { "id": "R1", "name": "Season Opener", "track": "Nürburgring Nordschleife", "type": "Multi-Class", "rules": {"PLATINUM": "GT4", "GOLD": "GT4", "SILVER": "GT3", "BRONZE": "GT3", "ROOKIE": "GT3"}},
    { "id": "R2", "name": "TCX Mini-Champ", "track": "Donington/Oulton/Snetterton", "type": "TCX", "rules": {"ALL": "TCX"}, "is_sprint": True},
    { "id": "R3", "name": "Endurance Showcase", "track": "Spa-Francorchamps", "type": "GT3", "rules": {"ALL": "GT3"}},
    { "id": "R4", "name": "British Classic", "track": "Brands Hatch", "type": "GT4", "rules": {"ALL": "GT4"}},
    { "id": "R5", "name": "Porsche Cup Mini-Champ", "track": "Paul Ricard/Kyalami/Suzuka", "type": "Porsche 992", "rules": {"ALL": "CUP"}, "is_sprint": True},
    { "id": "R6", "name": "Season Finale", "track": "Nürburgring Nordschleife", "type": "Multi-Class", "rules": {"PLATINUM": "GT3", "GOLD": "GT3", "SILVER": "GT4", "BRONZE": "GT4", "ROOKIE": "GT4"}}
]

PENALTIES = {
    "R1": {
        "marc mitchmont": 5,
        "k ömer": 5,
        "wes lee": 5,
    },
    "R2": {
        1: {},
        2: {},
        3: {}
    },
    "R3": {
        "Mathieu Perrault": 5,
        "Laurent Vermaercke": 10,
        "Kiss Benedeck": 5,
        "Youssef Mohamed": 15,
        "Alex Grandi": 5,
        "Al Parky": 5,
        "Paul Kelly": 5
    },
    "R4": {
        "Eugen Naza": 15,
        "Julian Maßner": 15,
        "Tiago Dresch": 10,
        "Danil kolbasenko": 5,
        "Bence Kamaras": 2000,
    },
    "R5": {
        1: {"Marty Fox": 5,
            "Luca Maggiolo": 5,
            "Antony Gambino": 35,
            "Casper Smit": 5,
            "Jonathon Moon": 5,
            "Romain Luthi": 5,
            "Alex Kuch": 5},
        2: {"Rainer Wengert": 5,
            "Alex Kuch": 5,
            "Casper Smit": 5,
            "Kacper Slawinski": 15},
        3: {"Rainer Wengert": 5}
    },
    "R6": {
        "Casper Smit": 5,
        "Bence Kamaras": 5,
        "Zsolt Katona": 5,
        "Alex Kuch": 60,
        "Danil Kolbasenko": 5
    }
}

# ==========================================
# 2. FUNCIONES AUXILIARES
# ==========================================

# 🚀 NUEVA FUNCIÓN: Extrae la fecha del nombre del archivo y la convierte en Timestamp
def extract_timestamp_from_filename(filename):
    base_name = os.path.basename(filename)
    
    # 1. Formato ACC automático: 260831_210107_R.json (AAMMDD_HHMMSS)
    match_acc = re.search(r'(\d{2})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})', base_name)
    if match_acc:
        yy, mm, dd, hh, mins, ss = match_acc.groups()
        dt = datetime.strptime(f"20{yy}-{mm}-{dd} {hh}:{mins}:{ss}", "%Y-%m-%d %H:%M:%S")
        return dt.timestamp()
        
    # 2. Formato manual: Monday Marathon - Spa - 6-4-26.json (D-M-YY)
    match_manual = re.search(r'(\d{1,2})-(\d{1,2})-(\d{2})', base_name)
    if match_manual:
        d, m, yy = match_manual.groups()
        dt = datetime.strptime(f"20{yy}-{int(m):02d}-{int(d):02d} 00:00:00", "%Y-%m-%d %H:%M:%S")
        return dt.timestamp()
        
    return os.path.getmtime(filename)


def read_json_safe(filepath):
    encodings = ['utf-16', 'utf-8-sig', 'utf-16-le', 'utf-8', 'cp1252']
    
    for enc in encodings:
        try:
            with open(filepath, 'r', encoding=enc) as f:
                return json.load(f)
        except (UnicodeError, json.JSONDecodeError): 
            continue
            
    raise ValueError(f"❌ Error crítico: No se pudo leer el archivo de ACC {filepath}")

def fix_mojibake(text):
    try: return text.encode('latin-1').decode('utf-8')
    except: return text

def clean_name(name):
    fixed_name = fix_mojibake(name)
    cleaned = re.sub(r'\[.*?\]|\|.*', '', fixed_name)
    return re.sub(r'\s+', ' ', cleaned).strip()

def normalize_str(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn').lower()

NORMALIZED_CATEGORIES = {normalize_str(k): v for k, v in CATEGORIES.items()}

def get_car_class(car_model):
    model = int(car_model)
    if 50 <= model <= 61: return 'GT4'
    if model in [80, 82, 83, 84, 85, 86, 18, 29, 26]: return 'GT2'
    if model in [9, 28]: return 'CUP'
    if model == 27: return 'TCX'
    return 'GT3'

def ms_to_str(ms):
    if not ms or ms >= 2147483647: return "-"
    mins, ms = divmod(ms, 60000)
    secs, ms = divmod(ms, 1000)
    if mins > 0: return f"{mins}:{secs:02d}.{ms:03d}"
    return f"{secs:02d}.{ms:03d}"

def get_split(category):
    if category in ["PLATINUM", "GOLD"]: return "PRO"
    if category in ["SILVER", "BRONZE"]: return "AM"
    return "ROOKIE"

# ==========================================
# 3. PROCESADOR DE ARCHIVO INDIVIDUAL
# ==========================================

def process_acc_file(filepath):
    data = read_json_safe(filepath)
    
    session_type = data.get("sessionType", "")
    if not session_type and "sessionResult" in data:
        session_type = data.get("sessionType", "R")

    is_qualy = session_type.upper() in ["Q", "FP", "QP"]
    lines = data.get("sessionResult", {}).get("leaderBoardLines", [])
    laps_data = data.get("laps", [])
    
    best_global_ms = min([l["timing"]["bestLap"] for l in lines if l["timing"]["bestLap"] < 2147483647] + [2147483647])
    results = []
    
    for pos, line in enumerate(lines):
        driver_info = line["currentDriver"]
        raw_name = f"{driver_info['firstName']} {driver_info['lastName']}"
        name = clean_name(raw_name)
        car_model = line["car"]["carModel"]
        car_class = get_car_class(car_model)
        
        timing = line["timing"]
        best_lap_ms = timing["bestLap"]
        lap_count = timing["lapCount"]
        total_time = timing["totalTime"]
        
        if lap_count == 0: continue
            
        driver_laps = [l for l in laps_data if l["carId"] == line["car"]["carId"]]
        
        if is_qualy:
            best_splits = timing.get("bestSplits", [])
            gap_pole_ms = best_lap_ms - best_global_ms if best_lap_ms < 2147483647 else 0
            
            results.append({
                "name": name, "raw_name": raw_name, "car_class": car_class, "car_model": car_model,
                "s1": ms_to_str(best_splits[0]) if len(best_splits) > 0 else "-",
                "s2": ms_to_str(best_splits[1]) if len(best_splits) > 1 else "-",
                "s3": ms_to_str(best_splits[2]) if len(best_splits) > 2 else "-",
                "best_lap_ms": best_lap_ms, "best_lap": ms_to_str(best_lap_ms),
                "gap_pole_ms": gap_pole_ms,
                "gap_pole": f"+{gap_pole_ms/1000:.3f}s" if gap_pole_ms > 0 else "POLE"
            })
        else:
            avg_lap_ms = int(total_time / lap_count) if lap_count > 0 else 0
            incidents = len([l for l in driver_laps if not l.get("isValidForBest", True)])
            
            results.append({
                "name": name, "raw_name": raw_name, "car_class": car_class, "car_model": car_model,
                "laps": lap_count, "total_time": total_time, "best_lap_ms": best_lap_ms, "best_lap": ms_to_str(best_lap_ms),
                "avg_lap_ms": avg_lap_ms, "avg_time": ms_to_str(avg_lap_ms), "incidents": incidents,
                "lap_history": [{"time_ms": l["laptime"], "is_incident": not l.get("isValidForBest", True)} for l in driver_laps]
            })
            
    return is_qualy, results

# ==========================================
# 4. MOTOR PRINCIPAL
# ==========================================

def process_season(logs_dir):
    drivers_data = {}
    sessions_output = []
    
    for round_index, round_info in enumerate(CALENDAR):
        r_id = round_info["id"]
        round_dir = os.path.join(logs_dir, r_id)
        
        if not os.path.exists(round_dir): continue
        print(f"Procesando {r_id}: {round_info['name']}...")
        
        round_points_temp = {}
        processed_sessions = []
        race_results_list = []
        
        filenames = sorted([f for f in os.listdir(round_dir) if f.endswith('.json')])
        current_qualy = []
        race_idx = 0
        
        for filename in filenames:
            filepath = os.path.join(round_dir, filename)
            is_qualy, results = process_acc_file(filepath)
            
            if is_qualy:
                results.sort(key=lambda x: x["best_lap_ms"])
                for q_pos, q in enumerate(results): q["pos"] = q_pos + 1
                current_qualy = results
            else:
                race_idx += 1
                race = results
                
                # 1. Aplicar sanciones de tiempo
                for r in race:
                    round_penalties = PENALTIES.get(r_id, {})
                    
                    if race_idx in round_penalties:
                        penalty_sec = round_penalties[race_idx].get(normalize_str(r["name"]), 0)
                    else:
                        penalty_sec = round_penalties.get(normalize_str(r["name"]), 0)

                    if penalty_sec > 0 and r["laps"] > 0:
                        r["total_time"] += (penalty_sec * 1000)
                        r["penalty"] = penalty_sec
                    else:
                        r["penalty"] = 0
                
                # 2. Orden General tras sanciones
                race.sort(key=lambda x: (-x["laps"], x["total_time"]))
                
                # 3. Detectar Vueltas Máximas por Split
                max_laps_split = {"PRO": 0, "AM": 0, "ROOKIE": 0}
                for r in race:
                    cat = NORMALIZED_CATEGORIES.get(normalize_str(r["name"]), "ROOKIE")
                    split = get_split(cat)
                    if r["laps"] > max_laps_split[split]:
                        max_laps_split[split] = r["laps"]
                
                # 4. Contar Clasificados por Split
                finishers_split = {"PRO": 0, "AM": 0, "ROOKIE": 0}
                for r in race:
                    cat = NORMALIZED_CATEGORIES.get(normalize_str(r["name"]), "ROOKIE")
                    split = get_split(cat)
                    if r["laps"] >= max_laps_split[split] * MIN_LAPS_CLASSIFIED:
                        finishers_split[split] += 1

                valid_stats_drivers = [r for r in race if r["laps"] >= max_laps_split[get_split(NORMALIZED_CATEGORIES.get(normalize_str(r["name"]), "ROOKIE"))] * MIN_LAPS_STATS]
                
                valid_best_laps = [r["best_lap_ms"] for r in valid_stats_drivers if r["best_lap_ms"] < 2147483647]
                valid_avg_laps = [r["avg_lap_ms"] for r in valid_stats_drivers if r["avg_lap_ms"] > 0]
                
                race_best_lap = min(valid_best_laps) if valid_best_laps else 0
                race_best_pace = min(valid_avg_laps) if valid_avg_laps else 0
                winner_time = race[0]["total_time"] if race else 0
                
                split_pos_counter = {"PRO": 0, "AM": 0, "ROOKIE": 0}
                
                # 5. ASIGNACIÓN DE POSICIONES
                for pos_index, r in enumerate(race):
                    name = r["name"]
                    category = NORMALIZED_CATEGORIES.get(normalize_str(name), "ROOKIE")
                    split = get_split(category)
                    current_cat_rank = CAT_RANKS.get(category, 1)
                    car_class = r["car_class"]
                    
                    if name not in drivers_data:
                        drivers_data[name] = {
                            "name": name, "category": category, "points": 0, "races": 0, "qualy_sessions": 0,
                            "sum_qualy_pos": 0, "sum_race_pos": 0, "sum_qualy_gap": 0, "sum_pace_gap": 0, "sum_net_pos": 0,
                            "rounds": {}, "favorite_cars": {}
                        }
                    
                    r["pos"] = pos_index + 1 
                    has_stats = r["laps"] >= max_laps_split[split] * MIN_LAPS_STATS
                    is_classified = r["laps"] >= max_laps_split[split] * MIN_LAPS_CLASSIFIED
                    
                    rules = round_info["rules"]
                    allowed_class = rules.get("ALL") or rules.get(category)
                    is_legal = not allowed_class or car_class == allowed_class
                    
                    base_points = 0
                    internal_sprint_pts = 0
                    
                    if is_classified and is_legal:
                        split_pos_idx = split_pos_counter[split]
                        r["class_pos"] = split_pos_idx + 1
                        
                        if split_pos_idx < len(POINTS_SYSTEM):
                            if not round_info.get("is_sprint"):
                                if finishers_split[split] >= MIN_DRIVERS_VALID_RACE:
                                    base_points = POINTS_SYSTEM[split_pos_idx]
                            else:
                                internal_sprint_pts = POINTS_SYSTEM[split_pos_idx]
                        
                        split_pos_counter[split] += 1
                    else:
                        r["class_pos"] = "DNF"
                    
                    bonus_points = 0
                    if is_legal and is_classified:
                        if category not in ["PLATINUM", "ROOKIE"]:
                            for behind_index in range(pos_index + 1, len(race)):
                                behind_r = race[behind_index]
                                behind_cat = NORMALIZED_CATEGORIES.get(normalize_str(behind_r["name"]), "ROOKIE")
                                behind_cat_rank = CAT_RANKS.get(behind_cat, 1)
                                
                                if car_class == behind_r["car_class"] and behind_cat_rank > current_cat_rank:
                                    bonus_points += 10
                    
                    if not round_info.get("is_sprint"):
                        r["points"] = base_points + bonus_points
                        
                        if name not in round_points_temp:
                            round_points_temp[name] = {"points": 0, "bonus": 0, "class": car_class}
                        round_points_temp[name]["points"] += base_points
                        round_points_temp[name]["bonus"] += bonus_points
                    else:
                        r["points"] = internal_sprint_pts + bonus_points
                        r["sprint_internal_pts"] = internal_sprint_pts
                        r["sprint_bonus"] = bonus_points
                    
                    q_pos, q_gap = "-", 0
                    for q in current_qualy:
                        if q["name"] == name:
                            q_pos, q_gap = q["pos"], q["gap_pole_ms"]
                            break
                            
                    r["qualy_pos"] = q_pos
                    r["net_vs_q"] = (q_pos - r["pos"]) if q_pos != "-" else "-"
                    
                    if has_stats:
                        r["gap_best_ms"] = r["best_lap_ms"] - race_best_lap if r["best_lap_ms"] < 2147483647 else 0
                        r["gap_pace_ms"] = r["avg_lap_ms"] - race_best_pace if r["avg_lap_ms"] > 0 else 0
                        r["race_gap"] = f"+{(r['total_time'] - winner_time)/1000:.3f}s" if pos_index > 0 else "WINNER"
                    else:
                        r["gap_best_ms"], r["gap_pace_ms"], r["race_gap"] = 0, 0, "DNF"
                        r["avg_lap_ms"], r["avg_time"], r["best_lap"] = 0, "-", "-"
                    
                    d_stats = drivers_data[name]
                    if has_stats:
                        d_stats["favorite_cars"][r["car_model"]] = d_stats["favorite_cars"].get(r["car_model"], 0) + 1
                        d_stats["sum_race_pos"] += r["class_pos"] if r["class_pos"] != "DNF" else r["pos"]
                        d_stats["sum_pace_gap"] += r["gap_pace_ms"]
                    if q_pos != "-":
                        d_stats["sum_qualy_pos"] += q_pos
                        d_stats["sum_qualy_gap"] += q_gap
                        d_stats["qualy_sessions"] += 1
                    if r["net_vs_q"] != "-":
                        d_stats["sum_net_pos"] += r["net_vs_q"]

                race_results_list.append(race)
                
                # 🚀 INYECTAMOS EL TIMESTAMP SACADO DEL ARCHIVO Y LA FECHA LEGIBLE
                race_timestamp = extract_timestamp_from_filename(filepath)
                formatted_date = datetime.fromtimestamp(race_timestamp).strftime('%Y-%m-%d %H:%M') if race_timestamp > 0 else "Unknown Date"
                
                processed_sessions.append({
                    "name": f"{round_info['name']} - Race {race_idx}" if round_info.get("is_sprint") else round_info['name'],
                    "timestamp": race_timestamp,
                    "date": formatted_date,
                    "qualy_results": current_qualy,
                    "results": race
                })
                current_qualy = []

        if round_info.get("is_sprint") and race_results_list:
            sprint_drivers = {}
            for race in race_results_list:
                for r in race:
                    name = r["name"]
                    category = NORMALIZED_CATEGORIES.get(normalize_str(name), "ROOKIE")
                    split = get_split(category)
                    
                    if name not in sprint_drivers:
                        sprint_drivers[name] = {"name": name, "split": split, "internal_pts": 0, "accumulated_bonus": 0, "best_pos": 999, "legal": True, "car_class": r["car_class"]}
                        
                    rules = round_info["rules"]
                    allowed_class = rules.get("ALL") or rules.get(category)
                    if allowed_class and r["car_class"] != allowed_class:
                        sprint_drivers[name]["legal"] = False
                        
                    if r["class_pos"] != "DNF":
                        sprint_drivers[name]["internal_pts"] += r.get("sprint_internal_pts", 0)
                        sprint_drivers[name]["best_pos"] = min(sprint_drivers[name]["best_pos"], r["class_pos"])
                        
                    sprint_drivers[name]["accumulated_bonus"] += r.get("sprint_bonus", 0)

            for split in ["PRO", "AM", "ROOKIE"]:
                drivers_in_split = [d for d in sprint_drivers.values() if d["split"] == split and d["legal"]]
                drivers_in_split.sort(key=lambda x: (-x["internal_pts"], x["best_pos"]))
                
                finishers = [d for d in drivers_in_split if d["best_pos"] != 999]
                if len(finishers) >= MIN_DRIVERS_VALID_RACE:
                    for idx, d in enumerate(drivers_in_split):
                        if d["best_pos"] != 999:
                            pts = POINTS_SYSTEM[idx] if idx < len(POINTS_SYSTEM) else 0
                            
                            if d["name"] not in round_points_temp:
                                round_points_temp[d["name"]] = {"points": 0, "bonus": 0, "class": d["car_class"]}
                                
                            round_points_temp[d["name"]]["points"] += pts
                            round_points_temp[d["name"]]["bonus"] += d["accumulated_bonus"]

        sessions_output.append({
            "id": f"event_{round_index}",
            "name": f"Round {round_index + 1}: {round_info['track']}",
            "sessions": processed_sessions
        })
        
        for name, data in round_points_temp.items():
            drivers_data[name]["rounds"][r_id] = {
                "points": data["points"] + data["bonus"],
                "bonusPoints": data["bonus"],
                "carClass": data["class"],
                "isDropped": False 
            }
            drivers_data[name]["races"] += 1

    # ==========================================
    # 5. CÁLCULO DE DROP ROUNDS Y MEDIAS GLOBALES
    # ==========================================
    ROUNDS_TO_KEEP = 3
    global_list = []
    
    for name, d in drivers_data.items():
        round_scores = [{"id": r_id, "pts": r_data["points"]} for r_id, r_data in d["rounds"].items()]
        round_scores.sort(key=lambda x: x["pts"], reverse=True)
        
        for idx, score_obj in enumerate(round_scores):
            r_id = score_obj["id"]
            if idx >= ROUNDS_TO_KEEP: d["rounds"][r_id]["isDropped"] = True
            else: d["points"] += d["rounds"][r_id]["points"]
        
        races = d["races"]
        qsess = d["qualy_sessions"]
        
        d["avg_points"] = round(d["points"] / min(races, ROUNDS_TO_KEEP), 1) if races else 0
        d["avg_pos"] = round(d["sum_race_pos"] / races, 1) if races else "-"
        d["avg_qualy_pos"] = round(d["sum_qualy_pos"] / qsess, 1) if qsess else "-"
        d["avg_gap"] = f"+{(d['sum_pace_gap'] / races)/1000:.3f}s" if races else "-"
        d["avg_qualy_gap"] = f"+{(d['sum_qualy_gap'] / qsess)/1000:.3f}s" if qsess else "-"
        d["net_pos_gained"] = d["sum_net_pos"]
        
        best_car = max(d["favorite_cars"], key=d["favorite_cars"].get) if d["favorite_cars"] else 0
        d["favorite_car"] = best_car
        
        del d["favorite_cars"], d["sum_race_pos"], d["sum_qualy_pos"], d["sum_qualy_gap"], d["sum_pace_gap"], d["sum_net_pos"], d["qualy_sessions"]
        global_list.append(d)

    # ==========================================
    # 6. EXPORTAR JSON
    # ==========================================
    
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    output_json = {
        "leagueId": "fun_friday", "seasonId": "season_2", "leagueName": "Scottish Legends ACC", "seasonName": "Season 2",
        "lastUpdated": datetime.utcnow().isoformat() + "Z", "calendar": CALENDAR, "global": global_list, "sessions": sessions_output
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output_json, f, indent=2, ensure_ascii=False)
        
    print(f"\n✅ Archivo actualizado con éxito en: {OUTPUT_FILE}")

if __name__ == "__main__":
    process_season(BASE_SYNC_FOLDER)