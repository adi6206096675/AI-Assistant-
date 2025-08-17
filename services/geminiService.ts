
import { GoogleGenAI, Chat, Part, Tool, GroundingMetadata } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

export function createChatSession(systemInstruction: string, tools?: Tool[]): Chat {
  return ai.chats.create({
    model,
    config: {
      systemInstruction,
      tools,
    },
  });
}

export async function sendMessageStream(
    chat: Chat,
    messageParts: (string | Part)[],
    onChunk: (chunk: string) => void,
    onComplete: (metadata: GroundingMetadata | undefined) => void
): Promise<void> {
  try {
    const resultStream = await chat.sendMessageStream({ message: messageParts });
    
    let finalMetadata: GroundingMetadata | undefined;

    // Process stream for text chunks and collect metadata
    for await (const chunk of resultStream) {
        if (chunk.text) {
            onChunk(chunk.text);
        }
        if (chunk.candidates?.[0]?.groundingMetadata) {
            finalMetadata = chunk.candidates[0].groundingMetadata;
        }
    }
    
    // Call onComplete with the final metadata after the stream is finished
    onComplete(finalMetadata);

  } catch (error) {
    console.error("Gemini API call failed:", error);
    throw new Error("Failed to get a response from the AI. Please check your API key and network connection.");
  }
}
