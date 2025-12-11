import React from 'react';
import { Briefing } from '../types';
import { Coffee, RefreshCw } from 'lucide-react';

interface DailyBriefingProps {
  briefing: Briefing | null;
  loading: boolean;
  onRefresh: () => void;
}

export const DailyBriefing: React.FC<DailyBriefingProps> = ({ briefing, loading, onRefresh }) => {
  if (!briefing) return null;

  return (
    <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl mb-8 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>

      <div className="flex justify-between items-center mb-4 relative z-10">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-500/20 p-2 rounded-lg">
            <Coffee className="text-yellow-300" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Daily Briefing</h2>
            <p className="text-blue-200 text-sm">{briefing.date}</p>
          </div>
        </div>
        <button 
            onClick={onRefresh}
            disabled={loading}
            className={`flex items-center px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <RefreshCw size={14} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Đang cập nhật...' : 'Cập nhật tin mới'}
        </button>
      </div>

      <div className="space-y-3 relative z-10">
        {briefing.highlights.map((highlight, index) => (
          <div key={index} className="flex items-start">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center text-xs font-bold mr-3 mt-0.5 border border-blue-400/30">
                {index + 1}
            </span>
            <p className="text-blue-50 leading-relaxed font-medium">{highlight}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
