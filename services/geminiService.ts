import { GoogleGenAI, Type } from "@google/genai";

const getAi = () => {
  const apiKey = process.env.API_KEY || '';
  return new GoogleGenAI({ apiKey });
};

const parseBase64 = (fullBase64: string) => {
  let mimeType = 'image/jpeg';
  let base64Data = fullBase64;
  if (fullBase64.startsWith('data:')) {
    const match = fullBase64.match(/^data:(image\/[a-zA-Z0-9.+]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      base64Data = match[2];
    } else {
      base64Data = fullBase64.split(',')[1] || fullBase64;
    }
  }
  return { mimeType, base64Data };
};

export const analyzeManholePhoto = async (fullBase64: string): Promise<string> => {
  try {
    const ai = getAi();
    const { mimeType, base64Data } = parseBase64(fullBase64);
    const model = 'gemini-3.1-pro-preview';
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: "Analyze this manhole photo. ALmost all manholes have an upstream and downstream channel. Identify them, then identify number of incoming laterals.." }
        ]
      }
    });
    return response.text || "Analysis failed.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Error analyzing image.";
  }
};

export const editPhoto = async (fullBase64: string, instruction: string): Promise<string | null> => {
  try {
    const ai = getAi();
    const { mimeType, base64Data } = parseBase64(fullBase64);
    // Using flash image for editing as per instructions
    const model = 'gemini-3.1-flash-image-preview';
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: instruction }
        ]
      }
    });

    // Check for image part in response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }
    return null;
  } catch (error) {
    console.error("Gemini Edit Error:", error);
    return null;
  }
};

export const generatePlanSketch = async (description: string): Promise<string | null> => {
    try {
        const model = 'gemini-3.1-flash-image-preview';
        const response = await ai.models.generateContent({
            model,
            contents: {
                parts: [{ text: `Generate a technical engineering line drawing (plan view) of a manhole layout based on this description: ${description}. White background, black lines, technical style.` }]
            },
            config: {
                imageConfig: {
                    aspectRatio: "1:1",
                    imageSize: "1K"
                }
            }
        });

         for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        return null;
    } catch (e) {
        console.error("Gemini Generate Error", e);
        return null;
    }
}

export const generateSketchFromPhotoAndData = async (fullBase64: string, pipesData: any): Promise<string | null> => {
    try {
        const ai = getAi();
        const { mimeType, base64Data } = parseBase64(fullBase64);
        // Step 1: Analyze the photo
        const analyzeModel = 'gemini-3.1-pro-preview';
        
        // Filter active pipes from the table
        const activeIncoming = pipesData.incomingPipes.filter((p: any) => p.diameter || p.material || p.depth || p.ref === 'A');
        const activeOutgoing = pipesData.outgoingPipes.filter((p: any) => p.diameter || p.material || p.depth || p.ref === 'X');
        
        const tableDataText = `Table Data: Incoming pipes: ${activeIncoming.map((p:any)=>p.ref).join(', ')}. Outgoing pipes: ${activeOutgoing.map((p:any)=>p.ref).join(', ')}.`;

        const analyzeResponse = await ai.models.generateContent({
            model: analyzeModel,
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64Data } },
                    { text: `Analyze this photo of an internal manhole chamber which has arrows drawn on the inlets and outfall. Determine the manhole's shape (square, rectangle, or circle). Almost all manholes have an upstream and downstream channel. Identify them, then identify the number of other incoming laterals (inlets). Cross reference with the user's input from the Sewer Pipe Details: ${tableDataText}. Everything should match. Reply with a detailed description of the shape and the positions of all pipes (A to G for inlets, X for downstream) based on the photo, arrows, and table data.` }
                ]
            }
        });
        
        const analysisText = analyzeResponse.text || "A circular manhole.";

        // Step 2: Generate the CAD sketch
        const generateModel = 'gemini-3.1-flash-image-preview';
        const generateResponse = await ai.models.generateContent({
            model: generateModel,
            contents: {
                parts: [
                    { text: `Create a technical black and white civil-engineering diagram (plan view) of the manhole based on this analysis: "${analysisText}". Don't add sizes or scale, but label the pipes in the manhole exactly as per the table (A to G for inlets, X for downstream). White background, black lines, clean engineering style.` }
                ]
            },
            config: {
                imageConfig: {
                    aspectRatio: "1:1",
                    imageSize: "1K"
                }
            }
        });

        for (const part of generateResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        return null;

    } catch (e) {
        console.error("Gemini Sketch Generation Error", e);
        return null;
    }
}

export const searchLocationInfo = async (query: string, lat?: number, lng?: number) => {
    try {
        const ai = getAi();
        // Maps grounding is only supported in Gemini 2.5 series models.
        const model = 'gemini-2.5-flash';
        const response = await ai.models.generateContent({
            model,
            contents: `Using Google Maps data, determine the most accurate street address and postcode for this query/location: "${query}". Format: [Street Name], [Town/City], [Postcode]. Output ONLY the single-line address string.`,
            config: {
                tools: [{ googleMaps: {} }],
                toolConfig: {
                    retrievalConfig: {
                        latLng: lat !== undefined && lng !== undefined ? { latitude: lat, longitude: lng } : undefined
                    }
                }
            }
        });
        
        const text = response.text;
        return { text, urls: [] };
    } catch (e) {
        console.error("Maps Search Error", e);
        return { text: "Search unavailable", urls: [] };
    }
}

export const fastAssist = async (query: string): Promise<string> => {
    try {
        const ai = getAi();
        const model = 'gemini-3.1-flash-lite-preview'; // "Fast AI responses" feature
        const response = await ai.models.generateContent({
            model,
            contents: `You are a civil engineering assistant specialized in drainage. Answer briefly: ${query}`
        });
        return response.text || "";
    } catch (e) {
        return "";
    }
}

export const enhanceRemarks = async (text: string): Promise<string> => {
    try {
        const ai = getAi();
        const model = 'gemini-3.1-pro-preview';
        const response = await ai.models.generateContent({
            model,
            contents: `As a senior drainage engineer, professionalize and clarify the following site remarks for a formal STC25 survey report. Keep the technical facts but improve grammar and professional tone. Output only the improved text: "${text}"`
        });
        return response.text || text;
    } catch (e) {
        console.error("Enhance Error", e);
        return text;
    }
}