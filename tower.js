// ============================================================
// 🗼 무한의 탑
//    방치형 본편과 달리, 직접 타이밍을 맞춰서 낚는 모드예요.
//
//    [기본 모드] 막대 위를 찌가 왕복하고, 노란 구간에 있을 때 누르면 성공!
//    [폭주 모드] 보스 체력이 절반이 되면 보호막을 두르고 돌아다녀요.
//               줄어드는 노란 원이 파란 보호막 원에 겹칠 때 눌러야 보호막이 깎여요.
//
//    이 파일은 game.js 다음에 불러와요. 그래서 game.js에 있는
//    state, saveGame, showBanner, playAnimation, SPOTS 등을 그대로 쓸 수 있어요.
// ============================================================

// ------------------------------------------------------------
// 1. 탑 설정값
// ------------------------------------------------------------
const TOWER = {
  attemptsPerDay: 3,    // 하루 도전 횟수
  baseTension: 3,       // 실패를 몇 번 하면 물고기를 놓치는지 (튼튼한 낚싯줄로 늘어나요)
  pauseAfterPress: 400, // 누른 뒤 결과를 보여주려고 잠깐 멈추는 시간(밀리초)
  checkpointEvery: 10,  // 몇 층마다 체크포인트가 생기는지 (= 보스 층)
};

// 🧪 테스트 모드: 주소 뒤에 ?test 를 붙이면 켜져요.
//    예) https://hotmericano.github.io/idle-fishing/?test
//    location.search는 주소의 "?" 뒷부분이고, URLSearchParams는 그걸 쉽게 읽게 해주는 도구예요.
//    테스트 모드에서는 도전 횟수가 줄지 않고, 시작 층을 고를 수 있고, 기록은 저장하지 않아요.
const TEST_MODE = new URLSearchParams(location.search).has("test");

// 줄 긴장도 한도: 기본 3 + 튼튼한 낚싯줄 레벨
function getMaxTension() {
  return TOWER.baseTension + state.pearlLevels.line;
}

// 층 정보를 계산해요. 층이 올라갈수록 찌가 빨라지고, 노란 구간이 좁아지고, 체력이 늘어요.
//
// 난이도의 핵심은 "찌가 노란 구간 안에 머무는 시간" = 구간 너비 ÷ 찌 속도 예요.
//   (처음 버전은 30층에서 이 시간이 0.03초밖에 안 돼서 너무 어려웠어요)
//   지금 공식 기준: 1층 0.36초 → 10층 0.23초 → 20층 0.15초 → 30층 0.1초 → 50층 0.05초
function getFloorInfo(floor) {
  const isBoss = floor % TOWER.checkpointEvery === 0;   // 10층, 20층, 30층... 은 보스 층
  const bossLevel = floor / TOWER.checkpointEvery;       // 10층 보스 = 1, 20층 보스 = 2 ...

  // 1~10층은 호수, 11~20층은 바다, 21층부터는 심해 물고기가 나와요
  const tier = Math.min(Math.floor((floor - 1) / 10), SPOTS.length - 1);
  const fishList = SPOTS[tier].fish;
  // 보스는 그 낚시터의 전설 물고기, 나머지 층은 흔함 → 보통 → 희귀를 돌아가며
  const fish = isBoss ? fishList[3] : fishList[(floor - 1) % 3];

  // 체력: 2에서 시작해서 8층마다 1씩 늘고, 보스는 2배
  const hp = (2 + Math.floor((floor - 1) / 8)) * (isBoss ? 2 : 1);

  // 찌 속도: 1초에 막대 길이의 몇 배만큼 움직이는지. 1층마다 2.5%씩 빨라지고, 최대 2배(1.4)까지만.
  // 🪨 묵직한 추: 레벨마다 3%씩 느려져요.
  const baseSpeed = Math.min(1.4, 0.7 * (1 + 0.025 * (floor - 1)));
  const speed = baseSpeed * (1 - 0.03 * state.pearlLevels.sinker);

  // 노란 구간 너비: 막대 전체의 25%에서 시작해서 1층마다 2.5%씩 좁아져요. 최소 6%.
  // 보스 층은 20% 더 좁아요. 🎯 매의 눈: 레벨마다 8%씩 넓어져요.
  const baseZone = Math.max(0.06, 0.25 * Math.pow(0.975, floor - 1)) * (isBoss ? 0.8 : 1);
  const zoneWidth = Math.min(0.5, baseZone * (1 + 0.08 * state.pearlLevels.eye));

  const info = { floor, isBoss, fish, hp, speed, zoneWidth };

  if (isBoss) {
    // 폭주 모드 설정
    info.shield = Math.min(2 + bossLevel, 8);                                // 보호막 횟수: 3, 4, 5 ... 최대 8
    info.ringDuration = Math.max(0.8, 1.4 - 0.08 * (bossLevel - 1));         // 원이 다 줄어드는 시간(초)
    // 판정 여유 (클수록 쉬움). ⚡ 반사 신경: 레벨마다 10%씩 넓어져요.
    info.ringTolerance = Math.max(0.1, 0.16 - 0.015 * (bossLevel - 1)) * (1 + 0.1 * state.pearlLevels.reflex);
  }
  return info;
}

// ------------------------------------------------------------
// 2. 하루 도전 횟수, 체크포인트
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

// 체크포인트 기능이 생기기 전에 이미 10층 이상 깬 사람은, 그 기록에 맞춰 체크포인트를 잡아줘요.
// 예: 최고 기록 14층 → 체크포인트 10층 → 다음 도전은 11층부터
state.tower.checkpoint = Math.max(
  state.tower.checkpoint,
  Math.floor(state.tower.best / TOWER.checkpointEvery) * TOWER.checkpointEvery
);

function getStartFloor() {
  return state.tower.checkpoint + 1;
}

// ------------------------------------------------------------
// 3. 화면 요소
// ------------------------------------------------------------
const towerPopup = document.getElementById("tower");
const towerPlay = document.getElementById("tower-play");
const towerResult = document.getElementById("tower-result");
const towerBox = document.getElementById("tower-box");
const towerFish = document.getElementById("tower-fish");
const towerMessage = document.getElementById("tower-message");
const catchBar = document.getElementById("catch-bar");
const catchZone = document.getElementById("catch-zone");
const catchPointer = document.getElementById("catch-pointer");
const rageArena = document.getElementById("rage-arena");
const rageFish = document.getElementById("rage-fish");
const towerFishImg = document.getElementById("tower-fish-img");
const rageFishImg = document.getElementById("rage-fish-img");
const ringApproach = document.getElementById("ring-approach");
const shieldText = document.getElementById("tower-shield");

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
  let startFloor = getStartFloor();

  if (TEST_MODE) {
    // 테스트 모드: 도전권을 쓰지 않고, 입력한 층부터 시작
    startFloor = Math.max(1, Math.floor(Number(document.getElementById("tower-test-floor").value)) || 1);
  } else {
    if (state.tower.attemptsLeft <= 0) {
      return;
    }
    state.tower.attemptsLeft -= 1;   // 시작할 때 도전권을 써요
    saveGame();
  }

  run = {
    active: true,
    startFloor: startFloor,
    floor: 0,
    info: null,
    hp: 0,
    tension: 0,
    mode: "bar",        // "bar" = 기본 모드, "rage" = 보스 폭주 모드
    rageDone: false,    // 이번 보스의 폭주를 이미 이겨냈는지
    // 기본 모드용
    pos: 0,             // 찌 위치 (0 = 왼쪽 끝, 1 = 오른쪽 끝)
    dir: 1,             // 움직이는 방향 (1 = 오른쪽, -1 = 왼쪽)
    zoneStart: 0,       // 노란 구간이 시작하는 위치
    // 폭주 모드용
    shield: 0,          // 남은 보호막
    ringStart: 0,       // 이번 원이 줄어들기 시작하는 시각
    ringScale: 3,       // 지금 원 크기 (보호막 원 = 1)
    ringActive: false,  // 원이 줄어드는 중인지
    // 공통
    frozenUntil: 0,     // 이 시각까지는 입력을 받지 않아요
    lastFrame: performance.now(),
  };

  towerPlay.classList.remove("hidden");
  towerResult.classList.add("hidden");
  towerPopup.classList.remove("hidden");
  setupFloor(run.startFloor);
  requestAnimationFrame(towerLoop);
}

function setupFloor(floor) {
  run.floor = floor;
  run.info = getFloorInfo(floor);
  run.hp = run.info.hp;
  run.tension = 0;
  run.pos = 0;
  run.dir = 1;
  setMode("bar");
  run.rageDone = false;
  placeZone();

  towerBox.classList.toggle("boss", run.info.isBoss);
  towerMessage.textContent = run.info.isBoss
    ? "👑 보스 층! 체력이 절반이 되면 폭주해요"
    : "노란 구간에서 스페이스바(또는 버튼)를 누르세요";
  renderTower();
}

// 기본 모드 ↔ 폭주 모드 전환: 보여줄 것과 숨길 것을 바꿔요
function setMode(mode) {
  run.mode = mode;
  const isRage = mode === "rage";
  catchBar.classList.toggle("hidden", isRage);
  towerFish.classList.toggle("hidden", isRage);
  rageArena.classList.toggle("hidden", !isRage);
  shieldText.classList.toggle("hidden", !isRage);
  towerBox.classList.toggle("raging", isRage);
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

  if (run.mode === "bar") {
    updatePointer(now, dt);
  } else {
    updateRing(now);
  }

  requestAnimationFrame(towerLoop);
}

// 기본 모드: 찌를 좌우로 움직여요
function updatePointer(now, dt) {
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
}

// 폭주 모드: 노란 원을 줄여요
//   t = 0 일 때 크기 3배 → t = 1 일 때 크기 0.5배
//   크기가 1 근처(보호막 원과 겹칠 때)에 누르면 성공
function updateRing(now) {
  const t = (now - run.ringStart) / (run.info.ringDuration * 1000);
  if (t < 0) {
    // 아직 보스가 이동 중이라 원이 안 나왔어요
    run.ringActive = false;
    ringApproach.style.opacity = 0;
    return;
  }
  if (t >= 1) {
    // 원이 다 줄어들 때까지 안 눌렀어요 → 실패
    run.ringActive = false;
    ringApproach.style.opacity = 0;
    if (!registerMiss("⌛ 너무 늦었어요! 줄이 팽팽해져요")) {
      nextRing(300);
    }
    return;
  }
  run.ringActive = true;
  run.ringScale = 3 - 2.5 * t;
  ringApproach.style.opacity = 1;
  ringApproach.style.transform = `scale(${run.ringScale})`;
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

  if (run.mode === "rage") {
    tryBreakShield(now);
  } else {
    tryHitZone(now);
  }
}

// 기본 모드: 찌가 노란 구간 안에 있는지 확인
function tryHitZone(now) {
  run.frozenUntil = now + TOWER.pauseAfterPress;

  const zoneEnd = run.zoneStart + run.info.zoneWidth;
  const inZone = run.pos >= run.zoneStart && run.pos <= zoneEnd;

  if (!inZone) {
    registerMiss("💢 빗나갔어요! 줄이 팽팽해져요");
    return;
  }

  run.hp -= 1;
  playAnimation(catchBar, "hit");
  playAnimation(towerFish, "hurt");

  if (run.hp <= 0) {
    floorCleared();
    return;
  }
  // 보스 체력이 절반 이하가 되면 폭주! (한 번만)
  if (run.info.isBoss && !run.rageDone && run.hp <= run.info.hp / 2) {
    startRage();
    return;
  }
  towerMessage.textContent = "✨ 성공! 물고기가 지쳐가요";
  placeZone();
  renderTower();
}

// 실패 처리 (두 모드 공통). 줄이 끊어져서 도전이 끝나면 true를 돌려줘요.
function registerMiss(text) {
  run.tension += 1;
  playAnimation(run.mode === "rage" ? rageArena : catchBar, "miss");
  if (run.tension >= getMaxTension()) {
    endRun(`💢 줄이 끊어졌어요! ${run.info.fish.emoji} ${run.info.fish.name}을(를) 놓쳤어요`);
    return true;
  }
  towerMessage.textContent = text;
  renderTower();
  return false;
}

// ------------------------------------------------------------
// 7. 보스 폭주
// ------------------------------------------------------------
function startRage() {
  setMode("rage");
  run.shield = run.info.shield;
  setFishSprite(rageFishImg, run.info.fish, 3);
  showBanner(`🔥 ${run.info.fish.name} 폭주! 보호막이 생겼어요`, "legendary");
  towerMessage.textContent = "줄어드는 노란 원이 파란 보호막에 겹칠 때 누르세요!";
  run.frozenUntil = performance.now() + 900;
  nextRing(900);
  renderTower();
}

// 보스를 새 위치로 이동시키고, 도착하면 새 원을 시작해요
function nextRing(delay = 0) {
  run.ringActive = false;
  ringApproach.style.opacity = 0;
  // 경기장 안쪽 아무 곳 (가장자리에 붙지 않게 15~85%, 25~75% 사이)
  rageFish.style.left = (15 + Math.random() * 70) + "%";
  rageFish.style.top = (25 + Math.random() * 50) + "%";
  // CSS transition으로 0.35초 동안 헤엄쳐 가요. 도착한 뒤에 원이 줄어들기 시작해요.
  run.ringStart = performance.now() + delay + 350;
}

function tryBreakShield(now) {
  if (!run.ringActive) {
    return;   // 보스가 이동 중일 때 누른 건 무시
  }
  run.frozenUntil = now + 250;
  run.ringActive = false;

  // 원 크기가 1(보호막 크기)에서 얼마나 벗어났는지
  const diff = Math.abs(run.ringScale - 1);

  if (diff > run.info.ringTolerance) {
    const text = run.ringScale > 1 ? "💨 너무 빨랐어요! 줄이 팽팽해져요" : "⌛ 너무 늦었어요! 줄이 팽팽해져요";
    if (!registerMiss(text)) {
      nextRing(250);
    }
    return;
  }

  run.shield -= 1;
  playAnimation(rageArena, "shield-hit");
  if (run.shield <= 0) {
    endRage();
    return;
  }
  towerMessage.textContent = `🛡️ 보호막에 금이 갔어요! (남은 보호막 ${run.shield})`;
  nextRing(250);
  renderTower();
}

function endRage() {
  run.rageDone = true;
  setMode("bar");
  placeZone();
  run.frozenUntil = performance.now() + 700;
  towerMessage.textContent = "💥 보호막을 깨뜨렸어요! 다시 노란 구간을 노리세요";
  renderTower();
}

// ------------------------------------------------------------
// 8. 층 돌파, 도전 종료
// ------------------------------------------------------------
function floorCleared() {
  const floor = run.floor;
  let text = `🎉 ${floor}층 돌파!`;
  if (TEST_MODE) {
    text += " (🧪 테스트라 기록은 안 남아요)";
  } else if (floor > state.tower.best) {
    state.tower.best = floor;   // 최고 기록 갱신 → 본편 수입 보너스도 바로 올라가요
    text += " (최고 기록!)";
  }
  if (run.info.isBoss) {
    showBanner(`👑 ${floor}층 보스 ${run.info.fish.emoji} ${run.info.fish.name} 격파!`, "legendary");
    if (!TEST_MODE && floor > state.tower.checkpoint) {
      state.tower.checkpoint = floor;
      text += ` 🚩 다음 도전은 ${floor + 1}층부터!`;
    }
  }
  saveGame();
  towerMessage.textContent = text;
  run.frozenUntil = performance.now() + 1200;
  renderTower();
  setTimeout(() => {
    if (run !== null && run.active) {
      setupFloor(floor + 1);
    }
  }, 1200);
}

function endRun(reason) {
  run.active = false;
  const cleared = run.floor - 1;   // 실패한 층 바로 아래까지 돌파
  const thisRun = cleared >= run.startFloor
    ? `${run.startFloor}층 → <b>${cleared}층</b> 돌파`
    : `${run.startFloor}층에서 실패`;
  document.getElementById("tower-result-text").innerHTML =
    `${reason}<br><br>이번 도전: ${thisRun}<br>`
    + `최고 기록: <b>${state.tower.best}층</b> (본편 수입 +${Math.round(TOWER_BONUS * state.tower.best * 100)}%)<br>`
    + `🚩 다음 시작: ${getStartFloor()}층<br>`
    + `오늘 남은 도전: ${state.tower.attemptsLeft}회`;
  towerPlay.classList.add("hidden");
  towerResult.classList.remove("hidden");
  saveGame();
}

// ------------------------------------------------------------
// 9. 화면 그리기
// ------------------------------------------------------------
function renderTower() {
  const info = run.info;
  document.getElementById("tower-floor").textContent = `🗼 ${info.floor}층${info.isBoss ? " 👑" : ""}`;
  setFishSprite(towerFishImg, info.fish, info.isBoss ? 5 : 4);   // 보스는 더 크게
  document.getElementById("tower-fish-name").textContent =
    info.fish.name + (run.mode === "rage" ? " 🔥폭주🔥" : "");
  document.getElementById("tower-hp-fill").style.width = (run.hp / info.hp * 100) + "%";
  document.getElementById("tower-hp-text").textContent = `체력 ${run.hp} / ${info.hp}`;
  // 긴장도: 실패한 횟수만큼 ●, 남은 만큼 ○
  document.getElementById("tower-tension").textContent =
    "🧵 줄 긴장도 " + "●".repeat(run.tension) + "○".repeat(getMaxTension() - run.tension);
  if (run.mode === "rage") {
    shieldText.textContent = "🛡️ 보호막 " + "■".repeat(run.shield) + "□".repeat(info.shield - run.shield);
  }
}

// 본편 화면의 탑 입구 카드
function renderTowerEntry() {
  refreshDailyAttempts();
  document.getElementById("tower-best").textContent = state.tower.best;
  document.getElementById("tower-bonus").textContent = Math.round(TOWER_BONUS * state.tower.best * 100);
  document.getElementById("tower-start").textContent = getStartFloor();
  const openButton = document.getElementById("tower-open");
  if (TEST_MODE) {
    openButton.textContent = "🧪 테스트 도전";
    openButton.disabled = false;
    return;
  }
  openButton.textContent = state.tower.attemptsLeft > 0
    ? `도전 (${state.tower.attemptsLeft}/${TOWER.attemptsPerDay})`
    : "내일 다시";
  openButton.disabled = state.tower.attemptsLeft <= 0;
}

// ------------------------------------------------------------
// 10. 버튼과 키보드 연결
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

// 테스트 모드면 시작 층 입력 칸을 보여줘요
document.getElementById("tower-test").classList.toggle("hidden", !TEST_MODE);

renderTowerEntry();
setInterval(renderTowerEntry, 1000);   // 자정이 지나면 도전 횟수가 채워진 게 보이도록
