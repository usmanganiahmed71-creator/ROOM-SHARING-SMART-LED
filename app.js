/**
 * HALO - SMART ADAPTIVE ILLUMINATION (DIRECTIONAL & MULTI-SECTOR LED BULB SIMULATION)
 * Pair Programming & Statistical Lab Demo:
 * Abdullah Aijaz (25BYB0123), Aarnav Bahadur Mathur (25BYB0141), Usman Gani Ahmed (25BYB0150)
 * Guided by Dr. Yamuna M
 */

// ============================================================================
// SYSTEM STATE
// ============================================================================
const state = {
  // Emission Mode: 'smart' (Multi-Sector) or 'continuous' (Single Steered Beam)
  mode: 'smart',

  // Continuous Mode parameters
  angle: 270,           // Steering Azimuth: 270 = West (Desk in default layout)
  spread: 80,           // Continuous beam spread (30° to 360°)

  // Smart Light Mode parameters (8 discrete 45° sectors around the circle)
  // Sector 0: 0°-45° (North / Door)
  // Sector 1: 45°-90° (North-East)
  // Sector 2: 90°-135° (East / Bed in default layout)
  // Sector 3: 135°-180° (South-East)
  // Sector 4: 180°-225° (South / Window)
  // Sector 5: 225°-270° (South-West)
  // Sector 6: 270°-315° (West / Desk in default layout)
  // Sector 7: 315°-360° (North-West)
  activeSectors: new Set([6]), // Default: Sector 6 (Desk) is ON

  // Intensity Weights
  masterIntensity: 75,  // Master Brightness (0 to 100%)
  r1Intensity: 85,      // Study Desk Zone Weight (0 to 100%)
  r2Intensity: 0,       // Sleeping Bed Zone Weight (0 to 100%)
  cct: 3800,            // Natural warm-white LED color temperature (Kelvin)

  // Furniture Layout: 'default' | 'inverted' | 'diagonal' | 'opposite'
  furnitureLayout: 'default',

  // Custom Presets Storage
  customPresets: [],
  activePresetId: 'study-r1',

  // 24 addressable virtual LEDs (3 LEDs per 45° sector)
  numLeds: 24,
  ledStates: new Array(24).fill(0),
  viewMode: 'grid',
  isDraggingPuck: false,

  // Photometric Real-time Outputs
  r1Lux: 0,
  r2Lux: 0,
  energySavedPercent: 0,
  activeLedCount: 0
};

// ============================================================================
// DOM ELEMENTS
// ============================================================================
const DOM = {
  // Canvases
  canvasTop: document.getElementById('canvasTop'),
  canvasFront: document.getElementById('canvasFront'),
  canvasSide: document.getElementById('canvasSide'),

  // Mode Switch
  btnModeContinuous: document.getElementById('btnModeContinuous'),
  btnModeSmart: document.getElementById('btnModeSmart'),
  modeBadge: document.getElementById('modeBadge'),
  smartLightCard: document.getElementById('smartLightCard'),
  continuousDialCard: document.getElementById('continuousDialCard'),
  beamSpreadCard: document.getElementById('beamSpreadCard'),
  sectorsGrid: document.getElementById('sectorsGrid'),
  sectorsCountBadge: document.getElementById('sectorsCountBadge'),
  sectorButtons: document.querySelectorAll('.btn-sector'),
  btnSecDeskDoor: document.getElementById('btnSecDeskDoor'),
  btnSecDeskWindow: document.getElementById('btnSecDeskWindow'),
  btnSecShieldBed: document.getElementById('btnSecShieldBed'),

  // Presets & New Preset Form
  presetGrid: document.getElementById('presetGrid'),
  btnOpenNewPreset: document.getElementById('btnOpenNewPreset'),
  newPresetForm: document.getElementById('newPresetForm'),
  newPresetName: document.getElementById('newPresetName'),
  btnSavePreset: document.getElementById('btnSavePreset'),
  btnCancelPreset: document.getElementById('btnCancelPreset'),

  // Furniture Layout Selector
  layoutButtons: document.querySelectorAll('.btn-layout'),
  currentLayoutLabel: document.getElementById('currentLayoutLabel'),
  hudTopDesk: document.getElementById('hudTopDesk'),
  hudTopBed: document.getElementById('hudTopBed'),

  // Dial & Continuous Controls
  compassRing: document.getElementById('compassRing'),
  dialPuck: document.getElementById('dialPuck'),
  dialTouchArea: document.getElementById('dialTouchArea'),
  steeringNeedle: document.getElementById('steeringNeedle'),
  needleCone: document.getElementById('needleCone'),
  ledRing: document.getElementById('ledRing'),
  emitterCore: document.getElementById('emitterCore'),
  angleDisplay: document.getElementById('angleDisplay'),
  beamSpreadSlider: document.getElementById('beamSpreadSlider'),
  beamSpreadVal: document.getElementById('beamSpreadVal'),
  dirBtns: document.querySelectorAll('.btn-dir'),

  // Intensity Sliders
  masterIntensitySlider: document.getElementById('masterIntensitySlider'),
  masterIntensityVal: document.getElementById('masterIntensityVal'),
  r1Slider: document.getElementById('r1Slider'),
  r1IntensityVal: document.getElementById('r1IntensityVal'),
  r2Slider: document.getElementById('r2Slider'),
  r2IntensityVal: document.getElementById('r2IntensityVal'),

  // Tabs & Cards
  tabBtns: document.querySelectorAll('.tab-pill'),
  axesContainer: document.getElementById('axesContainer'),
  axisCards: {
    top: document.getElementById('axisCardTop'),
    front: document.getElementById('axisCardFront'),
    side: document.getElementById('axisCardSide')
  },

  // Export Buttons
  btnExportAllImagesNav: document.getElementById('btnExportAllImagesNav'),
  btnDownloadTop: document.getElementById('btnDownloadTop'),
  btnDownloadFront: document.getElementById('btnDownloadFront'),
  btnDownloadSide: document.getElementById('btnDownloadSide'),

  // Photometric Indicators
  metricR1Lux: document.getElementById('metricR1Lux'),
  metricR2Lux: document.getElementById('metricR2Lux'),
  tagR1Status: document.getElementById('tagR1Status'),
  tagR2Status: document.getElementById('tagR2Status'),
  metricConflictIndex: document.getElementById('metricConflictIndex'),
  phoneClock: document.getElementById('phoneClock'),
  cutoffAngleText: document.getElementById('cutoffAngleText'),
  sideApertureText: document.getElementById('sideApertureText'),
  wallIlluminanceText: document.getElementById('wallIlluminanceText')
};

// ============================================================================
// INITIALIZATION
// ============================================================================
function init() {
  createLedRingDots();
  bindEventListeners();
  updateClock();
  setInterval(updateClock, 10000);
  applyPreset('study-r1');
  syncModeUI();
  renderAllViews();
}

// Generate the 24 Addressable Virtual LEDs on the Phone Dial
function createLedRingDots() {
  DOM.ledRing.innerHTML = '';
  const radius = 60;
  const centerX = 67;
  const centerY = 67;

  for (let i = 0; i < state.numLeds; i++) {
    const angleDeg = (i * 360) / state.numLeds;
    const angleRad = (angleDeg - 90) * (Math.PI / 180);
    const x = centerX + radius * Math.cos(angleRad);
    const y = centerY + radius * Math.sin(angleRad);

    const dot = document.createElement('div');
    dot.className = 'led-dot';
    dot.id = `led-dot-${i}`;
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    DOM.ledRing.appendChild(dot);
  }
}

function updateClock() {
  const now = new Date();
  const hrs = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  if (DOM.phoneClock) {
    DOM.phoneClock.textContent = `${hrs}:${mins}`;
  }
}

// Kelvin to RGB helper
function kelvinToRgb(k) {
  const temp = k / 100;
  let r, g, b;
  if (temp <= 66) {
    r = 255;
    g = Math.min(255, Math.max(0, 99.4708025861 * Math.log(temp) - 161.1195681661));
  } else {
    r = Math.min(255, Math.max(0, 329.698727446 * Math.pow(temp - 60, -0.1332047592)));
    g = Math.min(255, Math.max(0, 288.1221695283 * Math.pow(temp - 60, -0.0755148492)));
  }
  if (temp >= 66) b = 255;
  else if (temp <= 19) b = 0;
  else b = Math.min(255, Math.max(0, 138.5177312231 * Math.log(temp - 10) - 305.0447927307));
  return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
}

// ============================================================================
// FURNITURE COORDINATES HELPER
// ============================================================================
function getFurnitureCoordinates(w, h) {
  const cx = w / 2;
  const cy = h / 2;

  switch (state.furnitureLayout) {
    case 'inverted':
      // Bed Left (West), Desk Right (East)
      return {
        desk: { x: cx + 140, y: cy, label: 'R1 DESK (EAST)', angle: 90 },
        bed:  { x: cx - 140, y: cy, label: 'R2 BED (WEST)', angle: 270 }
      };
    case 'diagonal':
      // Desk Top-Left (North-West), Bed Bottom-Right (South-East)
      return {
        desk: { x: cx - 130, y: cy - 90, label: 'R1 DESK (NW)', angle: 315 },
        bed:  { x: cx + 130, y: cy + 90, label: 'R2 BED (SE)', angle: 135 }
      };
    case 'opposite':
      // Desk at Back Window (South), Bed at Front Door (North)
      return {
        desk: { x: cx, y: cy - 110, label: 'R1 DESK (WINDOW)', angle: 180 },
        bed:  { x: cx, y: cy + 110, label: 'R2 BED (DOOR)', angle: 0 }
      };
    case 'default':
    default:
      // Desk Left (West), Bed Right (East)
      return {
        desk: { x: cx - 140, y: cy, label: 'R1 DESK (WEST)', angle: 270 },
        bed:  { x: cx + 140, y: cy, label: 'R2 BED (EAST)', angle: 90 }
      };
  }
}

// ============================================================================
// CORE CALCULATION ENGINE
// ============================================================================
function updateCalculations() {
  const { r, g, b } = kelvinToRgb(state.cct);
  const rgbString = `rgb(${r}, ${g}, ${b})`;

  let activeLeds = 0;

  if (state.mode === 'smart') {
    // Multi-Sector Smart Light Mode:
    // 24 LEDs grouped into 8 sectors of 3 LEDs each
    for (let i = 0; i < state.numLeds; i++) {
      const sectorIndex = Math.floor(i / 3);
      const isSectorActive = state.activeSectors.has(sectorIndex);

      let brightness = 0;
      if (isSectorActive) {
        // Apply zone intensity based on sector position
        const ledAngle = (i * 360) / state.numLeds;
        let zoneWeight = 1.0;
        if (ledAngle >= 180 && ledAngle < 360) {
          zoneWeight = state.r1Intensity / 100;
        } else {
          zoneWeight = state.r2Intensity / 100;
        }
        brightness = (state.masterIntensity / 100) * Math.max(0.4, zoneWeight);
      }

      state.ledStates[i] = brightness;
      updateLedDotElem(i, brightness, rgbString, r, g, b);
      if (brightness > 0.05) activeLeds++;
    }
  } else {
    // Continuous Single Beam Mode
    const halfSpread = state.spread / 2;
    for (let i = 0; i < state.numLeds; i++) {
      const ledAngle = (i * 360) / state.numLeds;
      let diff = Math.abs(ledAngle - state.angle);
      if (diff > 180) diff = 360 - diff;

      let activation = 0;
      if (state.spread >= 350) {
        activation = 1.0;
      } else if (diff <= halfSpread) {
        activation = Math.cos((diff / halfSpread) * (Math.PI / 2));
      }

      let zoneWeight = 1.0;
      if (ledAngle >= 180 && ledAngle < 360) {
        zoneWeight = state.r1Intensity / 100;
      } else {
        zoneWeight = state.r2Intensity / 100;
      }

      const brightness = activation * (state.masterIntensity / 100) * zoneWeight;
      state.ledStates[i] = brightness;
      updateLedDotElem(i, brightness, rgbString, r, g, b);
      if (brightness > 0.05) activeLeds++;
    }
  }

  state.activeLedCount = activeLeds;

  // Power savings vs 24 full-on LEDs
  const totalPower = state.ledStates.reduce((acc, v) => acc + v, 0);
  const maxPower = state.numLeds * 1.0;
  state.energySavedPercent = Math.max(0, Math.round((1 - (totalPower / maxPower)) * 100));

  // Photometric Lux Calculation at Desk & Bed
  const baseLumen = (state.masterIntensity / 100) * 1200;
  const coords = getFurnitureCoordinates(760, 480);

  // Check light reaching Desk angle & Bed angle
  let factorDesk = 0;
  let factorBed = 0;

  if (state.mode === 'smart') {
    // Smart Light mode: check if sectors corresponding to desk & bed are active
    const deskSector = Math.floor(coords.desk.angle / 45) % 8;
    const bedSector = Math.floor(coords.bed.angle / 45) % 8;

    if (state.activeSectors.has(deskSector)) factorDesk = 1.0;
    else if (state.activeSectors.has((deskSector + 7) % 8) || state.activeSectors.has((deskSector + 1) % 8)) factorDesk = 0.35; // adjacent edge spill

    if (state.activeSectors.has(bedSector)) factorBed = 1.0;
    else if (state.activeSectors.has((bedSector + 7) % 8) || state.activeSectors.has((bedSector + 1) % 8)) factorBed = 0.35;
  } else {
    // Continuous mode
    const halfSpread = state.spread / 2;
    let diffDesk = Math.abs(state.angle - coords.desk.angle);
    if (diffDesk > 180) diffDesk = 360 - diffDesk;

    let diffBed = Math.abs(state.angle - coords.bed.angle);
    if (diffBed > 180) diffBed = 360 - diffBed;

    if (state.spread >= 350) {
      factorDesk = 1.0;
      factorBed = 1.0;
    } else {
      if (diffDesk <= halfSpread) factorDesk = Math.cos((diffDesk / halfSpread) * (Math.PI / 2));
      if (diffBed <= halfSpread) factorBed = Math.cos((diffBed / halfSpread) * (Math.PI / 2));
    }
  }

  // Calculate Lux with distance attenuation
  const luxDesk = Math.round(
    ((baseLumen * (state.r1Intensity / 100) * factorDesk * 0.6) / 2.0) +
    (state.masterIntensity > 0 && factorDesk > 0 ? 5 : 0)
  );

  const luxBed = Math.round(
    ((baseLumen * (state.r2Intensity / 100) * factorBed * 0.6) / 2.0) +
    (state.masterIntensity > 0 && factorDesk > 0.4 ? Math.min(4, luxDesk * 0.01) : 0)
  );

  state.r1Lux = luxDesk;
  state.r2Lux = luxBed;

  updateUIElements(rgbString);
}

function updateLedDotElem(i, brightness, rgbString, r, g, b) {
  const dot = document.getElementById(`led-dot-${i}`);
  if (!dot) return;
  if (brightness > 0.05) {
    dot.classList.add('lit');
    dot.style.backgroundColor = rgbString;
    dot.style.boxShadow = `0 0 ${8 + brightness * 12}px rgba(${r}, ${g}, ${b}, ${0.6 + brightness * 0.4})`;
    dot.style.opacity = '1';
  } else {
    dot.classList.remove('lit');
    dot.style.backgroundColor = '#1e293b';
    dot.style.boxShadow = 'none';
    dot.style.opacity = '0.3';
  }
}

// Update Text & Status Displays
function updateUIElements(rgbString) {
  // Mode UI
  if (DOM.modeBadge) {
    DOM.modeBadge.textContent = state.mode === 'smart' ? 'Smart Light Active' : 'Continuous Beam';
  }

  // Emitter core
  if (DOM.emitterCore) {
    DOM.emitterCore.style.backgroundColor = rgbString;
    DOM.emitterCore.style.boxShadow = `0 0 ${12 + (state.masterIntensity / 5)}px ${rgbString}`;
  }

  // Angle display text (for continuous mode)
  if (DOM.angleDisplay) {
    DOM.angleDisplay.textContent = `${Math.round(state.angle)}°`;
  }
  if (DOM.steeringNeedle) {
    DOM.steeringNeedle.style.transform = `rotate(${state.angle}deg)`;
  }
  if (DOM.needleCone) {
    const coneHeight = Math.max(30, Math.min(180, (state.spread / 180) * 110));
    DOM.needleCone.style.height = `${coneHeight}px`;
    DOM.needleCone.style.top = `${-coneHeight / 2}px`;
  }

  // Smart Light sector count badge
  if (DOM.sectorsCountBadge) {
    DOM.sectorsCountBadge.textContent = `${state.activeSectors.size} / 8 Sectors Active`;
  }

  // Metrics Display
  if (DOM.metricR1Lux) DOM.metricR1Lux.textContent = `${state.r1Lux} Lux`;
  if (DOM.metricR2Lux) DOM.metricR2Lux.textContent = `${state.r2Lux} Lux`;

  // Desk Status Tag
  if (DOM.tagR1Status) {
    if (state.r1Lux >= 300) {
      DOM.tagR1Status.className = 'badge-tag tag-green';
      DOM.tagR1Status.textContent = 'Optimal for Study (300-500 lx)';
    } else if (state.r1Lux >= 100) {
      DOM.tagR1Status.className = 'badge-tag tag-lime';
      DOM.tagR1Status.textContent = 'Moderate Reading (100-300 lx)';
    } else if (state.r1Lux > 0) {
      DOM.tagR1Status.className = 'badge-tag';
      DOM.tagR1Status.textContent = 'Dim Task Light (< 100 lx)';
    } else {
      DOM.tagR1Status.className = 'badge-tag';
      DOM.tagR1Status.textContent = 'Sector Dark (0 lx)';
    }
  }

  // Bed Status Tag
  if (DOM.tagR2Status) {
    if (state.r2Lux <= 10) {
      DOM.tagR2Status.className = 'badge-tag tag-green';
      DOM.tagR2Status.textContent = 'Dark / Zero Glare (< 10 lx)';
    } else if (state.r2Lux <= 30) {
      DOM.tagR2Status.className = 'badge-tag tag-lime';
      DOM.tagR2Status.textContent = 'Minor Ambient Spill (< 30 lx)';
    } else {
      DOM.tagR2Status.className = 'badge-tag';
      DOM.tagR2Status.style.background = '#fee2e2';
      DOM.tagR2Status.style.color = '#dc2626';
      DOM.tagR2Status.textContent = 'Glare Detected (> 30 lx)';
    }
  }

  // Conflict Resolution Index
  if (DOM.metricConflictIndex) {
    if (state.r1Lux >= 250 && state.r2Lux <= 10) {
      DOM.metricConflictIndex.textContent = '100% Conflict Free';
      DOM.metricConflictIndex.className = 'comfort-number text-lime';
    } else if (state.r2Lux <= 15) {
      DOM.metricConflictIndex.textContent = '95% Comfortable';
      DOM.metricConflictIndex.className = 'comfort-number text-lime';
    } else if (state.r2Lux <= 50) {
      DOM.metricConflictIndex.textContent = '65% Partial Bleed';
      DOM.metricConflictIndex.className = 'comfort-number';
      DOM.metricConflictIndex.style.color = '#f59e0b';
    } else {
      DOM.metricConflictIndex.textContent = '25% Glare Overlap';
      DOM.metricConflictIndex.className = 'comfort-number';
      DOM.metricConflictIndex.style.color = '#dc2626';
    }
  }

  // Auxiliary badges
  if (DOM.cutoffAngleText) {
    DOM.cutoffAngleText.textContent = state.mode === 'smart' 
      ? `Multi-Sector (${state.activeSectors.size} active)` 
      : `${Math.round(state.spread / 2)}° Directional Cutoff`;
  }
  if (DOM.sideApertureText) {
    DOM.sideApertureText.textContent = `${Math.min(90, Math.round(state.spread * 0.75))}° Profile`;
  }
  if (DOM.wallIlluminanceText) {
    DOM.wallIlluminanceText.textContent = `Ambient ${Math.round(state.masterIntensity * 0.45)} lx`;
  }
}

// Switch between Continuous and Smart Light mode
function setMode(newMode) {
  state.mode = newMode;
  syncModeUI();
  updateCalculations();
  renderAllViews();
}

function syncModeUI() {
  const isSmart = state.mode === 'smart';
  DOM.btnModeContinuous.classList.toggle('active', !isSmart);
  DOM.btnModeSmart.classList.toggle('active', isSmart);

  if (DOM.smartLightCard) DOM.smartLightCard.style.display = isSmart ? 'flex' : 'none';
  if (DOM.continuousDialCard) DOM.continuousDialCard.style.display = isSmart ? 'none' : 'flex';
  if (DOM.beamSpreadCard) DOM.beamSpreadCard.style.display = isSmart ? 'none' : 'flex';

  // Update sector buttons in grid
  DOM.sectorButtons.forEach(btn => {
    const sec = parseInt(btn.dataset.sector, 10);
    btn.classList.toggle('active', state.activeSectors.has(sec));
  });
}

// ============================================================================
// CANVAS RENDERING: 3 ORTHOGRAPHIC AXES (FLAT IMAGES)
// ============================================================================

/**
 * AXIS 1: TOP-DOWN VIEW (X-Y PLANE - ARCHITECTURAL FLOOR PLAN)
 */
function renderAxisTop() {
  const canvas = DOM.canvasTop;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  // Background
  ctx.fillStyle = '#080d18';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const marginX = 30;
  const marginY = 30;
  const roomW = w - 2 * marginX;
  const roomH = h - 2 * marginY;

  // Architectural Grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Room Wall Boundaries
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 4;
  ctx.strokeRect(marginX, marginY, roomW, roomH);

  // Center Divider Axis (Ceiling Mount Plane)
  ctx.save();
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = '#a3e635';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, marginY);
  ctx.lineTo(cx, marginY + roomH);
  ctx.stroke();
  ctx.restore();

  // Wall Fixtures: Window (Top / South) & Door (Bottom / North)
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(cx - 70, marginY - 4, 140, 8); // Window
  ctx.fillStyle = '#94a3b8';
  ctx.font = '9px "JetBrains Mono", monospace';
  ctx.fillText('WINDOW', cx - 20, marginY - 8);

  ctx.strokeStyle = '#fb923c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx + 80, marginY + roomH, 45, Math.PI, 1.5 * Math.PI, false); // Door swing
  ctx.stroke();
  ctx.fillText('ENTRY DOOR', cx + 90, marginY + roomH + 18);

  // ==========================================
  // DYNAMIC FURNITURE DRAWING
  // ==========================================
  const coords = getFurnitureCoordinates(w, h);

  // 1. Draw Study Desk & Chair
  drawDeskTopView(ctx, coords.desk.x, coords.desk.y);

  // 2. Draw Sleeping Bed & Person
  drawBedTopView(ctx, coords.bed.x, coords.bed.y);

  // ==========================================
  // REAL-TIME PHOTOMETRIC LIGHTING ON FLOOR
  // ==========================================
  const { r, g, b } = kelvinToRgb(state.cct);

  if (state.masterIntensity > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(marginX, marginY, roomW, roomH);
    ctx.clip();
    ctx.globalCompositeOperation = 'screen';

    // Ambient bounce
    const ambientGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 320);
    const ambientOp = Math.max(0.02, (state.masterIntensity / 100) * 0.1);
    ambientGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${ambientOp * 2})`);
    ambientGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = ambientGrad;
    ctx.fillRect(marginX, marginY, roomW, roomH);

    const maxRadius = 350;
    const intensityScale = state.masterIntensity / 100;

    if (state.mode === 'smart') {
      // RENDER MULTIPLE NON-CONTINUOUS SECTOR BEAMS
      state.activeSectors.forEach(sec => {
        const startDeg = sec * 45;
        const endDeg = (sec + 1) * 45;
        const startRad = ((startDeg - 90) * Math.PI) / 180;
        const endRad = ((endDeg - 90) * Math.PI) / 180;

        const beamGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, maxRadius);
        beamGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.85 * intensityScale})`);
        beamGrad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${0.5 * intensityScale})`);
        beamGrad.addColorStop(0.75, `rgba(${r}, ${g}, ${b}, ${0.18 * intensityScale})`);
        beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, maxRadius, startRad, endRad);
        ctx.closePath();
        ctx.fill();

        // Beam boundary lines
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.4 * intensityScale})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    } else {
      // Continuous single beam mode
      const steerRad = ((state.angle - 90) * Math.PI) / 180;
      const spreadRad = (state.spread * Math.PI) / 180;
      const startAngle = steerRad - spreadRad / 2;
      const endAngle = steerRad + spreadRad / 2;

      if (state.spread >= 350) {
        const radGrad = ctx.createRadialGradient(cx, cy, 15, cx, cy, maxRadius);
        radGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.8 * intensityScale})`);
        radGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = radGrad;
        ctx.beginPath(); ctx.arc(cx, cy, maxRadius, 0, Math.PI * 2); ctx.fill();
      } else {
        const beamGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, maxRadius);
        beamGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.9 * intensityScale})`);
        beamGrad.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${0.55 * intensityScale})`);
        beamGrad.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${0.2 * intensityScale})`);
        beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, maxRadius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // Center Ceiling Fixture
  drawCeilingBulbCenter(ctx, cx, cy, r, g, b);

  // Sensor Probes
  drawSensorProbe(ctx, coords.desk.x, coords.desk.y, 'DESK LUX', `${state.r1Lux} lx`, '#38bdf8');
  drawSensorProbe(ctx, coords.bed.x, coords.bed.y, 'BED LUX', `${state.r2Lux} lx`, '#c084fc');

  drawAxisWatermark(ctx, 'AXIS 1: TOP-DOWN FLOOR PLAN (X-Y PLANE)');
}

function drawDeskTopView(ctx, x, y) {
  const w = 130;
  const h = 70;
  const left = x - w / 2;
  const top = y - h / 2;

  // Study Rug
  ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
  ctx.fillRect(left - 20, top - 20, w + 40, h + 80);

  // Desk Tabletop
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.fillRect(left, top, w, h);
  ctx.strokeRect(left, top, w, h);

  // Laptop
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(left + 40, top + 15, 45, 32);
  if (state.r1Lux > 50) {
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(left + 43, top + 17, 39, 4);
  }

  // Chair
  const chairY = top + h + 24;
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, chairY, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Student Figure
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(x, chairY, 11, 0, Math.PI * 2);
  ctx.fill();
}

function drawBedTopView(ctx, x, y) {
  const w = 110;
  const h = 160;
  const left = x - w / 2;
  const top = y - h / 2;

  // Rug
  ctx.fillStyle = 'rgba(192, 132, 252, 0.04)';
  ctx.fillRect(left - 15, top - 15, w + 30, h + 30);

  // Frame
  ctx.fillStyle = '#1e1b2e';
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 1.5;
  ctx.fillRect(left, top, w, h);
  ctx.strokeRect(left, top, w, h);

  // Pillow
  ctx.fillStyle = '#3b3254';
  ctx.fillRect(left + 18, top + 10, w - 36, 26);

  // Blanket
  ctx.fillStyle = '#262238';
  ctx.fillRect(left + 8, top + 42, w - 16, h - 50);

  // Sleeping Figure Head
  ctx.fillStyle = '#a855f7';
  ctx.beginPath();
  ctx.arc(x, top + 22, 9, 0, Math.PI * 2);
  ctx.fill();
}

function drawCeilingBulbCenter(ctx, cx, cy, r, g, b) {
  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#a3e635';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // LEDs along bulb ring
  for (let i = 0; i < state.numLeds; i++) {
    const angleDeg = (i * 360) / state.numLeds;
    const angleRad = (angleDeg - 90) * (Math.PI / 180);
    const ledX = cx + 17 * Math.cos(angleRad);
    const ledY = cy + 17 * Math.sin(angleRad);

    const bVal = state.ledStates[i];
    if (bVal > 0.05) {
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.beginPath();
      ctx.arc(ledX, ledY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Core
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 12);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.7, `rgb(${r}, ${g}, ${b})`);
  coreGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * AXIS 2: FRONT ELEVATION VIEW (X-Z PLANE - TRANSVERSE CROSS-SECTION)
 */
function renderAxisFront() {
  const canvas = DOM.canvasFront;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = '#080d18';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const floorY = h - 70;
  const ceilingY = 60;
  const roomW = w - 80;

  // Grid & Slabs
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let y = ceilingY; y <= floorY; y += 40) {
    ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(w - 40, y); ctx.stroke();
  }

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(30, ceilingY - 18, roomW + 20, 18);
  ctx.fillRect(30, floorY, roomW + 20, 24);
  ctx.fillStyle = '#33271e';
  ctx.fillRect(40, floorY, roomW, 6);

  // Boundary walls
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(40, ceilingY); ctx.lineTo(40, floorY);
  ctx.moveTo(w - 40, ceilingY); ctx.lineTo(w - 40, floorY);
  ctx.stroke();

  // Center vertical divider
  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = '#a3e635';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, ceilingY); ctx.lineTo(cx, floorY);
  ctx.stroke();
  ctx.restore();

  const coords = getFurnitureCoordinates(w, h);
  const bulbX = cx;
  const bulbY = ceilingY + 35;
  const { r, g, b } = kelvinToRgb(state.cct);

  // ==========================================
  // REAL-TIME VOLUMETRIC DOWNWARD CONES
  // ==========================================
  if (state.masterIntensity > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(40, ceilingY, roomW, floorY - ceilingY);
    ctx.clip();
    ctx.globalCompositeOperation = 'screen';

    const intensityScale = state.masterIntensity / 100;

    if (state.mode === 'smart') {
      // Multi-Sector Cones in Cross-Section:
      // Map active sectors to their lateral projection
      state.activeSectors.forEach(sec => {
        // Sector center angle:
        const secCenterDeg = sec * 45 + 22.5;
        const lateralBias = Math.sin(((secCenterDeg - 180) * Math.PI) / 180);
        const targetX = cx + lateralBias * (roomW * 0.45);
        const spreadWidth = 85;

        const beamGrad = ctx.createLinearGradient(bulbX, bulbY, targetX, floorY);
        beamGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.85 * intensityScale})`);
        beamGrad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${0.45 * intensityScale})`);
        beamGrad.addColorStop(0.8, `rgba(${r}, ${g}, ${b}, ${0.15 * intensityScale})`);
        beamGrad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(bulbX, bulbY);
        ctx.lineTo(targetX - spreadWidth, floorY);
        ctx.lineTo(targetX + spreadWidth, floorY);
        ctx.closePath();
        ctx.fill();
      });
    } else {
      // Continuous Single Beam Cone
      const steerBias = Math.sin(((state.angle - 180) * Math.PI) / 180);
      const targetX = cx + steerBias * (roomW * 0.45);
      const floorSpreadWidth = (state.spread / 180) * (roomW * 0.5);

      const beamGrad = ctx.createLinearGradient(bulbX, bulbY, targetX, floorY);
      beamGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.9 * intensityScale})`);
      beamGrad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${0.45 * intensityScale})`);
      beamGrad.addColorStop(0.85, `rgba(${r}, ${g}, ${b}, ${0.15 * intensityScale})`);
      beamGrad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(bulbX, bulbY);
      ctx.lineTo(targetX - floorSpreadWidth, floorY);
      ctx.lineTo(targetX + floorSpreadWidth, floorY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // Draw Furniture in Front View
  drawDeskFrontView(ctx, coords.desk.x, floorY);
  drawBedFrontView(ctx, coords.bed.x, floorY);

  // Ceiling pendant fixture
  drawPendantBulbFront(ctx, cx, ceilingY, bulbY, r, g, b);

  // Sensor Probes
  drawSensorProbe(ctx, coords.desk.x, floorY - 95, 'DESK LUX', `${state.r1Lux} lx`, '#38bdf8');
  drawSensorProbe(ctx, coords.bed.x, floorY - 60, 'BED LUX', `${state.r2Lux} lx`, '#c084fc');

  drawAxisWatermark(ctx, 'AXIS 2: FRONT ELEVATION CROSS-SECTION (X-Z PLANE)');
}

function drawDeskFrontView(ctx, x, floorY) {
  const deskW = 120;
  const deskH = 80;
  const deskTopY = floorY - deskH;
  const left = x - deskW / 2;

  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.fillRect(left, deskTopY, deskW, 10);
  ctx.strokeRect(left, deskTopY, deskW, 10);
  ctx.fillRect(left + 6, deskTopY + 10, 8, deskH - 10);
  ctx.fillRect(left + deskW - 14, deskTopY + 10, 8, deskH - 10);

  // Laptop
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x - 15, deskTopY - 4, 30, 4);
  ctx.beginPath();
  ctx.moveTo(x - 15, deskTopY - 4);
  ctx.lineTo(x - 22, deskTopY - 22);
  ctx.lineTo(x + 8, deskTopY - 22);
  ctx.lineTo(x + 15, deskTopY - 4);
  ctx.fill();

  // Student sitting
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(x + 20, floorY - 90, 24, 45); // torso
  ctx.beginPath();
  ctx.arc(x + 32, floorY - 102, 12, 0, Math.PI * 2); // head
  ctx.fill();
}

function drawBedFrontView(ctx, x, floorY) {
  const bedW = 140;
  const bedH = 45;
  const bedTopY = floorY - bedH;
  const left = x - bedW / 2;

  ctx.fillStyle = '#1e1b2e';
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 1.5;
  ctx.fillRect(left, bedTopY, bedW, bedH);
  ctx.strokeRect(left, bedTopY, bedW, bedH);

  // Headboard
  ctx.fillRect(left + bedW - 12, floorY - 95, 12, 95);

  // Sleeping figure
  ctx.fillStyle = '#a855f7';
  ctx.beginPath();
  ctx.arc(left + bedW - 25, bedTopY - 12, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(left + 15, bedTopY - 10, bedW - 45, 10);
}

function drawPendantBulbFront(ctx, cx, ceilingY, bulbY, r, g, b) {
  ctx.fillStyle = '#334155';
  ctx.fillRect(cx - 20, ceilingY, 40, 6);

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, ceilingY + 6);
  ctx.lineTo(cx, bulbY - 14);
  ctx.stroke();

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(cx - 10, bulbY - 14, 20, 10);

  const bulbGrad = ctx.createRadialGradient(cx, bulbY, 2, cx, bulbY, 16);
  if (state.masterIntensity > 0) {
    bulbGrad.addColorStop(0, '#ffffff');
    bulbGrad.addColorStop(0.5, `rgb(${r}, ${g}, ${b})`);
    bulbGrad.addColorStop(1, 'rgba(255, 255, 255, 0.4)');
  } else {
    bulbGrad.addColorStop(0, '#64748b');
    bulbGrad.addColorStop(1, '#334155');
  }

  ctx.fillStyle = bulbGrad;
  ctx.beginPath();
  ctx.arc(cx, bulbY, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.stroke();
}

/**
 * AXIS 3: SIDE ELEVATION VIEW (Y-Z PLANE - LONGITUDINAL PROFILE)
 */
function renderAxisSide() {
  const canvas = DOM.canvasSide;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = '#080d18';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const floorY = h - 70;
  const ceilingY = 60;
  const roomDepth = w - 80;

  // Slabs & Walls
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(30, ceilingY - 18, roomDepth + 20, 18);
  ctx.fillRect(30, floorY, roomDepth + 20, 24);
  ctx.fillStyle = '#33271e';
  ctx.fillRect(40, floorY, roomDepth, 6);

  // Exterior window wall (Left) & Entry door (Right)
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(40, ceilingY); ctx.lineTo(40, floorY);
  ctx.moveTo(w - 40, ceilingY); ctx.lineTo(w - 40, floorY);
  ctx.stroke();

  // Window
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(40, ceilingY + 30, 14, 140);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, ceilingY + 30, 14, 140);

  // Door
  const doorH = 180;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(w - 54, floorY - doorH, 14, doorH);
  ctx.strokeStyle = '#fb923c';
  ctx.strokeRect(w - 54, floorY - doorH, 14, doorH);

  // Divider plane
  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = '#a3e635';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, ceilingY); ctx.lineTo(cx, floorY);
  ctx.stroke();
  ctx.restore();

  const bulbX = cx;
  const bulbY = ceilingY + 35;
  const { r, g, b } = kelvinToRgb(state.cct);

  // Volumetric Beams in Depth
  if (state.masterIntensity > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(40, ceilingY, roomDepth, floorY - ceilingY);
    ctx.clip();
    ctx.globalCompositeOperation = 'screen';

    const intensityScale = state.masterIntensity / 100;

    if (state.mode === 'smart') {
      state.activeSectors.forEach(sec => {
        const secCenterDeg = sec * 45 + 22.5;
        const depthBias = Math.cos((secCenterDeg * Math.PI) / 180);
        const targetX = cx + depthBias * (roomDepth * 0.4);
        const spreadWidth = 80;

        const beamGrad = ctx.createLinearGradient(bulbX, bulbY, targetX, floorY);
        beamGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.85 * intensityScale})`);
        beamGrad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${0.4 * intensityScale})`);
        beamGrad.addColorStop(0.8, `rgba(${r}, ${g}, ${b}, ${0.15 * intensityScale})`);
        beamGrad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(bulbX, bulbY);
        ctx.lineTo(targetX - spreadWidth, floorY);
        ctx.lineTo(targetX + spreadWidth, floorY);
        ctx.closePath();
        ctx.fill();
      });
    } else {
      const depthBias = Math.cos((state.angle * Math.PI) / 180);
      const targetX = cx + depthBias * (roomDepth * 0.4);
      const spreadWidth = Math.min(roomDepth * 0.4, (state.spread / 180) * (roomDepth * 0.4));

      const beamGrad = ctx.createLinearGradient(bulbX, bulbY, targetX, floorY);
      beamGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.85 * intensityScale})`);
      beamGrad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${0.4 * intensityScale})`);
      beamGrad.addColorStop(0.8, `rgba(${r}, ${g}, ${b}, ${0.15 * intensityScale})`);
      beamGrad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(bulbX, bulbY);
      ctx.lineTo(targetX - spreadWidth, floorY);
      ctx.lineTo(targetX + spreadWidth, floorY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // Pendant Bulb
  drawPendantBulbFront(ctx, cx, ceilingY, bulbY, r, g, b);

  drawSensorProbe(ctx, 80, floorY - 80, 'WINDOW WALL', `${Math.round(state.masterIntensity * 0.35)} lx`, '#38bdf8');
  drawSensorProbe(ctx, w - 90, floorY - 80, 'ENTRY DOOR', `${Math.round(state.masterIntensity * 0.35)} lx`, '#fb923c');

  drawAxisWatermark(ctx, 'AXIS 3: SIDE ELEVATION LONGITUDINAL PROFILE (Y-Z PLANE)');
}

// Helpers
function drawSensorProbe(ctx, x, y, label, value, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 14, y); ctx.lineTo(x + 14, y);
  ctx.moveTo(x, y - 14); ctx.lineTo(x, y + 14);
  ctx.stroke();

  const boxW = 85;
  const boxH = 28;
  const boxX = x - boxW / 2;
  const boxY = y + 16;

  ctx.fillStyle = 'rgba(7, 10, 17, 0.9)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  ctx.font = '8px "JetBrains Mono", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, boxY + 11);

  ctx.font = 'bold 11px "JetBrains Mono", monospace';
  ctx.fillStyle = color;
  ctx.fillText(value, x, boxY + 23);
  ctx.restore();
}

function drawAxisWatermark(ctx, text) {
  ctx.save();
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.textAlign = 'left';
  ctx.fillText(text, 45, 35);
  ctx.restore();
}

function renderAllViews() {
  updateCalculations();
  renderAxisTop();
  renderAxisFront();
  renderAxisSide();
}

// ==========================================
// PRESETS & CUSTOM PRESET CREATOR
// ==========================================
function applyPreset(presetId) {
  state.activePresetId = presetId;

  // Highlight button
  document.querySelectorAll('.btn-preset').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.preset === presetId);
  });

  if (presetId === 'study-r1') {
    state.mode = 'smart';
    state.activeSectors = new Set([6]); // Sector 6 = West / Desk
    state.angle = 270;
    state.spread = 80;
    state.masterIntensity = 75;
    state.r1Intensity = 85;
    state.r2Intensity = 0;
  } else if (presetId === 'sleep-r2') {
    state.mode = 'smart';
    state.activeSectors = new Set([]); // All dark or minor ambient
    state.angle = 90;
    state.spread = 60;
    state.masterIntensity = 10;
    state.r1Intensity = 0;
    state.r2Intensity = 0;
  } else if (presetId === 'balanced') {
    state.mode = 'continuous';
    state.angle = 270;
    state.spread = 180;
    state.masterIntensity = 70;
    state.r1Intensity = 70;
    state.r2Intensity = 70;
  } else if (presetId === 'radial') {
    state.mode = 'continuous';
    state.angle = 270;
    state.spread = 360;
    state.masterIntensity = 100;
    state.r1Intensity = 100;
    state.r2Intensity = 100;
  } else {
    // Check custom presets
    const custom = state.customPresets.find(p => p.id === presetId);
    if (custom) {
      state.mode = custom.mode;
      if (custom.activeSectors) state.activeSectors = new Set(custom.activeSectors);
      state.angle = custom.angle || 270;
      state.spread = custom.spread || 80;
      state.masterIntensity = custom.masterIntensity;
      state.r1Intensity = custom.r1Intensity;
      state.r2Intensity = custom.r2Intensity;
    }
  }

  syncControlsToState();
  syncModeUI();
  renderAllViews();
}

function syncControlsToState() {
  if (DOM.beamSpreadSlider) {
    DOM.beamSpreadSlider.value = state.spread;
    DOM.beamSpreadVal.textContent = `${state.spread}° (${state.spread >= 350 ? 'Omni' : state.spread >= 160 ? 'Half' : 'Directional'})`;
  }
  if (DOM.masterIntensitySlider) {
    DOM.masterIntensitySlider.value = state.masterIntensity;
    DOM.masterIntensityVal.textContent = `${state.masterIntensity}% (${Math.round((state.masterIntensity / 100) * 1200)} lm)`;
  }
  if (DOM.r1Slider) {
    DOM.r1Slider.value = state.r1Intensity;
    DOM.r1IntensityVal.textContent = `${state.r1Intensity}%`;
  }
  if (DOM.r2Slider) {
    DOM.r2Slider.value = state.r2Intensity;
    DOM.r2IntensityVal.textContent = `${state.r2Intensity}% (${state.r2Intensity === 0 ? 'Off' : 'Active'})`;
  }
  updatePuckPositionFromAngle();
}

function updatePuckPositionFromAngle() {
  if (!DOM.dialPuck) return;
  const ringRect = 210;
  const radius = 75;
  const angleRad = (state.angle - 90) * (Math.PI / 180);
  const cx = ringRect / 2;
  const cy = ringRect / 2;
  const px = cx + radius * Math.cos(angleRad);
  const py = cy + radius * Math.sin(angleRad);
  DOM.dialPuck.style.left = `${px}px`;
  DOM.dialPuck.style.top = `${py}px`;
}

function handleDialInteraction(e) {
  if (!DOM.compassRing) return;
  const rect = DOM.compassRing.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const clientX = e.clientX || (e.touches && e.touches[0].clientX);
  const clientY = e.clientY || (e.touches && e.touches[0].clientY);
  if (clientX === undefined || clientY === undefined) return;

  const dx = clientX - centerX;
  const dy = clientY - centerY;
  let angleDeg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
  if (angleDeg < 0) angleDeg += 360;

  state.angle = angleDeg;
  updatePuckPositionFromAngle();
  renderAllViews();
}

// ==========================================
// CUSTOM PRESET CREATION
// ==========================================
function saveCustomPreset() {
  const name = DOM.newPresetName.value.trim();
  if (!name) return;

  const presetId = `custom-${Date.now()}`;
  const newPreset = {
    id: presetId,
    name: name,
    mode: state.mode,
    activeSectors: Array.from(state.activeSectors),
    angle: state.angle,
    spread: state.spread,
    masterIntensity: state.masterIntensity,
    r1Intensity: state.r1Intensity,
    r2Intensity: state.r2Intensity
  };

  state.customPresets.push(newPreset);

  // Create preset button in grid
  const btn = document.createElement('button');
  btn.className = 'btn-preset active';
  btn.dataset.preset = presetId;
  btn.innerHTML = `
    <span class="preset-emoji">⭐</span>
    <div class="preset-meta">
      <span class="preset-title">${name}</span>
      <span class="preset-detail">${state.mode === 'smart' ? 'Multi-Sector' : 'Custom Angle'}</span>
    </div>
    <button class="btn-del-preset" title="Delete preset">✕</button>
  `;

  btn.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-del-preset')) {
      e.stopPropagation();
      state.customPresets = state.customPresets.filter(p => p.id !== presetId);
      btn.remove();
      applyPreset('study-r1');
      return;
    }
    applyPreset(presetId);
  });

  DOM.presetGrid.appendChild(btn);

  // Close form
  DOM.newPresetName.value = '';
  DOM.newPresetForm.style.display = 'none';
  applyPreset(presetId);
}

// ==========================================
// DOWNLOAD / EXPORT IMAGES
// ==========================================
function downloadCanvasAsImage(canvas, filename) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function exportAllFlatImages() {
  downloadCanvasAsImage(DOM.canvasTop, 'halo_axis_1_top_view_xy_floorplan.png');
  setTimeout(() => {
    downloadCanvasAsImage(DOM.canvasFront, 'halo_axis_2_front_elevation_xz_crosssection.png');
  }, 250);
  setTimeout(() => {
    downloadCanvasAsImage(DOM.canvasSide, 'halo_axis_3_side_elevation_yz_profile.png');
  }, 500);
}

// ==========================================
// EVENT LISTENERS
// ==========================================
function bindEventListeners() {
  // Mode Switch
  DOM.btnModeContinuous.addEventListener('click', () => setMode('continuous'));
  DOM.btnModeSmart.addEventListener('click', () => setMode('smart'));

  // Smart Light Sector Toggles
  DOM.sectorButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const sec = parseInt(btn.dataset.sector, 10);
      if (state.activeSectors.has(sec)) {
        state.activeSectors.delete(sec);
      } else {
        state.activeSectors.add(sec);
      }
      btn.classList.toggle('active', state.activeSectors.has(sec));
      renderAllViews();
    });
  });

  // Quick Multi-Sector shortcuts
  if (DOM.btnSecDeskDoor) {
    DOM.btnSecDeskDoor.addEventListener('click', () => {
      state.activeSectors = new Set([0, 6]); // Door (0) + Desk (6)
      syncModeUI();
      renderAllViews();
    });
  }
  if (DOM.btnSecDeskWindow) {
    DOM.btnSecDeskWindow.addEventListener('click', () => {
      state.activeSectors = new Set([4, 6]); // Window (4) + Desk (6)
      syncModeUI();
      renderAllViews();
    });
  }
  if (DOM.btnSecShieldBed) {
    DOM.btnSecShieldBed.addEventListener('click', () => {
      // Remove Bed sectors (1, 2, 3)
      state.activeSectors.delete(1);
      state.activeSectors.delete(2);
      state.activeSectors.delete(3);
      if (state.activeSectors.size === 0) state.activeSectors.add(6);
      syncModeUI();
      renderAllViews();
    });
  }

  // Furniture Layout Selector
  DOM.layoutButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.layoutButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const layout = btn.dataset.layout;
      state.furnitureLayout = layout;

      const labels = {
        default: 'Standard (Desk Left, Bed Right)',
        inverted: 'Inverted (Bed Left, Desk Right)',
        diagonal: 'Diagonal (Desk NW, Bed SE)',
        opposite: 'Window/Door (Desk S, Bed N)'
      };
      if (DOM.currentLayoutLabel) DOM.currentLayoutLabel.textContent = labels[layout] || layout;

      renderAllViews();
    });
  });

  // New Preset Buttons
  DOM.btnOpenNewPreset.addEventListener('click', () => {
    DOM.newPresetForm.style.display = DOM.newPresetForm.style.display === 'none' ? 'block' : 'none';
    if (DOM.newPresetForm.style.display === 'block') DOM.newPresetName.focus();
  });
  DOM.btnSavePreset.addEventListener('click', saveCustomPreset);
  DOM.btnCancelPreset.addEventListener('click', () => {
    DOM.newPresetForm.style.display = 'none';
  });
  DOM.newPresetName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveCustomPreset();
  });

  // Default Presets
  document.querySelectorAll('.btn-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.preset) applyPreset(btn.dataset.preset);
    });
  });

  // Dial Joystick
  const onPointerDown = (e) => {
    state.isDraggingPuck = true;
    handleDialInteraction(e);
  };
  const onPointerMove = (e) => {
    if (state.isDraggingPuck) handleDialInteraction(e);
  };
  const onPointerUp = () => {
    state.isDraggingPuck = false;
  };

  if (DOM.dialTouchArea) {
    DOM.dialTouchArea.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    DOM.dialTouchArea.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);
  }

  // Continuous Sliders
  if (DOM.beamSpreadSlider) {
    DOM.beamSpreadSlider.addEventListener('input', (e) => {
      state.spread = parseInt(e.target.value, 10);
      DOM.beamSpreadVal.textContent = `${state.spread}° (${state.spread >= 350 ? 'Omni' : state.spread >= 160 ? 'Half' : 'Directional'})`;
      renderAllViews();
    });
  }

  DOM.masterIntensitySlider.addEventListener('input', (e) => {
    state.masterIntensity = parseInt(e.target.value, 10);
    DOM.masterIntensityVal.textContent = `${state.masterIntensity}% (${Math.round((state.masterIntensity / 100) * 1200)} lm)`;
    renderAllViews();
  });

  DOM.r1Slider.addEventListener('input', (e) => {
    state.r1Intensity = parseInt(e.target.value, 10);
    DOM.r1IntensityVal.textContent = `${state.r1Intensity}%`;
    renderAllViews();
  });

  DOM.r2Slider.addEventListener('input', (e) => {
    state.r2Intensity = parseInt(e.target.value, 10);
    DOM.r2IntensityVal.textContent = `${state.r2Intensity}% (${state.r2Intensity === 0 ? 'Off' : 'Active'})`;
    renderAllViews();
  });

  // Direction shortcuts
  DOM.dirBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.dirBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (btn.dataset.angle) {
        state.angle = parseInt(btn.dataset.angle, 10);
        updatePuckPositionFromAngle();
        renderAllViews();
      } else if (btn.dataset.mode === 'split') {
        state.spread = 180;
        state.r1Intensity = 80;
        state.r2Intensity = 80;
        syncControlsToState();
        renderAllViews();
      }
    });
  });

  // Tab View Switcher
  DOM.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.view;
      state.viewMode = view;

      if (view === 'grid') {
        DOM.axisCards.top.style.display = 'flex';
        DOM.axisCards.front.style.display = 'flex';
        DOM.axisCards.side.style.display = 'flex';
      } else if (view === 'top') {
        DOM.axisCards.top.style.display = 'flex';
        DOM.axisCards.front.style.display = 'none';
        DOM.axisCards.side.style.display = 'none';
      } else if (view === 'front') {
        DOM.axisCards.top.style.display = 'none';
        DOM.axisCards.front.style.display = 'flex';
        DOM.axisCards.side.style.display = 'none';
      } else if (view === 'side') {
        DOM.axisCards.top.style.display = 'none';
        DOM.axisCards.front.style.display = 'none';
        DOM.axisCards.side.style.display = 'flex';
      }
    });
  });

  // Export buttons
  DOM.btnDownloadTop.addEventListener('click', () => {
    downloadCanvasAsImage(DOM.canvasTop, 'halo_axis_1_top_view_xy_floorplan.png');
  });
  DOM.btnDownloadFront.addEventListener('click', () => {
    downloadCanvasAsImage(DOM.canvasFront, 'halo_axis_2_front_elevation_xz_crosssection.png');
  });
  DOM.btnDownloadSide.addEventListener('click', () => {
    downloadCanvasAsImage(DOM.canvasSide, 'halo_axis_3_side_elevation_yz_profile.png');
  });

  if (DOM.btnExportAllImagesNav) {
    DOM.btnExportAllImagesNav.addEventListener('click', () => {
      exportAllFlatImages();
    });
  }
}

// Run on page load
window.addEventListener('DOMContentLoaded', init);
