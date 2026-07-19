import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { useAccounts } from '@/hooks/useAccounts';
import { hasValidAccess } from '@/lib/accessGuard';
import { LoadingScreen } from '@/sections/LoadingScreen';
import { AccessGate } from '@/sections/AccessGate';
import { Header } from '@/sections/Header';
import { NoticeBanner } from '@/sections/NoticeBanner';
import { AccountCard } from '@/sections/AccountCard';
import { Footer } from '@/sections/Footer';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';
import './App.css';

function App() {
  const [hasAccess, setHasAccess] = useState(() => hasValidAccess());
  const { accounts, loading, error, refreshCooldownSeconds, copyToClipboard, refreshAccounts } =
    useAccounts(hasAccess);

  return (
    <div className="min-h-screen bg-white">
      {/* Toast notifications */}
      <Toaster 
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 20px',
          },
        }}
      />

      {!hasAccess && <AccessGate onVerified={() => setHasAccess(true)} />}

      {/* Loading Screen */}
      {hasAccess && <LoadingScreen progress={loading.progress} isComplete={loading.isComplete} />}

      {/* Main Content */}
      <AnimatePresence>
        {hasAccess && loading.isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Header />

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Notice Banner */}
              <NoticeBanner />

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="apple-card p-6 mb-6 bg-red-50 border-red-100"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-red-900 mb-1">
                        账号正在更新
                      </h3>
                      <p className="text-sm text-red-700 mb-3">
                        {error}
                      </p>
                      <Button
                        onClick={refreshAccounts}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={refreshCooldownSeconds > 0}
                      >
                        <RefreshCw className="w-4 h-4" />
                        {refreshCooldownSeconds > 0 ? `${refreshCooldownSeconds} 秒后重试` : '重新加载'}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Account Cards */}
              {!error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      可用账号 ({accounts.length})
                    </h2>
                    <Button
                      onClick={refreshAccounts}
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-gray-500 hover:text-gray-900"
                      disabled={refreshCooldownSeconds > 0}
                    >
                      <RefreshCw className="w-4 h-4" />
                      {refreshCooldownSeconds > 0 ? `${refreshCooldownSeconds} 秒` : '刷新'}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {accounts.map((account, index) => (
                      <AccountCard
                        key={account.id}
                        account={account}
                        index={index}
                        onCopy={copyToClipboard}
                      />
                    ))}
                  </div>

                  {accounts.length === 0 && !error && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="apple-card p-12 text-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">😔</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        暂无可用账号
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        请稍后再来查看，我们会定期更新账号
                      </p>
                      <Button
                        onClick={refreshAccounts}
                        variant="outline"
                        disabled={refreshCooldownSeconds > 0}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {refreshCooldownSeconds > 0 ? `${refreshCooldownSeconds} 秒后重试` : '重新加载'}
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </main>

            <Footer />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
