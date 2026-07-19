import { motion } from 'framer-motion';
import { Info } from 'lucide-react';

export function NoticeBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="mb-8"
    >
      <div className="apple-card p-5 bg-gray-50/50">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <Info className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              使用提示
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              共享账号随时会失效，如果无可用账号，请过几小时重新查看页面
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
