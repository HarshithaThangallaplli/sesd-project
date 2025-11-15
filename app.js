// Subjects and study parameters
const subjects = ['Math', 'Science', 'History', 'English'];
const dailyStudyHours = 2;
const daysInWeek = 7;

// Generate weekly study schedule
function generateStudySchedule() {
  const schedule = [];
  const hoursPerSubject = dailyStudyHours / subjects.length;

  for (let day = 0; day < daysInWeek; day++) {
    const daySchedule = {};
    subjects.forEach(subject => {
      daySchedule[subject] = hoursPerSubject.toFixed(2);
    });
    schedule.push(daySchedule);
  }
  return schedule;
}

// Render calendar with study schedule
function renderCalendar(schedule) {
  const calendarDiv = document.getElementById('calendar');
  calendarDiv.innerHTML = '';

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  for (let i = 0; i < daysInWeek; i++) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'day';

    const dayTitle = document.createElement('h3');
    dayTitle.textContent = days[i];
    dayDiv.appendChild(dayTitle);

    const subjectsList = document.createElement('ul');
    for (const subject of subjects) {
      const li = document.createElement('li');
      li.textContent = `${subject}: ${schedule[i][subject]} hrs`;
      subjectsList.appendChild(li);
    }
    dayDiv.appendChild(subjectsList);

    calendarDiv.appendChild(dayDiv);
  }
}

// Timer variables
let timerInterval = null;
let timerSeconds = 0;

// Format seconds to HH:MM:SS
function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
}

// Update timer display
function updateTimerDisplay() {
  const display = document.getElementById('timer-display');
  display.textContent = formatTime(timerSeconds);
}

// Start timer
function startTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    timerSeconds++;
    updateTimerDisplay();
  }, 1000);
  document.getElementById('start-timer').disabled = true;
  document.getElementById('stop-timer').disabled = false;
  document.getElementById('reset-timer').disabled = false;
}

// Stop timer
function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  document.getElementById('start-timer').disabled = false;
  document.getElementById('stop-timer').disabled = true;
}

// Reset timer
function resetTimer() {
  stopTimer();
  timerSeconds = 0;
  updateTimerDisplay();
  document.getElementById('reset-timer').disabled = true;
}

// Motivational quotes
const quotes = [
  "The future depends on what you do today. – Mahatma Gandhi",
  "Don’t watch the clock; do what it does. Keep going. – Sam Levenson",
  "Success is the sum of small efforts, repeated day in and day out. – Robert Collier",
  "The secret of getting ahead is getting started. – Mark Twain",
  "It always seems impossible until it’s done. – Nelson Mandela"
];

// Display a random quote
function displayRandomQuote() {
  const quoteBlock = document.getElementById('motivational-quote');
  const randomIndex = Math.floor(Math.random() * quotes.length);
  quoteBlock.textContent = quotes[randomIndex];
}

// Initialize app
function init() {
  const schedule = generateStudySchedule();
  renderCalendar(schedule);
  displayRandomQuote();
  updateTimerDisplay();

  document.getElementById('start-timer').addEventListener('click', startTimer);
  document.getElementById('stop-timer').addEventListener('click', stopTimer);
  document.getElementById('reset-timer').addEventListener('click', resetTimer);
  document.getElementById('new-quote').addEventListener('click', displayRandomQuote);
}

window.onload = init;
