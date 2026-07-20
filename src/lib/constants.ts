import { type DiseaseGuideline } from "./db";

// The 6 standard Carabao Mango classes in alphabetical order matching Keras exports
export const CLASSES = [
  "Anthracnose",
  "Bacterial Black Spot",
  "Bacterial Canker",
  "Healthy",
  "Mango Scab",
  "Sooty Mold"
];

// Fallback guidelines based on BAFS standard pre-treatment rules
export const FALLBACK_GUIDELINES: Record<string, { en: string; bis: string; color: DiseaseGuideline["color"] }> = {
  "anthracnose": {
    en: "Clean orchard layout. Prune dead branches to improve airflow. Apply copper-based fungicides during flowering and early fruit stages. Avoid overhead irrigation.",
    bis: "Limpyohan ang uma. Putlon ang mga patay nga sanga aron mosulod ang hangin ug kahayag. Pag-spray og copper-based fungicide sa pagpamulak ug paglinghod sa prutas. Likayi ang overhead irrigation.",
    color: "yellow",
  },
  "sooty_mold": {
    en: "Mold grows on insect honeydew. Control sap-sucking pests (leafhoppers, mealybugs) by spraying neem oil or soap solutions. Prune canopy to reduce humidity.",
    bis: "Ang agup-op nagatubo tungod sa hugaw sa insekto. Kontrola ang mga peste (leafhoppers, bugot) pinaagi sa pag-spray og neem oil o sabon. Putlon ang mga sanga aron dili kaayo umog.",
    color: "purple",
  },
  "bacterial_canker": {
    en: "Bacterial leaves caking. Prune and burn infected shoots immediately. Apply copper hydroxide sprays during rainy seasons. Disinfect pruning tools with bleach.",
    bis: "Sakit sa dahon tungod sa bakterya. Putlon ug sunugon dayon ang mga naapektuhang sanga. Mag-spray og copper hydroxide panahon sa ting-ulan. Limpyohan ang mga gamit gamit ang bleach.",
    color: "pink",
  },
  "bacterial_black_spot": {
    en: "Bacterial fruit skin spots. Avoid picking fruit during wet weather. Remove infected green fruit from trees to check spread. Windbreaks help minimize disease entry.",
    bis: "Itom nga kabahong sa prutas. Likayi ang pag-ani kung basa ang panahon. Kuhaa ang mga natakdan nga prutas aron dili makatabok sa uban. Ang mga Windbreaker makapugong sa sakit.",
    color: "pink",
  },
  "mango_scab": {
    en: "Corky scab spots on green fruit. Spray copper fungicides or benomyl at bud break and early bloom. Clean up and burn leaf debris beneath trees.",
    bis: "Garot o ulat sa linghod nga prutas. Mag-spray og copper fungicides o benomyl samtang gamay pa ang bulak. Hipuson ug sunugon ang mga nangahulog nga dahon sa ilalom sa kahoy.",
    color: "blue",
  },
  "healthy": {
    en: "Excellent! The mango tissue displays normal pigmentation and morphology. Maintain regular watering, balanced NPK fertilization, and monitor insect counts.",
    bis: "Maayo kaayo! Himsog ang dahon ug prutas sa mangga. Padayona ang ensaktong pagbisbis, pag-abono og NPK, ug bantayan kanunay ang mga insekto.",
    color: "green",
  },
};
