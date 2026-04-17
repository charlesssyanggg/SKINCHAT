/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  MessageSquare, 
  FlaskConical, 
  History as HistoryIcon, 
  ChevronLeft, 
  Loader2, 
  User, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Sun,
  Moon,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, Button, cn } from './components/UI';
import SkinRadarChart from './components/SkinRadarChart';
import { analyzeSkin, analyzeIngredients, consultAI, type SkinAnalysisResult } from './services/geminiService';
import Markdown from 'react-markdown';

type Page = 'home' | 'detection' | 'result' | 'consultation' | 'ingredients' | 'loading';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [prevPage, setPrevPage] = useState<Page | null>(null);
  const [analysisResult, setAnalysisResult] = useState<SkinAnalysisResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");

  const navigateTo = (page: Page) => {
    setPrevPage(currentPage);
    setCurrentPage(page);
  };

  const goBack = () => {
    if (prevPage) {
      setCurrentPage(prevPage);
      setPrevPage(null);
    } else {
      setCurrentPage('home');
    }
  };

  // --- Page Components ---

  const Home = () => (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-bg-gray">
      <header className="pt-10 pb-6">
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[28px] font-display font-extrabold text-brand tracking-tight"
        >
          SkinGPT
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-text-secondary mt-1 text-sm"
        >
          你的AI皮肤健康管家
        </motion.p>
      </header>

      <div className="grid gap-4">
        <Card onClick={() => navigateTo('detection')} className="flex items-center gap-4 border-none">
          <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center text-brand">
            <Camera size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[16px]">拍照检测</h3>
            <p className="text-xs text-text-secondary">一键分析肤质与皮肤问题</p>
          </div>
        </Card>

        <Card onClick={() => navigateTo('consultation')} className="flex items-center gap-4 border-none">
          <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center text-brand">
            <MessageSquare size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[16px]">AI问诊</h3>
            <p className="text-xs text-text-secondary">皮肤专家级深度咨询建议</p>
          </div>
        </Card>

        <Card onClick={() => navigateTo('ingredients')} className="flex items-center gap-4 border-none">
          <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center text-brand">
            <FlaskConical size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[16px]">成分分析</h3>
            <p className="text-xs text-text-secondary">看懂护肤品成分中的秘密</p>
          </div>
        </Card>
      </div>

      <div className="mt-8 flex flex-col items-center">
        <div className="flex items-center gap-4 text-slate-300 text-sm font-medium">
          <span>历史记录</span>
          <span className="w-px h-3 bg-slate-300" />
          <span>关于产品</span>
        </div>
      </div>
      
      <footer className="mt-auto py-8 text-center text-[10px] text-slate-400">
        本结果由AI辅助生成，仅供参考
      </footer>
    </div>
  );

  const Detection = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isStreamOn, setIsStreamOn] = useState(false);

    useEffect(() => {
      async function startCamera() {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setIsStreamOn(true);
          }
        } catch (err) {
          console.error("Camera access denied", err);
        }
      }
      startCamera();
      return () => {
        if (videoRef.current?.srcObject) {
          (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
      };
    }, []);

    const takePhoto = async () => {
      if (canvasRef.current && videoRef.current) {
        const context = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context?.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        
        // Start Analysis
        setIsLoading(true);
        setLoadingText("AI正在分析你的皮肤状态...");
        setCurrentPage('loading');
        
        try {
          const result = await analyzeSkin(dataUrl);
          setAnalysisResult(result);
          navigateTo('result');
        } catch (err) {
          console.error(err);
          navigateTo('home');
        } finally {
          setIsLoading(false);
        }
      }
    };

    return (
      <div className="flex flex-col h-screen bg-black">
        <div className="p-4 flex items-center justify-between bg-black/50 backdrop-blur-sm z-10 absolute top-0 w-full text-white">
          <button onClick={goBack}><ChevronLeft /></button>
          <span className="font-medium">拍照检测</span>
          <div className="w-6" />
        </div>

        <div className="flex-1 relative overflow-hidden flex items-center justify-center">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            {/* Guide Circle */}
            <div className="w-72 h-72 border-2 border-brand/50 rounded-full border-dashed animate-pulse flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-white/80 rounded-full border-dashed" />
            </div>
            <p className="text-white/80 text-sm mt-8 font-medium">请在自然光下拍摄面部</p>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="p-10 bg-black flex flex-col items-center gap-6">
          <button 
            onClick={takePhoto}
            className="w-20 h-20 bg-white rounded-full flex items-center justify-center p-1 border-4 border-white/20"
          >
            <div className="w-full h-full bg-brand rounded-full flex items-center justify-center text-white">
              <Camera size={32} />
            </div>
          </button>
          <p className="text-slate-400 text-xs">点击按钮开始分析</p>
        </div>
      </div>
    );
  };

  const Result = () => {
    if (!analysisResult) return null;

    const getRiskColor = (level: string) => {
      if (level === 'High') return 'text-risk-high';
      if (level === 'Medium') return 'text-risk-mid';
      return 'text-risk-low';
    };

    const getRiskLabel = (level: string) => {
      if (level === 'High') return '高风险';
      if (level === 'Medium') return '中等风险';
      return '安全';
    };

    return (
      <div className="flex flex-col min-h-screen bg-bg-gray">
        <header className="sticky top-0 glass-panel p-4 flex items-center gap-4 z-20">
          <button onClick={() => navigateTo('home')}><ChevronLeft /></button>
          <h2 className="font-bold text-[18px]">皮肤分析报告</h2>
        </header>

        <div className="p-6 space-y-6 pb-24">
          <div className="text-center pt-2">
             <p className="text-text-secondary text-sm mb-1">当前肤质</p>
             <h3 className="text-[22px] font-display font-extrabold text-brand leading-none">{analysisResult.skinType}</h3>
             <SkinRadarChart data={analysisResult.radarData} />
          </div>

          <section>
            <div className="tag-group flex flex-wrap gap-2">
              {analysisResult.problems.map((p, i) => (
                <span key={p} className={cn(i % 2 === 0 ? "tag-red" : "tag-yellow")}>
                  {p}
                </span>
              ))}
            </div>
          </section>

          <section className="space-y-1">
            <div className="flex justify-between items-center py-2.5 border-bottom border-slate-100 border-b">
              <span className="text-[13px] text-text-main font-medium">敏感风险</span>
              <span className={cn("text-[12px] font-bold", getRiskColor(analysisResult.riskLevels.sensitivity))}>
                {getRiskLabel(analysisResult.riskLevels.sensitivity)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-bottom border-slate-100 border-b">
              <span className="text-[13px] text-text-main font-medium">痤疮风险</span>
              <span className={cn("text-[12px] font-bold", getRiskColor(analysisResult.riskLevels.acne))}>
                {getRiskLabel(analysisResult.riskLevels.acne)}
              </span>
            </div>
          </section>

          <section>
            <div className="bg-[#F8FAFC] rounded-xl p-4 border border-slate-100 shadow-sm">
              <h4 className="text-[13px] font-bold mb-4 flex items-center gap-2">
                🧴 推荐方案
              </h4>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <strong className="text-[13px] block mb-0.5">早：修护 + 防晒</strong>
                    <div className="text-[11px] text-text-secondary leading-relaxed space-x-1">
                       {analysisResult.routine.morning.join(' → ')}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <strong className="text-[13px] block mb-0.5">晚：深层补水</strong>
                    <div className="text-[11px] text-text-secondary leading-relaxed space-x-1">
                       {analysisResult.routine.evening.join(' → ')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="p-4 pt-10 text-center relative">
            <div className="text-[10px] text-slate-400">本结果由AI辅助生成，仅供参考</div>
          </div>
        </div>
      </div>
    );
  };

  const Consultation = () => {
    const [messages, setMessages] = useState<{ role: 'ai' | 'user'; content: string }[]>([
      { role: 'ai', content: '### 你好！我是你的皮肤助手。\n请描述你的皮肤问题或关心的话题。' }
    ]);
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
      if (!input.trim() || isSending) return;
      
      const userMsg = input;
      setInput("");
      setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
      setIsSending(true);

      try {
        const aiMsg = await consultAI(userMsg, messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content })));
        setMessages(prev => [...prev, { role: 'ai', content: aiMsg }]);
      } catch (err) {
        setMessages(prev => [...prev, { role: 'ai', content: '抱歉，我现在无法回答，请稍后再试。' }]);
      } finally {
        setIsSending(false);
      }
    };

    return (
      <div className="flex flex-col h-screen bg-bg-gray">
        <header className="glass-panel p-4 flex items-center gap-4 z-20">
          <button onClick={goBack}><ChevronLeft /></button>
          <h2 className="font-bold text-lg">AI问诊</h2>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[85%] p-4 rounded-2xl shadow-sm",
                m.role === 'user' ? "bg-brand text-white rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
              )}>
                <div className="markdown-body text-sm leading-relaxed prose prose-slate max-w-none">
                  <Markdown>{m.content}</Markdown>
                </div>
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex justify-start">
              <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-brand" />
                <span className="text-xs text-slate-400 font-medium">SkinGPT正在思考...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div className="p-4 bg-white border-t border-slate-100 safe-area-bottom">
          <div className="flex gap-2">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="描述您的皮肤问题..."
              className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand outline-none"
            />
            <Button onClick={handleSend} disabled={!input} className="px-4 py-3 rounded-xl h-auto">
              <Send size={18} />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const Ingredients = () => {
    const [input, setInput] = useState("");
    const [result, setResult] = useState<any>(null);
    const [isThinking, setIsThinking] = useState(false);

    const handleAnalyze = async () => {
      if (!input.trim()) return;
      setIsThinking(true);
      try {
        const res = await analyzeIngredients(input);
        setResult(res);
      } catch (err) {
        console.error(err);
      } finally {
        setIsThinking(false);
      }
    };

    return (
      <div className="flex flex-col min-h-screen bg-bg-gray">
        <header className="glass-panel p-4 flex items-center gap-4 z-20">
          <button onClick={goBack}><ChevronLeft /></button>
          <h2 className="font-bold text-lg">成分分析</h2>
        </header>

        <div className="p-6 space-y-6">
          <section>
            <h4 className="font-bold text-slate-800 mb-3">请输入成分表</h4>
            <div className="relative">
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="例如：水、甘油、丁二醇、烟酰胺..."
                className="w-full h-32 bg-white rounded-2xl p-4 text-sm border border-slate-200 outline-none focus:ring-2 focus:ring-brand shadow-sm resize-none"
              />
            </div>
            <Button 
              onClick={handleAnalyze} 
              isLoading={isThinking} 
              disabled={!input}
              className="w-full mt-4"
            >
              开始分析
            </Button>
          </section>

          <AnimatePresence>
            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-brand/5 rounded-2xl p-4 border border-brand/20">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-slate-800">🔍 分析结果</h4>
                    {result.safetyRating && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-slate-500">安全得分:</span>
                        <span className="text-lg font-bold text-brand">{result.safetyRating}/10</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h5 className="text-xs font-bold text-risk-high uppercase tracking-wider mb-2 flex items-center gap-1">
                        <AlertCircle size={14} /> 风险成分
                      </h5>
                      <div className="space-y-2">
                        {result.riskIngredients.map((ing: any, i: number) => (
                          <div key={i} className="bg-white/50 p-2 rounded-lg text-sm">
                            <span className="font-bold text-risk-high">❌ {ing.name}</span>
                            <p className="text-xs text-slate-500 mt-1">{ing.reason}</p>
                          </div>
                        ))}
                        {result.riskIngredients.length === 0 && <p className="text-xs text-slate-400">未检测到高风险成分</p>}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-risk-low uppercase tracking-wider mb-2 flex items-center gap-1">
                        <CheckCircle2 size={14} /> 安全/有效成分
                      </h5>
                      <div className="space-y-2">
                        {result.safeIngredients.map((ing: any, i: number) => (
                          <div key={i} className="bg-white/50 p-2 rounded-lg text-sm">
                            <span className="font-bold text-brand">✅ {ing.name}</span>
                            <p className="text-xs text-slate-500 mt-1">{ing.benefit}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-brand/10">
                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">🎯 适合人群</h5>
                      <p className="text-sm font-medium text-slate-700">{result.suitableSkinTypes}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  const Loading = () => (
    <div className="h-screen flex flex-col items-center justify-center bg-bg-gray p-8 text-center gap-6">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        className="w-16 h-16 border-4 border-slate-200 border-t-brand rounded-full"
      />
      <div>
        <h3 className="text-xl font-bold text-slate-800">{loadingText}</h3>
        <p className="text-slate-400 text-sm mt-2">AI正在调动千万级专业皮肤数据库...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto h-screen bg-bg-gray shadow-2xl relative overflow-x-hidden border-x border-slate-100">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="h-full"
        >
          {currentPage === 'home' && <Home />}
          {currentPage === 'detection' && <Detection />}
          {currentPage === 'result' && <Result />}
          {currentPage === 'consultation' && <Consultation />}
          {currentPage === 'ingredients' && <Ingredients />}
          {currentPage === 'loading' && <Loading />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
