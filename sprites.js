// ============================================================
// 🎨 스프라이트(픽셀아트 그림) 도우미
//    assets/sprites/ 폴더의 그림 파일을 화면에 붙일 때 써요.
//
//    픽셀아트는 아주 작게 그려져 있어서(붕어는 18×14픽셀!) 크게 늘려서 보여줘야 해요.
//    이때 "정수 배"(2배, 3배)로 늘려야 픽셀이 고르게 보여요. 2.5배처럼 늘리면 어떤 칸은
//    2픽셀, 어떤 칸은 3픽셀이 돼서 그림이 울퉁불퉁해져요.
//    그래서 원래 크기를 아래 목록에 적어두고, 배율을 곱해서 정확한 크기를 정해요.
// ============================================================

// 그림 이름: [원래 너비, 원래 높이] (spritesheet.json에서 옮겨 적은 값)
// water_deep은 물 타일 아래쪽 절반을 잘라서 따로 만든 그림이에요
const SPRITE_SIZES = {
  fish_crucian: [18, 14],
  fish_mackerel: [23, 11],
  fish_goldfish: [18, 15],
  fish_clown: [17, 14],
  fish_puffer: [15, 15],
  fish_tuna: [30, 17],
  fish_shark: [35, 19],
  fish_legend_gold: [23, 17],
  fish_abyss: [20, 16],
  jellyfish: [14, 15],
  bobber: [7, 13],
  hook: [7, 12],
  bait_worm: [12, 7],
  rod: [18, 18],
  bucket: [14, 13],
  coin: [14, 14],
  gem: [13, 11],
  chest: [18, 11],
  star: [13, 11],
  icon_upgrade: [11, 10],
  icon_alert: [6, 10],
  junk_boot: [11, 11],
  junk_fishbone: [18, 7],
  bubble: [7, 7],
  splash: [12, 5],
  water_tile_0: [16, 16],
  water_tile_1: [16, 16],
  seaweed_0: [10, 18],
  seaweed_1: [10, 18],
  fish_minnow: [12, 9],
  fish_carp: [24, 16],
  fish_salmon: [26, 14],
  fish_bass: [21, 17],
  fish_angel: [14, 20],
  fish_piranha: [17, 16],
  fish_koi: [24, 14],
  fish_eel: [33, 9],
  fish_catfish: [25, 13],
  fish_swordfish: [40, 17],
  fish_legend_rainbow: [23, 17],
  crab: [14, 10],
  octopus: [14, 12],
  fisher_idle_0: [52, 43],
  fisher_idle_1: [52, 43],
  fisher_bite: [52, 43],
  fisher_reel_0: [52, 43],
  fisher_reel_1: [52, 43],
  fisher_reel_2: [52, 43],
  fisher_catch: [52, 43],
  ui_panel_wood: [24, 24],
  ui_panel_dark: [24, 24],
  ui_button_green: [26, 15],
  ui_button_green_pressed: [26, 15],
  ui_button_blue: [26, 15],
  ui_button_blue_pressed: [26, 15],
  ui_button_gold: [26, 15],
  ui_button_gold_pressed: [26, 15],
  ui_button_disabled: [26, 15],
  ui_slot_common: [26, 26],
  ui_slot_rare: [26, 26],
  ui_slot_epic: [26, 26],
  ui_slot_legend: [26, 26],
  ui_bar_frame: [36, 7],
  ui_bar_fill_green: [32, 3],
  ui_bar_fill_blue: [32, 3],
  icon_shop: [13, 12],
  icon_settings: [13, 13],
  icon_close: [11, 11],
  icon_lock: [11, 11],
  icon_plus: [11, 11],
  icon_book: [14, 9],
  water_deep: [16, 8],
};

// 그림 하나를 <img> 요소로 만들어요.
//   name:  그림 이름 (예: "fish_crucian")
//   scale: 몇 배로 늘릴지 (예: 3)
function makeSprite(name, scale) {
  const img = document.createElement("img");
  img.className = "pixel";
  img.alt = "";
  setSprite(img, name, scale);
  return img;
}

// 이미 있는 <img>의 그림이나 크기를 바꿔요
function setSprite(img, name, scale) {
  const [w, h] = SPRITE_SIZES[name];
  const src = `assets/sprites/${name}.png`;
  if (img.getAttribute("src") !== src) {   // 같은 그림이면 다시 불러오지 않아요
    img.setAttribute("src", src);
  }
  img.width = w * scale;
  img.height = h * scale;
}

// 물고기 그림을 만들어요. 물고기마다 색 바꾸기(filter)나 크기 보정(spriteScale)이 있을 수 있어요.
function makeFishSprite(fish, scale) {
  const img = makeSprite(fish.sprite, Math.round(scale * (fish.spriteScale || 1)));
  img.style.filter = fish.filter || "";
  return img;
}

// 이미 있는 <img>를 다른 물고기 그림으로 바꿔요
function setFishSprite(img, fish, scale) {
  setSprite(img, fish.sprite, Math.round(scale * (fish.spriteScale || 1)));
  img.style.filter = fish.filter || "";
}
