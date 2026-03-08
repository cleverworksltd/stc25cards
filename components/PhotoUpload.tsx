import React, { useState, useRef } from 'react';
import { analyzeManholePhoto, editPhoto, generatePlanSketch } from '../services/geminiService';

interface PhotoUploadProps {
  label: string;
  value?: string;
  onChange: (base64: string) => void;
  enableGenAI?: boolean;
  editableLabel?: boolean;
  onLabelChange?: (newLabel: string) => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ label, value, onChange, enableGenAI, editableLabel, onLabelChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [showTools, setShowTools] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimension 1024
          const MAX_DIMENSION = 1024;
          if (width > height && width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          } else if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8);
            onChange(resizedBase64);
          } else {
            onChange(reader.result as string);
          }
          
          if (fileInputRef.current) fileInputRef.current.value = '';
          if (cameraInputRef.current) cameraInputRef.current.value = '';
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!value) return;
    setIsProcessing(true);
    const result = await analyzeManholePhoto(value);
    setAnalysisResult(result);
    setIsProcessing(false);
  };

  const handleEdit = async () => {
    if (!value || !editPrompt) return;
    setIsProcessing(true);
    const newImage = await editPhoto(value, editPrompt);
    if (newImage) {
      onChange(`data:image/jpeg;base64,${newImage}`);
      setEditPrompt('');
    }
    setIsProcessing(false);
  };

  const handleGenerate = async () => {
    setIsProcessing(true);
    const newImage = await generatePlanSketch(`Standard manhole plan view with technical engineering style for label: ${label}`);
    if (newImage) {
      onChange(`data:image/png;base64,${newImage}`);
    }
    setIsProcessing(false);
  }

  return (
    <div className="border-2 border-dashed border-slate-300 rounded-lg p-3 flex flex-col items-center justify-center bg-slate-50 min-h-[320px] h-full relative group transition-all hover:border-brand-400">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
      <input type="file" ref={cameraInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
      
      {value ? (
        <div className="relative w-full h-full flex flex-col items-center">
          {editableLabel ? (
            <input 
              type="text" 
              value={label} 
              onChange={(e) => onLabelChange?.(e.target.value)} 
              className="text-[10px] text-slate-500 mb-2 uppercase font-black tracking-wider border-b border-slate-200 pb-1 w-full text-center bg-transparent outline-none focus:border-brand-400"
              placeholder="Enter description..."
            />
          ) : (
            <p className="text-[10px] text-slate-500 mb-2 uppercase font-black tracking-wider border-b border-slate-200 pb-1 w-full text-center">{label}</p>
          )}
          <img src={value} alt={label} className="flex-1 max-h-[350px] w-full object-contain rounded shadow-sm mb-2 bg-white" />
          <div className="flex flex-wrap justify-center gap-1 no-print mt-1">
            <button onClick={() => fileInputRef.current?.click()} className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[9px] font-bold hover:bg-slate-300">📁 Storage</button>
            <button onClick={() => cameraInputRef.current?.click()} className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[9px] font-bold hover:bg-slate-300">📸 Camera</button>
            <button onClick={() => onChange('')} className="px-2 py-1 bg-red-100 text-red-700 rounded text-[9px] font-bold hover:bg-red-200">Clear</button>
            {enableGenAI && (
               <button onClick={() => setShowTools(!showTools)} className="px-2 py-1 bg-brand-100 text-brand-700 rounded text-[9px] font-bold hover:bg-brand-200 flex items-center gap-1">AI</button>
            )}
          </div>

          {showTools && enableGenAI && (
             <div className="absolute top-12 left-2 right-2 p-2 bg-white border border-brand-200 rounded shadow-lg no-print z-50">
                <div className="flex flex-col gap-2">
                    <button onClick={handleAnalyze} disabled={isProcessing} className="w-full text-left px-2 py-1 bg-slate-50 hover:bg-slate-100 rounded text-[10px] text-slate-700">
                        {isProcessing ? 'Analyzing...' : '🔍 Analyze'}
                    </button>
                    {analysisResult && <div className="text-[9px] p-1 bg-yellow-50 text-yellow-800 rounded border border-yellow-200">{analysisResult}</div>}
                    <div className="flex gap-1 border-t pt-1">
                        <input type="text" value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} placeholder="Edit prompt..." className="flex-1 text-[10px] border rounded p-1" />
                        <button onClick={handleEdit} disabled={isProcessing || !editPrompt} className="px-2 py-1 bg-brand-600 text-white rounded text-[10px]">Go</button>
                    </div>
                </div>
             </div>
          )}
        </div>
      ) : (
        <div className="text-center p-2 w-full flex flex-col items-center justify-center h-full">
            {editableLabel ? (
              <input 
                type="text" 
                value={label} 
                onChange={(e) => onLabelChange?.(e.target.value)} 
                className="text-[10px] text-slate-500 mb-6 uppercase font-black tracking-wider border-b border-slate-200 pb-1 w-full text-center bg-transparent outline-none focus:border-brand-400"
                placeholder="Enter description..."
              />
            ) : (
              <p className="text-[10px] text-slate-500 mb-6 uppercase font-black tracking-wider border-b border-slate-200 pb-1 w-full">{label}</p>
            )}
            <div className="flex flex-col gap-3 w-full max-w-[160px] no-print">
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-300 rounded-md shadow-sm text-[12px] font-bold text-slate-700 hover:bg-slate-50 hover:border-brand-400 transition-all">
                    <span className="text-xl">📁</span> Storage
                </button>
                <button onClick={() => cameraInputRef.current?.click()} className="flex items-center justify-center gap-2 px-4 py-3 bg-brand-50 border border-brand-200 rounded-md shadow-sm text-[12px] font-bold text-brand-700 hover:bg-brand-100 transition-all">
                    <span className="text-xl">📸</span> Camera
                </button>
            </div>
             {enableGenAI && label.toLowerCase().includes("plan") && (
                 <button onClick={handleGenerate} className="mt-6 text-[10px] font-bold text-brand-600 hover:text-brand-800 no-print flex items-center gap-1">✨ AI Sketch Assistant</button>
             )}
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;