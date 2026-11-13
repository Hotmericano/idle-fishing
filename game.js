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
//   sprite: assets/sprites/ 안의 그림 이름
//   emoji: 글자 메시지(알림, 기록)에 쓰는 이모지
//   ※ id는 세이브(도감)에 쓰이니까 이름이 바뀌어도 그대로 둬요
const SPOTS = [
  {
    id: "lake", emoji: "🏞️", name: "호수", unlockCost: 0,
    fish: [
      { id: "crucian",  emoji: "🐟", name: "붕어",      sprite: "fish_crucian",     rarity: "common",    price: 1 },
      { id: "carp",     emoji: "🐟", name: "잉어",      sprite: "fish_carp",        rarity: "uncommon",  price: 3 },
      { id: "turtle",   emoji: "🎏", name: "비단잉어",  sprite: "fish_koi",         rarity: "rare",      price: 10 },
      { id: "goldcarp", emoji: "🌟", name: "황금 잉어", sprite: "fish_legend_gold", rarity: "legendary", price: 60 },
    ],
  },
  {
    id: "sea", emoji: "🌊", name: "바다", unlockCost: 100000,
    fish: [
      { id: "mackerel", emoji: "🐟", name: "고등어",   sprite: "fish_mackerel", rarity: "common",    price: 8 },
      { id: "crab",     emoji: "🦀", name: "대게",     sprite: "crab",          rarity: "uncommon",  price: 25 },
      { id: "octopus",  emoji: "🐙", name: "문어",     sprite: "octopus",       rarity: "rare",      price: 80 },
      { id: "shark",    emoji: "🦈", name: "백상아리", sprite: "fish_shark",    rarity: "legendary", price: 500 },
    ],
  },
  {
    id: "deep", emoji: "🌌", name: "심해", unlockCost: 20000000,
    fish: [
      { id: "shrimp",   emoji: "👻", name: "유령 해파리",   sprite: "jellyfish",           rarity: "common",    price: 60 },
      { id: "angler",   emoji: "🐡", name: "아귀",          sprite: "fish_abyss",          rarity: "uncommon",  price: 180 },
      { id: "nautilus", emoji: "🐍", name: "심해 장어",     sprite: "fish_eel",            rarity: "rare",      price: 600 },
      { id: "kraken",   emoji: "🌈", name: "오로라 물고기", sprite: "fish_legend_rainbow", rarity: "legendary", price: 4000 },
    ],
  },
];

// 업그레이드
//    baseCost: 처음 가격 / growth: 살 때마다 가격이 몇 배가 되는지
//    (밸런스: 가상 플레이어 시뮬레이션 기준 바다 약 15분, 심해 약 2시간에 열리도록 맞춘 값)
const UPGRADES = [
  { id: "bait", emoji: "🪱", sprite: "bait_worm", name: "미끼",   desc: "물고기 가격 +50%",        baseCost: 10,  growth: 1.4 },
  { id: "rod",  emoji: "🎣", sprite: "rod",       name: "낚싯대", desc: "낚시 속도 +20%",          baseCost: 15,  growth: 1.4 },
  { id: "crew", emoji: "🧑‍✈️", name: "선원",   desc: "한 번에 잡는 물고기 +1", baseCost: 100, growth: 2.5 },
];

// 진주 상점 (환생해도 사라지지 않는 영구 업그레이드)
//    maxLevel: 최대 레벨 (Infinity = 제한 없음)
const PEARL_UPGRADES = [
  { id: "net",      emoji: "💰", name: "황금 그물",   desc: "물고기 가격 영구 +25%",           baseCost: 2, growth: 1.5, maxLevel: Infinity },
  { id: "luck",     emoji: "🍀", name: "행운의 부적", desc: "희귀·전설 물고기 확률 +25%",      baseCost: 3, growth: 1.6, maxLevel: 10 },
  { id: "vacation", emoji: "🌙", name: "긴 휴가",     desc: "오프라인 보상 최대 시간 +2시간", baseCost: 2, growth: 2,   maxLevel: 6 },

  // ----- 🗼 탑 강화 (group: "tower") : 무한의 탑을 쉽게 만들어줘요. 효과는 tower.js에서 써요 -----
  { id: "eye",    group: "tower", emoji: "🎯", name: "매의 눈",       desc: "탑의 노란 구간 +8%",           baseCost: 3, growth: 1.6, maxLevel: 10 },
  { id: "sinker", group: "tower", emoji: "🪨", name: "묵직한 추",     desc: "탑의 찌 속도 -3%",             baseCost: 3, growth: 1.6, maxLevel: 10 },
  { id: "line",   group: "tower", emoji: "🧵", name: "튼튼한 낚싯줄", desc: "줄 긴장도 한도 +1 (실패 1번 더)", baseCost: 6, growth: 3,   maxLevel: 2 },
  { id: "reflex", group: "tower", emoji: "⚡", name: "반사 신경",     desc: "보스 폭주 판정 +10%",          baseCost: 3, growth: 1.7, maxLevel: 5 },
];

const DEX_BONUS = 0.05;        // 도감에 등록된 물고기 1종당 물고기 가격 +5%
const PEARL_DIVISOR = 1000000; // 진주 = √(이번 판에 번 골드 ÷ 100만)
const TOWER_BONUS = 0.02;      // 무한의 탑 최고 기록 1층당 물고기 가격 +2%

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
  dex: {},                  // 도감: { 물고기id: 잡은 마릿수 }  ← 환생해도 남아요
  runGold: 0,               // 이번 판(환생 이후)에 번 골드 총합. 진주 계산에 써요

  // ----- 여기부터는 환생해도 남는 값 -----
  pearls: 0,                // 가진 진주
  rebirths: 0,              // 환생한 횟수
  pearlLevels: {            // 진주 상점 업그레이드 레벨
    net: 0,
    luck: 0,
    vacation: 0,
    eye: 0,       // 🗼 탑 강화
    sinker: 0,
    line: 0,
    reflex: 0,
  },
  tower: {                  // 무한의 탑 (tower.js에서 써요)
    best: 0,                // 최고 기록 (돌파한 층)
    attemptsLeft: 3,        // 오늘 남은 도전 횟수
    lastDay: "",            // 도전 횟수를 마지막으로 채워준 날짜
    checkpoint: 0,          // 깬 보스 층 중 가장 높은 층. 다음 도전은 그 다음 층부터
  },
};

// ============================================================
// 2-1. 저장하기 / 불러오기
//    localStorage는 브라우저 안에 있는 작은 "메모장"이에요.
//    글자(문자열)만 저장할 수 있어서, state 객체를 JSON이라는 글자 형식으로 바꿔서 넣어요.
// ============================================================
const SAVE_KEY = "idle-fishing-save";   // 메모장에서 우리 게임 데이터를 찾을 때 쓰는 이름
let isResetting = false;                // 초기화 중에는 저장하지 않으려고 쓰는 표시

let offlineSeconds = 0;        // 불러올 때 계산한 "꺼져 있던 시간(초)"
let offlineWasCapped = false;  // 최대 시간을 넘겨서 잘렸는지

function saveGame() {
  if (isResetting) {
    return;
  }
  const saveData = {
    version: 4,             // 무한의 탑이 생겨서 4로 올렸어요
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

    // 환생 관련 값 (version 3부터). 옛날 세이브에는 없으니 없으면 0으로.
    state.runGold = saved.runGold || 0;
    state.pearls = saved.pearls || 0;
    state.rebirths = saved.rebirths || 0;
    Object.assign(state.pearlLevels, saved.pearlLevels);
    Object.assign(state.tower, saved.tower);   // version 4부터

    // 꺼져 있던 시간 = 지금 시각 - 마지막으로 저장한 시각
    // Math.max(0, ...): PC 시계가 뒤로 돌아가 있어도 음수가 되지 않게 막아요
    const awaySeconds = Math.max(0, (Date.now() - saveData.savedAt) / 1000) || 0;
    const maxSeconds = getMaxOfflineHours() * 60 * 60;
    offlineWasCapped = awaySeconds > maxSeconds;
    offlineSeconds = Math.min(awaySeconds, maxSeconds);
  } catch (error) {
    // 저장 데이터가 깨져 있으면 게임이 멈추지 않게 새 게임으로 시작해요
    console.warn("저장 데이터를 불러오지 못했어요:", error);
  }
}

function resetGame() {
  if (!confirm("정말 처음부터 다시 시작할까요? 진주와 도감까지 모든 진행 상황이 사라져요.")) {
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

// 물고기 가격 배율 = 미끼 × 황금 그물 × 도감 보너스 × 탑 보너스
// 보너스들을 "곱하기"로 합쳐요. 그래서 하나만 올리는 것보다 골고루 올리는 게 효과가 커요.
function getPriceMultiplier() {
  const bait = 1 + 0.5 * state.levels.bait;          // 미끼 레벨마다 +50%
  const net = 1 + 0.25 * state.pearlLevels.net;       // 황금 그물 레벨마다 +25%
  const dex = 1 + DEX_BONUS * getDexFound();          // 도감 1종마다 +5%
  const tower = 1 + TOWER_BONUS * state.tower.best;   // 탑 최고 기록 1층마다 +2%
  return bait * net * dex * tower;
}

// 도감에 등록된 물고기 종류 수
function getDexFound() {
  return ALL_FISH.filter((fish) => state.dex[fish.id] > 0).length;
}

// 오프라인 보상 최대 시간: 기본 12시간 + 긴 휴가 레벨마다 2시간
function getMaxOfflineHours() {
  return 12 + 2 * state.pearlLevels.vacation;
}

// 물고기 하나의 뽑기 가중치. 행운의 부적은 희귀·전설의 가중치만 키워요.
function getFishWeight(fish) {
  const weight = RARITIES[fish.rarity].weight;
  if (fish.rarity === "rare" || fish.rarity === "legendary") {
    return weight * (1 + 0.25 * state.pearlLevels.luck);
  }
  return weight;
}

function getFishPerCatch() {
  return 1 + state.levels.crew;
}

function getCurrentSpot() {
  return SPOTS.find((spot) => spot.id === state.spot);
}

// 한 낚시터의 가중치를 전부 더한 값 (행운의 부적이 없으면 70+22+7+1 = 100)
function getTotalWeight(spot) {
  let total = 0;
  for (const fish of spot.fish) {
    total += getFishWeight(fish);
  }
  return total;
}

// 기댓값: "물고기 한 마리를 잡으면 평균적으로 얼마를 버는가"
//   = (각 물고기 가격 × 그 물고기가 잡힐 확률)을 전부 더한 값
function getExpectedFishPrice(spot) {
  const total = getTotalWeight(spot);
  let sum = 0;
  for (const fish of spot.fish) {
    sum += fish.price * (getFishWeight(fish) / total);
  }
  return sum;
}

function getGoldPerSecond() {
  const spot = getCurrentSpot();
  return getExpectedFishPrice(spot) * getPriceMultiplier() * getFishPerCatch() / getCatchTime();
}

// 업그레이드 가격 = 처음 가격 × (growth의 레벨 제곱)
// level을 주면 그 레벨일 때 가격, 안 주면 지금 레벨의 가격을 알려줘요.
function getCost(upgrade, level = state.levels[upgrade.id]) {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.growth, level));
}

// 지금 가진 골드로 이 업그레이드를 몇 레벨까지 올릴 수 있는지 미리 세어봐요.
// 진짜로 사지는 않고, "가상의 지갑"으로 계산만 해요.
function getMaxBuyCount(upgrade) {
  let wallet = state.gold;
  let level = state.levels[upgrade.id];
  let count = 0;
  while (wallet >= getCost(upgrade, level)) {
    wallet -= getCost(upgrade, level);
    level += 1;
    count += 1;
  }
  return count;
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
    r -= getFishWeight(fish);
    if (r < 0) {
      return fish;
    }
  }
  return spot.fish[0];   // 혹시 모를 계산 오차 대비
}

// ---------- 연출(애니메이션) 도우미 ----------
// 애니메이션 자체는 style.css의 @keyframes에 적혀 있고,
// JavaScript는 "언제 그 애니메이션을 틀지"만 정해요. (클래스를 붙였다 뗐다 하는 방식)

// 같은 애니메이션을 처음부터 다시 틀어요.
// 클래스를 뗐다가 바로 붙이면 브라우저가 "바뀐 게 없네" 하고 무시해요.
// 그래서 중간에 offsetWidth를 한 번 읽어서, 브라우저가 "뗀 상태"를 한 번 그리게 만들어요.
function playAnimation(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

// 낚시 장면 위로 그림이나 글자가 튀어 올랐다 사라지게 해요
//   content: 글자(문자열) 또는 그림 같은 화면 요소
// 찌 위치(왼쪽에서 약 140px)에서 튀어 오르게 해요. 낚시꾼 그림 안에서 찌가 있는 자리예요.
//   낚시꾼 그림 왼쪽 위치 16px + 그림 속 찌 위치 41픽셀 × 3배 ≈ 140px
const BOBBER_X = 140;
let lastBigCatchAt = 0;   // 희귀 이상을 마지막으로 잡은 시각 (낚시꾼이 물고기를 들어 올리는 연출용)

function spawnPop(content, className) {
  if (popLayer.childElementCount > 20) {
    return;   // 탭을 오래 내려뒀다 돌아오면 한꺼번에 수십 개가 생길 수 있어서 개수 제한
  }
  const pop = document.createElement("span");
  pop.className = "pop " + className;
  if (typeof content === "string") {
    pop.textContent = content;
  } else {
    pop.append(content);
  }
  pop.style.left = (BOBBER_X + Math.random() * 30 - 15) + "px";   // 찌 근처에서 조금씩 다른 위치
  popLayer.appendChild(pop);
  // 애니메이션이 끝나면 스스로 지워져요 (안 지우면 화면에 계속 쌓여요)
  pop.addEventListener("animationend", () => pop.remove());
}

// 화면 위쪽 알림 띄우기. type은 "legendary"(전설) 또는 "new"(새 물고기)
function showBanner(text, type) {
  banner.textContent = text;
  banner.className = "banner " + type;
  playAnimation(banner, "show");
}

// 숫자를 1,234,567처럼 쉼표를 넣어 보여줘요
// 1만이 넘으면 "12.3만", "2,000만", "4.5억"처럼 한국식 단위로 줄여요.
// 방치형 게임은 숫자가 금방 엄청 커져서, 그대로 쓰면 버튼에 안 들어가요.
function formatNumber(n) {
  n = Math.floor(n);
  const units = [
    { value: 1e12, name: "조" },
    { value: 1e8,  name: "억" },
    { value: 1e4,  name: "만" },
  ];
  for (const unit of units) {
    if (n >= unit.value) {
      const short = n / unit.value;
      // 100 미만이면 소수점 한 자리(12.3만), 그 이상이면 정수(2,000만)
      const text = short < 100
        ? String(Math.floor(short * 10) / 10)
        : Math.floor(short).toLocaleString("ko-KR");
      return text + unit.name;
    }
  }
  return n.toLocaleString("ko-KR");
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
const scene = document.getElementById("scene");
const fisherImg = document.getElementById("fisher");
const popLayer = document.getElementById("pop-layer");
const banner = document.getElementById("banner");
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
  state.runGold += gold;   // 진주 계산용으로 "이번 판에 번 돈"도 따로 쌓아요
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

  // 연출: 제일 좋은 물고기와 번 골드가 물 위로 튀어 올라요
  spawnPop(makeSprite("splash", 3), "pop-splash");                    // 물보라
  spawnPop(makeFishSprite(best, 3), "pop-fish rarity-" + best.rarity); // 잡은 물고기 그림

  const goldPop = document.createElement("span");                    // 동전 그림 + 숫자
  goldPop.append(makeSprite("coin", 1), " +" + formatNumber(totalGold));
  spawnPop(goldPop, "pop-gold");

  if (best.rarity === "rare" || best.rarity === "legendary") {
    lastBigCatchAt = Date.now();   // 낚시꾼이 번쩍 들어 올리는 그림으로 바뀌어요
  }

  if (best.rarity === "legendary") {
    showBanner(`🌟 전설의 물고기! ${best.emoji} ${best.name} 🌟`, "legendary");
    playAnimation(scene, "shake");        // 화면이 흔들려요
  } else if (newFish) {
    showBanner(`📖 새로운 물고기 발견! ${newFish.emoji} ${newFish.name}`, "new");
  } else if (best.rarity === "rare") {
    playAnimation(scene, "flash-rare");   // 장면이 파랗게 반짝여요
  }

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
    const count = Math.floor(totalFish * getFishWeight(fish) / totalWeight);
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

// 이 업그레이드 하나를 살 수 있는 만큼 전부 올려요
function buyUpgradeMax(upgrade) {
  let count = 0;
  while (state.gold >= getCost(upgrade)) {
    state.gold -= getCost(upgrade);
    state.levels[upgrade.id] += 1;
    count += 1;
  }
  if (count > 0) {
    logText.textContent = `${upgrade.emoji} ${upgrade.name} ${count}레벨 업! (Lv.${state.levels[upgrade.id]})`;
    logText.style.color = "";
  }
  render();
}

// 모든 업그레이드를 골드가 떨어질 때까지 올려요.
// 방법: "지금 제일 싼 업그레이드"를 하나 사는 걸 반복해요.
// 이렇게 매 순간 눈앞의 제일 좋아 보이는 선택을 하는 방식을 "탐욕 알고리즘(greedy)"이라고 불러요.
// (밸런스 시뮬레이션의 가상 플레이어도 똑같은 방식으로 업그레이드를 사요)
function buyAllMax() {
  const bought = {};   // { bait: 3, rod: 2 } 처럼 몇 번씩 샀는지 기록
  while (true) {
    let cheapest = UPGRADES[0];
    for (const upgrade of UPGRADES) {
      if (getCost(upgrade) < getCost(cheapest)) {
        cheapest = upgrade;
      }
    }
    if (state.gold < getCost(cheapest)) {
      break;   // 제일 싼 것도 못 사면 끝
    }
    state.gold -= getCost(cheapest);
    state.levels[cheapest.id] += 1;
    bought[cheapest.id] = (bought[cheapest.id] || 0) + 1;
  }

  const parts = UPGRADES
    .filter((upgrade) => bought[upgrade.id])
    .map((upgrade) => `${upgrade.emoji}+${bought[upgrade.id]}`);
  if (parts.length > 0) {
    logText.textContent = `⚡ 전부 올렸어요! ${parts.join("  ")}`;
    logText.style.color = "";
  }
  render();
}

// ---------- 환생 ----------

// 지금 환생하면 받을 진주 개수
// 제곱근(√)을 쓰기 때문에 골드를 4배 벌어도 진주는 2배만 늘어요.
// 그래서 한 판을 끝없이 오래 하기보다, 적당할 때 환생하는 게 이득이 돼요.
function getPearlsOnRebirth() {
  return Math.floor(Math.sqrt(state.runGold / PEARL_DIVISOR));
}

// 진주를 하나 더 받으려면 이번 판에 골드를 총 얼마 벌어야 하는지
//   진주 n개 ← √(번 골드 ÷ 100만) = n  ←→  번 골드 = n² × 100만
function getGoldForNextPearl() {
  const next = getPearlsOnRebirth() + 1;
  return next * next * PEARL_DIVISOR;
}

// 환생 조건: 심해를 열었고, 진주를 1개 이상 받을 수 있을 것
function canRebirth() {
  return state.unlockedSpots.includes("deep") && getPearlsOnRebirth() >= 1;
}

function rebirth() {
  if (!canRebirth()) {
    return;
  }
  const pearls = getPearlsOnRebirth();
  if (!confirm(`환생하면 골드, 업그레이드, 낚시터가 처음으로 돌아가요.\n대신 진주 ${pearls}개를 받아요. (진주와 도감은 남아요)\n환생할까요?`)) {
    return;
  }

  state.pearls += pearls;
  state.rebirths += 1;

  // 이번 판 진행 상황만 처음으로 되돌려요
  state.gold = 0;
  state.progress = 0;
  state.runGold = 0;
  for (const upgrade of UPGRADES) {
    state.levels[upgrade.id] = 0;
  }
  state.spot = "lake";
  state.unlockedSpots = ["lake"];

  showBanner(`🔄 ${state.rebirths}번째 환생! 진주 ${pearls}개를 받았어요 🦪`, "new");
  logText.textContent = "새로운 마음으로 낚싯대를 던졌어요...";
  logText.style.color = "";
  saveGame();
  render();
}

// 진주 상점 가격 (올림해서 정수로)
function getPearlCost(upgrade, level = state.pearlLevels[upgrade.id]) {
  return Math.ceil(upgrade.baseCost * Math.pow(upgrade.growth, level));
}

function buyPearlUpgrade(upgrade) {
  if (state.pearlLevels[upgrade.id] >= upgrade.maxLevel) {
    return;   // 이미 최대 레벨
  }
  const cost = getPearlCost(upgrade);
  if (state.pearls < cost) {
    return;
  }
  state.pearls -= cost;
  state.pearlLevels[upgrade.id] += 1;
  logText.textContent = `${upgrade.emoji} ${upgrade.name} 레벨 업! (Lv.${state.pearlLevels[upgrade.id]})`;
  logText.style.color = "";
  saveGame();   // 진주는 귀하니까 바로 저장
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
  // 그림이 있는 업그레이드는 이름 앞에 픽셀 아이콘을 붙여요
  if (upgrade.sprite) {
    name.append(makeSprite(upgrade.sprite, 1));
  }
  const label = makeSpan("label");   // "미끼 Lv.3" 글자가 들어갈 칸 (render에서 바꿔요)
  name.append(label);
  const desc = makeSpan("desc");
  desc.textContent = upgrade.desc;
  const cost = makeSpan("cost");
  button.append(name, desc, cost);
  button.addEventListener("click", () => buyUpgrade(upgrade));   // 1레벨 사기

  // 오른쪽 작은 버튼: 살 수 있는 만큼 전부 사기
  const maxButton = document.createElement("button");
  maxButton.className = "max-button";
  maxButton.addEventListener("click", () => buyUpgradeMax(upgrade));

  // 두 버튼을 한 줄(row)로 묶어서 상점에 붙여요
  const row = document.createElement("div");
  row.className = "upgrade-row";
  row.append(button, maxButton);
  document.getElementById("shop").appendChild(row);
  shopButtons[upgrade.id] = { button, label, cost, maxButton };
}

document.getElementById("buy-all").addEventListener("click", buyAllMax);

// 진주 상점 (상점과 같은 방식인데 MAX 버튼은 없어요)
const pearlButtons = {};
for (const upgrade of PEARL_UPGRADES) {
  const button = document.createElement("button");
  button.className = "upgrade pearl";
  const name = makeSpan("name");
  const desc = makeSpan("desc");
  desc.textContent = upgrade.desc;
  const cost = makeSpan("cost");
  button.append(name, desc, cost);
  button.addEventListener("click", () => buyPearlUpgrade(upgrade));
  // 탑 강화는 아래쪽 "🗼 탑 강화" 칸에, 나머지는 위쪽 칸에 넣어요
  const shopId = upgrade.group === "tower" ? "pearl-tower-shop" : "pearl-shop";
  document.getElementById(shopId).appendChild(button);
  pearlButtons[upgrade.id] = { button, name, cost };
}

const rebirthButton = document.getElementById("rebirth-button");
rebirthButton.addEventListener("click", rebirth);

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
  // 등급마다 다른 슬롯 테두리 (흔함=회색, 보통=파랑, 희귀=보라, 전설=금색)
  cell.classList.add("slot-" + fish.rarity);
  const picture = makeSpan("dex-picture");
  picture.append(makeFishSprite(fish, 2));
  picture.append(makeSprite("icon_lock", 3));   // 못 잡은 물고기는 그림 대신 자물쇠가 보여요
  const name = makeSpan("dex-name");
  const count = makeSpan("dex-count");
  cell.append(picture, name, count);
  document.getElementById("dex").appendChild(cell);
  dexCells[fish.id] = { cell, name, count };
}

// 물속에서 헤엄치는 물고기 (장식)
//   지금 낚시터의 물고기를 등급 확률대로 3마리 뽑아서, 왼쪽↔오른쪽으로 헤엄치게 해요.
//   한 번 화면을 다 건너가면(animationiteration) 새 물고기로 바뀌어요.
const swimmersBox = document.getElementById("swimmers");
let swimmersSpot = null;   // 지금 헤엄치는 물고기들이 어느 낚시터 물고기인지

function setupSwimmer(img) {
  const fish = rollFish(getCurrentSpot());
  setFishSprite(img, fish, 2);
  img.style.top = (125 + Math.random() * 70) + "px";             // 물속 아무 깊이
  img.style.animationDuration = (8 + Math.random() * 8) + "s";   // 8~16초에 한 번 건너가요
  // 절반은 오른쪽 → 왼쪽으로 (그림을 좌우로 뒤집고, 애니메이션을 거꾸로 재생)
  img.classList.toggle("to-left", Math.random() < 0.5);
}

function refreshSwimmers() {
  swimmersSpot = state.spot;
  swimmersBox.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const img = makeSprite("fish_crucian", 2);
    img.classList.add("swimmer");
    setupSwimmer(img);
    // 처음부터 화면 중간쯤에 있도록, 애니메이션을 미리 몇 초 진행시켜 둬요 (음수 지연)
    img.style.animationDelay = (-Math.random() * 8) + "s";
    img.addEventListener("animationiteration", () => setupSwimmer(img));
    swimmersBox.appendChild(img);
  }
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

  // 낚시터마다 배경 색을 바꿔요. body에 data-spot="sea" 같은 표시를 붙이면 CSS가 알아서 색을 골라요.
  document.body.dataset.spot = state.spot;

  // 낚시꾼 그림 바꾸기 (프레임 애니메이션)
  //   여러 장의 그림을 빠르게 바꿔 보여주면 움직이는 것처럼 보여요. 만화 영화와 같은 원리예요.
  //   - 희귀 이상을 잡은 직후 0.8초: 물고기를 번쩍 들어 올려요 (catch)
  //   - 진행도 90% 이상: 릴을 감아요. 그림 3장을 0.12초마다 돌려요 (reel_0 → 1 → 2)
  //   - 진행도 70% 이상: 입질! 찌가 물속으로 당겨지고 머리 위에 느낌표 (bite)
  //   - 평소: 그림 2장을 0.6초마다 번갈아서 배가 살짝 출렁여요 (idle_0, idle_1)
  const now = Date.now();
  let frame;
  if (now - lastBigCatchAt < 800) {
    frame = "fisher_catch";
  } else if (state.progress > 0.9) {
    frame = "fisher_reel_" + (Math.floor(now / 120) % 3);
  } else if (state.progress > 0.7) {
    frame = "fisher_bite";
  } else {
    frame = "fisher_idle_" + (Math.floor(now / 600) % 2);
  }
  setSprite(fisherImg, frame, 3);

  // 낚시터가 바뀌면 물속 물고기도 그 낚시터 물고기로 바꿔요
  if (swimmersSpot !== state.spot) {
    refreshSwimmers();
  }

  // 상점
  for (const upgrade of UPGRADES) {
    const ui = shopButtons[upgrade.id];
    const cost = getCost(upgrade);
    const icon = upgrade.sprite ? "" : upgrade.emoji + " ";   // 그림이 없으면 이모지로
    ui.label.textContent = `${icon}${upgrade.name} Lv.${state.levels[upgrade.id]}`;
    ui.cost.textContent = formatNumber(cost);
    ui.button.disabled = state.gold < cost;   // 돈이 모자라면 버튼을 회색으로 잠가요

    const maxCount = getMaxBuyCount(upgrade);
    ui.maxButton.textContent = `MAX\n+${maxCount}`;
    ui.maxButton.disabled = maxCount === 0;
  }
  // 제일 싼 업그레이드도 못 사면 "전부 올리기"도 잠가요
  const cheapestCost = Math.min(...UPGRADES.map((upgrade) => getCost(upgrade)));
  document.getElementById("buy-all").disabled = state.gold < cheapestCost;

  // 환생
  document.getElementById("pearls").textContent = formatNumber(state.pearls);
  document.getElementById("rebirths").textContent = state.rebirths;
  document.getElementById("dex-bonus").textContent = Math.round(DEX_BONUS * getDexFound() * 100);

  const rebirthHint = document.getElementById("rebirth-hint");
  rebirthButton.disabled = !canRebirth();
  if (!state.unlockedSpots.includes("deep")) {
    rebirthButton.textContent = "🔄 환생하기";
    rebirthHint.textContent = "🌌 심해를 열면 환생할 수 있어요";
  } else {
    rebirthButton.textContent = `🔄 환생하기 (+${getPearlsOnRebirth()} 🦪)`;
    rebirthHint.textContent = `다음 진주까지: 이번 판 수입 💰${formatNumber(state.runGold)} / ${formatNumber(getGoldForNextPearl())}`;
  }

  for (const upgrade of PEARL_UPGRADES) {
    const ui = pearlButtons[upgrade.id];
    const level = state.pearlLevels[upgrade.id];
    const isMax = level >= upgrade.maxLevel;
    ui.name.textContent = `${upgrade.emoji} ${upgrade.name} Lv.${level}`;
    ui.cost.textContent = isMax ? "MAX" : `🦪 ${getPearlCost(upgrade)}`;
    ui.button.disabled = isMax || state.pearls < getPearlCost(upgrade);
  }

  // 낚시터
  for (const spot of SPOTS) {
    const button = spotButtons[spot.id];
    const unlocked = state.unlockedSpots.includes(spot.id);
    if (unlocked) {
      button.textContent = `${spot.emoji} ${spot.name}`;
      button.disabled = false;
    } else {
      // 자물쇠 아이콘은 CSS(.spot.locked)가 붙여줘요
      button.textContent = `${spot.name}\n💰${formatNumber(spot.unlockCost)}`;   // \n = 줄바꿈
      button.disabled = state.gold < spot.unlockCost;
    }
    button.classList.toggle("locked", !unlocked);
    button.classList.toggle("active", spot.id === state.spot);   // 지금 있는 곳은 강조
  }

  // 도감
  let found = 0;
  for (const fish of ALL_FISH) {
    const ui = dexCells[fish.id];
    const caught = state.dex[fish.id] || 0;
    if (caught > 0) {
      found += 1;
      ui.cell.classList.remove("unknown");
      ui.name.textContent = fish.name;
      ui.count.textContent = `${formatNumber(caught)}마리`;
      ui.cell.style.borderColor = RARITIES[fish.rarity].color;
    } else {
      ui.cell.classList.add("unknown");   // 아직 못 잡은 물고기는 자물쇠로 가려요
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
    message += `<br><small>(오프라인 보상은 최대 ${getMaxOfflineHours()}시간까지 쌓여요)</small>`;
  }
  document.getElementById("offline-text").innerHTML = message;
  popup.classList.remove("hidden");
  saveGame();   // 받은 보상을 바로 저장해서, 새로고침으로 두 번 받는 일을 막아요
  render();
}

document.getElementById("offline-ok").addEventListener("click", () => {
  popup.classList.add("hidden");
});
