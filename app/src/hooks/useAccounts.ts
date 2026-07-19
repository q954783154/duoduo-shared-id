import { useState, useEffect, useCallback } from 'react';
import type { Account, LoadingState } from '@/types';

interface AccountsResponse {
  accounts: Account[];
  count: number;
  lastUpdate: number;
}

const AUTO_REFRESH_INTERVAL_MS = 30 * 60 * 1000;
const MANUAL_REFRESH_COOLDOWN_MS = 20 * 1000;
const FRIENDLY_FETCH_ERROR = '账号正在自动更新中，请稍后再试。如果页面已有账号，可以先继续使用当前显示的数据。';

export function useAccounts(enabled = true) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    progress: 0,
    isComplete: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [nextManualRefreshAt, setNextManualRefreshAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  // 获取账号数据
  const fetchAccounts = useCallback(async (endpoint = '/api/accounts', showLoading = true) => {
    try {
      if (showLoading) {
        setLoading({ progress: 10, isComplete: false });
      }
      setError(null);

      const response = await fetch(endpoint, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (showLoading) {
        setLoading({ progress: 65, isComplete: false });
      }

      if (!response.ok) {
        throw new Error(FRIENDLY_FETCH_ERROR);
      }

      const data = (await response.json()) as AccountsResponse & { error?: string };

      if ('error' in data && data.error) {
        throw new Error(FRIENDLY_FETCH_ERROR);
      }

      if (!Array.isArray(data.accounts) || data.accounts.length === 0) {
        throw new Error('账号正在整理中，请稍后刷新页面。');
      }

      setAccounts(data.accounts);
      setLoading({ progress: 100, isComplete: true });
    } catch (err) {
      if (showLoading) {
        setError(err instanceof Error ? err.message : FRIENDLY_FETCH_ERROR);
        setLoading({ progress: 100, isComplete: true });
      }
    }
  }, []);

  // 初始加载
  useEffect(() => {
    if (!enabled) {
      return;
    }

    fetchAccounts();
  }, [enabled, fetchAccounts]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void fetchAccounts('/api/refresh', false);
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [enabled, fetchAccounts]);

  useEffect(() => {
    if (nextManualRefreshAt <= now) {
      return;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [nextManualRefreshAt, now]);

  // 复制到剪贴板
  const copyToClipboard = useCallback(async (text: string, _type: 'username' | 'password') => {
    void _type;

    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      } catch {
        document.body.removeChild(textArea);
        return false;
      }
    }
  }, []);

  // 刷新账号数据
  const refreshAccounts = useCallback(async () => {
    const currentTime = Date.now();
    if (currentTime < nextManualRefreshAt) {
      setError(`刷新过于频繁，请 ${Math.ceil((nextManualRefreshAt - currentTime) / 1000)} 秒后再试。`);
      return;
    }

    setNextManualRefreshAt(currentTime + MANUAL_REFRESH_COOLDOWN_MS);
    setNow(currentTime);
    setLoading({ progress: 0, isComplete: false });
    await fetchAccounts('/api/refresh');
  }, [fetchAccounts, nextManualRefreshAt]);

  return {
    accounts,
    loading,
    error,
    refreshCooldownSeconds: Math.max(0, Math.ceil((nextManualRefreshAt - now) / 1000)),
    copyToClipboard,
    refreshAccounts,
  };
}
