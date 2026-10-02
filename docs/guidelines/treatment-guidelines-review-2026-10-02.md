# Treatment-guideline review and manual replacement draft — 2026-10-02

Status: completed source review and proposed bilingual wording; **not applied to Supabase**. One helper independently checked source pages. Current `public.guidelines` text was read using Supabase MCP on 2026-10-02. All six rows are preserved below; wrapping is normalized for readability.

## How to use this report

1. Review the English/Bisaya comparison tables.
2. Copy the corresponding plain-text block into `guidelines_en` and `guidelines_bis` in the existing Supabase row.
3. Keep row IDs unchanged. Both healthy outputs use `healthy`; the two bacterial labels keep separate rows and may use the same supported text.
4. After a successful online sync, the app saves downloaded guidance for offline use. An offline device keeps its last downloaded text until it syncs again.

The copy blocks are paraphrased guidance summaries, not quotations or evidence that a named pesticide is currently registered. Their label-following condition is deliberate; the reviewed publications do not establish current product registration. DAFI means **days after flower induction**.

“Cultural management” means orchard practices such as pruning, sanitation, bagging, clean planting material and tool hygiene. Published sources support these practices. Removing the heading is a presentation choice; removing supported practices is unnecessary.

## Sources and page numbering

Printed page numbers refer to the number on the document. PDF numbers below are **one-based viewer pages**; they differ because of cover/front pages.

| Short name | Primary source                                                                                                                               | Where it supports this review                                                                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GAP        | [PNS/BAFPS 45:2009, original standard, official BAFS-linked PDF](https://drive.google.com/file/d/1g7aW8rmmL79rvt4KC-OSgSF1ZgwYvpaG/view)     | Printed p4, 6–7, 9, 13–14, 46–48; corresponding PDF6, 8–9, 11, 15–16, 48–50. The official linked original was retrieved and checked directly.                         |
| Manual     | [BAFS 2025 Explanatory Manual: GAP for Mango](https://bafs.da.gov.ph/wp-content/uploads/2025/05/2025_EM-GAP-Mango_compressed.pdf)            | Printed p35, 37, 40, 44, 46, 54, 109–112; PDF45, 47, 50, 54, 56, 64, 119–122. Distinguish reproduced standard provisions from explanatory notes.                      |
| Roadmap    | [Philippine Mango Industry Roadmap 2021–2025](https://www.da.gov.ph/wp-content/uploads/2023/05/Philippine-Mango-Industry-Roadmap.pdf)        | Printed p78–79 / PDF99–100: anthracnose management and disease listings; p81 / PDF102: post-harvest hot-water treatment. The Roadmap is a separate document from GAP. |
| Sossah     | [Sossah et al. (2024), bacterial black spot review](https://onlinelibrary.wiley.com/doi/full/10.1111/efp.12860)                              | HTML §§1, 5, 8–9 and 11. Section references are used instead of unverified PDF pages.                                                                                 |
| Pham       | [Pham et al. (2025), Elsinoe/scab review](https://doi.org/10.1111/ppa.14015)                                                                 | §7 discusses control across hosts. This is not proof of the app's exact mango spray interval or current Philippine product registration.                              |
| Dofuor     | [Dofuor et al. (2023), mango anthracnose review](https://www.frontiersin.org/journals/microbiology/articles/10.3389/fmicb.2023.1168203/full) | §§9–10 support the broader disease-management context; numeric timing here is taken from the identified GAP/manual pages.                                             |

## English comparison

The “before” column contains excerpts from the actual current database, not from the removed bundled fallback. Complete original wording is in the final section.

| Class                        | Before (actual excerpt)                                                                            | Proposed after                                                                                                                          | Page / section and evidence                                                            | Reason                                                                                                                                                                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anthracnose                  | “Do not use systemic fungicides alone on flushes”; fixed 31–35 / 43–109 DAFI spray wording.        | Exclude systemic fungicides for the rainy leaf-flush treatment; keep blossom/fruit treatment separate and conditional.                  | GAP p46 / PDF48; p13–14 / PDF15–16.                                                    | The word “alone” weakens the specific flush restriction. The fruit-stage table says spraying is conditional, not compulsory throughout that range.                                                                         |
| Anthracnose                  | “Ayaw itanom ang mangga duol sa papaya o cacao”; hot-water treatment without cooling/drying.       | Avoid intercropping, not all nearby planting. Specify fruit-only post-harvest treatment, including cooling and drying.                  | Manual p40 / PDF50; p54 / PDF64. Roadmap p81 / PDF102.                                 | The current Bisaya broadens the intercropping advice. Cooling/drying are part of the published procedure; 24 hours comes from the manual's explanatory note.                                                               |
| Bacterial Black Spot         | “Promptly remove and eliminate infected fruit and diseased trees”; prevent “bacterial resistance”. | Keep tool hygiene, clean planting material and windbreaks; qualify tree removal. Keep copper's limited effect and soil accumulation.    | Sossah §§8–9; resistance discussion §11 (HTML sections, no page claim).                | Whole-tree elimination has a low-incidence regional context. The reviewed text does not substantiate this specific copper-resistance claim.                                                                                |
| Bacterial Canker             | “Remove and eliminate diseased branches and trees”; certified planting material.                   | Use the same supported bacterial-disease management text; avoid automatic tree elimination and an unverified certification requirement. | Sossah §§1, 5, 8–9 (HTML sections).                                                    | The review treats canker/black spot as names of the same bacterial disease. App class labels remain unchanged; disease-free planting and conditional control are supported.                                                |
| Healthy Leaf / Healthy Fruit | “No disease detected”; ring method “15–50 cm from trunk” for all trees.                            | Describe the photo classification; tailor fertilizer to tests and age. Retain pollinator protection during full bloom.                  | GAP p4 / PDF6 and p6–7 / PDF8–9; Manual p35, 37, 44, 46 / PDF45, 47, 54, 56.           | The source distinguishes young and bearing trees. A healthy model label is not proof that the whole plant has no disease (application wording inference).                                                                  |
| Mango Scab                   | “As soon as flower panicles emerge”; every “2–3 week intervals until ... half-size”.               | Use the mango-specific GAP young-fruit window, roughly 35–50 DAFI, and follow labels. Keep pruning, sanitation and bagging.             | GAP p47 / PDF49; Manual p111 / PDF121. Pham §7 (multi-host context).                   | The exact current schedule was not established by the reviewed sources. Pham's broader chemical discussion does not establish a Philippine mango registration or this regimen.                                             |
| Sooty Mold                   | Neem/soap “organic alternatives”; “Remove heavily affected branches and leaves”.                   | Retain honeydew-insect management, airflow pruning and clean-fruit bagging; omit unsupported alternatives and blanket leaf removal.     | GAP p48 / PDF50; Manual p112 / PDF122 (scale-insect control separately p109 / PDF119). | The checked sooty-mold guidance supports the retained measures. Its lack of neem/soap support does not prove those products never work. Separate scale-insect pruning advice is not a universal rule for blackened leaves. |

## Bisaya comparison

Ang “before” gikan sa aktuwal nga kasamtangang database. Ang kompleto nga orihinal nga teksto naa sa kataposang seksiyon.

| Class                        | Sa wala pa (aktuwal nga excerpt)                                                                              | Gisugyot nga human                                                                                                                                                                   | Panid / seksiyon ug ebidensiya                                                         | Rason                                                                                                                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Anthracnose                  | “Ayaw gamita ang systemic fungicide nga mag-inusara”; gitakdang pag-spray sa 31–35 / 43–109 DAFI.             | Dili apil ang systemic fungicide sa maong pagtambal sa bag-ong tubo; lahi ang tambal sa bulak/bunga ug buhaton kung gikinahanglan.                                                   | GAP p46 / PDF48; p13–14 / PDF15–16.                                                    | Ang “mag-inusara” nakapausab sa pasabot. Ang pag-spray sa talaan para sa bunga kay kung gikinahanglan lamang.                                                                                                            |
| Anthracnose                  | “Ayaw itanom ang mangga duol sa papaya o cacao”; wala giapil ang pagpabugnaw/pagpauga sa hot-water treatment. | Likayi ang intercropping sa samang manggaan. Para sa giani nga bunga ang hot-water treatment, uban sa pagpabugnaw ug pagpauga.                                                       | Manual p40 / PDF50; p54 / PDF64. Roadmap p81 / PDF102.                                 | Mas lapad ang “duol” kaysa intercropping. Apil sa gipatik nga pamaagi ang pagpabugnaw ug pagpauga; sa explanatory note gikan ang 24 oras.                                                                                |
| Bacterial Black Spot         | “Kuhaa ug laguton dayon ... bunga ug kahoy.”                                                                  | Hupti ang paglimpyo sa gamit, himsog nga pangtanom ug windbreak; ipatin-aw ang kondisyon sa pagtangtang sa kahoy. Hupti ang limitado nga epekto sa copper ug pagtigom niini sa yuta. | Sossah §§8–9; resistance discussion §11 (HTML sections, no page claim).                | Ang pagtangtang sa tibuok kahoy gihisgotan sa lugar nga diyutay pa ang sakit. Dili klarong napamatud-an sa gisusi nga teksto ang maong copper-resistance claim.                                                          |
| Bacterial Canker             | “Kuhaa ug patya ang ... sanga ug kahoy”; “certified” nga pangtanom.                                           | Gamiton ang samang suportadong pagdumala sa bacterial nga sakit; dili awtomatikong patyon ang kahoy ug dili magdugang og certification requirement nga wala matino.                  | Sossah §§1, 5, 8–9 (HTML sections).                                                    | Sa review, mga ngalan kini sa samang bacterial nga sakit. Dili usbon ang class labels sa app; suportado ang walay sakit nga pangtanom ug kontrol nga adunay kondisyon.                                                   |
| Healthy Leaf / Healthy Fruit | “Walay sakit nga nadetektar”; “15–50 cm gikan sa trunk” para sa tanang kahoy.                                 | Ihulagway ang resulta sa litrato; ibase ang abono sa analysis ug edad. Hupti ang pagpanalipod sa pollinator sa pagpamulak.                                                           | GAP p4 / PDF6 and p6–7 / PDF8–9; Manual p35, 37, 44, 46 / PDF45, 47, 54, 56.           | Lahi ang rekomendasyon para sa batan-on ug namungang kahoy. Ang healthy label dili pruweba nga walay sakit ang tibuok tanom (pagpatin-aw sa limitasyon sa app).                                                          |
| Mango Scab                   | “Kung mogawas ang bulak”; “matag 2–3 ka semana hangtod katunga sa gidak-on”.                                  | Gamiton ang giya sa GAP para sa linghod nga bunga, mga 35–50 DAFI, ug sunda ang label. Hupti ang pruning, sanitation ug pagbag.                                                      | GAP p47 / PDF49; Manual p111 / PDF121. Pham §7 (multi-host context).                   | Wala matino sa gisusi nga sources ang eksaktong kasamtangang schedule. Ang kinatibuk-ang hisgot ni Pham dili pruweba sa rehistrasyon o niini nga pamaagi para sa mangga sa Pilipinas.                                    |
| Sooty Mold                   | Neem/sabon nga “organic nga alternatibo”; kuhaon ang tanang grabe og apektong dahon/sanga.                    | Hupti ang pagkontrol sa insekto, pagpaagi sa hangin ug pagbag sa limpyo nga bunga; tangtanga sa draft ang wala matino nga alternatibo ug kinatibuk-ang pagtangtang sa dahon.         | GAP p48 / PDF50; Manual p112 / PDF122 (scale-insect control separately p109 / PDF119). | Suportado ang nahibiling mga pamaagi. Ang kakulang sa suporta dinhi dili pasabot nga walay gamit ang neem/sabon sa tanang sitwasyon. Lahi ang tambag para sa scale insect ug dili kini para sa matag nangitom nga dahon. |

## Copy-ready proposed database text

Copy the contents of each text block, without its fences. These are the complete proposed replacement fields. Supabase still contains the **before** text until you edit it.

### Anthracnose

Database ID: `anthracnose`.

**English — `guidelines_en`**

```text
1. Chemical Control: Use registered contact fungicides for emerging leaf flushes in rainy weather. The GAP advice excludes systemic fungicides for this flush treatment. Blossom and fruit protection are separate treatments, used when needed and according to the product label.

2. Cultural Management: Prune after harvest, remove fallen leaves and dead twigs, and bag developing fruit. Avoid intercropping mango with papaya or cacao.

3. Post-Harvest Fruit Care: For controlled hot-water treatment, use 52–55°C for about 10 minutes within 24 hours of harvest; cool in running water for 10 minutes and air-dry for 10 minutes before packing. This procedure is for harvested fruit.
```

**Bisaya — `guidelines_bis`**

```text
1. Tambal (Kemikal): Gamit og rehistradong contact fungicide sa bag-ong tubo nga dahon panahon sa ting-ulan. Dili apil ang systemic fungicide sa tambag sa GAP alang niini nga pagtambal sa bag-ong tubo. Lahi ang pagpanalipod sa bulak ug bunga; buhata kung gikinahanglan ug sunda ang label sa produkto.

2. Kultural nga Pagdumala: Putla ang mga sanga human sa ani, hipusa ang nangahulog nga dahon ug patay nga sanga, ug bag-a ang nagatubo nga bunga. Likayi ang intercropping, o pagdungan og tanom sa mangga ug papaya o cacao sa samang manggaan.

3. Pag-atiman sa Giani nga Bunga: Sa kontroladong hot-water treatment, gamita ang 52–55°C sulod sa mga 10 minutos, sulod sa 24 oras human sa ani; pabugnawa sa nagaagay nga tubig sulod sa 10 minutos ug pauga sa hangin sulod sa 10 minutos sa dili pa i-pack. Para kini sa giani nga bunga.
```

### Bacterial Black Spot and Bacterial Canker

Database IDs: `bacterial_black_spot + bacterial_canker`.

**English — `guidelines_en`**

```text
1. Management: Copper sprays can reduce bacteria on plant surfaces but do not cure established infection. Follow the label of a product registered for the intended use. Repeated copper use can accumulate copper in soil.

2. Cultural Control: Use disease-free planting material, sanitize tools between trees, monitor symptoms, and use windbreaks. Published advice discusses eliminating diseased trees in areas with low disease incidence; it is not a blanket instruction to uproot every tree.
```

**Bisaya — `guidelines_bis`**

```text
1. Pagdumala: Ang copper spray makamenos sa bakterya sa ibabaw sa tanom apan dili makaayo sa natakdan nga bahin. Sunda ang label sa produktong rehistrado alang sa maong paggamit. Ang balik-balik nga paggamit sa copper mahimong makapatigom niini sa yuta.

2. Kultural nga Kontrol: Gamit og materyal nga pangtanom nga walay sakit, limpyohi ang mga gamit matag kahoy, bantayi ang sintomas, ug gamit og windbreak. Ang gipatik nga tambag naghisgot sa pagtangtang sa natakdan nga kahoy sa lugar nga diyutay pa ang sakit; dili kini sugo nga laguton ang matag kahoy.
```

### Healthy Leaf and Healthy Fruit

Database ID: `healthy`.

**English — `guidelines_en`**

```text
1. Maintenance: The photo was classified as healthy; continue checking the plant for symptoms. Base fertilizer choice, amount, timing, and placement on soil or tissue analysis and tree age. Water as needed and prune after harvest for airflow. Avoid insecticide spraying during full bloom to protect pollinators.
```

**Bisaya — `guidelines_bis`**

```text
1. Pagmentinar: Giila sa modelo nga himsog ang naa sa litrato; padayong bantayi ang tanom alang sa sintomas. Ibase ang klase, kadaghanon, panahon, ug dapit sa pagbutang sa abono sa soil o tissue analysis ug edad sa kahoy. Bisbisi kung gikinahanglan ug putla ang mga sanga human sa ani aron makaagi ang hangin. Likayi ang pag-spray og insecticide panahon sa bug-os nga pagpamulak aron mapanalipdan ang mga pollinator.
```

### Mango Scab

Database ID: `mango_scab`.

**English — `guidelines_en`**

```text
1. Chemical Control: In scab-prone areas, GAP recommends registered fungicides for young fruit around 35–50 days after flower induction (DAFI). Follow the product label for application details.

2. Cultural Management: Prune after harvest, remove fallen leaves and dead plant material, and bag developing fruit.
```

**Bisaya — `guidelines_bis`**

```text
1. Tambal (Kemikal): Sa lugar nga kasagarang adunay scab, ang GAP nagrekomendar og rehistradong fungicide sa linghod nga bunga sa mga 35–50 ka adlaw human sa flower induction (DAFI). Sunda ang label sa produkto alang sa paggamit niini.

2. Kultural nga Pagdumala: Putla ang mga sanga human sa ani, hipusa ang nangahulog nga dahon ug patay nga materyales sa tanom, ug bag-a ang nagatubo nga bunga.
```

### Sooty Mold

Database ID: `sooty_mold`.

**English — `guidelines_en`**

```text
1. Insect Control: Manage the sap-sucking insects that produce honeydew, such as leafhoppers, scales, and mealybugs. Use registered insecticides according to their labels.

2. Cultural Management: Prune dense branches to improve airflow and bag clean fruit. These measures address the insects and conditions associated with sooty mold.
```

**Bisaya — `guidelines_bis`**

```text
1. Kontrol sa Insekto: Kontrola ang mga insekto nga mosuyop sa duga ug mopagawas og honeydew, sama sa leafhopper, scale insect, ug mealybug. Gamit og rehistradong insecticide ug sunda ang label niini.

2. Kultural nga Pagdumala: Putla ang dasok nga mga sanga aron makaagi ang hangin ug bag-a ang limpyo nga bunga. Kini nga mga pamaagi motubag sa mga insekto ug kahimtang nga may kalabotan sa sooty mold.
```

## Evidence details and limits

- **Anthracnose:** GAP p46 / PDF48 separates rainy emerging-leaf-flush treatment from blossom/fruit treatment. The specific exclusion of systemic fungicides applies to the flush treatment; it is not a ban across all anthracnose uses. GAP p13–14 / PDF15–16 puts 31–35 DAFI at fruit set and splits 43–109 into several fruit-development rows, each conditional. The replacement omits these easily misread fixed schedules.
- **Orchard practices:** Roadmap p78 / PDF99 supports anthracnose pruning, sanitation and bagging. Manual p40 / PDF50 addresses intercropping; “near papaya/cacao” is broader than that advice. GAP p47–48 / PDF49–50 separately supports the retained scab and sooty-mold practices.
- **Post-harvest:** Manual p54 / PDF64 contains cooling and drying alongside hot-water treatment. The within-24-hours condition is in its explanatory note, not a claimed Roadmap or original-standard quotation.
- **Bacterial labels:** Sossah identifies the shared pathogen, `Xanthomonas citri pv. mangiferaeindicae`. Its cultural-control discussion qualifies tree elimination by low regional disease incidence. The retained draft reflects this qualification; a classifier label alone does not determine whether a tree should be removed.
- **Healthy maintenance:** GAP differentiates young and bearing trees. Young-tree placement varies with age; bearing-tree advice is not the same short-distance ring. Soil/tissue analysis and tree age therefore replace a universal distance. “Classified as healthy” describes the app result rather than asserting plant-wide disease absence; this is an application wording inference.
- **Unsupported specifics:** This review did not establish the scab 2–3-week/half-size regimen, neem/soap alternatives for the sooty-mold entry, automatic removal of every blackened leaf, or the exact copper-resistance claim. Omitting them means evidence was insufficient in the reviewed material, not that every such practice is scientifically false.
- **Class coverage:** These documents support the named disease concepts and management contexts; they do not verify each dataset label, prove model accuracy, or establish Bacterial Black Spot and Bacterial Canker as distinct pathogen categories. No dataset/model class was changed.

## Missing-guidance behavior in the application

The app now maintains treatment text only through Supabase and its downloaded IndexedDB copy. It does not bundle replacement treatment advice.

`Uncertain / Unrecognized` is a separate diagnosis outcome. It always uses the exact user-approved photo reminder below, before the guideline cache is inspected. Its section heading is “Try another photo” / “Sulayi og laing litrato”. This reminder needs no Supabase row and works offline; it does not alter model thresholds or guarantee recognition after a retake. The loading and unavailable states below apply to accepted class results.

**English uncertain-photo reminder**

> Couldn't confidently identify this photo. Please try again with a clear and proper one photo of green mango fruit and mango leaf

**Bisaya uncertain-photo reminder**

> Dili maka diagnose ang application og resulta basi sa litrato. Sulayi usab og gamit usa ka laing litrato nga tarong og klaro nga bunga o dahon sa mangga, nga adunay igo nga tama-tama kahayag sa background

| Situation                                                              | English                                                                                                            | Bisaya                                                                                                                                      |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Local guideline query is still loading                                 | Loading saved treatment guidelines...                                                                              | Gikarga ang natipig nga giya sa pagtambal...                                                                                                |
| Matching row is missing, or selected-language text is blank            | Treatment guidelines are unavailable on this device. Connect to the internet and let the app sync, then try again. | Wala pay giya sa pagtambal nga magamit niini nga device. Konektar sa internet ug hulata nga mahuman ang pag-sync sa app, dayon sulayi usab. |
| Downloaded advice exists, including offline use or a later failed sync | Display the saved guideline text.                                                                                  | Ipakita ang natipig nga giya.                                                                                                               |

English and Bisaya are checked independently. A blank English field does not hide valid Bisaya guidance, and vice versa. This is a guidance-availability message; it does not mean the AI diagnosis failed. See [architecture](../ARCHITECTURE.md#local-persistence) and [availability checks](../TESTING.md#treatment-guideline-availability-checks).

## Current Supabase wording — before snapshot

Read-only snapshot dated 2026-10-02. Line wrapping is normalized; paragraphs and substantive wording are retained. The source table currently has six records for seven model outputs.

| Database ID / class                           | Before: English                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Before: Bisaya                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `anthracnose` / Anthracnose                   | 1. Chemical Control: Apply registered contact fungicides (copper oxychloride, mancozeb) on emerging leaf flushes during rainy days. Spray protectant or systemic fungicides at 31–35 and 43–109 DAFI to protect flowers and fruit. Do not use systemic fungicides alone on flushes.<br><br>2. Cultural Management: Prune after harvest to improve light and airflow. Collect and burn fallen leaves, dead twigs, and trash. Bag fruits using appropriate materials. Do not intercrop mangoes with papaya or cacao.<br><br>3. Post-Harvest: Subject newly harvested fruits to Hot Water Treatment (HWT) at 52–55°C for 10 minutes within 24 hours of harvest. | 1. Tambal (Kemikal): Mag-spray og rehistradong contact fungicide (copper oxychloride, mancozeb) sa bag-ong tubo nga dahon panahon sa ting-ulan. Mag-spray og protectant o systemic fungicide sa 31–35 ug 43–109 DAFI aron mapanalipdan ang bulak ug prutas. Ayaw gamita ang systemic fungicide nga mag-inusara sa bag-ong tubo.<br><br>2. Kultural nga Pagdumala: Putlon ang mga sanga human sa ani aron mosulod ang kahayag ug hangin. Hipusa ug sunuga ang mga nangahulog nga dahon ug patay nga sanga. Bag-a ang mga prutas. Ayaw itanom ang mangga duol sa papaya o cacao.<br><br>3. Pagkahuman sa Ani: Ituslob ang bag-ong giani nga prutas sa init nga tubig (52–55°C) sulod sa 10 minutos sulod sa 24 oras pagkahuman sa ani. |
| `bacterial_black_spot` / Bacterial Black Spot | 1. Management: Caused by the same Xanthomonas pathogen as Bacterial Canker. Chemical control is usually ineffective; copper sprays (copper oxychloride, copper hydroxide) can reduce surface inoculum but have no curative action. Limit copper use to prevent soil accumulation and bacterial resistance.<br><br>2. Cultural Control (Primary Strategy): Use certified disease-free planting materials. Promptly remove and eliminate infected fruit and diseased trees. Sanitize harvesting tools between trees. Implement windbreaks to reduce wind-driven rain entry.                                                                                    | 1. Pagdumala: Gipahinabo sa parehong Xanthomonas pathogen sa Bacterial Canker. Ang kemikal nga tambal kasagaran dili kaayo epektibo; ang copper sprays makamenos sa surface inoculum apan walay curative nga aksyon. Limitahi ang copper aron malikayan ang pagtigum sa yuta.<br><br>2. Kultural nga Kontrol (Pinaka-Importante): Gamita ang certified nga limpyo sa sakit nga pananom. Kuhaa ug laguton dayon ang mga natakdan nga linghod nga bunga ug kahoy. Limpyohan ang mga gamit matag kahoy. Magtanum og windbreak aron mamenosan ang hangin ug ulan.                                                                                                                                                                        |
| `bacterial_canker` / Bacterial Canker         | 1. Management: Caused by Xanthomonas citri pv. mangiferaeindicae. Chemical control is usually ineffective; copper sprays (copper oxychloride, copper hydroxide) can reduce surface inoculum but have no curative action.<br><br>2. Cultural Control (Primary Strategy): Use certified disease-free planting materials. Sanitize all harvesting and pruning tools to prevent mechanical transmission. Remove and eliminate diseased branches and trees. Implement windbreaks to reduce wind-driven rain. Monitor leaves regularly as early warnings for fruit infection.                                                                                      | 1. Pagdumala: Gipahinabo sa Xanthomonas citri pv. mangiferaeindicae. Ang kemikal nga tambal kasagaran dili kaayo epektibo; ang copper sprays (copper oxychloride, copper hydroxide) makamenos sa surface inoculum apan walay curative nga aksyon.<br><br>2. Kultural nga Kontrol (Pinaka-Importante): Gamita ang certified nga limpyo sa sakit nga mga pananom. Limpyohan ang tanang gamit sa pag-ani ug pagputol. Kuhaa ug patya ang mga natakdan nga sanga ug kahoy. Magtanum og windbreak aron mamenosan ang ulan ug hangin. Bantayi kanunay ang dahon isip sayo nga pasidaan sa bunga.                                                                                                                                           |
| `healthy` / Healthy Leaf + Healthy Fruit      | 1. Maintenance: No disease detected. Continue balanced NPK fertilization using split applications (half at rainy season onset, half before end of rainy season) via ring method 15–50 cm from trunk. Maintain regular watering and open-center pruning after harvest for airflow. Practice IPM: rotate pesticide modes of action, never spray insecticides during full bloom (26–38 DAFI) to protect pollinators.                                                                                                                                                                                                                                            | 1. Pagmentinar: Walay sakit nga nadetektar. Padayona ang balanseng pag-abono og NPK (katunga sa pagsugod sa ting-ulan, katunga sa dili pa matapos) pinaagi sa ring method 15–50 cm gikan sa trunk. Padayona ang pagbisbis ug open-center pruning. Buhata ang IPM: ilisan-lisa ang klase sa pesticide, ayaw gayod mag-spray sa bug-os nga pagpamulak.                                                                                                                                                                                                                                                                                                                                                                                 |
| `mango_scab` / Mango Scab                     | 1. Chemical Control: Spray registered fungicides (copper oxychloride, mancozeb, or azoxystrobin) as soon as flower panicles emerge. Reapply at 2–3 week intervals until fruit reaches half-size. Shorten spray interval during continuous rainy periods. Rotate chemical classes to prevent resistance.<br><br>2. Cultural Management: Prune after harvest to increase ventilation. Collect and burn fallen leaves and dead plant material beneath trees. Bag developing fruits.                                                                                                                                                                             | 1. Tambal (Kemikal): Mag-spray og rehistradong fungicide (copper oxychloride, mancozeb, o azoxystrobin) kung mogawas ang bulak. Balika matag 2–3 ka semana hangtod katunga sa gidak-on ang bunga. Palub-a ang agwat panahon sa padayon nga ting-ulan. Ilisan-lisa ang klase sa kemikal.<br><br>2. Kultural nga Pagdumala: Putlon ang sanga human sa ani. Hipusa ug sunuga ang mga nangahulog nga dahon ug patay nga materyales sa ilalom sa kahoy. Bag-a ang mga linghod nga bunga.                                                                                                                                                                                                                                                  |
| `sooty_mold` / Sooty Mold                     | 1. Insect Control (Primary Strategy): Sooty mold grows on honeydew excreted by sap-sucking insects (leafhoppers, scales, mealybugs). Eradicate or manage honeydew-producing insects using registered insecticides. Neem oil or insecticidal soap solutions may be used as organic alternatives.<br><br>2. Cultural Management: Prune dense canopy branches to increase airflow and reduce humidity. Bag clean fruits with appropriate bagging materials. Remove heavily affected branches and leaves.                                                                                                                                                        | 1. Kontrol sa Insekto (Pinaka-Importante): Ang sooty mold nagatubo sa lagkit nga hugaw (honeydew) gikan sa mga insekto (leafhopper, scale, mealybug). Kontrola ang mga insekto pinaagi sa rehistradong insecticide. Ang neem oil o sabon nga pang-insekto mahimong gamiton isip organic nga alternatibo.<br><br>2. Kultural nga Pagdumala: Putlon ang daghan-daghan nga mga sanga aron mosulod ang hangin ug maminusan ang kahum-ok. Bag-a ang mga limpyo nga prutas. Kuhaa ang mga sanga ug dahon nga grabe og apekto.                                                                                                                                                                                                              |
