// ============================================================
// 1. 게임 상태
//    게임에서 변하는 숫자를 전부 이 상자(객체) 하나에 모아둬요.
//    나중에 "저장하기"를 만들 때 이 상자만 통째로 저장하면 돼요.
// ============================================================
const state = {
  gold: 0,          // 가진 골드
  fishCaught: 0,    // 지금까지 잡은 물고기 수
  catchTime: 3,     // 물고기 한 마리를 잡는 데 걸리는 시간(초)
  fishPrice: 1,     // 물고기 한 마리를 팔면 받는 골드
  progress: 0,      // 지금 낚시가 얼마나 진행됐는지 (0이면 시작, 1이면 완료)
};

// ============================================================
// 2. 화면 요소 찾아두기
//    HTML에서 id로 이름표를 붙인 요소들을 미리 찾아서 변수에 담아요.
// ============================================================
const goldText = document.getElementById("gold");
const fishCountText = document.getElementById("fish-count");
const barFill = document.getElementById("bar-fill");
const logText = document.getElementById("log");

// ============================================================
// 3. 물고기 잡기
//    물고기 한 마리를 잡았을 때 일어나는 일을 함수 하나로 묶어요.
// ============================================================
function catchFish() {
  state.fishCaught += 1;
  state.gold += state.fishPrice;   // 잡자마자 바로 판다고 생각해요
  logText.textContent = `🐟 물고기를 낚았어요! (+${state.fishPrice} 골드)`;
}

// ============================================================
// 4. 화면 그리기
//    state에 들어있는 숫자를 화면에 그대로 보여줘요.
//    "숫자 바꾸기"와 "화면 보여주기"를 나눠두면 나중에 고치기 쉬워요.
// ============================================================
function render() {
  goldText.textContent = state.gold;
  fishCountText.textContent = state.fishCaught;
  barFill.style.width = (state.progress * 100) + "%";
}

// ============================================================
// 5. 게임 루프
//    0.1초마다 update()가 실행되면서 시간이 흐르게 만들어요.
// ============================================================
let lastTime = Date.now();   // 마지막으로 update()가 실행된 시각 (밀리초)

function update() {
  const now = Date.now();
  const dt = (now - lastTime) / 1000;   // 지난번 이후 흐른 시간(초). dt = "delta time"
  lastTime = now;

  // 흐른 시간만큼 낚시를 진행시켜요.
  // 예: catchTime이 3초인데 0.1초가 흘렀으면 진행도는 0.1 / 3 ≈ 0.033 늘어나요.
  state.progress += dt / state.catchTime;

  // 진행도가 1을 넘으면 물고기 한 마리 완성!
  // if가 아니라 while을 쓰는 이유: 브라우저 탭을 잠깐 내려두면 루프가 느려져서
  // 한 번에 몇 초가 흐를 수 있어요. 그동안 잡았어야 할 물고기를 전부 챙겨주려고요.
  while (state.progress >= 1) {
    state.progress -= 1;
    catchFish();
  }

  render();
}

setInterval(update, 100);   // 100밀리초(=0.1초)마다 update 실행
render();                   // 시작하자마자 한 번 그려두기
