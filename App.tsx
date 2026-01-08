import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Category, NewsItem, Briefing, MarketReport } from './types';
import { CATEGORIES, MOCK_NEWS, INITIAL_BRIEFING } from './constants';
import { fetchNewsWithGemini, generateDailyBriefing, generateMarketReport } from './services/geminiService';
import { DailyBriefing } from './components/DailyBriefing';
import { NewsCard } from './components/NewsCard';
import { NewsDetailModal } from './components/NewsDetailModal';
import { MarketReportModal } from './components/MarketReportModal';
import { Filter, Search, Clock, FileText, X, Bell, Loader2, CheckCircle2, Server, Globe, Layers } from 'lucide-react';

const AUTO_REFRESH_INTERVAL = 24 * 60 * 60 * 1000; // Refresh daily (24h)

const App: React.FC = () => {
  // Initialize with empty to force the loading screen flow
  const [news, setNews] = useState<NewsItem[]>([]);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [report, setReport] = useState<MarketReport | null>(null);
  
  // Loading & UI States
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [loadingStep, setLoadingStep] = useState<string>('Khởi tạo kết nối...');
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  
  const [loading, setLoading] = useState<boolean>(false); // For background refreshes
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isAutoRefresh, setIsAutoRefresh] = useState<boolean>(true);
  const [showReportNotification, setShowReportNotification] = useState(false);
  
  const refreshTimerRef = useRef<number | null>(null);

  const handleInitialLoad = useCallback(async () => {
    try {
        // Step 1: Scan Sources
        setLoadingStep('Khởi tạo đa luồng quét dữ liệu...');
        setLoadingProgress(10);
        
        // This is now a parallel fetch for ALL categories
        setLoadingStep('Đang tổng hợp tin tức từng phân khúc (Thị trường, Pháp lý, AI...)...');
        setLoadingProgress(30);
        
        let freshNews = await fetchNewsWithGemini();
        
        // Fallback to mock if API key is missing or fails (to ensure app is usable in demo)
        if (freshNews.length === 0) {
             console.warn("API returned no data, falling back to mock for demo purposes.");
             setLoadingStep('Kích hoạt dữ liệu dự phòng...');
             await new Promise(resolve => setTimeout(resolve, 1500)); 
             freshNews = MOCK_NEWS;
        } else {
             setLoadingProgress(60);
        }

        setLoadingStep('Đang phân loại và kiểm định dữ liệu...');
        setLoadingProgress(70);
        await new Promise(resolve => setTimeout(resolve, 500)); 

        setNews(freshNews);
        
        // Step 2: Generate Briefing
        setLoadingStep('AI đang tổng hợp tiêu điểm thị trường...');
        setLoadingProgress(85);
        const newBriefing = await generateDailyBriefing(freshNews);
        setBriefing(newBriefing.highlights.length > 0 ? newBriefing : INITIAL_BRIEFING);
        
        // Step 3: Background Report 
        setLoadingStep('Hoàn tất hệ thống...');
        setLoadingProgress(95);
        
        // Finalize
        setLastUpdated(new Date());
        setLoadingProgress(100);
        setTimeout(() => {
            setIsInitializing(false);
            // Trigger report generation in background after entering
            generateMarketReport(freshNews).then(newReport => {
                if (newReport) {
                    setReport(newReport);
                    setShowReportNotification(true);
                }
            });
        }, 800);

    } catch (error) {
        console.error("Initialization failed", error);
        setNews(MOCK_NEWS);
        setBriefing(INITIAL_BRIEFING);
        setIsInitializing(false);
    }
  }, []);

  // Standard Refresh Logic (Background)
  const handleRefresh = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const freshNews = await fetchNewsWithGemini();
      
      if (freshNews.length > 0) {
        setNews(freshNews); // Directly set news, avoid complex dedupe merging to keep categorization strict
        const newBriefing = await generateDailyBriefing(freshNews);
        setBriefing(newBriefing);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Refresh failed", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Initial Mount Effect
  useEffect(() => {
    handleInitialLoad();
  }, [handleInitialLoad]);

  // Auto Refresh Interval
  useEffect(() => {
    if (isAutoRefresh && !isInitializing) {
      refreshTimerRef.current = window.setInterval(() => handleRefresh(false), AUTO_REFRESH_INTERVAL);
    } else {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    }
    return () => { if (refreshTimerRef.current) clearInterval(refreshTimerRef.current); };
  }, [isAutoRefresh, handleRefresh, isInitializing]);

  const filteredNews = news.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.summaryPoints.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // --- SPLASH SCREEN / LOADING QUEUE VIEW ---
  if (isInitializing) {
      return (
          <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center z-50 text-white">
              {/* Animated Background */}
              <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
              </div>

              <div className="relative z-10 w-full max-w-md px-6">
                  {/* Logo Area */}
                  <div className="flex justify-center mb-12">
                      <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20 animate-bounce-slow">
                        <span className="text-slate-900 font-black text-4xl italic tracking-tighter">P</span>
                      </div>
                  </div>

                  {/* Status Text */}
                  <h2 className="text-2xl font-bold text-center mb-2 tracking-tight">PropTech VN Digest</h2>
                  <p className="text-slate-400 text-center text-sm mb-8 uppercase tracking-widest font-medium">Hệ thống phân tích tin tức thông minh</p>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mb-4 overflow-hidden">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${loadingProgress}%` }}
                      ></div>
                  </div>
                  
                  {/* Waiting Message */}
                  <p className="text-slate-500 text-center text-xs mb-8 italic px-2 leading-relaxed">
                    Hệ thống đang thực hiện quét đa luồng dữ liệu chuyên sâu cho từng danh mục. Quá trình này có thể mất từ 5-10 phút.
                  </p>

                  {/* Step Indicators */}
                  <div className="space-y-4">
                      <LoadingStep 
                        label="Kết nối vệ tinh dữ liệu" 
                        status={loadingProgress > 10 ? 'completed' : 'active'} 
                        icon={<Globe size={16} />}
                      />
                      <LoadingStep 
                        label="Quét sâu 6 nhóm ngành BĐS" 
                        status={loadingProgress > 60 ? 'completed' : (loadingProgress > 10 ? 'active' : 'pending')} 
                        icon={<Layers size={16} />}
                      />
                      <LoadingStep 
                        label="AI Phân tích & Phân loại" 
                        status={loadingProgress > 90 ? 'completed' : (loadingProgress > 60 ? 'active' : 'pending')} 
                        icon={<Server size={16} />}
                      />
                  </div>

                  <div className="mt-12 text-center">
                       <span className="inline-block px-4 py-2 bg-slate-800/50 rounded-lg text-xs font-mono text-blue-400 animate-pulse border border-slate-700">
                           {'>'} {loadingStep}
                       </span>
                  </div>
              </div>
          </div>
      );
  }

  // --- MAIN APP VIEW ---
  return (
    <div className="min-h-screen pb-12 bg-slate-50">
      
      {/* Top Navigation */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
             <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center mr-4 shadow-lg shadow-slate-200">
                <span className="text-white font-black text-xl italic tracking-tighter">P</span>
             </div>
             <div className="hidden sm:block">
                <h1 className="text-xl font-black text-slate-900 leading-none tracking-tight">PropTech VN</h1>
                <span className="text-[10px] text-blue-600 font-bold tracking-[0.2em] uppercase">Executive Intelligence</span>
             </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-2 w-72 border border-transparent focus-within:border-blue-500 focus-within:bg-white transition-all">
                <Search size={16} className="text-slate-400 mr-2" />
                <input 
                    type="text" 
                    placeholder="Tìm kiếm dữ liệu thị trường..." 
                    className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400 font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            {report && (
                <button 
                  onClick={() => setIsReportModalOpen(true)}
                  className="p-2 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors relative"
                >
                   <FileText size={20} />
                   {showReportNotification && <span className="absolute top-0 right-0 w-3 h-3 bg-blue-500 border-2 border-white rounded-full"></span>}
                </button>
            )}
          </div>
        </div>
      </header>

      {/* Strategic Notification Banner */}
      {showReportNotification && (
          <div className="bg-blue-600 text-white animate-slide-down">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                  <div className="flex items-center">
                      <Bell size={18} className="mr-3 animate-bounce" />
                      <p className="text-sm font-bold tracking-tight">
                        AI INSIGHT: Một báo cáo chiến lược thị trường mới đã được khởi tạo.
                      </p>
                  </div>
                  <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => { setIsReportModalOpen(true); setShowReportNotification(false); }}
                        className="bg-white text-blue-600 px-4 py-1 rounded-full text-xs font-bold uppercase hover:bg-blue-50 transition-colors"
                      >
                        Xem báo cáo
                      </button>
                      <button onClick={() => setShowReportNotification(false)} className="opacity-70 hover:opacity-100">
                          <X size={18} />
                      </button>
                  </div>
              </div>
          </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DailyBriefing 
            briefing={briefing} 
            loading={loading} 
            onRefresh={() => handleRefresh(true)} 
        />

        {/* Categories / Filter */}
        <div className="mb-12">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${
                selectedCategory === 'All' 
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Tất cả
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  selectedCategory === cat 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' 
                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 space-y-4 md:space-y-0">
            <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                    {selectedCategory === 'All' ? 'Thị trường 24h' : selectedCategory}
                </h2>
                <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center text-slate-400 text-xs font-bold uppercase tracking-widest italic">
                        <Clock size={12} className="mr-1.5" />
                        Update: {lastUpdated.toLocaleTimeString('vi-VN')}
                    </div>
                    {isAutoRefresh && (
                        <div className="flex items-center space-x-2 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className="text-[10px] text-emerald-600 font-bold uppercase">Daily Auto-Sync</span>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auto Sync</span>
                <button 
                    onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAutoRefresh ? 'bg-blue-600' : 'bg-slate-200'}`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAutoRefresh ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
        </div>

        {/* Grid News */}
        {filteredNews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredNews.map((item) => (
              <NewsCard 
                key={item.id} 
                item={item} 
                onClick={setSelectedItem} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-300">
             <Search className="mx-auto text-slate-300 mb-4" size={48} />
             <p className="text-slate-500 font-bold text-lg">Không tìm thấy dữ liệu khớp.</p>
             <button onClick={() => {setSearchQuery(''); setSelectedCategory('All');}} className="mt-4 text-blue-600 font-black text-sm uppercase tracking-widest border-b-2 border-blue-600 pb-1">Reset</button>
          </div>
        )}
      </main>

      {/* Floating Action Button for Report */}
      {report && (
          <button 
            onClick={() => setIsReportModalOpen(true)}
            className="fixed bottom-8 right-8 w-16 h-16 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group"
          >
            <div className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-white"></span>
            </div>
            <FileText size={24} className="group-hover:rotate-12 transition-transform" />
          </button>
      )}

      {/* Modals */}
      {selectedItem && (
        <NewsDetailModal 
            item={selectedItem} 
            onClose={() => setSelectedItem(null)} 
        />
      )}

      {isReportModalOpen && report && (
          <MarketReportModal 
            report={report} 
            onClose={() => setIsReportModalOpen(false)} 
          />
      )}
    </div>
  );
};

// Sub-component for Loading Steps
const LoadingStep: React.FC<{ label: string; status: 'pending' | 'active' | 'completed'; icon: React.ReactNode }> = ({ label, status, icon }) => {
    let colorClass = "text-slate-600";
    let iconClass = "bg-slate-800 border-slate-700 text-slate-500";
    
    if (status === 'active') {
        colorClass = "text-blue-400 font-bold";
        iconClass = "bg-blue-500/20 border-blue-500 text-blue-400 animate-pulse";
    } else if (status === 'completed') {
        colorClass = "text-slate-400 line-through decoration-slate-600";
        iconClass = "bg-emerald-500/20 border-emerald-500 text-emerald-400";
    }

    return (
        <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full border flex items-center justify-center mr-3 transition-colors ${iconClass}`}>
                {status === 'active' ? <Loader2 size={14} className="animate-spin" /> : 
                 status === 'completed' ? <CheckCircle2 size={14} /> : icon}
            </div>
            <span className={`text-sm transition-colors ${colorClass}`}>{label}</span>
        </div>
    );
}

export default App;