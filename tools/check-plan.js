// 每月組車計畫檢查：不用開網頁、不用 AI，先找出會讓負荷算不準的資料問題
//
// 用法（在 k1-bom-tool 資料夾）：
//   node tools/check-plan.js                       → 自動找資料夾裡最新的「組車計畫*.xlsx」
//   node tools/check-plan.js 某路徑\組車計畫10-0.xlsx → 指定檔案
//   加上 --no-save                                  → 不寫入檢查紀錄（只想看看時用）
//
// 資料夾在專案外：D:\排產系統\K1資料（與 k1-bom-tool 同一層），不會被上傳。
// 要換位置可設定環境變數 K1_DATA。
//
// 每次檢查會把「組車代號、用到的部品」記在資料夾裡的 .檢查紀錄.json，
// 下個月再檢查時就能列出新出現的組車代號、機種與部品。
//
// 計算規則與網頁版相同：機種代號去星號與國別、日期從 G 欄開始、跨月依實際日期歸月。

const fs = require('fs');
const path = require('path');
const XLSX = require(path.join(__dirname, '..', 'libs', 'xlsx.full.min.js'));

const ROOT = path.join(__dirname, '..');
const DATA = process.env.K1_DATA || path.join(ROOT, '..', 'K1資料');
const PROCESS_LINES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I1', 'I2', 'O', 'P', 'Q', 'R', 'S'];

const text = v => (v === null || v === undefined ? '' : String(v).trim());
const normalizeModel = v =>
  text(v).replace(/^\*+|\*+$/g, '').trim().toUpperCase().replace(/\s*\([A-Z]{2,3}\)\s*$/, '');
const normalizeLine = v => {
  const t = text(v);
  const base = t.replace(/\s*LINE$/i, '').trim().toUpperCase();
  return PROCESS_LINES.includes(base) ? base : t;
};
const lineLabel = l => (PROCESS_LINES.includes(l) ? `${l} LINE` : l);
const fmt = n => n.toLocaleString('zh-TW');
const readBook = file => XLSX.read(fs.readFileSync(file), { type: 'buffer' });

let problems = 0;
const warn = msg => { problems++; console.log(`  ⚠ ${msg}`); };
const ok = msg => console.log(`  ✓ ${msg}`);
const title = msg => console.log(`\n■ ${msg}`);

// ---------- 找檔案 ----------
function findPlanFile() {
  const arg = process.argv.slice(2).find(a => !a.startsWith('--'));
  if (arg) return path.resolve(arg);
  const files = fs.readdirSync(DATA)
    .filter(f => /^組車計畫.*\.xlsx?$/i.test(f))
    .map(f => ({ f, t: fs.statSync(path.join(DATA, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  if (!files.length) throw new Error(`${DATA} 裡找不到「組車計畫*.xlsx」`);
  return path.join(DATA, files[0].f);
}

function mustExist(file) {
  if (!fs.existsSync(file)) throw new Error(`找不到 ${file}`);
  return file;
}

// ---------- 組車計畫 ----------
function dateColumns(header) {
  const cols = {};
  let y = null, m = null, prev = null;
  for (let c = 6; c < header.length; c++) {
    if (header[c] === null || header[c] === '') continue;
    const v = Number(header[c]);
    if (!Number.isFinite(v)) continue;
    if (v > 31) {
      const p = XLSX.SSF.parse_date_code(v);
      if (!p) continue;
      y = p.y; m = p.m; prev = p.d;
      cols[c] = `${y}-${String(m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
      continue;
    }
    if (v < 1 || y === null) continue;
    if (prev !== null && v < prev) { m++; if (m > 12) { m = 1; y++; } }
    prev = v;
    cols[c] = `${y}-${String(m).padStart(2, '0')}-${String(v).padStart(2, '0')}`;
  }
  return cols;
}

function readPlan(file) {
  const wb = readBook(file);
  const sheetName = wb.SheetNames.includes('AE線') ? 'AE線' : wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: null, raw: true });

  let section = '(未分段)';
  let cols = {};
  const daily = {};            // 日期 → 機種 → 台數
  const sections = {};         // 段 → 台數
  const mismatch = [];
  const rawCodes = {};         // 組車代號（計畫上原本的寫法）→ { model, section, qty }

  rows.forEach(r => {
    if (/^AE-\d/i.test(text(r[0]))) section = text(r[0]);
    if (text(r[1]).toUpperCase() === 'NO') { cols = dateColumns(r); return; }
    if (r[1] === null || !Number.isFinite(Number(r[1])) || !text(r[2])) return;

    const model = normalizeModel(r[2]);
    const qty = Number(r[5]);
    if (!model || !Number.isFinite(qty) || qty <= 0) return;

    let sum = 0;
    Object.entries(cols).forEach(([c, d]) => {
      const q = Number(r[c]);
      if (!Number.isFinite(q) || q <= 0) return;
      sum += Math.trunc(q);
      daily[d] = daily[d] || {};
      daily[d][model] = (daily[d][model] || 0) + Math.trunc(q);
    });

    sections[section] = (sections[section] || 0) + Math.trunc(qty);
    if (sum !== Math.trunc(qty)) mismatch.push(`${section} ${text(r[2])}：台數欄 ${qty}，每日合計 ${sum}`);

    const raw = text(r[2]).replace(/\s+/g, '');
    if (!rawCodes[raw]) rawCodes[raw] = { model, sections: new Set(), qty: 0 };
    rawCodes[raw].sections.add(section);
    rawCodes[raw].qty += Math.trunc(qty);
  });

  return { sheetName, daily, sections, mismatch, rawCodes };
}

// ---------- BOM ----------
function readBOM(file) {
  const wb = readBook(file);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const header = (raw[0] || []).map(text);

  const unnamed = [];
  header.forEach((h, c) => {
    if (h) return;
    const used = raw.slice(1).some(r => text(r[c]));
    if (used) unnamed.push(XLSX.utils.encode_col(c));
  });
  // 網頁版只讀有欄名的欄位
  raw.slice(1).forEach(r => {
    for (let c = header.length; c < r.length; c++) {
      if (text(r[c]) && !unnamed.includes(XLSX.utils.encode_col(c))) unnamed.push(XLSX.utils.encode_col(c));
    }
  });

  const types = header.filter(h => h && h !== '機種代號');
  const bom = {};
  XLSX.utils.sheet_to_json(ws, { defval: '' }).forEach(r => {
    const model = normalizeModel(r['機種代號']);
    if (!model) return;
    bom[model] = types
      .map(t => text(r[t]).toUpperCase())
      .filter(code => code && !/^[-－–—−]+$/.test(code));
  });

  return { bom, types, unnamed, hasModelColumn: header.includes('機種代號') };
}

// ---------- 加工部品主檔 ----------
function readPartMaster(file) {
  const wb = readBook(file);
  const ws = wb.Sheets['部品主檔'];
  if (!ws) throw new Error('加工部品主檔.xlsx 裡找不到「部品主檔」工作表');
  const lineOf = {};
  XLSX.utils.sheet_to_json(ws, { defval: '' }).forEach(r => {
    const code = text(r['部品代號']).toUpperCase();
    if (code) lineOf[code] = normalizeLine(r['加工線別']);
  });
  return lineOf;
}

// ---------- 主程式 ----------
function main() {
  const planFile = mustExist(findPlanFile());
  const bomFile = mustExist(path.join(DATA, 'BOM主檔.xlsx'));
  const partFile = mustExist(path.join(DATA, '加工部品主檔.xlsx'));

  console.log('K1 每月組車計畫檢查');
  console.log(`資料夾：${DATA}`);
  console.log(`組車計畫：${path.basename(planFile)}`);

  const plan = readPlan(planFile);
  const { bom, unnamed, hasModelColumn } = readBOM(bomFile);
  const lineOf = readPartMaster(partFile);

  // 1. 組車計畫本身
  title('組車計畫格式');
  const dates = Object.keys(plan.daily).sort();
  if (!dates.length) {
    warn('讀不到任何日期與台數：確認 B 欄有「NO」表頭列，日期從 G 欄開始');
  } else {
    ok(`工作表「${plan.sheetName}」，日期 ${dates[0]} ～ ${dates[dates.length - 1]}，共 ${dates.length} 個生產日`);
  }
  Object.entries(plan.sections).forEach(([s, q]) => console.log(`    ${s}：${fmt(q)} 台`));
  if (plan.mismatch.length) {
    warn(`${plan.mismatch.length} 列的「台數」與每日合計不符（可能有日期欄沒讀到）：`);
    plan.mismatch.slice(0, 10).forEach(m => console.log(`      ${m}`));
  } else {
    ok('每列台數都等於每日合計');
  }

  // 2. BOM
  title('BOM 主檔');
  if (!hasModelColumn) warn('BOM 主檔第一列找不到「機種代號」欄');
  if (unnamed.length) warn(`第 ${unnamed.join('、')} 欄有資料但沒有欄名，網頁版會忽略，請補上部品種類代號`);
  else ok('每個有資料的欄位都有欄名');

  const noBOM = {}, emptyBOM = {};
  const load = {};          // 線別 → 月 → 件數
  const unassigned = {};    // 部品 → 件數
  const notInMaster = new Set();
  const unitsByMonth = {};

  Object.entries(plan.daily).forEach(([d, models]) => {
    const month = d.slice(0, 7);
    Object.entries(models).forEach(([model, q]) => {
      unitsByMonth[month] = (unitsByMonth[month] || 0) + q;
      const codes = bom[model];
      if (!codes) { noBOM[model] = (noBOM[model] || 0) + q; return; }
      if (!codes.length) { emptyBOM[model] = (emptyBOM[model] || 0) + q; return; }
      codes.forEach(code => {
        if (!(code in lineOf)) notInMaster.add(code);
        const line = lineOf[code] || '未設定線別';
        load[line] = load[line] || {};
        load[line][month] = (load[line][month] || 0) + q;
        if (!lineOf[code]) unassigned[code] = (unassigned[code] || 0) + q;
      });
    });
  });

  const top = (obj, n = 15) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n);
  const total = obj => Object.values(obj).reduce((a, b) => a + b, 0);

  if (Object.keys(noBOM).length) {
    warn(`${Object.keys(noBOM).length} 個機種在 BOM 找不到，共 ${fmt(total(noBOM))} 台（台數最多的前 15 個）：`);
    top(noBOM).forEach(([m, q]) => console.log(`      ${m.padEnd(10)} ${fmt(q)} 台`));
  } else ok('計畫裡的機種都有 BOM');

  if (Object.keys(emptyBOM).length) {
    warn(`${Object.keys(emptyBOM).length} 個機種的 BOM 沒填任何部品，共 ${fmt(total(emptyBOM))} 台（確定不需加工可略過）：`);
    top(emptyBOM, 10).forEach(([m, q]) => console.log(`      ${m.padEnd(10)} ${fmt(q)} 台`));
  }

  // 3. 加工部品主檔
  title('加工部品主檔');
  if (notInMaster.size) warn(`${notInMaster.size} 個部品不在部品主檔：${[...notInMaster].slice(0, 10).join('、')}`);
  else ok('用到的部品都在部品主檔');

  if (Object.keys(unassigned).length) {
    warn(`${Object.keys(unassigned).length} 個部品沒設定加工線別，共 ${fmt(total(unassigned))} 件（件數最多的前 15 個）：`);
    top(unassigned).forEach(([c, q]) => console.log(`      ${c.padEnd(20)} ${fmt(q)} 件`));
  } else ok('用到的部品都有加工線別');

  // 4. 負荷預覽
  title('加工線月負荷預覽（件）');
  const months = Object.keys(unitsByMonth).sort();
  const order = l => (l === '未設定線別' ? 999 : PROCESS_LINES.includes(l) ? PROCESS_LINES.indexOf(l) : 100);
  const lines = Object.keys(load).sort((a, b) => order(a) - order(b) || a.localeCompare(b, 'zh-TW'));
  const pad = (s, n) => s + ' '.repeat(Math.max(0, n - [...s].reduce((w, ch) => w + (ch.charCodeAt(0) > 255 ? 2 : 1), 0)));
  console.log('    ' + pad('加工線', 14) + months.map(m => m.padStart(10)).join(''));
  lines.forEach(l => {
    console.log('    ' + pad(lineLabel(l), 14) + months.map(m => fmt(load[l][m] || 0).padStart(10)).join(''));
  });
  console.log('    ' + pad('組車台數', 14) + months.map(m => fmt(unitsByMonth[m]).padStart(10)).join(''));

  // 5. 與上一份組車計畫比較
  title('與上一份組車計畫比較');
  const historyFile = path.join(DATA, '.檢查紀錄.json');
  let history = {};
  try { history = JSON.parse(fs.readFileSync(historyFile, 'utf8')); } catch (e) { history = {}; }

  const planKey = path.basename(planFile);
  const usedParts = new Set();
  Object.values(plan.daily).forEach(models => Object.keys(models).forEach(model => {
    (bom[model] || []).forEach(code => usedParts.add(code));
  }));
  const current = {
    檢查時間: new Date().toISOString(),
    月份: months,
    組車代號: Object.fromEntries(Object.entries(plan.rawCodes).map(([raw, v]) => [raw, v.model])),
    部品: [...usedParts].sort()
  };

  const previousKey = Object.keys(history)
    .filter(k => k !== planKey)
    .sort((a, b) => String(history[b].檢查時間).localeCompare(String(history[a].檢查時間)))[0];

  if (!previousKey) {
    console.log('  （這是第一份檢查紀錄，下個月起會列出新增的組車代號、機種與部品）');
  } else {
    const prev = history[previousKey];
    console.log(`  比較對象：${previousKey}`);

    const prevCodes = prev.組車代號 || {};
    const prevModels = new Set(Object.values(prevCodes));
    const prevParts = new Set(prev.部品 || []);

    const newCodes = Object.entries(plan.rawCodes).filter(([raw]) => !(raw in prevCodes));
    const goneCodes = Object.keys(prevCodes).filter(raw => !(raw in plan.rawCodes));
    const newModels = [...new Set(newCodes.map(([, v]) => v.model))].filter(m => !prevModels.has(m));
    const newParts = [...usedParts].filter(c => !prevParts.has(c));

    if (newCodes.length) {
      warn(`新出現 ${newCodes.length} 個組車代號：`);
      newCodes.sort((a, b) => b[1].qty - a[1].qty).slice(0, 20).forEach(([raw, v]) => {
        const status = !bom[v.model] ? '⟵ BOM 沒有此機種' : !bom[v.model].length ? '⟵ BOM 沒填部品' : '';
        console.log(`      ${raw.padEnd(16)} → 機種 ${v.model.padEnd(8)} ${[...v.sections].join('/')}  ${fmt(v.qty)} 台 ${status}`);
      });
    } else ok('沒有新的組車代號');

    if (newModels.length) warn(`其中 ${newModels.length} 個是新機種：${newModels.join('、')}`);

    if (newParts.length) {
      const noLine = newParts.filter(c => !lineOf[c]);
      warn(`新用到 ${newParts.length} 個部品${noLine.length ? `，其中 ${noLine.length} 個還沒設加工線別` : ''}：`);
      newParts.forEach(c => console.log(`      ${c.padEnd(20)} ${lineOf[c] ? lineLabel(lineOf[c]) : '⟵ 未設定線別'}`));
    } else ok('沒有新用到的部品');

    if (goneCodes.length) console.log(`  ・本月不再出現 ${goneCodes.length} 個組車代號：${goneCodes.slice(0, 15).join('、')}${goneCodes.length > 15 ? ' 等' : ''}`);
  }

  if (!process.argv.includes('--no-save')) {
    history[planKey] = current;
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2), 'utf8');
  }

  // 結論
  title('結論');
  if (problems === 0) console.log('  可以直接到網頁「生產計畫」匯入。');
  else console.log(`  共 ${problems} 類問題。先補 BOM／部品主檔再匯入，負荷才會準；不補也能匯入，只是那些台數不會算進加工線。`);
}

try {
  main();
} catch (error) {
  console.error(`\n檢查失敗：${error.message}`);
  process.exit(1);
}
