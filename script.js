/* ================================================
   script.js — পড়া শিখি
   Fixed Gemini API + PWA Service Worker registration
   ================================================ */

/* ── DATA ── */
const abcdData = [
  {letter:'A',sound:'অ',emoji:'🍎'}, {letter:'B',sound:'ব',emoji:'🎈'},
  {letter:'C',sound:'ক',emoji:'🐱'}, {letter:'D',sound:'দ',emoji:'🥁'},
  {letter:'E',sound:'এ',emoji:'🐘'}, {letter:'F',sound:'ফ',emoji:'🐟'},
  {letter:'G',sound:'গ',emoji:'🍇'}, {letter:'H',sound:'হ',emoji:'🏠'},
  {letter:'I',sound:'ই',emoji:'🍦'}, {letter:'J',sound:'জ',emoji:'🎃'},
  {letter:'K',sound:'ক',emoji:'🪁'}, {letter:'L',sound:'ল',emoji:'🦁'},
  {letter:'M',sound:'ম',emoji:'🌙'}, {letter:'N',sound:'ন',emoji:'🌰'},
  {letter:'O',sound:'ও',emoji:'🐙'}, {letter:'P',sound:'প',emoji:'🍕'},
  {letter:'Q',sound:'ক',emoji:'👑'}, {letter:'R',sound:'র',emoji:'🌈'},
  {letter:'S',sound:'স',emoji:'☀️'}, {letter:'T',sound:'ত',emoji:'🌴'},
  {letter:'U',sound:'উ',emoji:'☂️'}, {letter:'V',sound:'ভ',emoji:'🎻'},
  {letter:'W',sound:'ওয়',emoji:'🌊'},{letter:'X',sound:'এক্স',emoji:'❌'},
  {letter:'Y',sound:'ইয়',emoji:'🪀'},{letter:'Z',sound:'জ',emoji:'🦓'},
];

const banglaData = [
  {letter:'অ',word:'অনল',emoji:'🔥'}, {letter:'আ',word:'আম',emoji:'🥭'},
  {letter:'ই',word:'ইট',emoji:'🧱'},  {letter:'ঈ',word:'ঈগল',emoji:'🦅'},
  {letter:'উ',word:'উট',emoji:'🐪'},  {letter:'ঊ',word:'ঊষা',emoji:'🌅'},
  {letter:'এ',word:'এক',emoji:'1️⃣'}, {letter:'ঐ',word:'ঐরাবত',emoji:'🐘'},
  {letter:'ও',word:'ওষুধ',emoji:'💊'},{letter:'ঔ',word:'ঔষধ',emoji:'🌿'},
  {letter:'ক',word:'কলা',emoji:'🍌'}, {letter:'খ',word:'খরগোশ',emoji:'🐰'},
  {letter:'গ',word:'গরু',emoji:'🐄'}, {letter:'ঘ',word:'ঘর',emoji:'🏠'},
  {letter:'চ',word:'চাঁদ',emoji:'🌙'},{letter:'ছ',word:'ছাতা',emoji:'☂️'},
  {letter:'জ',word:'জল',emoji:'💧'},  {letter:'ঝ',word:'ঝড়',emoji:'⛈️'},
  {letter:'ট',word:'টমেটো',emoji:'🍅'},{letter:'ড',word:'ডাক',emoji:'📬'},
  {letter:'ত',word:'তরমুজ',emoji:'🍉'},{letter:'দ',word:'দই',emoji:'🥛'},
  {letter:'ন',word:'নদী',emoji:'🌊'}, {letter:'প',word:'পাখি',emoji:'🐦'},
  {letter:'ফ',word:'ফুল',emoji:'🌸'}, {letter:'ব',word:'বই',emoji:'📚'},
  {letter:'ভ',word:'ভালুক',emoji:'🐻'},{letter:'ম',word:'মাছ',emoji:'🐟'},
  {letter:'র',word:'রং',emoji:'🎨'},  {letter:'ল',word:'লাল',emoji:'🔴'},
  {letter:'শ',word:'শিয়াল',emoji:'🦊'},{letter:'স',word:'সূর্য',emoji:'☀️'},
  {letter:'হ',word:'হাতি',emoji:'🐘'},
];

/*
  Offline fallback word bank — used when API is unavailable.
  Words are grouped in sets of 5 so we can rotate them.
*/
const fallbackWordSets = [
  ['আম','জল','মাছ','গরু','বই'],
  ['ফুল','পাখি','চাঁদ','নদী','ঘর'],
  ['কলা','লাল','রং','দই','উট'],
  ['মাটি','পথ','কাক','বন','ধান'],
  ['রাত','দিন','সূর্য','বায়ু','মেঘ'],
];
let fallbackIndex = 0;


/* ─────────────────────────────────────────
   PAGE SWITCHING
───────────────────────────────────────── */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}


/* ─────────────────────────────────────────
   BUILD LETTER CARDS
───────────────────────────────────────── */
function buildCards(data, gridId, letterKey, wordKey) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  data.forEach(item => {
    const card = document.createElement('div');
    card.className = 'letter-card';
    card.innerHTML = `
      <span style="font-size:34px;display:block;margin-bottom:4px">${item.emoji}</span>
      <span class="card-letter">${item[letterKey]}</span>
      <span class="card-word">${item[wordKey]}</span>`;
    card.addEventListener('click', () => {
      speakText(item[letterKey] + ' ' + item[wordKey]);
      wiggle(card);
    });
    grid.appendChild(card);
  });
}


/* ─────────────────────────────────────────
   ANIMATIONS & SPEECH
───────────────────────────────────────── */
function wiggle(el) {
  el.style.transform = 'scale(1.15) rotate(3deg)';
  el.style.transition = 'transform 0.15s';
  setTimeout(() => { el.style.transform = ''; }, 200);
}

function speakText(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'bn-BD';
  u.rate = 0.8;
  u.pitch = 1.2;
  window.speechSynthesis.speak(u);
}


/* ─────────────────────────────────────────
   GEMINI API — PRACTICE WORDS
   Fixed: proper headers, error handling,
   offline fallback word bank
───────────────────────────────────────── */
let GEMINI_API_KEY = '';

/* Save the API key typed by the user */
function saveKey() {
  const val = document.getElementById('api-key-input').value.trim();
  if (!val) return;
  GEMINI_API_KEY = val;

  // Clear the input for security
  document.getElementById('api-key-input').value = '';
  document.getElementById('api-key-input').placeholder = 'Key সেট আছে ✅';

  // Show the green confirmation tag
  const status = document.getElementById('key-status');
  status.classList.remove('hidden');
  setTimeout(() => status.classList.add('hidden'), 3000);
}

/* Called when "নতুন শব্দ দাও!" button is pressed */
async function generateWords() {
  // Show spinner, hide old results
  document.getElementById('loading-spinner').classList.remove('hidden');
  document.getElementById('error-box').classList.add('hidden');
  document.getElementById('words-output').innerHTML = '';

  // If no API key, use offline fallback immediately
  if (!GEMINI_API_KEY) {
    setTimeout(() => {
      document.getElementById('loading-spinner').classList.add('hidden');
      useFallback('API Key দেওয়া নেই — অফলাইন শব্দ দেখানো হচ্ছে।');
    }, 500);
    return;
  }

  /* ── Gemini API call ── */
  const prompt =
    'তুমি একজন বাংলা শিক্ষক। প্রাথমিক স্তরের শিশুদের জন্য ৫টি সহজ বাংলা শব্দ দাও। ' +
    'শব্দগুলো সর্বোচ্চ ২ অক্ষরের হবে। ' +
    'শুধু শব্দগুলো দাও প্রতিটি আলাদা লাইনে। কোনো নম্বর, চিহ্ন বা ব্যাখ্যা দেওয়ার দরকার নেই।';

  try {
    const apiUrl =
      'https://generativelanguage.googleapis.com/v1beta/models/' +
      'gemini-2.0-flash:generateContent?key=' + GEMINI_API_KEY;

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        /* No 'Origin' or custom headers that trigger CORS preflight */
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 60,
          temperature: 0.9,
          stopSequences: []
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ]
      })
    });

    if (!res.ok) {
      // HTTP error (401 bad key, 429 quota, etc.)
      const errData = await res.json().catch(() => ({}));
      const msg = errData?.error?.message || `HTTP ${res.status}`;
      throw new Error(msg);
    }

    const data = await res.json();

    // Extract text from response
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!rawText.trim()) throw new Error('Gemini থেকে কোনো উত্তর আসেনি।');

    // Parse words: split by newlines, strip bullets/numbers
    const words = rawText
      .split('\n')
      .map(w => w.replace(/^[\d\.\-\*\s।]+/, '').trim())
      .filter(w => w.length > 0 && w.length <= 10); // sanity check

    if (words.length === 0) throw new Error('শব্দ পার্স করা যায়নি।');

    displayWords(words.slice(0, 5));

  } catch (err) {
    console.error('Gemini error:', err);
    // Show error and fall back to offline words
    useFallback('Gemini সমস্যা: ' + err.message + ' — অফলাইন শব্দ দেখানো হচ্ছে।');
  } finally {
    document.getElementById('loading-spinner').classList.add('hidden');
  }
}

/* Show next set of fallback words with an info message */
function useFallback(reason) {
  const words = fallbackWordSets[fallbackIndex % fallbackWordSets.length];
  fallbackIndex++;
  displayWords(words);

  // Show a soft info message (not a red error)
  const box = document.getElementById('error-box');
  box.style.background = '#fff8e1';
  box.style.borderColor = '#ffd700';
  box.style.color = '#7b5800';
  box.classList.remove('hidden');
  box.innerHTML = `ℹ️ ${reason}`;
}

/* Render word cards on screen */
function displayWords(words) {
  const out = document.getElementById('words-output');
  out.innerHTML = '';
  words.forEach(word => {
    const c = document.createElement('div');
    c.className = 'word-card';
    c.textContent = word;
    c.addEventListener('click', () => { speakText(word); wiggle(c); });
    out.appendChild(c);
  });
}


/* ─────────────────────────────────────────
   PWA — Service Worker + Install Prompt
───────────────────────────────────────── */

/* Register the service worker — absolute path required for Vercel root deploy */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(reg => console.log('✅ SW registered, scope:', reg.scope))
      .catch(err => console.warn('SW registration failed:', err));
  });
}

/* Capture the browser's "beforeinstallprompt" event
   so we can show our own install button */
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  // Don't show the browser's mini-infobar
  e.preventDefault();
  deferredInstallPrompt = e;

  // Show our custom install bar on the home screen
  document.getElementById('pwa-install-bar').classList.remove('hidden');
});

/* Called when the user taps our install button */
function installPWA() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice.then(choice => {
    if (choice.outcome === 'accepted') {
      console.log('✅ PWA installed!');
    }
    deferredInstallPrompt = null;
    document.getElementById('pwa-install-bar').classList.add('hidden');
  });
}

/* Hide install bar once the app is installed */
window.addEventListener('appinstalled', () => {
  document.getElementById('pwa-install-bar').classList.add('hidden');
  deferredInstallPrompt = null;
});


/* ─────────────────────────────────────────
   INIT — single DOMContentLoaded for everything
───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  buildCards(abcdData,   'abcd-grid',   'letter', 'sound');
  buildCards(banglaData, 'bangla-grid', 'letter', 'word');
  buildEngLetters();
  buildDigraphs();
  buildRules();
  console.log('🌟 পড়া শিখি অ্যাপ প্রস্তুত!');
});


/* ══════════════════════════════════════════════════════
   ইংরেজি শিখি — DATA & BUILD FUNCTIONS
══════════════════════════════════════════════════════ */

/* ── A-Z Letter Data ── */
const engLetterData = [
  { letter:'A', name:'(এ)',   sounds:'অ, আ, এ, অ্যা', color:'#e07b54',
    examples:'Apple (অ্যাপল), Ball (বল), Cat (ক্যাট)' },
  { letter:'B', name:'(বি)',  sounds:'ব',              color:'#e07b54',
    examples:'Bat (ব্যাট), Book (বুক), Baby (বেবি)' },
  { letter:'C', name:'(সি)',  sounds:'ক, স',           color:'#d4916a',
    examples:'Cat (ক্যাট), City (সিটি), Cup (কাপ)' },
  { letter:'D', name:'(ডি)',  sounds:'ড',              color:'#e07b54',
    examples:'Dog (ডগ), Door (ডোর), Duck (ডাক)' },
  { letter:'E', name:'(ই)',   sounds:'এ, ই, ঈ',        color:'#d4916a',
    examples:'Egg (এগ), Elephant (এলিফ্যান্ট), Eve (ইভ)' },
  { letter:'F', name:'(এফ)', sounds:'ফ',              color:'#e07b54',
    examples:'Fish (ফিশ), Frog (ফ্রগ), Fan (ফ্যান)' },
  { letter:'G', name:'(জি)', sounds:'গ, জ',           color:'#d4916a',
    examples:'Goat (গোট), Gem (জেম), Girl (গার্ল)' },
  { letter:'H', name:'(এইচ)',sounds:'হ',              color:'#e07b54',
    examples:'Hat (হ্যাট), Hand (হ্যান্ড), Home (হোম)' },
  { letter:'I', name:'(আই)', sounds:'ই, আই',          color:'#d4916a',
    examples:'Ink (ইংক), Ice (আইস), Itch (ইচ)' },
  { letter:'J', name:'(জে)', sounds:'জ',              color:'#e07b54',
    examples:'Jam (জ্যাম), Jump (জাম্প), Jet (জেট)' },
  { letter:'K', name:'(কে)', sounds:'ক',              color:'#d4916a',
    examples:'Kite (কাইট), King (কিং), Key (কি)' },
  { letter:'L', name:'(এল)', sounds:'ল',              color:'#e07b54',
    examples:'Lion (লায়ন), Lamp (ল্যাম্প), Leaf (লিফ)' },
  { letter:'M', name:'(এম)', sounds:'ম',              color:'#d4916a',
    examples:'Moon (মুন), Mango (ম্যাঙ্গো), Map (ম্যাপ)' },
  { letter:'N', name:'(এন)', sounds:'ন',              color:'#e07b54',
    examples:'Nut (নাট), Nose (নোজ), Net (নেট)' },
  { letter:'O', name:'(ও)',  sounds:'অ, ও, উ',        color:'#d4916a',
    examples:'Ox (অক্স), Open (ওপেন), Old (ওল্ড)' },
  { letter:'P', name:'(পি)', sounds:'প',              color:'#e07b54',
    examples:'Pen (পেন), Pig (পিগ), Pot (পট)' },
  { letter:'Q', name:'(কিউ)',sounds:'কু',             color:'#d4916a',
    examples:'Queen (কুইন), Quiz (কুইজ)' },
  { letter:'R', name:'(আর)', sounds:'র',              color:'#e07b54',
    examples:'Rat (র‍্যাট), Rain (রেইন), Rose (রোজ)' },
  { letter:'S', name:'(এস)', sounds:'স, জ',           color:'#d4916a',
    examples:'Sun (সান), Snake (স্নেক), Sea (সি)' },
  { letter:'T', name:'(টি)', sounds:'ট, ত',           color:'#e07b54',
    examples:'Top (টপ), Tree (ট্রি), Tiger (টাইগার)' },
  { letter:'U', name:'(ইউ)', sounds:'আ, উ, ইউ',       color:'#d4916a',
    examples:'Up (আপ), Use (ইউজ), Ugly (আগলি)' },
  { letter:'V', name:'(ভি)', sounds:'ভ',              color:'#e07b54',
    examples:'Van (ভ্যান), Vest (ভেস্ট), Voice (ভয়েস)' },
  { letter:'W', name:'(ডাবলিউ)',sounds:'ওয়',          color:'#d4916a',
    examples:'Water (ওয়াটার), Wind (উইন্ড), Worm (ওয়ার্ম)' },
  { letter:'X', name:'(এক্স)',sounds:'ক্স, জ',        color:'#e07b54',
    examples:'Box (বক্স), Fox (ফক্স), Xray (এক্সরে)' },
  { letter:'Y', name:'(ওয়াই)',sounds:'ইয়, আই',        color:'#d4916a',
    examples:'Yes (ইয়েস), Yak (ইয়াক), Yell (ইয়েল)' },
  { letter:'Z', name:'(জেড)',sounds:'জ',              color:'#e07b54',
    examples:'Zoo (জু), Zero (জিরো), Zip (জিপ)' },
];

/* ── Digraph Data ── */
const digraphData = [
  { letters:'CH', name:'(সি-এইচ)', sounds:'চ, ক, শ', color:'#c0392b',
    examples:'Chair (চেয়ার), School (স্কুল), Chef (শেফ)' },
  { letters:'SH', name:'(এস-এইচ)', sounds:'শ',        color:'#c0392b',
    examples:'Ship (শিপ), Fish (ফিশ), Dish (ডিশ)' },
  { letters:'TH', name:'(টি-এইচ)', sounds:'থ, দ',      color:'#c0392b',
    examples:'This (দিস), Think (থিংক), Bath (বাথ)' },
  { letters:'PH', name:'(পি-এইচ)', sounds:'ফ',          color:'#c0392b',
    examples:'Phone (ফোন), Photo (ফোটো), Graph (গ্রাফ)' },
  { letters:'WH', name:'(ডাবলিউ-এইচ)', sounds:'হু, ওয়', color:'#c0392b',
    examples:'What (হোয়াট), When (হোয়েন), Where (হোয়্যার)' },
  { letters:'GH', name:'(জি-এইচ)', sounds:'ফ, নীরব',   color:'#c0392b',
    examples:'Ghost (গোস্ট), Laugh (ল্যাফ), Night (নাইট)' },
  { letters:'CK', name:'(সি-কে)',   sounds:'ক',          color:'#c0392b',
    examples:'Duck (ডাক), Back (ব্যাক), Clock (ক্লক)' },
  { letters:'NG', name:'(এন-জি)',   sounds:'ং',          color:'#c0392b',
    examples:'King (কিং), Song (সং), Ring (রিং)' },
];

/* ── Reading Rules Data ── */
const readingRulesData = [
  {
    icon: '✨',
    title: 'Magic E (সাইলেন্ট E)',
    desc: 'শব্দের শেষে E থাকলে তা উচ্চারিত হয় না, কিন্তু আগের Vowel-এর উচ্চারণ বদলে দীর্ঘ করে দেয়।',
    examples: 'Cake (কেইক), Like (লাইক), Rope (রোপ), Cube (কিউব)',
  },
  {
    icon: '🔤',
    title: 'Soft C & Hard C',
    desc: 'C-এর পরে E, I বা Y থাকলে এর উচ্চারণ "স" হয় (Soft C)। বাকি সময় "ক" হয় (Hard C)।',
    examples: 'City (স-সিটি), Face (স-ফেস) | Cat (ক-ক্যাট), Cup (ক-কাপ)',
  },
  {
    icon: '📝',
    title: 'Soft G & Hard G',
    desc: 'G-এর পরে E, I বা Y থাকলে উচ্চারণ "জ" হয় (Soft G)। বাকি সময় "গ" হয় (Hard G)।',
    examples: 'Gem (জেম), Giraffe (জিরাফ) | Go (গো), Girl (গার্ল)',
  },
  {
    icon: '🔇',
    title: 'Silent Letters',
    desc: 'কিছু অক্ষর শব্দে থাকলেও উচ্চারণ হয় না। যেমন: K (Knife), W (Write), B (Climb)।',
    examples: 'Knife (নাইফ), Write (রাইট), Climb (ক্লাইম), Hour (আওয়ার)',
  },
  {
    icon: '🔗',
    title: 'Vowel Teams (একসাথে Vowel)',
    desc: 'দুটি Vowel পাশাপাশি থাকলে সাধারণত প্রথমটির লম্বা শব্দ হয়।',
    examples: 'Rain (রেইন), Boat (বোট), Seat (সিট), Pie (পাই)',
  },
  {
    icon: '📖',
    title: 'R-Controlled Vowels',
    desc: 'Vowel-এর পরে R থাকলে Vowel-এর উচ্চারণ বদলে যায়।',
    examples: 'Car (কার), Bird (বার্ড), Corn (কর্ন), Burn (বার্ন)',
  },
  {
    icon: '🔁',
    title: 'Plural Rules (-s / -es)',
    desc: 'শব্দের শেষে s, sh, ch, x, z থাকলে -es যোগ করো। বাকিতে -s যোগ করো।',
    examples: 'Cat→Cats, Box→Boxes, Dish→Dishes, Church→Churches',
  },
  {
    icon: '🏃',
    title: 'Double Letters',
    desc: 'ছোট শব্দে একটি Vowel-এর পরে Consonant যোগ করলে সেটি double হয়।',
    examples: 'Run→Running, Sit→Sitting, Big→Bigger, Hot→Hotter',
  },
];

/* ── Reading Passages ── */
const readingPassages = [
  {
    title: '🐶 The Dog',
    text: 'The dog is big. The dog can run. The dog can jump. I like the dog. The dog is my friend.',
    bangla: 'কুকুরটি বড়। কুকুরটি দৌড়াতে পারে। কুকুরটি লাফ দিতে পারে। আমি কুকুরটিকে পছন্দ করি।'
  },
  {
    title: '☀️ The Sun',
    text: 'The sun is big. The sun is hot. The sun gives us light. We need the sun to grow.',
    bangla: 'সূর্য বড়। সূর্য গরম। সূর্য আমাদের আলো দেয়। গাছ বড় হতে সূর্যের প্রয়োজন।'
  },
  {
    title: '🐱 The Cat',
    text: 'The cat is small. The cat can jump. The cat drinks milk. I love my cat.',
    bangla: 'বিড়ালটি ছোট। বিড়ালটি লাফ দিতে পারে। বিড়ালটি দুধ পান করে। আমি আমার বিড়ালকে ভালোবাসি।'
  },
  {
    title: '🌧️ The Rain',
    text: 'It is raining. The rain falls from the sky. Rain makes plants grow. I love the rain.',
    bangla: 'বৃষ্টি হচ্ছে। বৃষ্টি আকাশ থেকে পড়ে। বৃষ্টিতে গাছ বাড়ে। আমি বৃষ্টি পছন্দ করি।'
  },
  {
    title: '🐟 The Fish',
    text: 'A fish can swim. Fish live in water. Some fish are big. Some fish are small.',
    bangla: 'মাছ সাঁতার কাটতে পারে। মাছ পানিতে বাস করে। কিছু মাছ বড়। কিছু মাছ ছোট।'
  },
];
let passageIndex = 0;

/* ── Build English Letters Grid ── */
function buildEngLetters() {
  const grid = document.getElementById('eng-letters-grid');
  if (!grid) return;
  engLetterData.forEach(item => {
    const card = document.createElement('div');
    card.className = 'eng-letter-card';
    card.innerHTML = `
      <div class="eng-card-top">
        <div class="eng-card-letter-block" style="background:${item.color}">
          <span class="big-letter">${item.letter}</span>
          <span class="letter-name">${item.name}</span>
        </div>
        <div class="eng-card-right">
          <span class="sound-label">বাংলা ধ্বনি / উচ্চারণ:</span>
          <span class="sound-text">${item.sounds}</span>
        </div>
      </div>
      <div class="eng-card-bottom">
        <div class="example-label">সহজ উদাহরণ</div>
        <div class="example-text">${item.examples}</div>
      </div>`;
    card.addEventListener('click', () => {
      speakText(item.letter + '. ' + item.sounds);
      wiggle(card);
    });
    grid.appendChild(card);
  });
}

/* ── Build Digraphs Grid ── */
function buildDigraphs() {
  const grid = document.getElementById('eng-digraphs-grid');
  if (!grid) return;
  digraphData.forEach(item => {
    const card = document.createElement('div');
    card.className = 'eng-letter-card';
    card.innerHTML = `
      <div class="eng-card-top">
        <div class="eng-card-letter-block digraph-block" style="background:${item.color}">
          <span class="big-letter" style="font-size:36px">${item.letters}</span>
          <span class="letter-name">${item.name}</span>
        </div>
        <div class="eng-card-right">
          <span class="sound-label">বাংলা ধ্বনি / উচ্চারণ:</span>
          <span class="sound-text">${item.sounds}</span>
        </div>
      </div>
      <div class="eng-card-bottom">
        <div class="example-label">সহজ উদাহরণ</div>
        <div class="example-text">${item.examples}</div>
      </div>`;
    card.addEventListener('click', () => {
      speakText(item.letters + '. ' + item.sounds);
      wiggle(card);
    });
    grid.appendChild(card);
  });
}

/* ── Build Reading Rules ── */
function buildRules() {
  const list = document.getElementById('eng-rules-list');
  if (!list) return;
  readingRulesData.forEach(rule => {
    const card = document.createElement('div');
    card.className = 'eng-rule-card';
    card.innerHTML = `
      <div class="eng-rule-top">
        <div class="eng-rule-icon">${rule.icon}</div>
        <div class="eng-rule-title">${rule.title}</div>
      </div>
      <div class="eng-rule-desc">${rule.desc}</div>
      <div class="eng-rule-examples-label">উদাহরণ:</div>
      <div class="eng-rule-examples">${rule.examples}</div>`;
    card.addEventListener('click', () => {
      speakText(rule.title + '. ' + rule.examples.replace(/\(.*?\)/g,''));
      wiggle(card);
    });
    list.appendChild(card);
  });
}

/* ── Tab Switcher for English page ── */
function showEngTab(tabId) {
  // Hide all tab contents
  document.querySelectorAll('.eng-tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.eng-tab').forEach(b => b.classList.remove('active'));
  // Show chosen tab
  document.getElementById(tabId).classList.add('active');
  // Highlight the clicked button
  const idx = ['tab-letters','tab-digraphs','tab-rules'].indexOf(tabId);
  document.querySelectorAll('.eng-tab')[idx].classList.add('active');
}

/* ── Load Reading Passage ── */
function loadReading() {
  const passage = readingPassages[passageIndex % readingPassages.length];
  passageIndex++;
  const out = document.getElementById('reading-output');
  out.classList.remove('hidden');
  out.innerHTML = `
    <div style="font-size:22px;font-weight:800;color:#c0392b;margin-bottom:10px">${passage.title}</div>
    <div style="margin-bottom:12px;font-size:18px;line-height:1.8">${passage.text}</div>
    <div style="font-size:14px;color:#888;border-top:1px solid #eee;padding-top:10px;line-height:1.6">${passage.bangla}</div>
    <button onclick="speakText('${passage.text.replace(/'/g,"\\'")}');this.textContent='🔊 শোনানো হচ্ছে...';setTimeout(()=>this.textContent='🔊 শুনি',3000)"
      style="margin-top:12px;background:#c0392b;color:#fff;border:none;border-radius:12px;padding:10px 20px;font-size:16px;cursor:pointer;font-weight:700">
      🔊 শুনি
    </button>`;
}

/* All init is handled in the single DOMContentLoaded above ↑ */
