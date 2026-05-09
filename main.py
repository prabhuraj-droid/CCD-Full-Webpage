from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import shutil
import os
import json
from datetime import datetime

app = FastAPI()

# ===========================
# CORS
# ===========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===========================
# FOLDERS
# ===========================
PHOTO_FOLDER = "Photos"
PDF_FOLDER = "PDF"
PASM_FOLDER = "PASM"

PHOTO_DB = "photos.json"
PDF_DB = "pdf.json"
PASM_DB = "pasm.json"

# Create folders if not exists
os.makedirs(PHOTO_FOLDER, exist_ok=True)
os.makedirs(PDF_FOLDER, exist_ok=True)
os.makedirs(PASM_FOLDER, exist_ok=True)

# Create JSON files if not exists
for db_file in [PHOTO_DB, PDF_DB, PASM_DB]:
    if not os.path.exists(db_file):
        with open(db_file, "w") as f:
            json.dump([], f)

# ===========================
# COMMON FUNCTIONS
# ===========================
def load_json(file):
    try:
        with open(file, "r") as f:
            return json.load(f)
    except:
        return []


def save_json(file, data):
    with open(file, "w") as f:
        json.dump(data, f, indent=4)


# ===========================
# HOME ROUTE
# ===========================
@app.get("/")
async def home():
    return FileResponse("frontend/index.html")


# ===========================
# 📸 PHOTO APIs
# ===========================

# Upload Photo
@app.post("/upload/")
async def upload_photo(
    file: UploadFile = File(...),
    title: str = Form(""),
    description: str = Form("")
):
    file_path = os.path.join(PHOTO_FOLDER, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    db = load_json(PHOTO_DB)

    db.append({
        "filename": file.filename,
        "title": title,
        "description": description,
        "url": f"/photos/{file.filename}",
        "created_at": datetime.now().isoformat()
    })

    save_json(PHOTO_DB, db)

    return {"message": "Photo uploaded successfully"}


# Get Photos
@app.get("/photos-list/")
def get_photos():
    return load_json(PHOTO_DB)


# Edit Photo
@app.put("/edit-photo/{filename}")
async def edit_photo(
    filename: str,
    title: str = Form(""),
    description: str = Form(""),
    file: UploadFile = File(None)
):
    db = load_json(PHOTO_DB)

    photo_index = next(
        (i for i, p in enumerate(db) if p["filename"] == filename),
        None
    )

    if photo_index is None:
        raise HTTPException(status_code=404, detail="Photo not found")

    created_at = db[photo_index].get(
        "created_at",
        datetime.now().isoformat()
    )

    new_filename = filename

    if file:
        old_file_path = os.path.join(PHOTO_FOLDER, filename)

        if os.path.exists(old_file_path):
            os.remove(old_file_path)

        new_filename = file.filename
        new_file_path = os.path.join(PHOTO_FOLDER, new_filename)

        with open(new_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

    db[photo_index] = {
        "filename": new_filename,
        "title": title,
        "description": description,
        "url": f"/photos/{new_filename}",
        "created_at": created_at
    }

    save_json(PHOTO_DB, db)

    return {
        "message": "Photo updated successfully",
        "filename": new_filename
    }


# Delete Photo
@app.delete("/delete/{filename}")
def delete_photo(filename: str):

    file_path = os.path.join(PHOTO_FOLDER, filename)

    if os.path.exists(file_path):
        os.remove(file_path)

    db = load_json(PHOTO_DB)

    db = [p for p in db if p["filename"] != filename]

    save_json(PHOTO_DB, db)

    return {"message": "Photo deleted successfully"}


# ===========================
# 📄 PDF APIs
# ===========================

# Upload PDF
@app.post("/upload-pdf/")
async def upload_pdf(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(...),
    date: str = Form(...)
):
    file_path = os.path.join(PDF_FOLDER, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    db = load_json(PDF_DB)

    db.append({
        "filename": file.filename,
        "title": title,
        "description": description,
        "date": date,
        "url": f"/pdfs/{file.filename}",
        "created_at": datetime.now().isoformat()
    })

    save_json(PDF_DB, db)

    return {"message": "PDF uploaded successfully"}


# Get PDFs
@app.get("/pdf-list/")
def get_pdfs():
    return load_json(PDF_DB)


# Edit PDF
@app.put("/edit-pdf/{filename}")
async def edit_pdf(
    filename: str,
    title: str = Form(...),
    description: str = Form(...),
    date: str = Form(...),
    file: UploadFile = File(None)
):
    db = load_json(PDF_DB)

    pdf_index = next(
        (i for i, p in enumerate(db) if p["filename"] == filename),
        None
    )

    if pdf_index is None:
        raise HTTPException(status_code=404, detail="PDF not found")

    created_at = db[pdf_index].get(
        "created_at",
        datetime.now().isoformat()
    )

    new_filename = filename

    if file:
        old_file_path = os.path.join(PDF_FOLDER, filename)

        if os.path.exists(old_file_path):
            os.remove(old_file_path)

        new_filename = file.filename
        new_file_path = os.path.join(PDF_FOLDER, new_filename)

        with open(new_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

    db[pdf_index] = {
        "filename": new_filename,
        "title": title,
        "description": description,
        "date": date,
        "url": f"/pdfs/{new_filename}",
        "created_at": created_at
    }

    save_json(PDF_DB, db)

    return {
        "message": "PDF updated successfully",
        "filename": new_filename
    }


# Delete PDF
@app.delete("/delete-pdf/{filename}")
def delete_pdf(filename: str):

    file_path = os.path.join(PDF_FOLDER, filename)

    if os.path.exists(file_path):
        os.remove(file_path)

    db = load_json(PDF_DB)

    db = [p for p in db if p["filename"] != filename]

    save_json(PDF_DB, db)

    return {"message": "PDF deleted successfully"}


# ===========================
# 📋 PASM APIs
# ===========================

# Upload PASM
@app.post("/upload-pasm/")
async def upload_pasm(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(...),
    date: str = Form(...)
):
    file_path = os.path.join(PASM_FOLDER, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    db = load_json(PASM_DB)

    db.append({
        "filename": file.filename,
        "title": title,
        "description": description,
        "date": date,
        "url": f"/pasm/{file.filename}",
        "created_at": datetime.now().isoformat()
    })

    save_json(PASM_DB, db)

    return {"message": "PASM uploaded successfully"}


# Get PASM
@app.get("/pasm-list/")
def get_pasm():
    return load_json(PASM_DB)


# Edit PASM
@app.put("/edit-pasm/{filename}")
async def edit_pasm(
    filename: str,
    title: str = Form(...),
    description: str = Form(...),
    date: str = Form(...),
    file: UploadFile = File(None)
):
    db = load_json(PASM_DB)

    pasm_index = next(
        (i for i, p in enumerate(db) if p["filename"] == filename),
        None
    )

    if pasm_index is None:
        raise HTTPException(status_code=404, detail="PASM not found")

    created_at = db[pasm_index].get(
        "created_at",
        datetime.now().isoformat()
    )

    new_filename = filename

    if file:
        old_file_path = os.path.join(PASM_FOLDER, filename)

        if os.path.exists(old_file_path):
            os.remove(old_file_path)

        new_filename = file.filename
        new_file_path = os.path.join(PASM_FOLDER, new_filename)

        with open(new_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

    db[pasm_index] = {
        "filename": new_filename,
        "title": title,
        "description": description,
        "date": date,
        "url": f"/pasm/{new_filename}",
        "created_at": created_at
    }

    save_json(PASM_DB, db)

    return {
        "message": "PASM updated successfully",
        "filename": new_filename
    }


# Delete PASM
@app.delete("/delete-pasm/{filename}")
def delete_pasm(filename: str):

    file_path = os.path.join(PASM_FOLDER, filename)

    if os.path.exists(file_path):
        os.remove(file_path)

    db = load_json(PASM_DB)

    db = [p for p in db if p["filename"] != filename]

    save_json(PASM_DB, db)

    return {"message": "PASM deleted successfully"}


# ===========================
# STATIC FILES
# ===========================

# Serve uploaded photos
app.mount(
    "/photos",
    StaticFiles(directory=PHOTO_FOLDER),
    name="photos"
)

# Serve uploaded PDFs
app.mount(
    "/pdfs",
    StaticFiles(directory=PDF_FOLDER),
    name="pdfs"
)

# Serve uploaded PASM files
app.mount(
    "/pasm",
    StaticFiles(directory=PASM_FOLDER),
    name="pasm"
)

# Serve frontend files
app.mount(
    "/",
    StaticFiles(directory="frontend", html=True),
    name="frontend"
)