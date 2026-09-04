import os
import json
import io
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

def authenticate_gdrive():
    creds_json = os.environ.get('GDRIVE_CREDENTIALS')
    if not creds_json:
        raise ValueError("❌ No se encontró el secreto GDRIVE_CREDENTIALS")
    
    creds_dict = json.loads(creds_json)
    SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
    creds = service_account.Credentials.from_service_account_info(creds_dict, scopes=SCOPES)
    return build('drive', 'v3', credentials=creds)

def download_folder_recursive(service, folder_id, local_path, valid_paths):
    """Descarga el contenido de una carpeta de Drive manteniendo la estructura y anota lo descargado."""
    os.makedirs(local_path, exist_ok=True)
    valid_paths.add(os.path.abspath(local_path)) # Añadimos la carpeta a la lista blanca
    
    page_token = None
    while True:
        query = f"'{folder_id}' in parents and trashed = false"
        results = service.files().list(
            q=query, 
            pageSize=1000, 
            fields="nextPageToken, files(id, name, mimeType)", 
            pageToken=page_token
        ).execute()
        
        items = results.get('files', [])

        for item in items:
            item_id = item['id']
            item_name = item['name']
            mime_type = item['mimeType']
            
            current_local_path = os.path.join(local_path, item_name)

            # Si es una carpeta, volvemos a llamar a esta función para entrar en ella
            if mime_type == 'application/vnd.google-apps.folder':
                print(f"📁 Explorando carpeta: {current_local_path}")
                download_folder_recursive(service, item_id, current_local_path, valid_paths)
            
            # Si es un archivo, lo descargamos
            else:
                print(f"📥 Descargando archivo: {current_local_path}")
                request = service.files().get_media(fileId=item_id)
                fh = io.BytesIO()
                downloader = MediaIoBaseDownload(fh, request)
                done = False
                while done is False:
                    status, done = downloader.next_chunk()
                
                with open(current_local_path, 'wb') as f:
                    f.write(fh.getvalue())
                
                valid_paths.add(os.path.abspath(current_local_path)) # Añadimos el archivo a la lista blanca
                
        page_token = results.get('nextPageToken', None)
        if page_token is None:
            break

def clean_orphan_files(base_path, valid_paths):
    """Elimina los archivos y carpetas locales que ya no existen en Drive."""
    for root, dirs, files in os.walk(base_path, topdown=False):
        # 1. Limpiar archivos antiguos
        for name in files:
            full_path = os.path.abspath(os.path.join(root, name))
            if full_path not in valid_paths:
                print(f"🗑️ Eliminando archivo huérfano local: {full_path}")
                os.remove(full_path)
        
        # 2. Limpiar carpetas vacías o antiguas
        for name in dirs:
            full_path = os.path.abspath(os.path.join(root, name))
            if full_path not in valid_paths:
                print(f"🗑️ Eliminando carpeta huérfana local: {full_path}")
                try:
                    os.rmdir(full_path)
                except OSError:
                    pass # Si falla por no estar vacía o permisos, la ignoramos

if __name__ == '__main__':
    print("🚀 Iniciando sincronización con Google Drive...")
    try:
        drive_service = authenticate_gdrive()
        main_folder_id = os.environ.get('FOLDER_ID')
        
        if not main_folder_id:
            raise ValueError("❌ No se encontró el secreto FOLDER_ID")
            
        base_sync_folder = 'public/data/gdrive_sync'
        valid_paths = set() # Memoria de lo que realmente existe en Drive
        
        print(f"📡 Conectado a Drive. Clonando estructura en {base_sync_folder}/...")
        download_folder_recursive(drive_service, main_folder_id, base_sync_folder, valid_paths)
        
        print("🧹 Limpiando archivos locales eliminados en Drive...")
        if os.path.exists(base_sync_folder):
            clean_orphan_files(base_sync_folder, valid_paths)
            
        print("✨ ¡Sincronización completada con éxito!")
        
    except Exception as e:
        print(f"❌ Error crítico: {e}")