// Label for the model assets in public/model/. Bump it whenever those files are
// replaced by a retraining cycle. See docs/MODEL_VERSIONING.md.
// Trial 3: deduplicated pool, temperature-calibrated, exported at float32. The
// WebGL backend uploads the weights into half-float textures anyway, so the
// bigger download buys no accuracy on phones, and costs nothing on WASM.
export const modelVersion = "v3.0.0";

// The 6 Carabao Mango classes, in alphabetical order because that is the order
// the Keras export used. CLASSES[i] must name the class the model scores at
// output position i, so reordering this array would mislabel every prediction.
export const CLASSES = [
  "Anthracnose",
  "Bacterial Black Spot",
  "Bacterial Canker",
  "Healthy",
  "Mango Scab",
  "Sooty Mold"
];

// Written into ScanRecord.disease_name when a scan fails any of the three
// rejection gates in classifier.ts: confidence, margin, or entropy. It is not a
// class, so any UI that expects a real prediction must check for it first.
export const UNCERTAIN_LABEL = "Uncertain / Unrecognized";

// Verified treatment guidelines based on BAFS GAP (PNS/BAFPS 45:2009) [19], Dofuor et al. (2023) [6], Sossah et al. (2024) [7], and Pham et al. (2025) [8]
// Supabase public.guidelines is the source of truth for the bundled offline fallback.
export const FALLBACK_GUIDELINES: Record<string, { en: string; bis: string }> = {
  "anthracnose": {
    en: "1. Chemical Control: Apply registered contact fungicides (copper oxychloride, mancozeb) on emerging leaf\r\n  flushes during rainy days. Spray protectant or systemic fungicides at 31–35 and 43–109 DAFI to protect flowers and\r\n  fruit. Do not use systemic fungicides alone on flushes.\r\n\r\n    2. Cultural Management: Prune after harvest to improve light and airflow. Collect and burn fallen leaves, dead\r\n  twigs, and trash. Bag fruits using appropriate materials. Do not intercrop mangoes with papaya or cacao.\r\n\r\n    3. Post-Harvest: Subject newly harvested fruits to Hot Water Treatment (HWT) at 52–55°C for 10 minutes within 24\r\n  hours of harvest.",
    bis: "1. Tambal (Kemikal): Mag-spray og rehistradong contact fungicide (copper oxychloride, mancozeb) sa bag-ong tubo\r\n  nga dahon panahon sa ting-ulan. Mag-spray og protectant o systemic fungicide sa 31–35 ug 43–109 DAFI aron\r\n  mapanalipdan ang bulak ug prutas. Ayaw gamita ang systemic fungicide nga mag-inusara sa bag-ong tubo.\r\n\r\n    2. Kultural nga Pagdumala: Putlon ang mga sanga human sa ani aron mosulod ang kahayag ug hangin. Hipusa ug sunuga\r\n  ang mga nangahulog nga dahon ug patay nga sanga. Bag-a ang mga prutas. Ayaw itanom ang mangga duol sa papaya o cacao.\r\n\r\n    3. Pagkahuman sa Ani: Ituslob ang bag-ong giani nga prutas sa init nga tubig (52–55°C) sulod sa 10 minutos sulod\r\n  sa 24 oras pagkahuman sa ani.",
  },
  "sooty_mold": {
    en: "1. Insect Control (Primary Strategy): Sooty mold grows on honeydew excreted by sap-sucking insects (leafhoppers,\r\n  scales, mealybugs). Eradicate or manage honeydew-producing insects using registered insecticides. Neem oil or\r\n  insecticidal soap solutions may be used as organic alternatives.\r\n\r\n    2. Cultural Management: Prune dense canopy branches to increase airflow and reduce humidity. Bag clean fruits with\r\n  appropriate bagging materials. Remove heavily affected branches and leaves.",
    bis: "1. Kontrol sa Insekto (Pinaka-Importante): Ang sooty mold nagatubo sa lagkit nga hugaw (honeydew) gikan sa mga\r\n  insekto (leafhopper, scale, mealybug). Kontrola ang mga insekto pinaagi sa rehistradong insecticide. Ang neem oil o\r\n  sabon nga pang-insekto mahimong gamiton isip organic nga alternatibo.\r\n\r\n    2. Kultural nga Pagdumala: Putlon ang daghan-daghan nga mga sanga aron mosulod ang hangin ug maminusan ang kahum-\r\n  ok. Bag-a ang mga limpyo nga prutas. Kuhaa ang mga sanga ug dahon nga grabe og apekto.",
  },
  "bacterial_canker": {
    en: "1. Management: Caused by Xanthomonas citri pv. mangiferaeindicae. Chemical control is usually ineffective;\r\n  copper sprays (copper oxychloride, copper hydroxide) can reduce surface inoculum but have no curative action.\r\n\r\n    2. Cultural Control (Primary Strategy): Use certified disease-free planting materials. Sanitize all harvesting and\r\n  pruning tools to prevent mechanical transmission. Remove and eliminate diseased branches and trees. Implement\r\n  windbreaks to reduce wind-driven rain. Monitor leaves regularly as early warnings for fruit infection.",
    bis: "1. Pagdumala: Gipahinabo sa Xanthomonas citri pv. mangiferaeindicae. Ang kemikal nga tambal kasagaran dili\r\n  kaayo epektibo; ang copper sprays (copper oxychloride, copper hydroxide) makamenos sa surface inoculum apan walay\r\n  curative nga aksyon.\r\n\r\n    2. Kultural nga Kontrol (Pinaka-Importante): Gamita ang certified nga limpyo sa sakit nga mga pananom. Limpyohan\r\n  ang tanang gamit sa pag-ani ug pagputol. Kuhaa ug patya ang mga natakdan nga sanga ug kahoy. Magtanum og windbreak\r\n  aron mamenosan ang ulan ug hangin. Bantayi kanunay ang dahon isip sayo nga pasidaan sa bunga.",
  },
  "bacterial_black_spot": {
    en: "1. Management: Caused by the same Xanthomonas pathogen as Bacterial Canker. Chemical control is usually\r\n  ineffective; copper sprays (copper oxychloride, copper hydroxide) can reduce surface inoculum but have no curative\r\n  action. Limit copper use to prevent soil accumulation and bacterial resistance.\r\n\r\n    2. Cultural Control (Primary Strategy): Use certified disease-free planting materials. Promptly remove and\r\n  eliminate infected fruit and diseased trees. Sanitize harvesting tools between trees. Implement windbreaks to reduce\r\n  wind-driven rain entry.",
    bis: "1. Pagdumala: Gipahinabo sa parehong Xanthomonas pathogen sa Bacterial Canker. Ang kemikal nga tambal kasagaran\r\n  dili kaayo epektibo; ang copper sprays makamenos sa surface inoculum apan walay curative nga aksyon. Limitahi ang\r\n  copper aron malikayan ang pagtigum sa yuta.\r\n\r\n    2. Kultural nga Kontrol (Pinaka-Importante): Gamita ang certified nga limpyo sa sakit nga pananom. Kuhaa ug\r\n  laguton dayon ang mga natakdan nga linghod nga bunga ug kahoy. Limpyohan ang mga gamit matag kahoy. Magtanum og\r\n  windbreak aron mamenosan ang hangin ug ulan.",
  },
  "mango_scab": {
    en: "1. Chemical Control: Spray registered fungicides (copper oxychloride, mancozeb, or azoxystrobin) as soon as\r\n  flower panicles emerge. Reapply at 2–3 week intervals until fruit reaches half-size. Shorten spray interval during\r\n  continuous rainy periods. Rotate chemical classes to prevent resistance.\r\n\r\n    2. Cultural Management: Prune after harvest to increase ventilation. Collect and burn fallen leaves and dead plant\r\n  material beneath trees. Bag developing fruits.",
    bis: "1. Tambal (Kemikal): Mag-spray og rehistradong fungicide (copper oxychloride, mancozeb, o azoxystrobin) kung\r\n  mogawas ang bulak. Balika matag 2–3 ka semana hangtod katunga sa gidak-on ang bunga. Palub-a ang agwat panahon sa\r\n  padayon nga ting-ulan. Ilisan-lisa ang klase sa kemikal.\r\n\r\n    2. Kultural nga Pagdumala: Putlon ang sanga human sa ani. Hipusa ug sunuga ang mga nangahulog nga dahon ug patay\r\n  nga materyales sa ilalom sa kahoy. Bag-a ang mga linghod nga bunga.",
  },
  "healthy": {
    en: "1. Maintenance: No disease detected. Continue balanced NPK fertilization using split applications\r\n  (half at rainy season onset, half before end of rainy season) via ring method 15–50 cm from trunk. Maintain regular\r\n  watering and open-center pruning after harvest for airflow. Practice IPM: rotate pesticide modes of action, never\r\n  spray insecticides during full bloom (26–38 DAFI) to protect pollinators.",
    bis: "1. Pagmentinar: Walay sakit nga nadetektar. Padayona ang balanseng pag-abono og NPK (katunga sa\r\n  pagsugod sa ting-ulan, katunga sa dili pa matapos) pinaagi sa ring method 15–50 cm gikan sa trunk. Padayona ang\r\n  pagbisbis ug open-center pruning. Buhata ang IPM: ilisan-lisa ang klase sa pesticide, ayaw gayod mag-spray sa bug-os\r\n  nga pagpamulak.",
  },
};
