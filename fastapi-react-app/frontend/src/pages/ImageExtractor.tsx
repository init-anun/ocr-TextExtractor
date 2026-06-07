import React, { useState, ChangeEvent } from 'react';
import Tesseract from 'tesseract.js';
import Title from '../components/Title';

export default function ImageExtractor() {
   const [image, setImage] = useState<string | null>(null);
   const [extractedText, setExtractedText] = useState("");
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");
 
   const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
 
   const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
 
     setError("");
     setExtractedText("");
 
     if (!file) return;
 
     // Validate image type
     if (!allowedTypes.includes(file.type)) {
       setError("Only PNG, JPG, JPEG, and WEBP images are allowed.");
       return;
     }
 
     // Validate size (5MB max)
     if (file.size > 5 * 1024 * 1024) {
       setError("Image size must be less than 5MB.");
       return;
     }
 
     const imageUrl = URL.createObjectURL(file);
     setImage(imageUrl);
 
     try {
       setLoading(true);
 
       const result = await Tesseract.recognize(file, "eng", {
         logger: (m) => {
           console.log(m);
         },
       });
 
       setExtractedText(result.data.text);
     } catch (err) {
       console.error(err);
       setError("Failed to extract text from image.");
     } finally {
       setLoading(false);
     }
   };
 
   return (
     <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
       <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-6">
         <h1 className="text-3xl font-bold text-center mb-6">
           OCR Text Extractor
         </h1>
 
         {/* Upload */}
         <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
           <input
             type="file"
             accept="image/*"
             onChange={handleImageChange}
             className="block w-full text-sm text-gray-600
             file:mr-4 file:py-2 file:px-4
             file:rounded-lg file:border-0
             file:text-sm file:font-semibold
             file:bg-blue-600 file:text-white
             hover:file:bg-blue-700"
           />
         </div>
 
         {/* Error */}
         {error && (
           <div className="mt-4 bg-red-100 text-red-700 px-4 py-3 rounded-lg">
             {error}
           </div>
         )}
 
         {/* Preview + OCR */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
           {/* Image Preview */}
           <div>
             <h2 className="text-xl font-semibold mb-3">Image Preview</h2>
 
             {image ? (
               <img
                 src={image}
                 alt="Preview"
                 className="rounded-xl border max-h-[400px] object-contain w-full"
               />
             ) : (
               <div className="border rounded-xl h-[300px] flex items-center justify-center text-gray-400">
                 No image selected
               </div>
             )}
           </div>
 
           {/* Extracted Text */}
           <div>
             <h2 className="text-xl font-semibold mb-3">Extracted Text</h2>
 
             <div className="border rounded-xl p-4 h-[400px] overflow-auto bg-gray-50 whitespace-pre-wrap">
               {loading ? (
                 <div className="flex items-center justify-center h-full">
                   <p className="text-blue-600 font-medium">
                     Extracting text...
                   </p>
                 </div>
               ) : extractedText ? (
                 extractedText
               ) : (
                 <p className="text-gray-400">
                   Extracted text will appear here
                 </p>
               )}
             </div>
           </div>
         </div>
       </div>
     </div>
   );   
}
