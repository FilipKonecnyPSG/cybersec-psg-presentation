/**
 * CyberSec PSG Presentation – Main Application
 * Vertical scroll, parallax, progress tracking, timer, animations
 */

(function() {
  'use strict';

  // ==================== SCROLL ANIMATIONS (Intersection Observer) ====================
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -60px 0px'
  };

  const animateObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.animate-in').forEach(el => {
    animateObserver.observe(el);
  });

  // ==================== PARALLAX EFFECT ====================
  const parallaxElements = document.querySelectorAll('.parallax-bg, .parallax-img');

  function updateParallax() {
    const scrollY = window.scrollY;
    parallaxElements.forEach(el => {
      const speed = parseFloat(el.dataset.speed) || 0.2;
      const rect = el.parentElement ? el.parentElement.getBoundingClientRect() : el.getBoundingClientRect();
      const offset = (rect.top + scrollY) * speed - scrollY * speed;
      el.style.transform = `translateY(${offset}px)`;
    });
  }

  let parallaxTicking = false;
  window.addEventListener('scroll', () => {
    if (!parallaxTicking) {
      requestAnimationFrame(() => {
        updateParallax();
        parallaxTicking = false;
      });
      parallaxTicking = true;
    }
  });

  // ==================== HEADER SCROLL BEHAVIOR ====================
  const header = document.getElementById('main-header');
  let lastScrollY = 0;

  function updateHeader() {
    const scrollY = window.scrollY;
    if (scrollY > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    if (scrollY > lastScrollY && scrollY > 300) {
      header.classList.add('hidden');
    } else {
      header.classList.remove('hidden');
    }
    lastScrollY = scrollY;
  }

  window.addEventListener('scroll', () => {
    requestAnimationFrame(updateHeader);
  });

  // ==================== PROGRESS PANEL ====================
  const progressDots = document.querySelectorAll('.progress-dot');
  const progressLineFill = document.getElementById('progress-line-fill');
  const sections = document.querySelectorAll('.section[data-block]');

  function updateProgress() {
    const scrollY = window.scrollY;
    const windowH = window.innerHeight;
    const docH = document.documentElement.scrollHeight - windowH;
    const scrollPercent = Math.min(100, (scrollY / docH) * 100);

    // Update progress line
    if (progressLineFill) {
      progressLineFill.style.height = scrollPercent + '%';
    }

    // Determine current section
    let currentBlock = '';
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= windowH * 0.4) {
        currentBlock = section.dataset.block;
      }
    });

    // Update dots
    progressDots.forEach(dot => {
      if (dot.dataset.block === currentBlock) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  window.addEventListener('scroll', () => {
    requestAnimationFrame(updateProgress);
  });

  // Smooth scroll for progress dots
  progressDots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(dot.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ==================== TIMER ====================
  const elapsedEl = document.getElementById('elapsed-time');
  const blockTimeEl = document.getElementById('block-time');
  const toggleBtn = document.getElementById('timer-toggle');
  const resetBtn = document.getElementById('timer-reset');

  let timerRunning = false;
  let startTime = null;
  let pausedElapsed = 0;
  const totalMinutes = 90;
  let timerInterval = null;

  function formatTime(ms) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function updateTimer() {
    const elapsed = timerRunning ? (Date.now() - startTime + pausedElapsed) : pausedElapsed;
    const remaining = totalMinutes * 60 * 1000 - elapsed;

    elapsedEl.textContent = formatTime(elapsed);
    blockTimeEl.textContent = formatTime(Math.abs(remaining));

    if (remaining < 0) {
      blockTimeEl.className = 'timer-block-time over';
      blockTimeEl.textContent = '-' + formatTime(Math.abs(remaining));
    } else if (remaining < 300000) {
      blockTimeEl.className = 'timer-block-time warning';
    } else {
      blockTimeEl.className = 'timer-block-time';
    }
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
    timerRunning = false;
    startTime = null;
    pausedElapsed = 0;
    toggleBtn.innerHTML = '&#9654;';
    clearInterval(timerInterval);
    updateTimer();
  });

  document.addEventListener('keydown', (e) => {
    if ((e.key === 't' || e.key === 'T') && e.target.tagName !== 'INPUT') {
      toggleBtn.click();
    }
  });

  updateTimer();

  // ==================== BACKGROUND PARTICLES ====================
  const canvas = document.getElementById('bg-particles');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let w, h;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = document.documentElement.scrollHeight;
    }

    function createParticles() {
      particles = [];
      const count = Math.floor((w * h) / 80000);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 2 + 0.5,
          dx: (Math.random() - 0.5) * 0.3,
          dy: (Math.random() - 0.5) * 0.15,
          opacity: Math.random() * 0.15 + 0.03,
        });
      }
    }

    function drawParticles() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 85, 164, ${p.opacity})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
      });
      requestAnimationFrame(drawParticles);
    }

    resize();
    createParticles();
    drawParticles();

    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        resize();
        createParticles();
      }, 300);
    });
  }

  // ==================== TOOLTIP TOUCH SUPPORT ====================
  document.querySelectorAll('.tooltip').forEach(tip => {
    tip.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      // Remove all other active tooltips
      document.querySelectorAll('.tooltip.touch-active').forEach(t => t.classList.remove('touch-active'));
      tip.classList.add('touch-active');
    });
  });

  document.addEventListener('touchstart', () => {
    document.querySelectorAll('.tooltip.touch-active').forEach(t => t.classList.remove('touch-active'));
  });

  // ==================== COUNTER ANIMATION ====================
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.counted) {
        entry.target.dataset.counted = 'true';
        const target = parseInt(entry.target.textContent, 10);
        if (isNaN(target)) return;
        let current = 0;
        const step = Math.max(1, Math.floor(target / 40));
        const interval = setInterval(() => {
          current += step;
          if (current >= target) {
            current = target;
            clearInterval(interval);
          }
          entry.target.textContent = current;
        }, 30);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat-number').forEach(el => {
    counterObserver.observe(el);
  });

  // ==================== CHART BAR ANIMATION ====================
  const barObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('bar-animated');
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.chart-visual').forEach(el => {
    barObserver.observe(el);
  });

  // Initial calls
  updateParallax();
  updateProgress();

})();
