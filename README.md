# Kishore V — Portfolio 3D

Angular 22 rebuild of the portfolio with WebGL / CSS 3D effects.

## Run

```bash
npm install
npm start          # http://localhost:4200
npm run build      # production build -> dist/portfolio-3d/browser
```

For Netlify: build command `npm run build`, publish directory `dist/portfolio-3d/browser`.

## Where things live

| What | File |
| --- | --- |
| **All text content** (profile, skills, projects, experience, education) | `src/app/data/portfolio.data.ts` |
| Theme colors (dark + light) | `src/styles.scss` (top of file) |
| 3D hero scene (three.js) | `src/app/sections/hero/hero-scene.ts` |
| 3D skills sphere | `src/app/sections/skills.ts` |
| Skill icons (brand logos + fallbacks) | `src/app/core/skill-icon.ts`, `src/app/core/brand-icons.ts` |
| Resume PDF, screenshots, favicon | `public/assets/` |

## 3D / motion features

- three.js hero: faceted glowing core, wireframe shell, orbit rings with satellites, particle field, mouse parallax (lazy-loaded, pauses off-screen)
- Draggable 3D skills globe (geodesic wireframe canvas + brand icons via simple-icons, CC0); picking a category rotates it to face you
- 3D tilt + glare on cards, CSS 3D cubes on project cards, learning-journey timeline with animated score rings for education
- Perspective grid floor, scroll-reveal with 3D rotation, scroll progress bar
- Respects `prefers-reduced-motion`; dark/light theme saved per visitor
