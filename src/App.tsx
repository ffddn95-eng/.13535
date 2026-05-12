import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Sparkles, AlertTriangle, CheckCircle2, Target, CalendarDays, BarChart, RotateCcw, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { HeroParticles } from "./components/HeroParticles";
import { analyzeIdea, type IdeaAnalysis } from "./lib/gemini";
import { AnalysisDashboard } from "./components/AnalysisDashboard";
import { auth, signInWithGoogle, logOut, saveAnalysisResult, getAnalysisResult, getAllAnalyses } from "./lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { AuthModal } from "./components/AuthModal";
import { LoadingView } from "./components/LoadingView";

const PLACEHOLDER_IDEAS = [
  "e.g. A newsletter for remote software engineers...",
  "e.g. An indoor plant subscription service...",
  "e.g. AI-powered verbal language practice tool...",
  "e.g. Landing page templates for solo founders...",
  "e.g. A smart home water usage tracker..."
];

const useTypewriterPlaceholder = (phrases: string[]) => {
  const [text, setText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
      if (text.length > 0) {
        timeout = setTimeout(() => {
          setText(currentPhrase.substring(0, text.length - 1));
        }, 30);
      } else {
        setIsDeleting(false);
        setPhraseIndex(prev => (prev + 1) % phrases.length);
      }
    } else {
      if (text.length < currentPhrase.length) {
        timeout = setTimeout(() => {
          setText(currentPhrase.substring(0, text.length + 1));
        }, 50);
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, 3000);
      }
    }

    return () => clearTimeout(timeout);
  }, [text, isDeleting, phraseIndex, phrases]);

  return text;
};

export default function App() {
  const [idea, setIdea] = useState("");
  const typingPlaceholder = useTypewriterPlaceholder(PLACEHOLDER_IDEAS);
  const [analysisStage, setAnalysisStage] = useState<'idle' | 'transitioning' | 'loading'>('idle');
  const [analysisResult, setAnalysisResult] = useState<IdeaAnalysis | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingAnalysis, setPendingAnalysis] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyItems, setHistoryItems] = useState<{idea: string, analysisResult: IdeaAnalysis, createdAt: any}[]>([]);

  const handleLoadHistory = async () => {
    if (user) {
      const hist = await getAllAnalyses(user.uid);
      setHistoryItems(hist);
      setShowHistoryModal(true);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && pendingAnalysis) {
        setPendingAnalysis(false);
        setIsAuthModalOpen(false);
        handleAnalyzeSession(currentUser);
      }
    });
    return () => unsubscribe();
  }, [pendingAnalysis]);

  const handleAnalyzeClick = () => {
    if (!idea.trim() || analysisStage !== 'idle') return;
    
    if (!user) {
      setPendingAnalysis(true);
      setIsAuthModalOpen(true);
      return;
    }

    // Pass force=true to bypass cache
    handleAnalyzeSession(user, true);
  };

  const handleAnalyzeSession = async (activeUser: User | null, force: boolean = false) => {
    setAnalysisStage('transitioning');
    
    const transitionTimer = setTimeout(() => {
      setAnalysisStage('loading');
    }, 2500);

    const startTime = Date.now();
    try {
      let result: IdeaAnalysis | null = null;
      if (activeUser && !force) {
        result = await getAnalysisResult(activeUser.uid, idea);
      }

      if (!result) {
        result = await analyzeIdea(idea);
        if (activeUser) {
          await saveAnalysisResult(activeUser.uid, idea, result);
        }
      }
      
      const elapsed = Date.now() - startTime;
      const minTotalTime = 5000; // minimum total animation + loading time
      const waitTime = Math.max(minTotalTime - elapsed, 0);
      
      setTimeout(() => {
        setAnalysisResult(result);
        setAnalysisStage('idle');
      }, waitTime);
      
    } catch (error: any) {
      clearTimeout(transitionTimer);
      console.error("Analysis failed:", error);
      
      alert("Failed to analyze idea: " + (error?.message || "Please try again."));
      setAnalysisStage('idle');
    }
  };

  const handleSignInClick = () => {
    setIsAuthModalOpen(true);
  };

  return (
    <div className="bg-[#050505] text-white font-['Helvetica_Neue',Arial,sans-serif] antialiased selection:bg-white/20 min-h-screen relative overflow-hidden">
      
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      
      {/* History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0f0f0f] border border-white/10 w-full max-w-2xl max-h-[80vh] rounded-2xl p-6 md:p-10 flex flex-col relative overflow-hidden"
            >
              <button onClick={() => setShowHistoryModal(false)} className="absolute top-4 right-4 text-white/50 hover:text-white p-2">✕</button>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><CalendarDays className="w-5 h-5" /> My Archives</h2>
              {historyItems.length === 0 ? (
                <p className="text-white/50 text-sm">No analysis history found.</p>
              ) : (
                <div className="flex-1 overflow-y-auto pr-2 pb-4 flex flex-col gap-4">
                  {historyItems.map((item, idx) => (
                    <div key={idx} className="bg-[#111] border border-white/5 p-4 rounded-xl cursor-pointer hover:bg-[#1a1a1a] transition-colors"
                      onClick={() => {
                        setIdea(item.idea);
                        setAnalysisResult(item.analysisResult);
                        setAnalysisStage('idle');
                        setShowHistoryModal(false);
                      }}>
                      <div className="flex justify-between items-start mb-2 gap-4">
                        <p className="text-sm font-medium text-white/90 line-clamp-2 leading-relaxed">"{item.idea}"</p>
                        <span className={`text-xs font-bold px-2 py-1 rounded bg-white/5 ${item.analysisResult.verdict === 'GO' ? 'text-green-400' : item.analysisResult.verdict === 'PIVOT' ? 'text-yellow-400' : 'text-red-400'}`}>{item.analysisResult.verdict}</span>
                      </div>
                      <p className="text-xs text-white/40">{item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString() : 'Recent'}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Background Particles */}
      <AnimatePresence>
        {!analysisResult && (
          <motion.div 
            key="particles"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 z-0 pointer-events-none opacity-50"
          >
            <HeroParticles isAnalyzing={analysisStage === 'transitioning' || analysisStage === 'loading'} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {analysisResult ? (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 block"
          >
            <AnalysisDashboard 
              idea={idea} 
              analysis={analysisResult} 
              onReset={() => {
                setAnalysisResult(null);
                setIdea("");
                setAnalysisStage("idle");
              }} 
              onForceReanalyze={() => {
                setAnalysisResult(null);
                handleAnalyzeSession(user, true);
              }}
            />
          </motion.div>
        ) : analysisStage === 'loading' ? (
          <motion.div key="loading" className="relative z-10 block">
            <LoadingView idea={idea} />
          </motion.div>
        ) : (
          <motion.div key="landing" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* HERO SECTION */}
            <motion.div 
              className="relative z-10 min-h-screen flex flex-col overflow-hidden"
              animate={analysisStage === 'transitioning' ? { opacity: [1, 1, 0] } : { opacity: 1 }}
              transition={{ duration: 2.5, times: [0, 0.8, 1], ease: "easeInOut" }}
            >
            {/* Navigation */}
            <motion.nav 
          animate={analysisStage === 'transitioning' ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute top-0 w-full flex items-center justify-between px-[60px] py-[40px] z-50 box-border"
        >
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-white flex items-center justify-center">
              <div className="w-2 h-2 bg-[#050505]" />
            </div>
            <span className="text-[18px] font-bold tracking-[-0.5px] uppercase">FirstRevenue</span>
          </div>
          <div className="hidden md:flex items-center gap-[32px] text-[12px] uppercase tracking-[1px] font-medium opacity-70">
            <a href="#method" className="hover:opacity-100 transition-opacity">Method</a>
            <a href="#engine" className="hover:opacity-100 transition-opacity">Engine</a>
            <a href="#pricing" className="hover:opacity-100 transition-opacity">Pricing</a>
          </div>
          <div className="flex items-center gap-4 cursor-pointer pointer-events-auto">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-[12px] opacity-60 hidden md:block">
                  {user.email}
                </span>
                <button 
                  onClick={handleLoadHistory}
                  className="flex items-center gap-2 text-[12px] uppercase tracking-[1px] font-medium opacity-70 hover:opacity-100 transition-opacity"
                >
                  <CalendarDays className="w-3 h-3" />
                  My Ideas
                </button>
                <button 
                  onClick={logOut}
                  className="flex items-center gap-2 text-[12px] uppercase tracking-[1px] font-medium opacity-70 hover:opacity-100 transition-opacity"
                >
                  <LogOut className="w-3 h-3" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button 
                onClick={handleSignInClick}
                className="text-[12px] uppercase tracking-[1px] font-medium opacity-70 hover:opacity-100 transition-opacity"
              >
                Sign In
              </button>
            )}
          </div>
        </motion.nav>

        {/* Hero Content */}
        <main className="h-screen flex flex-col justify-center items-center px-[60px] text-center relative z-10 w-full max-w-[1024px] mx-auto pointer-events-none">
          
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={analysisStage === 'transitioning' ? { opacity: [1, 0, 0], y: [0, -20, -20] } : { opacity: 1, y: 0 }}
            transition={analysisStage === 'transitioning' ? { duration: 2.5, times: [0, 0.3, 1] } : { duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2 bg-white/5 border border-white/10 px-[14px] py-[6px] rounded-full text-[10px] uppercase tracking-[1.5px] text-[#888] mb-[24px]"
          >
            <Sparkles className="w-3 h-3 text-[#888]" />
            <span>The Execution Engine</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={analysisStage === 'transitioning' ? { opacity: [1, 0, 0], y: [0, -20, -20] } : { opacity: 1, y: 0 }}
            transition={analysisStage === 'transitioning' ? { duration: 2.5, times: [0, 0.2, 1] } : { duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-6xl md:text-[80px] lg:text-[112px] leading-[0.9] font-bold tracking-[-4px] mb-[24px] bg-gradient-to-b from-white to-[#b0b0b0] bg-clip-text text-transparent uppercase pointer-events-auto"
          >
            Stop planning. <br />
            Start shipping.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={analysisStage === 'transitioning' ? { opacity: [1, 0, 0], y: [0, -20, -20] } : { opacity: 1, y: 0 }}
            transition={analysisStage === 'transitioning' ? { duration: 2.5, times: [0, 0.2, 1] } : { duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-[600px] text-[18px] md:text-[20px] leading-[1.6] text-white/90 font-light mb-[60px] pointer-events-auto drop-shadow-md"
          >
            An automated business builder that breaks your idea down into a daily execution plan. From concept to your first paying customer in record time.
          </motion.p>

          {/* Input Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[840px] relative pointer-events-auto shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
          >
            {analysisStage === 'transitioning' && (
              <motion.div 
                className="absolute inset-y-0 left-0 flex items-center px-[32px] pointer-events-none z-[100] text-white font-light text-[16px] md:text-[18px] whitespace-nowrap drop-shadow-2xl"
                style={{ originX: 0, originY: 0.5 }}
                initial={{ x: 0, scale: 1, opacity: 1, filter: 'blur(0px)' }}
                animate={{ 
                  scale: [1, 2.5, 3],
                  x: [0, 0, '80vw'],
                  opacity: [1, 1, 0],
                  filter: ['blur(0px)', 'blur(0px)', 'blur(10px)']
                }}
                transition={{ duration: 2.5, ease: "easeInOut", times: [0, 0.5, 1] }}
              >
                {idea}
              </motion.div>
            )}

            {/* Animated glowing border wrapper */}
            <motion.div 
               className="relative p-[2px] rounded-[16px] overflow-hidden bg-white/5 group"
               animate={analysisStage === 'transitioning' ? { opacity: [1, 0, 0], scale: [1, 0.95, 0.95] } : { opacity: 1, scale: 1 }}
               transition={{ duration: 2.5, times: [0, 0.2, 1] }}
            >
              <div className="absolute left-1/2 top-1/2 aspect-square w-[300%] -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none">
                <div 
                  className="w-full h-full animate-spin opacity-50 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    animationDuration: '4s',
                    background: 'conic-gradient(from 0deg, transparent 0%, transparent 80%, rgba(255,255,255,1) 100%)'
                  }}
                />
              </div>
              <div className="relative z-10 flex md:flex-row flex-col items-center bg-[#050505] rounded-[15px] p-2 backdrop-blur-[40px] overflow-visible">
                
                <div className={`flex-1 w-full flex items-center transition-opacity duration-300 ${analysisStage === 'transitioning' ? 'opacity-0' : 'opacity-100'}`}>
                  <input
                    id="ideaInput"
                    type="text"
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeClick()}
                    placeholder={typingPlaceholder}
                    className="flex-1 w-full bg-transparent border-none outline-none px-[24px] py-[20px] text-white text-[16px] md:text-[18px] font-light placeholder:text-white/40 focus:ring-0"
                    disabled={analysisStage !== 'idle'}
                  />
                </div>
                
                <button 
                  onClick={handleAnalyzeClick}
                  disabled={analysisStage !== 'idle'}
                  className={`cursor-pointer w-full md:w-auto flex items-center justify-center gap-2 bg-white text-black font-semibold text-[14px] uppercase tracking-[0.5px] px-[36px] py-[18px] rounded-[10px] hover:bg-neutral-200 transition-all active:scale-95 ${analysisStage === 'transitioning' ? 'opacity-0' : 'opacity-100'}`}
                >
                  Analyze
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </motion.div>

          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={analysisStage === 'transitioning' ? { opacity: [1, 0, 0] } : { opacity: 1 }}
            transition={analysisStage === 'transitioning' ? { duration: 2.5, times: [0, 0.3, 1] } : { duration: 0.8, delay: 0.5 }}
            className="mt-6 text-[11px] text-white/30 uppercase tracking-[1px] pointer-events-auto"
          >
            Press <kbd className="px-1.5 py-0.5 border border-white/20 rounded mx-1 font-mono">Enter</kbd> to generate your execution blueprint.
          </motion.p>

        </main>

        {/* Editorial Accent line */}
        <motion.div 
          animate={analysisStage === 'transitioning' ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-[120px] left-1/2 -translate-x-1/2 w-px h-[60px] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" 
        />
        
        {/* Editorial Meta Info */}
        <motion.div 
          animate={analysisStage === 'transitioning' ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-[40px] w-full flex justify-between px-[60px] box-border text-[11px] text-white/30 uppercase tracking-[1px] pointer-events-none"
        >
          <div className="hidden sm:block">01 / Idea Validation</div>
          <div className="hidden sm:block">02 / Execution Strategy</div>
          <div className="hidden sm:block">03 / First Dollar</div>
        </motion.div>
      </motion.div>

      {/* SECTION 1: Problem vs Solution */}
      <section id="method" className="py-[120px] px-[24px] md:px-[60px] border-t border-white/10 relative bg-[#020202]">
        <div className="max-w-[1024px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-[80px]">
          <div>
            <div className="text-[10px] uppercase tracking-[1.5px] text-[#aaa] mb-[24px]">The Problem</div>
            <h2 className="text-[32px] md:text-[40px] font-bold tracking-[-2px] leading-[1.1] uppercase mb-[24px] text-white">
              Ideas are cheap.<br/>Execution is rare.
            </h2>
            <p className="text-[16px] text-white/80 leading-[1.7] font-light">
              Most AI idea-validation tools just give you a "market score" and tell you to build it. They leave you with the hardest part: figuring out what to do Day 1, Day 2, and Day 3. FirstRevenue doesn't just validate your idea. It breaks it down into a daily actionable plan designed for one singular outcome: your first transaction.
            </p>
          </div>
          <div className="flex flex-col gap-[16px] justify-center">
            <div className="bg-[#111] border border-white/10 p-[32px] flex items-start gap-[20px]">
              <AlertTriangle className="w-5 h-5 text-[#aaa] shrink-0 mt-1" />
              <div>
                <h3 className="text-[15px] text-white uppercase tracking-[1px] font-bold mb-[8px]">Without Strategy</h3>
                <p className="text-[15px] text-white/60 font-light leading-[1.6]">You have an idea, but no clear next step. You research endlessly, build features no one asked for, and eventually lose momentum.</p>
              </div>
            </div>
            <div className="bg-white text-black p-[32px] flex items-start gap-[20px] shadow-[0_0_40px_rgba(255,255,255,0.1)]">
              <CheckCircle2 className="w-5 h-5 text-black shrink-0 mt-1" />
              <div>
                <h3 className="text-[15px] uppercase tracking-[1px] font-bold mb-[8px]">With FirstRevenue</h3>
                <p className="text-[15px] text-black/80 font-light leading-[1.6]">You receive a daily, microscopic task list. "Find 10 people in this specific subreddit. Send them this exact message." No guessing.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Core Methodology */}
      <section id="engine" className="py-[120px] px-[24px] md:px-[60px] border-t border-white/10 relative overflow-hidden bg-[#050505]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-screen h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        
        <div className="max-w-[1024px] mx-auto text-center mb-[80px]">
          <div className="text-[10px] uppercase tracking-[1.5px] text-[#aaa] mb-[24px]">Architecture</div>
          <h2 className="text-[32px] md:text-[56px] text-white font-bold tracking-[-2px] leading-[1] uppercase">The Implementation<br />Pipeline.</h2>
        </div>

        <div className="max-w-[1024px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-[24px]">
          {/* Step 1 */}
          <div className="border border-white/10 p-[48px] bg-[#0c0c0c] flex flex-col items-center text-center group hover:bg-[#151515] transition-colors shadow-lg">
            <Target className="w-10 h-10 text-white/50 mb-[32px] group-hover:text-white transition-colors" />
            <div className="text-[10px] uppercase tracking-[1.5px] text-[#aaa] mb-[12px]">Phase 01</div>
            <h3 className="text-[20px] text-white uppercase tracking-[-0.5px] font-bold mb-[16px]">Targeting & Feasibility</h3>
            <p className="text-[15px] text-white/80 font-light leading-[1.6]">We assess Market Demand, Difficulty, and Speed. If the idea is too slow to execute, we force a pivot to a leaner version.</p>
          </div>
          {/* Step 2 */}
          <div className="border border-white/10 p-[48px] bg-[#0c0c0c] flex flex-col items-center text-center group hover:bg-[#151515] transition-colors shadow-lg">
            <CalendarDays className="w-10 h-10 text-white/50 mb-[32px] group-hover:text-white transition-colors" />
            <div className="text-[10px] uppercase tracking-[1.5px] text-[#aaa] mb-[12px]">Phase 02</div>
            <h3 className="text-[20px] text-white uppercase tracking-[-0.5px] font-bold mb-[16px]">Action Dissection</h3>
            <p className="text-[15px] text-white/80 font-light leading-[1.6]">We generate your exact audience definition, acquisition channels, message templates, pricing strategy, and a day-by-day checklist.</p>
          </div>
          {/* Step 3 */}
          <div className="border border-white/10 p-[48px] bg-[#0c0c0c] flex flex-col items-center text-center group hover:bg-[#151515] transition-colors shadow-lg">
            <RotateCcw className="w-10 h-10 text-white/50 mb-[32px] group-hover:text-white transition-colors" />
            <div className="text-[10px] uppercase tracking-[1.5px] text-[#aaa] mb-[12px]">Phase 03</div>
            <h3 className="text-[20px] text-white uppercase tracking-[-0.5px] font-bold mb-[16px]">Feedback Loop</h3>
            <p className="text-[15px] text-white/80 font-light leading-[1.6]">Track your progress. Log outreach replies, ignored messages, and payments. The AI adjusts your script and targeting based on real data.</p>
          </div>
        </div>
      </section>

      {/* SECTION 3: Tracking Dash Mockup (Editorial style text) */}
      <section className="py-[120px] px-[24px] md:px-[60px] border-t border-white/10 relative bg-[#090909]">
        <div className="max-w-[1024px] mx-auto flex flex-col md:flex-row items-center gap-[80px]">
          <div className="flex-1 w-full relative">
            {/* Minimalist Dashboard Representation */}
            <div className="border border-white/20 bg-[#000] p-[40px] font-mono text-[13px] text-white/70 leading-[1.8] shadow-2xl">
               <div className="flex justify-between border-b border-white/20 pb-[20px] mb-[20px]">
                  <span className="text-white font-bold">DAY_01_EXECUTION</span>
                  <span className="text-[#aaa]">STATUS: IN_PROGRESS</span>
               </div>
               <div className="mb-[12px] flex items-center gap-[16px] text-white">
                  <div className="w-2.5 h-2.5 bg-white"></div>
                  <span>Identify 10 potential users in r/SaaS</span>
               </div>
               <div className="mb-[12px] flex items-center gap-[16px] opacity-80">
                  <div className="w-2.5 h-2.5 border border-white/50"></div>
                  <span>Send direct message template [A]</span>
               </div>
               <div className="mb-[32px] flex items-center gap-[16px] opacity-60">
                  <div className="w-2.5 h-2.5 border border-white/50"></div>
                  <span>Record response rate</span>
               </div>
               <div className="bg-[#111] p-[20px] border border-white/10 mt-[16px]">
                  <span className="text-[#aaa] block mb-[12px] font-bold text-[11px] uppercase tracking-widest">System_Feedback</span>
                  <span className="text-white">"Response rate is below 10%. Recalibrating message template to focus on immediate pain point rather than feature list."</span>
               </div>
            </div>
          </div>
          <div className="flex-1 w-full">
            <div className="text-[10px] uppercase tracking-[1.5px] text-[#aaa] mb-[24px]">Continuous Loop</div>
            <h2 className="text-[32px] md:text-[48px] text-white font-bold tracking-[-1px] uppercase mb-[24px] leading-tight">Track.<br/>Adapt.<br/>Overcome.</h2>
            <p className="text-[16px] md:text-[18px] text-white/80 font-light leading-[1.6]">
              Execution isn't a straight line. If you reach out to 20 people and hear nothing back, the engine doesn't tell you to give up. It analyzes the failure, mutates your message, refines your target, and gives you a new, statistically-better task for tomorrow.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4: Examples/Use Cases */}
      <section className="py-[120px] px-[24px] md:px-[60px] border-t border-white/10 relative bg-[#020202]">
        <div className="max-w-[1024px] mx-auto text-center mb-[80px]">
          <div className="text-[10px] uppercase tracking-[1.5px] text-[#aaa] mb-[24px]">Real Data</div>
          <h2 className="text-[32px] md:text-[48px] text-white font-bold tracking-[-1px] uppercase">Idea to Execution<br/>Examples</h2>
        </div>
        
        <div className="max-w-[1024px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-[40px]">
          {/* Example A */}
          <div className="border border-white/10 p-[40px] bg-[#0c0c0c] flex flex-col items-start text-left hover:border-white/30 transition-colors">
            <div className="text-white/60 text-[14px] font-mono mb-[16px]">Input: "An app for dog walkers to manage schedules"</div>
            <h3 className="text-[20px] text-white uppercase tracking-[-0.5px] font-bold mb-[16px]">FirstRevenue Output</h3>
            <p className="text-[14px] text-white/80 font-light leading-[1.6] mb-[24px]">"Do not build the app yet. Go to local dog parks, find 5 dog walkers, and ask them to pay $10/mo to join a WhatsApp group where you manually match them with overflow clients."</p>
            <div className="flex items-center gap-[8px] text-[12px] font-bold text-white uppercase tracking-[1px] mt-auto pt-[24px] border-t border-white/10 w-full">
               <span className="w-2 h-2 rounded-full bg-white"></span> Minimum Viable Action
            </div>
          </div>
          {/* Example B */}
          <div className="border border-white/10 p-[40px] bg-[#0c0c0c] flex flex-col items-start text-left hover:border-white/30 transition-colors">
            <div className="text-white/60 text-[14px] font-mono mb-[16px]">Input: "AI-generated recipes from fridge ingredients"</div>
            <h3 className="text-[20px] text-white uppercase tracking-[-0.5px] font-bold mb-[16px]">FirstRevenue Output</h3>
            <p className="text-[14px] text-white/80 font-light leading-[1.6] mb-[24px]">"Market is saturated. Pivot to niche: High-protein meal prep for specific diet types. Day 1: Set up a simple Carrd landing page offering a $5 custom 7-day plan. Post link in 3 fitness Discord servers."</p>
            <div className="flex items-center gap-[8px] text-[12px] font-bold text-white uppercase tracking-[1px] mt-auto pt-[24px] border-t border-white/10 w-full">
               <span className="w-2 h-2 rounded-full bg-white"></span> Fast Pivot Strategy
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: Social Proof */}
      <section className="py-[120px] px-[24px] md:px-[60px] border-t border-white/10 relative bg-[#050505]">
        <div className="max-w-[1024px] mx-auto text-center mb-[80px]">
          <div className="text-[10px] uppercase tracking-[1.5px] text-[#aaa] mb-[24px]">Results</div>
          <h2 className="text-[32px] md:text-[48px] text-white font-bold tracking-[-1px] uppercase">Proof of Work</h2>
        </div>
        <div className="max-w-[1024px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-[24px]">
          <div className="border border-white/10 p-[32px] bg-[#0c0c0c]">
             <div className="flex gap-1 mb-[16px]">
               {[1,2,3,4,5].map(i => <Sparkles key={i} className="w-3 h-3 text-white" />)}
             </div>
             <p className="text-[14px] text-white/80 font-light leading-[1.6] mb-[24px]">"I spent 3 months over-engineering a SaaS. FirstRevenue told me to make a Google Sheet and sell access for $20. Made my first sale in 48 hours."</p>
             <div className="font-mono text-[12px] text-[#aaa] uppercase">— David, Developer</div>
          </div>
          <div className="border border-white/10 p-[32px] bg-[#0c0c0c]">
             <div className="flex gap-1 mb-[16px]">
               {[1,2,3,4,5].map(i => <Sparkles key={i} className="w-3 h-3 text-white" />)}
             </div>
             <p className="text-[14px] text-white/80 font-light leading-[1.6] mb-[24px]">"The daily execution plan is ruthless. It forces you to actually talk to potential customers instead of indefinitely tweaking your logo."</p>
             <div className="font-mono text-[12px] text-[#aaa] uppercase">— Sarah, Designer</div>
          </div>
          <div className="border border-white/10 p-[32px] bg-[#0c0c0c]">
             <div className="flex gap-1 mb-[16px]">
               {[1,2,3,4,5].map(i => <Sparkles key={i} className="w-3 h-3 text-white" />)}
             </div>
             <p className="text-[14px] text-white/80 font-light leading-[1.6] mb-[24px]">"I used the free tier to pivot my agency idea. The feedback loop completely changed my pricing strategy. This is a game changer."</p>
             <div className="font-mono text-[12px] text-[#aaa] uppercase">— Marcus, Founder</div>
          </div>
        </div>
      </section>

      {/* SECTION 6: FAQ */}
      <section className="py-[120px] px-[24px] md:px-[60px] border-t border-white/10 relative bg-[#020202]">
        <div className="max-w-[800px] mx-auto">
          <div className="text-[10px] uppercase tracking-[1.5px] text-[#aaa] mb-[24px] text-center">Clarity</div>
          <h2 className="text-[32px] md:text-[48px] text-white font-bold tracking-[-1px] uppercase text-center mb-[80px]">Common Questions</h2>
          
          <div className="flex flex-col gap-[24px]">
            <div className="border border-white/10 p-[32px] bg-[#050505] hover:bg-[#0a0a0a] transition-colors">
              <h3 className="text-[18px] text-white font-bold mb-[12px] uppercase tracking-[-0.5px]">Is this just another ChatGPT wrapper?</h3>
              <p className="text-[15px] text-white/60 font-light leading-[1.6]">ChatGPT gives you generic advice. FirstRevenue integrates tracking, daily checklists, and feedback loops. It remembers your progress and forces adaptation based on actual market response, acting as an automated growth manager.</p>
            </div>
            
            <div className="border border-white/10 p-[32px] bg-[#050505] hover:bg-[#0a0a0a] transition-colors">
              <h3 className="text-[18px] text-white font-bold mb-[12px] uppercase tracking-[-0.5px]">Can it code my app for me?</h3>
              <p className="text-[15px] text-white/60 font-light leading-[1.6]">No. In fact, if your first step is "build an app," FirstRevenue will stop you. We focus on validating the transaction first. You will be instructed to sell a mockup, a service, or a simplified version before writing a single line of code.</p>
            </div>
            
            <div className="border border-white/10 p-[32px] bg-[#050505] hover:bg-[#0a0a0a] transition-colors">
              <h3 className="text-[18px] text-white font-bold mb-[12px] uppercase tracking-[-0.5px]">What if my idea is rejected?</h3>
              <p className="text-[15px] text-white/60 font-light leading-[1.6]">If our system determines your idea requires too much capital, time, or technical risk for a solo founder, we won't let you waste months on it. We will provide a pivoted, execution-ready alternative in the same industry.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: CTAs & Pricing block */}
      <section id="pricing" className="py-[140px] px-[24px] md:px-[60px] border-t border-white/10 text-center relative bg-[#050505]">
        <div className="max-w-[700px] mx-auto">
          <div className="text-[10px] uppercase tracking-[1.5px] text-[#aaa] mb-[24px] flex justify-center items-center gap-2">
            <div className="w-2 h-2 bg-[#aaa] rounded-full"></div> Let's Move
          </div>
          <h2 className="text-[40px] md:text-[56px] text-white font-bold tracking-[-2px] uppercase mb-[32px] leading-[1.1]">Start Generating<br/>Revenue Today.</h2>
          <p className="text-[18px] text-white/80 font-light leading-[1.6] mb-[48px]">
            The Free tier gives you foundational feasibility analysis and early execution steps. Pro tier unlocks the continuous feedback loop, dynamic pivoting, and unlimited tracking.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-[20px]">
            <button 
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                document.getElementById('ideaInput')?.focus();
              }}
              className="bg-white text-black font-bold text-[15px] uppercase tracking-[1px] px-[48px] py-[22px] rounded-[12px] hover:bg-neutral-200 transition-transform active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              Start Building For Free
            </button>
            <button className="bg-transparent border border-white/30 text-white font-bold text-[15px] uppercase tracking-[1px] px-[48px] py-[22px] rounded-[12px] hover:bg-white/10 transition-colors">
              Pro Features
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-[60px] px-[24px] md:px-[80px] border-t border-white/10 text-[11px] uppercase tracking-[2px] text-[#888] flex flex-col md:flex-row justify-between items-center gap-[24px] bg-[#020202]">
        <div className="font-medium text-white/50">© 2026 FirstRevenue. Execution is everything.</div>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <a href="https://www.buymeacoffee.com/avoylo" target="_blank" rel="noreferrer" className="hover:opacity-80 transition-opacity">
            <img 
              src="https://img.buymeacoffee.com/button-api/?text=Support Development&emoji=☕&slug=avoylo&button_colour=FFDD00&font_colour=000000&font_family=Inter&outline_colour=000000&coffee_colour=ffffff" 
              alt="Support Development"
              style={{ height: '32px', width: 'auto' }}
            />
          </a>
          <div className="flex gap-[32px]">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

