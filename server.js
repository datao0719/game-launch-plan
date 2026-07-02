const path = require("path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const { PLATFORMS, METHODS, MONTHS, DATE_COLS, RAW } = require("./gameData");
const store = require("./store");

const CAT_LABEL = {
  casino: "賭場遊戲",
  mainstream: "主流遊戲",
  custom: "客製遊戲",
  outsource: "外包遊戲",
};

const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.get("/healthz", (req, res) => res.send("ok"));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// ---------- in-memory canonical state (mirrored to the store on every change) ----------
let uidCounter = 1;
let STATE = null;

function toStateRow(rawRow) {
  return rawRow.map((slot) => (slot ? [{ ...slot, uid: uidCounter++ }] : []));
}

function buildBaselineState() {
  const state = {};
  PLATFORMS.forEach((p) => {
    state[p] = {};
    METHODS.forEach((m) => {
      state[p][m.key] = toStateRow(RAW[p][m.key]);
    });
  });
  state.staging = [];
  return state;
}

function recomputeUidCounter(state) {
  let max = 0;
  PLATFORMS.forEach((p) =>
    METHODS.forEach((m) => {
      (state[p][m.key] || []).forEach((cell) =>
        (cell || []).forEach((chip) => {
          if (chip.uid > max) max = chip.uid;
        })
      );
    })
  );
  (state.staging || []).forEach((chip) => {
    if (chip.uid > max) max = chip.uid;
  });
  uidCounter = max + 1;
}

async function initState() {
  const loaded = await store.loadState();
  if (loaded && PLATFORMS.every((p) => loaded[p])) {
    STATE = loaded;
    if (!STATE.staging) STATE.staging = [];
    recomputeUidCounter(STATE);
  } else {
    STATE = buildBaselineState();
    await store.saveState(STATE);
  }
}

async function persist() {
  try {
    await store.saveState(STATE);
  } catch (e) {
    console.error("Failed to persist state:", e.message);
  }
}

function findChipLocation(uid) {
  for (const p of PLATFORMS) {
    for (const m of METHODS) {
      const row = STATE[p][m.key];
      for (let i = 0; i < row.length; i++) {
        const arrIdx = row[i].findIndex((c) => c.uid === uid);
        if (arrIdx !== -1) return { area: "grid", p, m: m.key, i, arrIdx };
      }
    }
  }
  const sArr = STATE.staging.findIndex((c) => c.uid === uid);
  if (sArr !== -1) return { area: "staging", arrIdx: sArr };
  return null;
}

function getAllPlacements(excludeUid) {
  const out = [];
  PLATFORMS.forEach((p) =>
    METHODS.forEach((m) => {
      STATE[p][m.key].forEach((cell, i) => {
        cell.forEach((chip) => {
          if (chip.uid !== excludeUid) out.push({ p, m: m.key, idx: i, chip });
        });
      });
    })
  );
  return out;
}

function removeFromCurrentLocation(loc) {
  if (loc.area === "grid") return STATE[loc.p][loc.m][loc.i].splice(loc.arrIdx, 1)[0];
  return STATE.staging.splice(loc.arrIdx, 1)[0];
}

// ---------- validation rules (single source of truth, enforced server-side) ----------
// Rule 0: only a chip whose category is truly "custom" (客製遊戲) may sit in a
//         platform's "客製獨家" row at all.
// Rule 1: a "custom" chip sitting in some platform's "exclusive" row means the game
//         has been sold exclusively to that platform — the same game name may not
//         appear on any other platform.
// Rule 2: a chip sitting in some platform's "launch" row means that platform gets
//         the game first — the same game name may not appear on other platforms at
//         an earlier-or-equal date index.
function validateMove(chip, targetP, targetM, targetIdx) {
  const violations = [];

  if (targetM === "exclusive" && chip.cat !== "custom") {
    violations.push(
      `「${chip.name}」目前的遊戲類別是「${CAT_LABEL[chip.cat] || chip.cat}」，不是客製遊戲，不能放進客製獨家（賣斷）欄位。請先確認／更正遊戲類別。`
    );
  }

  const placements = getAllPlacements(chip.uid);
  const sameName = placements.filter((pl) => pl.chip.name === chip.name);

  if (targetM === "exclusive" && chip.cat === "custom") {
    const others = sameName.filter((pl) => pl.p !== targetP);
    if (others.length) {
      const where = [...new Set(others.map((o) => o.p))].join("、");
      violations.push(`「${chip.name}」已規劃出現在 ${where}，無法設為 ${targetP} 的客製獨家（賣斷）遊戲。`);
    }
  }

  const lockedElsewhere = sameName.filter((pl) => pl.p !== targetP && pl.m === "exclusive" && pl.chip.cat === "custom");
  if (lockedElsewhere.length) {
    const where = [...new Set(lockedElsewhere.map((o) => o.p))].join("、");
    violations.push(`「${chip.name}」已賣斷給 ${where} 的客製獨家，不能出現在 ${targetP}。`);
  }

  if (targetM === "launch") {
    const earlyOthers = sameName.filter((pl) => pl.p !== targetP && pl.idx <= targetIdx);
    if (earlyOthers.length) {
      const where = [...new Set(earlyOthers.map((o) => `${o.p}（${DATE_COLS[o.idx]}）`))].join("、");
      violations.push(`「${chip.name}」已提早出現在 ${where}，不能將 ${targetP} 設為首發。`);
    }
  }

  const otherLaunches = sameName.filter((pl) => pl.p !== targetP && pl.m === "launch");
  otherLaunches.forEach((ol) => {
    if (targetIdx <= ol.idx) {
      violations.push(`「${chip.name}」已規劃為 ${ol.p} 的首發（${DATE_COLS[ol.idx]}），${targetP} 不可早於或等於此日期上架。`);
    }
  });

  return violations;
}

function isValidTarget(p, m, idx) {
  return PLATFORMS.includes(p) && METHODS.some((mm) => mm.key === m) && Number.isInteger(idx) && idx >= 0 && idx < DATE_COLS.length;
}

// ---------- socket wiring ----------
let viewerCount = 0;

io.on("connection", (socket) => {
  viewerCount++;
  io.emit("viewers", viewerCount);
  socket.emit("state", STATE);
  socket.emit("meta", { PLATFORMS, METHODS, MONTHS, DATE_COLS });

  socket.on("disconnect", () => {
    viewerCount = Math.max(0, viewerCount - 1);
    io.emit("viewers", viewerCount);
  });

  socket.on("move-chip", async ({ uid, targetP, targetM, targetIdx }) => {
    try {
      if (!isValidTarget(targetP, targetM, targetIdx)) return;
      const loc = findChipLocation(uid);
      if (!loc) return;
      if (loc.area === "grid" && loc.p === targetP && loc.m === targetM && loc.i === targetIdx) return;

      const chipRef = loc.area === "grid" ? STATE[loc.p][loc.m][loc.i][loc.arrIdx] : STATE.staging[loc.arrIdx];
      const violations = validateMove(chipRef, targetP, targetM, targetIdx);
      if (violations.length) {
        socket.emit("action-rejected", { message: violations.join("\n") });
        return;
      }
      const chip = removeFromCurrentLocation(loc);
      STATE[targetP][targetM][targetIdx].push(chip);
      await persist();
      io.emit("state", STATE);
    } catch (e) {
      console.error(e);
      socket.emit("action-rejected", { message: "伺服器發生錯誤，請重試。" });
    }
  });

  socket.on("move-to-staging", async ({ uid }) => {
    try {
      const loc = findChipLocation(uid);
      if (!loc || loc.area === "staging") return;
      const chip = removeFromCurrentLocation(loc);
      STATE.staging.push(chip);
      await persist();
      io.emit("state", STATE);
    } catch (e) {
      console.error(e);
    }
  });

  socket.on("add-chip", async ({ name, cat, office }) => {
    try {
      name = (name || "").trim().slice(0, 60);
      if (!name) return socket.emit("action-rejected", { message: "請輸入遊戲名稱。" });
      if (!CAT_LABEL[cat]) return socket.emit("action-rejected", { message: "請選擇有效的遊戲類別。" });
      if (office !== "north" && office !== "central") return socket.emit("action-rejected", { message: "請選擇有效的開發辦公室。" });
      STATE.staging.push({ uid: uidCounter++, name, cat, office });
      await persist();
      io.emit("state", STATE);
    } catch (e) {
      console.error(e);
    }
  });

  socket.on("delete-chip", async ({ uid }) => {
    try {
      const loc = findChipLocation(uid);
      if (!loc) return;
      removeFromCurrentLocation(loc);
      await persist();
      io.emit("state", STATE);
    } catch (e) {
      console.error(e);
    }
  });

  socket.on("restore-plan", async () => {
    try {
      STATE = buildBaselineState();
      await persist();
      io.emit("state", STATE);
    } catch (e) {
      console.error(e);
    }
  });
});

const PORT = process.env.PORT || 3000;
initState().then(() => {
  server.listen(PORT, () => {
    console.log(`Game launch plan server listening on :${PORT} (storage: ${store.usePg() ? "postgres" : "local file"})`);
  });
});
