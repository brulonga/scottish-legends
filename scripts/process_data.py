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

def download_folder_recursive(service, folder_id, local_path):
    """Descarga el contenido de una carpeta de Drive manteniendo la estructura."""
    os.makedirs(local_path, exist_ok=True)
    
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
                download_folder_recursive(service, item_id, current_local_path)
            
            # Si es un archivo (como un JSON), lo descargamos
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
                
        page_token = results.get('nextPageToken', None)
        if page_token is None:
            break

if __name__ == '__main__':
    print("🚀 Iniciando sincronización con Google Drive...")
    try:
        drive_service = authenticate_gdrive()
        main_folder_id = os.environ.get('FOLDER_ID')
        
        if not main_folder_id:
            raise ValueError("❌ No se encontró el secreto FOLDER_ID")
            
        base_sync_folder = 'public/data/gdrive_sync'
        
        print(f"📡 Conectado a Drive. Clonando estructura en {base_sync_folder}/...")
        download_folder_recursive(drive_service, main_folder_id, base_sync_folder)
        print("✨ ¡Descarga completada con éxito!")
        
    except Exception as e:
        print(f"❌ Error crítico: {e}")