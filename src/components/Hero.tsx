import React from 'react';
import { motion } from 'motion/react';
import { Chat } from './Chat';

export function Hero({ onGetStarted }: { onGetStarted?: () => void }) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 bg-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center z-10 mb-8"
      >
        <h1 className="text-4xl md:text-5xl font-semibold text-text-main tracking-tight">
          Where should we begin?
        </h1>
      </motion.div>

      <Chat />

      <div className="flex flex-wrap justify-center gap-2 mt-8 z-10">
        <button 
          onClick={onGetStarted}
          className="px-4 py-2 rounded-full bg-surface-2 border border-border-subtle text-[0.85rem] text-text-muted hover:text-text-main hover:bg-surface-3 transition-all"
        >
          Get Started with Swahivo
        </button>
        <button 
          onClick={onGetStarted}
          className="px-4 py-2 rounded-full bg-surface-2 border border-border-subtle text-[0.85rem] text-text-muted hover:text-text-main hover:bg-surface-3 transition-all"
        >
          Explore NoteFlow
        </button>
      </div>
    </section>
  );
}
