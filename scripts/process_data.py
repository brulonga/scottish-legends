import os
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
import io

def authenticate_gdrive():
    # Coge el secreto de GitHub de forma segura
    creds_json = os.environ.get('GDRIVE_CREDENTIALS')
    if not creds_json:
        raise ValueError("No se encontró el secreto GDRIVE_CREDENTIALS")
    
    creds_dict = json.loads(creds_json)
    SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
    creds = service_account.Credentials.from_service_account_info(creds_dict, scopes=SCOPES)
    return build('drive', 'v3', credentials=creds)

def download_season_files():
    service = authenticate_gdrive()
    folder_id = os.environ.get('FOLDER_ID')
    
    if not folder_id:
        raise ValueError("No se encontró el secreto FOLDER_ID")

    # Buscar archivos dentro de la carpeta de Google Drive
    query = f"'{folder_id}' in parents and trashed = false"
    results = service.files().list(q=query, fields="files(id, name)").execute()
    files = results.get('files', [])

    if not files:
        print("⚠️ No se encontraron archivos en la carpeta de Google Drive.")
        return

    # Crear la carpeta de datos local si no existe
    os.makedirs('public/data/gdrive_sync', exist_ok=True)

    for file in files:
        file_id = file['id']
        file_name = file['name']
        print(f"📥 Descargando desde Drive: {file_name}...")

        request = service.files().get_media(fileId=file_id)
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while done is False:
            status, done = downloader.next_chunk()

        # Guardar el archivo descargado localmente en tu proyecto
        output_path = os.path.join('public/data/gdrive_sync', file_name)
        with open(output_path, 'wb') as f:
            f.write(fh.getvalue())
        print(f"✅ Guardado en {output_path}")

if __name__ == '__main__':
    print("🚀 Iniciando sincronización con Google Drive...")
    download_season_files()
