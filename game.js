// ============================================================
// 1. 게임 데이터
//    "게임에 무엇이 있는지"는 전부 여기에 목록으로 적어요.
//    물고기나 낚시터를 추가하고 싶으면 이 부분만 고치면 돼요.
// ============================================================

// 등급: weight(가중치)가 클수록 잘 잡혀요. 70 : 22 : 7 : 1 → 전설은 100마리 중 1마리꼴
const RARITIES = {
  common:    { name: "흔함", weight: 70, color: "#666666" },
  uncommon:  { name: "보통", weight: 22, color: "#2a8a3a" },
  rare:      { name: "희귀", weight: 7,  color: "#2a62c9" },
  legendary: { name: "전설", weight: 1,  color: "#d48a00" },
};

// 낚시터와 그곳에서 잡히는 물고기
const SPOTS = [
  {
    id: "lake", emoji: "🏞️", name: "호수", unlockCost: 0,
    fish: [
      { id: "crucian",  emoji: "🐟", name: "붕어",      rarity: "common",    price: 1 },
      { id: "carp",     emoji: "🐠", name: "잉어",      rarity: "uncommon",  price: 3 },
      { id: "turtle",   emoji: "🐢", name: "자라",      rarity: "rare",      price: 10 },
      { id: "goldcarp", emoji: "🐉", name: "황금 잉어", rarity: "legendary", price: 60 },
    ],
  },
  {
    id: "sea", emoji: "🌊", name: "바다", unlockCost: 1000,
    fish: [
      { id: "mackerel", emoji: "🐟", name: "고등어",   rarity: "common",    price: 8 },
      { id: "crab",     emoji: "🦀", name: "대게",     rarity: "uncommon",  price: 25 },
      { id: "octopus",  emoji: "🐙", name: "문어",     rarity: "rare",      price: 80 },
      { id: "shark",    emoji: "🦈", name: "백상아리", rarity: "legendary", price: 500 },
    ],
  },
  {
    id: "deep", emoji: "🌌", name: "심해", unlockCost: 50000,
    fish: [
      { id: "shrimp",   emoji: "🦐", name: "심해 새우", rarity: "common",    price: 60 },
      { id: "angler",   emoji: "🐡", name: "아귀",      rarity: "uncommon",  price: 180 },
      { id: "nautilus", emoji: "🐚", name: "앵무조개",  rarity: "rare",      price: 600 },
      { id: "kraken",   emoji: "🦑", name: "크라켄",    rarity: "legendary", price: 4000 },
    ],
  },
];

// 업그레이드
//    baseCost: 처음 가격 / growth: 살 때마다 가격이 몇 배가 되는지
const UPGRADES = [
  { id: "bait", emoji: "🪱", name: "미끼",   desc: "물고기 가격 +50%",        baseCost: 5,  growth: 1.15 },
  { id: "rod",  emoji: "🎣", name: "낚싯대", desc: "낚시 속도 +20%",          baseCost: 10, growth: 1.15 },
  { id: "crew", emoji: "🧑‍✈️", name: "선원",   desc: "한 번에 잡는 물고기 +1", baseCost: 50, growth: 1.6  },
];

// 모든 물고기를 한 줄로 펼친 목록 (도감에서 써요)
const ALL_FISH = SPOTS.flatMap((spot) => spot.fish);

// ============================================================
// 2. 게임 상태
//    게임에서 변하는 값을 전부 이 상자(객체) 하나에 모아둬요.
// ============================================================
const state = {
  gold: 0,
  fishCaught: 0,
  progress: 0,              // 지금 낚시가 얼마나 진행됐는지 (0 ~ 1)
  levels: {                 // 업그레이드별 레벨
    bait: 0,
    rod: 0,
    crew: 0,
  },
  spot: "lake",             // 지금 낚시 중인 낚시터
  unlockedSpots: ["lake"],  // 열어둔 낚시터 목록
  dex: {},                  // 도감: { 물고기id: 잡은 마릿수 }
};

// ============================================================
// 2-1. 저장하기 / 불러오기
//    localStorage는 브라우저 안에 있는 작은 "메모장"이에요.
//    글자(문자열)만 저장할 수 있어서, state 객체를 JSON이라는 글자 형식으로 바꿔서 넣어요.
// ============================================================
const SAVE_KEY = "idle-fishing-save";   // 메모장에서 우리 게임 데이터를 찾을 때 쓰는 이름
let isResetting = false;                // 초기화 중에는 저장하지 않으려고 쓰는 표시

const MAX_OFFLINE_SECONDS = 12 * 60 * 60;   // 오프라인 보상은 최대 12시간까지만 쌓여요
let offlineSeconds = 0;                     // 불러올 때 계산한 "꺼져 있던 시간(초)"
let offlineWasCapped = false;               // 12시간을 넘겨서 잘렸는지

function saveGame() {
  if (isResetting) {
    return;
  }
  const saveData = {
    version: 2,             // 5단계에서 낚시터/도감이 생겨서 2로 올렸어요
    savedAt: Date.now(),    // 언제 저장했는지 (오프라인 보상 계산에 써요)
    state: state,
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));   // 객체 → 글자
}

function loadGame() {
  const text = localStorage.getItem(SAVE_KEY);
  if (text === null) {
    return;   // 저장된 게 없으면 (처음 하는 사람) 그냥 새 게임
  }

  try {
    const saveData = JSON.parse(text);   // 글자 → 객체
    const saved = saveData.state;

    state.gold = saved.gold;
    state.fishCaught = saved.fishCaught;
    state.progress = saved.progress;
    // levels, dex는 하나씩 덮어써요. 옛날 세이브에 없는 값은 기본값이 그대로 남아요.
    Object.assign(state.levels, saved.levels);
    Object.assign(state.dex, saved.dex);

    // 1~4단계 때 만든 세이브(version 1)에는 낚시터 정보가 없어요.
    // 있을 때만 덮어쓰면, 옛날 세이브는 자연스럽게 "호수에서 시작"이 돼요.
    if (Array.isArray(saved.unlockedSpots)) {
      state.unlockedSpots = saved.unlockedSpots;
    }
    if (SPOTS.some((spot) => spot.id === saved.spot)) {
      state.spot = saved.spot;
    }

    // 꺼져 있던 시간 = 지금 시각 - 마지막으로 저장한 시각
    // Math.max(0, ...): PC 시계가 뒤로 돌아가 있어도 음수가 되지 않게 막아요
    const awaySeconds = Math.max(0, (Date.now() - saveData.savedAt) / 1000) || 0;
    offlineWasCapped = awaySeconds > MAX_OFFLINE_SECONDS;
    offlineSeconds = Math.min(awaySeconds, MAX_OFFLINE_SECONDS);
  } catch (error) {
    // 저장 데이터가 깨져 있으면 게임이 멈추지 않게 새 게임으로 시작해요
    console.warn("저장 데이터를 불러오지 못했어요:", error);
  }
}

function resetGame() {
  if (!confirm("정말 처음부터 다시 시작할까요? 모든 진행 상황이 사라져요.")) {
    return;
  }
  isResetting = true;
  localStorage.removeItem(SAVE_KEY);
  location.reload();   // 페이지 새로고침 → 빈 상태로 시작
}

loadGame();   // 게임이 켜지자마자 저장된 데이터를 불러와요

// ============================================================
// 3. 능력치 계산
//    레벨을 넣으면 능력치가 나오는 "공식"이에요.
// ============================================================
function getCatchTime() {
  // 기본 3초. 낚싯대 레벨마다 속도가 20%씩 빨라져요.
  return 3 / (1 + 0.2 * state.levels.rod);
}

function getPriceMultiplier() {
  // 미끼 레벨마다 물고기 가격이 50%씩 올라가요. (Lv.2 → 2배)
  return 1 + 0.5 * state.levels.bait;
}

function getFishPerCatch() {
  return 1 + state.levels.crew;
}

function getCurrentSpot() {
  return SPOTS.find((spot) => spot.id === state.spot);
}

// 한 낚시터의 등급 가중치를 전부 더한 값 (지금은 어디든 70+22+7+1 = 100)
function getTotalWeight(spot) {
  let total = 0;
  for (const fish of spot.fish) {
    total += RARITIES[fish.rarity].weight;
  }
  return total;
}

// 기댓값: "물고기 한 마리를 잡으면 평균적으로 얼마를 버는가"
//   = (각 물고기 가격 × 그 물고기가 잡힐 확률)을 전부 더한 값
function getExpectedFishPrice(spot) {
  const total = getTotalWeight(spot);
  let sum = 0;
  for (const fish of spot.fish) {
    sum += fish.price * (RARITIES[fish.rarity].weight / total);
  }
  return sum;
}

function getGoldPerSecond() {
  const spot = getCurrentSpot();
  return getExpectedFishPrice(spot) * getPriceMultiplier() * getFishPerCatch() / getCatchTime();
}

// 업그레이드 가격 = 처음 가격 × (growth의 레벨 제곱)
function getCost(upgrade) {
  const level = state.levels[upgrade.id];
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.growth, level));
}

// ============================================================
// 4. 도우미 함수
// ============================================================

// 가중치 뽑기: 낚시터의 물고기 중 하나를 등급 확률에 맞춰 뽑아요.
// 원리: 0 ~ 100 사이 숫자 하나를 무작위로 고르고,
//       붕어 칸(0~70), 잉어 칸(70~92), 자라 칸(92~99), 황금 잉어 칸(99~100) 중 어디에 떨어졌는지 봐요.
function rollFish(spot) {
  let r = Math.random() * getTotalWeight(spot);
  for (const fish of spot.fish) {
    r -= RARITIES[fish.rarity].weight;
    if (r < 0) {
      return fish;
    }
  }
  return spot.fish[0];   // 혹시 모를 계산 오차 대비
}

// 숫자를 1,234,567처럼 쉼표를 넣어 보여줘요
function formatNumber(n) {
  return Math.floor(n).toLocaleString("ko-KR");
}

// 초를 "3시간 12분" 같은 글자로 바꿔요
function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}시간 ${m}분`;
  if (m > 0) return `${m}분`;
  return `${Math.floor(seconds)}초`;
}

// ============================================================
// 5. 화면 요소 찾아두기
// ============================================================
const goldText = document.getElementById("gold");
const fishCountText = document.getElementById("fish-count");
const gpsText = document.getElementById("gps");
const spotNameText = document.getElementById("spot-name");
const lastFishText = document.getElementById("last-fish");
const barFill = document.getElementById("bar-fill");
const logText = document.getElementById("log");
const dexCountText = document.getElementById("dex-count");

// ============================================================
// 6. 행동: 물고기 잡기, 업그레이드 사기, 낚시터 열기
// ============================================================

// 물고기를 count마리 받아서 도감에 기록하고 팔아요. 처음 잡은 물고기면 true를 돌려줘요.
function addFish(fish, count) {
  const isNew = !state.dex[fish.id];
  state.dex[fish.id] = (state.dex[fish.id] || 0) + count;
  state.fishCaught += count;
  const gold = fish.price * count * getPriceMultiplier();
  state.gold += gold;
  return { gold, isNew };
}

function catchFish() {
  const spot = getCurrentSpot();
  let totalGold = 0;
  let best = null;      // 이번에 잡은 것 중 제일 비싼 물고기 (화면에 보여줄 용도)
  let newFish = null;   // 이번에 새로 도감에 등록된 물고기

  for (let i = 0; i < getFishPerCatch(); i++) {
    const fish = rollFish(spot);
    const result = addFish(fish, 1);
    totalGold += result.gold;
    if (best === null || fish.price > best.price) {
      best = fish;
    }
    if (result.isNew) {
      newFish = fish;
    }
  }

  const count = getFishPerCatch();
  const rarity = RARITIES[best.rarity];
  const others = count > 1 ? ` 외 ${count - 1}마리` : "";
  lastFishText.textContent = best.emoji;

  if (newFish) {
    logText.textContent = `📖 새로운 물고기 발견! ${newFish.emoji} ${newFish.name} (${RARITIES[newFish.rarity].name})`;
    logText.style.color = RARITIES[newFish.rarity].color;
  } else {
    logText.textContent = `${best.emoji} ${best.name}(${rarity.name})${others}를 낚았어요! (+${formatNumber(totalGold)} 골드)`;
    logText.style.color = rarity.color;
  }
}

// 오프라인 보상: 꺼져 있던 시간 동안 잡았을 물고기를 한 번에 계산해요.
// 수천 마리를 하나하나 뽑지 않고 "기댓값"으로 나눠줘요.
//   예: 1000마리를 잡았다면 붕어 700, 잉어 220, 자라 70, 황금 잉어 10
function giveOfflineReward(seconds) {
  const totalProgress = state.progress + seconds / getCatchTime();
  const catches = Math.floor(totalProgress);    // 완성된 낚시 횟수
  state.progress = totalProgress - catches;     // 남은 진행도는 이어서

  const spot = getCurrentSpot();
  const totalFish = catches * getFishPerCatch();
  const totalWeight = getTotalWeight(spot);

  let gold = 0;
  let given = 0;
  const newFish = [];

  for (const fish of spot.fish) {
    const count = Math.floor(totalFish * RARITIES[fish.rarity].weight / totalWeight);
    if (count > 0) {
      const result = addFish(fish, count);
      gold += result.gold;
      given += count;
      if (result.isNew) newFish.push(fish);
    }
  }
  // Math.floor로 내리면서 생긴 자투리 마릿수는 흔한 물고기(목록 첫 번째)로 줘요
  const leftover = totalFish - given;
  if (leftover > 0) {
    const result = addFish(spot.fish[0], leftover);
    gold += result.gold;
    if (result.isNew) newFish.push(spot.fish[0]);
  }

  return { fish: totalFish, gold, newFish };
}

function buyUpgrade(upgrade) {
  const cost = getCost(upgrade);
  if (state.gold < cost) {
    return;   // 돈이 모자라면 아무것도 안 하고 끝
  }
  state.gold -= cost;
  state.levels[upgrade.id] += 1;
  logText.textContent = `${upgrade.emoji} ${upgrade.name} 레벨 업! (Lv.${state.levels[upgrade.id]})`;
  logText.style.color = "";
  render();
}

function clickSpot(spot) {
  if (state.unlockedSpots.includes(spot.id)) {
    // 이미 열린 낚시터 → 그곳으로 이동
    state.spot = spot.id;
  } else {
    // 잠긴 낚시터 → 돈이 있으면 열고 바로 이동
    if (state.gold < spot.unlockCost) {
      return;
    }
    state.gold -= spot.unlockCost;
    state.unlockedSpots.push(spot.id);
    state.spot = spot.id;
    logText.textContent = `${spot.emoji} 새로운 낚시터 '${spot.name}'을(를) 열었어요!`;
    logText.style.color = "";
  }
  state.progress = 0;   // 자리를 옮기면 낚싯대를 다시 던져요
  render();
}

// ============================================================
// 7. 버튼 만들기 (상점, 낚시터, 도감)
//    목록을 하나씩 돌면서 버튼을 만들어 붙여요.
//    글자 칸(span)은 미리 만들어두고, render()에서 글자만 바꿔요.
// ============================================================

// 작은 도우미: 클래스 이름이 붙은 span을 만들어요
function makeSpan(className) {
  const span = document.createElement("span");
  span.className = className;
  return span;
}

// 상점
const shopButtons = {};
for (const upgrade of UPGRADES) {
  const button = document.createElement("button");
  button.className = "upgrade";
  const name = makeSpan("name");
  const desc = makeSpan("desc");
  desc.textContent = upgrade.desc;
  const cost = makeSpan("cost");
  button.append(name, desc, cost);
  button.addEventListener("click", () => buyUpgrade(upgrade));
  document.getElementById("shop").appendChild(button);
  shopButtons[upgrade.id] = { button, name, cost };
}

// 낚시터
const spotButtons = {};
for (const spot of SPOTS) {
  const button = document.createElement("button");
  button.className = "spot";
  button.addEventListener("click", () => clickSpot(spot));
  document.getElementById("spots").appendChild(button);
  spotButtons[spot.id] = button;
}

// 도감
const dexCells = {};
for (const fish of ALL_FISH) {
  const cell = document.createElement("div");
  cell.className = "dex-cell";
  const emoji = makeSpan("dex-emoji");
  const name = makeSpan("dex-name");
  const count = makeSpan("dex-count");
  cell.append(emoji, name, count);
  document.getElementById("dex").appendChild(cell);
  dexCells[fish.id] = { cell, emoji, name, count };
}

// ============================================================
// 8. 화면 그리기
//    state에 들어있는 값을 화면에 그대로 보여줘요.
// ============================================================
function render() {
  const currentSpot = getCurrentSpot();

  goldText.textContent = formatNumber(state.gold);
  fishCountText.textContent = formatNumber(state.fishCaught);
  gpsText.textContent = getGoldPerSecond().toFixed(1);   // 소수점 한 자리까지
  spotNameText.textContent = `${currentSpot.emoji} ${currentSpot.name}`;
  barFill.style.width = (state.progress * 100) + "%";

  // 상점
  for (const upgrade of UPGRADES) {
    const ui = shopButtons[upgrade.id];
    const cost = getCost(upgrade);
    ui.name.textContent = `${upgrade.emoji} ${upgrade.name} Lv.${state.levels[upgrade.id]}`;
    ui.cost.textContent = `💰 ${formatNumber(cost)}`;
    ui.button.disabled = state.gold < cost;   // 돈이 모자라면 버튼을 회색으로 잠가요
  }

  // 낚시터
  for (const spot of SPOTS) {
    const button = spotButtons[spot.id];
    const unlocked = state.unlockedSpots.includes(spot.id);
    if (unlocked) {
      button.textContent = `${spot.emoji} ${spot.name}`;
      button.disabled = false;
    } else {
      button.textContent = `🔒 ${spot.name} 💰${formatNumber(spot.unlockCost)}`;
      button.disabled = state.gold < spot.unlockCost;
    }
    button.classList.toggle("active", spot.id === state.spot);   // 지금 있는 곳은 강조
  }

  // 도감
  let found = 0;
  for (const fish of ALL_FISH) {
    const ui = dexCells[fish.id];
    const caught = state.dex[fish.id] || 0;
    if (caught > 0) {
      found += 1;
      ui.emoji.textContent = fish.emoji;
      ui.name.textContent = fish.name;
      ui.count.textContent = `${formatNumber(caught)}마리`;
      ui.cell.style.borderColor = RARITIES[fish.rarity].color;
    } else {
      ui.emoji.textContent = "❓";
      ui.name.textContent = "???";
      ui.count.textContent = "";
      ui.cell.style.borderColor = "";
    }
  }
  dexCountText.textContent = `${found} / ${ALL_FISH.length}`;
}

// ============================================================
// 9. 게임 루프
//    0.1초마다 update()가 실행되면서 시간이 흐르게 만들어요.
// ============================================================
let lastTime = Date.now();

function update() {
  const now = Date.now();
  const dt = (now - lastTime) / 1000;   // 지난번 이후 흐른 시간(초)
  lastTime = now;

  state.progress += dt / getCatchTime();

  // 탭을 내려둬서 한 번에 시간이 많이 흘렀어도, 그동안 잡았어야 할 물고기를 전부 챙겨줘요.
  while (state.progress >= 1) {
    state.progress -= 1;
    catchFish();
  }

  render();
}

setInterval(update, 100);
render();

// ============================================================
// 10. 자동 저장
//    5초마다 저장하고, 탭을 닫거나 다른 탭으로 넘어갈 때도 한 번 더 저장해요.
// ============================================================
setInterval(saveGame, 5000);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    saveGame();
  }
});
window.addEventListener("beforeunload", saveGame);

document.getElementById("reset").addEventListener("click", resetGame);

// ============================================================
// 11. 오프라인 보상 지급
//    보상은 항상 주지만, 보상 창은 1분 이상 비웠을 때만 띄워요.
// ============================================================
const popup = document.getElementById("offline-popup");
const reward = giveOfflineReward(offlineSeconds);

if (offlineSeconds >= 60) {
  const spot = getCurrentSpot();
  let message = `${spot.emoji} ${spot.name}에서 ${formatDuration(offlineSeconds)} 동안<br>`
    + `물고기 ${formatNumber(reward.fish)}마리를 낚아서<br>💰 ${formatNumber(reward.gold)} 골드를 벌었어요!`;
  if (reward.newFish.length > 0) {
    const names = reward.newFish.map((fish) => `${fish.emoji} ${fish.name}`).join(", ");
    message += `<br>📖 새로 발견: ${names}`;
  }
  if (offlineWasCapped) {
    message += `<br><small>(오프라인 보상은 최대 12시간까지 쌓여요)</small>`;
  }
  document.getElementById("offline-text").innerHTML = message;
  popup.classList.remove("hidden");
  saveGame();   // 받은 보상을 바로 저장해서, 새로고침으로 두 번 받는 일을 막아요
  render();
}

document.getElementById("offline-ok").addEventListener("click", () => {
  popup.classList.add("hidden");
});
