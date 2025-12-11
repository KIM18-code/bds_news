import React from 'react';
import { NewsItem, Category } from '../types';
import { ExternalLink, Zap, AlertTriangle, TrendingUp, FileText, Home, Cpu } from 'lucide-react';

interface NewsCardProps {
  item: NewsItem;
  onClick: (item: NewsItem) => void;
}

const getCategoryIcon = (cat: Category) => {
  switch (cat) {
    case Category.MARKET_PRICE: return <TrendingUp size={14} className="mr-1" />;
    case Category.DISASTER_RISK: return <AlertTriangle size={14} className="mr-1" />;
    case Category.PROPTECH_AI: return <Cpu size={14} className="mr-1" />;
    case Category.DATA_REPORT: return <FileText size={14} className="mr-1" />;
    case Category.RESORT_SECONDHOME: return <Home size={14} className="mr-1" />;
    default: return <Zap size={14} className="mr-1" />;
  }
};

const getCategoryColor = (cat: Category) => {
    switch (cat) {
        case Category.DISASTER_RISK: return 'bg-red-100 text-red-700 border-red-200';
        case Category.PROPTECH_AI: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
        case Category.MARKET_PRICE: return 'bg-green-100 text-green-700 border-green-200';
        default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
};

export const NewsCard: React.FC<NewsCardProps> = ({ item, onClick }) => {
  return (
    <div 
      onClick={() => onClick(item)}
      className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-all cursor-pointer group flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(item.category)}`}>
          {getCategoryIcon(item.category)}
          {item.category}
        </span>
        <span className="text-slate-400 text-xs whitespace-nowrap">{item.timeAgo}</span>
      </div>

      <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight group-hover:text-blue-700 transition-colors">
        {item.title}
      </h3>

      <div className="flex-grow">
        <ul className="space-y-1.5 mb-4">
            {item.summaryPoints.slice(0, 3).map((point, idx) => (
            <li key={idx} className="text-sm text-slate-600 pl-3 border-l-2 border-slate-300">
                {point}
            </li>
            ))}
        </ul>
      </div>

      <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-100">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.source}</span>
        {item.url && (
            <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:text-blue-800 p-1"
                onClick={(e) => e.stopPropagation()}
            >
                <ExternalLink size={16} />
            </a>
        )}
      </div>
    </div>
  );
};
