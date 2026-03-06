# পড়া শিখি 🌟 — Preschool Reading PWA

## Deploy to Vercel (Step-by-Step)

### Step 1 — GitHub এ Repository তৈরি করো
1. [github.com/new](https://github.com/new) এ যাও
2. Repository name দাও: `pora-shikhi`
3. **Public** রাখো
4. **Create repository** চাপো

### Step 2 — ফাইলগুলো Upload করো
Repository-তে গিয়ে **"uploading an existing file"** লিংকে চাপো।
এই ফাইলগুলো একসাথে drag করে upload করো:
```
index.html
style.css
script.js
manifest.json
sw.js
vercel.json
icon-192.png
icon-512.png
apple-touch-icon.png
```
**Commit changes** চাপো।

### Step 3 — Vercel এ Deploy করো
1. [vercel.com](https://vercel.com) এ যাও → **Sign up with GitHub**
2. **"Add New Project"** চাপো
3. তোমার `pora-shikhi` repository টি select করো
4. **Framework Preset: Other** রাখো (Next.js বা কিছু select করো না)
5. **Deploy** চাপো
6. ২-৩ মিনিট অপেক্ষা করো → তোমার লিংক পেয়ে যাবে!

### Step 4 — PWA Install (Add to Home Screen)

**Android Chrome:**
1. Vercel লিংক Chrome এ খোলো
2. Menu (⋮) → **"Add to Home screen"** চাপো
3. **"Install"** চাপো → Done! ✅

**iOS Safari:**
1. Vercel লিংক Safari এ খোলো
2. Share বোতাম (□↑) চাপো
3. **"Add to Home Screen"** চাপো
4. **"Add"** চাপো → Done! ✅

---
## File Structure
```
/
├── index.html          ← মূল পেজ
├── style.css           ← সব style
├── script.js           ← সব JavaScript
├── manifest.json       ← PWA manifest
├── sw.js               ← Service Worker (offline)
├── vercel.json         ← Vercel headers config
├── icon-192.png        ← App icon (Android)
├── icon-512.png        ← App icon (splash)
└── apple-touch-icon.png← App icon (iOS)
```
