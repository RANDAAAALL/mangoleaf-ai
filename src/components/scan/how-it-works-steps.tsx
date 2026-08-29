import { memo } from "react";
import { translations, type Language } from "@/lib/translations";

interface HowItWorksStepsProps {
  language: Language;
}

/** Camera viewfinder icon for Step 1. */
function CameraStepIcon() {
  return (
    <svg
      className="w-7 h-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

/** Sparkle/AI icon for Step 2. */
function AIStepIcon() {
  return (
    <svg
      className="w-7 h-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** Clipboard/results icon for Step 3. */
function ResultsStepIcon() {
  return (
    <svg
      className="w-7 h-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}

const STEP_STYLES = [
  { bg: "bg-[#277839]", text: "text-white", numBg: "bg-white/20", icon: CameraStepIcon },
  { bg: "bg-[#f59e2b]", text: "text-[#2c1806]", numBg: "bg-black/10", icon: AIStepIcon },
  { bg: "bg-[#2563eb]", text: "text-white", numBg: "bg-white/20", icon: ResultsStepIcon },
];

export const HowItWorksSteps = memo(function HowItWorksSteps({
  language,
}: HowItWorksStepsProps) {
  const t = translations[language];
  const contentLang = language === "en" ? "en" : "ceb";

  const steps = [
    { title: t.howStep1Title, desc: t.howStep1Desc },
    { title: t.howStep2Title, desc: t.howStep2Desc },
    { title: t.howStep3Title, desc: t.howStep3Desc },
  ];

  return (
    <section className="mb-6">
      <h3 className="text-xl sm:text-2xl text-center sm:text-left font-bold text-[#143519] mb-3.5">
        {t.HowItWorksTitle}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {steps.map((step, i) => {
          const style = STEP_STYLES[i];
          const StepIcon = style.icon;
          return (
            <div
              key={i}
              className={`${style.bg} ${style.text} p-4 rounded-2xl shadow-sm flex items-start gap-3`}
            >
              {/* Step number badge */}
              <div
                className={`${style.numBg} w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black text-sm`}
              >
                {i + 1}
              </div>

              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <StepIcon />
                  <span className="font-bold text-sm">{step.title}</span>
                </div>
                <p
                  lang={contentLang}
                  className="text-xs leading-relaxed opacity-90"
                >
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
});
