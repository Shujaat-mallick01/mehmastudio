/* ============================================================
   MEHMA STUDIO — script.js
   ------------------------------------------------------------
   EDIT YOUR STUDIO DETAILS HERE.
   These values are written into the page on load, so you only
   need to change them in one place. (Also update the <head> of
   index.html for SEO — see the note at the top of that file.)
   ============================================================ */
const CONFIG = {
  studioName: "Mehma Studio",
  phone: "+92 300 0000000",          // shown on the page
  whatsappNumber: "923000000000",    // digits only, with country code, no + or spaces
  instagramHandle: "@mehmastudio",
  instagramUrl: "https://www.instagram.com/mehmastudio",
  address: "Studio 12, Khayaban-e-Ittehad, DHA Phase 6, Karachi",
  prices: {
    silver: 60000,
    gold: 120000,
    platinum: 220000,
  },
  testimonialInterval: 6000,         // ms between automatic slides
};

/* ------------------------------------------------------------
   Small helpers
   ------------------------------------------------------------ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const formatPKR = (n) => "Rs " + n.toLocaleString("en-PK");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.documentElement.classList.remove("no-js");

/* ------------------------------------------------------------
   Apply CONFIG to the page
   ------------------------------------------------------------ */
(function applyConfig() {
  const values = {
    studioName: CONFIG.studioName,
    phone: CONFIG.phone,
    instagramHandle: CONFIG.instagramHandle,
    address: CONFIG.address,
    "price.silver": formatPKR(CONFIG.prices.silver),
    "price.gold": formatPKR(CONFIG.prices.gold),
    "price.platinum": formatPKR(CONFIG.prices.platinum),
  };
  $$("[data-cfg]").forEach((el) => {
    const v = values[el.dataset.cfg];
    if (v) el.textContent = v;
  });

  const hrefs = {
    tel: "tel:" + CONFIG.phone.replace(/[^\d+]/g, ""),
    instagram: CONFIG.instagramUrl,
  };
  $$("[data-cfg-href]").forEach((el) => {
    const v = hrefs[el.dataset.cfgHref];
    if (v) el.href = v;
  });

  $("#whatsapp-float").href = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(
    `Assalam o Alaikum ${CONFIG.studioName}, I'd like to ask about wedding photography.`
  )}`;

  $("#year").textContent = new Date().getFullYear();
})();

/* ------------------------------------------------------------
   Navbar: solid background on scroll + mobile menu
   ------------------------------------------------------------ */
(function navbar() {
  const nav = $("#navbar");
  const toggle = $("#nav-toggle");

  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const setOpen = (open) => {
    document.body.classList.toggle("nav-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  toggle.addEventListener("click", () => setOpen(!document.body.classList.contains("nav-open")));
  // Close the mobile menu after a link is tapped
  $$("#nav-links a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (e) => e.key === "Escape" && setOpen(false));
})();

/* ------------------------------------------------------------
   Fade-in on scroll + stat counters
   ------------------------------------------------------------ */
(function reveal() {
  const items = $$(".fade-in");
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  items.forEach((el) => io.observe(el));
})();

(function counters() {
  const nums = $$(".count");
  const run = (el) => {
    const target = +el.dataset.target;
    if (reduceMotion) { el.textContent = target.toLocaleString(); return; }
    const duration = 1600;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out
      el.textContent = Math.round(target * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (!("IntersectionObserver" in window)) { nums.forEach(run); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.6 });
  nums.forEach((n) => io.observe(n));
})();

/* ------------------------------------------------------------
   Portfolio: category filters
   ------------------------------------------------------------ */
const galleryItems = $$(".gallery-item");

(function filters() {
  const buttons = $$(".filter-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.filter;
      buttons.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("active", on);
        b.setAttribute("aria-selected", on);
      });
      galleryItems.forEach((item) => {
        const show = f === "all" || item.dataset.category === f;
        item.classList.toggle("hidden", !show);
        if (show) {
          // restart the little pop-in animation
          item.style.animation = "none";
          void item.offsetWidth;
          item.style.animation = "";
        }
      });
    });
  });
})();

/* ------------------------------------------------------------
   Portfolio: lightbox (click, arrows, keyboard, swipe)
   Only cycles through photos visible under the current filter.
   ------------------------------------------------------------ */
(function lightbox() {
  const box = $("#lightbox");
  const img = $("#lb-img");
  const caption = $("#lb-caption");
  let list = [];
  let index = 0;
  let lastFocus = null;

  const show = (i) => {
    index = (i + list.length) % list.length;
    const thumb = $("img", list[index]);
    img.src = thumb.dataset.full || thumb.src;
    img.alt = thumb.alt;
    caption.textContent = `${thumb.alt} (${index + 1} / ${list.length})`;
  };

  const open = (item) => {
    list = galleryItems.filter((g) => !g.classList.contains("hidden"));
    lastFocus = document.activeElement;
    show(list.indexOf(item));
    box.hidden = false;
    document.body.style.overflow = "hidden";
    $("#lb-close").focus();
  };

  const close = () => {
    box.hidden = true;
    img.src = "";
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  };

  galleryItems.forEach((item) => {
    item.tabIndex = 0;
    item.setAttribute("role", "button");
    item.addEventListener("click", () => open(item));
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(item); }
    });
  });

  $("#lb-close").addEventListener("click", close);
  $("#lb-prev").addEventListener("click", () => show(index - 1));
  $("#lb-next").addEventListener("click", () => show(index + 1));
  box.addEventListener("click", (e) => { if (e.target === box) close(); });

  document.addEventListener("keydown", (e) => {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  });

  // Touch swipe
  let startX = 0;
  box.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
  });
})();

/* ------------------------------------------------------------
   Testimonials slider (auto-play, dots, arrows, swipe)
   ------------------------------------------------------------ */
(function slider() {
  const track = $("#slides");
  const slides = $$(".slide", track);
  const dotsWrap = $("#dots");
  let current = 0;
  let timer;

  const dots = slides.map((_, i) => {
    const b = document.createElement("button");
    b.setAttribute("aria-label", `Show testimonial ${i + 1}`);
    b.addEventListener("click", () => { go(i); restart(); });
    dotsWrap.appendChild(b);
    return b;
  });

  function go(i) {
    current = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, j) => d.classList.toggle("active", j === current));
    slides.forEach((s, j) => s.setAttribute("aria-hidden", j !== current));
  }

  function restart() {
    clearInterval(timer);
    if (!reduceMotion) timer = setInterval(() => go(current + 1), CONFIG.testimonialInterval);
  }

  $("#prev").addEventListener("click", () => { go(current - 1); restart(); });
  $("#next").addEventListener("click", () => { go(current + 1); restart(); });

  // Pause while the visitor is reading / hovering
  const sliderEl = $("#slider");
  sliderEl.addEventListener("mouseenter", () => clearInterval(timer));
  sliderEl.addEventListener("mouseleave", restart);

  let startX = 0;
  track.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) { go(current + (dx < 0 ? 1 : -1)); restart(); }
  });

  go(0);
  restart();
})();

/* ------------------------------------------------------------
   Package buttons pre-fill the message field
   ------------------------------------------------------------ */
$$("[data-package]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const msg = $("#message");
    const pkg = btn.dataset.package;
    const price = formatPKR(CONFIG.prices[pkg.toLowerCase()]);
    msg.value = `I'm interested in the ${pkg} package (${price}).`;
  });
});

/* ------------------------------------------------------------
   Contact form -> WhatsApp with details pre-filled
   ------------------------------------------------------------ */
(function contactForm() {
  const form = $("#contact-form");
  const error = $("#form-error");
  const dateInput = $("#date");

  // Don't allow dates in the past
  dateInput.min = new Date().toISOString().split("T")[0];

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    error.textContent = "";

    const fields = {
      name: $("#name"), phone: $("#phone"), date: $("#date"), event: $("#event"), message: $("#message"),
    };
    const data = Object.fromEntries(Object.entries(fields).map(([k, el]) => [k, el.value.trim()]));

    // Basic validation
    const required = ["name", "phone", "date", "event"];
    let firstInvalid = null;
    required.forEach((key) => {
      const field = fields[key];
      const bad = !data[key];
      field.classList.toggle("invalid", bad);
      if (bad && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) {
      error.textContent = "Please fill in your name, phone, event date and event type.";
      firstInvalid.focus();
      return;
    }
    if (!/^[\d\s+()-]{7,}$/.test(data.phone)) {
      fields.phone.classList.add("invalid");
      error.textContent = "Please enter a valid phone number.";
      fields.phone.focus();
      return;
    }

    const prettyDate = new Date(data.date + "T00:00:00").toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });

    const text = [
      `Assalam o Alaikum ${CONFIG.studioName}!`,
      `I'd like to book a wedding shoot.`,
      ``,
      `*Name:* ${data.name}`,
      `*Phone:* ${data.phone}`,
      `*Event date:* ${prettyDate}`,
      `*Event type:* ${data.event}`,
      data.message ? `*Message:* ${data.message}` : null,
    ].filter((line) => line !== null).join("\n");

    window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  });

  // Clear the red border as soon as the user fixes a field
  form.addEventListener("input", (e) => e.target.classList.remove("invalid"));
})();
