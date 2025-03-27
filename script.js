const cardContainer = document.querySelector(".card-wrapper .card-container");

const levelBtns = document.querySelectorAll(".levels button");

const timeElem = document.querySelectorAll(".stats .time span");
const movesElem = document.querySelector(".stats .moves");

const playPauseBtn = document.querySelector(
  ".stats-controls button.play-pause"
);

const highScoreElem = document.querySelector(".high-score");
const highScoreTime = highScoreElem.querySelector(".time");
const highScoreMoves = highScoreElem.querySelector(".moves");
let highScore = JSON.parse(sessionStorage.getItem("highscore")) || {
  Easy: {
    time: null,
    moves: null,
  },
  Medium: {
    time: null,
    moves: null,
  },
  Hard: {
    time: null,
    moves: null,
  },
};

const imgList = [
  "image-1",
  "image-2",
  "image-3",
  "image-4",
  "image-5",
  "image-6",
  "image-7",
  "image-8",
  "image-9",
  "image-10",
  "image-11",
  "image-12",
  "image-13",
  "image-14",
  "image-15",
  "image-16",
  "image-17",
  "image-18",
  "image-19",
  "image-20",
  "image-21",
];

let totalCards = 24;
let currentLevel = "Medium";

let openCardsCount = 0;
let selectedCards = [];

let timerInterval = null;
let startTime = null;
let elaspedTime = 0;

let moves = 0;

// redendering new game

function newGame() {
  openCardsCount = 0;
  selectedCards = [];

  updateGrid();
  createCards();

  stopTimer();
  elaspedTime = 0;
  timeElem[0].textContent = "00";
  timeElem[1].textContent = "00";
  timeElem[2].textContent = "00";

  moves = 0;
  movesElem.textContent = moves;

  if (playPauseBtn.classList.contains("get-visible"))
    playPauseBtn.classList.remove("get-visible");

  setHighScore();
}

newGame();

// card container updation

levelBtns.forEach((btn) => {
  let selectedLevel = btn.innerText.trim();
  btn.onclick = function () {
    if (currentLevel !== selectedLevel) {
      if (currentLevel === "Easy") {
        levelBtns[0].classList.remove("selected");
      } else if (currentLevel === "Medium") {
        levelBtns[1].classList.remove("selected");
      } else if (currentLevel === "Hard") {
        levelBtns[2].classList.remove("selected");
      }

      currentLevel = selectedLevel;
      btn.classList.add("selected");
      newGame();
    }
  };
});

function updateGrid() {
  const level = {
    Easy: { total: 16, gridOrder: 4 },
    Medium: { total: 24, gridOrder: 5 },
    Hard: { total: 36, gridOrder: 6 },
  };

  const { total, gridOrder } = level[currentLevel];

  totalCards = total;
  cardContainer.style.gridTemplateColumns = `repeat(${gridOrder}, 1fr)`;
  cardContainer.style.gridTemplateRows = `repeat(${gridOrder}, 1fr)`;
  createCards();
}

// play pause button

function togglePlayPauseBtn(text) {
  playPauseBtn.firstElementChild.title = text;
  playPauseBtn.firstElementChild.className = `ri-${text}-fill`;
}

playPauseBtn.addEventListener("click", () => {
  if (timerInterval) {
    stopTimer();
  } else {
    startTimer();
  }
});

// reset button

document
  .querySelector(".stats-controls button.reset")
  .addEventListener("click", () => {
    newGame();
  });

// random cards generation

function createCards() {
  cardContainer.innerHTML = "";
  let randImgList = generateRandImgList();

  randImgList.forEach((img, idx) => {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.image = img;
    card.innerHTML = `
      <div class="back" style="background-image: url(./assets/question.png)"></div>
      <div class="front" style="background-image: url(./assets/${img}.png)"></div>
    `;

    if (totalCards === 24 && idx === 12) {
      card.style.gridColumnStart = 4;
    }

    card.addEventListener("click", (event) => {
      if (openCardsCount === totalCards) {
        return;
      }

      if (timerInterval === null) {
        startTimer();
        playPauseBtn.classList.add("get-visible");
      }

      onCardClick(event.currentTarget);
    });

    cardContainer.appendChild(card);
    animate(card, "added");
  });
}

function generateRandImgList() {
  const tempImgList = imgList.slice();
  const selectedImgList = [];

  for (let i = 0; i < totalCards / 2; i++) {
    const randIdx = Math.floor(Math.random() * tempImgList.length);
    selectedImgList.push(tempImgList[randIdx]);
    tempImgList[randIdx] = tempImgList[tempImgList.length - 1];
    tempImgList.pop();
  }

  const pairedImages = [...selectedImgList, ...selectedImgList];
  for (let i = pairedImages.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [pairedImages[i], pairedImages[j]] = [pairedImages[j], pairedImages[i]];
  }

  return pairedImages;
}

// game actions

function animate(card, animation) {
  return new Promise((resolve, reject) => {
    card.classList.add(animation);

    card.addEventListener("animationend", () => {
      card.classList.remove(animation);
      resolve("animation ended");
    });
  });
}

async function onCardClick(card) {
  if (card.classList.contains("open")) return;

  card.classList.add("open");
  await animate(card, "show");

  if (
    selectedCards.length !== 0 &&
    selectedCards[selectedCards.length - 1].length === 1
  ) {
    selectedCards[selectedCards.length - 1].push(card);
  } else {
    selectedCards.push([card]);
  }

  if (selectedCards[0].length == 2) {
    movesElem.textContent = ++moves;

    const [card1, card2] = selectedCards[0];
    selectedCards.splice(0, 1);

    if (card1.dataset.image === card2.dataset.image) {
      animate(card1, "bounce");
      animate(card2, "bounce");
      openCardsCount += 2;

      if (openCardsCount === totalCards) {
        stopTimer();
        playPauseBtn.classList.remove("get-visible");
        updateHighScore();
      }
    } else {
      card1.style.pointerEvents = "none";
      card2.style.pointerEvents = "none";

      await Promise.all([animate(card1, "shake"), animate(card2, "shake")]);
      await Promise.all([animate(card1, "hide"), animate(card2, "hide")]);
      card2.classList.remove("open");
      card1.classList.remove("open");

      card1.style.pointerEvents = "auto";
      card2.style.pointerEvents = "auto";
    }
  }
}

// game timer

function startTimer() {
  togglePlayPauseBtn("pause");

  if (!startTime) startTime = Date.now() - elaspedTime;

  timerInterval = setInterval(() => {
    const totalMilliSeconds = Date.now() - startTime;
    elaspedTime = totalMilliSeconds;

    const min = Math.floor(totalMilliSeconds / (1000 * 60));
    const sec = Math.floor((totalMilliSeconds / 1000) % 60);
    const ms = Math.floor((totalMilliSeconds % 1000) / 10);

    timeElem[0].textContent = min.toString().padStart(2, "0");
    timeElem[1].textContent = sec.toString().padStart(2, "0");
    timeElem[2].textContent = ms.toString().padStart(2, "0");
  }, 10);
}

function stopTimer() {
  togglePlayPauseBtn("play");

  clearInterval(timerInterval);
  timerInterval = null;
  startTime = null;
}

// highscore

function setHighScore() {
  if (highScore[currentLevel].time === null) {
    highScoreTime.textContent = "--:--:--";
    highScoreMoves.textContent = "--";
  } else {
    const totalMilliSeconds = highScore[currentLevel].time;
    const min = Math.floor(totalMilliSeconds / (1000 * 60))
      .toString()
      .padStart(2, "0");
    const sec = Math.floor((totalMilliSeconds / 1000) % 60)
      .toString()
      .padStart(2, "0");
    const ms = Math.floor((totalMilliSeconds % 1000) / 10)
      .toString()
      .padStart(2, "0");

    highScoreTime.textContent = `${min}:${sec}:${ms}`;
    highScoreMoves.textContent = highScore[currentLevel].moves;
  }
}

function updateHighScore() {
  const totalMilliSeconds =
    +timeElem[0].textContent * 60 * 1000 +
    +timeElem[1].textContent * 1000 +
    +timeElem[2].textContent * 10;

  if (
    highScore[currentLevel].time === null ||
    highScore[currentLevel].time > totalMilliSeconds
  ) {
    highScore[currentLevel].time = totalMilliSeconds;
    highScore[currentLevel].moves = +movesElem.textContent;

    highScoreTime.textContent = `${timeElem[0].textContent}:${timeElem[1].textContent}:${timeElem[2].textContent}`;
    highScoreMoves.textContent = highScore[currentLevel].moves;

    animate(highScoreElem, "dance");
    sessionStorage.setItem("highscore", JSON.stringify(highScore));
  }
}
