const form = document.getElementById('studyForm');
const state = document.getElementById('state');
const timerDisplay = document.getElementById('timer');

form.addEventListener('submit', function(event) {
  event.preventDefault();
  const studyTimeEl = document.getElementById('studyTime');
  const studyTime = parseInt(studyTimeEl.value, 10);
  
  const breakTimeEl = document.getElementById('breakTime');
  const breakTime = parseInt(breakTimeEl.value, 10);
  
  const studyCyclesEl = document.getElementById('studyCycles');
  const studyCycles = parseInt(studyCyclesEl.value, 10);
  
  const button = document.getElementById('startButton');
  studyTimeEl.style.display = 'none';
  breakTimeEl.style.display = 'none';
  studyCyclesEl.style.display = 'none';
  button.style.display = 'none';

  let i = 0, counter = 0; 

  function startTimer() {
      if(counter >= studyCycles){ 
        studyTimeEl.style.display = 'block';
        breakTimeEl.style.display = 'block';
        studyCyclesEl.style.display = 'block';
        button.style.display = 'block';
        return;
      }

      const isBreak = i % 2 == 1; 
      const duration = isBreak ? breakTime : studyTime;

      if(isBreak){
          state.textContent = `Inizio Break (Ciclo ${counter})`;
          state.style.animation = 'shake 0.5s ease-in-out';
      }else{   
          state.textContent = `Inizio Timer (Ciclo ${++counter})`;
          state.style.animation = 'none';
      }
      const endTime = Date.now() + duration * 60000;

      const interval = setInterval(tick, 1000);

      function tick() {
          const now = Date.now();
          const difference = endTime - now;
          updateProgress(difference);
        
          if (difference < 0) { 
              clearInterval(interval);
              state.textContent = 'Timer finito';
              state.style.animation = 'shake 0.5s ease-in-out';
              i++;
              startTimer(); 
          } else {
              displayTime(difference);
          }
      }

      function displayTime(difference) {
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);
          timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
          timerDisplay.style.animation = 'time-fade 5s infinite';
      }
    
      function updateProgress(difference) {
        const progressRing = document.querySelector('.progress-ring');
        const progress = ((duration * 60000) - difference) / (duration * 60000);
        const degrees = progress * 360;
        progressRing.style.setProperty('--deg', `${degrees}deg`);
      }
      
    
  }

  startTimer();
});