import React from 'react';
import { motion } from 'motion/react';
import { Chat } from './Chat';

export function Hero({ onGetStarted }: { onGetStarted?: () => void }) {
  return (
    <section className="relative w-full flex flex-col items-center justify-center px-6 py-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center z-10 mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-medium text-text-main tracking-tight">
          Your AI Automation Hub
        </h1>
      </motion.div>

      <Chat />
    </section>
  );
}
