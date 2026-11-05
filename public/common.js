// Shared helpers for payer + LP apps. Wallet is a burner key kept in localStorage (demo only).
const $ = (id) => document.getElementById(id);
const STATUS = ['None', 'Open', 'Accepted', 'Released', 'Refunded', 'Proven', 'Disputed'];
const ABI = [
  'function orders(uint256) view returns (address payer,address lp,uint256 amount,uint256 inrPaise,bytes32 upiHash,uint64 acceptedAt,uint8 status,uint64 provenAt,bytes32 utrHash,uint256 lockedStake)',
  'function nextId() view returns (uint256)',
  'function createOrder(uint256 amount,uint256 inrPaise,bytes32 upiHash) returns (uint256)',
  'function acceptOrder(uint256 id)',
  'function submitProof(uint256 id,bytes32 utrHash,bytes sig)',
  'function confirm(uint256 id)',
  'function claim(uint256 id)',
  'function dispute(uint256 id)',
  'function disputeWindow() view returns (uint64)',
  'function resolve(uint256 id,bool payLp)',
  'function stake(address) view returns (uint256)',
  'function stakeBps() view returns (uint256)',
  'function depositStake(uint256 amount)',
  'function withdrawStake(uint256 amount)',
  'function refund(uint256 id)',
  'event OrderCreated(uint256 indexed id,address indexed payer,uint256 amount,uint256 inrPaise,bytes32 upiHash)',
];
const ERC20 = ['function transfer(address,uint256) returns (bool)', 'function balanceOf(address) view returns (uint256)', 'function approve(address,uint256) returns (bool)'];

async function api(path, body) {
  const r = await fetch(path, body ? { method: 'POST', body: JSON.stringify(body) } : undefined);
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || 'request failed');
  return j;
}

// Wallet-signed proof of identity for private endpoints (receipt, merchant UPI id, proof submission).
async function authParams(wallet, action, id) {
  const ts = Math.floor(Date.now() / 1000);
  return { ts, sig: await wallet.signMessage(`upipay:${action}:${id}:${ts}`) };
}

// ---- Wallet vault: password-encrypted keystore (with recovery phrase) in localStorage; decrypted key lives only in sessionStorage. ----
const vaultKey = (k) => 'vault:' + k, sessKey = (k) => 'sess:' + k;
const profileKey = (addr) => 'profile:' + addr.toLowerCase();
const getProfile = (addr) => { try { return JSON.parse(localStorage.getItem(profileKey(addr))) || {}; } catch { return {}; } };
const setProfile = (addr, patch) => localStorage.setItem(profileKey(addr), JSON.stringify({ ...getProfile(addr), ...patch }));
const prefs = () => { try { return { sounds: true, currency: 'INR', lang: 'en', autoLockMin: 15, notify: false, ...JSON.parse(localStorage.getItem('prefs')) }; } catch { return { sounds: true, currency: 'INR', lang: 'en', autoLockMin: 15, notify: false }; } };
const setPrefs = (p) => localStorage.setItem('prefs', JSON.stringify({ ...prefs(), ...p }));
function beep() { if (!prefs().sounds) return; try { const a = new AudioContext(), o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = 880; g.gain.value = 0.1; o.start(); o.stop(a.currentTime + 0.15); } catch {} }

// ---- Language: exact-text dictionary applied to the DOM (English is the source text) ----
const HI = {
  'Hi': 'नमस्ते', 'USDC BALANCE': 'USDC बैलेंस', 'Get test USDC': 'टेस्ट USDC लें', 'Scan UPI QR': 'UPI QR स्कैन करें',
  'Continue': 'आगे बढ़ें', 'Pay': 'भुगतान करें', 'My orders': 'मेरे ऑर्डर', 'No orders yet': 'अभी कोई ऑर्डर नहीं',
  'Paying': 'भुगतान किसे', 'Amount (₹)': 'राशि (₹)', 'Saved & recent': 'सेव और हाल के', 'Menu': 'मेनू',
  '👛 Wallet': '👛 वॉलेट', '🎧 Help & Support': '🎧 मदद और सपोर्ट', '⚙️ Settings': '⚙️ सेटिंग्स', '👤 Profile & history': '👤 प्रोफ़ाइल और हिस्ट्री',
  'Logout (lock)': 'लॉगआउट (लॉक)', 'Wallet': 'वॉलेट', 'Send': 'भेजें', 'Receive': 'प्राप्त करें', 'Buy': 'खरीदें', 'Transactions': 'लेनदेन',
  'Manage wallet': 'वॉलेट मैनेज करें', 'Settings': 'सेटिंग्स', 'Currency': 'मुद्रा', 'Language': 'भाषा', 'Sounds': 'आवाज़', 'Notifications': 'नोटिफिकेशन',
  'Auto-lock': 'ऑटो-लॉक', 'Reset to defaults': 'डिफ़ॉल्ट पर रीसेट करें', 'Help & Support': 'मदद और सपोर्ट', 'Send USDC': 'USDC भेजें',
  'To address': 'पता', 'Amount (USDC)': 'राशि (USDC)', 'DAILY STREAK · pay daily to keep it alive': 'डेली स्ट्रीक · रोज़ भुगतान करें',
  'Welcome back': 'वापसी पर स्वागत', 'Password': 'पासवर्ड', 'Unlock': 'अनलॉक करें', 'Log in →': 'लॉग इन →', 'Where do we pay out?': 'भुगतान कहाँ होगा?',
  'Pick where your merchant gets local cash.': 'चुनें कि मर्चेंट को लोकल कैश कहाँ मिलेगा।', 'Continue →': 'आगे →', 'Sign in': 'साइन इन',
  'Create new wallet': 'नया वॉलेट बनाएँ', 'I have a wallet (import)': 'मेरे पास वॉलेट है (इम्पोर्ट)', 'Create wallet': 'वॉलेट बनाएँ', 'Import': 'इम्पोर्ट',
  'Display name': 'नाम', 'Back': 'वापस', 'Scan any local payment QR and pay in USDC. The merchant gets local cash.': 'कोई भी लोकल पेमेंट QR स्कैन करें और USDC से भुगतान करें। मर्चेंट को लोकल कैश मिलता है।',
  'Activity': 'गतिविधि', 'Saved merchants': 'सेव किए मर्चेंट', 'Security': 'सुरक्षा', 'Lock': 'लॉक', 'Show recovery phrase': 'रिकवरी फ़्रेज़ दिखाएँ',
  'Copy address': 'पता कॉपी करें', 'Save merchant': 'मर्चेंट सेव करें', 'Change password': 'पासवर्ड बदलें', 'Payment receipt': 'पेमेंट रसीद',
  'Cancel': 'रद्द करें', 'Pay': 'पे', 'Merchant': 'मर्चेंट', 'Earn (LP)': 'कमाएँ (LP)', 'Arbiter': 'आर्बिटर', 'Dispute': 'विवाद', 'Confirm': 'पुष्टि करें', 'Released': 'पूरा हुआ', 'Refunded': 'रिफ़ंड', 'Open': 'खुला', 'Accepted': 'स्वीकार',
  'Proven': 'प्रमाणित', 'Disputed': 'विवादित', 'On': 'चालू', 'Off': 'बंद', 'English': 'हिंदी', 'Close': 'बंद करें',
};
const T = (txt) => (prefs().lang === 'hi' && HI[txt]) || txt;
function applyLang(root = document.body) {
  if (prefs().lang !== 'hi') return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const t = n.nodeValue.trim();
    if (HI[t]) n.nodeValue = n.nodeValue.replace(t, HI[t]);
    else if (/^Hi\s/.test(t)) n.nodeValue = n.nodeValue.replace(/^(\s*)Hi\s/, '$1नमस्ते ');
  }
  root.querySelectorAll?.('[placeholder]').forEach((e) => { if (HI[e.placeholder]) e.placeholder = HI[e.placeholder]; });
}
if (prefs().lang === 'hi') {
  document.documentElement.lang = 'hi';
  let busy = false;
  new MutationObserver((ms) => {
    if (busy) return; busy = true;
    for (const m of ms) m.addedNodes.forEach((n) => n.nodeType === 1 ? applyLang(n) : n.parentNode && applyLang(n.parentNode));
    busy = false;
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: false });
  document.addEventListener('DOMContentLoaded', () => applyLang());
}

// ---- Notifications: in-page toast + sound, and a system notification if the user allowed it ----
function toast(msg) {
  const d = document.createElement('div');
  d.textContent = msg;
  d.style.cssText = 'position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:200;background:var(--ink);color:#fff;padding:12px 18px;border-radius:999px;font-weight:700;box-shadow:3px 3px 0 var(--orange);max-width:90vw';
  document.body.append(d); setTimeout(() => d.remove(), 5000);
}
function notify(msg) {
  toast(msg); beep();
  if (prefs().notify && 'Notification' in window && Notification.permission === 'granted') new Notification('Qripto', { body: msg, icon: '/logo.png' });
}

// ---- Auto-lock after inactivity (only for password-protected wallets) ----
function startAutoLock(keyName) {
  const mins = prefs().autoLockMin;
  if (!mins || !localStorage.getItem(vaultKey(keyName))) return;
  let last = Date.now();
  ['pointerdown', 'keydown', 'touchstart'].forEach((e) => addEventListener(e, () => { last = Date.now(); }, { passive: true }));
  setInterval(() => { if (Date.now() - last > mins * 60_000) logout(keyName); }, 15_000);
}
// ---- One site, four roles: tab bar on every page ----
function navBar() {
  const m = document.querySelector('main'); if (!m || location.pathname === '/receipt') return;
  const tabs = [['/', 'Pay'], ['/merchant', 'Merchant'], ['/lp', 'Earn (LP)'], ['/arbiter', 'Arbiter']];
  const bar = document.createElement('nav');
  bar.style.cssText = 'display:flex;gap:6px;margin-bottom:14px;overflow:auto';
  for (const [href, label] of tabs) {
    const a = document.createElement('a'); a.href = href; a.textContent = label;
    const on = location.pathname === href || (href === '/' && location.pathname === '/profile');
    a.style.cssText = `padding:7px 14px;border:2px solid var(--ink);border-radius:999px;text-decoration:none;color:var(--ink);font-weight:700;font-size:14px;white-space:nowrap;background:${on ? 'var(--purple)' : '#fff'}`;
    bar.append(a);
  }
  m.prepend(bar);
}
navBar();
const AVATARS = ['🦊', '🐼', '🦁', '🐯', '🐸', '🦄', '🐙', '🚀'];

async function saveVault(keyName, wallet, password, profile) {
  localStorage.setItem(vaultKey(keyName), await wallet.encrypt(password));
  localStorage.removeItem(keyName); // drop any legacy plaintext key
  sessionStorage.setItem(sessKey(keyName), wallet.privateKey);
  if (profile) setProfile(wallet.address, profile);
}

function logout(keyName) { sessionStorage.removeItem(sessKey(keyName)); location.reload(); }

// Full-screen gate: unlock an existing vault, or create / import a wallet. Resolves with the private key.
function walletGate(keyName) {
  return new Promise((resolve) => {
    const hasVault = !!localStorage.getItem(vaultKey(keyName));
    const o = document.createElement('div');
    o.style.cssText = 'position:fixed;inset:0;z-index:99;background:var(--bg);overflow:auto';
    document.body.append(o);
    const done = (pk) => { o.remove(); resolve(pk); };
    const card = (html) => { o.innerHTML = `<main><section class="card">${html}</section></main>`; return o; };
    const busy = (btn, on, label) => { btn.disabled = on; btn.textContent = on ? 'Please wait…' : label; };

    const unlock = () => {
      let addr = ''; try { addr = JSON.parse(localStorage.getItem(vaultKey(keyName))).address; } catch {}
      const prof = addr ? getProfile('0x' + addr) : {};
      card(`<h1>Welcome back ${prof.avatar || ''}</h1><div class="muted" id="who"></div>
        <label>Password</label><input id="pw" type="password" autocomplete="current-password">
        <button id="ok" class="full">Unlock</button><div id="e" class="err"></div>
        <button id="other" class="full alt">Use a different wallet</button>`);
      o.querySelector('#who').textContent = (prof.name || 'Your wallet') + (addr ? ' · 0x' + addr.slice(0, 4) + '…' + addr.slice(-4) : '');
      const btn = o.querySelector('#ok');
      const go = async () => {
        busy(btn, true);
        try { done((await ethers.Wallet.fromEncryptedJson(localStorage.getItem(vaultKey(keyName)), o.querySelector('#pw').value)).privateKey); }
        catch { o.querySelector('#e').textContent = 'Wrong password'; busy(btn, false, 'Unlock'); }
      };
      btn.onclick = go; o.querySelector('#pw').onkeydown = (e) => e.key === 'Enter' && go();
      o.querySelector('#other').onclick = () => confirm('Your current wallet stays encrypted on this device only if you have its recovery phrase. Make sure it is backed up. Continue?') && chooser();
    };

    const finish = async (wallet, name, avatar, pw, btn, label) => {
      busy(btn, true);
      try { await saveVault(keyName, wallet, pw, { name, avatar }); done(wallet.privateKey); }
      catch (e) { o.querySelector('#e').textContent = e.message; busy(btn, false, label); }
    };
    const common = `<label>Display name</label><input id="nm" maxlength="30" placeholder="e.g. Rahul">
      <label>Password (min 8 chars, unlocks this wallet on this device)</label><input id="pw" type="password" autocomplete="new-password">`;
    const readCommon = () => {
      const pw = o.querySelector('#pw').value, name = o.querySelector('#nm').value.trim();
      if (!name) throw new Error('Enter a display name');
      if (pw.length < 8) throw new Error('Password must be at least 8 characters');
      return { pw, name, avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)] };
    };

    const create = () => {
      const w = ethers.HDNodeWallet.createRandom();
      card(`<h1>Create wallet</h1><div class="muted">Write these 12 words down. They are the only way to recover your wallet if you forget the password or lose this device. Never share them.</div>
        <div id="ph" style="margin:12px 0;padding:12px;border:2px dashed var(--ink);border-radius:14px;background:#fff;font-weight:700;word-spacing:6px"></div>${common}
        <label style="text-transform:none;display:flex;gap:8px"><input id="sv" type="checkbox" style="width:auto"> I saved my recovery phrase</label>
        <button id="ok" class="full">Create wallet</button><div id="e" class="err"></div><button id="back" class="full alt">Back</button>`);
      o.querySelector('#ph').textContent = w.mnemonic.phrase;
      o.querySelector('#back').onclick = chooser;
      const btn = o.querySelector('#ok');
      btn.onclick = () => { try { if (!o.querySelector('#sv').checked) throw new Error('Confirm you saved the phrase'); const c = readCommon(); finish(w, c.name, c.avatar, c.pw, btn, 'Create wallet'); } catch (e) { o.querySelector('#e').textContent = e.message; } };
    };

    const imp = () => {
      card(`<h1>Import wallet</h1><label>12-word recovery phrase or private key</label>
        <textarea id="sec" rows="3" style="width:100%;padding:12px;border:2px solid var(--ink);border-radius:14px;font-size:16px" autocomplete="off" spellcheck="false"></textarea>${common}
        <button id="ok" class="full">Import</button><div id="e" class="err"></div><button id="back" class="full alt">Back</button>`);
      o.querySelector('#back').onclick = chooser;
      const btn = o.querySelector('#ok');
      btn.onclick = () => {
        try {
          const sec = o.querySelector('#sec').value.trim().replace(/\s+/g, ' ');
          let w;
          if (/^(0x)?[0-9a-fA-F]{64}$/.test(sec)) w = new ethers.Wallet(sec.startsWith('0x') ? sec : '0x' + sec);
          else if (sec.split(' ').length >= 12) w = ethers.HDNodeWallet.fromPhrase(sec);
          else throw new Error('Enter a valid 12-word phrase or private key');
          const c = readCommon(); finish(w, c.name, c.avatar, c.pw, btn, 'Import');
        } catch (e) { o.querySelector('#e').textContent = e.message.includes('invalid') ? 'Invalid phrase or key' : e.message; }
      };
    };

    const COUNTRIES = [['🇮🇳', 'India', '₹ · INR', true], ['🇮🇩', 'Indonesia', 'Rp · IDR'], ['🇧🇷', 'Brazil', 'R$ · BRL'], ['🇦🇷', 'Argentina', '$ · ARS'], ['🇳🇬', 'Nigeria', '₦ · NGN'], ['🇨🇴', 'Colombia', '$ · COP'], ['🇵🇪', 'Peru', 'S/ · PEN'], ['🇳🇵', 'Nepal', 'रू · NPR']];

    // Existing unencrypted wallet from an older version: keep the same address, add a password so Lock works.
    const protect = (pk) => {
      const w = new ethers.Wallet(pk), prof = getProfile(w.address);
      card(`<h1>Secure your wallet</h1><div class="muted">Your existing wallet keeps the same address and funds. Set a password so it can be locked and unlocked on this device.</div>
        <label>Display name</label><input id="nm" maxlength="30">
        <label>Password (min 8 chars)</label><input id="pw" type="password" autocomplete="new-password">
        <button id="ok" class="full">Set password & continue</button><div id="e" class="err"></div>`);
      o.querySelector('#nm').value = prof.name || '';
      const btn = o.querySelector('#ok');
      btn.onclick = () => {
        const pw = o.querySelector('#pw').value, name = o.querySelector('#nm').value.trim();
        if (pw.length < 8) { o.querySelector('#e').textContent = 'Password must be at least 8 characters'; return; }
        finish(w, name || prof.name || 'Me', prof.avatar || AVATARS[0], pw, btn, 'Set password & continue');
      };
    };

    const signin = () => {
      const soon = ['Continue with Google', 'Email address', 'Phone number', 'Passkey'].map((l) => `<button class="full" disabled style="background:#fff;text-align:left;margin-top:8px">${l} <span class="muted" style="float:right">soon</span></button>`).join('');
      card(`<div style="display:flex;align-items:center;gap:8px"><img src="/logo.png" width="28" height="28" style="border-radius:8px" alt=""><strong style="font-size:20px">Sign in</strong></div>
        <button id="c" class="full" style="margin-top:14px">Create new wallet</button><button id="i" class="full alt">I have a wallet (import)</button>
        <div class="muted" style="margin:14px 0 0">Social login needs a key-management provider and is not connected yet:</div>${soon}
        ${hasVault ? '<button id="b" class="full dark">Back to unlock</button>' : ''}
        <button id="bk" class="full dark">Back</button>`);
      o.querySelector('#c').onclick = create; o.querySelector('#i').onclick = imp; o.querySelector('#bk').onclick = country;
      if (hasVault) o.querySelector('#b').onclick = unlock;
    };
    const chooser = signin;

    const country = () => {
      const saved = prefs().country || 'India';
      card(`<h1>Where do we pay out?</h1><div class="muted">Pick where your merchant gets local cash.</div><div id="cl" style="margin-top:10px"></div>
        <button id="cgo" class="full dark">Continue →</button>`);
      const box = o.querySelector('#cl');
      for (const [flag, name, cur, live] of COUNTRIES) {
        const b = document.createElement('button');
        b.style.cssText = `display:flex;width:100%;justify-content:space-between;align-items:center;text-align:left;margin-bottom:10px;background:${name === saved ? 'var(--orange)' : '#fff'}`;
        b.disabled = !live; b.textContent = `${flag}  ${name} · ${cur}${live ? '' : ' — soon'}`;
        box.append(b);
      }
      o.querySelector('#cgo').onclick = () => { setPrefs({ country: 'India', currency: 'INR' }); signin(); };
    };

    const landing = () => {
      card(`<img src="/logo.png" width="72" height="72" style="border-radius:18px" alt="Qripto">
        <h1 style="font-size:44px;line-height:1;margin:18px 0 6px">SCAN.<br>PAY.<br><i>Anywhere.</i></h1>
        <div class="muted" style="font-size:16px">Scan any local payment QR and pay in USDC. The merchant gets local cash.</div>
        <button id="ok" class="full dark" style="margin-top:24px">Log in →</button>`);
      o.querySelector('#ok').onclick = country;
    };

    const legacy = localStorage.getItem(keyName);
    if (legacy) protect(legacy); else hasVault ? unlock() : landing();
  });
}

async function boot(keyName) {
  const cfg = await api('/api/config');
  const provider = new ethers.JsonRpcProvider(cfg.rpc.startsWith('/') ? location.origin + cfg.rpc : cfg.rpc, undefined, { cacheTimeout: -1 });
  let pk = sessionStorage.getItem(sessKey(keyName));
  if (!pk) pk = await walletGate(keyName);
  sessionStorage.setItem(sessKey(keyName), pk);
  startAutoLock(keyName);
  const wallet = new ethers.Wallet(pk, provider);
  return {
    cfg, provider, wallet, keyName,
    escrow: new ethers.Contract(cfg.escrow, ABI, wallet),
    usdc: new ethers.Contract(cfg.usdc, ERC20, wallet),
  };
}

const fmtUsdc = (u) => (Number(u) / 1e6).toFixed(2);
const fmtInr = (p) => '₹' + (Number(p) / 100).toFixed(2);

// upi://pay?pa=merchant@bank&pn=Name&am=100.00&cu=INR
function parseUpi(text) {
  text = text.trim();
  if (/^[\w.\-]{2,}@[\w.\-]{2,}$/.test(text)) return { upi: text, name: text, inr: null };
  let u;
  try { u = new URL(text.trim()); } catch { return null; }
  if (u.protocol !== 'upi:') return null;
  const pa = u.searchParams.get('pa');
  if (!pa || !/^[\w.\-]{2,}@[\w.\-]{2,}$/.test(pa)) return null;
  const am = parseFloat(u.searchParams.get('am') || '');
  return { upi: pa, name: u.searchParams.get('pn') || pa, inr: Number.isFinite(am) && am > 0 ? am : null };
}

// Round up so the LP is never short on the USDC side of the quote.
const quoteUsdc = (inr, rate) => BigInt(Math.ceil((inr / rate) * 1e6));

const CSS = `
:root{--bg:#fffce9;--green:#285548;--mint:#eefadf;--ink:#111;--purple:#a393f5;--orange:#ee8f5f}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.4 system-ui,sans-serif}
main{max-width:480px;margin:0 auto;padding:20px 16px 100px}h1{font-size:22px;margin:0 0 14px}
.card{border:2px solid var(--ink);border-radius:24px;box-shadow:4px 4px 0 var(--ink);padding:18px;margin-bottom:18px;background:var(--mint)}
.card.dark{background:var(--green);color:#fff}
label{display:block;font-size:12px;letter-spacing:.05em;text-transform:uppercase;opacity:.8;margin:10px 0 4px}
input{width:100%;padding:12px;border:2px solid var(--ink);border-radius:14px;font-size:16px;background:#fff}
button{padding:13px 18px;border:2px solid var(--ink);border-radius:999px;background:var(--purple);font-weight:700;font-size:16px;cursor:pointer;box-shadow:3px 3px 0 var(--ink)}
button.full{width:100%;margin-top:12px}button.alt{background:var(--orange)}button.dark{background:var(--ink);color:#fff}button:disabled{opacity:.5}
.big{font-size:40px;font-weight:800;margin:2px 0}.muted{opacity:.75;font-size:13px}.err{color:#b00020;font-weight:600;margin-top:8px}
.pill{display:inline-block;padding:3px 12px;border-radius:999px;border:2px solid var(--ink);font-size:13px;font-weight:700;background:#fff;color:var(--ink)}
.pill.Released{background:#9be7a8}.pill.Accepted{background:#ffe08a}.pill.Open{background:#d8d2ff}.pill.Refunded{background:#e5e5e5}.pill.Proven{background:#c6f0ff}.pill.Disputed{background:#ffb3b3}
.row{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px 0;border-top:1px dashed #0003}
video{width:100%;border-radius:16px;background:#000}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${CSS}</style>`);
