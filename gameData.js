// Shared static data: platforms, methods, month/date columns, and the original
// spreadsheet-derived baseline plan (RAW). Server-only module (CommonJS).

const PLATFORMS = ["PT", "BP", "OKB", "CP"];

const METHODS = [
  { key: "launch", label: "首發" },
  { key: "exclusive", label: "客製獨家" },
  { key: "allplatform", label: "新遊戲全平台" },
  { key: "none", label: "一般上架" },
];

// 欄位一律「往後新增」，不要在中間插入或調整順序：
// 已儲存的排程是依欄位位置（第幾欄）存放的，改順序會讓既有標籤跑到錯的日期。
// 月份標籤在每年第一個月（及起始月）加註年份，避免 2026 與 2027 的月份混淆。
const MONTHS = [
  { label: "2026年6月", dates: ["既有", "6/30"] },
  { label: "7月", dates: ["7/17", "7/30"] },
  { label: "8月", dates: ["8/13", "8/31"] },
  { label: "9月", dates: ["9/15", "9/30"] },
  { label: "10月", dates: ["10/15", "10/29"] },
  { label: "11月", dates: ["11/16", "11/30"] },
  { label: "12月", dates: ["12/15", "12/31"] },
  { label: "2027年1月", dates: ["1/15", "1/29"] },
  { label: "2月", dates: ["2/15", "2/26"] },
  // ---- 2027 年 3 月～12 月（日期取接近 15 日與月底的平日，可依實際上線日調整文字）----
  { label: "3月", dates: ["3/15", "3/31"] },
  { label: "4月", dates: ["4/15", "4/30"] },
  { label: "5月", dates: ["5/14", "5/31"] },
  { label: "6月", dates: ["6/15", "6/30"] },
  { label: "7月", dates: ["7/15", "7/30"] },
  { label: "8月", dates: ["8/16", "8/31"] },
  { label: "9月", dates: ["9/15", "9/30"] },
  { label: "10月", dates: ["10/15", "10/29"] },
  { label: "11月", dates: ["11/15", "11/30"] },
  { label: "12月", dates: ["12/15", "12/31"] },
];

const DATE_COLS = MONTHS.flatMap((m) => m.dates); // 38 columns（2026/6 ～ 2027/12）

const G = (name, office, cat) => ({ name, office, cat });

// NOTE: this baseline was re-captured from the live production plan on
// 2026-07-02 (after the "還原初始規劃" feature was removed) so that this
// constant now reflects the team's real, current schedule rather than the
// original spreadsheet import. It is only ever used to seed a brand-new,
// empty database — once a deployment has data, this constant is ignored.
const RAW = {
  PT: {
    launch: [null, G("小魔女", "north", "mainstream"), G("多採多汁", "central", "mainstream"), null, G("龍來發-花好月圓", "north", "casino"), null, G("雷神爆金1000", "central", "mainstream"), null, G("金爆連連-孔雀迎福", "central", "casino"), null, G("Super Coins", "north", "mainstream"), null, null, G("Buffalo", "north", "mainstream"), null, null, null, null],
    exclusive: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    allplatform: [null, null, null, G("彩罐熱舞1000", "central", "mainstream"), null, G("放克猿", "north", "mainstream"), null, G("Olympus 2500", "central", "mainstream"), null, null, null, G("Super Bang Bang", "central", "mainstream"), G("寶石系列", "central", "mainstream"), G("福來發-財源滾滾", "north", "casino"), G("福來發-金將熊貓", "north", "casino"), G("Wild Bandito 亡靈", "north", "mainstream"), G("金龍發-金海龍王", "north", "casino"), null],
    none: [null, null, null, G("甜心派對", "north", "mainstream"), G("龍來發-金鳳飛舞", "north", "casino"), null, null, G("金碌發-春節盛典", "central", "casino"), null, G("Mike C", "central", "mainstream"), null, null, null, null, G("金齒乾坤", "central", "outsource"), null, null, null],
  },
  BP: {
    launch: [G("甜心派對", "north", "mainstream"), null, null, null, null, null, G("金碌發-春節盛典", "central", "casino"), null, G("Mike C", "central", "mainstream"), null, G("金爆連連-改", "central", "casino"), null, null, G("金齒乾坤", "central", "outsource"), null, null, null, null],
    exclusive: [null, null, G("巴塔拉 1000", "north", "custom"), null, G("奪寶魔怪", "central", "custom"), null, null, null, null, null, null, null, null, null, null, null, null, null],
    allplatform: [null, null, null, G("彩罐熱舞1000", "central", "mainstream"), null, G("放克猿", "north", "mainstream"), null, G("Olympus 2500", "central", "mainstream"), null, null, null, G("Super Bang Bang", "central", "mainstream"), G("寶石系列", "central", "mainstream"), G("福來發-財源滾滾", "north", "casino"), G("福來發-金將熊貓", "north", "casino"), G("Wild Bandito 亡靈", "north", "mainstream"), G("金龍發-金海龍王", "north", "casino"), null],
    none: [null, null, G("小魔女", "north", "mainstream"), G("龍來發-金鳳飛舞", "north", "casino"), G("多採多汁", "central", "mainstream"), G("龍來發-花好月圓", "north", "casino"), null, G("雷神爆金1000", "central", "mainstream"), null, null, G("金爆連連-孔雀迎福", "central", "casino"), G("Super Coins", "north", "mainstream"), null, null, G("Buffalo", "north", "mainstream"), null, null, null],
  },
  OKB: {
    launch: [G("超級寶石-輪盤版", "central", "mainstream"), G("龍來發-金鳳飛舞", "north", "casino"), null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    exclusive: [null, null, null, null, null, null, G("SEX BOMB Split", "north", "custom"), null, G("SEX BOMB WILD", "north", "custom"), null, G("SEXY BOMB MULTIPLE WILD", "north", "custom"), null, G("SEX BOMB MIX", "north", "custom"), null, null, null, null, null],
    allplatform: [null, null, null, G("彩罐熱舞1000", "central", "mainstream"), null, G("放克猿", "north", "mainstream"), null, G("Olympus 2500", "central", "mainstream"), null, null, null, G("Super Bang Bang", "central", "mainstream"), G("寶石系列", "central", "mainstream"), G("福來發-財源滾滾", "north", "casino"), G("福來發-金將熊貓", "north", "casino"), G("Wild Bandito 亡靈", "north", "mainstream"), G("金龍發-金海龍王", "north", "casino"), null],
    none: [null, null, G("小魔女", "north", "mainstream"), null, G("多採多汁", "central", "mainstream"), G("龍來發-花好月圓", "north", "casino"), null, G("金碌發-春節盛典", "central", "casino"), G("雷神爆金1000", "central", "mainstream"), G("Mike C", "central", "mainstream"), G("金爆連連-孔雀迎福", "central", "casino"), G("Super Coins", "north", "mainstream"), null, null, G("Buffalo", "north", "mainstream"), G("金齒乾坤", "central", "outsource"), null, null],
  },
  // CP is a newly added platform (no history yet) — starts fully empty so the
  // team can populate it themselves via drag-and-drop / the add-tag form.
  CP: {
    launch: new Array(DATE_COLS.length).fill(null),
    exclusive: new Array(DATE_COLS.length).fill(null),
    allplatform: new Array(DATE_COLS.length).fill(null),
    none: new Array(DATE_COLS.length).fill(null),
  },
};

// 基準資料原本只有 18 欄，日期擴充後把每一列補空到與 DATE_COLS 同長度
// （只在尾端補 null，既有的位置不變）。
Object.values(RAW).forEach((platformRows) =>
  Object.values(platformRows).forEach((row) => {
    while (row.length < DATE_COLS.length) row.push(null);
  })
);

module.exports = { PLATFORMS, METHODS, MONTHS, DATE_COLS, RAW };
