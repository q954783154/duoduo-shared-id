import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  progress: number;
  isComplete: boolean;
}

const loadingTips = [
  '提示：请勿在设置中登录共享账号',
  '提示：仅在 App Store 中登录使用',
  '提示：下载完成后请及时退出账号',
  '提示：不要开启双重认证或修改密码',
  '提示：账号失效时请稍后刷新页面',
];

export function LoadingScreen({ progress, isComplete }: LoadingScreenProps) {
  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mb-12"
          >
            <h1 className="text-4xl font-bold tracking-tight text-black">
              多多共享id
            </h1>
          </motion.div>

          {/* Progress Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mb-4"
          >
            <span className="text-sm font-medium text-gray-500">
              加载中 {progress}%
            </span>
          </motion.div>

          {/* Progress Bar */}
          <div className="w-48 h-1 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-black rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{
                duration: 0.1,
                ease: 'linear',
              }}
            />
          </div>

          <div className="mt-8 h-7 w-[min(86vw,360px)] overflow-hidden text-center">
            <motion.div
              animate={{ y: ['0%', '-50%'] }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              {[...loadingTips, ...loadingTips].map((tip, index) => (
                <p
                  key={`${tip}-${index}`}
                  className="h-7 text-sm font-medium leading-7 text-gray-500"
                >
                  {tip}
                </p>
              ))}
            </motion.div>
          </div>

          {/* Subtle pulse animation */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              opacity: [0, 0.02, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              background: 'radial-gradient(circle at center, rgba(0,0,0,0.1) 0%, transparent 70%)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
