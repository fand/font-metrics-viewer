const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const fontFamilySelect = document.getElementById("fontFamily");
const fontSizeInput = document.getElementById("fontSize");
const lineHeightAutoCheckbox = document.getElementById("lineHeightAuto");
const lineHeightInput = document.getElementById("lineHeight");
const textDisplay = document.getElementById("textDisplay");

let currentFont = null;
const loadedFonts = new Map();

const METRICS_COLORS = {
  baseline: "#ff0000",
  ascender: "#00ff00",
  descender: "#0000ff",
  capHeight: "#ff00ff",
  xHeight: "#ffaa00",
  lineGap: "#00ffff",
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

  const fontSize = parseInt(fontSizeInput.value);
  const lineHeight = lineHeightAutoCheckbox.checked
    ? "normal"
    : parseFloat(lineHeightInput.value);

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
  const fontSize = parseInt(fontSizeInput.value);
  const lineHeight = lineHeightAutoCheckbox.checked
    ? "normal"
    : parseFloat(lineHeightInput.value);

  const metrics = getMetrics(currentFont, fontSize);

  const padding = 60;

  // Get visualizer container width
  const visualizerContent = document.querySelector(".visualizer-content");
  const containerWidth = visualizerContent.offsetWidth;

  // Set font before measuring text
  ctx.font = `${fontSize}px "${fontFamilySelect.value}", sans-serif`;
  const textWidth = ctx.measureText(text).width;

  const lineHeightPx =
    lineHeight === "normal"
      ? metrics.ascender - metrics.descender + metrics.lineGap
      : fontSize * lineHeight;

  // Canvas should fill the container width
  canvas.width = containerWidth;
  canvas.height = lineHeightPx + padding * 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const baselineY =
    canvas.height / 2 +
    (metrics.ascender - metrics.descender) / 2 +
    metrics.descender;

  // Draw metric lines
  ctx.strokeStyle = METRICS_COLORS.baseline;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(0, baselineY);
  ctx.lineTo(canvas.width, baselineY);
  ctx.stroke();

  ctx.strokeStyle = METRICS_COLORS.ascender;
  ctx.beginPath();
  ctx.moveTo(0, baselineY - metrics.ascender);
  ctx.lineTo(canvas.width, baselineY - metrics.ascender);
  ctx.stroke();

  ctx.strokeStyle = METRICS_COLORS.descender;
  ctx.beginPath();
  ctx.moveTo(0, baselineY - metrics.descender);
  ctx.lineTo(canvas.width, baselineY - metrics.descender);
  ctx.stroke();

  ctx.strokeStyle = METRICS_COLORS.capHeight;
  ctx.beginPath();
  ctx.moveTo(0, baselineY - metrics.capHeight);
  ctx.lineTo(canvas.width, baselineY - metrics.capHeight);
  ctx.stroke();

  ctx.strokeStyle = METRICS_COLORS.xHeight;
  ctx.beginPath();
  ctx.moveTo(0, baselineY - metrics.xHeight);
  ctx.lineTo(canvas.width, baselineY - metrics.xHeight);
  ctx.stroke();

  ctx.setLineDash([]);

  // Update HTML text display (contenteditableなので、テキストは変更しない)
  textDisplay.style.fontFamily = `"${fontFamilySelect.value}", sans-serif`;
  textDisplay.style.fontSize = `${fontSize}px`;
  textDisplay.style.lineHeight = `${lineHeightPx}px`;

  // Visualizer-contentの高さを設定
  visualizerContent.style.height = `${canvas.height}px`;

  // Draw labels
  ctx.font = "12px sans-serif";
  ctx.textAlign = "right";
  ctx.fillStyle = METRICS_COLORS.baseline;
  ctx.fillText("baseline", canvas.width - 10, baselineY - 5);

  ctx.fillStyle = METRICS_COLORS.ascender;
  ctx.fillText("ascender", canvas.width - 10, baselineY - metrics.ascender - 5);

  ctx.fillStyle = METRICS_COLORS.descender;
  ctx.fillText(
    "descender",
    canvas.width - 10,
    baselineY - metrics.descender + 15
  );

  ctx.fillStyle = METRICS_COLORS.capHeight;
  ctx.fillText(
    "cap height",
    canvas.width - 10,
    baselineY - metrics.capHeight - 5
  );

  ctx.fillStyle = METRICS_COLORS.xHeight;
  ctx.fillText("x-height", canvas.width - 10, baselineY - metrics.xHeight - 5);
}

async function updateVisualization() {
  const fontFamily = fontFamilySelect.value;
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

// Event listeners
fontFamilySelect.addEventListener("change", updateVisualization);
fontSizeInput.addEventListener("input", () => {
  updateMetricsDisplay();
  drawVisualization();
});
lineHeightInput.addEventListener("input", () => {
  updateMetricsDisplay();
  drawVisualization();
});

lineHeightAutoCheckbox.addEventListener("change", (e) => {
  lineHeightInput.disabled = e.target.checked;
  updateMetricsDisplay();
  drawVisualization();
});

// Redraw when text is edited
textDisplay.addEventListener("input", drawVisualization);

// Initialize
textDisplay.textContent = "Hej!";
updateVisualization();
