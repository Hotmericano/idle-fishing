// ============================================================
// 1. 업그레이드 목록 (게임 데이터)
//    "어떤 업그레이드가 있는지"를 코드와 분리해서 목록으로 적어둬요.
//    새 업그레이드를 추가하고 싶으면 여기에 한 줄만 더 쓰면 돼요.
//
//    baseCost: 처음 가격
//    growth:   살 때마다 가격이 몇 배가 되는지 (1.15 = 15%씩 비싸짐)
// ============================================================
const UPGRADES = [
  { id: "bait", emoji: "🪱", name: "미끼",   desc: "물고기 가격 +1",          baseCost: 5,  growth: 1.15 },
  { id: "rod",  emoji: "🎣", name: "낚싯대", desc: "낚시 속도 +20%",          baseCost: 10, growth: 1.15 },
  { id: "crew", emoji: "🧑‍✈️", name: "선원",   desc: "한 번에 잡는 물고기 +1", baseCost: 50, growth: 1.6  },
];

// ============================================================
// 2. 게임 상태
//    게임에서 변하는 값을 전부 이 상자(객체) 하나에 모아둬요.
//    1단계와 달리 catchTime, fishPrice는 여기 없어요.
//    대신 "업그레이드 레벨"만 저장하고, 실제 능력치는 아래 함수로 계산해요.
// ============================================================
const state = {
  gold: 0,
  fishCaught: 0,
  progress: 0,    // 지금 낚시가 얼마나 진행됐는지 (0 ~ 1)
  levels: {       // 업그레이드별 레벨
    bait: 0,
    rod: 0,
    crew: 0,
  },
};

// ============================================================
// 2-1. 저장하기 / 불러오기
//    localStorage는 브라우저 안에 있는 작은 "메모장"이에요.
//    글자(문자열)만 저장할 수 있어서, state 객체를 JSON이라는 글자 형식으로 바꿔서 넣어요.
//    (사이트 주소별로 따로 저장되고, 브라우저 기록을 지우면 같이 지워져요)
// ============================================================
const SAVE_KEY = "idle-fishing-save";   // 메모장에서 우리 게임 데이터를 찾을 때 쓰는 이름
let isResetting = false;                // 초기화 중에는 저장하지 않으려고 쓰는 표시

function saveGame() {
  if (isResetting) {
    return;
  }
  const saveData = {
    version: 1,             // 나중에 저장 형식이 바뀌면 옛날 세이브를 구별하려고 붙여둬요
    savedAt: Date.now(),    // 언제 저장했는지 (다음 단계 "오프라인 보상"에서 써요)
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
    // levels는 하나씩 덮어써요. 나중에 업그레이드가 새로 추가돼도
    // 옛날 세이브에 없는 업그레이드는 기본값 0이 그대로 남아요.
    Object.assign(state.levels, saved.levels);
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
//    밸런스를 바꾸고 싶으면 이 숫자들만 고치면 돼요.
// ============================================================
function getCatchTime() {
  // 기본 3초. 낚싯대 레벨마다 속도가 20%씩 빨라져요.
  return 3 / (1 + 0.2 * state.levels.rod);
}

function getFishPrice() {
  return 1 + state.levels.bait;
}

function getFishPerCatch() {
  return 1 + state.levels.crew;
}

function getGoldPerSecond() {
  return getFishPrice() * getFishPerCatch() / getCatchTime();
}

// 업그레이드 가격 = 처음 가격 × (growth의 레벨 제곱)
// 예: 낚싯대 Lv.0 → 10, Lv.1 → 11, Lv.5 → 20, Lv.10 → 40, Lv.20 → 163
function getCost(upgrade) {
  const level = state.levels[upgrade.id];
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.growth, level));
}

// ============================================================
// 4. 화면 요소 찾아두기
// ============================================================
const goldText = document.getElementById("gold");
const fishCountText = document.getElementById("fish-count");
const gpsText = document.getElementById("gps");
const barFill = document.getElementById("bar-fill");
const logText = document.getElementById("log");
const shop = document.getElementById("shop");

// ============================================================
// 5. 행동: 물고기 잡기, 업그레이드 사기
// ============================================================
function catchFish() {
  const count = getFishPerCatch();
  const earned = count * getFishPrice();
  state.fishCaught += count;
  state.gold += earned;
  logText.textContent = `🐟 물고기 ${count}마리를 낚았어요! (+${earned} 골드)`;
}

function buyUpgrade(upgrade) {
  const cost = getCost(upgrade);
  if (state.gold < cost) {
    return;   // 돈이 모자라면 아무것도 안 하고 끝
  }
  state.gold -= cost;
  state.levels[upgrade.id] += 1;
  logText.textContent = `${upgrade.emoji} ${upgrade.name} 레벨 업! (Lv.${state.levels[upgrade.id]})`;
  render();
}

// ============================================================
// 6. 상점 버튼 만들기
//    UPGRADES 목록을 하나씩 돌면서 버튼을 만들어 상점에 붙여요.
//    버튼 안의 글자 칸(span)도 미리 만들어두고, render()에서 글자만 바꿔요.
// ============================================================
const shopButtons = {};   // 나중에 id로 버튼을 찾을 수 있게 모아두는 곳

for (const upgrade of UPGRADES) {
  const button = document.createElement("button");
  button.className = "upgrade";

  const name = document.createElement("span");
  name.className = "name";
  const desc = document.createElement("span");
  desc.className = "desc";
  desc.textContent = upgrade.desc;
  const cost = document.createElement("span");
  cost.className = "cost";

  button.append(name, desc, cost);
  button.addEventListener("click", () => buyUpgrade(upgrade));   // 누르면 이 업그레이드를 산다
  shop.appendChild(button);

  shopButtons[upgrade.id] = { button, name, cost };
}

// ============================================================
// 7. 화면 그리기
//    state에 들어있는 값을 화면에 그대로 보여줘요.
// ============================================================
function render() {
  goldText.textContent = state.gold;
  fishCountText.textContent = state.fishCaught;
  gpsText.textContent = getGoldPerSecond().toFixed(1);   // 소수점 한 자리까지
  barFill.style.width = (state.progress * 100) + "%";

  for (const upgrade of UPGRADES) {
    const ui = shopButtons[upgrade.id];
    const cost = getCost(upgrade);
    ui.name.textContent = `${upgrade.emoji} ${upgrade.name} Lv.${state.levels[upgrade.id]}`;
    ui.cost.textContent = `💰 ${cost}`;
    ui.button.disabled = state.gold < cost;   // 돈이 모자라면 버튼을 회색으로 잠가요
  }
}

// ============================================================
// 8. 게임 루프
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
// 9. 자동 저장
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
