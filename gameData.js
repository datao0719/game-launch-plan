// Shared static data: platforms, methods, month/date columns, and the original
// spreadsheet-derived baseline plan (RAW). Server-only module (CommonJS).

const PLATFORMS = ["PT", "BP", "OKB"];

const METHODS = [
  { key: "launch", label: "首發" },
  { key: "exclusive", label: "客製獨家" },
  { key: "allplatform", label: "新遊戲全平台" },
  { key: "none", label: "一般上架" },
];

const MONTHS = [
  { label: "6月", dates: ["既有", "6/30"] },
  { label: "7月", dates: ["7/17", "7/30"] },
  { label: "8月", dates: ["8/13", "8/31"] },
  { label: "9月", dates: ["9/15", "9/30"] },
  { label: "10月", dates: ["10/15", "10/29"] },
  { label: "11月", dates: ["11/16", "11/30"] },
  { label: "12月", dates: ["12/15", "12/31"] },
  { label: "1月", dates: ["1/15", "1/29"] },
  { label: "2月", dates: ["2/15", "2/26"] },
];

const DATE_COLS = MONTHS.flatMap((m) => m.dates); // 18 columns

const G = (name, office, cat) => ({ name, office, cat });

function allplatformRow() {
  const row = new Array(DATE_COLS.length).fill(null);
  row[3] = G("彩罐熱舞1000", "central", "mainstream");
  row[5] = G("放克猿", "north", "mainstream");
  row[7] = G("Olympus 2500", "central", "mainstream");
  row[9] = G("金龍發-金海龍王", "north", "casino");
  row[11] = G("Super Bang Bang", "central", "mainstream");
  row[12] = G("寶石系列", "central", "mainstream");
  row[13] = G("福來發-財源滾滾", "north", "casino");
  row[14] = G("福來發-金將熊貓", "north", "casino");
  row[15] = G("Wild Bandito 亡靈", "north", "mainstream");
  return row;
}

function emptyRow() {
  return new Array(DATE_COLS.length).fill(null);
}

const RAW = {
  PT: {
    launch: (() => {
      const r = emptyRow();
      r[1] = G("小魔女", "north", "mainstream");
      r[2] = G("多採多汁", "central", "mainstream");
      r[4] = G("龍來發-花好月圓", "north", "casino");
      r[6] = G("雷神爆金1000", "central", "mainstream");
      r[8] = G("金爆連連-孔雀迎福", "central", "casino");
      r[10] = G("Super Coins", "north", "mainstream");
      r[13] = G("Buffalo", "north", "mainstream");
      return r;
    })(),
    exclusive: emptyRow(),
    allplatform: allplatformRow(),
    none: (() => {
      const r = emptyRow();
      r[3] = G("甜心派對", "north", "mainstream");
      r[4] = G("龍來發-金鳳飛舞", "north", "casino");
      r[7] = G("金碌發-春節盛典", "central", "casino");
      r[9] = G("Mike C", "central", "mainstream");
      r[14] = G("金齒乾坤", "central", "outsource");
      return r;
    })(),
  },
  BP: {
    launch: (() => {
      const r = emptyRow();
      r[0] = G("甜心派對", "north", "mainstream");
      r[6] = G("金碌發-春節盛典", "central", "casino");
      r[8] = G("Mike C", "central", "mainstream");
      r[10] = G("金爆連連-改", "central", "casino");
      r[13] = G("金齒乾坤", "central", "outsource");
      return r;
    })(),
    exclusive: (() => {
      const r = emptyRow();
      r[2] = G("巴塔拉 1000", "north", "custom");
      r[4] = G("寵寶魔怪", "central", "custom");
      r[7] = G("雷神爆金1000", "central", "mainstream");
      return r;
    })(),
    allplatform: allplatformRow(),
    none: (() => {
      const r = emptyRow();
      r[2] = G("小魔女", "north", "mainstream");
      r[3] = G("龍來發-金鳳飛舞", "north", "casino");
      r[4] = G("多採多汁", "central", "mainstream");
      r[5] = G("龍來發-花好月圓", "north", "casino");
      r[10] = G("金爆連連-孔雀迎福", "central", "mainstream");
      r[11] = G("Super Coins", "north", "mainstream");
      r[14] = G("Buffalo", "north", "mainstream");
      return r;
    })(),
  },
  OKB: {
    launch: (() => {
      const r = emptyRow();
      r[0] = G("超級寶石-輪盤版", "central", "mainstream");
      r[1] = G("龍來發-金鳳飛舞", "north", "casino");
      return r;
    })(),
    exclusive: (() => {
      const r = emptyRow();
      r[6] = G("SEX BOMB Split", "north", "custom");
      r[8] = G("SEX BOMB WILD", "north", "custom");
      r[10] = G("SEXY BOMB MULTIPLE WILD", "north", "custom");
      r[12] = G("SEX BOMB MIX", "north", "custom");
      return r;
    })(),
    allplatform: allplatformRow(),
    none: (() => {
      const r = emptyRow();
      r[2] = G("小魔女", "north", "mainstream");
      r[4] = G("多採多汁", "central", "mainstream");
      r[5] = G("龍來發-花好月圓", "north", "casino");
      r[7] = G("金碌發-春節盛典", "central", "casino");
      r[8] = G("雷神爆金1000", "central", "mainstream");
      r[9] = G("Mike C", "central", "mainstream");
      r[10] = G("金爆連連-孔雀迎福", "central", "casino");
      r[11] = G("Super Coins", "north", "mainstream");
      r[14] = G("Buffalo", "north", "mainstream");
      r[15] = G("金齒乾坤", "central", "outsource");
      return r;
    })(),
  },
};

module.exports = { PLATFORMS, METHODS, MONTHS, DATE_COLS, RAW };
