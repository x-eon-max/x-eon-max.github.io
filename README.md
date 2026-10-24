# 🌐 X-EON — Material 3 Expressive Portfolio

Personal portfolio and interactive showcase for **[X-EON](https://github.com/x-eon-max)**, hosted on GitHub Pages.

[![Website](https://img.shields.io/badge/Live-x--eon--max.github.io-1793d1?style=for-the-badge&logo=google-chrome&logoColor=white)](https://x-eon-max.github.io)
[![Design System](https://img.shields.io/badge/Design-Material%203%20Expressive-4285F4?style=for-the-badge&logo=material-design&logoColor=white)](https://m3.material.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

---

## ✨ Features & Architecture

- **Material 3 Expressive Design System**:
  - Full adherence to the M3 Expressive tokens, organic corner radius hierarchy, and spring-based motion curves (`--md-sys-motion-spring-*`).
  - **Dynamic Color Engine**: Runtime palette generation using `@material/material-color-utilities` (`SchemeVibrant`), allowing visitors to dynamically re-theme the entire portfolio to any custom hex seed color.
  - **Shape-Morphing Avatar**: Dynamic SVG polygon interpolation smoothly cycling between organic M3 Expressive shapes (cookies, clovers, squircles, sunbursts).
- **Interactive Terminal Drawer (CLI Mode)**:
  - Accessible via the top bar `[_]` icon or keyboard shortcut (`Ctrl+K` / `` ` ``).
  - Built-in command interpreter supporting `neofetch`, `projects`, `skills`, `about`, `theme <mode|color>`, and `clear`.
- **Web Audio API Synthesizer & Reactive Equalizer**:
  - In-browser generative sound engine synthesizing lush ambient chords (polyphonic sawtooth/triangle oscillators with resonant low-pass filter and stereo delay).
  - Real-time `AnalyserNode` FFT frequency visualizer animating the equalizer bars in sync with the audio.
- **Dynamic GitHub API Integration**:
  - Automatically fetches public repository counts, star counts, follower counts, and latest release tags directly from GitHub's REST API.
- **Multilingual & Responsive**:
  - Instant client-side French 🇫🇷 / English 🇬🇧 language switching.
  - Light and Dark modes with persistent user preferences in `localStorage`.
  - Responsive adaptation: desktop top app bar transitions to a native M3 bottom navigation bar on mobile viewports.

---

## 🛠️ Stack

- **HTML5 & Vanilla ECMAScript Modules**
- **Modern CSS3** (Tokens, Custom Properties, Grid, Bento layout, Backdrop Filters, CSS Spring Transitions)
- **Material Color Utilities** (`@material/material-color-utilities`)
- **Web Audio API**
- **Google Fonts** (`Roboto Flex` Variable Font, `Material Symbols Rounded`)

---

## 📄 License

Distributed under the MIT License. Developed by **[X-EON](https://github.com/x-eon-max)**.
