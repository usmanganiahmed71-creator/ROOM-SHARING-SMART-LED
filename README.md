# Halo • Smart Adaptive Illumination System

> **A WiFi-Controlled, Directionally Addressable LED Bulb Simulation for Shared Living Spaces**  
> *BAMAT207 Probability and Statistics Lab Project*

---

## 👥 Authors & Academic Attribution

- **Abdullah Aijaz** (Registration No: `25BYB0123`)
- **Aarnav Bahadur Mathur** (Registration No: `25BYB0141`)
- **Usman Gani Ahmed** (Registration No: `25BYB0150`)
- **Faculty Guide:** Dr. Yamuna M, Professor, School of Advanced Sciences

---

## 📖 Executive Summary & Abstract

Traditional consumer LED bulbs suffer from two fundamental engineering limitations:
1. **Fixed Lumen Output:** Inflexible brightness forcing users to either over-illuminate or under-illuminate their room.
2. **Unadjustable Radial Illumination:** Bulbs emit uniformly in all 360° directions with zero spatial selectivity.

In shared residential spaces (e.g., college dorms, hostel rooms, shared apartments), this limitation causes severe conflict. When **Roommate 1** needs high-intensity task lighting to study late at night, **Roommate 2** is flooded with unwanted light and glare (>150 Lux), disturbing sleep and circadian rhythm.

**Halo** solves this dilemma through an **ESP32 microcontroller** driving an array of individually addressable LEDs (WS2812B NeoPixel family) arranged over a spherical bulb enclosure. By controlling individual LED sectors wirelessly from a smartphone, Halo abstracts complex addressable LED driving into an intuitive interface—allowing users to direct illumination selectively onto the study desk while casting the roommate's bed in deep shadow (<5 Lux), reducing electrical power consumption by over 50% with **zero mechanical moving parts**.

---

## 🚀 Key Features

### Part 1: Smartphone Controller Simulator (`Halo IoT`)
- **Dual Emission Modes:**
  - **Smart Light Mode (Multi-Sector):** Select and illuminate multiple discrete, non-continuous sectors simultaneously (e.g., lighting the desk and the entryway while keeping the bed sector dark).
  - **Single Beam Mode (Continuous Arc):** Smooth 360° steering dial with variable beam spread aperture (30° spotlight to 360° omnidirectional flood).
- **8-Sector Independent Grid:**
  - `S1: Door (0°–45°)` • `S2: NE (45°–90°)` • `S3: Bed (90°–135°)` • `S4: SE (135°–180°)`
  - `S5: Window (180°–225°)` • `S6: SW (225°–270°)` • `S7: Desk (270°–315°)` • `S8: NW (315°–360°)`
- **Intensity & Dual-Zone Regulation:**
  - Master lumen intensity slider (0–100%, up to 1200 lumens).
  - Independent weights for **Study Desk Zone** and **Sleeping Bed Zone**.
- **Interactive Radial Steering Dial:**
  - 360° touch/drag joystick puck.
  - Active 24-LED virtual WS2812B ring visualizer reflecting firmware output.
- **Custom Preset Creation & Storage:**
  - Create, name, save, and delete custom lighting profiles with one click.
- **Dynamic Furniture Placement:**
  - Reconfigure room furniture across 4 layouts:
    - **Standard:** Desk Left (West) • Bed Right (East)
    - **Inverted:** Bed Left (West) • Desk Right (East)
    - **Diagonal:** Desk Top-Left (NW) • Bed Bottom-Right (SE)
    - **Window/Door:** Desk at Window (South) • Bed at Entryway (North)

---

### Part 2: Shared Room Simulation Across 3 Flat Orthographic Axes
All 3 engineering projections render at 60 FPS using HTML5 Canvas with real-time photometric ray-tracing and isolux falloff:

1. **Axis 1: Top-Down Floor Plan ($X-Y$ Plane)**
   - Overhead architectural plan of the 6.0m × 4.2m room.
   - Shows desk, ergonomic chair, laptop, study rug, bed frame, pillow, blanket, window wall, and entry door.
   - Dynamic photometric light field, beam cones, and floor Lux heatmaps.
2. **Axis 2: Front Elevation Cross-Section ($X-Z$ Plane)**
   - Transverse cross-section illustrating ceiling height (2.8m) and central pendant bulb fixture.
   - Visualizes downward volumetric light cones falling directly on the student while shielding the sleeping roommate.
3. **Axis 3: Side Elevation Longitudinal Profile ($Y-Z$ Plane)**
   - Depth profile along the symmetry divider axis showing forward-backward beam spread, exterior window, and doorway boundaries.
4. **CAD Image Export:**
   - Dedicated **Download PNG ↗** button on each axis card.
   - Top-level **Export 3-Axis Flat Images ↗** button to snapshot all three orthographic views simultaneously.

---

## 📐 Photometric & Mathematical Model

The simulation computes real-time illuminance using standard lighting engineering equations:

$$E = \frac{I \cdot \cos(\theta)}{d^2} + E_{\text{ambient}}$$

Where:
- $E$: Illuminance at the target point in **Lux** ($\text{lm}/\text{m}^2$).
- $I$: Luminous intensity of the active LED sector(s) in candelas.
- $\theta$: Angle of incidence between the beam vector and the surface normal.
- $d$: Distance from the central bulb fixture to the target probe.
- $E_{\text{ambient}}$: Diffuse room bounce reflection.

### Sleep Safety & Conflict Resolution Index
- **Study Desk Target:** $300 - 500\text{ Lux}$ (optimal reading/task illumination).
- **Bed Glare Threshold:** $< 15\text{ Lux}$ (circadian sleep safety standard).
- **Conflict Free Rating:** When the study desk receives $>300\text{ Lux}$ while the bed receives $<10\text{ Lux}$, the system achieves a **100% Conflict Free** score.

---

## 🎨 Design & Aesthetic Language

Inspired by the modern **Sadewa agency template**:
- **Palette:** Sleek cool-grey page backdrop (`#eaedf2`), high-contrast ink-black surfaces (`#0f172a`), and vibrant neon lime accents (`#a3e635`).
- **Typography:** `Space Grotesk` for bold display headings, `Plus Jakarta Sans` for body copy, and `JetBrains Mono` for engineering metrics.
- **3D Glass Emblem:** Dual interlocking translucent glowing glass shapes (neon lime and icy slate) with glossy bevels.
- **Buttons:** Solid black capsules paired with vibrant lime-green arrow badges (`↗`).
- **Mosaic Background:** Faint pixel checkerboard pattern at viewport boundaries.

---

## 💻 Tech Stack & Zero-Dependency Setup

- **Frontend:** Pure Vanilla HTML5, Vanilla CSS3, Vanilla JavaScript (ES6+).
- **Graphics Engine:** HTML5 2D Canvas API (hardware-accelerated, zero external runtime libraries).
- **Fonts:** Google Fonts (`Space Grotesk`, `Plus Jakarta Sans`, `JetBrains Mono`).
- **Local Server:** Built-in Python HTTP server.

---

## 🛠️ How to Run Locally

### 1. Prerequisites
- Python 3 installed on your machine.

### 2. Start the Local Server
Open a terminal in the project directory:
```bash
python3 -m http.server 3000 --bind 127.0.0.1
```

### 3. Open in Browser
Visit the application at:
```
http://127.0.0.1:3000
```

---

## 📁 Repository File Structure

```
├── index.html                  # Main application structure, hero, phone frame & CAD viewports
├── styles.css                  # Sadewa-inspired design system, glassmorphism & responsive layouts
├── app.js                      # Photometric calculations, multi-sector logic & canvas rendering
├── README.md                   # Complete project documentation & scientific overview
├── First_Review_Smart_Bulb.docx# Original course project review report
└── Untitled 1.odt             # Course abstract & background documentation
```

---

## 📜 Course Citation

*School of Advanced Sciences (SAS)*  
*BAMAT207 Probability and Statistics Lab*  
*Project Title: "Smart Adaptive Illumination: A WiFi-Controlled, Directionally Addressable LED Bulb"*  
*Guided by: Dr. Yamuna M, Professor*
