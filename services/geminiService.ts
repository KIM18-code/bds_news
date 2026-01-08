import { GoogleGenAI, Type } from "@google/genai";
import { Category, NewsItem, Briefing, AnalysisData, MarketReport } from "../types";
import { CATEGORIES } from "../constants";

const getApiKey = () => process.env.API_KEY || '';

// Helper function to fetch specific category news
const fetchCategoryNews = async (ai: GoogleGenAI, category: Category): Promise<NewsItem[]> => {
    // Keywords mapping for better search grounding
    const keywords: Record<Category, string> = {
        [Category.MARKET_PRICE]: "giá nhà đất, thị trường bất động sản, giá chung cư, sốt đất, cắt lỗ",
        [Category.POLICY_LEGAL]: "luật đất đai sửa đổi, quy hoạch, pháp lý dự án, nghị định bất động sản, cấp sổ đỏ",
        [Category.RESORT_SECONDHOME]: "bất động sản nghỉ dưỡng, condotel, second home, du lịch, khách sạn",
        [Category.PROPTECH_AI]: "công nghệ bất động sản, proptech, ứng dụng AI trong bđs, chuyển đổi số xây dựng, smart home",
        [Category.DISASTER_RISK]: "sạt lở đất, ngập lụt đô thị, biến đổi khí hậu ảnh hưởng bđs, quy hoạch rủi ro thiên tai",
        [Category.DATA_REPORT]: "báo cáo thị trường bất động sản, thống kê giao dịch, dữ liệu FDI bất động sản, tồn kho bất động sản"
    };

    const prompt = `
    Tìm kiếm và tổng hợp 5 tin tức mới nhất (24-48h qua) tại Việt Nam chuyên về chủ đề: "${keywords[category]}".
    
    Yêu cầu tuyệt đối:
    1. Trả về đúng 5 tin tức.
    2. Category bắt buộc phải là: "${category}".
    3. Định dạng JSON Array: [{ "title": "...", "source": "...", "timeAgo": "...", "summaryPoints": ["...", "...", "..."] }]
    
    CHỈ TRẢ VỀ JSON, KHÔNG CÓ MARKDOWN HAY LỜI DẪN.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { 
                tools: [{ googleSearch: {} }],
                // Note: cannot use responseMimeType: "application/json" together with googleSearch tool
            }
        });

        let rawText = response.text || "[]";
        
        // Clean markdown code blocks if present (common when not using JSON mode)
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        let parsedItems: any = [];
        try {
             parsedItems = JSON.parse(rawText);
             // Handle case where AI returns object with key "news" instead of array
             if (!Array.isArray(parsedItems) && parsedItems.news) parsedItems = parsedItems.news; 
        } catch (e) {
            console.warn(`Failed to parse JSON for category ${category}`, rawText.substring(0, 100) + "...");
            return [];
        }

        if (!Array.isArray(parsedItems)) return [];

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        return parsedItems.map((item: any, index: number) => {
            // Priority: Grounding URI -> AI provided URL -> Google Search Fallback
            let url = `https://www.google.com/search?q=${encodeURIComponent(item.title)}`;
            if (item.url && item.url.startsWith('http')) {
                url = item.url;
            } else if (groundingChunks.length > index && groundingChunks[index].web?.uri) {
                url = groundingChunks[index].web.uri;
            }

            return {
                id: `gen-${category.replace(/\s/g, '')}-${Date.now()}-${index}`,
                title: item.title || "Tin tức cập nhật",
                source: item.source || "Tổng hợp",
                timeAgo: item.timeAgo || "Mới nhất",
                category: category, // Enforce strict category assignment from the loop
                summaryPoints: Array.isArray(item.summaryPoints) ? item.summaryPoints : ["Đang cập nhật chi tiết..."],
                url: url
            };
        });

    } catch (error) {
        console.error(`Error fetching category ${category}:`, error);
        return [];
    }
};

export const fetchNewsWithGemini = async (): Promise<NewsItem[]> => {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  const ai = new GoogleGenAI({ apiKey });
  
  // Create parallel promises for each category to ensure diversity and quantity
  // We strictly request 5 items per category.
  const promises = CATEGORIES.map(cat => fetchCategoryNews(ai, cat));

  try {
    const results = await Promise.all(promises);
    // Flatten the array of arrays into a single NewsItem[]
    const allNews = results.flat();
    
    // Shuffle slightly so it doesn't look too rigid (optional, but good for UX)
    return allNews.sort(() => Math.random() - 0.5);
  } catch (error) {
    console.error("Global fetch error:", error);
    return [];
  }
};

export const analyzeArticle = async (newsItem: NewsItem): Promise<AnalysisData | null> => {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });
  
  const schema = {
    type: Type.OBJECT,
    properties: {
      impactLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
      segments: { type: Type.ARRAY, items: { type: Type.STRING } },
      regions: { type: Type.ARRAY, items: { type: Type.STRING } },
      newsType: { type: Type.STRING, enum: ['Cơ hội', 'Rủi ro', 'Hỗn hợp'] },
      impacts: {
        type: Type.OBJECT,
        properties: {
          price: { type: Type.STRING },
          psychology: { type: Type.STRING },
          liquidity: { type: Type.STRING },
          legal: { type: Type.STRING },
          disaster: { type: Type.STRING },
          finance: { type: Type.STRING },
        },
        required: ['price', 'psychology', 'liquidity', 'legal', 'disaster', 'finance']
      },
      secondHome: {
        type: Type.OBJECT,
        properties: {
          impact: { type: Type.STRING },
          lamDongSpecific: { type: Type.STRING },
          reaction: { type: Type.STRING },
        },
        required: ['impact', 'lamDongSpecific', 'reaction']
      },
      strategy: {
        type: Type.OBJECT,
        properties: {
          opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
          risks: { type: Type.ARRAY, items: { type: Type.STRING } },
          action: { type: Type.STRING, enum: ['Quan sát', 'Tối ưu hóa', 'Gom hàng', 'Chốt lời', 'Tránh xa', 'Chờ tín hiệu'] },
          reason: { type: Type.STRING },
        },
        required: ['opportunities', 'risks', 'action', 'reason']
      },
      assessment: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          trend: { type: Type.STRING, enum: ['Giảm', 'Ổn định', 'Tăng'] },
          summary: { type: Type.STRING },
        },
        required: ['score', 'trend', 'summary']
      },
    },
    required: ['impactLevel', 'segments', 'regions', 'newsType', 'impacts', 'secondHome', 'strategy', 'assessment']
  };

  const prompt = `
    Phân tích chuyên sâu bài báo: "${newsItem.title}".
    Tóm tắt: ${newsItem.summaryPoints.join('; ')}.
    Danh mục: ${newsItem.category}.
    
    Hãy đóng vai chuyên gia phân tích đầu tư Bất động sản.
    Trả về JSON khớp chính xác với Schema đã cung cấp.
    Đảm bảo điền đầy đủ thông tin cho tất cả các trường.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { 
          responseMimeType: "application/json",
          responseSchema: schema
      }
    });
    
    const text = response.text || "{}";
    const data = JSON.parse(text);

    const cleanData: AnalysisData = {
        impactLevel: data.impactLevel || 'Medium',
        segments: data.segments || [],
        regions: data.regions || [],
        newsType: data.newsType || 'Hỗn hợp',
        impacts: {
            price: data.impacts?.price || 'Chưa có dữ liệu',
            psychology: data.impacts?.psychology || 'Chưa có dữ liệu',
            liquidity: data.impacts?.liquidity || 'Chưa có dữ liệu',
            legal: data.impacts?.legal || 'Chưa có dữ liệu',
            disaster: data.impacts?.disaster || 'Chưa có dữ liệu',
            finance: data.impacts?.finance || 'Chưa có dữ liệu',
        },
        secondHome: {
            impact: data.secondHome?.impact || 'Chưa rõ',
            lamDongSpecific: data.secondHome?.lamDongSpecific || 'Không có dữ liệu cụ thể',
            reaction: data.secondHome?.reaction || 'Chưa rõ',
        },
        strategy: {
            opportunities: data.strategy?.opportunities || [],
            risks: data.strategy?.risks || [],
            action: data.strategy?.action || 'Quan sát',
            reason: data.strategy?.reason || 'Cần thêm thông tin để đánh giá',
        },
        assessment: {
            score: typeof data.assessment?.score === 'number' ? data.assessment.score : 5,
            trend: data.assessment?.trend || 'Ổn định',
            summary: data.assessment?.summary || 'Đang cập nhật...',
        }
    };

    return cleanData;
  } catch (error) {
    console.error("Analysis Error:", error);
    return null;
  }
};

export const generateDailyBriefing = async (articles: NewsItem[]): Promise<Briefing> => {
    const apiKey = getApiKey();
    if (!articles.length || !apiKey) return { date: new Date().toLocaleDateString('vi-VN'), highlights: [] };
    const ai = new GoogleGenAI({ apiKey });
    // Take a mix of articles from different categories for the briefing
    const mixedArticles = articles.slice(0, 10);
    const titles = mixedArticles.map(a => `[${a.category}] ${a.title}`).join('\n');
    const prompt = `Tóm tắt 5 xu hướng quan trọng nhất từ danh sách tiêu đề sau. Đảm bảo đa dạng chủ đề: ${titles}. Trả về JSON { "highlights": [] }`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        const data = JSON.parse(response.text || "{}");
        return { date: new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), highlights: data.highlights || [] };
    } catch (e) { return { date: '', highlights: [] }; }
}

export const generateMarketReport = async (articles: NewsItem[]): Promise<MarketReport | null> => {
    const apiKey = getApiKey();
    if (!articles.length || !apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });
    // Use a larger slice for the comprehensive report
    const dataString = articles.slice(0, 20).map(a => `[${a.category}] ${a.title}`).join('\n');
    const prompt = `
      Dựa trên danh sách tin tức BĐS gần đây:
      ${dataString}

      Hãy đóng vai Giám đốc Chiến lược đầu tư, tạo một "Báo cáo Tổng hợp Thị trường" (Weekly Strategy Report).
      Yêu cầu:
      1. Đánh giá tâm lý vĩ mô.
      2. 5 điểm tin then chốt.
      3. Triển vọng 3 phân khúc chính (Dân dụng, Nghỉ dưỡng, Công nghiệp).
      4. Lời khuyên chiến lược cho nhà đầu tư.

      OUTPUT JSON (Không markdown):
      {
        "title": "string",
        "period": "Hàng tuần",
        "macroSentiment": "string",
        "keyTakeaways": ["string"],
        "sectorOutlook": [
          { "sector": "string", "outlook": "Tích cực" | "Trung lập" | "Tiêu cực", "reason": "string" }
        ],
        "strategicAdvice": "string"
      }
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "{}");
    } catch (e) { return null; }
}