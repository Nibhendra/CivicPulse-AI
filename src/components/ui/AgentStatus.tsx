import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { label: 'Reading image', description: 'Fetching issue image from Cloudinary…' },
  { label: 'Understanding civic issue', description: 'Analysing issue type and description…' },
  { label: 'Checking severity', description: 'Scoring damage severity and urgency…' },
  { label: 'Finding department', description: 'Assigning responsible municipal department…' },
  { label: 'Checking duplicates', description: 'Scanning nearby reported issues…' },
  { label: 'Drafting complaint', description: 'Writing formal complaint letter…' },
  { label: 'Saving AI results', description: 'Persisting analysis to Firestore…' },
];

/** Step interval timing: advance one step every N ms during API call */
const STEP_INTERVAL_MS = 1600;

interface AgentStatusProps {
  /** Signals the API call has finished (success or error). */
  isComplete: boolean;
  /** If set, shows an error state on the last step. */
  error?: string | null;
}

export function AgentStatus({ isComplete, error }: AgentStatusProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isComplete) {
      // Jump to final step to show completion
      setCurrentStep(STEPS.length - 1);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        // Stop advancing at second-to-last step; last step completes when API returns
        if (prev >= STEPS.length - 2) return prev;
        return prev + 1;
      });
    }, STEP_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isComplete]);

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm animate-fade-in">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/25">
          {error ? (
            <XCircle className="h-5 w-5 text-white" />
          ) : isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-white" />
          ) : (
            <Loader2 className="h-5 w-5 text-white animate-spin" />
          )}
        </div>
        <div>
          <p className="font-semibold text-sm">
            {error ? 'Analysis Failed' : isComplete ? 'Analysis Complete' : 'Civic Rescue Agent Running…'}
          </p>
          <p className="text-xs text-muted-foreground">
            {error ? 'See error below' : isComplete ? 'Results saved to Firestore' : 'Powered by Gemini 2.5 Flash'}
          </p>
        </div>
      </div>

      {/* Steps */}
      <ol className="space-y-3">
        {STEPS.map((step, idx) => {
          const done = isComplete ? true : idx < currentStep;
          const active = !isComplete && idx === currentStep;
          const isErrorStep = error && idx === currentStep;

          return (
            <li key={step.label} className="flex items-start gap-3">
              {/* Icon */}
              <div className="mt-0.5 shrink-0">
                {done && !error ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                ) : isErrorStep ? (
                  <XCircle className="h-4.5 w-4.5 text-destructive" />
                ) : active ? (
                  <Loader2 className="h-4.5 w-4.5 text-primary animate-spin" />
                ) : (
                  <div className="h-4.5 w-4.5 rounded-full border-2 border-border" />
                )}
              </div>

              {/* Label */}
              <div className="min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium leading-tight',
                    done && !error ? 'text-foreground' :
                    isErrorStep ? 'text-destructive' :
                    active ? 'text-primary' :
                    'text-muted-foreground'
                  )}
                >
                  {step.label}
                </p>
                {active && !error && (
                  <p className="text-xs text-muted-foreground mt-0.5 animate-fade-in">
                    {step.description}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {error && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-xs font-medium text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
