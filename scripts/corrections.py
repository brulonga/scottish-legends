import os
import json
import glob

# ⚠️ PON AQUÍ LAS CARPETAS DONDE ESTÁN TUS JSON ORIGINALES DE ACC
CARPETAS_ORIGINALES = [
    "public/data/gdrive_sync", # <-- EJEMPLO: cambia esto por tu ruta real
    # "otra/carpeta/si/hace/falta"
]

CORRECCIONES = {
    "alex k": "Alex Küch",
    "stuart w": "Stuart Woolley",
    "gael d": "Gael Duchene"
}

def buscar_y_preguntar(data, ruta_archivo):
    modificado = False
    
    if isinstance(data, dict):
        # 1. Detectamos si estamos en la parte del piloto (formato ACC)
        if 'firstName' in data or 'lastName' in data:
            nombre_crudo = f"{data.get('firstName', '')} {data.get('lastName', '')}".strip()
            nombre_lower = nombre_crudo.lower()
            
            for mal, bien in CORRECCIONES.items():
                # Si encontramos el patrón, Y NO es ya el nombre perfecto
                if mal in nombre_lower and nombre_lower != bien.lower():
                    print(f"\n📂 Archivo: {ruta_archivo}")
                    print(f"👀 Encontrado sospechoso: '{nombre_crudo}'")
                    
                    respuesta = input(f"❓ ¿Quieres sobrescribirlo como '{bien}'? (y/n/salir): ").strip().lower()
                    
                    if respuesta == 'salir':
                        exit(0)
                    elif respuesta == 'y' or respuesta == 's':
                        # Sobrescribimos en el archivo original. 
                        # Lo metemos todo en firstName y vaciamos lastName para evitar líos
                        data['firstName'] = bien
                        data['lastName'] = ""
                        modificado = True
                        print("✅ ¡Corregido en memoria!")
                    break # Pasamos al siguiente piloto
                    
        # 2. Seguimos buscando recursivamente por el resto del JSON
        for key, value in data.items():
            if isinstance(value, (dict, list)):
                if buscar_y_preguntar(value, ruta_archivo):
                    modificado = True
                    
    elif isinstance(data, list):
        for item in data:
            if buscar_y_preguntar(item, ruta_archivo):
                modificado = True
                
    return modificado

def iniciar_cirugia():
    print("🩺 Iniciando cirugía de archivos originales...")
    archivos_corregidos = 0
    
    for carpeta in CARPETAS_ORIGINALES:
        if not os.path.exists(carpeta):
            print(f"⚠️ Carpeta no encontrada: {carpeta}")
            continue
            
        rutas = glob.glob(os.path.join(carpeta, '**', '*.json'), recursive=True)
        
        for ruta in rutas:
            # Intentamos leer con múltiples codificaciones
            encodings = ['utf-8-sig', 'utf-16-le', 'utf-16', 'utf-8', 'latin-1', 'cp1252']
            data = None
            
            for enc in encodings:
                try:
                    with open(ruta, 'r', encoding=enc) as f:
                        data = json.load(f)
                    break
                except Exception:
                    continue
            
            if not data:
                continue
                
            # Pasamos el JSON por el escáner interactivo
            si_hubo_cambios = buscar_y_preguntar(data, ruta)
            
            if si_hubo_cambios:
                # Guardamos el archivo original sobrescrito en UTF-8 limpio
                with open(ruta, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                archivos_corregidos += 1
                
    print(f"\n🎉 Cirugía terminada. Se han modificado permanentemente {archivos_corregidos} archivos originales.")

if __name__ == "__main__":
    iniciar_cirugia()