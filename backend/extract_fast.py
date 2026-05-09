import zipfile
import os

zip_path = os.path.join(os.path.dirname(__file__), 'scripts', 'gcc64.zip')
extract_path = os.path.join(os.path.dirname(__file__), 'scripts', 'mingw64')

if os.path.exists(zip_path):
    print("Extracting zip with Python (Fast Mode)...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_path)
    print("Extraction complete!")
else:
    print("Zip file not found.")
