import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, CircleCheck } from 'lucide-react';
import { LESSON_SECTIONS } from './content';
import YouTubeSection from './YouTubeSection';

interface OnboardingFlowProps {
  /** Called once the player taps "Let's get started" on the final screen. */
  onComplete: () => void;
}

const TOTAL_STEPS = LESSON_SECTIONS.length + 2; // welcome + lessons + complete
const WELCOME_STEP = 0;
const COMPLETE_STEP = TOTAL_STEPS - 1;

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(WELCOME_STEP);

  const goNext = () => setStep((s) => Math.min(s + 1, COMPLETE_STEP));
  const goBack = () => setStep((s) => Math.max(s - 1, WELCOME_STEP));

  const isLesson = step > WELCOME_STEP && step < COMPLETE_STEP;
  const lesson = isLesson ? LESSON_SECTIONS[step - 1] : null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ── Top bar: back button + progress dots (lesson steps only) ── */}
      {isLesson && (
        <div className="flex items-center gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
          <button
            onClick={goBack}
            className="p-2 -ml-2 text-slate-400 hover:text-slate-700 rounded-full transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center gap-1.5">
            {LESSON_SECTIONS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= step - 1 ? 'bg-lime-500' : 'bg-slate-100'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Step content ── */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-6">
        <AnimatePresence mode="wait">
          {step === WELCOME_STEP && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center text-center gap-3"
            >
              <div className="w-16 h-16 rounded-3xl bg-lime-400 flex items-center justify-center text-3xl mb-2 shadow-sm">
                🏓
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Welcome to Pickle Coach
              </h1>
              <p className="text-sm text-slate-500 max-w-[280px]">
                Let&apos;s make you a pickleball pro.
              </p>
            </motion.div>
          )}

          {lesson && (
            <motion.div
              key={`lesson-${step}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              <div>
                <p className="text-xs font-semibold text-lime-600 uppercase tracking-widest mb-1">
                  {step} of {LESSON_SECTIONS.length}
                </p>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {lesson.title}
                </h2>
                <p className="text-sm text-slate-500 mt-1">{lesson.description}</p>
              </div>
              <YouTubeSection section={lesson} />
            </motion.div>
          )}

          {step === COMPLETE_STEP && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center text-center gap-3"
            >
              <CircleCheck className="w-16 h-16 text-lime-500" strokeWidth={1.5} />
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">You&apos;re ready</h1>
              <p className="text-sm text-slate-500 max-w-[280px]">
                Point your camera at the court and Pickle Coach will start watching.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom action ── */}
      <div className="px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <button
          onClick={step === COMPLETE_STEP ? onComplete : goNext}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm"
        >
          {step === WELCOME_STEP
            ? 'Next'
            : step === COMPLETE_STEP
              ? "Let's get started"
              : 'Next'}
        </button>
      </div>
    </div>
  );
}
