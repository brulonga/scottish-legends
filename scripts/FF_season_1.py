import json
import glob
import os
import re
import unicodedata
from datetime import datetime

# --- CONFIGURATION ---
MIN_LAPS_STATS = 0.50        # 50%: Mínimo para extraer telemetría y ritmo
MIN_LAPS_CLASSIFIED = 0.85   # 85%: Mínimo para recibir puntos

# 🚀 NUEVAS RUTAS PARA GITHUB ACTIONS Y G-DRIVE
BASE_SYNC_FOLDER = "public/data/gdrive_sync/FF/season_1"
OUTPUT_FILE = "public/data/fun_friday/season_1.json"

# --- SISTEMA DE ALIAS ---
DRIVER_ALIASES = {}

# --- MAPEO DE CATEGORÍAS PERSONALIZADO ---
CLASS_MAPPING = {}

# --- SISTEMA DE SANCIONES ---
PENALTIES = {
    "nurburgring_24h": {},
    "brands_hatch": {
        "Málnási Dániel": 15,
        "Tommi Pommi": 5,
        "Gael Duchêne ESP [SL]": 5,
    }
}

POINTS_SYSTEM = {
    1: 180, 2: 150, 3: 120, 4: 105, 5: 96,
    6: 90, 7: 84, 8: 78, 9: 72, 10: 66,
    11: 60, 12: 57, 13: 54, 14: 51, 15: 48,
    16: 45, 17: 42, 18: 39, 19: 36, 20: 33,
    21: 30, 22: 27, 23: 27, 24: 21, 25: 18,
    26: 15, 27: 12, 28: 9, 29: 6, 30: 3
}

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
        
    # Si no tiene fecha, usamos la fecha de creación del archivo temporal
    return os.path.getmtime(filename)

def get_class_by_car_model(model_id):
    try:
        model_id = int(model_id)
    except:
        return None
    
    if 50 <= model_id <= 61: return "GT4"
    elif 80 <= model_id <= 86 or model_id in [18, 29, 26]: return "GT2"
    elif model_id in [9, 28]: return "Cup"
    elif model_id == 27: return "TCX"
    elif 0 <= model_id <= 45: return "GT3"
    return None

def determine_class(model_id, fallback_group):
    cls = get_class_by_car_model(model_id)
    if not cls and fallback_group:
        fallback_str = str(fallback_group).strip()
        cls = "GT4" if fallback_str == "GT4" else fallback_str
    if not cls: cls = "GT3"
    return CLASS_MAPPING.get(cls, cls)

def clean_driver_name(raw_name):
    if not raw_name: return "Unknown"
    name = unicodedata.normalize('NFKC', raw_name)
    name = re.sub(r'[\u200B-\u200D\uFEFF]', '', name)
    name = re.sub(r'\s+', ' ', name)
    name = name.strip()
    return DRIVER_ALIASES.get(name, name)

def format_time(ms):
    if ms is None or ms == 0 or ms >= 2000000000: return "-"
    minutes = int(ms // 60000)
    seconds = int((ms % 60000) // 1000)
    milis = int(ms % 1000)
    return f"{minutes}:{seconds:02d}.{milis:03d}"

def ns_to_ms(ns):
    if ns is None or ns == 0: return 2000000000
    if ns >= 2000000000000: return 2000000000 
    return int(ns // 1000000)

def read_json(file_path):
    encodings = ['utf-8-sig', 'utf-16-le', 'utf-16', 'latin-1', 'cp1252']
    for encoding in encodings:
        try:
            with open(file_path, 'r', encoding=encoding) as f:
                return json.load(f)
        except (UnicodeError, json.JSONDecodeError, FileNotFoundError):
            continue
    return None

def parse_old_format(race_file, race_data, qualy_data):
    track_name = race_data.get('trackName', 'Unknown Track')
    race_is_wet = race_data['sessionResult'].get('isWetSession', 0)
    
    # 🚀 OBTENEMOS EL TIMESTAMP EXCLUSIVAMENTE DEL ARCHIVO DE LA CARRERA
    timestamp = extract_timestamp_from_filename(race_file)
    
    qualy_places = []
    if qualy_data:
        q_leaderboard = qualy_data['sessionResult']['leaderBoardLines']
        q_driver_cars = {}
        for line in q_leaderboard:
            raw_name = f"{line['currentDriver']['firstName']} {line['currentDriver']['lastName']}".strip()
            d_name = clean_driver_name(raw_name)
            cid = line['car']['carId']
            q_driver_cars[cid] = d_name

        q_best_laps_splits = {}
        for lap in qualy_data.get('laps', []):
            cid = lap['carId']
            d_name = q_driver_cars.get(cid)
            if not d_name: continue
            ltime = lap['laptime']
            if ltime == 0: ltime = 2000000000
            splits = lap.get('splits', [])
            if ltime < 2000000000:
                if d_name not in q_best_laps_splits or ltime < q_best_laps_splits[d_name]['laptime']:
                    q_best_laps_splits[d_name] = {'laptime': ltime, 'splits': splits}

        for line in q_leaderboard:
            fallback_group = line['car'].get('carGroup', 'GT3')
            model_id = line['car'].get('carModel', 0)
            c_class = determine_class(model_id, fallback_group)
            
            raw_name = f"{line['currentDriver']['firstName']} {line['currentDriver']['lastName']}".strip()
            d_name = clean_driver_name(raw_name)
            q_time = line['timing']['bestLap']
            if q_time == 0: q_time = 2000000000
            splits = q_best_laps_splits.get(d_name, {}).get('splits', [])
            
            qualy_places.append({
                "driver_name": d_name, "car_class": c_class, "car_model": line['car']['carModel'],
                "best_lap_ms": q_time,
                "s1_ms": splits[0] if len(splits)>0 and splits[0] else None,
                "s2_ms": splits[1] if len(splits)>1 and splits[1] else None,
                "s3_ms": splits[2] if len(splits)>2 and splits[2] else None
            })
            
    race_leaderboard = race_data['sessionResult']['leaderBoardLines']
    car_id_to_dname = {}
    car_id_to_class = {}
    for line in race_leaderboard:
        raw_name = f"{line['currentDriver']['firstName']} {line['currentDriver']['lastName']}".strip()
        d_name = clean_driver_name(raw_name)
        cid = line['car']['carId']
        fallback_group = line['car'].get('carGroup', 'GT3')
        model_id = line['car'].get('carModel', 0)
        c_class = determine_class(model_id, fallback_group)
        car_id_to_dname[cid] = d_name
        car_id_to_class[cid] = c_class

    session_best_lap = {}
    for line in race_leaderboard:
        c_class = car_id_to_class.get(line['car']['carId'], "GT3")
        bl = line['timing']['bestLap']
        if c_class not in session_best_lap: session_best_lap[c_class] = 2000000000
        if 0 < bl < session_best_lap[c_class]: session_best_lap[c_class] = bl
    
    threshold_107 = {}
    for cls, best in session_best_lap.items():
        threshold_107[cls] = best * 1.07 if best < 2000000000 else 0

    car_laps_data = {}
    for lap in race_data.get('laps', []):
        cid = lap['carId']
        d_name = car_id_to_dname.get(cid)
        if not d_name: continue
        ltime = lap['laptime']
        c_class = car_id_to_class.get(cid, "GT3")
        
        if d_name not in car_laps_data: car_laps_data[d_name] = {'valid_laps': [], 'incidents': 0, 'all_laps': []}
        
        if 0 < ltime < 2000000000:
            is_incident = threshold_107.get(c_class, 0) > 0 and ltime > threshold_107.get(c_class, 0)
            if not is_incident: car_laps_data[d_name]['valid_laps'].append(ltime)
            else: car_laps_data[d_name]['incidents'] += 1
            car_laps_data[d_name]['all_laps'].append({'time_ms': ltime, 'is_incident': is_incident})

    race_places = []
    for line in race_leaderboard:
        raw_name = f"{line['currentDriver']['firstName']} {line['currentDriver']['lastName']}".strip()
        d_name = clean_driver_name(raw_name)
        cid = line['car']['carId']
        c_class = car_id_to_class.get(cid, "GT3")
        bl = line['timing']['bestLap']
        if bl == 0: bl = 2000000000
        
        race_places.append({
            "driver_name": d_name, "car_class": c_class, "car_model": line['car']['carModel'],
            "laps_count": line['timing']['lapCount'], "total_time_ms": line['timing']['totalTime'],
            "best_lap_ms": bl, "valid_laps_ms": car_laps_data.get(d_name, {}).get('valid_laps', []),
            "incidents": car_laps_data.get(d_name, {}).get('incidents', 0),
            "lap_history": car_laps_data.get(d_name, {}).get('all_laps', [])
        })

    return {
        "timestamp": timestamp, "track_name": track_name, "multiplier": 1.0, 
        "is_wet": race_is_wet, "qualy_places": qualy_places, "race_places": race_places
    }

def parse_new_format(r_session, q_session):
    r_results = r_session.get("Results", {})
    track_name = r_results.get("TrackID", "Unknown Track")
    race_is_wet = r_results.get("IsWetSession", False)
    
    date_str = r_session.get("CompletedTime", "")
    timestamp = 0.0
    try:
        if date_str:
            date_str_clean = date_str.split(".")[0].split("+")[0].replace("Z", "")
            dt = datetime.strptime(date_str_clean, "%Y-%m-%dT%H:%M:%S")
            timestamp = dt.timestamp()
    except: pass

    duration_ns = r_session.get("Duration", 1200000000000) 
    duration_min = duration_ns / 60_000_000_000
    multiplier = duration_min / 70.0

    qualy_places = []
    if q_session:
        q_results = q_session.get("Results", {})
        for place in q_results.get("Places", []):
            drivers = place.get("Drivers") or [{}]
            raw_name = drivers[0].get("Name", "Unknown")
            d_name = clean_driver_name(raw_name)
            
            try: car_model = int(place.get("CarModelID", place.get("CarModel", "0")))
            except: car_model = 0
            fallback_group = place.get("Class", "GT3")
            c_class = determine_class(car_model, fallback_group)
            
            best_q = 2000000000
            best_splits = [None, None, None]
            for lap in (place.get("Laps") or []):
                ltime = ns_to_ms(lap.get("Time"))
                if lap.get("Valid", False) and ltime < best_q:
                    best_q = ltime
                    sectors = lap.get("Sectors", [])
                    best_splits = [ns_to_ms(s.get("Time")) for s in sectors] + [None, None, None]
            
            qualy_places.append({
                "driver_name": d_name, "car_class": c_class, "car_model": car_model,
                "best_lap_ms": best_q, "s1_ms": best_splits[0], "s2_ms": best_splits[1], "s3_ms": best_splits[2]
            })

    race_places = []
    session_best_lap = {}
    for place in r_results.get("Places", []):
        try: car_model = int(place.get("CarModelID", place.get("CarModel", "0")))
        except: car_model = 0
        fallback_group = place.get("Class", "GT3")
        c_class = determine_class(car_model, fallback_group)
        
        if c_class not in session_best_lap: session_best_lap[c_class] = 2000000000
        for lap in (place.get("Laps") or []):
            ltime = ns_to_ms(lap.get("Time"))
            if lap.get("Valid", False) and ltime < session_best_lap[c_class]:
                session_best_lap[c_class] = ltime
    
    threshold_107 = {}
    for cls, best in session_best_lap.items():
        threshold_107[cls] = best * 1.07 if best < 2000000000 else 0

    for place in r_results.get("Places", []):
        drivers = place.get("Drivers") or [{}]
        raw_name = drivers[0].get("Name", "Unknown")
        d_name = clean_driver_name(raw_name)
        
        try: car_model = int(place.get("CarModelID", place.get("CarModel", "0")))
        except: car_model = 0
        fallback_group = place.get("Class", "GT3")
        c_class = determine_class(car_model, fallback_group)

        laps_count = len(place.get("Laps") or [])
        total_time_ms = ns_to_ms(place.get("TotalRaceTime"))
        
        best_lap_ms = 2000000000
        valid_laps_ms = []
        incidents = 0
        all_laps = []

        for lap in (place.get("Laps") or []):
            ltime = ns_to_ms(lap.get("Time"))
            if lap.get("Valid", False) and ltime < best_lap_ms:
                best_lap_ms = ltime
            
            is_incident = (threshold_107.get(c_class, 0) > 0 and ltime > threshold_107.get(c_class, 0)) or not lap.get("Valid", True)
            if not is_incident: valid_laps_ms.append(ltime)
            else: incidents += 1
            all_laps.append({'time_ms': ltime, 'is_incident': is_incident})

        race_places.append({
            "driver_name": d_name, "car_class": c_class, "car_model": car_model,
            "laps_count": laps_count, "total_time_ms": total_time_ms, "best_lap_ms": best_lap_ms,
            "valid_laps_ms": valid_laps_ms, "incidents": incidents, "lap_history": all_laps
        })

    return {
        "timestamp": timestamp, "track_name": track_name, "multiplier": multiplier,
        "is_wet": race_is_wet, "qualy_places": qualy_places, "race_places": race_places
    }

def create_driver_stats():
    return {
        "cars": {}, "total_points": 0, "races": 0, "pos_sum": 0, "pos_count": 0, 
        "pace_pos_sum": 0, "pace_pos_count": 0, "pos_gained_vs_pace": 0, 
        "gap_pace_sum_ms": 0, "gap_count": 0, "qualy_pos_sum": 0, 
        "qualy_pos_count": 0, "qualy_gap_sum_ms": 0, "qualy_gap_count": 0, 
        "net_pos_gained_vs_qualy": 0
    }

def add_stats_to_target(target, d, track_name):
    target["cars"][d['car_model']] = target["cars"].get(d['car_model'], 0) + 1
    if d['gets_points']:
        target["races"] += 1 
        target["total_points"] += d['points']
        target["pos_sum"] += d['real_pos_num']
        target["pos_count"] += 1
        if d['pace_pos'] != "-":
            target["pos_gained_vs_pace"] += (d['pace_pos'] - d['real_pos_num'])

    if d['pace_pos'] != "-":
        target["pace_pos_sum"] += d['pace_pos']
        target["pace_pos_count"] += 1

    if d['has_valid_pace_gap'] and track_name != "nurburgring_24h":
        target["gap_pace_sum_ms"] += d['gap_pace_ms']
        target["gap_count"] += 1

    if d['qualy_pos'] != "-":
        target["qualy_pos_sum"] += d['qualy_pos']
        target["qualy_pos_count"] += 1
        if d['gets_points'] and d['net_vs_q'] != "-":
            target["net_pos_gained_vs_qualy"] += d['net_vs_q']
        if track_name != "nurburgring_24h" and d['qualy_gap_ms'] is not None:
            target["qualy_gap_sum_ms"] += d['qualy_gap_ms']
            target["qualy_gap_count"] += 1

def compute_averages(data):
    avg_points = data["total_points"] / data["races"] if data["races"] > 0 else 0
    avg_pos_str = round(data["pos_sum"] / data["pos_count"], 1) if data["pos_count"] > 0 else "-" 
    avg_pace_pos_str = round(data["pace_pos_sum"] / data["pace_pos_count"], 1) if data["pace_pos_count"] > 0 else "-"
    avg_gap_str = f"+{data['gap_pace_sum_ms']/data['gap_count']/1000:.3f}" if data["gap_count"] > 0 else "-"
    avg_q_pos_str = round(data["qualy_pos_sum"] / data["qualy_pos_count"], 1) if data["qualy_pos_count"] > 0 else "-" 
    avg_q_gap_str = f"+{data['qualy_gap_sum_ms']/data['qualy_gap_count']/1000:.3f}" if data["qualy_gap_count"] > 0 else "-"
    favorite_car_id = max(data["cars"], key=data["cars"].get) if data["cars"] else 0
    return {
        "favorite_car": favorite_car_id,
        "points": data["total_points"], "avg_points": round(avg_points, 2),
        "avg_pos": avg_pos_str, "avg_pace_pos": avg_pace_pos_str, "net_pos_gained": data["pos_gained_vs_pace"],
        "avg_qualy_pos": avg_q_pos_str, "avg_qualy_gap": avg_q_gap_str,
        "net_pos_gained_qualy": data["net_pos_gained_vs_qualy"], "avg_gap": avg_gap_str, "races": data["races"] 
    }

def load_and_process():
    unified_sessions = []
    raw_files = []
    
    # 🚀 RECORRIDO POR LA NUBE
    if os.path.exists(BASE_SYNC_FOLDER):
        for root, dirs, files in os.walk(BASE_SYNC_FOLDER):
            for file in files:
                if file.lower().endswith('.json'):
                    raw_files.append(os.path.join(root, file))
    else:
        print(f"⚠️ La carpeta base {BASE_SYNC_FOLDER} no existe.")
        return
        
    unique_files = {os.path.realpath(f): f for f in raw_files if os.path.basename(f) != os.path.basename(OUTPUT_FILE)}
    all_files = list(unique_files.values())
    
    # 🚀 ORDENAMOS LOS ARCHIVOS POR LA FECHA DE SU NOMBRE
    all_files.sort(key=extract_timestamp_from_filename)

    qualy_sessions = []
    race_sessions = []
    seen_fingerprints = set()

    for f in all_files:
        data = read_json(f)
        if not data or 'sessionResult' not in data: continue
        try: fingerprint = f"{data.get('trackName', 'unk')}_{data['sessionResult'].get('bestlap', 0)}"
        except: fingerprint = f
        if fingerprint in seen_fingerprints: continue
        seen_fingerprints.add(fingerprint)

        session_type = data.get('sessionType', '').upper()
        if not session_type:
            if '_Q' in f.upper(): session_type = 'Q'
            elif '_R' in f.upper(): session_type = 'R'

        if session_type == 'Q': qualy_sessions.append((f, data))
        elif session_type in ['R', 'R1', 'R2']: race_sessions.append((f, data))

    qualy_sessions_by_track = {}
    for f, q_data in qualy_sessions:
        t_name = q_data.get('trackName', 'Unknown Track')
        if t_name not in qualy_sessions_by_track: qualy_sessions_by_track[t_name] = []
        qualy_sessions_by_track[t_name].append((f, q_data))

    for f, race_data in race_sessions:
        t_name = race_data.get('trackName', 'Unknown Track')
        q_data = None
        if t_name in qualy_sessions_by_track and len(qualy_sessions_by_track[t_name]) > 0:
            _, q_data = qualy_sessions_by_track[t_name].pop(0)
        unified_sessions.append(parse_old_format(f, race_data, q_data))

    # Búsqueda de campeonatos modernos (formato nuevo)
    champ_files = [f for f in all_files if read_json(f) and "Championship" in read_json(f)]

    for f in champ_files:
        data = read_json(f)
        if not data or "Championship" not in data: continue
        for event in data["Championship"].get("Events", []):
            qualys = [s for s in event.get("Sessions", []) if s.get("Type") == 1]
            races = [s for s in event.get("Sessions", []) if s.get("Type") == 2]
            
            for i, r_session in enumerate(races):
                q_session = qualys[i] if i < len(qualys) else (qualys[0] if qualys else None)
                unified_sessions.append(parse_new_format(r_session, q_session))

    # Orden cronológico absoluto de todas las carreras unificadas
    unified_sessions.sort(key=lambda s: s["timestamp"])

    global_drivers = {} 
    session_list = [] 
    hall_of_fame = {}

    for s_index, session in enumerate(unified_sessions):
        track_name = session["track_name"]
        if track_name not in hall_of_fame: hall_of_fame[track_name] = {"name": track_name.replace('_', ' ').title()}

        qualy_dict = {}
        qualy_pole_ms = {}
        valid_q_pos = {}
        
        for qp in session["qualy_places"]:
            cls = qp["car_class"]
            if cls not in qualy_pole_ms:
                qualy_pole_ms[cls] = 2000000000
                valid_q_pos[cls] = 1
            if qp["best_lap_ms"] < 2000000000 and qp["best_lap_ms"] < qualy_pole_ms[cls]:
                qualy_pole_ms[cls] = qp["best_lap_ms"]

        session["qualy_places"].sort(key=lambda p: p["best_lap_ms"] if p["best_lap_ms"] < 2000000000 else float('inf'))
        
        for qp in session["qualy_places"]:
            cls = qp["car_class"]
            best_ms = qp["best_lap_ms"]
            is_valid = best_ms < 2000000000
            
            pos = valid_q_pos[cls] if is_valid else "-"
            gap_ms = best_ms - qualy_pole_ms[cls] if is_valid and qualy_pole_ms[cls] < 2000000000 else None
            
            qualy_dict[qp["driver_name"]] = {
                "pos": pos, "time_ms": best_ms if is_valid else None, "gap_ms": gap_ms,
                "s1": format_time(qp["s1_ms"]), "s2": format_time(qp["s2_ms"]), "s3": format_time(qp["s3_ms"]),
                "car_model": qp["car_model"], "car_class": cls
            }
            if is_valid: 
                valid_q_pos[cls] += 1
                if cls not in hall_of_fame[track_name]:
                    hall_of_fame[track_name][cls] = {"qualy": {"time_ms": 2000000000, "driver": "-", "car": 0, "wet": 0}, "race": {"time_ms": 2000000000, "driver": "-", "car": 0, "wet": 0}}
                if best_ms < hall_of_fame[track_name][cls]["qualy"]["time_ms"]:
                    hall_of_fame[track_name][cls]["qualy"] = {"time_ms": best_ms, "driver": qp["driver_name"], "car": qp["car_model"], "wet": session["is_wet"]}
                
        for rp in session["race_places"]:
            d_name = rp["driver_name"]
            penalty_sec = PENALTIES.get(track_name, {}).get(d_name, 0)
            if penalty_sec > 0 and rp["total_time_ms"] < 2000000000:
                rp["total_time_ms"] += (penalty_sec * 1000)
                rp["penalty"] = penalty_sec
            else: rp["penalty"] = 0
                
        session["race_places"].sort(key=lambda p: (-p["laps_count"], p["total_time_ms"]))

        session_best_lap = {}
        max_laps_session = {}
        class_driver_counts = {} 

        for rp in session["race_places"]:
            cls = rp["car_class"]
            if cls not in session_best_lap:
                session_best_lap[cls] = 2000000000
                max_laps_session[cls] = 0
                class_driver_counts[cls] = 0 
            if rp["laps_count"] > max_laps_session[cls]: max_laps_session[cls] = rp["laps_count"]
            if rp["best_lap_ms"] < session_best_lap[cls]: session_best_lap[cls] = rp["best_lap_ms"]
            class_driver_counts[cls] += 1 

        min_laps_stats = {cls: max_laps_session[cls] * MIN_LAPS_STATS for cls in max_laps_session}
        min_laps_classified = {cls: max_laps_session[cls] * MIN_LAPS_CLASSIFIED for cls in max_laps_session}

        session_best_avg_pace = {cls: 2000000000 for cls in max_laps_session}
        for rp in session["race_places"]:
            cls = rp["car_class"]
            if rp["total_time_ms"] > 2000000000 or rp["laps_count"] < min_laps_stats.get(cls, 0): continue
            if rp["valid_laps_ms"]:
                pace = sum(rp["valid_laps_ms"]) / len(rp["valid_laps_ms"])
                if pace < session_best_avg_pace[cls]: session_best_avg_pace[cls] = pace

        temp_drivers = []
        valid_pos_counter = {cls: 1 for cls in max_laps_session}
        seen_session_pids = set()
        leader_laps = {cls: 0 for cls in max_laps_session}
        leader_time = {cls: 0 for cls in max_laps_session}

        for rp in session["race_places"]:
            d_name = rp["driver_name"]
            cls = rp["car_class"]
            session_pid = f"{d_name}::{cls}" 
            
            if session_pid in seen_session_pids: continue
            seen_session_pids.add(session_pid)
            
            laps = rp["laps_count"]
            total_time = rp["total_time_ms"]
            best_lap = rp["best_lap_ms"]

            valid_class_size = class_driver_counts.get(cls, 0) >= 4
            has_stats = laps >= min_laps_stats.get(cls, 0) and valid_class_size
            gets_points = laps >= min_laps_classified.get(cls, 0) and valid_class_size
            race_gap_str = "-"
            
            if gets_points:
                display_pos = valid_pos_counter[cls]
                real_pos_num = valid_pos_counter[cls]
                base_points = POINTS_SYSTEM.get(valid_pos_counter[cls], 0)
                points = round(base_points * session["multiplier"])
                
                if valid_pos_counter[cls] == 1:
                    leader_laps[cls] = laps
                    leader_time[cls] = total_time
                    race_gap_str = "WINNER"
                else:
                    if laps == leader_laps[cls]:
                        gap_ms = total_time - leader_time[cls]
                        race_gap_str = f"+{gap_ms/1000:.3f}s"
                    else:
                        laps_behind = leader_laps[cls] - laps
                        race_gap_str = f"+{laps_behind} Lap{'s' if laps_behind > 1 else ''}"

                if cls not in hall_of_fame[track_name]:
                    hall_of_fame[track_name][cls] = {"qualy": {"time_ms": 2000000000, "driver": "-", "car": 0, "wet": 0}, "race": {"time_ms": 2000000000, "driver": "-", "car": 0, "wet": 0}}
                if best_lap < 2000000000 and best_lap < hall_of_fame[track_name][cls]["race"]["time_ms"]:
                    hall_of_fame[track_name][cls]["race"] = {"time_ms": best_lap, "driver": d_name, "car": rp["car_model"], "wet": session["is_wet"]}
                valid_pos_counter[cls] += 1
            else:
                display_pos = "DNF"
                real_pos_num = -1
                points = 0
                if has_stats: race_gap_str = "DNF"

            avg_lap_driver_ms = sum(rp["valid_laps_ms"]) / len(rp["valid_laps_ms"]) if rp["valid_laps_ms"] and has_stats else None
            
            gap_pace_str = "-"
            current_pace_gap_ms = 0
            has_valid_pace_gap = False
            if has_stats and avg_lap_driver_ms and session_best_avg_pace.get(cls, 2000000000) < 2000000000:
                diff = avg_lap_driver_ms - session_best_avg_pace[cls]
                gap_pace_str = f"+{diff/1000:.3f}" if diff > 0 else "PACE REF"
                current_pace_gap_ms = diff
                has_valid_pace_gap = True

            gap_best_str = "-"
            current_best_gap_ms = 0
            if has_stats and best_lap < 2000000000 and session_best_lap.get(cls, 2000000000) < 2000000000:
                diff = best_lap - session_best_lap[cls]
                gap_best_str = f"+{diff/1000:.3f}" if diff > 0 else "BEST LAP"
                current_best_gap_ms = diff

            q_info = qualy_dict.get(d_name, None)
            q_pos = q_info['pos'] if q_info else "-"
            q_time_str = format_time(q_info['time_ms']) if q_info and q_info['time_ms'] else "-"
            q_gap_ms = q_info['gap_ms'] if q_info else None
            q_gap_str = "-"
            if q_info and q_gap_ms is not None:
                q_gap_str = "POLE" if q_gap_ms == 0 else f"+{q_gap_ms/1000:.3f}s"
            
            net_vs_q = q_pos - real_pos_num if gets_points and q_pos != "-" else "-"

            temp_drivers.append({
                "global_pid": d_name, "car_class": cls, "has_stats": has_stats, "gets_points": gets_points, 
                "real_pos_num": real_pos_num, "pos": display_pos, 
                "qualy_pos": q_pos, "qualy_time": q_time_str, "qualy_time_ms": q_info['time_ms'] if q_info else None, 
                "qualy_gap": q_gap_str, "qualy_gap_ms": q_gap_ms, "net_vs_q": net_vs_q,
                "name": d_name, "car_model": rp["car_model"], "points": points,
                "laps": laps, "incidents": rp["incidents"] if has_stats else "-", 
                "avg_time": format_time(avg_lap_driver_ms) if has_stats else "-",
                "avg_lap_ms": avg_lap_driver_ms, "lap_history": rp["lap_history"], 
                "gap_pace_ms": current_pace_gap_ms, "gap_best_ms": current_best_gap_ms, 
                "has_valid_pace_gap": has_valid_pace_gap, "gap_pace": gap_pace_str,
                "best_lap": format_time(best_lap) if has_stats and best_lap < 2000000000 else "-",
                "best_lap_ms": best_lap if has_stats and best_lap < 2000000000 else None,
                "gap_best": gap_best_str, "penalty": rp["penalty"], "race_gap": race_gap_str
            })

        present_classes = set(d['car_class'] for d in temp_drivers)
        for cls in present_classes:
            valid_paces = [d for d in temp_drivers if d['avg_lap_ms'] is not None and d['has_stats'] and d['car_class'] == cls]
            valid_paces.sort(key=lambda x: x['avg_lap_ms'])
            for i, d in enumerate(valid_paces): d['pace_pos'] = i + 1
        
        for d in temp_drivers:
            if 'pace_pos' not in d: d['pace_pos'] = "-"

        session_results = []
        qualy_results_export = [] 
        
        for d_name, q_info in qualy_dict.items():
            q_gap_str = "-"
            if q_info['gap_ms'] is not None:
                q_gap_str = "POLE" if q_info['gap_ms'] == 0 else f"+{q_info['gap_ms']/1000:.3f}s"
                
            qualy_results_export.append({
                "pos": q_info['pos'], "name": d_name, "car_class": q_info['car_class'],
                "car_model": q_info['car_model'], "s1": q_info['s1'], "s2": q_info['s2'], "s3": q_info['s3'],
                "best_lap": format_time(q_info['time_ms']) if q_info['time_ms'] else "NO TIME", 
                "gap_pole": q_gap_str, "gap_pole_ms": q_info['gap_ms']
            })

        qualy_results_export.sort(key=lambda x: (x['car_class'], x['pos'] if isinstance(x['pos'], int) else 9999))

        for d in temp_drivers:
            global_pid = d['global_pid']
            c_class = d['car_class']
            
            if not d['has_stats']: 
                d_export = d.copy()
                del d_export['global_pid'], d_export['has_stats'], d_export['gets_points'], d_export['real_pos_num'], d_export['has_valid_pace_gap']
                session_results.append(d_export)
                continue 
            
            if global_pid not in global_drivers:
                global_drivers[global_pid] = {
                    "name": d['name'], "car_classes": set(),
                    "overall": create_driver_stats(),
                    "by_class": {}
                }
            
            if c_class not in global_drivers[global_pid]["by_class"]:
                global_drivers[global_pid]["by_class"][c_class] = create_driver_stats()
                
            global_drivers[global_pid]["car_classes"].add(c_class)
            
            add_stats_to_target(global_drivers[global_pid]["overall"], d, track_name)
            add_stats_to_target(global_drivers[global_pid]["by_class"][c_class], d, track_name)

            d_export = d.copy()
            del d_export['global_pid'], d_export['has_stats'], d_export['gets_points'], d_export['real_pos_num'], d_export['has_valid_pace_gap']
            session_results.append(d_export)

        # 🚀 FORMATEAMOS LA FECHA PARA LA WEB
        formatted_date = datetime.fromtimestamp(session["timestamp"]).strftime('%Y-%m-%d %H:%M') if session["timestamp"] > 0 else "Unknown Date"

        session_list.append({
            "id": f"race_{s_index}",
            "name": f"Round {s_index + 1}: {track_name.replace('_', ' ').title()}",
            "date": formatted_date, # 🚀 GUARDAMOS LA FECHA EN EL JSON FINAL
            "timestamp": session["timestamp"], # 🚀 GUARDAMOS EL TIMESTAMP BRUTO PARA EL ELO
            "results": session_results,
            "qualy_results": qualy_results_export 
        })

    final_ranking = []
    for pid, gdata in global_drivers.items():
        if gdata["overall"]["pace_pos_count"] == 0 and gdata["overall"]["qualy_pos_count"] == 0 and gdata["overall"]["races"] == 0: 
            continue

        car_class_str = " / ".join(sorted(list(gdata["car_classes"])))
        overall_stats = compute_averages(gdata["overall"])
        
        class_stats_dict = {}
        for cls, cls_data in gdata["by_class"].items():
            class_stats_dict[cls] = compute_averages(cls_data)

        driver_entry = {
            "name": gdata["name"],
            "car_class": car_class_str,
            "class_stats": class_stats_dict
        }
        driver_entry.update(overall_stats)
        
        final_ranking.append(driver_entry)
    
    final_ranking.sort(key=lambda x: (-x["points"], float(x["avg_gap"].replace('+', '')) if x["avg_gap"] != "-" else 2000000000))

    for track, record in hall_of_fame.items():
        for cls, cls_data in record.items():
            if cls == "name": continue
            if cls_data["qualy"]["time_ms"] == 2000000000: cls_data["qualy"]["time_ms"] = None
            if cls_data["race"]["time_ms"] == 2000000000: cls_data["race"]["time_ms"] = None

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    mega_json = {
        "global": final_ranking,
        "sessions": session_list,
        "hall_of_fame": hall_of_fame 
    }

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(mega_json, f, indent=2)
    
    print(f"✅ Dashboard updated: {OUTPUT_FILE}")

if __name__ == "__main__":
    load_and_process()