// GAME DATABASE (energy + time combos)
const GAME_LIB = {
  low_short:   ["Stardew Valley", "Journey", "A Short Hike"],
  low_medium:  ["Animal Crossing: New Horizons", "Firewatch", "The Sims 4"],
  low_long:    ["Civilization VI", "Disco Elysium", "Slay the Spire"],
  medium_short:["Rocket League", "Fall Guys", "Hades"],
  medium_medium:["The Witcher 3: Wild Hunt", "Horizon Zero Dawn", "Red Dead Redemption 2"],
  medium_long: ["Elden Ring", "Persona 5 Royal", "Cyberpunk 2077"],
  high_short:  ["Doom Eternal", "Apex Legends", "Call of Duty: Warzone"],
  high_medium: ["Sekiro: Shadows Die Twice", "Returnal", "Bayonetta 3"],
  high_long:   ["Monster Hunter: World", "Bloodborne", "God of War (2018)"]
};

// character set for scrambling, this scares me
const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-=+[]{}:;'\"<>,.?/\\|";
function getRandomChar() {
  return CHARSET[Math.floor(Math.random() * CHARSET.length)];
}

// state for active animations
let activeScrambleIntervals = new Map();  
let pendingTimeouts = [];

function killAllAnimations() {
  for (let [el, intervalId] of activeScrambleIntervals.entries()) {
    if (intervalId) clearInterval(intervalId);
  }
  activeScrambleIntervals.clear();
  for (let id of pendingTimeouts) clearTimeout(id);
  pendingTimeouts = [];
}

function scrambleGameTitle(element, finalTitle) {
  if (activeScrambleIntervals.has(element)) {
    clearInterval(activeScrambleIntervals.get(element));
    activeScrambleIntervals.delete(element);
  }

  const len = finalTitle.length;
  let currentChars = new Array(len);
  let remainingSteps = new Array(len);

  for (let i = 0; i < len; i++) {
    const originalChar = finalTitle[i];
    if (originalChar === ' ') {
      currentChars[i] = ' ';
      remainingSteps[i] = 0;
    } else {
      currentChars[i] = getRandomChar();
      remainingSteps[i] = Math.floor(Math.random() * 12) + 10; // 10–22 flips
    }
  }
  element.textContent = currentChars.join('');

  const intervalId = setInterval(() => {
    let anyRemaining = false;
    for (let i = 0; i < len; i++) {
      if (remainingSteps[i] > 0) {
        anyRemaining = true;
        if (finalTitle[i] !== ' ') {
          currentChars[i] = getRandomChar();
          remainingSteps[i]--;
        } else {
          if (currentChars[i] !== ' ') currentChars[i] = ' ';
        }
      } else {
        if (finalTitle[i] !== ' ' && currentChars[i] !== finalTitle[i]) {
          currentChars[i] = finalTitle[i];
        } else if (finalTitle[i] === ' ' && currentChars[i] !== ' ') {
          currentChars[i] = ' ';
        }
      }
    }
    element.textContent = currentChars.join('');
    if (!anyRemaining) {
      if (element.textContent !== finalTitle) element.textContent = finalTitle;
      clearInterval(intervalId);
      activeScrambleIntervals.delete(element);
    }
  }, 60); // 60ms per tick = fast glitch effect

  activeScrambleIntervals.set(element, intervalId);
}

// create a game card (without scrambling yet)
function createGameCard(gameTitle, index) {
  const card = document.createElement('div');
  card.className = 'game-card';
  const titleEl = document.createElement('div');
  titleEl.className = 'game-title';
  titleEl.textContent = '▒▒▒ LOADING ▒▒▒';
  card.appendChild(titleEl);
  const metaDiv = document.createElement('div');
  metaDiv.className = 'game-meta';
  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.textContent = `[GAME_${index + 1}]`;
  const hintSpan = document.createElement('span');
  hintSpan.textContent = '◈ decrypting sequence ◈';
  metaDiv.appendChild(badge);
  metaDiv.appendChild(hintSpan);
  card.appendChild(metaDiv);
  return { card, titleEl, finalTitle: gameTitle };
}

// clear container and stop all ongoing scrambles
function resetRecommendations() {
  const container = document.getElementById('gameContainer');
  container.innerHTML = '';
  killAllAnimations();
}

// display games one by one, each with scramble effect
function showRecommendations(gameList) {
  const container = document.getElementById('gameContainer');
  resetRecommendations();
  if (!gameList || gameList.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:2rem;">⚠️ no games found — try another mood ⚠️</div>';
    return;
  }

  for (let i = 0; i < gameList.length; i++) {
    const timeoutId = setTimeout(() => {
      const { card, titleEl, finalTitle } = createGameCard(gameList[i], i);
      container.appendChild(card);
      scrambleGameTitle(titleEl, finalTitle);
    }, i * 340); // 340ms delay between cards
    pendingTimeouts.push(timeoutId);
  }
}

// get games from library based on energy & time
function getGamesByEnergyAndTime(energy, time) {
  const key = `${energy}_${time}`;
  const gamesArray = GAME_LIB[key];
  return gamesArray ? gamesArray.slice(0, 3) : ["Hades", "Stardew Valley", "Celeste"];
}


function generateRecommendations() {
  const energy = document.getElementById('energySelect').value;
  const time = document.getElementById('timeSelect').value;
  const games = getGamesByEnergyAndTime(energy, time);
  showRecommendations(games);
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('recommendBtn');
  if (btn) btn.addEventListener('click', generateRecommendations);
  // default: medium energy + medium time
  const defaultGames = getGamesByEnergyAndTime('medium', 'medium');
  showRecommendations(defaultGames);
});