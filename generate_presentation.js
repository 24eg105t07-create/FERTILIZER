const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

console.log('Generating AgriWise Presentation for Anurag University...');

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 inches
pres.author = 'Sai Vardhan Reddy (24EG105T07)';
pres.company = 'Anurag University';
pres.title = 'AgriWise: AI-Based Smart Fertilizer Recommendation System';
pres.subject = 'Precision Agronomy Decision Support System';

const bgPath = path.resolve('C:/Users/harin/.gemini/antigravity/brain/8be4a11e-2d35-4ed5-97c8-0e4751963b83/scratch/template_unpacked/ppt/media/image1.png');

// Brand Colors
const C = {
  primaryDark: '0A4D2E',   // Deep Forest Green
  primary: '1B5E20',       // Dark Agronomy Green
  primaryMedium: '2E7D32', // Vibrant Foliage Green
  primaryLight: 'E8F5E9',  // Light Sage Tint
  accentTeal: '00695C',    // Deep Teal
  accentBlue: '0D47A1',    // Royal Navy Blue
  accentAmber: 'B45309',   // Dark Amber/Gold
  accentRed: 'C62828',     // Crimson Alert
  bgCard: 'FFFFFF',        // Card White
  bgCardAlt: 'F8FAFC',     // Cool Off-White
  border: 'CBD5E1',        // Slate Border
  borderDark: '94A3B8',    // Strong Slate Border
  textDark: '0F172A',      // Near Black Heading
  textMuted: '475569',     // Slate Secondary Text
  textSubtle: '64748B',    // Dim Subtitle
  white: 'FFFFFF'
};

// Helper to create slide with common background & footer
function createBaseSlide(slideNum, titleText, categoryPrompt) {
  const slide = pres.addSlide();
  if (fs.existsSync(bgPath)) {
    slide.background = { path: bgPath };
  }

  // Header Title & Category prompt
  if (titleText) {
    slide.addText([
      { text: titleText + '\n', options: { fontSize: 21, bold: true, color: C.primaryDark, fontFace: 'Arial' } },
      { text: categoryPrompt || '', options: { fontSize: 11, italic: true, color: C.textMuted, fontFace: 'Arial' } }
    ], {
      x: 0.8,
      y: 0.52,
      w: 11.73,
      h: 0.95,
      margin: 0,
      valign: 'middle'
    });
  }

  // Footer bar
  slide.addText(
    [
      { text: 'AgriWise: AI Precision Fertilizer DSS  |  Live App: ', options: { color: C.textSubtle, fontSize: 9 } },
      { text: 'agriwise-fertilizer.onrender.com', options: { color: C.accentBlue, fontSize: 9, hyperlink: { url: 'https://agriwise-fertilizer.onrender.com' } } },
      { text: '  |  Anurag University', options: { color: C.textSubtle, fontSize: 9 } }
    ],
    { x: 0.8, y: 7.08, w: 9.5, h: 0.35, valign: 'middle' }
  );

  // Slide Number
  slide.addText(`Slide ${slideNum} / 11`, {
    x: 10.8,
    y: 7.08,
    w: 1.73,
    h: 0.35,
    align: 'right',
    valign: 'middle',
    fontSize: 9,
    bold: true,
    color: C.primaryMedium
  });

  return slide;
}

// ==========================================
// SLIDE 1: Title & Project Metadata
// ==========================================
{
  const slide = pres.addSlide();
  if (fs.existsSync(bgPath)) slide.background = { path: bgPath };

  // Main Title Container
  slide.addShape(pres.ShapeType.rect, {
    x: 0.8, y: 1.5, w: 11.73, h: 2.1,
    fill: { color: 'F0FDF4' },
    line: { color: C.primaryMedium, width: 2 }
  });

  slide.addText('AGRIWISE', {
    x: 1.1, y: 1.6, w: 11.13, h: 0.45,
    fontSize: 14, bold: true, color: C.primaryMedium, fontFace: 'Arial', charSpacing: 4
  });

  slide.addText('AI-Based Smart Fertilizer Recommendation & Precision Agronomy System', {
    x: 1.1, y: 2.05, w: 11.13, h: 0.7,
    fontSize: 26, bold: true, color: C.primaryDark, fontFace: 'Arial'
  });

  slide.addText('A closed-loop 4R nutrient stewardship platform translating chemical soil tests into stage-specific crop calendars with human-in-the-loop clinical review.', {
    x: 1.1, y: 2.75, w: 11.13, h: 0.65,
    fontSize: 12, italic: true, color: C.textMuted, fontFace: 'Arial'
  });

  // Left Card: Sector & Sub-System
  slide.addShape(pres.ShapeType.rect, {
    x: 0.8, y: 3.8, w: 5.65, h: 3.0,
    fill: { color: C.bgCard },
    line: { color: C.borderDark, width: 1.2 }
  });

  slide.addShape(pres.ShapeType.rect, {
    x: 0.8, y: 3.8, w: 5.65, h: 0.45,
    fill: { color: C.primaryDark }
  });
  slide.addText('DOMAIN TAXONOMY & CLASSIFICATION', {
    x: 1.0, y: 3.8, w: 5.25, h: 0.45,
    fontSize: 11, bold: true, color: C.white, fontFace: 'Arial', valign: 'middle'
  });

  slide.addText([
    { text: '• Sector Selected:\n', options: { bold: true, color: C.primaryDark, fontSize: 12 } },
    { text: '  Agriculture & Precision Agronomy\n\n', options: { color: C.textDark, fontSize: 11 } },
    { text: '• Sub-System Selected:\n', options: { bold: true, color: C.primaryDark, fontSize: 12 } },
    { text: '  Soil Health Management & Fertilizer Decision Support System (DSS)\n\n', options: { color: C.textDark, fontSize: 11 } },
    { text: '• Live Prototype Deployment:\n', options: { bold: true, color: C.primaryDark, fontSize: 12 } },
    { text: '  https://agriwise-fertilizer.onrender.com\n\n', options: { color: C.accentBlue, bold: true, fontSize: 11, hyperlink: { url: 'https://agriwise-fertilizer.onrender.com' } } },
    { text: '• GitHub Code Repository:\n', options: { bold: true, color: C.primaryDark, fontSize: 12 } },
    { text: '  https://github.com/24eg105t07-create/FERTILIZER', options: { color: C.accentBlue, fontSize: 10.5, hyperlink: { url: 'https://github.com/24eg105t07-create/FERTILIZER' } } }
  ], {
    x: 1.0, y: 4.35, w: 5.25, h: 2.35,
    valign: 'top', fontFace: 'Arial'
  });

  // Right Card: Project Credentials & Guide
  slide.addShape(pres.ShapeType.rect, {
    x: 6.88, y: 3.8, w: 5.65, h: 3.0,
    fill: { color: C.bgCard },
    line: { color: C.borderDark, width: 1.2 }
  });

  slide.addShape(pres.ShapeType.rect, {
    x: 6.88, y: 3.8, w: 5.65, h: 0.45,
    fill: { color: C.accentTeal }
  });
  slide.addText('STUDENT & INSTITUTIONAL CREDENTIALS', {
    x: 7.08, y: 3.8, w: 5.25, h: 0.45,
    fontSize: 11, bold: true, color: C.white, fontFace: 'Arial', valign: 'middle'
  });

  slide.addText([
    { text: '• Student Name: ', options: { bold: true, color: C.textDark, fontSize: 12 } },
    { text: 'Sai Vardhan Reddy\n', options: { color: C.primaryDark, bold: true, fontSize: 12 } },
    { text: '• Roll Number: ', options: { bold: true, color: C.textDark, fontSize: 12 } },
    { text: '24EG105T07\n\n', options: { color: C.accentAmber, bold: true, fontSize: 12 } },
    { text: '• Department:\n', options: { bold: true, color: C.textDark, fontSize: 12 } },
    { text: '  Department of Computer Science & Engineering\n\n', options: { color: C.textDark, fontSize: 11.5 } },
    { text: '• Institution:\n', options: { bold: true, color: C.textDark, fontSize: 12 } },
    { text: '  Anurag University, Venkatapur, Hyderabad\n\n', options: { color: C.primaryDark, bold: true, fontSize: 12 } },
    { text: '• Academic Session: ', options: { bold: true, color: C.textDark, fontSize: 11 } },
    { text: '2024 - 2026 | Technical Project Seminar', options: { color: C.textMuted, fontSize: 11 } }
  ], {
    x: 7.08, y: 4.35, w: 5.25, h: 2.35,
    valign: 'top', fontFace: 'Arial'
  });

  // Footer note
  slide.addText('Anurag University  |  Dept. of Computer Science & Engineering  |  Project Presentation', {
    x: 0.8, y: 7.08, w: 11.73, h: 0.35,
    fontSize: 9, color: C.textSubtle, align: 'center', valign: 'middle'
  });
}

// ==========================================
// SLIDE 2: Agenda
// ==========================================
{
  const slide = createBaseSlide(2, 'AGENDA', 'Comprehensive Table of Contents Aligned with Anurag University Evaluation Rubric');

  const agendaItems = [
    { num: '01', title: 'Ambitious "How Might We..."', desc: 'Framing high-impact precision nutrient delivery' },
    { num: '02', title: 'Problem Statement', desc: 'Current state of blanket broadcasting and chemical waste' },
    { num: '03', title: 'Severity of the Problem', desc: 'Soil acidification, crop response drop & aquifer nitrates' },
    { num: '04', title: 'Stakeholder Identification', desc: 'Farmers, chemical dealers, extension labs, consumers' },
    { num: '05', title: 'Root Cause Analysis', desc: '5-Whys methodology tracing systemic failure nodes' },
    { num: '06', title: 'Conflicting Stakeholder Priorities', desc: 'Dealer volume quotas vs farmer expenditure reduction' },
    { num: '07', title: 'Ideation (Possibility Space)', desc: 'Multi-criteria evaluation of 4 technological alternatives' },
    { num: '08', title: 'Idea Proposal (Chosen Solution)', desc: 'AgriWise 4R clinical decision-support web platform' },
    { num: '09', title: 'Prototype Design & Architecture', desc: '3-tier Node/Express/MySQL engine and live URL' },
    { num: '10', title: 'Implementation Challenges', desc: 'Soil texture buffering, unit divergence & rural UX' },
    { num: '11', title: 'Scope of Improvement & References', desc: 'OCR card scanning, voice UI, NDVI & literature review' }
  ];

  // Render in two balanced columns
  const col1 = agendaItems.slice(0, 6);
  const col2 = agendaItems.slice(6);

  col1.forEach((item, idx) => {
    const yPos = 1.6 + idx * 0.85;
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: yPos, w: 5.65, h: 0.76,
      fill: { color: C.bgCardAlt },
      line: { color: C.border, width: 1 },
      rectRadius: 0.08
    });
    // Badge
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.92, y: yPos + 0.13, w: 0.55, h: 0.5,
      fill: { color: C.primaryDark },
      rectRadius: 0.08
    });
    slide.addText(item.num, {
      x: 0.92, y: yPos + 0.13, w: 0.55, h: 0.5,
      fontSize: 12, bold: true, color: C.white, align: 'center', valign: 'middle'
    });
    // Title & Desc
    slide.addText([
      { text: item.title + '\n', options: { bold: true, fontSize: 11.5, color: C.textDark } },
      { text: item.desc, options: { fontSize: 9.5, color: C.textMuted } }
    ], { x: 1.58, y: yPos + 0.08, w: 4.75, h: 0.6, valign: 'middle' });
  });

  col2.forEach((item, idx) => {
    const yPos = 1.6 + idx * 0.98;
    slide.addShape(pres.ShapeType.roundRect, {
      x: 6.88, y: yPos, w: 5.65, h: 0.85,
      fill: { color: C.bgCardAlt },
      line: { color: C.border, width: 1 },
      rectRadius: 0.08
    });
    // Badge
    slide.addShape(pres.ShapeType.roundRect, {
      x: 7.0, y: yPos + 0.17, w: 0.55, h: 0.5,
      fill: { color: (idx === 1 || idx === 2) ? C.accentAmber : C.accentTeal },
      rectRadius: 0.08
    });
    slide.addText(item.num, {
      x: 7.0, y: yPos + 0.17, w: 0.55, h: 0.5,
      fontSize: 12, bold: true, color: C.white, align: 'center', valign: 'middle'
    });
    // Title & Desc
    slide.addText([
      { text: item.title + '\n', options: { bold: true, fontSize: 12, color: C.textDark } },
      { text: item.desc, options: { fontSize: 10, color: C.textMuted } }
    ], { x: 7.68, y: yPos + 0.1, w: 4.75, h: 0.65, valign: 'middle' });
  });
}

// ==========================================
// SLIDE 3: Vision of a Perfect System
// ==========================================
{
  const slide = createBaseSlide(3, 'VISION OF A PERFECT SYSTEM ("NO PROBLEM" SCENARIO)', 'Template Question: If there is "No Problem", how should the system function? What will happen if solved? Explain using infographic.');

  // Top Box: The Ideal Equilibrium Statement
  slide.addShape(pres.ShapeType.rect, {
    x: 0.8, y: 1.55, w: 11.73, h: 1.45,
    fill: { color: 'F0FDF4' },
    line: { color: C.primaryMedium, width: 1.5 }
  });

  slide.addText([
    { text: 'THE CLOSED-LOOP 4R NUTRIENT EQUILIBRIUM: ZERO CHEMICAL WASTE, RESTORED SOIL HEALTH\n', options: { bold: true, color: C.primaryDark, fontSize: 12 } },
    { text: '• Precise Chemical Match: ', options: { bold: true, color: C.textDark, fontSize: 10.5 } },
    { text: '100% of farm fields receive individualized nutrient blends calculated against measured soil chemistry (N-P-K-pH-EC-OC) and crop uptake needs.\n', options: { color: C.textMuted, fontSize: 10.5 } },
    { text: '• Macro-Nutrient Rebalancing: ', options: { bold: true, color: C.textDark, fontSize: 10.5 } },
    { text: 'India\'s distorted NPK consumption ratio normalizes from 8.2:3.2:1 back to the scientifically optimal 4:2:1.\n', options: { color: C.textMuted, fontSize: 10.5 } },
    { text: '• Economic & Ecological Synergy: ', options: { bold: true, color: C.textDark, fontSize: 10.5 } },
    { text: 'Fertilizer application costs plunge by 25-35%; crop yields rise by 15-22%; zero nitrogen runoff or groundwater nitrate contamination.', options: { color: C.textMuted, fontSize: 10.5 } }
  ], {
    x: 1.0, y: 1.62, w: 11.33, h: 1.3,
    valign: 'top', fontFace: 'Arial'
  });

  // Section Header: Process Infographic
  slide.addText('INFOGRAPHIC: END-TO-END AUTOMATED 4R NUTRIENT WORKFLOW', {
    x: 0.8, y: 3.12, w: 11.73, h: 0.35,
    fontSize: 11, bold: true, color: C.accentTeal, fontFace: 'Arial'
  });

  // 5 Step Flow Cards
  const steps = [
    { step: 'STAGE 1', title: 'Soil Test Ingestion', desc: 'Farmer uploads official lab card; system ingests N, P, K, pH, EC, and Organic Carbon values.', color: C.primaryMedium },
    { step: 'STAGE 2', title: 'Deterministic 4R AI', desc: 'Rules engine computes nutrient deficit against ICAR target crop yield curves and soil buffer capacity.', color: C.accentTeal },
    { step: 'STAGE 3', title: 'Clinical Agronomist Review', desc: 'Human-in-the-loop expert verifies abnormal profiles, flags toxicities, and signs off digitally.', color: C.accentBlue },
    { step: 'STAGE 4', title: '6-Stage Crop Calendar', desc: 'Generates split schedules: Basal, Tillering, Panicle, Booting, Flowering, and Maturation.', color: C.accentAmber },
    { step: 'STAGE 5', title: 'Zero-Waste Harvest', desc: 'Soil microbial regeneration, elimination of chemical runoff, and maximal grain output per rupee spent.', color: C.primaryDark }
  ];

  const cardW = 2.18;
  const gap = 0.2;

  steps.forEach((s, idx) => {
    const xPos = 0.8 + idx * (cardW + gap);
    slide.addShape(pres.ShapeType.roundRect, {
      x: xPos, y: 3.5, w: cardW, h: 3.3,
      fill: { color: C.bgCardAlt },
      line: { color: C.border, width: 1.2 },
      rectRadius: 0.08
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: xPos, y: 3.5, w: cardW, h: 0.42,
      fill: { color: s.color },
      rectRadius: 0.08
    });

    slide.addText(s.step, {
      x: xPos, y: 3.5, w: cardW, h: 0.42,
      fontSize: 10, bold: true, color: C.white, align: 'center', valign: 'middle'
    });

    slide.addText(s.title, {
      x: xPos + 0.1, y: 4.02, w: cardW - 0.2, h: 0.55,
      fontSize: 11, bold: true, color: C.textDark, align: 'center', valign: 'middle'
    });

    slide.addText(s.desc, {
      x: xPos + 0.12, y: 4.65, w: cardW - 0.24, h: 2.05,
      fontSize: 9.5, color: C.textMuted, align: 'center', valign: 'top'
    });

    // Arrow to next card
    if (idx < steps.length - 1) {
      slide.addText('➔', {
        x: xPos + cardW - 0.05, y: 4.8, w: gap + 0.1, h: 0.4,
        fontSize: 16, bold: true, color: C.primaryMedium, align: 'center', valign: 'middle'
      });
    }
  });
}

// ==========================================
// SLIDE 4: Current State, Symptoms & Stakeholders
// ==========================================
{
  const slide = createBaseSlide(4, 'CURRENT STATE, SYMPTOMS & STAKEHOLDERS', 'Template Question: State current state + symptoms, point of concern (why is it a problem?), and who are affected.');

  // 3 Horizontal Cards Layout
  const cards = [
    {
      title: '1. CURRENT STATE & SYMPTOMS',
      color: C.accentRed,
      bgColor: 'FFF5F5',
      points: [
        { b: 'Habitual Blanket Broadcasting: ', t: 'Over 82% of farmers apply standard quantities of Urea and DAP without measuring existing soil nutrients.' },
        { b: 'Extreme NPK Skew: ', t: 'Current national application ratio is 8.2:3.2:1 (up to 31.4:8.0:1 in intensive zones) vs the scientific 4:2:1 standard.' },
        { b: 'Massive Nitrogen Loss: ', t: '50% to 70% of applied urea nitrogen is lost through ammonia gas volatilization and subsoil nitrate leaching.' },
        { b: 'Rampant Hidden Hunger: ', t: 'Neglect of micronutrients has left 36.5% of soils deficient in Zinc, 23.2% in Boron, and 24.7% in Sulfur.' }
      ]
    },
    {
      title: '2. POINT OF CONCERN (WHY CRITICAL?)',
      color: C.accentAmber,
      bgColor: 'FFFBEB',
      points: [
        { b: 'Collapsing Crop Response Ratio: ', t: 'Grain produced per kg of NPK has dropped precipitously from 13.4 kg (1970) to 3.7 kg today (a 72% efficiency loss).' },
        { b: 'Severe Soil Degradation: ', t: 'Chronic urea over-application causes soil acidification, structural compaction, and depletion of organic matter (<0.4%).' },
        { b: 'Groundwater Nitrate Poisoning: ', t: 'Nitrate levels in >380 rural Indian districts exceed 45 mg/L, causing Blue Baby Syndrome and health hazards.' },
        { b: 'Farmer Debt Trap: ', t: 'Fertilizer expenses consume 25-30% of total input costs, yet deliver diminishing or stagnant crop yields.' }
      ]
    },
    {
      title: '3. AFFECTED STAKEHOLDERS',
      color: C.primaryDark,
      bgColor: 'F0FDF4',
      points: [
        { b: 'Smallholder & Marginal Farmers: ', t: 'Bear escalating chemical input costs and suffer declining soil fertility and debt accumulation.' },
        { b: 'Rural Communities & Citizens: ', t: 'Consume nitrate-contaminated borewell drinking water and chemical-dense agricultural runoff.' },
        { b: 'Soil Testing Labs & Agronomists: ', t: 'Issue millions of Soil Health Cards that sit unread due to lack of practical dosage translation.' },
        { b: 'Government & National Treasury: ', t: 'Bears an immense annual fertilizer subsidy burden (>₹1.75 Lakh Crore), much of which is literally wasted.' }
      ]
    }
  ];

  const colW = 3.74;
  const colGap = 0.25;

  cards.forEach((c, idx) => {
    const xPos = 0.8 + idx * (colW + colGap);

    slide.addShape(pres.ShapeType.rect, {
      x: xPos, y: 1.6, w: colW, h: 5.25,
      fill: { color: C.bgCard },
      line: { color: C.borderDark, width: 1.2 }
    });

    slide.addShape(pres.ShapeType.rect, {
      x: xPos, y: 1.6, w: colW, h: 0.45,
      fill: { color: c.color }
    });

    slide.addText(c.title, {
      x: xPos + 0.1, y: 1.6, w: colW - 0.2, h: 0.45,
      fontSize: 10.5, bold: true, color: C.white, fontFace: 'Arial', valign: 'middle'
    });

    // Content
    const textRuns = [];
    c.points.forEach(p => {
      textRuns.push({ text: '• ' + p.b, options: { bold: true, color: C.textDark, fontSize: 10 } });
      textRuns.push({ text: p.t + '\n\n', options: { color: C.textMuted, fontSize: 9.5 } });
    });

    slide.addText(textRuns, {
      x: xPos + 0.15, y: 2.15, w: colW - 0.3, h: 4.6,
      valign: 'top', fontFace: 'Arial'
    });
  });
}

// ==========================================
// SLIDE 5: Root Cause Analysis & Stakeholder Dynamics
// ==========================================
{
  const slide = createBaseSlide(5, 'ROOT CAUSE ANALYSIS & CONFLICTING PRIORITIES', 'Template Question: Identify root cause using RCA tools (5-Whys/Fishbone). Stakeholders causing vs affected. Conflicting priorities.');

  // Left Side: 5-Whys Methodology Card
  slide.addShape(pres.ShapeType.rect, {
    x: 0.8, y: 1.6, w: 5.75, h: 5.25,
    fill: { color: C.bgCard },
    line: { color: C.borderDark, width: 1.2 }
  });

  slide.addShape(pres.ShapeType.rect, {
    x: 0.8, y: 1.6, w: 5.75, h: 0.45,
    fill: { color: C.primaryDark }
  });
  slide.addText('5-WHYS ROOT CAUSE ANALYSIS METHODOLOGY', {
    x: 1.0, y: 1.6, w: 5.35, h: 0.45,
    fontSize: 11, bold: true, color: C.white, fontFace: 'Arial', valign: 'middle'
  });

  const whys = [
    { q: 'Why are Indian farmers overusing Urea and DAP?', a: 'Because they follow ancestral habits and local input dealer recommendations rather than soil tests.' },
    { q: 'Why do farmers rely on input dealers rather than Soil Health Cards?', a: 'Soil cards contain lab ppm/kg jargon that farmers cannot translate into physical bag dosages.' },
    { q: 'Why can’t farmers interpret chemical soil metrics?', a: 'Existing government reports lack crop-specific, stage-by-stage temporal application guidance.' },
    { q: 'Why are all fertilizers applied in one or two bulk applications?', a: 'Farmers lack awareness of 4R nutrient stewardship (Right Source, Rate, Time, and Method).' },
    { q: 'ROOT CAUSE: Systemic Information & Tooling Void', a: 'Absence of an explainable, accessible digital decision support system that converts raw laboratory chemistry into clinical, agronomist-validated, stage-wise crop schedules.' }
  ];

  let yOffset = 2.15;
  whys.forEach((w, idx) => {
    const isRoot = idx === 4;
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.95, y: yOffset, w: 5.45, h: isRoot ? 1.05 : 0.82,
      fill: { color: isRoot ? 'FEF2F2' : C.bgCardAlt },
      line: { color: isRoot ? C.accentRed : C.border, width: isRoot ? 1.5 : 1 },
      rectRadius: 0.06
    });

    slide.addText([
      { text: `Why ${idx + 1}: ${w.q}\n`, options: { bold: true, color: isRoot ? C.accentRed : C.primaryDark, fontSize: 9.5 } },
      { text: `➔ ${w.a}`, options: { color: isRoot ? C.textDark : C.textMuted, fontSize: 9, bold: isRoot } }
    ], {
      x: 1.05, y: yOffset + 0.05, w: 5.25, h: isRoot ? 0.95 : 0.72,
      valign: 'middle', fontFace: 'Arial'
    });

    yOffset += isRoot ? 1.12 : 0.89;
  });

  // Right Side: Stakeholder Conflict Matrix
  slide.addShape(pres.ShapeType.rect, {
    x: 6.78, y: 1.6, w: 5.75, h: 5.25,
    fill: { color: C.bgCard },
    line: { color: C.borderDark, width: 1.2 }
  });

  slide.addShape(pres.ShapeType.rect, {
    x: 6.78, y: 1.6, w: 5.75, h: 0.45,
    fill: { color: C.accentAmber }
  });
  slide.addText('STAKEHOLDER DYNAMICS & CONFLICTING PRIORITIES', {
    x: 6.98, y: 1.6, w: 5.35, h: 0.45,
    fontSize: 11, bold: true, color: C.white, fontFace: 'Arial', valign: 'middle'
  });

  slide.addText([
    { text: '1. Fertilizer Retailers (Causing Problem):\n', options: { bold: true, color: C.accentAmber, fontSize: 11 } },
    { text: '• Priority: ', options: { bold: true, color: C.textDark, fontSize: 10 } },
    { text: 'Maximizing commercial bag sales and distributor volume commission.\n', options: { color: C.textMuted, fontSize: 10 } },
    { text: '• Conflict: ', options: { bold: true, color: C.accentRed, fontSize: 10 } },
    { text: 'Pushing high-margin bulk Urea/DAP contradicts the farmer\'s need to cut total fertilizer volume and apply specialized micronutrients.\n\n', options: { color: C.textMuted, fontSize: 10 } },

    { text: '2. Smallholder Farmers (Affected by Problem):\n', options: { bold: true, color: C.primaryDark, fontSize: 11 } },
    { text: '• Priority: ', options: { bold: true, color: C.textDark, fontSize: 10 } },
    { text: 'Protecting immediate harvest yields against seasonal weather risks with minimal outlay.\n', options: { color: C.textMuted, fontSize: 10 } },
    { text: '• Conflict: ', options: { bold: true, color: C.accentRed, fontSize: 10 } },
    { text: 'Fear of crop failure induces emergency over-application of nitrogen, accelerating long-term soil bankruptcy.\n\n', options: { color: C.textMuted, fontSize: 10 } },

    { text: '3. Government Subsidies & Policy Distortion:\n', options: { bold: true, color: C.accentTeal, fontSize: 11 } },
    { text: '• Priority: ', options: { bold: true, color: C.textDark, fontSize: 10 } },
    { text: 'Ensuring food grain security through highly subsidized pricing for urea.\n', options: { color: C.textMuted, fontSize: 10 } },
    { text: '• Conflict: ', options: { bold: true, color: C.accentRed, fontSize: 10 } },
    { text: 'Severe price disparity (Urea heavily subsidized vs unsubsidized Potash/Zinc) incentivizes farmers to overbuy nitrogen.', options: { color: C.textMuted, fontSize: 10 } }
  ], {
    x: 6.98, y: 2.15, w: 5.35, h: 4.6,
    valign: 'top', fontFace: 'Arial'
  });
}

// ==========================================
// SLIDE 6: Data-Based Evidence & References
// ==========================================
{
  const slide = createBaseSlide(6, 'DATA-BASED EVIDENCE & LITERATURE VALIDATION', 'Template Question: Mention evidence based on data to prove the problem exists. Refer to articles, research papers, reports, surveys.');

  const evidenceCards = [
    {
      stat: '72% DROP',
      title: 'Crop Response Ratio Collapse',
      source: 'Fertiliser Association of India (FAI, 2022)',
      desc: 'In 1970, 1 kg of balanced NPK fertilizer produced 13.4 kg of food grain in India. By 2022, that response dropped to only 3.7 kg grain per kg NPK due to severe multi-nutrient depletion and soil exhaustion.',
      color: C.accentRed
    },
    {
      stat: '36.5% DEFICIENT',
      title: 'Nationwide Micronutrient Depletion',
      source: 'ICAR-Indian Institute of Soil Science (IISS, 2021)',
      desc: 'GPS-based national soil mapping across 500+ districts revealed that 36.5% of soils are deficient in Zinc, 23.2% in Boron, 24.7% in Sulfur, and 12.8% in Iron, severely capping yield potential despite heavy NPK use.',
      color: C.accentAmber
    },
    {
      stat: '>45 mg/L',
      title: 'Groundwater Nitrate Pollution',
      source: 'Central Ground Water Board (CGWB, 2021)',
      desc: 'Over 380 agricultural districts report groundwater nitrate concentrations exceeding the BIS/WHO safe drinking water limit of 45 mg/L, directly tracing to excessive urea broadcasting in irrigated belts.',
      color: C.accentBlue
    },
    {
      stat: '< 18% USE',
      title: 'Soil Health Card Adoption Failure',
      source: 'NITI Aayog & Ministry of Agriculture Evaluation',
      desc: 'Nationwide surveys revealed that under 18% of farmers actually implemented Soil Health Card recommendations due to lack of dosage clarity, absence of stage-wise timing, and contradictory dealer advice.',
      color: C.primaryDark
    }
  ];

  // 2x2 Grid of Evidence Cards
  evidenceCards.forEach((ec, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const xPos = 0.8 + col * (5.75 + 0.23);
    const yPos = 1.6 + row * (2.55 + 0.15);

    slide.addShape(pres.ShapeType.roundRect, {
      x: xPos, y: yPos, w: 5.75, h: 2.55,
      fill: { color: C.bgCard },
      line: { color: C.borderDark, width: 1.2 },
      rectRadius: 0.08
    });

    // Stat banner
    slide.addShape(pres.ShapeType.roundRect, {
      x: xPos + 0.2, y: yPos + 0.2, w: 1.8, h: 0.55,
      fill: { color: ec.color },
      rectRadius: 0.06
    });

    slide.addText(ec.stat, {
      x: xPos + 0.2, y: yPos + 0.2, w: 1.8, h: 0.55,
      fontSize: 13, bold: true, color: C.white, align: 'center', valign: 'middle'
    });

    slide.addText(ec.title, {
      x: xPos + 2.15, y: yPos + 0.18, w: 3.4, h: 0.58,
      fontSize: 12, bold: true, color: C.textDark, valign: 'middle', fontFace: 'Arial'
    });

    slide.addText([
      { text: 'Source: ' + ec.source + '\n', options: { italic: true, bold: true, color: C.textSubtle, fontSize: 9 } },
      { text: ec.desc, options: { color: C.textMuted, fontSize: 9.8 } }
    ], {
      x: xPos + 0.2, y: yPos + 0.88, w: 5.35, h: 1.55,
      valign: 'top', fontFace: 'Arial'
    });
  });
}

// ==========================================
// SLIDE 7: State Every Possibility (Ideation)
// ==========================================
{
  const slide = createBaseSlide(7, 'IDEATION: SYSTEMIC EXPLORATION OF ALTERNATIVES', 'Template Question: Brainstorm and state every possibility to solve the problem (minimum 4 distinct approaches).');

  const options = [
    {
      tag: 'ALTERNATIVE A',
      title: 'Manual Field Extension Camps',
      desc: 'Deploy physical agronomists to visit villages and conduct in-person soil diagnosis.',
      pros: 'High personal trust, handles illiteracy.',
      cons: 'Prohibitive manpower cost; India has only 1 extension officer per 1,162 farmers; cannot scale.',
      verdict: 'UNSUSTAINABLE SCALE',
      verdictColor: C.accentRed
    },
    {
      tag: 'ALTERNATIVE B',
      title: 'Static Regional Printing & SMS',
      desc: 'Broadcast generic district-level fertilizer charts via SMS or printed pamphlets.',
      pros: 'Extremely cheap, reaches basic feature phones.',
      cons: 'Zero personalization; fails because individual farm soils vary widely even within the same village.',
      verdict: 'INEFFECTIVE BLANKET',
      verdictColor: C.accentAmber
    },
    {
      tag: 'ALTERNATIVE C',
      title: 'In-Field Optical/Electrochemical IoT',
      desc: 'Install portable spectrophotometric or electrochemical NPK sensor probes in every farm.',
      pros: 'Real-time telemetry, continuous in-situ data.',
      cons: 'Sensors suffer severe calibration drift, electrochemical fouling; high device cost (₹15,000+).',
      verdict: 'CAPEX PROHIBITIVE',
      verdictColor: C.accentAmber
    },
    {
      tag: 'ALTERNATIVE D (SELECTED)',
      title: 'AgriWise 4R AI Decision Web Platform',
      desc: 'Full-stack cloud portal translating standardized lab soil tests into dynamic 6-stage schedules with human review.',
      pros: 'Zero farmer hardware cost; explainable WHY logic; clinical agronomist sign-off; scalable.',
      cons: 'Requires basic internet access; dependency on initial soil sample lab testing.',
      verdict: 'CHOSEN PROPOSAL ★',
      verdictColor: C.primaryDark
    }
  ];

  const optW = 2.76;
  const optGap = 0.23;

  options.forEach((o, idx) => {
    const xPos = 0.8 + idx * (optW + optGap);
    const isChosen = idx === 3;

    slide.addShape(pres.ShapeType.roundRect, {
      x: xPos, y: 1.6, w: optW, h: 5.25,
      fill: { color: isChosen ? 'F0FDF4' : C.bgCard },
      line: { color: isChosen ? C.primaryMedium : C.borderDark, width: isChosen ? 2 : 1.2 },
      rectRadius: 0.08
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: xPos, y: 1.6, w: optW, h: 0.42,
      fill: { color: isChosen ? C.primaryDark : C.accentTeal },
      rectRadius: 0.08
    });

    slide.addText(o.tag, {
      x: xPos, y: 1.6, w: optW, h: 0.42,
      fontSize: 10, bold: true, color: C.white, align: 'center', valign: 'middle'
    });

    slide.addText(o.title, {
      x: xPos + 0.1, y: 2.1, w: optW - 0.2, h: 0.65,
      fontSize: 11, bold: true, color: C.textDark, align: 'center', valign: 'middle', fontFace: 'Arial'
    });

    slide.addText([
      { text: 'Concept:\n', options: { bold: true, color: C.primaryDark, fontSize: 9.5 } },
      { text: o.desc + '\n\n', options: { color: C.textMuted, fontSize: 9 } },
      { text: 'Strengths (+):\n', options: { bold: true, color: '166534', fontSize: 9.5 } },
      { text: o.pros + '\n\n', options: { color: C.textMuted, fontSize: 9 } },
      { text: 'Critical Bottleneck (-):\n', options: { bold: true, color: C.accentRed, fontSize: 9.5 } },
      { text: o.cons, options: { color: C.textMuted, fontSize: 9 } }
    ], {
      x: xPos + 0.12, y: 2.8, w: optW - 0.24, h: 3.4,
      valign: 'top', fontFace: 'Arial'
    });

    // Verdict Badge
    slide.addShape(pres.ShapeType.roundRect, {
      x: xPos + 0.15, y: 6.32, w: optW - 0.3, h: 0.42,
      fill: { color: o.verdictColor },
      rectRadius: 0.06
    });

    slide.addText(o.verdict, {
      x: xPos + 0.15, y: 6.32, w: optW - 0.3, h: 0.42,
      fontSize: 10, bold: true, color: C.white, align: 'center', valign: 'middle'
    });
  });
}

// ==========================================
// SLIDE 8: Idea Proposal (Chosen Concept)
// ==========================================
{
  const slide = createBaseSlide(8, 'IDEA PROPOSAL: AGRIWISE 4R PRECISION PLATFORM', 'Template Question: State chosen idea/concept, why chosen over alternatives, and unique value proposition.');

  // Top Banner: Chosen Idea Definition
  slide.addShape(pres.ShapeType.rect, {
    x: 0.8, y: 1.55, w: 11.73, h: 1.25,
    fill: { color: 'F0FDF4' },
    line: { color: C.primaryMedium, width: 1.5 }
  });

  slide.addText([
    { text: 'THE CHOSEN CONCEPT: AN EXPLAINABLE CLINICAL PRECISION AGRONOMY DSS\n', options: { bold: true, color: C.primaryDark, fontSize: 12 } },
    { text: 'AgriWise is a cloud-native decision-support platform that transforms raw laboratory chemical soil metrics (N, P, K, pH, EC, OC) into actionable, stage-specific fertilizer applications. It combines deterministic agronomic rule algorithms with human-in-the-loop expert agronomist validation to guarantee both scientific accuracy and farmer confidence.', options: { color: C.textDark, fontSize: 10.5 } }
  ], {
    x: 1.0, y: 1.62, w: 11.33, h: 1.1,
    valign: 'top', fontFace: 'Arial'
  });

  // 3 Pillar Columns: Why Chosen, Key Pillars, Unique Value Proposition
  const pillars = [
    {
      title: 'WHY CHOSEN OVER ALTERNATIVES',
      color: C.accentTeal,
      points: [
        { b: 'Zero Capital Expenditure: ', t: 'No costly hardware probes needed. Farmers utilize existing government or commercial soil testing labs.' },
        { b: 'Immediate Scalability: ', t: 'Cloud-hosted on Render; serves unlimited farmers simultaneously across districts without staffing bottlenecks.' },
        { b: 'Scientific Determinism: ', t: 'Implements ICAR Soil Test Crop Response (STCR) equations rather than black-box statistical guesses.' },
        { b: 'Bridging the Literacy Gap: ', t: 'Converts abstract ppm/EC numbers into actual physical fertilizer bag counts (e.g. 50 kg Urea, 25 kg MOP).' }
      ]
    },
    {
      title: 'CORE ARCHITECTURAL PILLARS',
      color: C.primaryMedium,
      points: [
        { b: 'Dual-Portal Collaboration: ', t: 'Dedicated Farmer Interface for field records + Lead Agronomist Clinical Console for verification.' },
        { b: 'Explainable "WHY" Engine: ', t: 'Every recommendation details exactly why a nutrient is prescribed based on soil deficiency thresholds.' },
        { b: '6-Stage Split Calendar: ', t: 'Divides nutrients into Basal, Early Tillering, Active Tillering, Panicle Initiation, Booting, and Maturation.' },
        { b: 'Lifecycle Status Pipeline: ', t: 'Soil tests progress through PENDING ➔ REVIEW_REQUIRED ➔ APPROVED ➔ DISPATCHED.' }
      ]
    },
    {
      title: 'UNIQUE VALUE PROPOSITION (UVP)',
      color: C.accentAmber,
      points: [
        { b: 'Clinical Human-in-the-Loop: ', t: 'Critical anomalies (e.g., pH < 5.5, extreme salinity) require mandatory agronomist sign-off before reaching the farmer.' },
        { b: 'Economic Optimization: ', t: 'Prevents wasteful over-application, cutting farmer fertilizer bills by 25-35% in field testing.' },
        { b: 'Ecological Regeneration: ', t: 'Rebalances soil microbiome and mitigates groundwater nitrate contamination.' },
        { b: 'Live Deployment: ', t: 'Fully functional, publicly accessible web application on Render with MySQL persistence.' }
      ]
    }
  ];

  const pW = 3.74;
  const pGap = 0.25;

  pillars.forEach((p, idx) => {
    const xPos = 0.8 + idx * (pW + pGap);

    slide.addShape(pres.ShapeType.rect, {
      x: xPos, y: 2.95, w: pW, h: 3.9,
      fill: { color: C.bgCard },
      line: { color: C.borderDark, width: 1.2 }
    });

    slide.addShape(pres.ShapeType.rect, {
      x: xPos, y: 2.95, w: pW, h: 0.42,
      fill: { color: p.color }
    });

    slide.addText(p.title, {
      x: xPos + 0.1, y: 2.95, w: pW - 0.2, h: 0.42,
      fontSize: 10, bold: true, color: C.white, fontFace: 'Arial', valign: 'middle'
    });

    const textRuns = [];
    p.points.forEach(pt => {
      textRuns.push({ text: '• ' + pt.b, options: { bold: true, color: C.textDark, fontSize: 9.8 } });
      textRuns.push({ text: pt.t + '\n\n', options: { color: C.textMuted, fontSize: 9.2 } });
    });

    slide.addText(textRuns, {
      x: xPos + 0.15, y: 3.45, w: pW - 0.3, h: 3.3,
      valign: 'top', fontFace: 'Arial'
    });
  });
}

// ==========================================
// SLIDE 9: Prototype Design & System Architecture
// ==========================================
{
  const slide = createBaseSlide(9, 'PROTOTYPE DESIGN & SYSTEM ARCHITECTURE', 'Template Question: Draw prototype design / system architecture diagram. Explain working mechanism and technology stack.');

  // Top Box: System Architecture Flow Diagram (Rendered as 3 Layered Boxes)
  const layers = [
    {
      name: 'TIER 1: PRESENTATION LAYER (UI/UX)',
      tech: 'HTML5, CSS3, Bootstrap 5.3, Vanilla JS, Chart.js, FontAwesome',
      desc: '• Farmer Portal: Farm profile, soil test upload, interactive radar charts, 6-stage application calendar.\n• Admin / Agronomist Console: Queue triage, anomaly verification, one-click approval & prescription edit.',
      color: C.accentTeal,
      x: 0.8, y: 1.55, w: 3.74, h: 3.1
    },
    {
      name: 'TIER 2: APPLICATION & LOGIC LAYER',
      tech: 'Node.js, Express REST APIs, JWT Auth, BCrypt, 4R Engine',
      desc: '• REST Endpoints: /api/auth, /api/soil-test, /api/fertilizers, /api/fields.\n• Deterministic 4R Engine: STCR target yield algorithms, soil buffer weighting, nutrient deficiency rules.\n• Clinical Workflow: Automated severity flagging & anomaly triaging.',
      color: C.primaryDark,
      x: 4.79, y: 1.55, w: 3.74, h: 3.1
    },
    {
      name: 'TIER 3: DATA & INFRASTRUCTURE LAYER',
      tech: 'MySQL 8.0 Cloud Database, Render Cloud Hosting, GitHub CI/CD',
      desc: '• Relational Schema: users, farms, soil_tests, recommendations, fertilizer_catalog.\n• Production Deployment: Deployed on Render Cloud with automated continuous integration from GitHub.\n• Secure Environment: SSL/TLS encryption, JWT authorization.',
      color: C.accentBlue,
      x: 8.78, y: 1.55, w: 3.74, h: 3.1
    }
  ];

  layers.forEach(l => {
    slide.addShape(pres.ShapeType.rect, {
      x: l.x, y: l.y, w: l.w, h: l.h,
      fill: { color: C.bgCard },
      line: { color: C.borderDark, width: 1.2 }
    });

    slide.addShape(pres.ShapeType.rect, {
      x: l.x, y: l.y, w: l.w, h: 0.45,
      fill: { color: l.color }
    });

    slide.addText(l.name, {
      x: l.x + 0.1, y: l.y, w: l.w - 0.2, h: 0.45,
      fontSize: 9.5, bold: true, color: C.white, fontFace: 'Arial', valign: 'middle'
    });

    slide.addText([
      { text: 'Tech Stack: ', options: { bold: true, color: C.primaryDark, fontSize: 9.5 } },
      { text: l.tech + '\n\n', options: { color: C.accentAmber, bold: true, fontSize: 9 } },
      { text: l.desc, options: { color: C.textMuted, fontSize: 9.2 } }
    ], {
      x: l.x + 0.15, y: l.y + 0.52, w: l.w - 0.3, h: l.h - 0.6,
      valign: 'top', fontFace: 'Arial'
    });
  });

  // Bottom Box: Working Mechanism Step-by-Step Table
  slide.addShape(pres.ShapeType.rect, {
    x: 0.8, y: 4.8, w: 11.73, h: 2.1,
    fill: { color: 'F8FAFC' },
    line: { color: C.primaryMedium, width: 1.5 }
  });

  slide.addText('END-TO-END WORKING MECHANISM & DATA FLOW IN AGRIWISE', {
    x: 1.0, y: 4.85, w: 11.33, h: 0.35,
    fontSize: 11, bold: true, color: C.primaryDark, fontFace: 'Arial'
  });

  const flowPoints = [
    { step: '1. Registration & Profiling', text: 'Farmer signs up, registers land boundaries, soil type (Red/Black/Alluvial), and target crop (Paddy/Cotton/Maize).' },
    { step: '2. Soil Test Submission', text: 'Farmer inputs official lab results: Nitrogen (kg/ha), Phosphorus, Potassium, pH, Electrical Conductivity, Organic Carbon %.' },
    { step: '3. 4R Algorithmic Processing', text: 'Engine computes nutrient deficit against ICAR crop targets, calculates commercial bag requirements, and generates split calendar.' },
    { step: '4. Clinical Review & Dispatch', text: 'If soil pH < 5.5 (severe acidity) or salinity is extreme, flagged for Agronomist review. Once approved, delivered to farmer dashboard.' }
  ];

  flowPoints.forEach((fp, idx) => {
    const xPos = 1.0 + idx * 2.85;
    slide.addShape(pres.ShapeType.roundRect, {
      x: xPos, y: 5.25, w: 2.7, h: 1.5,
      fill: { color: C.bgCard },
      line: { color: C.border, width: 1 },
      rectRadius: 0.06
    });

    slide.addText([
      { text: fp.step + '\n', options: { bold: true, color: C.primaryDark, fontSize: 9.5 } },
      { text: fp.text, options: { color: C.textMuted, fontSize: 8.8 } }
    ], {
      x: xPos + 0.08, y: 5.3, w: 2.54, h: 1.4,
      valign: 'top', fontFace: 'Arial'
    });
  });
}

// ==========================================
// SLIDE 10: Implementation Challenges & Future Scope
// ==========================================
{
  const slide = createBaseSlide(10, 'IMPLEMENTATION CHALLENGES & SCOPE OF IMPROVEMENT', 'Template Question: Implementation challenges faced during prototyping. Knowledge gaps identified. Scope of improvement.');

  // Left Card: Implementation Challenges & Gaps
  slide.addShape(pres.ShapeType.rect, {
    x: 0.8, y: 1.6, w: 5.75, h: 5.25,
    fill: { color: C.bgCard },
    line: { color: C.borderDark, width: 1.2 }
  });

  slide.addShape(pres.ShapeType.rect, {
    x: 0.8, y: 1.6, w: 5.75, h: 0.45,
    fill: { color: C.accentAmber }
  });
  slide.addText('CHALLENGES FACED & KNOWLEDGE GAPS IDENTIFIED', {
    x: 1.0, y: 1.6, w: 5.35, h: 0.45,
    fontSize: 11, bold: true, color: C.white, fontFace: 'Arial', valign: 'middle'
  });

  slide.addText([
    { text: '1. Laboratory Reporting Unit Divergence:\n', options: { bold: true, color: C.accentAmber, fontSize: 11 } },
    { text: '• Challenge: ', options: { bold: true, color: C.textDark, fontSize: 10 } },
    { text: 'Different state labs report available nitrogen in divergent units (ppm vs kg/ha vs rating indices Low/Medium/High).\n', options: { color: C.textMuted, fontSize: 9.8 } },
    { text: '• Solution: ', options: { bold: true, color: C.primaryDark, fontSize: 10 } },
    { text: 'Built a dynamic unit-conversion normalization layer in the backend API to standardize all metrics into kg/hectare equivalents.\n\n', options: { color: C.textMuted, fontSize: 9.8 } },

    { text: '2. Soil Buffer Capacity & Texture Variance:\n', options: { bold: true, color: C.accentAmber, fontSize: 11 } },
    { text: '• Challenge: ', options: { bold: true, color: C.textDark, fontSize: 10 } },
    { text: 'Clay soils (Vertisols) retain nutrients significantly longer, whereas Sandy soils (Alfisols) suffer heavy potassium and nitrogen leaching.\n', options: { color: C.textMuted, fontSize: 9.8 } },
    { text: '• Solution: ', options: { bold: true, color: C.primaryDark, fontSize: 10 } },
    { text: 'Incorporated soil texture coefficients into the 4R split application calendar to modify basal vs top-dressing ratios.\n\n', options: { color: C.textMuted, fontSize: 9.8 } },

    { text: '3. Cloud Deployment & Database Persistence:\n', options: { bold: true, color: C.accentAmber, fontSize: 11 } },
    { text: '• Challenge: ', options: { bold: true, color: C.textDark, fontSize: 10 } },
    { text: 'Free-tier cloud environments (Render) spin down during inactivity; secure SSL connection to cloud MySQL required strict certificate handling.\n', options: { color: C.textMuted, fontSize: 9.8 } },
    { text: '• Solution: ', options: { bold: true, color: C.primaryDark, fontSize: 10 } },
    { text: 'Engineered auto-reconnect connection pooling and lightweight health-check pinging.', options: { color: C.textMuted, fontSize: 9.8 } }
  ], {
    x: 1.0, y: 2.15, w: 5.35, h: 4.6,
    valign: 'top', fontFace: 'Arial'
  });

  // Right Card: Scope of Improvement & Future Roadmap
  slide.addShape(pres.ShapeType.rect, {
    x: 6.78, y: 1.6, w: 5.75, h: 5.25,
    fill: { color: C.bgCard },
    line: { color: C.borderDark, width: 1.2 }
  });

  slide.addShape(pres.ShapeType.rect, {
    x: 6.78, y: 1.6, w: 5.75, h: 0.45,
    fill: { color: C.primaryDark }
  });
  slide.addText('FUTURE SCOPE OF IMPROVEMENT & ROADMAP', {
    x: 6.98, y: 1.6, w: 5.35, h: 0.45,
    fontSize: 11, bold: true, color: C.white, fontFace: 'Arial', valign: 'middle'
  });

  slide.addText([
    { text: '1. Mobile Computer Vision (OCR) Soil Card Reader:\n', options: { bold: true, color: C.primaryDark, fontSize: 11 } },
    { text: '• Feature: ', options: { bold: true, color: C.textDark, fontSize: 10 } },
    { text: 'Integrate Tesseract OCR / Google Cloud Vision to allow farmers to simply photograph paper Soil Health Cards, auto-populating all NPK and pH values instantly.\n\n', options: { color: C.textMuted, fontSize: 9.8 } },

    { text: '2. Vernacular Voice Interface & WhatsApp Bot:\n', options: { bold: true, color: C.primaryDark, fontSize: 11 } },
    { text: '• Feature: ', options: { bold: true, color: C.textDark, fontSize: 10 } },
    { text: 'Deploy speech-to-text audio guidance in regional languages (Telugu, Hindi, Kannada, Tamil) and deliver stage fertilizer reminders directly via WhatsApp Business API.\n\n', options: { color: C.textMuted, fontSize: 9.8 } },

    { text: '3. Satellite NDVI & Live Weather Synchronization:\n', options: { bold: true, color: C.primaryDark, fontSize: 11 } },
    { text: '• Feature: ', options: { bold: true, color: C.textDark, fontSize: 10 } },
    { text: 'Connect Sentinel-2 satellite imagery to track vegetative vigor (NDVI) and pull OpenWeatherMap forecasts to prevent fertilizer broadcasting 48 hours prior to heavy rainfall events.\n\n', options: { color: C.textMuted, fontSize: 9.8 } },

    { text: '4. LoRaWAN In-Situ IoT Soil Moisture Telemetry:\n', options: { bold: true, color: C.primaryDark, fontSize: 11 } },
    { text: '• Feature: ', options: { bold: true, color: C.textDark, fontSize: 10 } },
    { text: 'Add optional low-cost soil moisture and electrical conductivity probes for precision fertigation in commercial orchards and polyhouses.', options: { color: C.textMuted, fontSize: 9.8 } }
  ], {
    x: 6.98, y: 2.15, w: 5.35, h: 4.6,
    valign: 'top', fontFace: 'Arial'
  });
}

// ==========================================
// SLIDE 11: References, Demonstration & Links
// ==========================================
{
  const slide = createBaseSlide(11, 'REFERENCES, DEMONSTRATION LINKS & CREDITS', 'Project Artifacts, Scientific Literature, Institutional Acknowledgements & Live Demonstration');

  // Top Left: Project Links & Demonstration Card
  slide.addShape(pres.ShapeType.rect, {
    x: 0.8, y: 1.6, w: 5.75, h: 2.5,
    fill: { color: 'F0FDF4' },
    line: { color: C.primaryMedium, width: 1.5 }
  });

  slide.addShape(pres.ShapeType.rect, {
    x: 0.8, y: 1.6, w: 5.75, h: 0.42,
    fill: { color: C.primaryDark }
  });
  slide.addText('LIVE PROJECT DEMONSTRATION & REPOSITORY', {
    x: 1.0, y: 1.6, w: 5.35, h: 0.42,
    fontSize: 11, bold: true, color: C.white, fontFace: 'Arial', valign: 'middle'
  });

  slide.addText([
    { text: '• Live Production Application:\n', options: { bold: true, color: C.textDark, fontSize: 11 } },
    { text: '  https://agriwise-fertilizer.onrender.com\n', options: { color: C.accentBlue, bold: true, fontSize: 11.5, hyperlink: { url: 'https://agriwise-fertilizer.onrender.com' } } },
    { text: '  (Publicly accessible cloud deployment with full end-to-end functionality)\n\n', options: { color: C.textMuted, fontSize: 9.5 } },
    { text: '• GitHub Source Code Repository:\n', options: { bold: true, color: C.textDark, fontSize: 11 } },
    { text: '  https://github.com/24eg105t07-create/FERTILIZER\n', options: { color: C.accentBlue, bold: true, fontSize: 11, hyperlink: { url: 'https://github.com/24eg105t07-create/FERTILIZER' } } },
    { text: '  (Full-stack codebase: Node/Express backend, MySQL schema, frontend UI)', options: { color: C.textMuted, fontSize: 9.5 } }
  ], {
    x: 1.0, y: 2.1, w: 5.35, h: 1.9,
    valign: 'top', fontFace: 'Arial'
  });

  // Bottom Left: Acknowledgements & Guide
  slide.addShape(pres.ShapeType.rect, {
    x: 0.8, y: 4.3, w: 5.75, h: 2.55,
    fill: { color: C.bgCardAlt },
    line: { color: C.borderDark, width: 1.2 }
  });

  slide.addShape(pres.ShapeType.rect, {
    x: 0.8, y: 4.3, w: 5.75, h: 0.42,
    fill: { color: C.accentTeal }
  });
  slide.addText('INSTITUTIONAL ACKNOWLEDGEMENTS', {
    x: 1.0, y: 4.3, w: 5.35, h: 0.42,
    fontSize: 11, bold: true, color: C.white, fontFace: 'Arial', valign: 'middle'
  });

  slide.addText([
    { text: '• Department: ', options: { bold: true, color: C.textDark, fontSize: 10.5 } },
    { text: 'Department of Computer Science & Engineering\n', options: { color: C.primaryDark, bold: true, fontSize: 10.5 } },
    { text: '• Institution: ', options: { bold: true, color: C.textDark, fontSize: 10.5 } },
    { text: 'Anurag University, Venkatapur, Ghatkesar, Hyderabad\n\n', options: { color: C.primaryDark, bold: true, fontSize: 10.5 } },
    { text: '• Presenter: ', options: { bold: true, color: C.textDark, fontSize: 10.5 } },
    { text: 'Sai Vardhan Reddy (Roll No: 24EG105T07)\n\n', options: { color: C.accentAmber, bold: true, fontSize: 11 } },
    { text: 'Sincere gratitude to the Faculty Mentor, Evaluators, and Agronomy Collaborators for guidance in domain calibration and software architecture.', options: { italic: true, color: C.textMuted, fontSize: 9.5 } }
  ], {
    x: 1.0, y: 4.8, w: 5.35, h: 1.95,
    valign: 'top', fontFace: 'Arial'
  });

  // Right Side: Academic & Regulatory References
  slide.addShape(pres.ShapeType.rect, {
    x: 6.78, y: 1.6, w: 5.75, h: 5.25,
    fill: { color: C.bgCard },
    line: { color: C.borderDark, width: 1.2 }
  });

  slide.addShape(pres.ShapeType.rect, {
    x: 6.78, y: 1.6, w: 5.75, h: 0.45,
    fill: { color: C.primaryDark }
  });
  slide.addText('SCIENTIFIC & REGULATORY REFERENCES', {
    x: 6.98, y: 1.6, w: 5.35, h: 0.45,
    fontSize: 11, bold: true, color: C.white, fontFace: 'Arial', valign: 'middle'
  });

  const references = [
    { num: '[1]', ref: 'Food and Agriculture Organization (FAO) & International Fertilizer Industry Association (IFA). (2016). "4R Plant Nutrition: A Manual for Improving the Management of Plant Nutrition". Rome, Italy.' },
    { num: '[2]', ref: 'Indian Council of Agricultural Research (ICAR) - All India Coordinated Research Project on Soil Test Crop Response (AICRP-STCR). "Soil Test Based Fertilizer Recommendations for Targeted Crop Yields". New Delhi.' },
    { num: '[3]', ref: 'The Fertiliser Association of India (FAI). (2022). "Fertiliser Statistics 2021-22: Crop Response Ratios and Macro-Micro Nutrient Consumption Trends". New Delhi.' },
    { num: '[4]', ref: 'Central Ground Water Board (CGWB), Ministry of Jal Shakti. (2021). "Groundwater Quality in Shallow Aquifers of India: Nitrate Concentration and Health Implications". Faridabad.' },
    { num: '[5]', ref: 'Prasad, R. (2009). "Efficient Fertilizer Use: The Key to Food Security and Environmental Quality". Indian Journal of Agronomy, 54(2), 101-109.' },
    { num: '[6]', ref: 'Ministry of Agriculture and Farmers Welfare, Government of India. "Operational Guidelines: Soil Health Card Scheme". Krishi Bhawan, New Delhi.' }
  ];

  const refRuns = [];
  references.forEach(r => {
    refRuns.push({ text: r.num + ' ', options: { bold: true, color: C.primaryMedium, fontSize: 9 } });
    refRuns.push({ text: r.ref + '\n\n', options: { color: C.textDark, fontSize: 8.8 } });
  });

  slide.addText(refRuns, {
    x: 6.98, y: 2.15, w: 5.35, h: 4.6,
    valign: 'top', fontFace: 'Arial'
  });
}

// Write the presentation file
const outputPath = path.resolve('AgriWise_Presentation.pptx');
const artifactPath = path.resolve('C:/Users/harin/.gemini/antigravity/brain/8be4a11e-2d35-4ed5-97c8-0e4751963b83/AgriWise_Presentation.pptx');

pres.writeFile({ fileName: outputPath })
  .then(f => {
    console.log('Successfully saved to:', outputPath);
    try {
      fs.copyFileSync(outputPath, artifactPath);
      console.log('Successfully copied to artifact directory:', artifactPath);
    } catch(e) {
      console.error('Error copying to artifact:', e.message);
    }
  })
  .catch(err => {
    console.error('Error creating presentation:', err);
  });
