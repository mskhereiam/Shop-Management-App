import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiInstance;
}

export async function askShopCopilot(prompt: string, contextData: any): Promise<string> {
  const ai = getGeminiClient();

  if (!ai) {
    // Generate a helpful fallback message + basic context insights if API key is not configured
    const lowStockCount = contextData?.products?.filter((p: any) => (p.stock || 0) <= (p.minStockAlert || 5))?.length || 0;
    const totalSales = contextData?.sales?.reduce((acc: number, s: any) => acc + (s.grandTotal || 0), 0) || 0;

    return `⚠️ **Gemini API Key Missing**

Please add the **GEMINI_API_KEY** secret in AI Studio's **Settings > Secrets** panel.

---

📊 **Automatic Shop Data Summary:**
• **Total Sales:** ৳${totalSales.toLocaleString()}
• **Low Stock Items:** ${lowStockCount} items
• **Tip:** Add your Gemini API Key in Settings > Secrets to activate real-time AI advice and intelligent chat!`;
  }

  const systemInstruction = `
You are ShopMind AI, a world-class AI Copilot for retail shop owners and inventory managers.
Provide clear, actionable, professional advice, data insights, reorder recommendations, or auto-categorization in Bengali and English as requested.
When given sales, inventory, or expense context, analyze trends, spot low stock risks, and offer concise bullet points or summaries.
Keep responses concise, clear, visual, and highly practical.
`;

  const userContent = `
Current Shop Context Data:
${JSON.stringify(contextData, null, 2)}

User Question/Request:
${prompt}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: userContent,
      config: {
        systemInstruction
      }
    });

    return response.text || 'No response generated from ShopCopilot.';
  } catch (err: any) {
    console.error('Gemini Generate Error:', err);
    return `⚠️ AI Service Error: ${err?.message || 'Error communicating with Gemini'}. Please ensure a valid GEMINI_API_KEY is configured in AI Studio Settings > Secrets.`;
  }
}

export async function parseReceiptText(receiptContent: string): Promise<any> {
  const ai = getGeminiClient();

  if (!ai) {
    return {
      vendor: "Auto Receipt",
      date: new Date().toISOString().split('T')[0],
      items: [],
      total: 0,
      note: "Gemini API Key is required. Please set GEMINI_API_KEY in Settings > Secrets."
    };
  }

  const prompt = `
Extract itemized product line items from this raw receipt text or OCR text.
Return a valid JSON object with the following structure:
{
  "vendor": "string",
  "date": "YYYY-MM-DD",
  "items": [
    { "name": "string", "qty": number, "unitPrice": number }
  ],
  "total": number
}

Receipt text:
${receiptContent}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '{}';
    try {
      return JSON.parse(text);
    } catch (e) {
      return { rawText: text, items: [] };
    }
  } catch (err) {
    return { vendor: "Manual Entry Required", items: [], total: 0 };
  }
}

