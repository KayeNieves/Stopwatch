const display = document.getElementById("display");
const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const lapBtn = document.getElementById("lap");
const resetBtn = document.getElementById("reset");
const lapList = document.getElementById("laps");

let startTime = 0;      // timestamp when the current run started
let elapsedBefore = 0;  // time (ms) saved from earlier runs, before a pause
let timerId = null;
let lapCount = 0;

function getElapsed() {
  if (timerId === null) return elapsedBefore;
  return elapsedBefore + (Date.now() - startTime);
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

function updateDisplay() {
  display.textContent = formatTime(getElapsed());
}

function start() {
  if (timerId !== null) return;
  startTime = Date.now();
  timerId = setInterval(updateDisplay, 100);
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  lapBtn.disabled = false;
}

function pause() {
  if (timerId === null) return;
  elapsedBefore = getElapsed();
  clearInterval(timerId);
  timerId = null;
  updateDisplay();
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  lapBtn.disabled = true;
}

function lap() {
  if (timerId === null) return;
  lapCount++;
  const item = document.createElement("li");
  item.innerHTML = "<span>Lap " + lapCount + "</span><span>" + formatTime(getElapsed()) + "</span>";
  lapList.prepend(item);
}

function reset() {
  clearInterval(timerId);
  timerId = null;
  elapsedBefore = 0;
  lapCount = 0;
  lapList.innerHTML = "";
  updateDisplay();
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  lapBtn.disabled = true;
}

startBtn.addEventListener("click", start);
pauseBtn.addEventListener("click", pause);
lapBtn.addEventListener("click", lap);
resetBtn.addEventListener("click", reset);

const focusDurationInput = document.getElementById("focus-duration");
const breakDurationInput = document.getElementById("break-duration");
const focusStatus = document.getElementById("focus-status");
const focusDisplay = document.getElementById("focus-display");
const focusStartBtn = document.getElementById("focus-start");
const focusPauseBtn = document.getElementById("focus-pause");
const focusResetBtn = document.getElementById("focus-reset");

let focusTimerId = null;
let focusPhase = "focus";
let focusRunning = false;
let focusSessionActive = false;
let focusDeadline = 0;
let focusRemainingMs = 0;
let studyDurationMs = 0;
let breakDurationMs = 0;

function formatCountdown(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  }

  return [minutes + hours * 60, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function readDuration(input) {
  const minutes = input.valueAsNumber;
  if (!Number.isInteger(minutes) || minutes < 1) {
    input.setCustomValidity("Enter a whole number of minutes greater than zero.");
    input.reportValidity();
    return null;
  }

  input.setCustomValidity("");
  return minutes * 60 * 1000;
}

function setFocusSettingsDisabled(disabled) {
  focusDurationInput.disabled = disabled;
  breakDurationInput.disabled = disabled;
}

function updateFocusDisplay() {
  focusDisplay.textContent = formatCountdown(focusRemainingMs);
}

function showFocusNotification(title, body) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  try {
    new Notification(title, { body });
  } catch (error) {
    console.error("Could not display the Study Focus notification.", error);
  }
}

function finishFocusPhase() {
  if (focusPhase === "focus") {
    focusPhase = "break";
    focusRemainingMs = breakDurationMs;
    focusDeadline = Date.now() + breakDurationMs;
    focusStatus.textContent = "Study time is up. Break time starts now.";
    showFocusNotification("Study time is up", "Your break starts now.");
    updateFocusDisplay();
    return;
  }

  clearInterval(focusTimerId);
  focusTimerId = null;
  focusRunning = false;
  focusSessionActive = false;
  focusPhase = "focus";
  focusRemainingMs = 0;
  focusStatus.textContent = "Break complete. Ready for another study session.";
  focusStartBtn.disabled = false;
  focusStartBtn.textContent = "Start focus";
  focusPauseBtn.disabled = true;
  setFocusSettingsDisabled(false);
  updateFocusDisplay();
  showFocusNotification("Break complete", "You can start another study session when ready.");
}

function updateFocusTimer() {
  focusRemainingMs = Math.max(0, focusDeadline - Date.now());
  if (focusRemainingMs === 0) {
    finishFocusPhase();
    return;
  }

  updateFocusDisplay();
}

function requestFocusNotifications() {
  if (!("Notification" in window) || Notification.permission !== "default") return;

  Notification.requestPermission().catch((error) => {
    console.error("Could not request Study Focus notification permission.", error);
  });
}

function startFocus() {
  if (focusRunning) return;

  if (!focusSessionActive) {
    const studyMs = readDuration(focusDurationInput);
    if (studyMs === null) return;
    const breakMs = readDuration(breakDurationInput);
    if (breakMs === null) return;

    studyDurationMs = studyMs;
    breakDurationMs = breakMs;
    focusPhase = "focus";
    focusRemainingMs = studyDurationMs;
    focusSessionActive = true;
    focusStatus.textContent = "Focus time";
    requestFocusNotifications();
  } else {
    focusStatus.textContent = focusPhase === "focus" ? "Focus time" : "Break time";
  }

  setFocusSettingsDisabled(true);
  focusRunning = true;
  focusDeadline = Date.now() + focusRemainingMs;
  focusStartBtn.disabled = true;
  focusPauseBtn.disabled = false;
  focusStartBtn.textContent = "Start focus";
  updateFocusDisplay();
  focusTimerId = setInterval(updateFocusTimer, 200);
}

function pauseFocus() {
  if (!focusRunning) return;

  focusRemainingMs = Math.max(0, focusDeadline - Date.now());
  clearInterval(focusTimerId);
  focusTimerId = null;
  focusRunning = false;
  focusStatus.textContent = focusPhase === "focus" ? "Focus paused" : "Break paused";
  focusStartBtn.disabled = false;
  focusStartBtn.textContent = "Resume";
  focusPauseBtn.disabled = true;
  updateFocusDisplay();
}

function resetFocus() {
  clearInterval(focusTimerId);
  focusTimerId = null;
  focusRunning = false;
  focusSessionActive = false;
  focusPhase = "focus";
  focusRemainingMs = 0;
  focusStartBtn.disabled = false;
  focusStartBtn.textContent = "Start focus";
  focusPauseBtn.disabled = true;
  setFocusSettingsDisabled(false);
  focusStatus.textContent = "Ready to focus";

  const studyMinutes = focusDurationInput.valueAsNumber;
  if (Number.isInteger(studyMinutes) && studyMinutes >= 1) {
    focusRemainingMs = studyMinutes * 60 * 1000;
  }
  updateFocusDisplay();
}

focusDurationInput.addEventListener("input", () => {
  focusDurationInput.setCustomValidity("");
  if (!focusSessionActive) resetFocus();
});
breakDurationInput.addEventListener("input", () => {
  breakDurationInput.setCustomValidity("");
});
focusStartBtn.addEventListener("click", startFocus);
focusPauseBtn.addEventListener("click", pauseFocus);
focusResetBtn.addEventListener("click", resetFocus);

resetFocus();