export enum Category {
  MARKET_PRICE = 'Thị trường & Giá',
  POLICY_LEGAL = 'Chính sách & Pháp lý',
  RESORT_SECONDHOME = 'BĐS Nghỉ dưỡng',
  PROPTECH_AI = 'AI & PropTech',
  DISASTER_RISK = 'Rủi ro Thiên tai',
  DATA_REPORT = 'Dữ liệu & Báo cáo',
}

export interface AnalysisData {
  impactLevel: 'Low' | 'Medium' | 'High';
  segments: string[];
  regions: string[];
  newsType: 'Cơ hội' | 'Rủi ro' | 'Hỗn hợp';
  impacts: {
    price: string;
    psychology: string;
    liquidity: string;
    legal: string;
    disaster: string;
    finance: string;
  };
  secondHome: {
    impact: string;
    lamDongSpecific: string; // Focus on Di Linh, Lam Dong, Tay Nguyen
    reaction: string;
  };
  strategy: {
    opportunities: string[];
    risks: string[];
    action: 'Quan sát' | 'Tối ưu hóa' | 'Gom hàng' | 'Chốt lời' | 'Tránh xa' | 'Chờ tín hiệu';
    reason: string;
  };
  assessment: {
    score: number; // 1-10
    trend: 'Giảm' | 'Ổn định' | 'Tăng';
    summary: string;
  };
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  timeAgo: string;
  category: Category;
  summaryPoints: string[]; // 3-5 points
  url?: string;
  
  // Legacy fields (optional, used for fallback or simple display)
  insight?: string;
  opportunity?: string;
  risk?: string;
  fullContent?: string;

  // New Deep Analysis Data
  analysis?: AnalysisData;
}

export interface Briefing {
  date: string;
  highlights: string[];
}