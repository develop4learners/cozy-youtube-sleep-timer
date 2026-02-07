// Cozy YouTube Sleep Timer
// A gentle, visible sleep timer for falling asleep to YouTube
// Author: Xylo Piano (formerly Collette Roberto)
// License: MIT

// ==UserScript==
// @name         YouTube Sleep Timer (Manual)
// @namespace    cozy.sleep.timer
// @version      0.1
// @description  Grandma-friendly YouTube sleep timer (manual launch)
// @match        https://www.youtube.com/*
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
  /***************
   * STATE
   ***************/
  let timerRunning = false;
  let timeoutId = null;
  let intervalId = null;
  let remainingMs = 0;
  let lastMinutes = 55;

  /***************
   * ELEMENTS
   ***************/
  let panelEl, inputEl, countdownEl, startBtn, cancelBtn;

  /***************
   * CSS (FROZEN ❄️)
   ***************/
  const style = document.createElement("style");
  style.textContent = `
    #sleep-timer-panel {
      position: fixed;
      top: 16px;
      right: 16px;
      background: rgba(0,0,0,0.85);
      color: white;
      padding: 12px;
      border-radius: 10px;
      font-family: system-ui, sans-serif;
      z-index: 999999;
      width: 150px;
      cursor: move;
    }

    #sleep-timer-panel input {
      width: 100%;
      padding: 6px;
      font-size: 16px;
      margin-bottom: 8px;
      border-radius: 6px;
      border: none;
    }

    #sleep-timer-panel button {
      width: 100%;
      padding: 10px 14px;
      font-size: 16px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      background: #ff0000;
      color: white;
      font-weight: 600;
    }

    #sleep-timer-panel button:hover {
      filter: brightness(0.9);
    }

    #sleep-timer-panel button + button {
      margin-top: 6px;
    }

    #countdown {
      margin-bottom: 8px;
      font-size: 28px;
      font-weight: bold;
      text-align: center;
    }

    #sleep-minutes {
      width: 100%;
      box-sizing: border-box;

      font-size: 22px;
      padding: 10px 12px;

      color: #fff;
      background: rgba(255, 255, 255, 0.08);

      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 8px;

      outline: none;
      text-align: center;

      -moz-appearance: textfield; /* Firefox */
    }

    #sleep-minutes:focus {
      background: rgba(255, 255, 255, 0.12);
      border-color: #ff0000; /* YouTube red */
    }

    /* Remove number input spinners */
    #sleep-minutes::-webkit-outer-spin-button,
    #sleep-minutes::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

  `;
  document.head.appendChild(style);

  /***************
   * DRAGGABLE
   ***************/
  function makePanelDraggable(panel) {
    let isDragging = false;
    let startX, startY, startTop, startRight;

    panel.addEventListener("mousedown", (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = panel.getBoundingClientRect();
      startTop = rect.top;
      startRight = window.innerWidth - rect.right;

      document.body.style.userSelect = "none";
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      panel.style.top = `${startTop + dy}px`;
      panel.style.right = `${startRight - dx}px`;
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
      document.body.style.userSelect = "";
    });
  }

  /***************
   * PANEL CREATION
   ***************/
  function createPanel() {
    if (panelEl) panelEl.remove();

    panelEl = document.createElement("div");
    panelEl.id = "sleep-timer-panel";

    countdownEl = document.createElement("div");
    countdownEl.id = "countdown";

    inputEl = document.createElement("input");
    inputEl.type = "number";
    inputEl.min = "0";
    inputEl.step = "0.1";
    inputEl.value = lastMinutes;
    inputEl.id = "sleep-minutes";

    startBtn = document.createElement("button");
    startBtn.textContent = "Start";

    cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel (Esc)";

    panelEl.appendChild(countdownEl);
    panelEl.appendChild(inputEl);
    panelEl.appendChild(startBtn);
    panelEl.appendChild(cancelBtn);

    document.body.appendChild(panelEl);

    makePanelDraggable(panelEl);
    renderInputScreen();

    startBtn.addEventListener("click", startFromInput);
    cancelBtn.addEventListener("click", cancelTimer);

    inputEl.addEventListener("focus", () => {
      inputEl.value = "";
    });

    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") startFromInput();
    });
  }

  /***************
   * SCREENS
   ***************/
  function renderInputScreen() {
    timerRunning = false;
    countdownEl.textContent = "";
    inputEl.style.display = "block";
    startBtn.style.display = "block";
    cancelBtn.style.display = "none";
  }

  function renderCountdown() {
    inputEl.style.display = "none";
    startBtn.style.display = "none";
    cancelBtn.style.display = "block";
  }

  /***************
   * TIMER LOGIC
   ***************/
  function startFromInput() {
    const minutes = parseFloat(inputEl.value);
    if (!minutes || minutes <= 0) return;

    lastMinutes = minutes;
    remainingMs = minutes * 60 * 1000;
    startTimer();
  }

  function startTimer() {
    clearTimers();
    timerRunning = true;
    renderCountdown();
    updateCountdown();

    timeoutId = setTimeout(pauseVideo, remainingMs);

    intervalId = setInterval(() => {
      remainingMs -= 1000;
      if (remainingMs <= 0) {
        remainingMs = 0;
        updateCountdown();
        clearInterval(intervalId);
      } else {
        updateCountdown();
      }
    }, 1000);
  }

  function cancelTimer() {
    clearTimers();
    renderInputScreen();
  }

  function clearTimers() {
    timerRunning = false;
    clearTimeout(timeoutId);
    clearInterval(intervalId);
    timeoutId = null;
    intervalId = null;
  }

  function updateCountdown() {
    const totalSeconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    countdownEl.textContent = `${minutes}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  function pauseVideo() {
    const video = document.querySelector("video");
    if (video) video.pause();
  }

  /***************
   * GLOBAL ESC
   ***************/
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && timerRunning) {
      e.preventDefault();
      cancelTimer();
    }
  });

  /***************
   * MENU / FALLBACK
   ***************/
  if (typeof GM_registerMenuCommand === "function") {
    GM_registerMenuCommand("Open Sleep Timer", createPanel);
  } else {
    createPanel();
  }
})();
