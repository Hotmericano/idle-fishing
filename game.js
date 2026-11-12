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
