const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const textInput = document.getElementById('textInput');
const fontFamilySelect = document.getElementById('fontFamily');
const fontSizeInput = document.getElementById('fontSize');
const lineHeightAutoCheckbox = document.getElementById('lineHeightAuto');
const lineHeightInput = document.getElementById('lineHeight');

let currentFont = null;
const loadedFonts = new Map();

const METRICS_COLORS = {
    baseline: '#ff0000',
    ascender: '#00ff00',
    descender: '#0000ff',
    capHeight: '#ff00ff',
    xHeight: '#ffaa00',
    lineGap: '#00ffff'
};

async function loadGoogleFont(fontFamily) {
    if (loadedFonts.has(fontFamily)) {
        return loadedFonts.get(fontFamily);
    }

    const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(' ', '+')}:wght@400&display=swap`;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontUrl;
    document.head.appendChild(link);

    await new Promise(resolve => {
        link.onload = resolve;
    });

    const fontFaceRule = Array.from(document.styleSheets)
        .flatMap(sheet => {
            try {
                return Array.from(sheet.cssRules || []);
            } catch (e) {
                return [];
            }
        })
        .find(rule => rule.type === CSSRule.FONT_FACE_RULE && rule.style.fontFamily.includes(fontFamily));

    if (fontFaceRule) {
        const fontFileUrl = fontFaceRule.style.src.match(/url\("?([^"]+)"?\)/)[1];
        
        try {
            const font = await opentype.load(fontFileUrl);
            loadedFonts.set(fontFamily, font);
            return font;
        } catch (error) {
            console.error('Error loading font:', error);
            return null;
        }
    }
    
    return null;
}

function getMetrics(font, fontSize) {
    const scale = fontSize / font.unitsPerEm;
    
    return {
        ascender: font.ascender * scale,
        descender: font.descender * scale,
        lineGap: (font.lineGap || 0) * scale,
        capHeight: (font.tables.os2?.sCapHeight || font.ascender * 0.8) * scale,
        xHeight: (font.tables.os2?.sxHeight || font.ascender * 0.5) * scale,
        unitsPerEm: font.unitsPerEm,
        scale: scale
    };
}

function drawVisualization() {
    if (!currentFont) return;

    const text = textInput.value || 'Hej!';
    const fontSize = parseInt(fontSizeInput.value);
    const lineHeight = lineHeightAutoCheckbox.checked ? 'normal' : parseFloat(lineHeightInput.value);
    
    const metrics = getMetrics(currentFont, fontSize);
    
    const padding = 60;
    const textWidth = ctx.measureText(text).width;
    
    const lineHeightPx = lineHeight === 'normal' 
        ? (metrics.ascender - metrics.descender + metrics.lineGap)
        : fontSize * lineHeight;
    
    canvas.width = Math.max(800, textWidth + padding * 2);
    canvas.height = lineHeightPx + padding * 2;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const baselineY = canvas.height / 2 + (metrics.ascender - metrics.descender) / 2 + metrics.descender;
    
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
    
    ctx.font = `${fontSize}px "${fontFamilySelect.value}"`;
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, canvas.width / 2, baselineY);
    
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = METRICS_COLORS.baseline;
    ctx.fillText('baseline', canvas.width - 10, baselineY - 5);
    
    ctx.fillStyle = METRICS_COLORS.ascender;
    ctx.fillText('ascender', canvas.width - 10, baselineY - metrics.ascender - 5);
    
    ctx.fillStyle = METRICS_COLORS.descender;
    ctx.fillText('descender', canvas.width - 10, baselineY - metrics.descender + 15);
    
    ctx.fillStyle = METRICS_COLORS.capHeight;
    ctx.fillText('cap height', canvas.width - 10, baselineY - metrics.capHeight - 5);
    
    ctx.fillStyle = METRICS_COLORS.xHeight;
    ctx.fillText('x-height', canvas.width - 10, baselineY - metrics.xHeight - 5);
}

async function updateVisualization() {
    const fontFamily = fontFamilySelect.value;
    currentFont = await loadGoogleFont(fontFamily);
    
    if (currentFont) {
        drawVisualization();
    }
}

textInput.addEventListener('input', drawVisualization);
fontFamilySelect.addEventListener('change', updateVisualization);
fontSizeInput.addEventListener('input', drawVisualization);
lineHeightInput.addEventListener('input', drawVisualization);

lineHeightAutoCheckbox.addEventListener('change', (e) => {
    lineHeightInput.disabled = e.target.checked;
    drawVisualization();
});

updateVisualization();