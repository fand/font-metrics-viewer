const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const textDisplay = document.getElementById("textDisplay");

let currentFont = null;
const loadedFonts = new Map();

// Tweakpane setup
const pane = new Tweakpane.Pane({
  container: document.getElementById("tweakpane"),
  title: "Parameters",
});

// Parameters object
const params = {
  fontFamily: "Inter",
  fontSize: 200,
  lineHeightAuto: true,
  lineHeight: 1.2,
};

// Font family options
const fontOptions = [
  { text: "Inter", value: "Inter" },
  { text: "Roboto", value: "Roboto" },
  { text: "Open Sans", value: "Open Sans" },
  { text: "Lato", value: "Lato" },
  { text: "Montserrat", value: "Montserrat" },
  { text: "Raleway", value: "Raleway" },
  { text: "Poppins", value: "Poppins" },
  { text: "Playfair Display", value: "Playfair Display" },
  { text: "Merriweather", value: "Merriweather" },
  { text: "Source Sans Pro", value: "Source Sans Pro" },
  { text: "Ubuntu", value: "Ubuntu" },
  { text: "Oswald", value: "Oswald" },
  { text: "Nunito", value: "Nunito" },
  { text: "Work Sans", value: "Work Sans" },
  { text: "Quicksand", value: "Quicksand" },
  { text: "Bebas Neue", value: "Bebas Neue" },
  { text: "Fira Sans", value: "Fira Sans" },
  { text: "Barlow", value: "Barlow" },
  { text: "IBM Plex Sans", value: "IBM Plex Sans" },
  { text: "Cabin", value: "Cabin" },
  { text: "Comfortaa", value: "Comfortaa" },
  { text: "Dancing Script", value: "Dancing Script" },
  { text: "Pacifico", value: "Pacifico" },
  { text: "Lobster", value: "Lobster" },
  { text: "Shadows Into Light", value: "Shadows Into Light" },
  { text: "Permanent Marker", value: "Permanent Marker" },
  { text: "Caveat", value: "Caveat" },
  { text: "Satisfy", value: "Satisfy" },
  { text: "Great Vibes", value: "Great Vibes" },
  { text: "Noto Sans JP", value: "Noto Sans JP" },
  { text: "Noto Serif JP", value: "Noto Serif JP" },
  { text: "M PLUS Rounded 1c", value: "M PLUS Rounded 1c" },
  { text: "Kosugi Maru", value: "Kosugi Maru" },
  { text: "Sawarabi Gothic", value: "Sawarabi Gothic" },
  { text: "Klee One", value: "Klee One" },
  { text: "Dela Gothic One", value: "Dela Gothic One" },
  { text: "Shippori Mincho", value: "Shippori Mincho" },
];

// Add controls
pane
  .addInput(params, "fontFamily", {
    options: fontOptions.reduce((acc, option) => {
      acc[option.text] = option.value;
      return acc;
    }, {}),
  })
  .on("change", () => {
    updateVisualization();
  });

pane
  .addInput(params, "fontSize", {
    min: 10,
    max: 500,
    step: 1,
  })
  .on("change", () => {
    updateMetricsDisplay();
    drawVisualization();
  });

pane.addInput(params, "lineHeightAuto").on("change", () => {
  updateMetricsDisplay();
  drawVisualization();
});

const lineHeightInput = pane
  .addInput(params, "lineHeight", {
    min: 0.5,
    max: 3,
    step: 0.1,
    disabled: params.lineHeightAuto,
  })
  .on("change", () => {
    updateMetricsDisplay();
    drawVisualization();
  });

// Disable line height when auto is checked
pane.on("change", (ev) => {
  if (ev.target.presetKey === "lineHeightAuto") {
    lineHeightInput.disabled = params.lineHeightAuto;
  }
});

// Position tweakpane
pane.element.style.position = "fixed";
pane.element.style.top = "20px";
pane.element.style.right = "20px";
pane.element.style.zIndex = "2";

const METRICS_COLORS = {
  baseline: "rgba(255, 0, 0, 0.8)",
  ascender: "rgba(255, 0, 0, 0.8)",
  descender: "rgba(255, 0, 0, 0.8)",
  capHeight: "rgba(255, 0, 0, 0.8)",
  xHeight: "rgba(255, 0, 0, 0.8)",
  lineGap: "#00ffff",
  lineGapNegative: "#ff6600",
};

async function loadGoogleFont(fontFamily) {
  if (loadedFonts.has(fontFamily)) {
    return loadedFonts.get(fontFamily);
  }

  // Google Fonts APIからCSSを取得
  const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(
    " ",
    "+"
  )}`;

  try {
    // 直接Google FontsのCSSを取得
    const response = await fetch(fontUrl);
    const css = await response.text();

    console.log("CSS Response:", css.substring(0, 200));

    // CSSからフォントURLを抽出（woff2形式）
    const fontUrlMatch = css.match(
      /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/
    );

    if (fontUrlMatch) {
      let fontFileUrl = fontUrlMatch[1];
      console.log("Found font URL:", fontFileUrl);

      // URLから引用符を削除
      fontFileUrl = fontFileUrl.replace(/['"]/g, "");

      try {
        // フォントファイルをバイナリとして取得
        const fontResponse = await fetch(fontFileUrl);
        const fontBuffer = await fontResponse.arrayBuffer();

        // Fontkitでフォントを読み込む
        const font = fontkit.create(new Uint8Array(fontBuffer));
        loadedFonts.set(fontFamily, font);
        console.log("Font loaded successfully with Fontkit:", font);

        // 表示用にもCSSを追加
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(
          " ",
          "+"
        )}:wght@400&display=swap`;
        document.head.appendChild(link);

        // フォントが実際に読み込まれるまで待つ
        await document.fonts.load(`16px "${fontFamily}"`);

        return font;
      } catch (error) {
        console.error("Error loading font file:", error);
      }
    }
  } catch (error) {
    console.error("Error fetching font CSS:", error);
  }

  // フォールバック: 表示用のみ読み込む
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(
    " ",
    "+"
  )}:wght@400&display=swap`;
  document.head.appendChild(link);

  await new Promise((resolve) => {
    link.onload = resolve;
    setTimeout(resolve, 1000);
  });

  // フォントが実際に読み込まれるまで待つ
  try {
    await document.fonts.load(`16px "${fontFamily}"`);
  } catch (e) {
    console.log("Font loading fallback");
  }

  console.warn(`Could not load font for ${fontFamily}, using fallback`);
  return null;
}

function getMetrics(font, fontSize) {
  if (!font) {
    // フォールバックメトリクス
    return {
      ascender: fontSize * 0.8,
      descender: fontSize * -0.2,
      lineGap: 0,
      capHeight: fontSize * 0.7,
      xHeight: fontSize * 0.5,
    };
  }

  // Fontkitのメトリクスを使用
  const scale = fontSize / font.unitsPerEm;

  return {
    ascender: font.ascent * scale,
    descender: font.descent * scale,
    lineGap: (font.lineGap || 0) * scale,
    capHeight: (font.capHeight || font.ascent * 0.8) * scale,
    xHeight: (font.xHeight || font.ascent * 0.5) * scale,
    unitsPerEm: font.unitsPerEm,
    scale: scale,
  };
}

function updateMetricsDisplay() {
  const unitsPerEmEl = document.getElementById("unitsPerEm");
  const ascentEl = document.getElementById("ascentValue");
  const descentEl = document.getElementById("descentValue");
  const lineGapEl = document.getElementById("lineGapValue");
  const topToBaselineFormulaEl = document.getElementById(
    "topToBaselineFormula"
  );
  const topToBaselineValueEl = document.getElementById("topToBaselineValue");
  const halfLeadingFormulaEl = document.getElementById("halfLeadingFormula");
  const halfLeadingValueEl = document.getElementById("halfLeadingValue");

  const fontSize = params.fontSize;
  const lineHeight = params.lineHeightAuto ? "normal" : params.lineHeight;

  if (currentFont) {
    unitsPerEmEl.textContent = currentFont.unitsPerEm;
    ascentEl.textContent = currentFont.ascent;
    descentEl.textContent = currentFont.descent;
    lineGapEl.textContent = currentFont.lineGap || 0;

    // Calculate Top to Baseline
    const topToBaseline =
      (currentFont.ascent / currentFont.unitsPerEm) * fontSize;
    topToBaselineFormulaEl.textContent = `${currentFont.ascent} / ${currentFont.unitsPerEm} × ${fontSize}`;
    topToBaselineValueEl.textContent = `${topToBaseline.toFixed(2)} px`;

    // Calculate Half Leading
    const metrics = getMetrics(currentFont, fontSize);
    const lineHeightPx =
      lineHeight === "normal"
        ? metrics.ascender - metrics.descender + metrics.lineGap
        : fontSize * lineHeight;
    const fontHeight = metrics.ascender - metrics.descender;
    const halfLeading = (lineHeightPx - fontHeight) / 2;

    const lineHeightStr =
      lineHeight === "normal" ? "auto" : `${fontSize} × ${lineHeight}`;
    halfLeadingFormulaEl.textContent = `(${lineHeightStr} - ${fontHeight.toFixed(
      1
    )}) / 2`;
    halfLeadingValueEl.textContent = `${halfLeading.toFixed(2)} px`;
  } else {
    unitsPerEmEl.textContent = "-";
    ascentEl.textContent = "-";
    descentEl.textContent = "-";
    lineGapEl.textContent = "-";
    topToBaselineFormulaEl.textContent = "-";
    topToBaselineValueEl.textContent = "-";
    halfLeadingFormulaEl.textContent = "-";
    halfLeadingValueEl.textContent = "-";
  }
}

function drawVisualization() {
  const text = textDisplay.textContent || "Hej!";
  const fontSize = params.fontSize;
  const lineHeight = params.lineHeightAuto ? "normal" : params.lineHeight;

  const metrics = getMetrics(currentFont, fontSize);

  const padding = 60;

  // Get visualizer container width
  const visualizerContent = document.querySelector(".visualizer-content");
  const containerWidth = visualizerContent.offsetWidth;

  // Set font before measuring text
  ctx.font = `${fontSize}px "${params.fontFamily}", sans-serif`;
  const textWidth = ctx.measureText(text).width;

  const lineHeightPx =
    lineHeight === "normal"
      ? metrics.ascender - metrics.descender + metrics.lineGap
      : fontSize * lineHeight;

  // Always render at 2x resolution
  const dpr = 2;

  // Canvas should fill the container width
  const canvasWidth = containerWidth;
  const canvasHeight = lineHeightPx + padding * 2;
  canvas.width = canvasWidth * dpr;
  canvas.height = canvasHeight * dpr;
  canvas.style.width = canvasWidth + "px";
  canvas.style.height = canvasHeight + "px";

  // Scale context for retina
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, containerWidth, lineHeightPx + padding * 2);

  const baselineY =
    (lineHeightPx + padding * 2) / 2 +
    (metrics.ascender - metrics.descender) / 2 +
    metrics.descender;

  // Draw metric lines
  ctx.strokeStyle = METRICS_COLORS.baseline;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, baselineY);
  ctx.lineTo(canvasWidth, baselineY);
  ctx.stroke();

  ctx.strokeStyle = METRICS_COLORS.ascender;
  ctx.beginPath();
  ctx.moveTo(0, baselineY - metrics.ascender);
  ctx.lineTo(canvasWidth, baselineY - metrics.ascender);
  ctx.stroke();

  ctx.strokeStyle = METRICS_COLORS.descender;
  ctx.beginPath();
  ctx.moveTo(0, baselineY - metrics.descender);
  ctx.lineTo(canvasWidth, baselineY - metrics.descender);
  ctx.stroke();

  ctx.strokeStyle = METRICS_COLORS.capHeight;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(0, baselineY - metrics.capHeight);
  ctx.lineTo(canvasWidth, baselineY - metrics.capHeight);
  ctx.stroke();

  ctx.strokeStyle = METRICS_COLORS.xHeight;
  ctx.beginPath();
  ctx.moveTo(0, baselineY - metrics.xHeight);
  ctx.lineTo(canvasWidth, baselineY - metrics.xHeight);
  ctx.stroke();

  ctx.setLineDash([]);

  // Draw Half Leading areas
  const fontHeight = metrics.ascender - metrics.descender;
  const halfLeading = (lineHeightPx - fontHeight) / 2;

  {
    let topMin = baselineY - metrics.ascender - halfLeading;
    let bottomMin = baselineY - metrics.descender;

    ctx.fillStyle = "rgba(0, 128, 255, 0.1)";
    ctx.fillRect(0, topMin, canvas.width, halfLeading);
    ctx.fillRect(0, bottomMin, canvas.width, halfLeading);

    // Half leading labels
    ctx.fillStyle = "rgba(0, 128, 255, 0.8)";

    let topLabel = baselineY - metrics.ascender - Math.max(0, halfLeading);
    let bottomLabel = baselineY - metrics.descender + Math.max(0, halfLeading);

    ctx.fillText("half leading", 10, topLabel + 15);
    ctx.fillText("half leading", 10, bottomLabel - 5);
  }

  // Update HTML text display (contenteditableなので、テキストは変更しない)
  textDisplay.style.fontFamily = `"${params.fontFamily}", sans-serif`;
  textDisplay.style.fontSize = `${fontSize}px`;
  textDisplay.style.lineHeight = `${lineHeightPx}px`;

  // Let the content auto-size based on text
  visualizerContent.style.height = "auto";

  // Draw labels
  ctx.font = "12px sans-serif";
  ctx.textAlign = "right";
  ctx.fillStyle = METRICS_COLORS.baseline;
  ctx.fillText("baseline", canvasWidth - 10, baselineY - 5);

  ctx.fillStyle = METRICS_COLORS.ascender;
  ctx.fillText("ascender", canvasWidth - 10, baselineY - metrics.ascender - 5);

  ctx.fillStyle = METRICS_COLORS.descender;
  ctx.fillText(
    "descender",
    canvasWidth - 10,
    baselineY - metrics.descender + 15
  );

  ctx.fillStyle = METRICS_COLORS.capHeight;
  ctx.fillText(
    "cap height",
    canvasWidth - 10,
    baselineY - metrics.capHeight - 5
  );

  ctx.fillStyle = METRICS_COLORS.xHeight;
  ctx.fillText("x-height", canvasWidth - 10, baselineY - metrics.xHeight - 5);
}

async function updateVisualization() {
  const fontFamily = params.fontFamily;
  console.log("Loading font:", fontFamily);

  // ローディング表示
  ctx.fillStyle = "#666";
  ctx.font = "16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Loading font...", canvas.width / 2, canvas.height / 2);

  currentFont = await loadGoogleFont(fontFamily);
  console.log("Font loaded:", currentFont ? "Success" : "Using fallback");

  // Update metrics display
  updateMetricsDisplay();

  // Always draw visualization
  drawVisualization();
}

// Redraw when text is edited
textDisplay.addEventListener("input", drawVisualization);

// Initialize
textDisplay.textContent = "Hej!";
updateVisualization();
