import React from 'react';
import { motion } from 'motion/react';
import { Target, AlertTriangle, Compass, Zap, Scale, Layers, TrendingUp, AlertOctagon, UserCheck, Play, CalendarDays } from 'lucide-react';
import type { IdeaAnalysis } from '../lib/gemini';

export const AnalysisDashboard = ({ idea, analysis, onReset, onForceReanalyze }: { idea: string, analysis: IdeaAnalysis, onReset: () => void, onForceReanalyze: () => void }) => {
  const getVerdictStyle = (verdict: string) => {
    switch (verdict) {
      case 'GO': return 'text-green-400 border-green-400/30 bg-green-400/10';
      case 'PIVOT': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
      case 'STOP': return 'text-red-400 border-red-400/30 bg-red-400/10';
      default: return 'text-white border-white/30 bg-white/10';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-green-400';
    if (score >= 40) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  const { scores } = analysis;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-['Helvetica_Neue',Arial,sans-serif] selection:bg-white/20">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-10">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 border-b border-white/10 pb-8">
          <div>
            <div className="flex gap-4">
              <button onClick={onReset} className="text-[10px] uppercase tracking-[2px] text-[#aaa] hover:text-white mb-4 transition-colors">
                ← New Analysis
              </button>
              <button onClick={onForceReanalyze} className="text-[10px] uppercase tracking-[2px] text-blue-400 hover:text-blue-300 mb-4 transition-colors">
                Force Reanalyze
              </button>
              <button 
                onClick={() => {
                  const shareText = `[FirstRevenue] ${idea}\n\nConclusion: ${analysis.oneLineConclusion}\nScore: ${analysis.overallScore}/100\nVerdict: ${analysis.verdict}\n\nhttps://firstrevenue.com`;
                  navigator.clipboard.writeText(shareText);
                  alert("Report copied to clipboard!");
                }} 
                className="text-[10px] uppercase tracking-[2px] text-purple-400 hover:text-purple-300 mb-4 transition-colors ml-auto flex items-center gap-1"
              >
                Copy Report Text
              </button>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-2">Analysis Report</h1>
            <p className="text-white/50 text-sm md:text-base font-mono">"{idea}"</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <div className={`px-6 py-3 rounded-full border ${getVerdictStyle(analysis.verdict)} flex items-center justify-center`}>
              <span className="text-sm font-bold tracking-widest uppercase">Verdict: {analysis.verdict}</span>
            </div>
            <div className="px-6 py-3 rounded-full border border-[#444] bg-[#111] flex items-center justify-center">
              <span className="text-sm font-bold tracking-widest text-[#ddd] flex gap-2 items-center">
                Total Score: <span className={analysis.overallScore >= 50 ? 'text-green-400' : 'text-red-400'}>{analysis.overallScore}/100</span>
              </span>
            </div>
          </div>

          <div className="mt-4 bg-[#111] border border-white/10 p-6 rounded-xl">
            <h2 className="text-xs uppercase tracking-[2px] text-[#aaa] font-bold mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" /> Executive Summary
            </h2>
            <p className="text-lg md:text-xl font-light leading-relaxed mb-6">
              {analysis.oneLineConclusion}
            </p>

            <div className="border-t border-white/10 pt-6 mt-2">
              <h3 className="text-xs font-bold text-[#aaa] uppercase tracking-[2px] mb-4">Execution Comparison (Growth Potential)</h3>
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/60">Your Original Idea</span>
                    <span className="text-white font-bold">{analysis.overallScore}/100</span>
                  </div>
                  <div className="w-full h-2 bg-[#222] rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${analysis.overallScore}%` }} className="h-full bg-white/30" transition={{ duration: 1 }} />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-400 font-bold">Recommended Pivot Execution</span>
                    <span className="text-green-400 font-bold">{Math.min(100, analysis.overallScore + 25)}/100</span>
                  </div>
                  <div className="w-full h-2 bg-[#222] rounded-full overflow-hidden relative shadow-[0_0_15px_rgba(74,222,128,0.2)]">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, analysis.overallScore + 25)}%` }} className="h-full bg-green-400" transition={{ duration: 1, delay: 0.2 }} />
                    <motion.div initial={{ width: 0 }} animate={{ left: `${analysis.overallScore}%`, width: `${Math.min(100, analysis.overallScore + 25) - analysis.overallScore}%` }} className="absolute h-full top-0 bg-white/20" transition={{ duration: 1, delay: 0.2 }} />
                  </div>
                  <p className="text-[10px] text-green-400/60 text-right mt-1">*Reflects expected risk reduction from executing the action plan</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Middle Section: Scores Grid */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col gap-6">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#aaa]" />
            Core Diagnostic Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            
            {/* Market Demand */}
            <div className="bg-[#0c0c0c] border border-white/10 p-5 rounded-xl flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#aaa]">Market Demand</h3>
                <span className={`text-lg font-bold ${getScoreColor(scores.marketDemand.score)}`}>{scores.marketDemand.score}</span>
              </div>
              <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${scores.marketDemand.score}%` }} className={`h-full ${getScoreBg(scores.marketDemand.score)}`} transition={{ duration: 1, ease: "easeOut" }} />
              </div>
              <p className="text-xs text-white/60 mt-1">{scores.marketDemand.explanation}</p>
            </div>

            {/* Execution Feasibility */}
            <div className="bg-[#0c0c0c] border border-white/10 p-5 rounded-xl flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#aaa]">Initial Feasibility</h3>
                <span className={`text-lg font-bold ${getScoreColor(scores.executionFeasibility.score)}`}>{scores.executionFeasibility.score}</span>
              </div>
              <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${scores.executionFeasibility.score}%` }} className={`h-full ${getScoreBg(scores.executionFeasibility.score)}`} transition={{ duration: 1, ease: "easeOut" }} />
              </div>
              <p className="text-xs text-white/60 mt-1">{scores.executionFeasibility.explanation}</p>
            </div>

            {/* Differentiation Potential */}
            <div className="bg-[#0c0c0c] border border-white/10 p-5 rounded-xl flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#aaa]">Differentiation</h3>
                <span className={`text-lg font-bold ${getScoreColor(scores.differentiationPotential.score)}`}>{scores.differentiationPotential.score}</span>
              </div>
              <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${scores.differentiationPotential.score}%` }} className={`h-full ${getScoreBg(scores.differentiationPotential.score)}`} transition={{ duration: 1, ease: "easeOut" }} />
              </div>
              <p className="text-xs text-white/60 mt-1">{scores.differentiationPotential.explanation}</p>
            </div>

            {/* Retention Potential */}
            <div className="bg-[#0c0c0c] border border-white/10 p-5 rounded-xl flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#aaa]">Retention Potential</h3>
                <span className={`text-lg font-bold ${getScoreColor(scores.retentionPotential.score)}`}>{scores.retentionPotential.score}</span>
              </div>
              <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${scores.retentionPotential.score}%` }} className={`h-full ${getScoreBg(scores.retentionPotential.score)}`} transition={{ duration: 1, ease: "easeOut" }} />
              </div>
              <p className="text-xs text-white/60 mt-1">{scores.retentionPotential.explanation}</p>
            </div>

            {/* Scalability */}
            <div className="bg-[#0c0c0c] border border-white/10 p-5 rounded-xl flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#aaa]">Scalability</h3>
                <span className={`text-lg font-bold ${getScoreColor(scores.scalability.score)}`}>{scores.scalability.score}</span>
              </div>
              <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${scores.scalability.score}%` }} className={`h-full ${getScoreBg(scores.scalability.score)}`} transition={{ duration: 1, ease: "easeOut" }} />
              </div>
              <p className="text-xs text-white/60 mt-1">{scores.scalability.explanation}</p>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            
            {/* First Revenue Potential */}
            <div className="bg-[#0c0c0c] border border-white/10 p-5 rounded-xl flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-bold text-[#aaa]">1st Revenue Goal</h3>
                <span className="text-xs font-mono uppercase px-2 py-1 bg-white/10 rounded">{scores.firstRevenuePotential.level}</span>
              </div>
              <p className="text-xs text-white/60 mt-1">{scores.firstRevenuePotential.explanation}</p>
            </div>

            {/* Operational Risk */}
            <div className="bg-[#0c0c0c] border border-white/10 p-5 rounded-xl flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-bold text-[#aaa]">Operational Risk</h3>
                <span className="text-xs font-mono uppercase px-2 py-1 bg-white/10 rounded">{scores.operationalRisk.level}</span>
              </div>
              <p className="text-xs text-white/60 mt-1">{scores.operationalRisk.explanation}</p>
            </div>

            {/* Competition Level */}
            <div className="bg-[#0c0c0c] border border-white/10 p-5 rounded-xl flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-bold text-[#aaa]">Competition</h3>
                <span className="text-xs font-mono uppercase px-2 py-1 bg-white/10 rounded">{scores.competitionLevel.level}</span>
              </div>
              <p className="text-xs text-white/60 mt-1">{scores.competitionLevel.explanation}</p>
            </div>
            
          </div>
        </motion.div>

        {/* Psychological Mechanics Section (Hook & Pricing) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Hook Model */}
          <div className="bg-[#0a0a0a] border border-blue-500/20 p-8 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-24 h-24" />
            </div>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-blue-400">
              <Zap className="w-5 h-5" /> Psychological Hook Analysis
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h4 className="text-[10px] uppercase tracking-[2px] text-white/40 mb-1">Trigger</h4>
                <p className="text-sm font-light text-blue-100/80">{analysis.hookAnalysis?.trigger || 'Analysis required.'}</p>
              </div>
              <div>
                <h4 className="text-[10px] uppercase tracking-[2px] text-white/40 mb-1">Action</h4>
                <p className="text-sm font-light text-blue-100/80">{analysis.hookAnalysis?.action || 'Analysis required.'}</p>
              </div>
              <div>
                <h4 className="text-[10px] uppercase tracking-[2px] text-white/40 mb-1">Variable Reward</h4>
                <p className="text-sm font-light text-blue-100/80">{analysis.hookAnalysis?.variableReward || 'Analysis required.'}</p>
              </div>
              <div>
                <h4 className="text-[10px] uppercase tracking-[2px] text-white/40 mb-1">Investment</h4>
                <p className="text-sm font-light text-blue-100/80">{analysis.hookAnalysis?.investment || 'Analysis required.'}</p>
              </div>
            </div>
          </div>

          {/* Pricing/Conversion */}
          <div className="bg-[#0a0a0a] border border-purple-500/20 p-8 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="w-24 h-24" />
            </div>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-purple-400">
              <TrendingUp className="w-5 h-5" /> Conversion & Pricing
            </h2>
            <div className="flex flex-col gap-6">
              <div className="flex gap-4 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
                <div>
                  <h4 className="text-[10px] uppercase tracking-[2px] text-white/40 mb-1">Anchoring Tactic</h4>
                  <p className="text-sm font-light text-purple-100/80">{analysis.conversionStrategy?.anchoring || 'Analyzing...'}</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
                <div>
                  <h4 className="text-[10px] uppercase tracking-[2px] text-white/40 mb-1">Charm Pricing</h4>
                  <p className="text-sm font-light text-purple-100/80">{analysis.conversionStrategy?.charmPricing || 'Analyzing...'}</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
                <div>
                  <h4 className="text-[10px] uppercase tracking-[2px] text-white/40 mb-1">Scarcity & Urgency</h4>
                  <p className="text-sm font-light text-purple-100/80">{analysis.conversionStrategy?.scarcity || 'Analyzing...'}</p>
                </div>
              </div>
            </div>
          </div>

        </motion.div>

        {/* Lower Section: Actionable Insights */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Why it might fail */}
          <div className="md:col-span-1 bg-[#150505] border border-red-500/30 p-6 rounded-xl flex flex-col gap-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertOctagon className="w-5 h-5" />
              <h3 className="text-sm uppercase tracking-[2px] font-bold">Why it might fail</h3>
            </div>
            <ul className="flex flex-col gap-3">
              {analysis.failureReasons.map((reason, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-red-200/90 font-light leading-relaxed">
                  <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-red-500/50" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          {/* User Compatibility & Action Steps */}
          <div className="md:col-span-2 flex flex-col gap-6">
            
            <div className="bg-[#0c0c0c] border border-white/10 p-6 rounded-xl flex flex-col gap-3">
              <div className="flex items-center gap-2 text-[#aaa]">
                <UserCheck className="w-5 h-5" />
                <h3 className="text-sm uppercase tracking-[2px] font-bold">User Compatibility</h3>
              </div>
              <p className="text-sm text-white/80 leading-relaxed font-light">{analysis.userCompatibility}</p>
            </div>

            <div className="bg-[#0c0c0c] border border-white/10 p-6 rounded-xl flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[#aaa]">
                <Play className="w-5 h-5" />
                <h3 className="text-sm uppercase tracking-[2px] font-bold">First Action Steps</h3>
              </div>
              <ul className="flex flex-col gap-3">
                {analysis.firstActionSteps.map((step, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-white/80 font-light leading-relaxed bg-[#111] p-3 rounded">
                    <span className="text-blue-400 font-bold">{idx + 1}.</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            {analysis.executionTimeline && (
              <div className="bg-[#0c0c0c] border border-white/10 p-6 rounded-xl flex flex-col gap-4">
                <div className="flex items-center gap-2 text-[#aaa]">
                  <CalendarDays className="w-5 h-5" />
                  <h3 className="text-sm uppercase tracking-[2px] font-bold">Execution Timeline</h3>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="border border-white/5 bg-[#111] p-4 rounded flex flex-col gap-2 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-5"><Target className="w-16 h-16"/></div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#aaa]">Day 01</span>
                    <p className="text-sm text-white/90 font-light relative z-10">{analysis.executionTimeline.day1}</p>
                  </div>
                  <div className="border border-white/5 bg-[#111] p-4 rounded flex flex-col gap-2 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-5"><Target className="w-16 h-16"/></div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#aaa]">Day 03</span>
                    <p className="text-sm text-white/90 font-light relative z-10">{analysis.executionTimeline.day3}</p>
                  </div>
                  <div className="border border-white/5 bg-[#111] p-4 rounded flex flex-col gap-2 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-5"><Target className="w-16 h-16"/></div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-green-400">Day 07 (First Revenue Goal)</span>
                    <p className="text-sm text-white/90 font-light relative z-10">{analysis.executionTimeline.day7}</p>
                  </div>
                </div>
              </div>
            )}

          </div>

        </motion.div>

      </div>
    </div>
  );
};
