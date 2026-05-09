from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
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
PDF_DB = "pdfs.json"
PASM_DB = "pasm.json"

os.makedirs(PHOTO_FOLDER, exist_ok=True)
os.makedirs(PDF_FOLDER, exist_ok=True)
os.makedirs(PASM_FOLDER, exist_ok=True)

# ===========================
# COMMON FUNCTIONS
# ===========================
def load_json(file):
    if not os.path.exists(file):
        return []
    with open(file, "r") as f:
        return json.load(f)

def save_json(file, data):
    with open(file, "w") as f:
        json.dump(data, f, indent=4)

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

    return {"message": "Photo uploaded"}


# Edit Photo
@app.put("/edit-photo/{filename}")
async def edit_photo(
    filename: str,
    title: str = Form(""),
    description: str = Form(""),
    file: UploadFile = File(None)
):
    db = load_json(PHOTO_DB)

    # Find the photo in database
    photo_index = next((i for i, p in enumerate(db) if p["filename"] == filename), None)

    if photo_index is None:
        raise HTTPException(status_code=404, detail="Photo not found")

    # Keep the original created_at timestamp
    created_at = db[photo_index].get("created_at", datetime.now().isoformat())

    # Update photo file if new file is provided
    new_filename = filename
    if file:
        # Delete old file
        old_file_path = os.path.join(PHOTO_FOLDER, filename)
        if os.path.exists(old_file_path):
            os.remove(old_file_path)

        # Save new file
        new_filename = file.filename
        new_file_path = os.path.join(PHOTO_FOLDER, new_filename)
        with open(new_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

    # Update database entry
    db[photo_index] = {
        "filename": new_filename,
        "title": title,
        "description": description,
        "url": f"/photos/{new_filename}",
        "created_at": created_at
    }

    save_json(PHOTO_DB, db)

    return {"message": "Photo updated", "filename": new_filename}


# Get Photos
@app.get("/photos-list/")
def get_photos():
    return load_json(PHOTO_DB)


# Delete Photo
@app.delete("/delete/{filename}")
def delete_photo(filename: str):
    file_path = os.path.join(PHOTO_FOLDER, filename)

    if os.path.exists(file_path):
        os.remove(file_path)

    db = load_json(PHOTO_DB)
    db = [p for p in db if p["filename"] != filename]
    save_json(PHOTO_DB, db)

    return {"message": "Photo deleted"}


# ===========================
# 📄 PDF APIs (E-News Papers)
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

    return {"message": "PDF uploaded"}


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

    # Find the PDF in database
    pdf_index = next((i for i, p in enumerate(db) if p["filename"] == filename), None)

    if pdf_index is None:
        raise HTTPException(status_code=404, detail="PDF not found")

    # Keep the original created_at timestamp
    created_at = db[pdf_index].get("created_at", datetime.now().isoformat())

    # Update PDF file if new file is provided
    new_filename = filename
    if file:
        # Delete old file
        old_file_path = os.path.join(PDF_FOLDER, filename)
        if os.path.exists(old_file_path):
            os.remove(old_file_path)

        # Save new file
        new_filename = file.filename
        new_file_path = os.path.join(PDF_FOLDER, new_filename)
        with open(new_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

    # Update database entry
    db[pdf_index] = {
        "filename": new_filename,
        "title": title,
        "description": description,
        "date": date,
        "url": f"/pdfs/{new_filename}",
        "created_at": created_at
    }

    save_json(PDF_DB, db)

    return {"message": "PDF updated", "filename": new_filename}


# Get PDFs
@app.get("/pdf-list/")
def get_pdfs():
    return load_json(PDF_DB)


# Delete PDF
@app.delete("/delete-pdf/{filename}")
def delete_pdf(filename: str):
    file_path = os.path.join(PDF_FOLDER, filename)

    if os.path.exists(file_path):
        os.remove(file_path)

    db = load_json(PDF_DB)
    db = [p for p in db if p["filename"] != filename]
    save_json(PDF_DB, db)

    return {"message": "PDF deleted"}


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

    return {"message": "PASM uploaded"}


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

    # Find the PASM in database
    pasm_index = next((i for i, p in enumerate(db) if p["filename"] == filename), None)

    if pasm_index is None:
        raise HTTPException(status_code=404, detail="PASM not found")

    # Keep the original created_at timestamp
    created_at = db[pasm_index].get("created_at", datetime.now().isoformat())

    # Update PASM file if new file is provided
    new_filename = filename
    if file:
        # Delete old file
        old_file_path = os.path.join(PASM_FOLDER, filename)
        if os.path.exists(old_file_path):
            os.remove(old_file_path)

        # Save new file
        new_filename = file.filename
        new_file_path = os.path.join(PASM_FOLDER, new_filename)
        with open(new_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

    # Update database entry
    db[pasm_index] = {
        "filename": new_filename,
        "title": title,
        "description": description,
        "date": date,
        "url": f"/pasm/{new_filename}",
        "created_at": created_at
    }

    save_json(PASM_DB, db)

    return {"message": "PASM updated", "filename": new_filename}


# Get PASM
@app.get("/pasm-list/")
def get_pasm():
    return load_json(PASM_DB)


# Delete PASM
@app.delete("/delete-pasm/{filename}")
def delete_pasm(filename: str):
    file_path = os.path.join(PASM_FOLDER, filename)

    if os.path.exists(file_path):
        os.remove(file_path)

    db = load_json(PASM_DB)
    db = [p for p in db if p["filename"] != filename]
    save_json(PASM_DB, db)

    return {"message": "PASM deleted"}


# ===========================
# STATIC FILES
# ===========================

# Serve images
app.mount("/photos", StaticFiles(directory=PHOTO_FOLDER), name="photos")

# Serve PDFs (E-News Papers)
app.mount("/pdfs", StaticFiles(directory=PDF_FOLDER), name="pdfs")

# Serve PASM PDFs
app.mount("/pasm", StaticFiles(directory=PASM_FOLDER), name="pasm")

# Serve frontend
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")