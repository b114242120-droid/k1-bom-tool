// ===== CONSTANTS =====
const BOM_KEY  = 'k1_bom_data';
const PLAN_KEY = 'k1_production_plan';
const PENDING_KEY = 'k1_pending_bom';
const DAILY_PLAN_KEY = 'k1_daily_production_plan';
const PART_LINE_KEY = 'k1_part_lines';

const PART_TYPES = ['L CASE', 'R CASE', 'L COVER', 'R COVER', 'M CASE', 'UPPER CASE', 'BED CASE'];

const PART_TAG_CLASS = {
  'L CASE':    'tag-lcase',
  'R CASE':    'tag-rcase',
  'L COVER':   'tag-lcover',
  'R COVER':   'tag-rcover',
  'M CASE':    'tag-mcase',
  'UPPER CASE':'tag-upper',
  'BED CASE':  'tag-bed',
};

// ===== STORAGE =====
function loadBOM()   { return JSON.parse(localStorage.getItem(BOM_KEY)  || '{}'); }
function saveBOM(d)  { localStorage.setItem(BOM_KEY,  JSON.stringify(d)); }
function loadPlan()  { return JSON.parse(localStorage.getItem(PLAN_KEY) || '[]'); }
function savePlan(d) { localStorage.setItem(PLAN_KEY, JSON.stringify(d)); }
function loadPending() { return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');}
function savePending(d) { localStorage.setItem(PENDING_KEY, JSON.stringify(d));}
function loadDailyPlan() { return JSON.parse(localStorage.getItem(DAILY_PLAN_KEY) || '{}'); }
function saveDailyPlan(d) { localStorage.setItem(DAILY_PLAN_KEY, JSON.stringify(d)); }
function loadPartLines() { return JSON.parse(localStorage.getItem(PART_LINE_KEY) || '{}'); }
function savePartLines(d) { localStorage.setItem(PART_LINE_KEY, JSON.stringify(d)); }

// ===== TAB =====
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'daily') renderDailyParts();
    if (btn.dataset.tab === 'part-lines') renderPartLineSettings();
    if (btn.dataset.tab === 'result') renderResult();
  });
});

// ===== BOM TAB =====
function renderBOM() {
  const bom = loadBOM();
const allKeys = Object.keys(bom);
const keyword = (document.getElementById('bom-search-input')?.value || '').trim().toUpperCase();

const keys = allKeys.filter(model => {
  const row = bom[model];

  if (!keyword) return true;
  if (model.toUpperCase().includes(keyword)) return true;

  return PART_TYPES.some(pt =>
    String(row[pt] || '').toUpperCase().includes(keyword)
  );
});
  const tbody = document.getElementById('bom-tbody');
  const empty = document.getElementById('bom-empty');
  const countEl = document.getElementById('bom-count');

  countEl.textContent = keyword
  ? `${keys.length} / ${allKeys.length} 筆機種`
  : `${allKeys.length} 筆機種`;

  if (keys.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = keys.map(model => {
    const row = bom[model];
    const cells = PART_TYPES.map(pt => {
      const code = row[pt] || '';
      return `<td>${code
        ? `<span class="part-code">${esc(code)}</span>`
        : `<span class="part-code empty">—</span>`}</td>`;
    }).join('');
    return `<tr>
      <td><span class="model-code">${esc(model)}</span></td>
      ${cells}
      <td>
        <div style="display:flex;gap:0.4rem">
          <button class="btn btn-secondary btn-icon btn-sm" onclick="openEditModal('${esc(model)}')">✏️</button>
          <button class="btn btn-danger btn-icon btn-sm" onclick="deleteModel('${esc(model)}')">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function deleteModel(model) {
  if (!confirm(`確定刪除機種「${model}」的 BOM 資料？`)) return;
  const bom = loadBOM();
  delete bom[model];
  saveBOM(bom);
  renderBOM();
  refreshPlanSelect();
  toast('已刪除 ' + model, 'success');
}

// ===== MODAL =====
let editingModel = null;

function openAddModal() {
  editingModel = null;
  document.getElementById('modal-title').textContent = '新增機種 BOM';
  document.getElementById('modal-model').value = '';
  document.getElementById('modal-model').disabled = false;
  PART_TYPES.forEach(pt => {
    document.getElementById('field-' + pt.replace(/ /g, '_')).value = '';
  });
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById('modal-model').focus();
}

function openEditModal(model) {
  editingModel = model;
  const bom = loadBOM();
  const row = bom[model] || {};
  document.getElementById('modal-title').textContent = '編輯機種 BOM';
  document.getElementById('modal-model').value = model;
  document.getElementById('modal-model').disabled = true;
  PART_TYPES.forEach(pt => {
    document.getElementById('field-' + pt.replace(/ /g, '_')).value = row[pt] || '';
  });
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  editingModel = null;
}

function saveModal() {
  const model = document.getElementById('modal-model').value.trim().toUpperCase();
  if (!model) { toast('請輸入機種代號', 'error'); return; }

  const bom = loadBOM();
  if (!editingModel && bom[model]) { toast('機種代號已存在', 'error'); return; }

  const row = {};
  PART_TYPES.forEach(pt => {
    const val = document.getElementById('field-' + pt.replace(/ /g, '_')).value.trim().toUpperCase();
    row[pt] = val;
  });

  const isEditing = Boolean(editingModel);

bom[model] = row;
saveBOM(bom);

const pending = loadPending();
const pendingItem = pending.find(item => item.model === model);

if (pendingItem) {
  const plan = loadPlan();
  const existing = plan.find(item => item.model === model);

  if (existing) {
    existing.qty += pendingItem.qty;
  } else {
    plan.push({ model, qty: pendingItem.qty });
  }

  savePlan(plan);
  savePending(pending.filter(item => item.model !== model));
}

closeModal();
renderBOM();
renderPlan();
renderPending();
refreshPlanSelect();

if (pendingItem) {
  toast(`已建立 ${model}，並加入生產計畫 ${pendingItem.qty} 台`, 'success');
} else {
  toast((isEditing ? '已更新 ' : '已新增 ') + model, 'success');
}
}

// close on overlay click
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});

// ===== PRODUCTION TAB =====
function refreshPlanSelect() {
  const bom  = loadBOM();
  const sel  = document.getElementById('plan-model-select');
  const keys = Object.keys(bom);
  sel.innerHTML = '<option value="">-- 選擇機種代號 --</option>' +
    keys.map(k => `<option value="${esc(k)}">${esc(k)}</option>`).join('');
}

function addPlanItem() {
  const model = document.getElementById('plan-model-select').value;
  const qty   = parseInt(document.getElementById('plan-qty').value, 10);

  if (!model) { toast('請選擇機種代號', 'error'); return; }
  if (!qty || qty <= 0) { toast('請輸入有效數量', 'error'); return; }

  const plan = loadPlan();
  const existing = plan.find(p => p.model === model);
  if (existing) {
    existing.qty += qty;
    toast(`已累加 ${model} × ${qty}，目前共 ${existing.qty} 台`, 'success');
  } else {
    plan.push({ model, qty });
    toast(`已加入 ${model} × ${qty}`, 'success');
  }
  savePlan(plan);
  renderPlan();
  document.getElementById('plan-qty').value = '';
  document.getElementById('plan-model-select').value = '';
}

function removePlanItem(model) {
  const plan = loadPlan().filter(p => p.model !== model);
  savePlan(plan);
  renderPlan();
  toast('已移除 ' + model, 'success');
}

function clearPlan() {
  if (!confirm('確定清空生產計畫與每日部品計畫？')) return;

  savePlan([]);
  savePending([]);
  saveDailyPlan({});

  renderPlan();
  renderPending();
  renderDailyParts();
  renderResult();

  toast('已清空生產計畫與每日部品計畫', 'success');
}

function renderPlan() {
  const plan = loadPlan();
  const el   = document.getElementById('plan-list');
  const empty= document.getElementById('plan-empty');
  const countEl = document.getElementById('plan-count');

  const total = plan.reduce((s, p) => s + p.qty, 0);
  countEl.textContent = plan.length + ' 筆 / 共 ' + total + ' 台';

  if (plan.length === 0) {
    el.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  el.innerHTML = plan.map(p => `
    <div class="plan-item">
      <div class="plan-item-info">
        <span class="plan-item-model">${esc(p.model)}</span>
        <span class="plan-item-qty">生產數量</span>
        <span class="qty-badge">${p.qty} 台</span>
      </div>
      <button class="btn btn-danger btn-icon btn-sm" onclick="removePlanItem('${esc(p.model)}')">✕</button>
    </div>
  `).join('');
}

// ===== PENDING BOM =====
function renderPending() {
  const pending = loadPending();
  const listEl = document.getElementById('pending-list');
  const emptyEl = document.getElementById('pending-empty');
  const countEl = document.getElementById('pending-count');

  countEl.textContent = `${pending.length} 筆待處理`;

  if (pending.length === 0) {
    listEl.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  } // 無待處理資料

  emptyEl.style.display = 'none';

  listEl.innerHTML = pending.map(item => `
    <div class="plan-item">
      <div class="plan-item-info">
        <span class="plan-item-model">${esc(item.model)}</span>
        <span class="plan-item-qty">尚未建立 BOM</span>
        <span class="qty-badge">${item.qty} 台</span>
      </div>
      <button class="btn btn-primary btn-sm" onclick="openPendingBOM('${esc(item.model)}')">＋ 建立 BOM</button>
    </div>
  `).join('');
} // renderPending 結束

function openPendingBOM(model) {
  openAddModal();
  document.getElementById('modal-title').textContent = '建立待處理 BOM';
  document.getElementById('modal-model').value = model;
  document.getElementById('field-L_CASE').focus();
} // openPendingBOM 結束

// ===== DAILY PARTS PLAN =====
function calculateDailyParts() {
  const dailyPlan = loadDailyPlan();
  const bom = loadBOM();
  const result = {};

  Object.entries(dailyPlan).forEach(([dateKey, models]) => {
    Object.entries(models).forEach(([model, qty]) => {
      const modelBOM = bom[model];
      if (!modelBOM) return;

      PART_TYPES.forEach(partType => {
        const code = modelBOM[partType];
        if (!code) return;

        const key = `${partType}__${code}`;

        if (!result[key]) {
          result[key] = {
            type: partType,
            code,
            total: 0,
            dates: {}
          };
        }

        result[key].dates[dateKey] =
          (result[key].dates[dateKey] || 0) + qty;

        result[key].total += qty;
      }); // 部品計算結束
    }); // 機種計算結束
  }); // 日期計算結束

  return Object.values(result).sort((a, b) => {
    const typeOrder =
      PART_TYPES.indexOf(a.type) - PART_TYPES.indexOf(b.type);

    if (typeOrder !== 0) return typeOrder;
    return a.code.localeCompare(b.code);
  });
} // calculateDailyParts 結束

function formatDailyDate(dateKey) {
  const parts = dateKey.split('-');
  return `${Number(parts[1])}/${Number(parts[2])}`;
} // formatDailyDate 結束

function collectBOMParts() {
  const bom = loadBOM();
  const parts = {};

  Object.entries(bom).forEach(([model, row]) => {
    PART_TYPES.forEach(type => {
      const code = String(row[type] || '').trim();
      if (!code) return;

      const key = `${type}__${code}`;

      if (!parts[key]) {
        parts[key] = {
          type,
          code,
          models: []
        };
      }

      if (!parts[key].models.includes(model)) {
        parts[key].models.push(model);
      }
    });
  });

  return Object.values(parts).sort((a, b) => {
    const typeOrder =
      PART_TYPES.indexOf(a.type) - PART_TYPES.indexOf(b.type);

    if (typeOrder !== 0) return typeOrder;
    return a.code.localeCompare(b.code);
  });
} // collectBOMParts 結束

function renderPartLineSettings() {
  const data = collectBOMParts();
  const partLines = loadPartLines();

  const tbody = document.getElementById('part-line-tbody');
  const empty = document.getElementById('part-line-empty');
  const summary = document.getElementById('part-line-summary');

  if (data.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    summary.textContent = '尚無部品資料';
    return;
  }

  empty.style.display = 'none';
  summary.textContent = `共 ${data.length} 筆部品`;

  tbody.innerHTML = data.map(item => `
    <tr>
      <td>
        <span class="part-type-tag ${PART_TAG_CLASS[item.type]}">
          ${esc(item.type)}
        </span>
      </td>

      <td>
        <span class="part-code">${esc(item.code)}</span>
      </td>

      <td>${item.models.map(model => esc(model)).join('、')}</td>

      <td>
        <input
          type="text"
          value="${esc(partLines[item.code] || '')}"
          placeholder="未設定"
          data-part-code="${esc(item.code)}"
          onchange="updatePartLine(this.dataset.partCode, this.value)"
          style="width:120px"
        >
      </td>
    </tr>
  `).join('');
} // renderPartLineSettings 結束

function updatePartLine(partCode, lineName) {
  const partLines = loadPartLines();
  const value = lineName.trim();

  if (value) {
    partLines[partCode] = value;
  } else {
    delete partLines[partCode];
  }

  savePartLines(partLines);
  renderDailyParts();
  renderPartLineSettings();
  toast(`已儲存 ${partCode} 的加工線別`, 'success');
} // updatePartLine 結束

function renderDailyParts() {
  const dailyPlan = loadDailyPlan();
  const partLines = loadPartLines();
  const dates = Object.keys(dailyPlan).sort();
  const data = calculateDailyParts();  

  const thead = document.getElementById('daily-parts-thead');
  const tbody = document.getElementById('daily-parts-tbody');
  const empty = document.getElementById('daily-parts-empty');
  const summary = document.getElementById('daily-plan-summary');

  if (dates.length === 0 || data.length === 0) {
    thead.innerHTML = '';
    tbody.innerHTML = '';
    empty.style.display = 'block';
    summary.textContent = '尚未匯入每日生產資料';
    return;
  } // 無每日資料

  empty.style.display = 'none';
  summary.textContent =
    `${data.length} 種部品／${dates.length} 個生產日期`;

  thead.innerHTML = `
    <tr>
      <th>加工線別</th>
      <th>部品類型</th>
      <th>部品代號</th>
      <th>總數</th>
      ${dates.map(dateKey =>
        `<th>${formatDailyDate(dateKey)}</th>`
      ).join('')}
    </tr>
  `;

  tbody.innerHTML = data.map(item => `
    <tr>
      <td>
        <input
          type="text"
          value="${esc(partLines[item.code] || '')}"
          placeholder="未設定"
          data-part-code="${esc(item.code)}"
          onchange="updatePartLine(this.dataset.partCode, this.value)"
          style="width:100px"
        >
      </td>

    <td>
      <span class="part-type-tag ${PART_TAG_CLASS[item.type]}">
        ${esc(item.type)}
      </span>
    </td>
      <td><span class="part-code">${esc(item.code)}</span></td>
      <td class="qty-cell">${item.total}</td>
      ${dates.map(dateKey =>
        `<td>${item.dates[dateKey] || '—'}</td>`
      ).join('')}
    </tr>
  `).join('');
} // renderDailyParts 結束

// ===== RESULT TAB =====
function calculate() {
  const bom  = loadBOM();
  const plan = loadPlan();
  // result: partCode -> { type, code, qty, models[] }
  const result = {};

  for (const { model, qty } of plan) {
    const modelBOM = bom[model];
    if (!modelBOM) continue;
    for (const pt of PART_TYPES) {
      const code = modelBOM[pt];
      if (!code) continue;
      if (!result[code]) result[code] = { type: pt, code, qty: 0, models: [] };
      result[code].qty += qty;
      result[code].models.push(`${model}×${qty}`);
    }
  }
  return Object.values(result).sort((a, b) =>
    PART_TYPES.indexOf(a.type) - PART_TYPES.indexOf(b.type)
  );
}

function renderResult() {
  const data  = calculate();
  const tbody = document.getElementById('result-tbody');
  const empty = document.getElementById('result-empty');
  const plan  = loadPlan();

  // stats
  const totalModels = plan.length;
  const totalUnits  = plan.reduce((s, p) => s + p.qty, 0);
  const totalParts  = data.length;
  const totalQty    = data.reduce((s, d) => s + d.qty, 0);

  document.getElementById('stat-models').textContent = totalModels;
  document.getElementById('stat-units').textContent  = totalUnits;
  document.getElementById('stat-parts').textContent  = totalParts;
  document.getElementById('stat-qty').textContent    = totalQty;

  if (data.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = data.map((r, i) => `
    <tr>
      <td style="color:var(--text-muted);font-size:0.8rem">${i + 1}</td>
      <td><span class="part-type-tag ${PART_TAG_CLASS[r.type]}">${esc(r.type)}</span></td>
      <td><span class="part-code">${esc(r.code)}</span></td>
      <td class="qty-cell">${r.qty}</td>
      <td style="font-size:0.78rem;color:var(--text-sub)">${r.models.join(', ')}</td>
    </tr>
  `).join('');
}

function exportCSV() {
  const data = calculate();
  if (data.length === 0) { toast('尚無計算結果可匯出', 'error'); return; }

  const plan = loadPlan();
  const dateStr = new Date().toLocaleDateString('zh-TW').replace(/\//g, '');
  const header = '部品類型,部品代號,加工數量,來源機種\n';
  const rows = data.map(r =>
    `${r.type},${r.code},${r.qty},"${r.models.join(' / ')}"`
  ).join('\n');

  const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `K1_加工數彙總_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('已匯出 CSV 檔案', 'success');
}

// ===== TOAST =====
function toast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = (type === 'success' ? '✅' : '❌') + ' ' + msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ===== UTILS =====
function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}
function buildDateColumns(headerRow) {
  const columns = {};
  let year = null;
  let month = null;
  let previousDay = null;

  for (let col = 7; col < headerRow.length; col++) {
    const value = Number(headerRow[col]);
    if (!Number.isFinite(value)) continue;

    if (value > 31) {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (!parsed) continue;

      year = parsed.y;
      month = parsed.m;
      previousDay = parsed.d;

      columns[col] = `${year}-${String(month).padStart(2, '0')}-${String(previousDay).padStart(2, '0')}`;
      continue;
    }

    if (value < 1 || value > 31 || year === null) continue;

    if (previousDay !== null && value < previousDay) {
      month += 1;
      if (month > 12) { month = 1; year += 1; }
    }

    previousDay = value;
    columns[col] = `${year}-${String(month).padStart(2, '0')}-${String(value).padStart(2, '0')}`;
  } // 日期欄迴圈結束

  return columns;
} // buildDateColumns 結束

// ===== EXCEL IMPORT =====
async function importExcel() {
  const fileInput = document.getElementById('excel-file');
  const file = fileInput.files[0];

  if (!file) {
    toast('請先選擇 Excel 檔案', 'error');
    return;
  }

  if (typeof XLSX === 'undefined') {
    toast('Excel 讀取工具尚未載入', 'error');
    return;
  }

  const oldPlan = loadPlan();

  if (
    oldPlan.length > 0 &&
    !confirm('目前已有生產計畫，匯入後會清空並重新建立，是否繼續？')
  ) {
    return;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();

    const workbook = XLSX.read(arrayBuffer, {
      type: 'array'
    });

    // 優先讀取「AE線」，沒有時讀取第一個工作表
    const sheetName = workbook.SheetNames.includes('AE線')
      ? 'AE線'
      : workbook.SheetNames[0];

    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: null,
      raw: true
    });

    const normalizeModel = value =>
  String(value)
    .trim()
    .replace(/^\*+|\*+$/g, '')
    .trim()
    .toUpperCase()
    .replace(/\s*\([A-Z]{2,3}\)\s*$/, '');

    const dailyPlan = {};
    let dateColumns = {};
    const excelModels = {};

    rows.forEach(row => {
      const isHeader = String(row[1] || '').trim().toUpperCase() === 'NO';

  if (isHeader) {
    dateColumns = buildDateColumns(row);
    return;
  } // 日期表頭處理結束
      const no = Number(row[1]);       // B 欄：NO
      const rawModel = row[2];         // C 欄：機種
      const qty = Number(row[5]);      // F 欄：台數

      // 排除標題、合計、空白列
      if (!Number.isFinite(no)) return;
      if (!rawModel) return;
      if (!Number.isFinite(qty) || qty <= 0) return;

      const model = normalizeModel(rawModel);

      if (!model) return;
      Object.entries(dateColumns).forEach(([col, dateKey]) => {
      const dailyQty = Number(row[Number(col)]);
      if (!Number.isFinite(dailyQty) || dailyQty <= 0) return;

      if (!dailyPlan[dateKey]) dailyPlan[dateKey] = {};
      dailyPlan[dateKey][model] = (dailyPlan[dateKey][model] || 0) + Math.trunc(dailyQty);
      }); // 每日數量加總結束

      // 同機種自動加總
      excelModels[model] = (excelModels[model] || 0) + Math.trunc(qty);
    });

    saveDailyPlan(dailyPlan);
    renderDailyParts();

    const bom = loadBOM();

    // 建立 BOM 機種比對表
    const bomLookup = {};

    Object.keys(bom).forEach(model => {
      bomLookup[normalizeModel(model)] = model;
    });

    const newPlan = [];
    const pendingModels = [];

    Object.entries(excelModels).forEach(([excelModel, qty]) => {
      const bomModel = bomLookup[excelModel];

      if (!bomModel) {
        pendingModels.push({model: excelModel,qty});
        return;
      }

      newPlan.push({
        model: bomModel,
        qty
      });
    });

    const missingModels = pendingModels.map(item => item.model);
    
    savePending(pendingModels);
    renderPending();
    if (newPlan.length === 0) {
      toast('沒有找到已建立 BOM 的機種', 'error');

      if (missingModels.length > 0) {
        alert(
          '以下機種尚未建立 BOM：\n\n' +
          missingModels.slice(0, 30).join('\n')
        );
      }

      return;
    }

    savePlan(newPlan);
    renderPlan();
    renderPending();
    renderResult();

    const totalQty = newPlan.reduce((sum, item) => sum + item.qty, 0);

    toast(
      `成功匯入 ${newPlan.length} 個機種，共 ${totalQty} 台`,
      'success'
    );

    if (missingModels.length > 0) {
      const extraText =
        missingModels.length > 30
          ? `\n\n另有 ${missingModels.length - 30} 個未顯示`
          : '';

      alert(
        `已略過 ${missingModels.length} 個尚未建立 BOM 的機種：\n\n` +
        missingModels.slice(0, 30).join('\n') +
        extraText
      );
    }

    fileInput.value = '';

  } catch (error) {
    console.error('Excel 匯入失敗：', error);
    toast('Excel 讀取失敗，請確認檔案格式', 'error');
  }
}
// ===== INIT =====
renderBOM();
renderPlan();
renderPending();
refreshPlanSelect();
document.getElementById('bom-search-input')?.addEventListener('input', renderBOM);
