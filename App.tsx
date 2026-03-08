import React, { useState, useEffect } from 'react';
import { INITIAL_DATA, SurveyData, PipeData } from './types';
import { LOGO_URL, STATUS_OPTIONS, FUNCTION_OPTIONS, TYPE_OPTIONS, SHAPES, MATERIALS, OPENING_TYPES, ATMOSPHERE_OPTIONS, SILT_DEBRIS_OPTIONS } from './constants';
import PipeTable from './components/PipeTable';
import PhotoUpload from './components/PhotoUpload';
import MapCapture from './components/MapCapture';
import { searchLocationInfo, fastAssist, enhanceRemarks, generateSketchFromPhotoAndData } from './services/geminiService';

const App: React.FC = () => {
  const [data, setData] = useState<SurveyData>(INITIAL_DATA);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [assistantVisible, setAssistantVisible] = useState(false);
  const [assistantQuery, setAssistantQuery] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');
  const [isGeneratingSketch, setIsGeneratingSketch] = useState(false);

  // Update document title for PDF export filename naming
  useEffect(() => {
    const id = data.mhNo.trim() || 'UNNAMED';
    document.title = `Manhole_Survey_${id}_${new Date().toISOString().split('T')[0]}`;
  }, [data.mhNo]);

  const handleChange = (field: keyof SurveyData, value: any) => {
    setData(prev => {
      const updates: Partial<SurveyData> = { [field]: value };
      
      // Autopopulate Chamber Size based on Clear Opening
      if (field === 'clearOpeningLength') {
        const w = prev.clearOpeningWidth;
        updates.chamberSize = [value, w].filter(Boolean).join(' x ');
      } else if (field === 'clearOpeningWidth') {
        const l = prev.clearOpeningLength;
        updates.chamberSize = [l, value].filter(Boolean).join(' x ');
      }

      return { ...prev, ...updates };
    });
  };

  const handlePipeChangeByRef = (ref: string, field: keyof PipeData, value: string) => {
    const isOutgoing = ['X', 'Y'].includes(ref);
    const listKey = isOutgoing ? 'outgoingPipes' : 'incomingPipes';
    const newList = [...data[listKey]];
    const index = newList.findIndex(p => p.ref === ref);
    if (index !== -1) {
      newList[index] = { ...newList[index], [field]: value };
      setData(prev => {
        const updates: Partial<SurveyData> = { [listKey]: newList };
        if (ref === 'X' && field === 'depth') {
          updates.shaftDepth = value;
        }
        return { ...prev, ...updates };
      });
    }
  };

  const toggleArrayItem = (field: keyof SurveyData, item: string) => {
    const current = (data[field] as string[]);
    const updated = current.includes(item) 
      ? current.filter(i => i !== item)
      : [...current, item];
    handleChange(field, updated);
  };

  const handleLocationSearch = async () => {
      setLoadingSearch(true);
      
      const getCoords = (): Promise<GeolocationPosition> => 
        new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }));

      try {
        const position = await getCoords();
        const { latitude, longitude } = position.coords;
        
        let addressFound = false;

        // Try Google Maps Geocoding API first
        try {
          const response = await fetch(`/api/maps/geocode?lat=${latitude}&lng=${longitude}`);
          if (response.ok) {
            const data = await response.json();
            if (data.address) {
              handleChange('location', data.address);
              addressFound = true;
            }
          }
        } catch (e) {
          console.warn("Google Maps geocoding failed, trying fallback...");
        }

        // Fallback to OpenStreetMap Nominatim API
        if (!addressFound) {
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
              headers: {
                'Accept-Language': 'en-GB,en;q=0.9'
              }
            });
            if (response.ok) {
              const data = await response.json();
              if (data && data.address) {
                const { house_number, road, suburb, city, town, village, postcode } = data.address;
                const addressParts = [house_number, road, suburb, city || town || village, postcode].filter(Boolean);
                const formattedAddress = addressParts.join(', ');
                handleChange('location', formattedAddress || data.display_name);
                addressFound = true;
              }
            }
          } catch (e) {
            console.warn("Nominatim geocoding failed, trying Gemini fallback...");
          }
        }

        // Final fallback to Gemini
        if (!addressFound) {
          const { text } = await searchLocationInfo(`GPS coordinates ${latitude}, ${longitude}`, latitude, longitude);
          if (text) {
            const addressMatch = text.replace(/Verified Location: /g, '').trim();
            handleChange('location', addressMatch);
          }
        }
      } catch (error) {
        console.error("Geolocation error:", error);
        // Fallback to text search if GPS fails or denied
        if (data.location) {
            const { text } = await searchLocationInfo(data.location);
            if (text) handleChange('location', text.trim());
        } else {
            alert("Geolocation failed. Please ensure location services are enabled on your device and try again.");
        }
      } finally {
        setLoadingSearch(false);
      }
  };

  const handleEnhanceRemarks = async () => {
      if (!data.remarks) return;
      setEnhancing(true);
      const enhanced = await enhanceRemarks(data.remarks);
      handleChange('remarks', enhanced);
      setEnhancing(false);
  };

  const handleAssistantSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!assistantQuery) return;
      setAssistantResponse('Thinking...');
      const response = await fastAssist(assistantQuery);
      setAssistantResponse(response);
  };

  const handleManholePlanUpload = async (base64: string) => {
    handleChange('photo1Url', base64);
    if (base64) {
      setIsGeneratingSketch(true);
      try {
        const sketchBase64 = await generateSketchFromPhotoAndData(base64, {
          incomingPipes: data.incomingPipes,
          outgoingPipes: data.outgoingPipes
        });
        if (sketchBase64) {
          handleChange('photo1Url', `data:image/png;base64,${sketchBase64}`);
        } else {
          alert("AI could not generate a sketch from this photo. Please try a clearer photo.");
        }
      } catch (e) {
        console.error("Sketch generation error", e);
        alert("An error occurred while generating the sketch. Please try again.");
      } finally {
        setIsGeneratingSketch(false);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getConditionColorClass = (val: string) => {
    if (val === 'Needs Attention') return 'bg-yellow-100 print:bg-yellow-100';
    if (val === 'Urgent') return 'bg-orange-200 print:bg-orange-200';
    return '';
  };

  const getAtmosphereActiveColor = (opt: string) => {
    switch (opt) {
      case 'Clear : O2 : 19.5%- 23.5% , LEL < 10%, CO < 35ppm, H2S < 10ppm': return 'bg-green-600 text-white border-green-700 font-bold';
      case 'Hazardous: O2 < 19.5% or H2S >10ppm': return 'bg-yellow-500 text-white border-yellow-600 font-bold';
      case 'Flammable: LEL 10%-25%': return 'bg-orange-600 text-white border-orange-700 font-bold';
      case 'DO NOT Enter : LEL >25%, Extreme Toxicity': return 'bg-red-700 text-white border-red-900 font-bold shadow-inner animate-pulse';
      default: return 'bg-brand-600 text-white border-brand-700 font-bold';
    }
  };

  const getSiltActiveColor = (opt: string) => {
    switch (opt) {
      case 'Minimal <10%': return 'bg-green-600 text-white border-green-700 font-bold';
      case 'Moderate 10-25%': return 'bg-yellow-500 text-white border-yellow-600 font-bold';
      case 'Serious 25-50%': return 'bg-orange-600 text-white border-orange-700 font-bold';
      case 'Severe >50%': return 'bg-red-600 text-white border-red-700 font-bold';
      case 'Blocked': return 'bg-slate-950 text-white border-black font-bold';
      default: return 'bg-brand-600 text-white border-brand-700 font-bold';
    }
  };

  const allPipes = [...data.incomingPipes, ...data.outgoingPipes];

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans print:p-0 print:bg-white">
      {/* Controls Bar */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center no-print">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-3 h-3 bg-brand-600 rounded-sm"></span>
            Smart Survey Portal
        </h1>
        <div className="flex gap-2">
            <button onClick={() => setAssistantVisible(!assistantVisible)} className="bg-brand-600 text-white px-4 py-2 rounded shadow-md hover:bg-brand-700 transition flex items-center gap-2 text-sm">🤖 Assistant</button>
            <button onClick={handlePrint} className="bg-slate-800 text-white px-4 py-2 rounded shadow-md hover:bg-slate-900 transition flex items-center gap-2 text-sm">🖨️ PDF Export</button>
        </div>
      </div>

      {assistantVisible && (
          <div className="fixed right-4 bottom-4 w-80 bg-white rounded-lg shadow-2xl border border-slate-200 z-50 overflow-hidden no-print">
              <div className="bg-brand-600 p-3 text-white font-bold flex justify-between items-center">
                  <span>Smart Assistant</span>
                  <button onClick={() => setAssistantVisible(false)} className="hover:bg-brand-700 rounded px-1">✕</button>
              </div>
              <div className="p-4 h-64 overflow-y-auto bg-slate-50 text-xs">
                  {assistantResponse ? <div className="whitespace-pre-wrap">{assistantResponse}</div> : <p className="text-slate-400 italic">Ask me about STC25 codes or help with technical observations...</p>}
              </div>
              <form onSubmit={handleAssistantSubmit} className="p-2 border-t flex gap-2 bg-white">
                  <input className="flex-1 border rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-brand-500 outline-none" value={assistantQuery} onChange={e => setAssistantQuery(e.target.value)} placeholder="Type a question..." />
                  <button type="submit" className="bg-brand-600 text-white px-3 py-1.5 rounded text-xs font-medium">Ask</button>
              </form>
          </div>
      )}

      {/* PAGE 1: FULL DATA SHEET */}
      <div className="page-segment">
        <img src={LOGO_URL} alt="" className="watermark" />
        <div className="flex justify-between items-start mb-4 border-b border-brand-900 pb-1 relative z-10">
            <div>
                <h1 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Manhole Survey Card</h1>
                <p className="text-[9px] text-slate-500 font-mono">STC25 COMPLIANT REF: {data.mhNo}. {data.projectId}</p>
            </div>
            <div><img src={LOGO_URL} alt="Clever Works" className="h-10 object-contain" /></div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3 text-[10px] relative z-10">
            <div className="flex items-center"><label className="w-20 font-bold text-slate-600">Card No</label><input type="text" className="flex-1 border-b border-slate-300 px-1" value={data.cardNo} onChange={(e) => handleChange('cardNo', e.target.value)} /></div>
            <div className="flex items-center"><label className="w-20 font-bold text-slate-600">Project ID</label><input type="text" className="flex-1 border-b border-slate-300 px-1" value={data.projectId} onChange={(e) => handleChange('projectId', e.target.value)} /></div>
            <div className="flex items-center"><label className="w-20 font-bold text-slate-600">Catchment</label><input type="text" className="flex-1 border-b border-slate-300 px-1" value={data.catchment} onChange={(e) => handleChange('catchment', e.target.value)} /></div>
            <div className="flex items-center"><label className="w-20 font-bold text-brand-700">Manhole ID</label><input type="text" className="flex-1 border-b border-brand-500 px-1 font-mono font-bold" value={data.mhNo} onChange={(e) => handleChange('mhNo', e.target.value)} /></div>
            <div className="col-span-2 flex items-center"><label className="w-20 font-bold text-slate-600">Location</label><div className="flex-1 flex relative"><input type="text" className="w-full border-b border-slate-300 px-1" value={data.location} onChange={(e) => handleChange('location', e.target.value)} /><button onClick={handleLocationSearch} disabled={loadingSearch} className="absolute right-0 top-0 text-brand-600 no-print text-[9px] font-bold hover:underline disabled:opacity-50">{loadingSearch ? 'Locating...' : 'GPS Verify'}</button></div></div>
        </div>

        <div className="grid grid-cols-4 gap-2 border-y border-slate-300 py-2 mb-3 bg-slate-50/30 relative z-10">
             {['status', 'function', 'mhType', 'date'].map((field) => (
                <div key={field} className="flex flex-col px-2 border-r last:border-0 border-slate-200">
                    <label className="text-[8px] uppercase font-bold text-slate-400">{field === 'mhType' ? 'MH Type' : field}</label>
                    {field === 'date' ? <input type="date" className="bg-transparent text-[10px] font-bold p-0" value={data[field as keyof SurveyData] as string} onChange={(e) => handleChange(field as keyof SurveyData, e.target.value)} /> : (
                        <select className="bg-transparent border-none text-[10px] font-bold p-0" value={data[field as keyof SurveyData] as string} onChange={(e) => handleChange(field as keyof SurveyData, e.target.value)}>
                            <option value="">Select...</option>
                            {(field === 'status' ? STATUS_OPTIONS : field === 'function' ? FUNCTION_OPTIONS : TYPE_OPTIONS).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    )}
                </div>
             ))}
        </div>

        <div className="mb-3 relative z-10">
            <h4 className="text-[9px] font-bold uppercase mb-1 text-brand-900 border-b border-brand-200">Cover Details</h4>
            <table className="w-full text-[8.5px] border-collapse border border-slate-400 mb-2 text-center">
                <thead className="bg-slate-50">
                    <tr><th className="border border-slate-400 p-1">Level (m)</th><th className="border border-slate-400 p-1">Duty</th><th className="border border-slate-400 p-1" colSpan={2}>Size (mm)</th><th className="border border-slate-400 p-1" colSpan={2}>Clear Opening (mm)</th></tr>
                </thead>
                <tbody>
                    <tr className="h-6">
                        <td className="border border-slate-400 p-0"><input type="text" className="w-full text-center" value={data.coverLevel} onChange={e => handleChange('coverLevel', e.target.value)} /></td>
                        <td className="border border-slate-400 p-0"><select className="w-full text-center bg-transparent" value={data.coverDuty} onChange={e => handleChange('coverDuty', e.target.value)}><option value=""></option><option value="H">H</option><option value="M">M</option><option value="L">L</option></select></td>
                        <td className="border border-slate-400 p-0"><input type="text" placeholder="L" className="w-full text-center" value={data.coverLength} onChange={e => handleChange('coverLength', e.target.value)} /></td>
                        <td className="border border-slate-400 p-0"><input type="text" placeholder="W" className="w-full text-center" value={data.coverWidth} onChange={e => handleChange('coverWidth', e.target.value)} /></td>
                        <td className="border border-slate-400 p-0"><input type="text" placeholder="L" className="w-full text-center" value={data.clearOpeningLength} onChange={e => handleChange('clearOpeningLength', e.target.value)} /></td>
                        <td className="border border-slate-400 p-0"><input type="text" placeholder="W" className="w-full text-center" value={data.clearOpeningWidth} onChange={e => handleChange('clearOpeningWidth', e.target.value)} /></td>
                    </tr>
                </tbody>
            </table>
            <div className="grid grid-cols-2 gap-2 text-[8px] font-bold uppercase tracking-tight">
                <div><span className="text-slate-500 mb-1 block">Geometric Configuration</span><div className="border border-slate-200 bg-brand-50/20 p-1.5 grid grid-cols-3 gap-y-1">{SHAPES.map(shape => <label key={shape} className="flex items-center gap-1 cursor-pointer"><input type="radio" name="coverShape" className="w-2.5 h-2.5" checked={data.coverShape[0] === shape} onChange={() => handleChange('coverShape', [shape])} />{shape.toUpperCase()}</label>)}</div></div>
                <div><span className="text-slate-500 mb-1 block">Technical Features</span><div className="border border-slate-200 bg-brand-50/20 p-1.5 grid grid-cols-3 gap-y-1">{OPENING_TYPES.map(type => <label key={type} className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="w-2.5 h-2.5" checked={data.openingType.includes(type)} onChange={() => toggleArrayItem('openingType', type)} />{type.toUpperCase()}</label>)}</div></div>
            </div>
        </div>

        <div className="relative z-10"><PipeTable title="Sewer Pipe Details (A-G Incoming | X-Y Outgoing)" pipes={allPipes} onChange={handlePipeChangeByRef} /></div>

        <div className="mb-3 relative z-10">
            <h3 className="text-[9px] font-bold uppercase mb-1 text-brand-900 border-b border-brand-200">Chamber & Construction</h3>
            <div className="border border-slate-300 rounded-sm bg-white">
                <div className="grid grid-cols-12 text-[8.5px]">
                <div className="col-span-4 border-r border-slate-200 p-2 space-y-3">
                    <div className="flex justify-between border-b border-slate-100 pb-1"><span className="font-bold text-slate-500">CHAMBER SIZE (MM)</span><input type="text" className="w-16 text-right font-bold" value={data.chamberSize} onChange={e => handleChange('chamberSize', e.target.value)} /></div>
                    <div className="flex justify-between border-b border-slate-100 pb-1"><span className="font-bold text-slate-500">TOTAL DEPTH (MM)</span><input type="text" className="w-16 text-right font-bold" value={data.shaftDepth} onChange={e => handleChange('shaftDepth', e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                        <div className="space-y-1">
                            <span className="font-bold text-slate-500 block text-[7.5px] uppercase">Surcharge?</span>
                            <div className="flex gap-4 mb-1">
                                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={data.evidenceOfSurcharge} onChange={() => handleChange('evidenceOfSurcharge', true)} /> YES</label>
                                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={!data.evidenceOfSurcharge} onChange={() => handleChange('evidenceOfSurcharge', false)} /> NO</label>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="font-bold text-slate-500 block text-[7.5px] uppercase">Non-return valve?</span>
                            <div className="flex gap-4 mb-1">
                                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={data.hasNonReturnValve} onChange={() => handleChange('hasNonReturnValve', true)} /> YES</label>
                                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={!data.hasNonReturnValve} onChange={() => handleChange('hasNonReturnValve', false)} /> NO</label>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="font-bold text-slate-500 block text-[7.5px] uppercase">Active Flow?</span>
                            <div className="flex gap-4 mb-1">
                                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={data.hasActiveFlow} onChange={() => handleChange('hasActiveFlow', true)} /> YES</label>
                                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={!data.hasActiveFlow} onChange={() => handleChange('hasActiveFlow', false)} /> NO</label>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="font-bold text-slate-500 block text-[7.5px] uppercase">Vermin blocker?</span>
                            <div className="flex gap-4 mb-1">
                                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={data.hasVerminBlocker} onChange={() => handleChange('hasVerminBlocker', true)} /> YES</label>
                                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={!data.hasVerminBlocker} onChange={() => handleChange('hasVerminBlocker', false)} /> NO</label>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="font-bold text-slate-500 block text-[7.5px] uppercase">Interceptor?</span>
                            <div className="flex gap-4 mb-1">
                                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={data.hasInterceptor} onChange={() => handleChange('hasInterceptor', true)} /> YES</label>
                                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={!data.hasInterceptor} onChange={() => handleChange('hasInterceptor', false)} /> NO</label>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="font-bold text-slate-500 block text-[7.5px] uppercase">Hydro-brake?</span>
                            <div className="flex gap-4 mb-1">
                                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={data.hasHydroBrake} onChange={() => handleChange('hasHydroBrake', true)} /> YES</label>
                                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={!data.hasHydroBrake} onChange={() => handleChange('hasHydroBrake', false)} /> NO</label>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-span-8 p-2">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <div><span className="font-bold text-slate-500 uppercase text-[7px] block mb-1">Atmosphere</span><div className="flex flex-col gap-1">{ATMOSPHERE_OPTIONS.map(opt => <button key={opt} onClick={() => handleChange('atmosphere', opt)} className={`px-1.5 py-1 text-[8px] border rounded transition-all flex justify-between items-start shadow-sm ${data.atmosphere === opt ? getAtmosphereActiveColor(opt) : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}><span className="text-left flex-1 pr-1">{opt}</span>{data.atmosphere === opt && <span className="text-[10px] shrink-0 mt-0.5">✓</span>}</button>)}</div></div>
                        <div><span className="font-bold text-slate-500 uppercase text-[7px] block mb-1">Silt Status</span><div className="flex flex-col gap-1">{SILT_DEBRIS_OPTIONS.map(opt => <button key={opt} onClick={() => handleChange('siltDebrisStatus', opt)} className={`px-1.5 py-1 text-[8px] border rounded transition-all flex justify-between items-center shadow-sm ${data.siltDebrisStatus === opt ? getSiltActiveColor(opt) : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}><span>{opt}</span>{data.siltDebrisStatus === opt && <span className="text-[10px]">✓</span>}</button>)}</div></div>
                    </div>
                    <div className="pt-1 border-t border-slate-100"><span className="font-bold text-slate-500 uppercase text-[7px] block mb-1">Materials</span><div className="flex flex-wrap gap-x-3 gap-y-0.5">{MATERIALS.map(mat => <label key={mat} className="flex items-center gap-1 cursor-pointer text-[8px]"><input type="checkbox" checked={data.constructionMaterial.includes(mat)} onChange={() => toggleArrayItem('constructionMaterial', mat)} /> {mat}</label>)}</div></div>
                </div>
            </div>
            </div>
        </div>

        <div className="mb-3 relative z-10">
            <h3 className="text-[9px] font-bold uppercase mb-1 text-brand-900 border-b border-brand-200">Condition Assessment</h3>
            <table className="w-full text-[8.5px] text-center border-collapse">
                <thead><tr className="bg-slate-50"><th className="text-left p-1 border border-slate-300">Feature</th><th className="p-1 border border-slate-300">OK</th><th className="p-1 border border-slate-300">Attention</th><th className="p-1 border border-slate-300">Urgent</th><th className="text-left p-1 border border-slate-300">Feature</th><th className="p-1 border border-slate-300">OK</th><th className="p-1 border border-slate-300">Attention</th><th className="p-1 border border-slate-300">Urgent</th></tr></thead>
                <tbody>
                    {[['conditionCover', 'Cover & Frame', 'conditionChamber', 'Chamber Walls'], ['conditionShaft', 'Shaft / Corbel', 'conditionBenching', 'Benching'], ['conditionIrons', 'Irons / Ladder', 'conditionChannel', 'Channel / Pipes']].map((row, idx) => {
                        const sL = data[row[0] as keyof SurveyData] as string; const sR = data[row[2] as keyof SurveyData] as string;
                        const cL = getConditionColorClass(sL); const cR = getConditionColorClass(sR);
                        return (<tr key={idx} className="h-6"><td className={`text-left p-1 font-bold border border-slate-300 ${cL || 'bg-slate-50/20'}`}>{row[1]}</td>{['OK', 'Needs Attention', 'Urgent'].map(s => <td key={s} className={`border border-slate-300 ${cL}`}><input type="checkbox" className="scale-75" checked={sL === s} onChange={() => handleChange(row[0] as keyof SurveyData, s)} /></td>)}<td className={`text-left p-1 font-bold border border-slate-300 ${cR || 'bg-slate-50/20'}`}>{row[3]}</td>{['OK', 'Needs Attention', 'Urgent'].map(s => <td key={s} className={`border border-slate-300 ${cR}`}><input type="checkbox" className="scale-75" checked={sR === s} onChange={() => handleChange(row[2] as keyof SurveyData, s)} /></td>)}</tr>);
                    })}
                </tbody>
            </table>
        </div>

        <div className="mb-2 relative z-10">
            <h3 className="text-[9px] font-bold uppercase mb-1 text-brand-900 border-b border-brand-200">General Remarks</h3>
            <textarea className="w-full border border-slate-200 p-2 text-[9px] h-16 leading-snug rounded-sm bg-slate-50/10 mb-1" value={data.remarks} onChange={e => handleChange('remarks', e.target.value)} />
            <div className="flex justify-end"><button onClick={handleEnhanceRemarks} disabled={enhancing || !data.remarks} className="no-print bg-brand-600 hover:bg-brand-700 text-white text-[9px] font-bold py-1.5 px-4 rounded shadow-sm flex items-center gap-2 disabled:opacity-50 transition-all">{enhancing ? '✨ Professionalizing...' : '✨ AI Text Enhancer'}</button></div>
        </div>
      </div>

      {/* PAGE 2: MEDIA & SKETCHES - UPDATED TO FILL A4 */}
      <div className="page-segment flex flex-col h-full">
        <img src={LOGO_URL} alt="" className="watermark" />
        <div className="flex justify-between items-start mb-6 border-b border-brand-900 pb-1 relative z-10 shrink-0">
            <div><h1 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Site Photo Gallery</h1><p className="text-[9px] text-slate-500 font-mono">REF: {data.mhNo}. {data.projectId}</p></div>
            <div><img src={LOGO_URL} alt="Clever Works" className="h-10 object-contain" /></div>
        </div>

        <div className="flex flex-col flex-1 relative z-10">
            <h3 className="text-[11px] font-bold uppercase mb-4 text-brand-900 border-b-4 border-brand-900 pb-2 shrink-0">Technical Sketch & Site Photos</h3>
            {/* Grid stretched to occupy most of the page */}
            <div className="grid grid-cols-2 grid-rows-2 gap-6 flex-1 mb-8">
                <div className="col-span-2 flex flex-col h-full overflow-hidden"><MapCapture label="Site Location / Orientation" lat={data.mapLat} lng={data.mapLng} onChange={(lat, lng) => { handleChange('mapLat', lat); handleChange('mapLng', lng); }} /></div>
                <div className="flex flex-col h-full overflow-hidden"><PhotoUpload label="Internal Chamber View" value={data.photo3Url} onChange={(val) => handleChange('photo3Url', val)} enableGenAI /></div>
                <div className="flex flex-col h-full overflow-hidden relative">
                    <PhotoUpload label="Manhole Plan (Technical Sketch)" value={data.photo1Url} onChange={handleManholePlanUpload} enableGenAI />
                    {isGeneratingSketch && (
                        <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10 rounded-lg border-2 border-brand-400">
                            <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                            <span className="text-xs font-bold text-brand-700">Generating CAD Sketch...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
        
        <div className="mt-auto py-8 text-center text-slate-200 text-[10px] uppercase tracking-[0.3em] font-black border-t border-slate-100 relative z-10 shrink-0">
            End of Record &bull; Clever Works Digital &bull; Card STC25
        </div>
      </div>

      {/* PAGE 3: ADDITIONAL PHOTOS */}
      <div className="page-segment flex flex-col h-full">
        <img src={LOGO_URL} alt="" className="watermark" />
        <div className="flex justify-between items-start mb-6 border-b border-brand-900 pb-1 relative z-10 shrink-0">
            <div><h1 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Site Photo Gallery</h1><p className="text-[9px] text-slate-500 font-mono">REF: {data.mhNo}. {data.projectId}</p></div>
            <div><img src={LOGO_URL} alt="Clever Works" className="h-10 object-contain" /></div>
        </div>

        <div className="flex flex-col flex-1 relative z-10">
            <h3 className="text-[11px] font-bold uppercase mb-4 text-brand-900 border-b-4 border-brand-900 pb-2 shrink-0">Additional Detail</h3>
            {/* Grid stretched to occupy most of the page */}
            <div className="grid grid-cols-2 grid-rows-2 gap-6 flex-1 mb-8">
                <div className="flex flex-col h-full overflow-hidden"><PhotoUpload label={data.photo4Label || 'Additional Detail / Damage'} value={data.photo4Url} onChange={(val) => handleChange('photo4Url', val)} editableLabel onLabelChange={(val) => handleChange('photo4Label', val)} /></div>
                <div className="flex flex-col h-full overflow-hidden"><PhotoUpload label={data.photo5Label || 'Additional detail'} value={data.photo5Url} onChange={(val) => handleChange('photo5Url', val)} editableLabel onLabelChange={(val) => handleChange('photo5Label', val)} /></div>
                <div className="flex flex-col h-full overflow-hidden"><PhotoUpload label={data.photo6Label || 'Additional detail'} value={data.photo6Url} onChange={(val) => handleChange('photo6Url', val)} editableLabel onLabelChange={(val) => handleChange('photo6Label', val)} /></div>
                <div className="flex flex-col h-full overflow-hidden"><PhotoUpload label={data.photo7Label || 'Additional detail'} value={data.photo7Url} onChange={(val) => handleChange('photo7Url', val)} editableLabel onLabelChange={(val) => handleChange('photo7Label', val)} /></div>
            </div>
        </div>
        
        <div className="mt-auto py-8 text-center text-slate-200 text-[10px] uppercase tracking-[0.3em] font-black border-t border-slate-100 relative z-10 shrink-0">
            End of Record &bull; Clever Works Digital &bull; Card STC25
        </div>
      </div>

      {/* PAGE 4: END OF DOCUMENT */}
      <div className="page-segment flex flex-col items-center justify-center">
        <img src={LOGO_URL} alt="" className="watermark" />
        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
          <span className="text-slate-300 font-bold uppercase tracking-[0.8em] text-xl opacity-40">
            End of Document
          </span>
          <div className="mt-8 w-16 h-0.5 bg-slate-200 opacity-30"></div>
        </div>
      </div>
    </div>
  );
};

export default App;