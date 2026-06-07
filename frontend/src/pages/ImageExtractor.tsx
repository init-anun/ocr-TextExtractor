import { useState, useEffect, type ChangeEvent } from 'react';
import Tesseract from 'tesseract.js';
import Title from '../components/Title';

const API_BASE_URL = "http://localhost:8000";

interface HistoryItem {
  id: number;
  filename: string;
  extracted_text: string;
  timestamp: string;
}

export default function ImageExtractor() {
  const [image, setImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  
  // OCR and Backend Status State
  const [ocrMode, setOcrMode] = useState<"client" | "server">("client");
  const [backendStatus, setBackendStatus] = useState<"online" | "offline" | "checking">("checking");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [progress, setProgress] = useState<number>(0);

  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

  // Check backend status on mount
  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    setBackendStatus("checking");
    try {
      const response = await fetch(`${API_BASE_URL}/`);
      if (response.ok) {
        setBackendStatus("online");
        fetchHistory();
      } else {
        setBackendStatus("offline");
        setOcrMode("client"); // Fallback to client if backend is down
      }
    } catch (err) {
      console.error("Backend connection failed:", err);
      setBackendStatus("offline");
      setOcrMode("client"); // Fallback to client if backend is down
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/history`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const deleteHistoryItem = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/history/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        fetchHistory();
        // Clear screen if viewing the deleted item
        const item = history.find(h => h.id === id);
        if (item && extractedText === item.extracted_text) {
          setExtractedText("");
          setImage(null);
          setSelectedFile(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete history item:", err);
    }
  };

  const clearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear all OCR history?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/history`, {
        method: "DELETE"
      });
      if (response.ok) {
        setHistory([]);
        setExtractedText("");
        setImage(null);
        setSelectedFile(null);
      }
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError("");
    setExtractedText("");
    setCopied(false);
    setProgress(0);

    if (!file) return;

    // Validate type
    if (!allowedTypes.includes(file.type)) {
      setError("Only PNG, JPG, JPEG, and WEBP images are allowed.");
      setSelectedFile(null);
      setImage(null);
      return;
    }

    // Validate size
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");
      setSelectedFile(null);
      setImage(null);
      return;
    }

    setSelectedFile(file);
    const imageUrl = URL.createObjectURL(file);
    setImage(imageUrl);
  };

  const processOCR = async () => {
    if (!selectedFile) {
      setError("Please select an image first.");
      return;
    }

    setError("");
    setExtractedText("");
    setCopied(false);
    setLoading(true);
    setProgress(0);

    if (ocrMode === "client") {
      try {
        const result = await Tesseract.recognize(selectedFile, "eng", {
          logger: (m) => {
            if (m.status === "recognizing text") {
              setProgress(Math.round(m.progress * 100));
            }
          },
        });
        const text = result.data.text.trim();
        setExtractedText(text || "No text was detected in the image.");

        // Save client-side OCR scan to history if server is online
        if (backendStatus === "online" && text) {
          try {
            await fetch(`${API_BASE_URL}/api/history`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                filename: selectedFile.name,
                extracted_text: text
              })
            });
            fetchHistory();
          } catch (syncErr) {
            console.error("Failed to sync client OCR with server database", syncErr);
          }
        }
      } catch (err) {
        console.error(err);
        setError("Failed to extract text locally using Tesseract.js.");
      } finally {
        setLoading(false);
      }
    } else {
      // Server-side OCR (FastAPI + Pytesseract)
      const formData = new FormData();
      formData.append("file", selectedFile);

      try {
        const response = await fetch(`${API_BASE_URL}/api/ocr`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || "Server OCR failed");
        }

        const data = await response.json();
        setExtractedText(data.extracted_text.trim() || "No text was detected by server OCR.");
        fetchHistory();
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to process image on server.");
      } finally {
        setLoading(false);
      }
    }
  };

  const copyToClipboard = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setExtractedText(item.extracted_text);
    setImage(null);
    setSelectedFile(null);
    setError("");
    setProgress(100);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f1f5f9] p-6 flex flex-col items-center">
      <div className="w-full max-w-6xl flex flex-col md:flex-row gap-6 mt-4">
        
        {/* Main Panel */}
        <div className="flex-1 bg-[#1e293b]/50 backdrop-blur-md rounded-2xl border border-gray-700/50 p-6 shadow-2xl transition-all duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-700/50 gap-4">
            <Title text="OCR Text Extractor" classes="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400" />
            
            {/* Status & Options */}
            <div className="flex items-center gap-3">
              <div 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#0f172a]/80 border border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors"
                onClick={checkBackendStatus}
                title="Click to check connection status"
              >
                <span className={`w-2 h-2 rounded-full ${
                  backendStatus === "online" ? "bg-emerald-500 animate-pulse" :
                  backendStatus === "offline" ? "bg-rose-500" : "bg-amber-500 animate-spin"
                }`} />
                <span>Server: {backendStatus}</span>
              </div>

              {backendStatus === "online" && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="px-3 py-1.5 text-xs font-semibold bg-[#2563eb]/20 text-blue-300 border border-blue-500/30 rounded-full hover:bg-[#2563eb]/35 transition-all"
                >
                  {showHistory ? "Hide History" : "Show History"}
                </button>
              )}
            </div>
          </div>

          {/* OCR Engine Config */}
          <div className="bg-[#0f172a]/60 p-4 rounded-xl border border-gray-800/80 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-300">OCR Extraction Source</p>
              <p className="text-xs text-gray-400">Choose between local browser-only extraction or server-side pytesseract engine.</p>
            </div>
            <div className="flex bg-gray-800/80 p-1 rounded-lg border border-gray-700">
              <button
                onClick={() => setOcrMode("client")}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                  ocrMode === "client" 
                    ? "bg-[#2563eb] text-white shadow-md" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Local (Tesseract.js)
              </button>
              <button
                onClick={() => {
                  if (backendStatus !== "online") {
                    alert("Backend server is offline. Local mode is active.");
                    return;
                  }
                  setOcrMode("server");
                }}
                disabled={backendStatus !== "online"}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                  ocrMode === "server" 
                    ? "bg-[#2563eb] text-white shadow-md" 
                    : backendStatus !== "online" 
                      ? "text-gray-600 cursor-not-allowed" 
                      : "text-gray-400 hover:text-white"
                }`}
              >
                Server (FastAPI)
              </button>
            </div>
          </div>

          {/* Upload Box */}
          <div className="border-2 border-dashed border-gray-700 hover:border-blue-500/60 rounded-2xl p-8 text-center bg-[#0f172a]/30 transition-all duration-300 relative group">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              id="file-upload"
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <span className="text-blue-400 font-bold hover:underline">Click to upload</span> or drag and drop
              </div>
              <div className="text-xs text-gray-500">
                Supports PNG, JPG, JPEG, WEBP (Max 5MB)
              </div>
            </label>
            {selectedFile && (
              <div className="mt-4 text-sm font-semibold text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 py-1.5 px-4 rounded-full inline-block">
                Selected: {selectedFile.name}
              </div>
            )}
          </div>

          {/* Run Button */}
          {selectedFile && !loading && (
            <button
              onClick={processOCR}
              className="w-full mt-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-500/10 transition-all hover:scale-[1.01]"
            >
              Extract Text ({ocrMode === "client" ? "Local OCR" : "Server OCR"})
            </button>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-5 bg-rose-950/30 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
              <svg className="w-5 h-5 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Workspace Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            
            {/* Left Column: Image Preview */}
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-gray-300 mb-3 flex items-center gap-1.5">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Image Source
              </h2>
              <div className="bg-[#0f172a]/50 border border-gray-800 rounded-xl overflow-hidden min-h-[350px] flex items-center justify-center relative">
                {image ? (
                  <img
                    src={image}
                    alt="Uploaded source"
                    className="max-h-[380px] object-contain w-full p-2"
                  />
                ) : (
                  <div className="text-gray-500 flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">No image loaded</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Extracted Text */}
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold text-gray-300 flex items-center gap-1.5">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Extracted Text
                </h2>
                {extractedText && (
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors text-blue-300"
                  >
                    {copied ? (
                      <>
                        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="bg-[#0f172a]/50 border border-gray-800 rounded-xl p-4 min-h-[350px] max-h-[380px] overflow-y-auto whitespace-pre-wrap relative text-gray-100 text-sm leading-relaxed">
                {loading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0f172a]/70 backdrop-blur-xs">
                    {/* Ring Loader */}
                    <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-3" />
                    <p className="text-blue-400 font-bold text-sm">Processing OCR...</p>
                    {ocrMode === "client" && progress > 0 && (
                      <p className="text-xs text-gray-400 mt-1">{progress}% completed</p>
                    )}
                  </div>
                ) : extractedText ? (
                  extractedText
                ) : (
                  <p className="text-gray-500 italic text-center mt-32">
                    Extracted text will appear here. Select an image and click "Extract Text".
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Sidebar History Panel */}
        {showHistory && backendStatus === "online" && (
          <div className="w-full md:w-80 bg-[#1e293b]/40 backdrop-blur-md rounded-2xl border border-gray-700/50 p-5 shadow-2xl flex flex-col max-h-[750px] md:max-h-none transition-all duration-300">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700/50">
              <h2 className="text-lg font-bold text-gray-200 flex items-center gap-1.5">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                OCR History
              </h2>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-xs text-rose-400 hover:text-rose-300 font-bold hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {history.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-10">
                  No scan history yet.
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => loadHistoryItem(item)}
                    className="p-3 bg-[#0f172a]/60 border border-gray-800 hover:border-blue-500/40 rounded-xl cursor-pointer hover:bg-gray-800/40 transition-all group relative"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-bold text-blue-300 truncate w-4/5" title={item.filename}>
                        {item.filename}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHistoryItem(item.id);
                        }}
                        className="text-gray-500 hover:text-rose-400 p-0.5 rounded-md hover:bg-gray-900 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete entry"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed font-sans mb-1.5">
                      {item.extracted_text}
                    </p>
                    <span className="text-[10px] text-gray-500 block">
                      {new Date(item.timestamp).toLocaleString(undefined, { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
