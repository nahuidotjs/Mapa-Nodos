import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Uses Gemini to extract valid Latitude/Longitude from a natural language string.
 * e.g. "My house in Mexico City" -> { lat: 19.4326, lng: -99.1332, name: "Mexico City" }
 */
export const parseLocation = async (userInput: string): Promise<{ lat: number; lng: number; name: string } | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Extract the geographic coordinates (latitude and longitude) for the location described in: "${userInput}". 
      Return a JSON object. If the location is ambiguous, choose the most likely major city/landmark.
      If valid, return lat, lng, and a short display name.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            valid: { type: Type.BOOLEAN, description: "True if a location was found" },
            lat: { type: Type.NUMBER },
            lng: { type: Type.NUMBER },
            name: { type: Type.STRING, description: "Standardized name of the location" }
          },
          required: ["valid", "lat", "lng", "name"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;

    const data = JSON.parse(text);
    if (!data.valid) return null;

    return {
      lat: data.lat,
      lng: data.lng,
      name: data.name
    };

  } catch (error) {
    console.error("Error parsing location with Gemini:", error);
    return null;
  }
};
