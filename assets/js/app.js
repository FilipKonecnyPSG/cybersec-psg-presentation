/**
 * CyberSec PSG – App: snap scroll, 3D carousel, glossary, fog, timer
 */
(function() {
  'use strict';

  // ==================== SNAP SCROLL ====================
  const pages = document.querySelectorAll('.page');
  let currentPage = 0;
  let isScrolling = false;
  const scrollCooldown = 800;

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
    if (e.target.closest('.carousel-3d')) return; // let carousel handle
    e.preventDefault();
    if (isScrolling) return;
    if (e.deltaY > 30) scrollToPage(currentPage + 1);
    else if (e.deltaY < -30) scrollToPage(currentPage - 1);
  }, { passive: false });

  // Touch support
  let touchStartY = 0;
  document.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', (e) => {
    if (e.target.closest('.carousel-3d')) return;
    const deltaY = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(deltaY) > 60) {
      if (deltaY > 0) scrollToPage(currentPage + 1);
      else scrollToPage(currentPage - 1);
    }
  }, { passive: true });

  // Detect current page on manual scroll
  function detectCurrentPage() {
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

  // ==================== 3D CAROUSEL ====================
  // Track which carousel is visible for global keyboard
  let activeCarousel = null;

  document.querySelectorAll('[data-carousel]').forEach(carousel => {
    const track = carousel.querySelector('[data-carousel-track]');
    const slides = Array.from(track.querySelectorAll('.carousel-slide'));
    const dotsContainer = carousel.querySelector('[data-carousel-dots]');
    const prevBtn = carousel.querySelector('[data-carousel-prev]');
    const nextBtn = carousel.querySelector('[data-carousel-next]');
    let current = 0;
    const total = slides.length;

    // Create dots
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
    });

    function goTo(index) {
      if (index < 0) index = total - 1;
      if (index >= total) index = 0;
      current = index;
      updateSlides();
    }

    function updateSlides() {
      slides.forEach((slide, i) => {
        slide.classList.remove('active', 'prev', 'next', 'far-prev', 'far-next');
        const diff = i - current;
        if (diff === 0) slide.classList.add('active');
        else if (diff === 1 || (current === total - 1 && i === 0)) slide.classList.add('next');
        else if (diff === -1 || (current === 0 && i === total - 1)) slide.classList.add('prev');
        else if (diff > 1) slide.classList.add('far-next');
        else slide.classList.add('far-prev');
      });

      dotsContainer.querySelectorAll('.carousel-dot').forEach((d, i) => {
        d.classList.toggle('active', i === current);
      });
    }

    // Init
    updateSlides();

    prevBtn.addEventListener('click', () => goTo(current - 1));
    nextBtn.addEventListener('click', () => goTo(current + 1));

    // Swipe
    let startX = 0;
    carousel.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    carousel.addEventListener('touchend', (e) => {
      const dx = startX - e.changedTouches[0].clientX;
      if (Math.abs(dx) > 50) {
        if (dx > 0) goTo(current + 1);
        else goTo(current - 1);
      }
    }, { passive: true });

    // Track visibility for global keyboard
    const carouselObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) activeCarousel = { goTo, current: () => current };
        else if (activeCarousel && activeCarousel.goTo === goTo) activeCarousel = null;
      });
    }, { threshold: 0.3 });
    carouselObserver.observe(carousel);
  });

  // ==================== KEYBOARD ====================
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // Left/Right arrows → carousel (if visible)
    if (e.key === 'ArrowLeft' && activeCarousel) {
      e.preventDefault();
      activeCarousel.goTo(activeCarousel.current() - 1);
      return;
    }
    if (e.key === 'ArrowRight' && activeCarousel) {
      e.preventDefault();
      activeCarousel.goTo(activeCarousel.current() + 1);
      return;
    }

    // Up/Down arrows → page scroll
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

  // ==================== GLOSSARY BAR (persistent) ====================
  const glossaryBar = document.getElementById('glossary-bar');
  const glossaryTerm = document.getElementById('glossary-term');
  const glossaryDef = document.getElementById('glossary-def');
  const glossaryClose = document.getElementById('glossary-close');

  function showGlossary(term, def) {
    glossaryTerm.textContent = term;
    glossaryDef.textContent = def;
    glossaryBar.classList.remove('hidden');
    glossaryBar.classList.add('visible');
    // No auto-hide – stays until closed or replaced
  }

  function hideGlossary() {
    glossaryBar.classList.remove('visible');
    glossaryBar.classList.add('hidden');
  }

  glossaryClose.addEventListener('click', hideGlossary);

  // Auto-show on hover, persistent (no auto-hide)
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

  // ==================== ANIMATED FOG BACKGROUND ====================
  const canvas = document.getElementById('bg-fog');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let w, h;
    const blobs = [];
    const blobCount = 6;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    function initBlobs() {
      blobs.length = 0;
      for (let i = 0; i < blobCount; i++) {
        blobs.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 200 + Math.random() * 300,
          dx: (Math.random() - 0.5) * 0.15,
          dy: (Math.random() - 0.5) * 0.1,
          hue: 210 + Math.random() * 20,
          alpha: 0.025 + Math.random() * 0.02,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    let t = 0;
    function drawFog() {
      t += 0.003;
      ctx.clearRect(0, 0, w, h);

      // Base tint
      ctx.fillStyle = 'rgba(235, 240, 250, 0.3)';
      ctx.fillRect(0, 0, w, h);

      blobs.forEach(b => {
        const pulse = 1 + Math.sin(t + b.phase) * 0.15;
        const r = b.r * pulse;
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
        grad.addColorStop(0, `hsla(${b.hue}, 40%, 75%, ${b.alpha * 1.5})`);
        grad.addColorStop(0.5, `hsla(${b.hue}, 35%, 80%, ${b.alpha * 0.8})`);
        grad.addColorStop(1, `hsla(${b.hue}, 30%, 85%, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(b.x - r, b.y - r, r * 2, r * 2);

        b.x += b.dx + Math.sin(t * 0.5 + b.phase) * 0.1;
        b.y += b.dy + Math.cos(t * 0.3 + b.phase) * 0.08;
        if (b.x < -b.r) b.x = w + b.r;
        if (b.x > w + b.r) b.x = -b.r;
        if (b.y < -b.r) b.y = h + b.r;
        if (b.y > h + b.r) b.y = -b.r;
      });

      requestAnimationFrame(drawFog);
    }

    resize();
    initBlobs();
    drawFog();
    window.addEventListener('resize', () => { resize(); initBlobs(); });
  }

  // Init
  updateProgress();
})();
