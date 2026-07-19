import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LockKeyhole, RefreshCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ACCESS_STORAGE_KEY } from '@/lib/accessGuard';

const ATTEMPT_STORAGE_KEY = 'id_access_attempt_state';
const ACCESS_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 60 * 1000;

type Challenge = {
  question: string;
  answer: number;
};

type AttemptState = {
  count: number;
  lockedUntil: number;
};

function readAttemptState(): AttemptState {
  try {
    const raw = window.localStorage.getItem(ATTEMPT_STORAGE_KEY);
    if (!raw) {
      return { count: 0, lockedUntil: 0 };
    }

    const parsed = JSON.parse(raw) as Partial<AttemptState>;
    return {
      count: Number.isFinite(parsed.count) ? Number(parsed.count) : 0,
      lockedUntil: Number.isFinite(parsed.lockedUntil) ? Number(parsed.lockedUntil) : 0,
    };
  } catch {
    return { count: 0, lockedUntil: 0 };
  }
}

function writeAttemptState(state: AttemptState) {
  window.localStorage.setItem(ATTEMPT_STORAGE_KEY, JSON.stringify(state));
}

function createChallenge(): Challenge {
  const left = Math.floor(Math.random() * 8) + 3;
  const right = Math.floor(Math.random() * 7) + 2;

  if (Math.random() > 0.5) {
    return {
      question: `${left} + ${right}`,
      answer: left + right,
    };
  }

  return {
    question: `${left + right} - ${right}`,
    answer: left,
  };
}

interface AccessGateProps {
  onVerified: () => void;
}

export function AccessGate({ onVerified }: AccessGateProps) {
  const [challenge, setChallenge] = useState(() => createChallenge());
  const [answer, setAnswer] = useState('');
  const [attemptState, setAttemptState] = useState(() => readAttemptState());
  const [now, setNow] = useState(() => Date.now());

  const lockSeconds = Math.max(0, Math.ceil((attemptState.lockedUntil - now) / 1000));
  const isLocked = lockSeconds > 0;

  const attemptsLeft = useMemo(
    () => Math.max(0, MAX_ATTEMPTS - attemptState.count),
    [attemptState.count],
  );

  useEffect(() => {
    if (!isLocked) {
      return;
    }

    const timer = window.setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);

      if (currentTime >= attemptState.lockedUntil) {
        const unlockedState = { count: 0, lockedUntil: 0 };
        setAttemptState(unlockedState);
        writeAttemptState(unlockedState);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [attemptState.lockedUntil, isLocked]);

  useEffect(() => {
    if (isLocked || attemptState.count === 0) {
      return;
    }

    writeAttemptState(attemptState);
  }, [attemptState, isLocked]);

  const rotateChallenge = useCallback(() => {
    setChallenge(createChallenge());
    setAnswer('');
  }, []);

  const verifyAccess = useCallback(() => {
    if (isLocked) {
      return;
    }

    const numericAnswer = Number(answer.trim());
    if (Number.isFinite(numericAnswer) && numericAnswer === challenge.answer) {
      window.localStorage.setItem(ACCESS_STORAGE_KEY, String(Date.now() + ACCESS_TTL_MS));
      window.localStorage.removeItem(ATTEMPT_STORAGE_KEY);
      toast.success('验证通过');
      onVerified();
      return;
    }

    const nextCount = attemptState.count + 1;
    const nextState =
      nextCount >= MAX_ATTEMPTS
        ? { count: 0, lockedUntil: Date.now() + LOCKOUT_MS }
        : { count: nextCount, lockedUntil: 0 };

    setAttemptState(nextState);
    writeAttemptState(nextState);
    rotateChallenge();
    toast.error(nextState.lockedUntil > 0 ? '尝试过于频繁，请稍后再试' : '答案不正确');
  }, [answer, attemptState.count, challenge.answer, isLocked, onVerified, rotateChallenge]);

  return (
    <main className="min-h-screen bg-white px-4 py-10 sm:px-6">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto flex min-h-[calc(100svh-5rem)] max-w-md flex-col justify-center"
      >
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-950">访问验证</h1>
            <p className="text-sm text-gray-500">通过后进入账号页面</p>
          </div>
        </div>

        <div className="apple-card rounded-2xl p-6">
          <div className="mb-5 flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100">
              <LockKeyhole className="h-4 w-4 text-gray-700" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-950">请完成问题验证</h2>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                为减少频繁访问，请先回答下面的简单问题。
              </p>
            </div>
          </div>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              verifyAccess();
            }}
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="access-answer">
                {challenge.question} = ?
              </label>
              <Input
                id="access-answer"
                inputMode="numeric"
                autoComplete="off"
                value={answer}
                disabled={isLocked}
                onChange={(event) => setAnswer(event.target.value)}
                className="h-11 rounded-xl text-base"
                placeholder={isLocked ? `冷却中 ${lockSeconds} 秒` : '输入答案'}
              />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" className="h-11 flex-1 rounded-xl" disabled={isLocked || !answer.trim()}>
                {isLocked ? `请等待 ${lockSeconds} 秒` : '进入网站'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl"
                onClick={rotateChallenge}
                disabled={isLocked}
                aria-label="更换问题"
                title="更换问题"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </form>

          {!isLocked && attemptState.count > 0 && (
            <p className="mt-4 text-xs text-gray-500">剩余尝试次数：{attemptsLeft}</p>
          )}
        </div>
      </motion.section>
    </main>
  );
}
