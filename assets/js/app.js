/**
 * CyberSec PSG – App: snap scroll, carousel, glossary, parallax, timer
 */
(function() {
  'use strict';

  // ==================== SNAP SCROLL ====================
  const pages = document.querySelectorAll('.page');
  let currentPage = 0;
  let isScrolling = false;
  const scrollCooldown = 800; // ms

  function scrollToPage(index) {
    if (index < 0 || index >= pages.length || isScrolling) return;
    isScrolling = true;
    currentPage = index;
    pages[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => { isScrolling = false; }, scrollCooldown);
    updateProgress();
  }

  // Mouse wheel
  window.addEventListener('wheel', (e) => {
    // Allow carousel horizontal scroll
    if (e.target.closest('.carousel-track') || e.target.closest('.carousel')) {
      const carousel = e.target.closest('[data-carousel]');
      if (carousel && Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    }
    e.preventDefault();
    if (isScrolling) return;
    if (e.deltaY > 30) scrollToPage(currentPage + 1);
    else if (e.deltaY < -30) scrollToPage(currentPage - 1);
  }, { passive: false });

  // Keyboard arrows
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      scrollToPage(currentPage + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      scrollToPage(currentPage - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      scrollToPage(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      scrollToPage(pages.length - 1);
    } else if (e.key === 't' || e.key === 'T') {
      document.getElementById('timer-toggle').click();
    }
  });

  // Touch support
  let touchStartY = 0;
  document.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', (e) => {
    const deltaY = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(deltaY) > 60) {
      if (deltaY > 0) scrollToPage(currentPage + 1);
      else scrollToPage(currentPage - 1);
    }
  }, { passive: true });

  // Detect current page on manual scroll (fallback)
  function detectCurrentPage() {
    const scrollY = window.scrollY;
    const windowH = window.innerHeight;
    pages.forEach((page, i) => {
      const rect = page.getBoundingClientRect();
      if (rect.top >= -windowH * 0.3 && rect.top <= windowH * 0.3) {
        currentPage = i;
      }
    });
  }

  // ==================== PROGRESS PANEL ====================
  const progressDots = document.querySelectorAll('.progress-dot');
  const progressLineFill = document.getElementById('progress-line-fill');

  function updateProgress() {
    const scrollPercent = Math.min(100, (currentPage / (pages.length - 1)) * 100);
    if (progressLineFill) progressLineFill.style.height = scrollPercent + '%';

    const currentBlock = pages[currentPage] ? pages[currentPage].dataset.block : '';
    progressDots.forEach(dot => {
      dot.classList.toggle('active', dot.dataset.block === currentBlock);
    });
  }

  progressDots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = dot.getAttribute('href').slice(1);
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        const idx = Array.from(pages).indexOf(targetEl);
        if (idx >= 0) scrollToPage(idx);
      }
    });
  });

  // ==================== SCROLL ANIMATIONS ====================
  const animObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.animate-in').forEach(el => animObserver.observe(el));

  // ==================== HEADER ====================
  const header = document.getElementById('main-header');
  window.addEventListener('scroll', () => {
    requestAnimationFrame(() => {
      header.classList.toggle('scrolled', window.scrollY > 80);
      detectCurrentPage();
      updateProgress();
    });
  });

  // ==================== CAROUSEL ====================
  document.querySelectorAll('[data-carousel]').forEach(carousel => {
    const track = carousel.querySelector('[data-carousel-track]');
    const slides = track.querySelectorAll('.carousel-slide');
    const dotsContainer = carousel.querySelector('[data-carousel-dots]');
    const prevBtn = carousel.querySelector('[data-carousel-prev]');
    const nextBtn = carousel.querySelector('[data-carousel-next]');
    let current = 0;

    // Create dots
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
    });

    function goTo(index) {
      if (index < 0) index = slides.length - 1;
      if (index >= slides.length) index = 0;
      current = index;
      track.style.transform = `translateX(-${current * 100}%)`;
      dotsContainer.querySelectorAll('.carousel-dot').forEach((d, i) => {
        d.classList.toggle('active', i === current);
      });
    }

    prevBtn.addEventListener('click', () => goTo(current - 1));
    nextBtn.addEventListener('click', () => goTo(current + 1));

    // Keyboard left/right when carousel is in view
    carousel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.stopPropagation(); goTo(current - 1); }
      if (e.key === 'ArrowRight') { e.stopPropagation(); goTo(current + 1); }
    });

    // Swipe on carousel
    let startX = 0;
    track.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', (e) => {
      const dx = startX - e.changedTouches[0].clientX;
      if (Math.abs(dx) > 50) {
        if (dx > 0) goTo(current + 1);
        else goTo(current - 1);
      }
    }, { passive: true });
  });

  // ==================== GLOSSARY BAR ====================
  const glossaryBar = document.getElementById('glossary-bar');
  const glossaryTerm = document.getElementById('glossary-term');
  const glossaryDef = document.getElementById('glossary-def');
  const glossaryClose = document.getElementById('glossary-close');
  let glossaryTimeout = null;

  function showGlossary(term, def) {
    glossaryTerm.textContent = term;
    glossaryDef.textContent = def;
    glossaryBar.classList.remove('hidden');
    glossaryBar.classList.add('visible');
    if (glossaryTimeout) clearTimeout(glossaryTimeout);
    glossaryTimeout = setTimeout(hideGlossary, 8000);
  }

  function hideGlossary() {
    glossaryBar.classList.remove('visible');
    glossaryBar.classList.add('hidden');
  }

  glossaryClose.addEventListener('click', hideGlossary);

  // Attach to all .term elements
  document.querySelectorAll('.term').forEach(el => {
    el.addEventListener('mouseenter', () => {
      showGlossary(el.dataset.term, el.dataset.def);
    });
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      showGlossary(el.dataset.term, el.dataset.def);
    });
  });

  // ==================== COUNTER ANIMATION ====================
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.counted) {
        entry.target.dataset.counted = 'true';
        const target = parseInt(entry.target.textContent, 10);
        if (isNaN(target)) return;
        let current = 0;
        const step = Math.max(1, Math.floor(target / 30));
        const interval = setInterval(() => {
          current += step;
          if (current >= target) { current = target; clearInterval(interval); }
          entry.target.textContent = current;
        }, 30);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat-number').forEach(el => counterObserver.observe(el));

  // ==================== TIMER ====================
  const elapsedEl = document.getElementById('elapsed-time');
  const blockTimeEl = document.getElementById('block-time');
  const toggleBtn = document.getElementById('timer-toggle');
  const resetBtn = document.getElementById('timer-reset');
  let timerRunning = false, startTime = null, pausedElapsed = 0, timerInterval = null;
  const totalMs = 90 * 60 * 1000;

  function fmt(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  function updateTimer() {
    const elapsed = timerRunning ? (Date.now() - startTime + pausedElapsed) : pausedElapsed;
    const remaining = totalMs - elapsed;
    elapsedEl.textContent = fmt(elapsed);
    blockTimeEl.textContent = (remaining < 0 ? '-' : '') + fmt(Math.abs(remaining));
    blockTimeEl.className = 'timer-block-time' + (remaining < 0 ? ' over' : remaining < 300000 ? ' warning' : '');
  }

  toggleBtn.addEventListener('click', () => {
    if (timerRunning) {
      timerRunning = false;
      pausedElapsed += Date.now() - startTime;
      toggleBtn.innerHTML = '&#9654;';
      clearInterval(timerInterval);
    } else {
      timerRunning = true;
      startTime = Date.now();
      toggleBtn.innerHTML = '&#9646;&#9646;';
      timerInterval = setInterval(updateTimer, 500);
    }
    updateTimer();
  });

  resetBtn.addEventListener('click', () => {
    timerRunning = false; startTime = null; pausedElapsed = 0;
    toggleBtn.innerHTML = '&#9654;';
    clearInterval(timerInterval);
    updateTimer();
  });

  updateTimer();

  // ==================== BACKGROUND PARTICLES ====================
  const canvas = document.getElementById('bg-particles');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [], w, h;
    function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
    function init() {
      particles = [];
      for (let i = 0; i < 40; i++) {
        particles.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 2 + 0.5, dx: (Math.random() - 0.5) * 0.2, dy: (Math.random() - 0.5) * 0.1, o: Math.random() * 0.08 + 0.02 });
      }
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,85,164,${p.o})`; ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
      });
      requestAnimationFrame(draw);
    }
    resize(); init(); draw();
    window.addEventListener('resize', () => { resize(); init(); });
  }

  // Init
  updateProgress();
})();
