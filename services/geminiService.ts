
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export const getTornadoCommentary = async (score: number, isNight: boolean): Promise<string> => {
  try {
    // Garante que a chave seja uma string, evitando que o SDK falhe ao tentar processar undefined
    const apiKey = (process.env.API_KEY || "").toString();
    const ai = new GoogleGenAI({ apiKey });
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Você é um operador de rádio enviando mensagens para um caçador de tempestades em primeira pessoa no meio de uma floresta à noite estilo Minecraft. Ele destruiu ${score} árvores. Dê um aviso ou comentário de rádio curto e tenso (máximo 12 palavras) sobre o tornado que está por perto.`,
      config: {
        temperature: 1.0,
      }
    });
    
    return response.text?.trim() || "Cuidado, a pressão está caindo drasticamente!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Sinal de rádio fraco... o vento está aumentando...";
  }
};
