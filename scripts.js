/* ============================================================
   FORMA Studio — Luxury Renovation Website
   scripts.js
   ============================================================ */

'use strict';

/* ============================================================
   MODULE 1: NAV SCROLL EFFECT
   ============================================================ */
(function initNav() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  function onScroll() {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ============================================================
   MODULE 2: INTERSECTION OBSERVER — SCROLL REVEAL
   ============================================================ */
(function initReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
})();

/* ============================================================
   MODULE 3: COUNTER ANIMATION
   ============================================================ */
(function initCounters() {
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animateCounter(el) {
    const raw = el.dataset.target || '0';
    const isFloat = raw.includes('.');
    const target = parseFloat(raw);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const duration = 2000;
    const start = performance.now();

    function update(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = easeOutCubic(progress);
      const current = isFloat
        ? (eased * target).toFixed(1)
        : Math.floor(eased * target);
      el.textContent = prefix + current + suffix;
      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = prefix + (isFloat ? target.toFixed(1) : target) + suffix;
    }

    requestAnimationFrame(update);
  }

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  document.querySelectorAll('[data-target]').forEach((el) =>
    counterObserver.observe(el)
  );
})();

/* ============================================================
   MODULE 4: PORTFOLIO FILTER
   ============================================================ */
(function initPortfolioFilter() {
  const buttons = document.querySelectorAll('.filter-btn');
  const items = document.querySelectorAll('.portfolio-item');

  if (!buttons.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      items.forEach((item) => {
        const category = item.dataset.category;
        const show = filter === 'all' || category === filter;

        if (show) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
        }
      });
    });
  });
})();

/* ============================================================
   MODULE 5: LIGHTBOX
   ============================================================ */
(function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  const closeBtn = lightbox.querySelector('.lightbox-close');
  const titleEl = lightbox.querySelector('.lightbox-title');
  const descEl = lightbox.querySelector('.lightbox-desc');
  const tagsEl = lightbox.querySelector('.lightbox-meta');

  const projects = document.querySelectorAll('.portfolio-item[data-title]');

  projects.forEach((item) => {
    item.addEventListener('click', () => {
      const title = item.dataset.title || '';
      const desc = item.dataset.desc || '';
      const tags = (item.dataset.tags || '').split(',').filter(Boolean);

      if (titleEl) titleEl.textContent = title;
      if (descEl) descEl.textContent = desc;
      if (tagsEl) {
        tagsEl.innerHTML = tags
          .map((t) => `<span class="lightbox-tag">${t.trim()}</span>`)
          .join('');
      }

      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
})();

/* ============================================================
   MODULE 6: BEFORE/AFTER SLIDER
   ============================================================ */
(function initBeforeAfter() {
  const slider = document.querySelector('.ba-wrapper');
  if (!slider) return;

  const handle = slider.querySelector('.ba-handle');
  const afterEl = slider.querySelector('.ba-after');
  if (!handle || !afterEl) return;

  let dragging = false;

  function setPosition(clientX) {
    const rect = slider.getBoundingClientRect();
    let pct = ((clientX - rect.left) / rect.width) * 100;
    pct = Math.max(2, Math.min(98, pct));
    afterEl.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    handle.style.left = pct + '%';
  }

  handle.addEventListener('mousedown', (e) => {
    dragging = true;
    e.preventDefault();
  });

  handle.addEventListener('touchstart', () => { dragging = true; }, { passive: true });

  document.addEventListener('mousemove', (e) => {
    if (dragging) setPosition(e.clientX);
  });

  document.addEventListener('touchmove', (e) => {
    if (dragging) setPosition(e.touches[0].clientX);
  }, { passive: true });

  document.addEventListener('mouseup', () => { dragging = false; });
  document.addEventListener('touchend', () => { dragging = false; });

  // Initialize at 50%
  const rect = slider.getBoundingClientRect();
  setPosition(rect.left + rect.width / 2);
})();

/* ============================================================
   MODULE 7: PROCESS HORIZONTAL DRAG-SCROLL
   ============================================================ */
(function initProcessDrag() {
  const track = document.querySelector('.process-track');
  if (!track) return;

  let startX = 0;
  let scrollLeft = 0;
  let isDragging = false;

  track.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
    track.classList.add('grabbing');
  });

  track.addEventListener('mouseleave', () => {
    isDragging = false;
    track.classList.remove('grabbing');
  });

  track.addEventListener('mouseup', () => {
    isDragging = false;
    track.classList.remove('grabbing');
  });

  track.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    const walk = (x - startX) * 1.5;
    track.scrollLeft = scrollLeft - walk;
  });

  // Animate connector lines on scroll reveal
  const steps = track.querySelectorAll('.process-step');

  const stepObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('connected');
          }, 200);
        }
      });
    },
    { threshold: 0.5 }
  );

  steps.forEach((step) => stepObserver.observe(step));
})();

/* ============================================================
   MODULE 8: TESTIMONIALS CAROUSEL
   ============================================================ */
(function initCarousel() {
  const carousel = document.querySelector('.testimonials-carousel');
  if (!carousel) return;

  const slides = carousel.querySelectorAll('.testimonial-slide');
  const dots = carousel.querySelectorAll('.carousel-dot');
  const prevBtn = carousel.querySelector('.carousel-prev');
  const nextBtn = carousel.querySelector('.carousel-next');

  if (!slides.length) return;

  let current = 0;
  let autoTimer = null;

  function goTo(index) {
    slides[current].classList.remove('active');
    if (dots[current]) dots[current].classList.remove('active');

    current = (index + slides.length) % slides.length;

    slides[current].classList.add('active');
    if (dots[current]) dots[current].classList.add('active');
  }

  function startAuto() {
    autoTimer = setInterval(() => goTo(current + 1), 5000);
  }

  function stopAuto() {
    clearInterval(autoTimer);
  }

  if (prevBtn) prevBtn.addEventListener('click', () => { stopAuto(); goTo(current - 1); startAuto(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { stopAuto(); goTo(current + 1); startAuto(); });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { stopAuto(); goTo(i); startAuto(); });
  });

  carousel.addEventListener('mouseenter', stopAuto);
  carousel.addEventListener('mouseleave', startAuto);

  // Touch swipe
  let touchStartX = 0;
  carousel.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  carousel.addEventListener('touchend', (e) => {
    const delta = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 40) {
      stopAuto();
      goTo(delta > 0 ? current + 1 : current - 1);
      startAuto();
    }
  }, { passive: true });

  startAuto();
})();

/* ============================================================
   MODULE 9: FAQ ACCORDION
   ============================================================ */
(function initAccordion() {
  const items = document.querySelectorAll('.accordion-item');

  items.forEach((item) => {
    const trigger = item.querySelector('.accordion-trigger');
    const body = item.querySelector('.accordion-body');
    if (!trigger || !body) return;

    trigger.addEventListener('click', () => {
      const isOpen = trigger.classList.contains('open');

      // Close all
      items.forEach((other) => {
        other.querySelector('.accordion-trigger').classList.remove('open');
        other.querySelector('.accordion-trigger').setAttribute('aria-expanded', 'false');
        const otherBody = other.querySelector('.accordion-body');
        otherBody.style.maxHeight = '0';
        otherBody.classList.remove('open');
      });

      // Open clicked (if was closed)
      if (!isOpen) {
        trigger.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
        body.style.maxHeight = body.scrollHeight + 'px';
        body.classList.add('open');
      }
    });
  });

  // Open first by default
  if (items.length) {
    const firstTrigger = items[0].querySelector('.accordion-trigger');
    const firstBody = items[0].querySelector('.accordion-body');
    if (firstTrigger && firstBody) {
      firstTrigger.classList.add('open');
      firstTrigger.setAttribute('aria-expanded', 'true');
      firstBody.style.maxHeight = firstBody.scrollHeight + 'px';
    }
  }
})();

/* ============================================================
   MODULE 10: COST CALCULATOR
   ============================================================ */
(function initCalculator() {
  const calcCard = document.querySelector('.calculator-card');
  if (!calcCard) return;

  const steps = calcCard.querySelectorAll('.calc-step');
  const indicators = calcCard.querySelectorAll('.calc-step-indicator');
  const prevBtn = calcCard.querySelector('#calc-prev');
  const nextBtn = calcCard.querySelector('#calc-next');
  const resultSection = calcCard.querySelector('.calc-result');
  const resultPriceEl = calcCard.querySelector('.result-price');

  let currentStep = 0;

  // State
  const state = {
    type: 'apartment',
    area: 80,
    renov: 'capital',
    material: 'premium',
  };

  // Pricing tables (€ / m²)
  const renovRates = {
    design: 80,
    cosmetic: 200,
    capital: 450,
    premium: 750,
  };

  const typeMult = {
    apartment: 1.0,
    house: 1.15,
    commercial: 1.3,
  };

  const materialMult = {
    standard: 1.0,
    premium: 1.4,
    luxury: 1.9,
  };

  function calculatePrice() {
    const base = renovRates[state.renov] * state.area;
    return Math.round(base * typeMult[state.type] * materialMult[state.material]);
  }

  let animFrom = 0;

  function animatePrice(from, to) {
    const duration = 700;
    const start = performance.now();

    function update(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);
      if (resultPriceEl) {
        resultPriceEl.textContent = '€ ' + current.toLocaleString('uk-UA');
      }
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  function updateIndicators() {
    indicators.forEach((ind, i) => {
      ind.classList.remove('active', 'done');
      if (i < currentStep) ind.classList.add('done');
      if (i === currentStep) ind.classList.add('active');
    });
  }

  function showStep(index) {
    steps.forEach((s) => s.classList.remove('active'));
    if (steps[index]) steps[index].classList.add('active');
    updateIndicators();

    if (prevBtn) prevBtn.style.display = index === 0 ? 'none' : 'inline-flex';
    if (nextBtn) {
      if (index === steps.length - 1) {
        nextBtn.textContent = 'Розрахувати';
      } else {
        nextBtn.textContent = 'Далі →';
      }
    }
  }

  function showResult() {
    steps.forEach((s) => s.classList.remove('active'));
    if (resultSection) resultSection.style.display = 'block';
    if (prevBtn) prevBtn.style.display = 'inline-flex';
    if (nextBtn) nextBtn.style.display = 'none';
    indicators.forEach((ind) => { ind.classList.remove('active'); ind.classList.add('done'); });

    const price = calculatePrice();
    animatePrice(animFrom, price);
    animFrom = price;
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        showStep(currentStep);
      } else {
        showResult();
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (resultSection && resultSection.style.display === 'block') {
        resultSection.style.display = 'none';
        if (nextBtn) { nextBtn.style.display = 'inline-flex'; nextBtn.textContent = 'Розрахувати'; }
        currentStep = steps.length - 1;
        showStep(currentStep);
        return;
      }
      if (currentStep > 0) {
        currentStep--;
        showStep(currentStep);
      }
    });
  }

  // Type selection
  calcCard.querySelectorAll('input[name="prop-type"]').forEach((radio) => {
    radio.addEventListener('change', () => { state.type = radio.value; });
  });

  // Area slider
  const areaSlider = calcCard.querySelector('#area-slider');
  const areaDisplay = calcCard.querySelector('#area-display');
  if (areaSlider) {
    areaSlider.addEventListener('input', () => {
      state.area = parseInt(areaSlider.value);
      if (areaDisplay) areaDisplay.textContent = state.area;
    });
  }

  // Renovation type
  calcCard.querySelectorAll('input[name="renov-type"]').forEach((radio) => {
    radio.addEventListener('change', () => { state.renov = radio.value; });
  });

  // Material level toggle
  calcCard.querySelectorAll('.calc-toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      calcCard.querySelectorAll('.calc-toggle-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.material = btn.dataset.material;
    });
  });

  // CTA in result → scroll to contact
  const resultCta = calcCard.querySelector('.result-cta');
  if (resultCta) {
    resultCta.addEventListener('click', () => {
      const contact = document.getElementById('contact');
      if (contact) contact.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Init
  showStep(0);
  if (resultSection) resultSection.style.display = 'none';
})();

/* ============================================================
   MODULE 11: MOBILE NAV + SMOOTH SCROLL + MISC
   ============================================================ */
(function initMisc() {
  // Mobile hamburger
  const burger = document.querySelector('.nav-burger');
  const navLinks = document.querySelector('.nav-links');

  if (burger && navLinks) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('open');
      navLinks.classList.toggle('open');
      document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });

    navLinks.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        burger.classList.remove('open');
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navH = parseInt(
          getComputedStyle(document.documentElement).getPropertyValue('--nav-h')
        ) || 72;
        const top = target.getBoundingClientRect().top + window.scrollY - navH;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // Contact form submit (demo)
  const form = document.querySelector('.contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        const original = btn.textContent;
        btn.textContent = 'Дякуємо! Зв\'яжемось з вами ✓';
        btn.style.opacity = '0.7';
        btn.disabled = true;
        setTimeout(() => {
          btn.textContent = original;
          btn.style.opacity = '';
          btn.disabled = false;
          form.reset();
        }, 4000);
      }
    });
  }

  // About timeline draw on scroll
  const timeline = document.querySelector('.about-timeline');
  if (timeline) {
    const tlObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('drawn');
            tlObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    tlObserver.observe(timeline);
  }
})();
