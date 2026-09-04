import { Fragment, memo } from "react";
import { Icon, type IconName } from "@/components/brand/icon";
import { translations, type Language } from "@/lib/translations";

interface HowItWorksStepsProps {
  language: Language;
}

const STEP_STYLES: {
  border?: string;
  bg: string;
  text: string;
  numBg: string;
  icon: IconName;
}[] = [
  { border: "border border-[#cfe2c8]", bg: "bg-[#edf6e9]", text: "text-[#143519]", numBg: "bg-[#277839]", icon: "camera-outline" },
  { border: "border border-[#cfe2c8]", bg: "bg-[#edf6e9]", text: "text-[#143519]", numBg: "bg-[#277839]", icon: "sparkle" },
  { border: "border border-[#cfe2c8]", bg: "bg-[#edf6e9]", text: "text-[#143519]", numBg: "bg-[#277839]", icon: "clipboard-check" },
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
      <div className="flex flex-col sm:flex-row sm:items-stretch gap-1 sm:gap-2">
        {steps.map((step, i) => {
          const style = STEP_STYLES[i];
          return (
            <Fragment key={step.title}>
              {i > 0 && (
                <div
                  className="flex justify-center items-center shrink-0 py-0.5 sm:py-0 sm:px-0.5"
                  aria-hidden="true"
                >
                  <Icon
                    name="arrow-right"
                    size={24}
                    strokeWidth={2.25}
                    className="text-[#296b11] shrink-0 rotate-90 sm:rotate-0"
                  />
                </div>
              )}
              <div
                className={`${style.border} ${style.bg} ${style.text} p-4 rounded-2xl shadow-sm flex items-start gap-3.5 flex-1 min-w-0`}
              >
                {/* Step number badge */}
                <div
                  className={`${style.numBg} w-8 h-8 text-white/90 rounded-full flex items-center justify-center shrink-0 font-bold text-sm`}
                >
                  {i + 1}
                </div>

                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon name={style.icon} size={28} strokeWidth={1.8} />
                    <span className="font-bold text-sm">{step.title}</span>
                  </div>
                  <p
                    lang={contentLang}
                    className="text-[#223d27] text-xs leading-relaxed opacity-90"
                  >
                    {step.desc}
                  </p>
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>
    </section>
  );
});
