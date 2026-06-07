// App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ImageExtractor from "./pages/ImageExtractor";

export default function App() {
  
  return (
    <div className="appContainer">
      <Router>
        <Routes>
          <Route path="/" element={<ImageExtractor />} />
          <Route path="/image-extractor" element={<ImageExtractor />} />
        </Routes>
      </Router>

    </div>  )
};