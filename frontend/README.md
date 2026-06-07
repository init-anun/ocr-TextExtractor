# OCR Text Extractor - Frontend Client

This is the frontend client for the OCR Text Extractor application, built as a Single Page Application (SPA) using React, TypeScript, Vite, and Tailwind CSS.

It features a dual OCR extraction flow that integrates client-side browser-only processing with an optional FastAPI Python server backend.

---

## ✨ Features

- **Dual OCR Engine Selector**:
  - **Local Mode**: Runs **Tesseract.js** in the browser. Fully private, fast, serverless.
  - **Server Mode**: Connects to the **FastAPI** backend via pytesseract.
- **Backend Connection Monitor**: Automatic, real-time connectivity checker. Shows a status dot (Online/Offline/Checking) and gracefully falls back to Local Mode if the server goes down.
- **SQLite-backed OCR History**: Sidebar panel that fetches past scans from the backend, allows viewing historical text, and supports item deletion and history clearing.
- **Drag-and-Drop Image Uploader**: Accepts PNG, JPEG, JPG, and WEBP formats with a strict 5MB size limit.
- **Real-Time Progress Indicator**: Shows the percentage completion for client-side text recognition.
- **Copy Text Action**: Quick copy button with dynamic "Copied!" checkmark feedback.
- **Responsive Dark Design**: Styled with a deep slate color scheme and glassmorphism panels.

---

## 🚀 Getting Started

### Scripts

The project includes the following scripts defined in `package.json`:

| Script | Command | Description |
| :--- | :--- | :--- |
| `dev` | `vite` | Starts the local development server with Hot Module Replacement (HMR). |
| `build` | `tsc -b && vite build` | Compiles TypeScript and builds the application for production. |
| `lint` | `eslint .` | Runs ESLint to check for code style issues and bugs. |
| `preview` | `vite preview` | Previews the production build locally. |

### Development Setup

1. Make sure you have installed the dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open the application at [http://localhost:5173](http://localhost:5173).

---

## 📁 Code Structure

```text
src/
├── components/
│   └── Title.tsx           # A reusable page title component
├── pages/
│   └── ImageExtractor.tsx  # Main page containing OCR flow, file upload, connection checking, and state
├── App.css                 # Application-wide global overrides
├── App.tsx                 # Handles routing and wraps page layout
├── index.css               # Tailwind CSS imports and global styles
└── main.tsx                # Mounts the React application
```

---

## 🛠️ Main Dependencies

- **[React 19](https://react.dev/)**: Frontend SPA core library.
- **[Tesseract.js](https://tesseract.github.io/tesseract.js/)**: In-browser OCR library.
- **[React Router DOM](https://reactrouter.com/)**: Routing controls.
- **[Tailwind CSS v4](https://tailwindcss.com/)**: Utility-first styling framework.
- **[TypeScript](https://www.typescriptlang.org/)**: Static type safety.
- **[Vite](https://vite.dev/)**: Next-generation bundler and local server tool.
