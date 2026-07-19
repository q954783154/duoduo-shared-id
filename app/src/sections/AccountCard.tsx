import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Shield, Clock } from 'lucide-react';
import type { Account } from '@/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AccountCardProps {
  account: Account;
  index: number;
  onCopy: (text: string, type: 'username' | 'password') => Promise<boolean>;
}

function maskAccount(value: string) {
  const [name, domain] = value.split('@');
  const target = domain ? name : value;

  if (target.length <= 4) {
    return domain ? `${target[0] ?? ''}***@${domain}` : `${target[0] ?? ''}***`;
  }

  const visibleStart = Math.min(3, Math.ceil(target.length / 3));
  const visibleEnd = Math.min(3, Math.floor(target.length / 4));
  const masked = `${target.slice(0, visibleStart)}****${target.slice(-visibleEnd)}`;

  return domain ? `${masked}@${domain}` : masked;
}

export function AccountCard({ account, index, onCopy }: AccountCardProps) {
  const [copiedField, setCopiedField] = useState<'username' | 'password' | null>(null);

  const handleCopy = async (text: string, type: 'username' | 'password') => {
    const success = await onCopy(text, type);
    
    if (success) {
      setCopiedField(type);
      toast.success(type === 'username' ? '账号已复制' : '密码已复制', {
        duration: 2000,
        position: 'bottom-center',
      });
      
      setTimeout(() => {
        setCopiedField(null);
      }, 2000);
    } else {
      toast.error('复制失败，请手动复制', {
        duration: 2000,
        position: 'bottom-center',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ 
        y: -4,
        transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }
      }}
      className="apple-card p-6 md:p-8 transition-shadow duration-350 hover:apple-shadow-hover"
    >
      {/* Email Header */}
      <div className="mb-4">
        <h3 className="text-xl md:text-2xl font-semibold text-gray-900 tracking-tight">
          {maskAccount(account.username)}
        </h3>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-3 mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-sm font-medium">
          <Shield className="w-3.5 h-3.5" />
          账号可用
        </span>
        <span className="inline-flex items-center gap-1.5 text-gray-500 text-sm">
          <Clock className="w-3.5 h-3.5" />
          {account.updateTime}更新
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => handleCopy(account.username, 'username')}
          className={`
            flex-1 h-12 rounded-xl font-medium transition-all duration-300
            ${copiedField === 'username' 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-black hover:bg-gray-800'
            }
          `}
        >
          <motion.div
            className="flex items-center justify-center gap-2"
            initial={false}
            animate={{ scale: copiedField === 'username' ? [1, 0.96, 1] : 1 }}
            transition={{ duration: 0.2 }}
          >
            {copiedField === 'username' ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span>{copiedField === 'username' ? '已复制' : '复制账号'}</span>
          </motion.div>
        </Button>

        <Button
          onClick={() => handleCopy(account.password, 'password')}
          className={`
            flex-1 h-12 rounded-xl font-medium transition-all duration-300
            ${copiedField === 'password' 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-black hover:bg-gray-800'
            }
          `}
        >
          <motion.div
            className="flex items-center justify-center gap-2"
            initial={false}
            animate={{ scale: copiedField === 'password' ? [1, 0.96, 1] : 1 }}
            transition={{ duration: 0.2 }}
          >
            {copiedField === 'password' ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span>{copiedField === 'password' ? '已复制' : '复制密码'}</span>
          </motion.div>
        </Button>
      </div>
    </motion.div>
  );
}
