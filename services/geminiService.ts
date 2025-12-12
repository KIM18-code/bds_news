import { GoogleGenAI, Type } from "@google/genai";
import { Category, NewsItem, Briefing, AnalysisData } from "../types";

// Helper to get safe API Key
const getApiKey = () => process.env.GEMINI_API_KEY || '';
/**
 * Fetches latest news using Gemini 2.5 Flash with Google Search Grounding
 * FIX: Removed responseMimeType: 'application/json' to allow Google Search tool to work.
 * Manual JSON parsing is implemented.
 */
export const fetchNewsWithGemini = async (): Promise<NewsItem[]> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("No API Key found. Using mock data.");
    return []; // Caller handles fallback
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Tìm kiếm các tin tức mới nhất (trong 24-48 giờ qua) về Bất động sản Việt Nam và ứng dụng AI/Công nghệ trong BĐS (PropTech).
    
    Hãy tìm tin tức bao phủ các chủ đề sau:
    1. Thị trường & Giá cả (Market & Price)
    2. Chính sách & Pháp lý (Policy & Legal)
    3. BĐS Nghỉ dưỡng & Second home
    4. AI & PropTech (Công nghệ trong BĐS)
    5. Rủi ro thiên tai ảnh hưởng BĐS (Mưa lũ, sạt lở, biến đổi khí hậu)
    6. Dữ liệu & Báo cáo doanh nghiệp

    Yêu cầu đầu ra:
    Trả về một mảng JSON (Array) các đối tượng tin tức. 
    KHÔNG trả về markdown formatting (như \`\`\`json). Chỉ trả về raw JSON string.
    
    Mỗi đối tượng MẮT BUỘC phải có các trường sau:
    - title: Tiêu đề bài viết (ngắn gọn).
    - source: Tên nguồn báo.
    - timeAgo: Thời gian đăng (ví dụ: "2 giờ trước").
    - category: Phải thuộc một trong các giá trị chính xác sau: "${Object.values(Category).join('", "')}".
    - summaryPoints: Một mảng chứa đúng 3 chuỗi string, tóm tắt ý chính của bài báo.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType: "application/json" // Removed to fix 400 error
      }
    });

    const rawText = response.text || "";
    
    // Clean potential markdown blocks
    const jsonString = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    let parsedNews: any[] = [];
    try {
        parsedNews = JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse JSON from Gemini text response", e);
        // Attempt to find array within text
        const arrayMatch = jsonString.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
            try {
                parsedNews = JSON.parse(arrayMatch[0]);
            } catch (e2) {
                return [];
            }
        } else {
            return [];
        }
    }
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    return parsedNews.map((item, index) => {
        // Try to map grounding chunks to items, though index alignment isn't guaranteed with search tool output structure sometimes.
        let url = `https://www.google.com/search?q=${encodeURIComponent(item.title)}`;
        
        // Simple heuristic to grab a link if available
        if (groundingChunks.length > index && groundingChunks[index].web?.uri) {
             url = groundingChunks[index].web.uri;
        }

        return {
            id: `gen-${Date.now()}-${index}`,
            title: item.title,
            source: item.source || "Google Search",
            timeAgo: item.timeAgo,
            category: item.category as Category,
            summaryPoints: item.summaryPoints,
            url: url
        };
    });

  } catch (error) {
    console.error("Error fetching news with Gemini:", error);
    // Don't throw, return empty so app continues with mock data or empty state
    return [];
  }
};

/**
 * Generates a detailed analysis for a specific article using Gemini 3 Pro
 * Implements the 7-step Investor Analysis Methodology
 */
export const analyzeArticle = async (newsItem: NewsItem): Promise<AnalysisData | null> => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Bạn là chuyên gia phân tích đầu tư Bất động sản chuyên nghiệp tại Việt Nam.
    Hãy thực hiện phân tích bài báo sau đây theo quy trình 7 bước nghiêm ngặt dành cho nhà đầu tư:

    BÀI BÁO:
    Tiêu đề: ${newsItem.title}
    Nguồn: ${newsItem.source}
    Tóm tắt: ${newsItem.summaryPoints.join('. ')}

    NHIỆM VỤ PHÂN TÍCH:
    
    1. HIỂU BẢN CHẤT:
       - Tách nội dung thành: Dữ kiện, Nguyên nhân, Tác động.
       - Đánh giá mức độ ảnh hưởng (Low / Medium / High).

    2. GẮN VÀO BỐI CẢNH THỊ TRƯỜNG:
       - Phân khúc nào bị ảnh hưởng? (Nhà phố, đất nền, nghỉ dưỡng, farmstay, ven hồ, công nghiệp...)
       - Khu vực nào bị tác động? (TPHCM, Hà Nội, Lâm Đồng, Tây Nguyên, Ven biển...)
       - Là Cơ hội hay Rủi ro?

    3. PHÂN TÍCH TÁC ĐỘNG ĐA CHIỀU:
       - Tác động đến giá BĐS?
       - Tác động đến tâm lý nhà đầu tư?
       - Tác động đến dòng tiền & thanh khoản?
       - Tác động pháp lý & quy hoạch?
       - Tác động rủi ro thiên tai (đặc biệt khu đồi, ven hồ)?
       - Tác động tài chính & vay vốn?

    4. GÓC NHÌN SECOND HOME / VEN HỒ / TÂY NGUYÊN:
       - Ảnh hưởng cụ thể tới BĐS ven hồ, đồi, second home?
       - Tác động riêng tới khu vực Di Linh - Lâm Đồng - Tây Nguyên?
       - Phản ứng của người mua thực vs đầu cơ?

    5. ĐỀ XUẤT CHIẾN LƯỢC:
       - A. Cơ hội (Giá tốt, Dòng tiền, Xu hướng...)
       - B. Rủi ro (Pháp lý, Thanh khoản, Thiên tai...)
       - C. Hành động (Quan sát / Tối ưu hóa / Gom hàng / Chốt lời / Tránh xa / Chờ tín hiệu) + Lý do.

    6. ĐÁNH GIÁ TỔNG QUAN:
       - Điểm ảnh hưởng (1-10).
       - Xu hướng ngắn hạn (Giảm / Ổn định / Tăng).
       - Lời khuyên ngắn gọn.

    7. PHONG CÁCH:
       - Thực chiến, ngắn gọn, dễ hiểu.

    OUTPUT JSON FORMAT:
    Trả về đúng cấu trúc JSON sau (không markdown):
    {
      "impactLevel": "Low" | "Medium" | "High",
      "segments": ["string"],
      "regions": ["string"],
      "newsType": "Cơ hội" | "Rủi ro" | "Hỗn hợp",
      "impacts": {
        "price": "string",
        "psychology": "string",
        "liquidity": "string",
        "legal": "string",
        "disaster": "string",
        "finance": "string"
      },
      "secondHome": {
        "impact": "string",
        "lamDongSpecific": "string",
        "reaction": "string"
      },
      "strategy": {
        "opportunities": ["string"],
        "risks": ["string"],
        "action": "Quan sát" | "Tối ưu hóa" | "Gom hàng" | "Chốt lời" | "Tránh xa" | "Chờ tín hiệu",
        "reason": "string"
      },
      "assessment": {
        "score": number,
        "trend": "Giảm" | "Ổn định" | "Tăng",
        "summary": "string"
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // Schema helps enforce structure for gemini-3-pro
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                impactLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                segments: { type: Type.ARRAY, items: { type: Type.STRING } },
                regions: { type: Type.ARRAY, items: { type: Type.STRING } },
                newsType: { type: Type.STRING, enum: ["Cơ hội", "Rủi ro", "Hỗn hợp"] },
                impacts: {
                    type: Type.OBJECT,
                    properties: {
                        price: { type: Type.STRING },
                        psychology: { type: Type.STRING },
                        liquidity: { type: Type.STRING },
                        legal: { type: Type.STRING },
                        disaster: { type: Type.STRING },
                        finance: { type: Type.STRING }
                    },
                    required: ["price", "psychology", "liquidity", "legal", "disaster", "finance"]
                },
                secondHome: {
                    type: Type.OBJECT,
                    properties: {
                        impact: { type: Type.STRING },
                        lamDongSpecific: { type: Type.STRING },
                        reaction: { type: Type.STRING }
                    },
                    required: ["impact", "lamDongSpecific", "reaction"]
                },
                strategy: {
                    type: Type.OBJECT,
                    properties: {
                        opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                        risks: { type: Type.ARRAY, items: { type: Type.STRING } },
                        action: { type: Type.STRING, enum: ["Quan sát", "Tối ưu hóa", "Gom hàng", "Chốt lời", "Tránh xa", "Chờ tín hiệu"] },
                        reason: { type: Type.STRING }
                    },
                    required: ["opportunities", "risks", "action", "reason"]
                },
                assessment: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.INTEGER },
                        trend: { type: Type.STRING, enum: ["Giảm", "Ổn định", "Tăng"] },
                        summary: { type: Type.STRING }
                    },
                    required: ["score", "trend", "summary"]
                }
            },
            required: ["impactLevel", "segments", "regions", "newsType", "impacts", "secondHome", "strategy", "assessment"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return data as AnalysisData;
  } catch (error) {
    console.error("Error analyzing article:", error);
    return null;
  }
};

/**
 * Generates the "Morning Digest" / Daily Briefing
 */
export const generateDailyBriefing = async (articles: NewsItem[]): Promise<Briefing> => {
    const apiKey = getApiKey();
    if (!articles.length || !apiKey) {
        return {
            date: new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            highlights: ["Không có đủ dữ liệu để tạo bản tin sáng nay."]
        };
    }

    const ai = new GoogleGenAI({ apiKey });
    const titles = articles.map(a => a.title).join('\n');
    
    const prompt = `
      Dựa trên danh sách các tiêu đề tin tức BĐS sau đây:
      ${titles}

      Hãy tạo ra mục "Daily Briefing" gồm 3-5 gạch đầu dòng tổng hợp những diễn biến quan trọng nhất trong ngày. 
      Viết ngắn gọn, trực diện.
      
      Trả về JSON: { "highlights": ["Tin 1...", "Tin 2..."] }
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        highlights: { 
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["highlights"]
                }
            }
        });
        
        const data = JSON.parse(response.text || "{}");
        return {
            date: new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            highlights: data.highlights || []
        };
    } catch (e) {
        console.error(e);
        return {
             date: new Date().toLocaleDateString('vi-VN'),
             highlights: ["Lỗi khi tạo bản tin tự động."]
        };
    }
}