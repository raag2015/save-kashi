/* ================================================
   Save Kashi — Campaign JavaScript
   Baby Kashi Dubepuria | SMA Type 1 | 2026
   ================================================ */

/* ================================================
   ANALYTICS PLACEHOLDERS — REPLACE BEFORE LAUNCH
   ================================================

   1. GOOGLE ANALYTICS 4
   In <head>, add:
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'G-XXXXXXXXXX');
   </script>

   2. META PIXEL
   In <head>, add:
   <script>
     !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){...};
     ...}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
     fbq('init', 'YOUR_PIXEL_ID');
     fbq('track', 'PageView');
   </script>

   3. MICROSOFT CLARITY
   In <head>, add:
   <script>
     (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){...};
     ...})(window,document,"clarity","script","YOUR_CLARITY_ID");
   </script>
================================================ */

// ── Page Load ──────────────────────────────────────────────────────────────

window.addEventListener('load', function () {
  // Hide loading screen
  setTimeout(function () {
    var loader = document.getElementById('loading-screen');
    if (!loader) return;
    loader.style.opacity = '0';
    setTimeout(function () { loader.style.display = 'none'; }, 500);
  }, 1100);

  // Animate progress bar (slight delay for dramatic effect)
  setTimeout(function () {
    var fill = document.querySelector('.prog-fill');
    if (fill) fill.style.width = (fill.dataset.progress || 3) + '%';
  }, 1600);

  // Load campaign data first (updates data-count before counters start)
  loadCampaignData();

  // Counters
  startCounters();

  // AOS
  if (typeof AOS !== 'undefined') {
    AOS.init({ duration: 680, once: true, offset: 70, easing: 'ease-out-cubic' });
  }

  // Hearts — start continuous spawn
  createHeartParticle(); // fire one immediately
  _heartInterval = setInterval(createHeartParticle, 1800);

  // Donor ticker
  startTicker();

  // UTM links
  applyUTMToLinks();

  // Sticky button scroll listener
  window.addEventListener('scroll', handleSticky);
});

// ── Floating Hearts — continuous spawn (reference implementation) ──────────

function createHeartParticle() {
  var container = document.getElementById('particles');
  if (!container) return;

  // Coloured heart emojis
  var hearts = ['💙','💜','🩷','💚','🤍'];

  var el = document.createElement('span');
  el.className = 'heart-particle';
  el.textContent = hearts[Math.floor(Math.random() * hearts.length)];

  el.style.cssText =
    'left:'               + (Math.random() * 100)      + '%;'  +
    'top:100%;'                                                  +
    'font-size:'          + (10 + Math.random() * 16)  + 'px;' +
    'animation-duration:' + (5  + Math.random() * 6)   + 's;'  +
    'animation-delay:'    + (Math.random() * 2)         + 's;';

  container.appendChild(el);

  // Remove after animation completes — no memory leak
  setTimeout(function () { el.remove(); }, 12000);
}

// Spawn a new heart every 1.8 s (started after load)
var _heartInterval = null;

// ── Campaign Data (localStorage → JSONbin) ────────────────────────────────

var CAMPAIGN_GOAL = 150000000; // ₹15 Crore — do not change
var JSONBIN_URL   = 'https://api.jsonbin.io/v3/b/6a141deb6610dd3ae8a15f8b/latest'; // public read

function loadCampaignData() {
  // 1. Sync read from localStorage (instant — no flicker)
  var data = null;
  try { var raw = localStorage.getItem('kashi_data'); if (raw) data = JSON.parse(raw); } catch(e) {}
  if (data) applyCampaignData(data);

  // 2. Always fetch from JSONbin — updates for all visitors
  fetch(JSONBIN_URL)
    .then(function(r) { return r.json(); })
    .then(function(json) {
      if (json && json.record) {
        localStorage.setItem('kashi_data', JSON.stringify(json.record)); // cache locally
        applyCampaignData(json.record);
      }
    })
    .catch(function() {
      // JSONbin unavailable — local cache or defaults already applied above
    });
}

function applyCampaignData(data) {
  var goal   = parseInt(data.totalFunds) || CAMPAIGN_GOAL;
  var raised = parseInt(data.raised)     || 4523750;
  var donors = parseInt(data.donors)     || 312;
  var shares = parseInt(data.shares)     || 1840;
  var needed = Math.max(0, goal - raised);
  var pct    = Math.max(0.5, (raised / goal) * 100);

  function fmtCr(n) {
    if (n >= 10000000) return (n / 10000000).toFixed(1) + ' Cr';
    if (n >= 100000)   return (n / 100000).toFixed(1) + ' L';
    return n.toLocaleString('en-IN');
  }

  // Update data-count + live text (if already animated)
  function setCount(el, val) {
    el.dataset.count = val;
    if (el.dataset.animated) el.textContent = (el.dataset.prefix || '') + val.toLocaleString('en-IN') + (el.dataset.suffix || '');
  }

  document.querySelectorAll('[data-role="raised"]').forEach(function(el) { setCount(el, raised); });
  document.querySelectorAll('[data-role="donors"]').forEach(function(el) { setCount(el, donors); });
  document.querySelectorAll('[data-role="shares"]').forEach(function(el) { setCount(el, shares); });

  // Also update Milaap insight cards
  var mlRaised = document.getElementById('ml-raised');
  var mlDonors = document.getElementById('ml-donors');
  var mlNeeded = document.getElementById('ml-needed');
  var mlTotal  = document.getElementById('ml-total');
  var mlPct    = document.getElementById('ml-pct');
  var mlFill   = document.getElementById('ml-fill');

  if (mlRaised) mlRaised.textContent = '₹' + fmtCr(raised);
  if (mlDonors) mlDonors.textContent = donors.toLocaleString('en-IN');
  if (mlNeeded) mlNeeded.textContent = '₹' + fmtCr(needed);
  if (mlTotal)  mlTotal.textContent  = '₹' + fmtCr(goal);
  if (mlPct)    mlPct.textContent    = pct.toFixed(1) + '% of goal reached';
  if (mlFill)   { setTimeout(function(){ mlFill.style.width = pct.toFixed(1) + '%'; }, 800); }

  // Update progress bar
  var fill = document.querySelector('.prog-fill');
  if (fill) {
    fill.dataset.progress = pct.toFixed(1);
    if (parseFloat(fill.style.width) > 0) fill.style.width = pct.toFixed(1) + '%';
  }
}

// ── Counter Animation ──────────────────────────────────────────────────────

function animateCount(el, end, duration) {
  var start = 0;
  var prefix = el.dataset.prefix || '';
  var suffix = el.dataset.suffix || '';
  var startTime = null;

  function step(ts) {
    if (!startTime) startTime = ts;
    var progress = Math.min((ts - startTime) / duration, 1);
    var ease = 1 - Math.pow(1 - progress, 3);
    var current = Math.floor(start + (end - start) * ease);
    el.textContent = prefix + current.toLocaleString('en-IN') + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function startCounters() {
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && !entry.target.dataset.animated) {
        entry.target.dataset.animated = '1';
        animateCount(entry.target, parseInt(entry.target.dataset.count), 2200);
      }
    });
  }, { threshold: 0.35 });

  document.querySelectorAll('[data-count]').forEach(function (el) {
    observer.observe(el);
  });
}

// ── Donor Ticker ───────────────────────────────────────────────────────────

var DONORS = [
  { name: 'Priya S.',    loc: 'Mumbai',    amt: '₹5,000',  time: '2 min ago'   },
  { name: 'Rahul M.',    loc: 'Delhi',     amt: '₹2,500',  time: '9 min ago'   },
  { name: 'Anita K.',    loc: 'Pune',      amt: '₹10,000', time: '18 min ago'  },
  { name: 'Sunita R.',   loc: 'Bhopal',    amt: '₹1,000',  time: '26 min ago'  },
  { name: 'Vikram J.',   loc: 'Bangalore', amt: '₹15,000', time: '38 min ago'  },
  { name: 'Deepa G.',    loc: 'Hyderabad', amt: '₹500',    time: '45 min ago'  },
  { name: 'Arun P.',     loc: 'Chennai',   amt: '₹3,000',  time: '1 hr ago'    },
  { name: 'Meena T.',    loc: 'Indore',    amt: '₹25,000', time: '1 hr ago'    },
  { name: 'Kiran B.',    loc: 'Jaipur',    amt: '₹2,000',  time: '2 hrs ago'   },
  { name: 'Sanjay D.',   loc: 'Nagpur',    amt: '₹7,500',  time: '2 hrs ago'   },
  { name: 'Geeta N.',    loc: 'Ahmedabad', amt: '₹4,000',  time: '3 hrs ago'   },
  { name: 'Suresh P.',   loc: 'Lucknow',   amt: '₹1,500',  time: '3 hrs ago'   },
];
var tickerIdx = 0;

function makeTItem(d) {
  var div = document.createElement('div');
  div.className = 't-item';
  div.innerHTML =
    '<div class="t-avatar">' + d.name[0] + '</div>' +
    '<div>' +
      '<div class="t-name">' + d.name + ' <span class="t-loc">from ' + d.loc + '</span></div>' +
      '<div class="t-time">' + d.time + '</div>' +
    '</div>' +
    '<div class="t-amt">' + d.amt + '</div>';
  return div;
}

function startTicker() {
  var list = document.getElementById('donor-ticker-list');
  if (!list) return;

  // Seed first 4
  DONORS.slice(0, 4).forEach(function (d) { list.appendChild(makeTItem(d)); });
  tickerIdx = 4;

  setInterval(function () {
    if (tickerIdx >= DONORS.length) tickerIdx = 0;
    var item = makeTItem(DONORS[tickerIdx++]);
    item.style.opacity = '0';
    list.insertBefore(item, list.firstChild);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { item.style.opacity = '1'; });
    });
    // Keep max 4 rows
    while (list.children.length > 4) list.removeChild(list.lastChild);
  }, 5000);
}

// ── FAQ Accordion ──────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = this.closest('.faq-item');
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function (i) { i.classList.remove('open'); });
      if (!isOpen) item.classList.add('open');
    });
  });
});

// ── Bank Details Toggle ────────────────────────────────────────────────────

function toggleBank() {
  var el = document.getElementById('bank-details');
  if (!el) return;
  el.style.display = (el.style.display === 'block') ? 'none' : 'block';
  trackEvent('bank_details_toggle');
}

// ── Copy to Clipboard ──────────────────────────────────────────────────────

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () { showToast('Copied!'); });
  } else {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Copied!');
  }
  trackEvent('copy_text', { content: text.substring(0, 30) });
}

function showToast(msg) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function () { t.classList.remove('show'); }, 2500);
}

// ── Social Share ───────────────────────────────────────────────────────────

var PAGE_URL = encodeURIComponent(window.location.href);
var SHARE_MSG = encodeURIComponent(
  '🙏 Please help save Baby Kashi! She is just 5 months old and fighting SMA Type 1, a rare genetic disease. She needs Zolgensma gene therapy costing ₹15 crore. Every rupee matters.\n\n💙 Donate via UPI: prakrati1990@ibl\n📞 Dr. Rohit: 9039533426\n\n#SaveKashi #SMAType1 #HelpKashi'
);

function shareWhatsApp() {
  trackEvent('share_whatsapp');
  window.open('https://wa.me/?text=' + SHARE_MSG, '_blank');
}

function shareTwitter() {
  trackEvent('share_twitter');
  var msg = encodeURIComponent('Help save Baby Kashi — 5 months old, fighting SMA Type 1. Needs Zolgensma treatment (₹15 Cr). Every donation matters. #SaveKashi #SMAType1');
  window.open('https://twitter.com/intent/tweet?text=' + msg + '&url=' + PAGE_URL, '_blank');
}

function shareFacebook() {
  trackEvent('share_facebook');
  window.open('https://www.facebook.com/sharer/sharer.php?u=' + PAGE_URL, '_blank');
}

function shareInstagram() {
  trackEvent('share_instagram');
  var msg = '🙏 Help save Baby Kashi! 5-month-old fighting SMA Type 1. Needs Zolgensma (₹15 Cr).\n\nDonate via UPI: prakrati1990@ibl\nContact: 9039533426\n\n#SaveKashi #SMAType1 #HelpKashi';
  copyText(msg);
  showToast('Message copied — paste in your Instagram story!');
}

// ── Event Tracking ─────────────────────────────────────────────────────────

function trackEvent(name, params) {
  // Google Analytics 4
  if (typeof gtag === 'function') gtag('event', name, params || {});
  // Meta Pixel
  if (typeof fbq === 'function') fbq('trackCustom', name, params || {});
  // Debug
  console.log('[SaveKashi Track]', name, params || {});
}

// Attach tracking to all [data-track] elements
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-track]').forEach(function (el) {
    el.addEventListener('click', function () {
      trackEvent(this.dataset.track, { method: this.dataset.method || undefined });
    });
  });

  // Scroll depth milestones
  var milestones = [25, 50, 75, 100];
  var fired = new Set();
  window.addEventListener('scroll', function () {
    var pct = Math.round(window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100);
    milestones.forEach(function (m) {
      if (pct >= m && !fired.has(m)) { fired.add(m); trackEvent('scroll_depth', { percent: m }); }
    });
  }, { passive: true });
});

// ── Sticky Donate Button ───────────────────────────────────────────────────

function handleSticky() {
  var btn = document.querySelector('.sticky-donate');
  if (!btn) return;
  btn.style.display = window.scrollY > 500 ? 'block' : 'none';
}

// ── UTM Parameter Support ──────────────────────────────────────────────────

function getUTM() {
  var p = new URLSearchParams(window.location.search);
  return {
    source:   p.get('utm_source')   || 'direct',
    medium:   p.get('utm_medium')   || 'none',
    campaign: p.get('utm_campaign') || 'organic'
  };
}

function applyUTMToLinks() {
  var utm = getUTM();
  var qs  = 'utm_source=' + utm.source + '&utm_medium=' + utm.medium + '&utm_campaign=' + utm.campaign;
  document.querySelectorAll('[data-utm-link]').forEach(function (el) {
    var href = el.getAttribute('href');
    if (href && href !== '#') {
      el.setAttribute('href', href + (href.includes('?') ? '&' : '?') + qs);
    }
  });
}
