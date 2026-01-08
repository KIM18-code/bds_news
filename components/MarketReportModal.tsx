
import React from 'react';
import { MarketReport } from '../types';
import { X, FileText, BarChart3, Lightbulb, Compass, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface Props {
  report: MarketReport;
  onClose: () => void;
}

export const MarketReportModal: React.FC<Props> = ({ report, onClose }) => {
  const getOutlookIcon = (outlook: string) => {
    if (outlook === 'Tích cực') return <ArrowUpRight className="text-emerald-500" size={20} />;
    if (outlook === 'Tiêu cực') return <ArrowDownRight className="text-rose-500" size={20} />;
    return <Minus className="text-amber-500" size={20} />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200">
        {/* Gold Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <FileText size={120} />
          </div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-3 py-0.5 bg-blue-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-400/30">
                  {report.period} Strategic Report
                </span>
                <span className="text-blue-300/50">•</span>
                <span className="text-blue-300 text-[10px] font-medium uppercase tracking-widest">{new Date().toLocaleDateString('vi-VN')}</span>
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight leading-none mb-4">
                {report.title}
              </h2>
              <div className="flex items-center text-blue-100/80 text-sm italic">
                <BarChart3 size={16} className="mr-2" />
                "{report.macroSentiment}"
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          {/* Key Takeaways */}
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center">
              <span className="w-8 h-px bg-slate-200 mr-3"></span>
              Điểm tin chiến lược
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.keyTakeaways.map((point, idx) => (
                <div key={idx} className="flex items-start p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-colors">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center mr-4 mt-0.5 shadow-sm group-hover:scale-110 transition-transform">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">{point}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Sector Outlook */}
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center">
              <span className="w-8 h-px bg-slate-200 mr-3"></span>
              Triển vọng phân khúc
            </h3>
            <div className="space-y-4">
              {report.sectorOutlook.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="text-lg font-bold text-slate-800 mr-3">{item.sector}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        item.outlook === 'Tích cực' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                        item.outlook === 'Tiêu cực' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {item.outlook}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 italic">{item.reason}</p>
                  </div>
                  <div className="ml-4 flex-shrink-0 p-3 bg-slate-50 rounded-xl">
                    {getOutlookIcon(item.outlook)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Strategy */}
          <section className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-3xl border border-blue-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-blue-600">
               <Lightbulb size={60} />
            </div>
            <h3 className="text-blue-900 font-bold mb-4 flex items-center text-lg">
              <Compass className="mr-3 text-blue-600" size={24} />
              Lời khuyên điều hướng
            </h3>
            <p className="text-blue-800 text-md leading-relaxed font-medium relative z-10">
              {report.strategicAdvice}
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
            <p className="text-xs text-slate-400 font-medium tracking-tight">
              Báo cáo được tổng hợp tự động bởi AI dựa trên dữ liệu thị trường thực tế. 
              Mọi quyết định đầu tư nên tham vấn chuyên gia tài chính.
            </p>
        </div>
      </div>
    </div>
  );
};
