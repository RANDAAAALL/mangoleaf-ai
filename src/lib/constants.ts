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

// Verified treatment guidelines based on BAFS GAP (PNS/BAFPS 45:2009) [19], Dofuor et al. (2023) [6], Sossah et al. (2024) [7], and Pham et al. (2025) [8]
export const FALLBACK_GUIDELINES: Record<string, { en: string; bis: string; color: DiseaseGuideline["color"] }> = {
  "anthracnose": {
    en: "Chemical Control: Apply registered contact fungicides (copper oxychloride, mancozeb) on emerging leaf flushes during rainy days. Spray protectant or systemic fungicides at 31–35 and 43–109 DAFI to protect flowers and fruit. Do not use systemic fungicides alone on flushes.\n\nCultural Management: Prune after harvest to improve light and airflow. Collect and burn fallen leaves, dead twigs, and trash. Bag fruits using appropriate materials. Do not intercrop mangoes with papaya or cacao.\n\nPost-Harvest: Subject newly harvested fruits to Hot Water Treatment (HWT) at 52–55°C for 10 minutes within 24 hours of harvest.\n\n(Source: BAFS PNS/BAFPS 45:2009; Dofuor et al., 2023)",
    bis: "Tambal (Kemikal): Mag-spray og rehistradong contact fungicide (copper oxychloride, mancozeb) sa bag-ong tubo nga dahon panahon sa ting-ulan. Mag-spray og protectant o systemic fungicide sa 31–35 ug 43–109 DAFI aron mapanalipdan ang bulak ug prutas. Ayaw gamita ang systemic fungicide nga mag-inusara sa bag-ong tubo.\n\nKultural nga Pagdumala: Putlon ang mga sanga human sa ani aron mosulod ang kahayag ug hangin. Hipusa ug sunuga ang mga nangahulog nga dahon ug patay nga sanga. Bag-a ang mga prutas. Ayaw itanom ang mangga duol sa papaya o cacao.\n\nPagkahuman sa Ani: Ituslob ang bag-ong giani nga prutas sa init nga tubig (52–55°C) sulod sa 10 minutos sulod sa 24 oras pagkahuman sa ani.\n\n(Tinubdan: BAFS PNS/BAFPS 45:2009; Dofuor et al., 2023)",
    color: "yellow",
  },
  "sooty_mold": {
    en: "Insect Control (Primary Strategy): Sooty mold grows on honeydew excreted by sap-sucking insects (leafhoppers, scales, mealybugs). Eradicate or manage honeydew-producing insects using registered insecticides. Neem oil or insecticidal soap solutions may be used as organic alternatives.\n\nCultural Management: Prune dense canopy branches to increase airflow and reduce humidity. Bag clean fruits with appropriate bagging materials. Remove heavily affected branches and leaves.\n\n(Source: BAFS PNS/BAFPS 45:2009)",
    bis: "Kontrol sa Insekto (Pinaka-Importante): Ang sooty mold nagatubo sa lagkit nga hugaw (honeydew) gikan sa mga insekto (leafhopper, scale, mealybug). Kontrola ang mga insekto pinaagi sa rehistradong insecticide. Ang neem oil o sabon nga pang-insekto mahimong gamiton isip organic nga alternatibo.\n\nKultural nga Pagdumala: Putlon ang daghan-daghan nga mga sanga aron mosulod ang hangin ug maminusan ang kahum-ok. Bag-a ang mga limpyo nga prutas. Kuhaa ang mga sanga ug dahon nga grabe og apekto.\n\n(Tinubdan: BAFS PNS/BAFPS 45:2009)",
    color: "purple",
  },
  "bacterial_canker": {
    en: "Management: Caused by Xanthomonas citri pv. mangiferaeindicae. Chemical control is usually ineffective; copper sprays (copper oxychloride, copper hydroxide) can reduce surface inoculum but have no curative action.\n\nCultural Control (Primary Strategy): Use certified disease-free planting materials. Sanitize all harvesting and pruning tools to prevent mechanical transmission. Remove and eliminate diseased branches and trees. Implement windbreaks to reduce wind-driven rain. Monitor leaves regularly as early warnings for fruit infection.\n\n(Source: Sossah et al., 2024; BAFS PNS/BAFPS 45:2009)",
    bis: "Pagdumala: Gipahinabo sa Xanthomonas citri pv. mangiferaeindicae. Ang kemikal nga tambal kasagaran dili kaayo epektibo; ang copper sprays (copper oxychloride, copper hydroxide) makamenos sa surface inoculum apan walay curative nga aksyon.\n\nKultural nga Kontrol (Pinaka-Importante): Gamita ang certified nga limpyo sa sakit nga mga pananom. Limpyohan ang tanang gamit sa pag-ani ug pagputol. Kuhaa ug patya ang mga natakdan nga sanga ug kahoy. Magtanum og windbreak aron mamenosan ang ulan ug hangin. Bantayi kanunay ang dahon isip sayo nga pasidaan sa bunga.\n\n(Tinubdan: Sossah et al., 2024; BAFS PNS/BAFPS 45:2009)",
    color: "pink",
  },
  "bacterial_black_spot": {
    en: "Management: Caused by the same Xanthomonas pathogen as Bacterial Canker. Chemical control is usually ineffective; copper sprays (copper oxychloride, copper hydroxide) can reduce surface inoculum but have no curative action. Limit copper use to prevent soil accumulation and bacterial resistance.\n\nCultural Control (Primary Strategy): Use certified disease-free planting materials. Promptly remove and eliminate infected fruit and diseased trees. Sanitize harvesting tools between trees. Implement windbreaks to reduce wind-driven rain entry.\n\n(Source: Sossah et al., 2024; BAFS PNS/BAFPS 45:2009)",
    bis: "Pagdumala: Gipahinabo sa parehong Xanthomonas pathogen sa Bacterial Canker. Ang kemikal nga tambal kasagaran dili kaayo epektibo; ang copper sprays makamenos sa surface inoculum apan walay curative nga aksyon. Limitahi ang copper aron malikayan ang pagtigum sa yuta.\n\nKultural nga Kontrol (Pinaka-Importante): Gamita ang certified nga limpyo sa sakit nga pananom. Kuhaa ug laguton dayon ang mga natakdan nga linghod nga bunga ug kahoy. Limpyohan ang mga gamit matag kahoy. Magtanum og windbreak aron mamenosan ang hangin ug ulan.\n\n(Tinubdan: Sossah et al., 2024; BAFS PNS/BAFPS 45:2009)",
    color: "pink",
  },
  "mango_scab": {
    en: "Chemical Control: Spray registered fungicides (copper oxychloride, mancozeb, or azoxystrobin) as soon as flower panicles emerge. Reapply at 2–3 week intervals until fruit reaches half-size. Shorten spray interval during continuous rainy periods. Rotate chemical classes to prevent resistance.\n\nCultural Management: Prune after harvest to increase ventilation. Collect and burn fallen leaves and dead plant material beneath trees. Bag developing fruits.\n\n(Source: Pham et al., 2025; BAFS PNS/BAFPS 45:2009)",
    bis: "Tambal (Kemikal): Mag-spray og rehistradong fungicide (copper oxychloride, mancozeb, o azoxystrobin) kung mogawas ang bulak. Balika matag 2–3 ka semana hangtod katunga sa gidak-on ang bunga. Palub-a ang agwat panahon sa padayon nga ting-ulan. Ilisan-lisa ang klase sa kemikal.\n\nKultural nga Pagdumala: Putlon ang sanga human sa ani. Hipusa ug sunuga ang mga nangahulog nga dahon ug patay nga materyales sa ilalom sa kahoy. Bag-a ang mga linghod nga bunga.\n\n(Tinubdan: Pham et al., 2025; BAFS PNS/BAFPS 45:2009)",
    color: "blue",
  },
  "healthy": {
    en: "Maintenance (BAFS GAP): No disease detected. Continue balanced NPK fertilization using split applications (half at rainy season onset, half before end of rainy season) via ring method 15–50 cm from trunk. Maintain regular watering and open-center pruning after harvest for airflow. Practice IPM: rotate pesticide modes of action, never spray insecticides during full bloom (26–38 DAFI) to protect pollinators.\n\n(Source: BAFS PNS/BAFPS 45:2009)",
    bis: "Pagmentinar (BAFS GAP): Walay sakit nga nadetektar. Padayona ang balanseng pag-abono og NPK (katunga sa pagsugod sa ting-ulan, katunga sa dili pa matapos) pinaagi sa ring method 15–50 cm gikan sa trunk. Padayona ang pagbisbis ug open-center pruning. Buhata ang IPM: ilisan-lisa ang klase sa pesticide, ayaw gayod mag-spray sa bug-os nga pagpamulak (26–38 DAFI).\n\n(Tinubdan: BAFS PNS/BAFPS 45:2009)",
    color: "green",
  },
};
