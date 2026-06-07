# OCR Text Extractor (FastAPI + React)

A modern, high-fidelity web application for extracting text from images using Optical Character Recognition (OCR). This project is built as a complete full-stack **FastAPI** (Python backend) and **React** (TypeScript/Vite frontend) application.

It supports dual OCR processing options:
1. **Local Client-Side OCR**: Runs in the browser using [Tesseract.js](https://tesseract.github.io/tesseract.js/) (zero backend communication, fast, private).
2. **Server-Side OCR**: Runs on the server using **FastAPI** + Python's **Pytesseract** (OCR engine connected to standard Tesseract OCR bin).

All scans are automatically synchronized and logged in a local **SQLite database** to support a persistent OCR extraction history panel.

---

## 🚀 Features

- **Dual OCR Modes**:
  - **Local (Tesseract.js)**: Perform OCR directly in the browser. No server overhead, fast execution, private data.
  - **Server (FastAPI + Pytesseract)**: Process images on the backend. Highly scalable for batch tasks, customizable OCR configurations.
- **OCR History Panel**:
  - Automatically saves all successful scans (from both local and server modes) into a persistent SQLite database.
  - View, select, or delete previous scan results.
  - Options to clear all history.
- **Advanced File Validation**:
  - Restricts image uploads to PNG, JPG, JPEG, and WEBP formats.
  - Limits file size to 5MB (configurable).
- **Premium User Experience (UX)**:
  - Sleek dark theme with modern glassmorphic panels.
  - Real-time connection-status dot monitoring backend health (automatically fallbacks to local mode if backend is offline).
  - Detailed Ring Loader showing local scan progress percentage.
  - "Copy to Clipboard" button with micro-interaction feedback.
  - Responsive layout for desktop, tablet, and mobile.

---

## 📁 Repository Structure

```text
ocr-textExtractor/
├── fastapi-react-app/
│   ├── backend/           # FastAPI Python backend
│   │   ├── database.py    # SQLite3 database connection and helpers
│   │   ├── main.py        # API endpoints (OCR and History logs)
│   │   ├── requirements.txt
│   │   └── ocr_history.db # Local SQLite Database (auto-generated)
│   │
│   └── frontend/          # React + TypeScript + Vite frontend
│       ├── src/
│       │   ├── components/ # Reusable UI components (e.g. Title)
│       │   ├── pages/     # ImageExtractor page (main interface)
│       │   ├── App.tsx    # Routing and layout wrapping
│       │   └── main.tsx   # App mount configuration
│       ├── package.json   # Frontend scripts and dependencies
│       └── vite.config.ts # Vite configuration
│
├── start.sh               # Root script to run both servers concurrently
└── README.md              # Project documentation
```

---

## 🛠️ Tech Stack

### Backend
- **FastAPI**: Modern, high-performance web framework for Python.
- **Uvicorn**: Lightning-fast ASGI web server implementation.
- **Pytesseract / Pillow**: Python OCR wrapper and Image processing.
- **SQLite3**: Lightweight, zero-config relational database.

### Frontend
- **React 19 & TypeScript**: Component-driven SPA frontend.
- **Vite**: Ultra-fast build tool and bundler.
- **Tailwind CSS v4**: Utility-first CSS styling.
- **Tesseract.js**: Pure JavaScript OCR client.
- **React Router DOM**: Client-side routing.

---

## ⚡ Quick Start (Recommended)

To run both the backend and frontend simultaneously with a single command:

1. Ensure you have the system prerequisites:
   - **Node.js** (v18+)
   - **Python** (v3.10+)
   - **Tesseract-OCR Binary**: Must be installed on your operating system:
     - *Ubuntu/Debian*: `sudo apt install tesseract-ocr`
     - *macOS*: `brew install tesseract`
     - *Windows*: Download installer from Git/UB-Mannheim.

2. Run the startup script at the root:
   ```bash
   ./start.sh
   ```

3. Open your browser and navigate to:
   - **Frontend client**: `http://localhost:5173`
   - **Backend API Docs**: `http://localhost:8000/docs`

4. To stop both servers, simply press `Ctrl+C` in your terminal.

---

## 🛠️ Manual Installation & Launch

If you prefer to run the components independently, follow these steps:

### 1. Setup Backend
```bash
cd fastapi-react-app/backend
pip3 install -r requirements.txt
python3 -m uvicorn main:app --reload --port 8000
```

### 2. Setup Frontend
```bash
cd fastapi-react-app/frontend
npm install
npm run dev
```

---

## 🔮 Future Roadmap

- **Layout Analysis**: Implement text-block detection to keep formatting and column-reads.
- **PDF & Document Parsing**: Support uploading multi-page PDF documents.
- **Multi-Language Selector**: Allow selecting OCR languages (Spanish, French, German, Chinese, etc.).
- **User Authentication**: Add user logins to sync history across multiple devices.
