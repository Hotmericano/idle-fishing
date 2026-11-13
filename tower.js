// ============================================================
// 🗼 무한의 탑
//    방치형 본편과 달리, 직접 타이밍을 맞춰서 낚는 모드예요.
//    막대 위를 찌가 왕복하고, 노란 구간에 있을 때 누르면 성공!
//
//    이 파일은 game.js 다음에 불러와요. 그래서 game.js에 있는
//    state, saveGame, showBanner, playAnimation, SPOTS 등을 그대로 쓸 수 있어요.
// ============================================================

// ------------------------------------------------------------
// 1. 탑 설정값
// ------------------------------------------------------------
const TOWER = {
  attemptsPerDay: 3,   // 하루 도전 횟수
  maxTension: 3,       // 실패를 몇 번 하면 물고기를 놓치는지
  pauseAfterPress: 400 // 누른 뒤 결과를 보여주려고 찌를 잠깐 멈추는 시간(밀리초)
};

// 층 정보를 계산해요. 층이 올라갈수록 찌가 빨라지고, 노란 구간이 좁아지고, 체력이 늘어요.
function getFloorInfo(floor) {
  const isBoss = floor % 10 === 0;   // 10층, 20층, 30층... 은 보스 층

  // 1~10층은 호수, 11~20층은 바다, 21층부터는 심해 물고기가 나와요
  const tier = Math.min(Math.floor((floor - 1) / 10), SPOTS.length - 1);
  const fishList = SPOTS[tier].fish;
  // 보스는 그 낚시터의 전설 물고기, 나머지 층은 흔함 → 보통 → 희귀를 돌아가며
  const fish = isBoss ? fishList[3] : fishList[(floor - 1) % 3];

  // 체력: 2에서 시작해서 5층마다 1씩 늘고, 보스는 2배
  const hp = (2 + Math.floor((floor - 1) / 5)) * (isBoss ? 2 : 1);

  // 찌 속도: 1초에 막대 길이의 몇 배만큼 움직이는지. 1층마다 5%씩 빨라져요.
  const speed = 0.7 * (1 + 0.05 * (floor - 1));

  // 노란 구간 너비: 막대 전체의 25%에서 시작해서 1층마다 5%씩 좁아져요. 최소 5%.
  // 보스 층은 20% 더 좁아요.
  const zoneWidth = Math.max(0.05, 0.25 * Math.pow(0.95, floor - 1)) * (isBoss ? 0.8 : 1);

  return { floor, isBoss, fish, hp, speed, zoneWidth };
}

// ------------------------------------------------------------
// 2. 하루 도전 횟수
// ------------------------------------------------------------

// 오늘 날짜를 "2026-11-13" 같은 글자로 만들어요
function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// 날짜가 바뀌었으면 도전 횟수를 다시 채워줘요
function refreshDailyAttempts() {
  const today = todayString();
  if (state.tower.lastDay !== today) {
    state.tower.lastDay = today;
    state.tower.attemptsLeft = TOWER.attemptsPerDay;
  }
}

// ------------------------------------------------------------
// 3. 화면 요소
// ------------------------------------------------------------
const towerPopup = document.getElementById("tower");
const towerPlay = document.getElementById("tower-play");
const towerResult = document.getElementById("tower-result");
const towerBox = document.getElementById("tower-box");
const catchBar = document.getElementById("catch-bar");
const catchZone = document.getElementById("catch-zone");
const catchPointer = document.getElementById("catch-pointer");
const towerMessage = document.getElementById("tower-message");
const towerFish = document.getElementById("tower-fish");

// 맞았을 때 움찔하는 애니메이션(hurt)이 끝나면 클래스를 떼서, 다시 몸부림(swim)으로 돌아가게 해요
towerFish.addEventListener("animationend", (event) => {
  if (event.animationName === "hurt") {
    towerFish.classList.remove("hurt");
  }
});

// ------------------------------------------------------------
// 4. 도전 한 판의 상태
//    이건 저장하지 않아요. 도전 중에 창을 닫으면 그 도전은 끝난 걸로 쳐요.
// ------------------------------------------------------------
let run = null;

function startRun() {
  refreshDailyAttempts();
  if (state.tower.attemptsLeft <= 0) {
    return;
  }
  state.tower.attemptsLeft -= 1;   // 시작할 때 도전권을 써요
  saveGame();

  run = {
    active: true,
    floor: 1,
    info: null,
    hp: 0,
    tension: 0,
    pos: 0,             // 찌 위치 (0 = 왼쪽 끝, 1 = 오른쪽 끝)
    dir: 1,             // 움직이는 방향 (1 = 오른쪽, -1 = 왼쪽)
    zoneStart: 0,       // 노란 구간이 시작하는 위치
    frozenUntil: 0,     // 이 시각까지는 찌가 멈춰 있어요
    lastFrame: performance.now(),
  };

  towerPlay.classList.remove("hidden");
  towerResult.classList.add("hidden");
  towerPopup.classList.remove("hidden");
  setupFloor(1);
  requestAnimationFrame(towerLoop);
}

function setupFloor(floor) {
  run.floor = floor;
  run.info = getFloorInfo(floor);
  run.hp = run.info.hp;
  run.tension = 0;
  run.pos = 0;
  run.dir = 1;
  placeZone();

  towerBox.classList.toggle("boss", run.info.isBoss);
  towerMessage.textContent = run.info.isBoss
    ? "👑 보스 층! 구간이 더 좁아요"
    : "노란 구간에서 스페이스바(또는 버튼)를 누르세요";
  renderTower();
}

// 노란 구간을 막대 위 아무 곳에나 새로 놓아요. 리듬만으로 맞추지 못하게 하려고요.
function placeZone() {
  run.zoneStart = Math.random() * (1 - run.info.zoneWidth);
  catchZone.style.left = (run.zoneStart * 100) + "%";
  catchZone.style.width = (run.info.zoneWidth * 100) + "%";
}

// ------------------------------------------------------------
// 5. 애니메이션 루프
//    requestAnimationFrame은 "화면을 새로 그릴 때마다(보통 1초에 60번) 이 함수를 불러줘"라는 뜻이에요.
//    setInterval보다 움직임이 훨씬 부드러워서, 직접 조작하는 게임에는 이걸 써요.
// ------------------------------------------------------------
function towerLoop(now) {
  if (run === null || !run.active) {
    return;   // 도전이 끝났으면 루프도 멈춰요
  }

  const dt = (now - run.lastFrame) / 1000;
  run.lastFrame = now;

  if (now >= run.frozenUntil) {
    run.pos += run.dir * run.info.speed * dt;
    // 벽에 닿으면 튕겨서 반대로 (넘어간 만큼 되돌려 놓아요)
    if (run.pos > 1) {
      run.pos = 2 - run.pos;
      run.dir = -1;
    }
    if (run.pos < 0) {
      run.pos = -run.pos;
      run.dir = 1;
    }
  }

  catchPointer.style.left = (run.pos * 100) + "%";
  requestAnimationFrame(towerLoop);
}

// ------------------------------------------------------------
// 6. 낚아채기 (스페이스바 또는 버튼)
// ------------------------------------------------------------
function tryCatch() {
  // 마우스로 누른 버튼에 "포커스"가 남아 있으면, 다음에 스페이스바를 눌렀을 때
  // 브라우저가 그 버튼을 한 번 더 눌러버려요. 포커스를 풀어서 두 번 처리되는 걸 막아요.
  if (document.activeElement) {
    document.activeElement.blur();
  }
  const now = performance.now();
  if (run === null || !run.active || now < run.frozenUntil) {
    return;   // 도전 중이 아니거나, 결과를 보여주는 중이면 무시
  }
  run.frozenUntil = now + TOWER.pauseAfterPress;

  const zoneEnd = run.zoneStart + run.info.zoneWidth;
  const inZone = run.pos >= run.zoneStart && run.pos <= zoneEnd;

  if (inZone) {
    run.hp -= 1;
    playAnimation(catchBar, "hit");
    playAnimation(towerFish, "hurt");
    if (run.hp <= 0) {
      floorCleared();
      return;
    }
    towerMessage.textContent = "✨ 성공! 물고기가 지쳐가요";
    placeZone();
  } else {
    run.tension += 1;
    playAnimation(catchBar, "miss");
    if (run.tension >= TOWER.maxTension) {
      endRun(`💢 줄이 끊어졌어요! ${run.info.fish.emoji} ${run.info.fish.name}을(를) 놓쳤어요`);
      return;
    }
    towerMessage.textContent = "💢 빗나갔어요! 줄이 팽팽해져요";
  }
  renderTower();
}

function floorCleared() {
  const floor = run.floor;
  let text = `🎉 ${floor}층 돌파!`;
  if (floor > state.tower.best) {
    state.tower.best = floor;   // 최고 기록 갱신 → 본편 수입 보너스도 바로 올라가요
    text += " (최고 기록!)";
    saveGame();
  }
  towerMessage.textContent = text;
  run.frozenUntil = performance.now() + 900;
  renderTower();
  if (run.info.isBoss) {
    showBanner(`👑 ${floor}층 보스 ${run.info.fish.emoji} ${run.info.fish.name} 격파!`, "legendary");
  }
  setTimeout(() => {
    if (run !== null && run.active) {
      setupFloor(floor + 1);
    }
  }, 900);
}

function endRun(reason) {
  run.active = false;
  const cleared = run.floor - 1;
  document.getElementById("tower-result-text").innerHTML =
    `${reason}<br><br>이번 기록: <b>${cleared}층</b> 돌파<br>`
    + `최고 기록: <b>${state.tower.best}층</b> (본편 수입 +${Math.round(TOWER_BONUS * state.tower.best * 100)}%)<br>`
    + `오늘 남은 도전: ${state.tower.attemptsLeft}회`;
  towerPlay.classList.add("hidden");
  towerResult.classList.remove("hidden");
  saveGame();
}

// ------------------------------------------------------------
// 7. 화면 그리기
// ------------------------------------------------------------
function renderTower() {
  const info = run.info;
  document.getElementById("tower-floor").textContent = `🗼 ${info.floor}층${info.isBoss ? " 👑" : ""}`;
  towerFish.textContent = info.fish.emoji;
  document.getElementById("tower-fish-name").textContent = info.fish.name;
  document.getElementById("tower-hp-fill").style.width = (run.hp / info.hp * 100) + "%";
  document.getElementById("tower-hp-text").textContent = `체력 ${run.hp} / ${info.hp}`;
  // 긴장도: 실패한 횟수만큼 ●, 남은 만큼 ○
  document.getElementById("tower-tension").textContent =
    "🧵 줄 긴장도 " + "●".repeat(run.tension) + "○".repeat(TOWER.maxTension - run.tension);
}

// 본편 화면의 탑 입구 카드
function renderTowerEntry() {
  refreshDailyAttempts();
  document.getElementById("tower-best").textContent = state.tower.best;
  document.getElementById("tower-bonus").textContent = Math.round(TOWER_BONUS * state.tower.best * 100);
  const openButton = document.getElementById("tower-open");
  openButton.textContent = state.tower.attemptsLeft > 0
    ? `도전 (${state.tower.attemptsLeft}/${TOWER.attemptsPerDay})`
    : "내일 다시";
  openButton.disabled = state.tower.attemptsLeft <= 0;
}

// ------------------------------------------------------------
// 8. 버튼과 키보드 연결
// ------------------------------------------------------------
document.getElementById("tower-open").addEventListener("click", startRun);
document.getElementById("catch-button").addEventListener("click", tryCatch);
document.getElementById("tower-quit").addEventListener("click", () => {
  if (run !== null && run.active) {
    endRun("🏳️ 도전을 포기했어요");
  }
});
document.getElementById("tower-close").addEventListener("click", () => {
  towerPopup.classList.add("hidden");
  run = null;
});

document.addEventListener("keydown", (event) => {
  if (event.code !== "Space" || run === null || !run.active) {
    return;
  }
  event.preventDefault();   // 스페이스바를 누르면 페이지가 스크롤되는 걸 막아요
  if (!event.repeat) {      // 꾹 누르고 있으면 계속 눌린 걸로 치지 않게
    tryCatch();
  }
});

renderTowerEntry();
setInterval(renderTowerEntry, 1000);   // 자정이 지나면 도전 횟수가 채워진 게 보이도록
