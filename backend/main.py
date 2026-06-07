import os
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pytesseract
from PIL import Image
import io

import database

# Explicitly set tesseract path if needed (standard on Linux is /usr/bin/tesseract)
pytesseract.pytesseract.tesseract_cmd = "/usr/bin/tesseract"

app = FastAPI(title="OCR Text Extractor Backend")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HistorySaveRequest(BaseModel):
    filename: str
    extracted_text: str

@app.on_event("startup")
def startup_event():
    database.init_db()

@app.get("/")
def read_root():
    return {"message": "OCR Text Extractor API is running."}

@app.post("/api/ocr")
async def perform_ocr(file: UploadFile = File(...)):
    # Validate image type
    allowed_types = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only PNG, JPEG, JPG, and WEBP are supported."
        )

    try:
        # Read file into bytes
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Perform OCR using pytesseract
        text = pytesseract.image_to_string(image)
        
        # Save to database
        db_id = database.save_ocr_result(file.filename, text)
        
        return {
            "id": db_id,
            "filename": file.filename,
            "extracted_text": text
        }
    except Exception as e:
        print(f"OCR Error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process image: {str(e)}"
        )

@app.get("/api/history")
def get_ocr_history():
    try:
        return database.get_all_history()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch history: {str(e)}"
        )

@app.post("/api/history")
def save_client_ocr(request: HistorySaveRequest):
    try:
        db_id = database.save_ocr_result(request.filename, request.extracted_text)
        return {
            "id": db_id,
            "message": "OCR result saved to history."
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save history: {str(e)}"
        )

@app.delete("/api/history/{item_id}")
def delete_history_item(item_id: int):
    try:
        success = database.delete_history_item(item_id)
        if not success:
            raise HTTPException(status_code=444, detail="Item not found")
        return {"message": "History item deleted successfully."}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete history item: {str(e)}"
        )

@app.delete("/api/history")
def clear_all_history():
    try:
        database.clear_all_history()
        return {"message": "All history cleared successfully."}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear history: {str(e)}"
        )
