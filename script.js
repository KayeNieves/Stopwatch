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