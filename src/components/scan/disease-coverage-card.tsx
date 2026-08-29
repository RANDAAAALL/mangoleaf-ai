import { memo } from "react";
import { translations, type Language } from "@/lib/translations";
import { Icon } from "@/components/brand/icon";

interface DiseaseCoverageCardProps {
  language: Language;
}

type CoverageCategory = "leaf" | "fruit";

export const DiseaseCoverageCard = memo(function DiseaseCoverageCard({
  language,
}: DiseaseCoverageCardProps) {
  const t = translations[language];
  const contentLang = language === "en" ? "en" : "ceb";
  const categories: Array<{
    category: CoverageCategory;
    label: string;
    diseases: string[];
  }> = [
    {
      category: "leaf",
      label: t.leafDiseasesLabel,
      diseases: [
        t.diseaseAnthracnose,
        t.diseaseBacterialCanker,
        t.diseaseSootyMold,
      ],
    },
    {
      category: "fruit",
      label: t.fruitDiseasesLabel,
      diseases: [t.diseaseBacterialBlackSpot, t.diseaseMangoScab],
    },
  ];

  return (
    <section
      lang={contentLang}
      className="mb-6 rounded-3xl border border-[#cfe2c8] bg-[#edf6e9] p-5 sm:p-6"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <h4 className="text-base text-center sm:text-left font-bold tracking-tight text-[#143519]">
            {t.detectableTitle}
          </h4>
          <p className="mt-1 text-justify sm:text-start text-xs leading-5 text-[#526856]">
            {t.detectableDesc}
          </p>
        </div>
      </header>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 sm:gap-10">
        {categories.map((item) => (
          <div key={item.category} aria-label={item.label}>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#277839] text-white">
                <Icon name={item.category} size={20} strokeWidth={2} />
              </span>
              <h5 className="text-sm font-bold text-[#143519]">{item.label}</h5>
            </div>
            <ul className="mt-4 flex flex-col gap-2.5">
              {item.diseases.map((disease) => (
                <li
                  key={disease}
                  className="flex items-center gap-2.5 text-xs font-medium text-[#3b523f]"
                >
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#7a9b7e]"
                  />
                  {disease}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-start sm:items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#277839] text-white">
          <Icon name="check" size={16} strokeWidth={2.5} />
        </span>
        <p className="leading-5 text-[#526856]">
          <span className="text-sm font-bold text-[#143519]">
            {t.healthyLabel}
          </span>{" "}
          <span className="text-xs">{t.healthyDesc}</span>
        </p>
      </div>
    </section>
  );
});
