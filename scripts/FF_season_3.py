import json
import os
import re
from collections import defaultdict

# --- CONFIGURACIÓN ---
MIN_LAPS_STATS = 0.50        
MIN_LAPS_CLASSIFIED = 0.90   

# Rutas: Ajústalas a las de tu entorno local / GitHub Actions
BASE_SYNC_FOLDER = "public/data/gdrive_sync/FF/season_3"
OUTPUT_FILE = "public/data/fun_friday/season_3.json"

# Nombres bonitos para que salgan espectaculares en la web
ROUND_NAMES = {
    "R1": "Round 1: Carbonara Cup (Imola / Misano)",
    "R2": "Round 2: The Commonwealth (Silverstone / Bathurst)",
    "R3": "Round 3: The Curbs Are Lava (Zolder)",
    "R4": "Round 4: 4 Is More Than 3!? (Nürburgring 24H)",
    "R5": "Round 5: Japanese Showdown (Suzuka)",
    "R6": "Round 6: Which Way? (Indianapolis)",
    "R7": "Round 7: Speed Kills (Monza)",
    "R8": "Round 8: Mirror-Watching Masterclass (Watkins Glen)"
}

PENALTIES = {
}

POINTS_SYSTEM = {
    1: 180, 2: 150, 3: 120, 4: 105, 5: 96,
    6: 90, 7: 84, 8: 78, 9: 72, 10: 66,
    11: 60, 12: 57, 13: 54, 14: 51, 15: 48,
    16: 45, 17: 42, 18: 39, 19: 36, 20: 33,
    21: 30, 22: 27, 23: 24, 24: 21, 25: 18,
    26: 15, 27: 12, 28: 9, 29: 6, 30: 3
}

def format_time(ms):
    if ms is None or ms == 0 or ms >= 2000000000: 
        return "-"
    minutes = int(ms // 60000)
    seconds = int((ms % 60000) // 1000)
    milis = int(ms % 1000)
    return f"{minutes}:{seconds:02d}.{milis:03d}"

def read_json(file_path):
    encodings = ['utf-8-sig', 'utf-16-le', 'utf-16', 'latin-1', 'cp1252']
    for encoding in encodings:
        try:
            with open(file_path, 'r', encoding=encoding) as f:
                return json.load(f)
        except (UnicodeError, json.JSONDecodeError, UnicodeDecodeError):
            continue
    return None

def custom_sort_leaderboard(line):
    laps = line['timing']['lapCount']
    ttime = line['timing']['totalTime']
    return (-laps, ttime)

def get_car_class(car_model, car_group=""):
    """Detector infalible basado en el ID oficial de ACC y con fallback a texto"""
    try:
        model = int(car_model)
    except (TypeError, ValueError):
        model = 0
        
    # Rangos oficiales de modelos en ACC
    if 50 <= model <= 61: return "GT4"
    if model in [80, 82, 83, 84, 85, 86, 18, 29, 26]: return "GT2" # O ajustes de copa/challenge según tu configuración
    if model in [9, 28, 26]: return "CUP" # Incluimos modelos de Porsche Cup / Challange comunes
    if model == 27: return "TCX"
    if 0 <= model <= 45: return "GT3"
    
    # Si el ID no encaja, tiramos del texto del servidor como respaldo
    grp = str(car_group).upper()
    if "GT4" in grp: return "GT4"
    if "TCX" in grp: return "TCX"
    if "CUP" in grp or "GTC" in grp or "CHL" in grp or "ST" in grp: return "CUP"
    return "GT3"

def load_and_process():
    global_drivers = {} 
    session_list = [] 
    hall_of_fame = {}

    if not os.path.exists(BASE_SYNC_FOLDER):
        print(f"⚠️ La carpeta base {BASE_SYNC_FOLDER} no existe.")
        return

    # 1. Agrupar archivos por carpeta (R1, R2, R3...)
    rounds_files = defaultdict(list)
    for root, dirs, files in os.walk(BASE_SYNC_FOLDER):
        folder_name = os.path.basename(root).upper()
        if re.match(r'^R\d+$', folder_name):
            for file in files:
                if file.lower().endswith('.json'):
                    rounds_files[folder_name].append(os.path.join(root, file))

    # Ordenar las rondas lógicamente (R1, R2, R3...)
    round_keys = sorted(rounds_files.keys(), key=lambda x: int(x.replace('R', '')))

    # 2. Procesar Ronda a Ronda
    for r_key in round_keys:
        all_files = rounds_files[r_key]
        archivos_parseados = []
        
        for f in all_files:
            data = read_json(f)
            if not data or 'sessionResult' not in data: continue
            archivos_parseados.append((f, data))

        # Ordenar archivos alfabéticamente para asegurar que Race 1 vaya antes que Race 2
        archivos_parseados.sort(key=lambda x: x[0]) 

        qualy_sessions = []
        race_sessions = []
        for f, data in archivos_parseados:
            session_type = data.get('sessionType', '').upper()
            if not session_type:
                if '_Q' in f.upper(): session_type = 'Q'
                elif '_R' in f.upper(): session_type = 'R'
            
            if session_type == 'Q': qualy_sessions.append(data)
            else: race_sessions.append(data)

        round_races_data = []

        # 3. Extraer estadísticas de cada carrera de la ronda
        for file_index, race_data in enumerate(race_sessions):
            track_name = race_data.get('trackName', 'Unknown Track')
            race_leaderboard = race_data['sessionResult']['leaderBoardLines']
            race_is_wet = race_data['sessionResult'].get('isWetSession', 0)

            # Inicializar Hall of Fame dinámicamente para todas las clases
            if track_name not in hall_of_fame:
                hall_of_fame[track_name] = {"name": track_name.replace('_', ' ').title()}
                for cls_name in ["GT3", "GT4", "TCX", "CUP"]:
                    hall_of_fame[track_name][cls_name] = {
                        "qualy": {"time_ms": 2000000000, "driver": "-", "car": 0, "wet": 0},
                        "race": {"time_ms": 2000000000, "driver": "-", "car": 0, "wet": 0}
                    }

            for line in race_leaderboard:
                driver_name = f"{line['currentDriver']['firstName']} {line['currentDriver']['lastName']}".strip()
                penalty_sec = PENALTIES.get(track_name, {}).get(driver_name, 0)
                ttime = line['timing']['totalTime']
                if penalty_sec != 0 and 0 < ttime < 2000000000:
                    line['timing']['totalTime'] += (penalty_sec * 1000)
                    line['penalty_applied'] = penalty_sec
                else:
                    line['penalty_applied'] = 0

            race_leaderboard.sort(key=custom_sort_leaderboard)

            car_id_to_class = {}
            for line in race_leaderboard:
                cid = line['car']['carId']
                car_id_to_class[cid] = get_car_class(line['car'].get('carModel', 0), line['car'].get('carGroup', ''))

            qualy_dict = {}
            qualy_pole_ms = defaultdict(lambda: 2000000000)
            
            # Asociar la Qualy correspondiente a esta carrera (si hay)
            q_data = qualy_sessions.pop(0) if len(qualy_sessions) > 0 else None
            
            if q_data:
                q_leaderboard = q_data['sessionResult']['leaderBoardLines']
                q_is_wet = q_data['sessionResult'].get('isWetSession', 0)
                
                best_q_lines = {}
                for line in q_leaderboard:
                    d_name = f"{line['currentDriver']['firstName']} {line['currentDriver']['lastName']}".strip()
                    c_class = get_car_class(line['car']['carGroup'])
                    q_pid = f"{d_name}::{c_class}"
                    q_time = line['timing']['bestLap']
                    
                    if q_pid not in best_q_lines or q_time < best_q_lines[q_pid]['timing']['bestLap']:
                        best_q_lines[q_pid] = line
                            
                sorted_q_lines = sorted(best_q_lines.values(), key=lambda x: x['timing']['bestLap'])

                q_driver_cars = {line['car']['carId']: f"{line['currentDriver']['firstName']} {line['currentDriver']['lastName']}".strip() + "::" + get_car_class(line['car']['carGroup']) for line in sorted_q_lines}

                q_best_laps_splits = {}
                for lap in q_data.get('laps', []):
                    q_pid = q_driver_cars.get(lap['carId'])
                    if not q_pid: continue
                    ltime = lap['laptime']
                    if ltime < 2000000000:
                        if q_pid not in q_best_laps_splits or ltime < q_best_laps_splits[q_pid]['laptime']:
                            q_best_laps_splits[q_pid] = {'laptime': ltime, 'splits': lap.get('splits', [])}
                
                for line in sorted_q_lines:
                    c_class = get_car_class(line['car']['carGroup'])
                    bl = line['timing']['bestLap']
                    if bl < 2000000000 and bl < qualy_pole_ms[c_class]:
                        qualy_pole_ms[c_class] = bl

                valid_q_pos = defaultdict(lambda: 1)
                for line in sorted_q_lines:
                    c_class = get_car_class(line['car']['carGroup'])
                    driver_name = f"{line['currentDriver']['firstName']} {line['currentDriver']['lastName']}".strip()
                    q_pid = f"{driver_name}::{c_class}"
                    q_time = line['timing']['bestLap']
                    
                    splits = q_best_laps_splits.get(q_pid, {}).get('splits', [])
                    s1 = format_time(splits[0]) if len(splits) > 0 and splits[0] else "-"
                    s2 = format_time(splits[1]) if len(splits) > 1 and splits[1] else "-"
                    s3 = format_time(splits[2]) if len(splits) > 2 and splits[2] else "-"
                    
                    is_valid = q_time < 2000000000
                    pos = valid_q_pos[c_class] if is_valid else "-"
                    gap_ms = q_time - qualy_pole_ms[c_class] if is_valid and qualy_pole_ms[c_class] < 2000000000 else None

                    qualy_dict[q_pid] = {
                        "pos": pos, "time_ms": q_time if is_valid else None, "gap_ms": gap_ms,
                        "s1": s1, "s2": s2, "s3": s3, "car_model": line['car']['carModel'],
                        "car_class": c_class, "d_name": driver_name
                    }
                    
                    if is_valid and q_time < hall_of_fame[track_name][c_class]["qualy"]["time_ms"]:
                        hall_of_fame[track_name][c_class]["qualy"] = {
                            "time_ms": q_time, "driver": driver_name,
                            "car": line['car']['carModel'], "wet": q_is_wet
                        }
                    if is_valid: valid_q_pos[c_class] += 1
            
            session_best_lap = defaultdict(lambda: 2000000000)
            max_laps_session = defaultdict(int)

            for line in race_leaderboard:
                c_class = get_car_class(line['car']['carGroup'])
                timing = line['timing']
                if timing['lapCount'] > max_laps_session[c_class]: max_laps_session[c_class] = timing['lapCount']
                if timing['bestLap'] < 2000000000 and timing['bestLap'] < session_best_lap[c_class]:
                    session_best_lap[c_class] = timing['bestLap']

            min_laps_stats = {cls: max_laps_session[cls] * MIN_LAPS_STATS for cls in max_laps_session}
            min_laps_classified = {cls: max_laps_session[cls] * MIN_LAPS_CLASSIFIED for cls in max_laps_session}
            threshold_107 = {cls: session_best_lap[cls] * 1.07 if session_best_lap[cls] < 2000000000 else 0 for cls in session_best_lap}

            car_laps_data = defaultdict(lambda: {'valid_laps': [], 'incidents': 0, 'all_laps': []})
            for lap in race_data.get('laps', []):
                cid = lap['carId']
                ltime = lap['laptime']
                c_class = car_id_to_class.get(cid, "GT3")
                
                if ltime < 2000000000:
                    is_incident = threshold_107.get(c_class, 0) > 0 and ltime > threshold_107.get(c_class, 0)
                    if not is_incident: car_laps_data[cid]['valid_laps'].append(ltime)
                    else: car_laps_data[cid]['incidents'] += 1
                    car_laps_data[cid]['all_laps'].append({'time_ms': ltime, 'is_incident': is_incident})

            session_best_avg_pace = defaultdict(lambda: 2000000000)
            for line in race_leaderboard:
                c_class = get_car_class(line['car']['carGroup'])
                timing = line['timing']
                if timing['totalTime'] > 2000000000 or timing['lapCount'] < min_laps_stats.get(c_class, 0): continue
                
                valid_laps = car_laps_data[line['car']['carId']]['valid_laps']
                if valid_laps:
                    pace = sum(valid_laps) / len(valid_laps)
                    if pace < session_best_avg_pace[c_class]: session_best_avg_pace[c_class] = pace

            temp_drivers = []
            valid_pos_counter = defaultdict(lambda: 1)
            seen_pids = set()
            leader_laps = defaultdict(int)
            leader_time = defaultdict(int)

            for line in race_leaderboard:
                c_class = get_car_class(line['car']['carGroup'])
                driver = line['currentDriver']
                name = f"{driver['firstName']} {driver['lastName']}".strip() 
                pid = f"{name}::{c_class}" 
                
                if pid in seen_pids: continue
                seen_pids.add(pid)
                
                car_id, car_model = line['car']['carId'], line['car']['carModel']
                laps, total_time, best_lap = line['timing']['lapCount'], line['timing']['totalTime'], line['timing']['bestLap']
                penalty_applied = line.get('penalty_applied', 0)

                has_stats = laps >= min_laps_stats.get(c_class, 0)
                gets_points = laps >= min_laps_classified.get(c_class, 0)
                race_gap_str = "-"
                
                if gets_points:
                    display_pos = valid_pos_counter[c_class]
                    real_pos_num = valid_pos_counter[c_class]
                    
                    if valid_pos_counter[c_class] == 1:
                        leader_laps[c_class] = laps
                        leader_time[c_class] = total_time
                        race_gap_str = "WINNER"
                    else:
                        if laps == leader_laps[c_class]: race_gap_str = f"+{(total_time - leader_time[c_class])/1000:.3f}s"
                        else: race_gap_str = f"+{leader_laps[c_class] - laps} Lap(s)"

                    if best_lap < 2000000000 and best_lap < hall_of_fame[track_name][c_class]["race"]["time_ms"]:
                        hall_of_fame[track_name][c_class]["race"] = {"time_ms": best_lap, "driver": name, "car": car_model, "wet": race_is_wet}
                    valid_pos_counter[c_class] += 1
                else:
                    display_pos, real_pos_num = "DNF", -1
                    if has_stats: race_gap_str = "DNF"

                valid_laps = car_laps_data[car_id]['valid_laps']
                incidents = car_laps_data[car_id]['incidents'] if has_stats else "-"
                avg_lap_driver_ms = sum(valid_laps) / len(valid_laps) if valid_laps and has_stats else None
                
                gap_pace_str, current_pace_gap_ms, has_valid_pace_gap = "-", 0, False
                if has_stats and avg_lap_driver_ms and session_best_avg_pace[c_class] < 2000000000:
                    diff = avg_lap_driver_ms - session_best_avg_pace[c_class]
                    gap_pace_str = f"+{diff/1000:.3f}" if diff > 0 else "PACE REF"
                    current_pace_gap_ms, has_valid_pace_gap = diff, True

                gap_best_str, current_best_gap_ms = "-", 0
                if has_stats and best_lap < 2000000000 and session_best_lap[c_class] < 2000000000:
                    diff = best_lap - session_best_lap[c_class]
                    gap_best_str = f"+{diff/1000:.3f}" if diff > 0 else "BEST LAP"
                    current_best_gap_ms = diff

                q_info = qualy_dict.get(pid, None)
                q_pos = q_info['pos'] if q_info and q_info['pos'] != "-" else "-"
                net_vs_q = q_pos - real_pos_num if gets_points and q_pos != "-" else "-"

                temp_drivers.append({
                    "pid": pid, "car_class": c_class, "has_stats": has_stats, "gets_points": gets_points, 
                    "real_pos_num": real_pos_num, "pos": display_pos, 
                    "total_time_ms": total_time if gets_points else 9999999999, # VITAL PARA TIE-BREAKER
                    "qualy_pos": q_pos, "qualy_time": format_time(q_info['time_ms']) if q_info else "-", 
                    "qualy_time_ms": q_info['time_ms'] if q_info and q_pos != "-" else None, 
                    "s1": q_info['s1'] if q_info else "-", "s2": q_info['s2'] if q_info else "-", "s3": q_info['s3'] if q_info else "-",
                    "qualy_gap": "POLE" if q_info and q_info['gap_ms'] == 0 else (f"+{q_info['gap_ms']/1000:.3f}s" if q_info and q_info['gap_ms'] else "-"), 
                    "qualy_gap_ms": q_info['gap_ms'] if q_info else None, "net_vs_q": net_vs_q,
                    "name": name, "car_model": car_model, 
                    "laps": laps, "incidents": incidents, 
                    "avg_time": format_time(avg_lap_driver_ms) if has_stats else "-",
                    "avg_lap_ms": avg_lap_driver_ms, "lap_history": car_laps_data[car_id]['all_laps'], 
                    "gap_pace_ms": current_pace_gap_ms, "gap_best_ms": current_best_gap_ms, 
                    "has_valid_pace_gap": has_valid_pace_gap, "gap_pace": gap_pace_str,
                    "best_lap": format_time(best_lap) if has_stats and best_lap < 2000000000 else "-",
                    "best_lap_ms": best_lap if has_stats and best_lap < 2000000000 else None,
                    "gap_best": gap_best_str, "penalty": penalty_applied, "race_gap": race_gap_str
                })

            for cls in ["GT3", "GT4", "TCX", "CUP"]:
                valid_paces = [d for d in temp_drivers if d['avg_lap_ms'] is not None and d['has_stats'] and d['car_class'] == cls]
                valid_paces.sort(key=lambda x: x['avg_lap_ms'])
                for i, d in enumerate(valid_paces): d['pace_pos'] = i + 1
            
            for d in temp_drivers:
                if 'pace_pos' not in d: d['pace_pos'] = "-"

            round_races_data.append({
                "track_name": track_name,
                "temp_drivers": temp_drivers,
                "qualy_dict": qualy_dict
            })

        # 4. CALCULAR PUNTOS AGREGADOS DE LA RONDA
        round_standings = {}
        for r_data in round_races_data:
            for d in r_data['temp_drivers']:
                pid = d['pid']
                if pid not in round_standings:
                    round_standings[pid] = {'races_completed': 0, 'pos_sum': 0, 'total_time': 0, 'driver_obj': d}
                
                if d['gets_points']:
                    round_standings[pid]['races_completed'] += 1
                    round_standings[pid]['pos_sum'] += d['real_pos_num']
                    round_standings[pid]['total_time'] += d['total_time_ms']
                else:
                    round_standings[pid]['pos_sum'] += 99 # Penalización media por DNF
                    round_standings[pid]['total_time'] += 9999999999
        
        # Asignar Puntos de Ronda por Categoría
        classes_in_round = set(rs['driver_obj']['car_class'] for rs in round_standings.values())
        for c_class in classes_in_round:
            class_rs = [rs for rs in round_standings.values() if rs['driver_obj']['car_class'] == c_class]
            class_rs.sort(key=lambda x: (-x['races_completed'], x['pos_sum'], x['total_time']))
            
            valid_pos = 1
            for rs in class_rs:
                if rs['races_completed'] > 0:
                    rs['round_points'] = POINTS_SYSTEM.get(valid_pos, 0)
                    rs['round_pos'] = valid_pos
                    valid_pos += 1
                else:
                    rs['round_points'] = 0
                    rs['round_pos'] = "DNF"

        # 5. ACTUALIZAR CLASIFICACIÓN GLOBAL Y FORMATEAR SALIDA
        round_sub_sessions = []
        for i, r_data in enumerate(round_races_data):
            session_results_export = []
            
            # Recopilar estadísticas para el global
            for d in r_data['temp_drivers']:
                pid = d['pid']
                c_class = d['car_class']
                
                # ¡Puntos solo en la primera carrera para no duplicar sumas en la UI!
                if i == 0:
                    d['points'] = round_standings[pid]['round_points']
                    
                    # Actualizar Global Drivers una única vez por ronda
                    if pid not in global_drivers:
                        global_drivers[pid] = {
                            "name": d['name'], "car_class": c_class, "cars": {}, "total_points": 0, "races": 0, 
                            "pos_sum": 0, "pos_count": 0, "pace_pos_sum": 0, "pace_pos_count": 0, 
                            "pos_gained_vs_pace": 0, "gap_pace_sum_ms": 0, "gap_count": 0, 
                            "qualy_pos_sum": 0, "qualy_pos_count": 0, "qualy_gap_sum_ms": 0, 
                            "qualy_gap_count": 0, "net_pos_gained_vs_qualy": 0
                        }
                    
                    if round_standings[pid]['races_completed'] > 0:
                        global_drivers[pid]["races"] += 1
                        global_drivers[pid]["total_points"] += round_standings[pid]['round_points']
                        global_drivers[pid]["pos_sum"] += round_standings[pid]['round_pos']
                        global_drivers[pid]["pos_count"] += 1

                else:
                    d['points'] = 0

                if d['has_stats'] and pid in global_drivers:
                    global_drivers[pid]["cars"][d['car_model']] = global_drivers[pid]["cars"].get(d['car_model'], 0) + 1
                    if d['pace_pos'] != "-":
                        global_drivers[pid]["pace_pos_sum"] += d['pace_pos']
                        global_drivers[pid]["pace_pos_count"] += 1
                    if d['has_valid_pace_gap'] and "nurburgring" not in r_data['track_name'].lower():
                        global_drivers[pid]["gap_pace_sum_ms"] += d['gap_pace_ms']
                        global_drivers[pid]["gap_count"] += 1
                    if d['qualy_pos'] != "-":
                        global_drivers[pid]["qualy_pos_sum"] += d['qualy_pos']
                        global_drivers[pid]["qualy_pos_count"] += 1
                        if d['qualy_gap_ms'] is not None and "nurburgring" not in r_data['track_name'].lower():
                            global_drivers[pid]["qualy_gap_sum_ms"] += d['qualy_gap_ms']
                            global_drivers[pid]["qualy_gap_count"] += 1

                if not d['has_stats']: continue
                
                d_export = d.copy()
                for key in ['pid', 'has_stats', 'gets_points', 'real_pos_num', 'has_valid_pace_gap', 'total_time_ms']:
                    d_export.pop(key, None)
                session_results_export.append(d_export)

            # Exportar Qualys
            qualy_results_export = []
            for q_pid, q_info in r_data['qualy_dict'].items():
                q_gap_str = "POLE" if q_info['gap_ms'] == 0 else (f"+{q_info['gap_ms']/1000:.3f}s" if q_info['gap_ms'] else "-")
                qualy_results_export.append({
                    "pos": q_info['pos'], "name": q_info['d_name'], "car_class": q_info['car_class'],
                    "car_model": q_info['car_model'], "s1": q_info['s1'], "s2": q_info['s2'], "s3": q_info['s3'],
                    "best_lap": format_time(q_info['time_ms']) if q_info['time_ms'] else "NO TIME", 
                    "gap_pole": q_gap_str, "gap_pole_ms": q_info['gap_ms']
                })
            qualy_results_export.sort(key=lambda x: (x['car_class'], x['pos'] if isinstance(x['pos'], int) else 9999))

            round_sub_sessions.append({
                "name": f"Race {i+1}: {r_data['track_name'].replace('_', ' ').title()}",
                "results": session_results_export,
                "qualy_results": qualy_results_export
            })

        # Añadir al Session List
        round_display_name = ROUND_NAMES.get(r_key, f"Round {r_key.replace('R', '')}")
        session_list.append({
            "id": f"round_{r_key}",
            "name": round_display_name,
            "sessions": round_sub_sessions if len(round_sub_sessions) > 1 else None,
            "results": round_sub_sessions[0]["results"] if len(round_sub_sessions) == 1 else None,
            "qualy_results": round_sub_sessions[0]["qualy_results"] if len(round_sub_sessions) == 1 else None
        })

    # 6. GENERAR RANKING GLOBAL
    final_ranking = []
    for pid, data in global_drivers.items():
        if data["pace_pos_count"] == 0 and data["qualy_pos_count"] == 0 and data["races"] == 0: continue

        avg_points = data["total_points"] / data["races"] if data["races"] > 0 else 0
        avg_pos_str = round(data["pos_sum"] / data["pos_count"], 1) if data["pos_count"] > 0 else "-" 
        avg_pace_pos_str = round(data["pace_pos_sum"] / data["pace_pos_count"], 1) if data["pace_pos_count"] > 0 else "-"
        avg_gap_str = f"+{data['gap_pace_sum_ms']/data['gap_count']/1000:.3f}" if data["gap_count"] > 0 else "-"
        avg_q_pos_str = round(data["qualy_pos_sum"] / data["qualy_pos_count"], 1) if data["qualy_pos_count"] > 0 else "-" 
        avg_q_gap_str = f"+{data['qualy_gap_sum_ms']/data['qualy_gap_count']/1000:.3f}" if data["qualy_gap_count"] > 0 else "-"

        final_ranking.append({
            "name": data["name"], "car_class": data["car_class"], 
            "favorite_car": max(data["cars"], key=data["cars"].get) if data["cars"] else 0,
            "points": data["total_points"], "avg_points": round(avg_points, 2),
            "avg_pos": avg_pos_str, "avg_pace_pos": avg_pace_pos_str, "net_pos_gained": data["pos_gained_vs_pace"],
            "avg_qualy_pos": avg_q_pos_str, "avg_qualy_gap": avg_q_gap_str, "net_pos_gained_qualy": data["net_pos_gained_vs_qualy"],
            "avg_gap": avg_gap_str, "races": data["races"] 
        })
    
    final_ranking.sort(key=lambda x: (-x["points"], float(x["avg_gap"].replace('+', '')) if x["avg_gap"] != "-" else 2000000000))

    # Limpiar Hall of Fame
    for track, record in hall_of_fame.items():
        for cls in ["GT3", "GT4", "TCX", "CUP"]:
            if record[cls]["qualy"]["time_ms"] == 2000000000: record[cls]["qualy"]["time_ms"] = None
            if record[cls]["race"]["time_ms"] == 2000000000: record[cls]["race"]["time_ms"] = None

    mega_json = { "global": final_ranking, "sessions": session_list, "hall_of_fame": hall_of_fame }

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(mega_json, f, indent=2)
    
    print(f"✅ Dashboard FF actualizado con Mini-Campeonatos: {OUTPUT_FILE}")

if __name__ == "__main__":
    load_and_process()