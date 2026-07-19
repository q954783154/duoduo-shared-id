import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';

export function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-gray-100"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                多多共享id
              </h1>
            </div>
          </motion.div>

          {/* Subtitle */}
          <div className="hidden sm:block">
            <p className="text-sm text-gray-500">
              小火箭（Shadowrocket）美区共享ID
            </p>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
