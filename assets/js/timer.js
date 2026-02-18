/**
 * Presentation Timer & Block Progress Tracker
 * Tracks elapsed time, current block, and alerts when block time is running out.
 */

function initPresentationTimer(Reveal) {
  // Parse block definitions from slides
  const blocks = [];
  const slides = document.querySelectorAll('.slides > section');
  let currentBlockId = null;

  slides.forEach((slide, index) => {
    const blockId = slide.dataset.block;
    const blockName = slide.dataset.blockName;
    const blockMinutes = parseInt(slide.dataset.blockMinutes, 10);

    if (blockName && blockId !== currentBlockId) {
      blocks.push({
        id: blockId,
        name: blockName,
        minutes: blockMinutes || 5,
        firstSlideIndex: index,
        lastSlideIndex: index,
      });
      currentBlockId = blockId;
    } else if (blockId === currentBlockId && blocks.length > 0) {
      blocks[blocks.length - 1].lastSlideIndex = index;
    }
  });

  // State
  let timerRunning = false;
  let startTime = null;
  let elapsed = 0; // ms
  let pausedElapsed = 0;
  let blockStartTimes = {};
  let blockElapsed = {};
  let alertShown = false;
  let alertTimeout = null;

  // Compute cumulative start times
  let cumulative = 0;
  blocks.forEach(b => {
    blockStartTimes[b.id] = cumulative;
    blockElapsed[b.id] = 0;
    cumulative += b.minutes * 60 * 1000;
  });
  const totalMinutes = cumulative / 60000;

  // DOM elements
  const elapsedEl = document.getElementById('elapsed-time');
  const blockTimeLeftEl = document.getElementById('block-time-left');
  const blockNameEl = document.getElementById('current-block-name');
  const blockProgressFill = document.getElementById('block-progress-fill');
  const toggleBtn = document.getElementById('timer-toggle');
  const resetBtn = document.getElementById('timer-reset');
  const alertEl = document.getElementById('block-alert');
  const alertTextEl = document.getElementById('alert-text');

  // Format ms to mm:ss
  function formatTime(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  // Get current block based on slide index
  function getCurrentBlock() {
    const slideIndex = Reveal.getIndices().h;
    for (let i = blocks.length - 1; i >= 0; i--) {
      if (slideIndex >= blocks[i].firstSlideIndex) {
        return blocks[i];
      }
    }
    return blocks[0];
  }

  // Get block index
  function getBlockIndex(block) {
    return blocks.findIndex(b => b.id === block.id);
  }

  // Show alert
  function showAlert(text) {
    if (alertShown) return;
    alertShown = true;
    alertTextEl.textContent = text;
    alertEl.classList.remove('hidden');
    alertEl.classList.add('visible');

    if (alertTimeout) clearTimeout(alertTimeout);
    alertTimeout = setTimeout(() => {
      alertEl.classList.remove('visible');
      alertEl.classList.add('hidden');
      alertShown = false;
    }, 8000);
  }

  // Dismiss alert on click
  alertEl.addEventListener('click', () => {
    alertEl.classList.remove('visible');
    alertEl.classList.add('hidden');
    alertShown = false;
  });

  // Update display
  function update() {
    const now = timerRunning ? Date.now() : startTime ? startTime : Date.now();
    const currentElapsed = timerRunning ? (Date.now() - startTime + pausedElapsed) : pausedElapsed;

    // Elapsed time
    elapsedEl.textContent = formatTime(currentElapsed);

    // Current block
    const block = getCurrentBlock();
    if (block) {
      blockNameEl.textContent = block.name;

      // Calculate time left for this block
      const blockEnd = blockStartTimes[block.id] + block.minutes * 60 * 1000;
      const timeLeft = blockEnd - currentElapsed;

      blockTimeLeftEl.textContent = formatTime(Math.abs(timeLeft));

      if (timeLeft < 0) {
        blockTimeLeftEl.className = 'time-over';
        blockTimeLeftEl.textContent = '-' + formatTime(Math.abs(timeLeft));
      } else if (timeLeft < 120000) { // less than 2 min
        blockTimeLeftEl.className = 'time-warning';
        if (timeLeft < 60000 && timerRunning) {
          showAlert('Zbývá méně než minuta na tento blok!');
        }
      } else {
        blockTimeLeftEl.className = 'time-ok';
      }

      // Block progress (within current block)
      const blockElapsedMs = currentElapsed - blockStartTimes[block.id];
      const blockTotalMs = block.minutes * 60 * 1000;
      const progress = Math.min(100, Math.max(0, (blockElapsedMs / blockTotalMs) * 100));
      blockProgressFill.style.width = progress + '%';

      if (progress > 90) {
        blockProgressFill.className = 'progress-danger';
      } else if (progress > 75) {
        blockProgressFill.className = 'progress-warning';
      } else {
        blockProgressFill.className = '';
      }

      // Check if we should alert for block transition
      if (timeLeft <= 0 && timerRunning) {
        const nextIdx = getBlockIndex(block) + 1;
        if (nextIdx < blocks.length) {
          showAlert('Čas přejít na: ' + blocks[nextIdx].name);
        }
      }
    }
  }

  // Timer loop
  let timerInterval = null;

  function startTimer() {
    if (timerRunning) return;
    timerRunning = true;
    startTime = Date.now();
    toggleBtn.innerHTML = '&#9646;&#9646;';
    toggleBtn.title = 'Pause timer';
    timerInterval = setInterval(update, 500);
  }

  function pauseTimer() {
    if (!timerRunning) return;
    timerRunning = false;
    pausedElapsed += Date.now() - startTime;
    toggleBtn.innerHTML = '&#9654;';
    toggleBtn.title = 'Start timer';
    if (timerInterval) clearInterval(timerInterval);
    update();
  }

  function resetTimer() {
    timerRunning = false;
    startTime = null;
    pausedElapsed = 0;
    elapsed = 0;
    alertShown = false;
    toggleBtn.innerHTML = '&#9654;';
    toggleBtn.title = 'Start timer';
    if (timerInterval) clearInterval(timerInterval);
    update();
  }

  // Event listeners
  toggleBtn.addEventListener('click', () => {
    if (timerRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  resetBtn.addEventListener('click', resetTimer);

  // Update on slide change
  Reveal.on('slidechanged', () => {
    alertShown = false;
    update();
  });

  // Keyboard shortcut: T to toggle timer
  document.addEventListener('keydown', (e) => {
    if (e.key === 't' || e.key === 'T') {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (timerRunning) pauseTimer();
      else startTimer();
    }
  });

  // Initial update
  update();
}
