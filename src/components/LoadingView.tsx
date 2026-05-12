import { motion, AnimatePresence } from "motion/react";
import { HeroParticles } from "./HeroParticles";
import { useState, useEffect } from "react";

const loadingMessages = [
  "Analyzing Concept Data...",
  "Running Feasibility Checks...",
  "Evaluating Market Fit...",
  "Formulating Execution Strategy...",
  "Finalizing Blueprint..."
];

export function LoadingView({ idea }: { idea: string }) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden pointer-events-none">
      {/* Text entering smoothly */}
      <motion.div 
        initial={{ x: '-40vw', scale: 0.8, opacity: 0, filter: 'blur(10px)' }}
        animate={{ x: 0, scale: 1, opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 p-8 text-center max-w-4xl"
      >
        <motion.h2 
          className="text-3xl md:text-5xl font-light text-white mb-16 leading-relaxed bg-clip-text"
        >
          {idea}
        </motion.h2>
        
        {/* Loading Indicator */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="w-10 h-10 border-[3px] border-white/10 border-t-white rounded-full animate-[spin_1s_linear_infinite]"></div>
          
          <div className="h-4 relative overflow-hidden flex items-center justify-center w-full">
            <AnimatePresence mode="wait">
              <motion.p 
                key={messageIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="tracking-[0.2em] text-white/50 uppercase text-xs font-bold absolute whitespace-nowrap"
              >
                {loadingMessages[messageIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
