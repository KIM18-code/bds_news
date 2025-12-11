import React, { useEffect, useState } from 'react';
import { NewsItem, AnalysisData } from '../types';
import { X, ExternalLink, Activity, Target, Zap, TrendingUp, AlertTriangle, ShieldAlert, DollarSign, CloudRain, Scale } from 'lucide-react';
import { analyzeArticle } from '../services/geminiService';

interface NewsDetailModalProps {
  item: NewsItem | null;
  onClose: () => void;
}

export const NewsDetailModal: React.FC<NewsDetailModalProps> = ({ item, onClose }) => {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      if (item.analysis) {
        setAnalysis(item.analysis);
        setLoading(false);
      } else {
        setAnalysis(null);
        setLoading(true);
        analyzeArticle(item).then(result => {
           setAnalysis(result);
           setLoading(false);
        });
      }
    }
  }, [item]);

  if (!item) return null;

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-600 bg-emerald-100 border-emerald-200';
    if (score >= 5) return 'text-amber-600 bg-amber-100 border-amber-200';
    return 'text-rose-600 bg-rose-100 border-rose-200';
  };

  const getActionColor = (action: string) => {
    if (['Gom hàng', 'Tối ưu hóa'].includes(action)) return 'bg-emerald-600';
    if (['Quan sát', 'Chờ tín hiệu'].includes(action)) return 'bg-amber-500';
    return 'bg-rose-600';
  };

  const getTrendColor = (trend: string) => {
      if (trend === 'Tăng') return 'bg-emerald-500';
      if (trend === 'Giảm') return 'bg-rose-500';
      return 'bg-slate-400';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-start sticky top-0 bg-white/95 backdrop-blur z-20">
          <div className="flex-1 pr-4">
            <div className="flex items-center space-x-2 mb-2">
                <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full font-semibold border border-slate-200">
                    {item.category}
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-slate-500 text-xs">{item.timeAgo}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug">
                {item.title}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0">
            <X size={24} className="text-slate-500" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-8">
            
            {/* Loading State */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-blue-600 font-medium animate-pulse">Đang phân tích chuyên sâu...</p>
                </div>
            )}

            {/* Analysis Dashboard */}
            {!loading && analysis && (
                <>
                {/* 1. Dashboard Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Score Card */}
                    <div className={`p-4 rounded-xl border-2 flex items-center justify-between ${getScoreColor(analysis.assessment.score)}`}>
                        <div>
                            <p className="text-xs font-bold uppercase opacity-80 mb-1">Điểm ảnh hưởng</p>
                            <div className="text-4xl font-extrabold tracking-tighter">{analysis.assessment.score}/10</div>
                        </div>
                        <Activity size={32} className="opacity-80" />
                    </div>

                    {/* Action Card */}
                    <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 flex flex-col justify-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-5 rounded-full -mr-5 -mt-5 transition-transform group-hover:scale-110"></div>
                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Hành động khuyến nghị</p>
                        <div className="flex items-center">
                            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${getActionColor(analysis.strategy.action)} animate-pulse`}></span>
                            <span className="text-2xl font-bold">{analysis.strategy.action}</span>
                        </div>
                    </div>

                    {/* Trend & Type Card */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-center">
                        <div className="flex justify-between items-center mb-2">
                             <span className="text-xs text-slate-500 font-bold uppercase">Xu hướng</span>
                             <span className={`text-xs font-bold px-2 py-0.5 rounded text-white ${getTrendColor(analysis.assessment.trend)}`}>
                                {analysis.assessment.trend}
                             </span>
                        </div>
                        <div className="text-sm font-medium text-slate-700 line-clamp-3">
                             {analysis.assessment.summary}
                        </div>
                    </div>
                </div>

                {/* 2. Context & Tags */}
                <div className="flex flex-wrap gap-2">
                    {analysis.segments.map(seg => (
                        <span key={seg} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-100">
                            #{seg}
                        </span>
                    ))}
                    {analysis.regions.map(reg => (
                        <span key={reg} className="px-3 py-1 bg-purple-50 text-purple-700 text-sm font-medium rounded-lg border border-purple-100">
                            @{reg}
                        </span>
                    ))}
                    <span className={`px-3 py-1 text-sm font-medium rounded-lg border ${analysis.impactLevel === 'High' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-50 text-slate-700 border-slate-100'}`}>
                        Mức độ: {analysis.impactLevel}
                    </span>
                    <span className={`px-3 py-1 text-sm font-medium rounded-lg border ${analysis.newsType === 'Cơ hội' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : analysis.newsType === 'Rủi ro' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-50 text-slate-700 border-slate-100'}`}>
                        {analysis.newsType}
                    </span>
                </div>

                {/* 3. Deep Dive Grid */}
                <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <Target className="mr-2 text-blue-600" size={20} />
                        Phân tích tác động đa chiều
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AnalysisBlock icon={<DollarSign size={18}/>} title="Giá & Thị trường" content={analysis.impacts.price} color="blue" />
                        <AnalysisBlock icon={<Scale size={18}/>} title="Pháp lý & Quy hoạch" content={analysis.impacts.legal} color="slate" />
                        <AnalysisBlock icon={<Zap size={18}/>} title="Tâm lý Nhà đầu tư" content={analysis.impacts.psychology} color="amber" />
                        <AnalysisBlock icon={<TrendingUp size={18}/>} title="Thanh khoản" content={analysis.impacts.liquidity} color="emerald" />
                        <AnalysisBlock icon={<CloudRain size={18}/>} title="Rủi ro thiên tai" content={analysis.impacts.disaster} color="rose" />
                        <AnalysisBlock icon={<Activity size={18}/>} title="Tài chính & Vốn" content={analysis.impacts.finance} color="indigo" />
                    </div>
                </div>

                {/* 4. Special Focus: Second Home / Highlands */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-indigo-900">
                        <CloudRain size={120} />
                    </div>
                    <h3 className="text-indigo-900 font-bold mb-3 flex items-center text-lg relative z-10">
                        <ShieldAlert className="mr-2 text-indigo-600" size={20} />
                        Góc nhìn Second Home / Ven hồ / Tây Nguyên
                    </h3>
                    <div className="space-y-4 relative z-10 text-sm text-indigo-900/90 font-medium">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <strong className="text-indigo-800 block mb-1">Tác động chung:</strong>
                                <p className="leading-relaxed">{analysis.secondHome.impact}</p>
                            </div>
                             <div>
                                <strong className="text-indigo-800 block mb-1">Phản ứng người mua:</strong>
                                <p className="leading-relaxed">{analysis.secondHome.reaction}</p>
                            </div>
                         </div>
                        
                        <div className="bg-white/70 p-4 rounded-lg border border-indigo-200 shadow-sm">
                            <strong className="text-indigo-800 block mb-1 uppercase text-xs tracking-wider">Trọng tâm khu vực</strong>
                            <strong className="text-indigo-900 block mb-1">Di Linh - Lâm Đồng - Tây Nguyên:</strong> 
                            <p className="leading-relaxed">{analysis.secondHome.lamDongSpecific}</p>
                        </div>
                    </div>
                </div>

                {/* 5. Strategy Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="font-bold text-emerald-700 flex items-center">
                            <TrendingUp className="mr-2" size={18} /> Cơ hội (Opportunities)
                        </h3>
                        <ul className="space-y-2">
                            {analysis.strategy.opportunities.map((op, idx) => (
                                <li key={idx} className="flex items-start text-sm text-slate-700 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                                    <span className="text-emerald-500 mr-2 font-bold">•</span> {op}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-bold text-rose-700 flex items-center">
                            <AlertTriangle className="mr-2" size={18} /> Rủi ro (Risks)
                        </h3>
                        <ul className="space-y-2">
                            {analysis.strategy.risks.map((r, idx) => (
                                <li key={idx} className="flex items-start text-sm text-slate-700 bg-rose-50/50 p-2.5 rounded-lg border border-rose-100">
                                    <span className="text-rose-500 mr-2 font-bold">•</span> {r}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Recommendation Box */}
                <div className="bg-slate-50 border-l-4 border-slate-800 p-5 rounded-r-xl shadow-sm">
                    <h4 className="font-bold text-slate-900 mb-2 flex items-center">
                        Lý do khuyến nghị: 
                        <span className={`ml-2 px-2 py-0.5 text-xs text-white rounded uppercase ${getActionColor(analysis.strategy.action)}`}>
                            {analysis.strategy.action}
                        </span>
                    </h4>
                    <p className="text-slate-700 text-sm italic leading-relaxed">"{analysis.strategy.reason}"</p>
                </div>

                </>
            )}

             {/* Basic Summary Fallback (Always show context) */}
            <div className="mt-8 pt-6 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Tóm tắt nội dung gốc</h3>
                <ul className="space-y-1.5">
                    {item.summaryPoints.map((p, i) => (
                        <li key={i} className="text-sm text-slate-500 flex items-start">
                            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                            {p}
                        </li>
                    ))}
                </ul>
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-between items-center z-20">
            <span className="text-xs text-slate-400">Nguồn: {item.source}</span>
            {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-bold transition-colors">
                    Đọc bài gốc <ExternalLink size={14} className="ml-1" />
                </a>
            )}
        </div>
      </div>
    </div>
  );
};

// Helper Component for Analysis Blocks
const AnalysisBlock = ({ icon, title, content, color }: { icon: React.ReactNode, title: string, content: string, color: string }) => {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-700 border-blue-100',
        slate: 'bg-slate-50 text-slate-700 border-slate-100',
        amber: 'bg-amber-50 text-amber-700 border-amber-100',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        rose: 'bg-rose-50 text-rose-700 border-rose-100',
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100'
    };

    return (
        <div className={`p-4 rounded-xl border ${colorClasses[color]} hover:shadow-sm transition-shadow`}>
            <div className="flex items-center mb-2 font-bold text-sm">
                <span className="mr-2 opacity-80">{icon}</span>
                {title}
            </div>
            <p className="text-sm leading-relaxed font-medium opacity-90">
                {content}
            </p>
        </div>
    );
};