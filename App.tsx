import React, { useState, useEffect, useCallback } from 'react';
import { Category, NewsItem, Briefing } from './types';
import { CATEGORIES, MOCK_NEWS, INITIAL_BRIEFING } from './constants';
import { fetchNewsWithGemini, generateDailyBriefing } from './services/geminiService';
import { DailyBriefing } from './components/DailyBriefing';
import { NewsCard } from './components/NewsCard';
import { NewsDetailModal } from './components/NewsDetailModal';
import { Filter, Search, Clock } from 'lucide-react';

const App: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>(MOCK_NEWS);
  const [briefing, setBriefing] = useState<Briefing | null>(INITIAL_BRIEFING);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Auto-refresh simulation or initial fetch logic could go here
  // For now, we rely on the user clicking "Refresh" or initial mock data

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch News
      const freshNews = await fetchNewsWithGemini();
      
      if (freshNews.length > 0) {
        setNews(prevNews => {
            // Combine new and old, putting fresh news first
            const combined = [...freshNews, ...prevNews];
            
            // Deduplicate by title
            const seenTitles = new Set();
            const uniqueNews: NewsItem[] = [];
            
            for (const item of combined) {
                if (!seenTitles.has(item.title)) {
                    seenTitles.add(item.title);
                    uniqueNews.push(item);
                }
            }

            // Group by category and keep top 5 latest for each
            let result: NewsItem[] = [];
            
            // Iterate through all defined categories to ensure we capture everything systematically
            CATEGORIES.forEach(cat => {
                const catItems = uniqueNews.filter(item => item.category === cat);
                // Take the top 5 (assuming array order represents recency, which it does via combined order)
                result.push(...catItems.slice(0, 5));
            });
            
            return result;
        });
        
        // 2. Regenerate Briefing based on new news
        const newBriefing = await generateDailyBriefing(freshNews);
        setBriefing(newBriefing);
        setLastUpdated(new Date());
      } else {
        // Fallback or error handling handled inside service/mock
         console.log("Using existing data due to empty fetch result (likely no API key or error)");
      }
    } catch (error) {
      console.error("Refresh failed", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter Logic
  const filteredNews = news.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.summaryPoints.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen pb-12">
      
      {/* Top Navigation / Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">P</span>
             </div>
             <div>
                <h1 className="text-lg font-bold text-slate-900 leading-none">PropTech VN</h1>
                <span className="text-xs text-slate-500 font-medium tracking-wide">DIGEST</span>
             </div>
          </div>
          
          <div className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-1.5 w-64 border border-transparent focus-within:border-blue-500 focus-within:bg-white transition-all">
            <Search size={16} className="text-slate-400 mr-2" />
            <input 
                type="text" 
                placeholder="Tìm kiếm tin tức..." 
                className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Daily Briefing Section */}
        <DailyBriefing 
            briefing={briefing} 
            loading={loading} 
            onRefresh={handleRefresh} 
        />

        {/* Categories / Filter */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Filter size={18} className="text-slate-500 mr-2" />
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Bộ lọc chủ đề</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === 'All' 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Tất cả
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Section Title */}
        <div className="flex justify-between items-end mb-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">
                    {selectedCategory === 'All' ? 'Tin tức hôm nay' : selectedCategory}
                </h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-slate-500 text-sm">
                    <p>
                        Hiển thị {filteredNews.length} bài viết
                    </p>
                    <span className="text-slate-300 hidden sm:inline">•</span>
                    <div className="flex items-center text-slate-500 italic">
                        <Clock size={14} className="mr-1.5" />
                        Cập nhật: {lastUpdated.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit'})}
                    </div>
                </div>
            </div>
            
            {/* Mobile Search - Visible only on small screens */}
             <div className="md:hidden">
                 <button className="p-2 bg-slate-100 rounded-full">
                     <Search size={20} className="text-slate-600" />
                 </button>
             </div>
        </div>

        {/* Grid News */}
        {filteredNews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.map((item) => (
              <NewsCard 
                key={item.id} 
                item={item} 
                onClick={setSelectedItem} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
             <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Search className="text-slate-400" size={32} />
             </div>
             <p className="text-slate-500 font-medium">Không tìm thấy tin tức phù hợp.</p>
             <button 
                onClick={() => {setSearchQuery(''); setSelectedCategory('All');}}
                className="mt-2 text-blue-600 font-semibold text-sm hover:underline"
             >
                Xóa bộ lọc
             </button>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selectedItem && (
        <NewsDetailModal 
            item={selectedItem} 
            onClose={() => setSelectedItem(null)} 
        />
      )}
    </div>
  );
};

export default App;