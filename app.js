// ===== CONSTANTS =====
const BOM_KEY = 'k1_bom_data';
const PLAN_KEY = 'k1_production_plan';
const PENDING_KEY = 'k1_pending_bom';
const DAILY_PLAN_KEY = 'k1_daily_production_plan';
const PART_LINE_KEY = 'k1_part_lines';
const PART_OPS_KEY = 'k1_part_operations';
const EQUIPMENT_KEY = 'k1_equipment_master';
const CAPACITY_SETTINGS_KEY = 'k1_capacity_line_settings';
const BOM_FIELDS_KEY = 'k1_bom_fields';
const LINE_MASTER_KEY = 'k1_line_master';
const INVALID_PARTS_KEY = 'k1_invalid_parts';
const SUPPLIER_MASTER_KEY = 'k1_supplier_master';
const PART_INFO_KEY = 'k1_part_info';

const DEFAULT_PART_TYPES = [
  'L CASE',
  'R CASE',
  'L COVER',
  'R COVER',
  'M CASE',
  'UPPER CASE',
  'BED CASE'
];

const savedPartTypes =
  JSON.parse(
    localStorage.getItem(BOM_FIELDS_KEY) || '[]'
  );

let PART_TYPES =
  savedPartTypes.length > 0
    ? savedPartTypes
    : [...DEFAULT_PART_TYPES];
const PROCESS_LINES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I1', 'I2', 'O', 'P', 'Q', 'R', 'S'];

const PART_TAG_CLASS = {
  'L CASE': 'tag-lcase',
  'R CASE': 'tag-rcase',
  'L COVER': 'tag-lcover',
  'R COVER': 'tag-rcover',
  'M CASE': 'tag-mcase',
  'UPPER CASE': 'tag-upper',
  'BED CASE': 'tag-bed',
};

// ===== STORAGE =====
function loadBOM() {
  return JSON.parse(localStorage.getItem(BOM_KEY) || '{}');
}

function saveBOM(d) {
  localStorage.setItem(
    BOM_KEY,
    JSON.stringify(d)
  );
}

function saveBOMFields(fields) {
  localStorage.setItem(
    BOM_FIELDS_KEY,
    JSON.stringify(fields)
  );
}
// 機種代號正規化：去頭尾星號、轉大寫、去掉結尾國別，例如 *XA60BA(FR)* → XA60BA
function normalizeModelCode(value) {
  return String(value || '')
    .trim()
    .replace(/^\*+|\*+$/g, '')
    .trim()
    .toUpperCase()
    .replace(/\s*\([A-Z]{2,3}\)\s*$/, '');
} // normalizeModelCode 結束

// 以正規化後的機種代號查 BOM
function buildBOMLookup(bom = loadBOM()) {
  const lookup = {};

  Object.entries(bom).forEach(([model, row]) => {
    lookup[normalizeModelCode(model)] = row;
  });

  return lookup;
} // buildBOMLookup 結束

function loadPlan() { return JSON.parse(localStorage.getItem(PLAN_KEY) || '[]'); }
function savePlan(d) { localStorage.setItem(PLAN_KEY, JSON.stringify(d)); }
function loadPending() { return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]'); }
function savePending(d) { localStorage.setItem(PENDING_KEY, JSON.stringify(d)); }
function loadDailyPlan() { return JSON.parse(localStorage.getItem(DAILY_PLAN_KEY) || '{}'); }
function saveDailyPlan(d) { localStorage.setItem(DAILY_PLAN_KEY, JSON.stringify(d)); }
// 停用清單一律存「部品代號」；舊版單筆停用曾存成「種類__代號」，讀取時一併轉回代號
function loadInvalidParts() {
  const saved = JSON.parse(
    localStorage.getItem(INVALID_PARTS_KEY) || '[]'
  );

  return [...new Set(
    saved.map(key =>
      String(key).includes('__')
        ? String(key).split('__').pop()
        : String(key)
    )
  )];
} // loadInvalidParts 結束

function saveInvalidParts(parts) {
  localStorage.setItem(
    INVALID_PARTS_KEY,
    JSON.stringify(parts)
  );
} // saveInvalidParts 結束

function isInvalidPart(type, code, invalidSet = null) {
  const set = invalidSet || new Set(loadInvalidParts());

  return set.has(code);
} // isInvalidPart 結束

function loadPartLines() {
  return JSON.parse(
    localStorage.getItem(PART_LINE_KEY) || '{}'
  );
}

function savePartLines(d) { localStorage.setItem(PART_LINE_KEY, JSON.stringify(d)); }

function loadPartOperations() { return JSON.parse(localStorage.getItem(PART_OPS_KEY) || '{}'); }
function savePartOperations(d) { localStorage.setItem(PART_OPS_KEY, JSON.stringify(d)); }

function loadEquipmentMaster() {
  return JSON.parse(localStorage.getItem(EQUIPMENT_KEY) || '[]');
}

function saveEquipmentMaster(d) {
  localStorage.setItem(EQUIPMENT_KEY, JSON.stringify(d));
}

function loadCapacitySettings() {
  return JSON.parse(
    localStorage.getItem(CAPACITY_SETTINGS_KEY) || '{}'
  );
}

function saveCapacitySettings(d) {
  localStorage.setItem(
    CAPACITY_SETTINGS_KEY,
    JSON.stringify(d)
  );
}

function loadLineMaster() {
  const saved =
    JSON.parse(
      localStorage.getItem(LINE_MASTER_KEY) || '[]'
    );

  return saved.length > 0
    ? saved
    : [...PROCESS_LINES];
} // loadLineMaster 結束

function loadSupplierMaster() {
  return JSON.parse(
    localStorage.getItem(SUPPLIER_MASTER_KEY) || '[]'
  );
} // loadSupplierMaster 結束

function saveSupplierMaster(suppliers) {
  localStorage.setItem(
    SUPPLIER_MASTER_KEY,
    JSON.stringify(suppliers)
  );
} // saveSupplierMaster 結束

function loadPartInfo() {
  return JSON.parse(
    localStorage.getItem(PART_INFO_KEY) || '{}'
  );
} // loadPartInfo 結束

function savePartInfo(data) {
  localStorage.setItem(
    PART_INFO_KEY,
    JSON.stringify(data)
  );
} // savePartInfo 結束

function saveLineMaster(lines) {
  localStorage.setItem(
    LINE_MASTER_KEY,
    JSON.stringify(lines)
  );
} // saveLineMaster 結束

function getProcessLines() {
  const lines = loadLineMaster();

  const defaultLines = PROCESS_LINES.filter(
    line => lines.includes(line)
  );

  const customLines = lines
    .filter(line => !PROCESS_LINES.includes(line))
    .sort((a, b) =>
      a.localeCompare(b, 'zh-TW', {
        numeric: true,
        sensitivity: 'base'
      })
    );

  return [
    ...defaultLines,
    ...customLines
  ];
} // getProcessLines 結束
function formatLineLabel(line) {
  return PROCESS_LINES.includes(line)
    ? `${line} LINE`
    : line;
} // formatLineLabel 結束

async function addLineMaster() {
  const name = await uiPrompt('自製線填代號（例如 T），協力廠填名稱（例如 宏嘉）', {
    title: '新增加工線別／廠商',
    placeholder: '線別或廠商名稱',
    okText: '新增'
  });

  if (!name) return;

  const value = name.trim();

  if (!value) return;

  const lines = loadLineMaster();

  const exists = lines.some(
    item =>
      item.toUpperCase() === value.toUpperCase()
  );

  if (exists) {
    toast('此線別／廠商已存在', 'error');
    return;
  }

  lines.push(value);

  saveLineMaster(lines);

  renderPartLineSettings();
  renderDailyParts();

  toast(`已新增：${value}`, 'success');
} // addLineMaster 結束

async function addSupplierMaster() {
  const name = await uiPrompt('例如：上毅、明鴻', {
    title: '新增素材廠商',
    placeholder: '素材廠商名稱',
    okText: '新增'
  });

  if (!name) return;

  const value = name.trim();
  if (!value) return;

  const suppliers = loadSupplierMaster();

  const exists = suppliers.some(
    item =>
      item.toUpperCase() === value.toUpperCase()
  );

  if (exists) {
    toast('此素材廠商已存在', 'error');
    return;
  }

  suppliers.push(value);

  suppliers.sort((a, b) =>
    a.localeCompare(b, 'zh-TW', {
      numeric: true,
      sensitivity: 'base'
    })
  );

  saveSupplierMaster(suppliers);

  renderPartLineSettings();

  toast(`已新增素材廠商：${value}`, 'success');
} // addSupplierMaster 結束

async function deleteSupplierMaster() {
  const suppliers = loadSupplierMaster();

  if (suppliers.length === 0) {
    toast('目前沒有素材廠商', 'error');
    return;
  }

  const name = await uiPrompt('選擇要刪除的素材廠商', {
    title: '刪除素材廠商',
    options: suppliers,
    okText: '下一步'
  });

  if (!name) return;

  const value = name.trim();

  const exists = suppliers.find(
    item =>
      item.toUpperCase() === value.toUpperCase()
  );

  if (!exists) {
    toast('找不到此素材廠商', 'error');
    return;
  }

  const partInfo = loadPartInfo();

  const usedParts = Object.entries(partInfo)
    .filter(([, info]) => info?.supplier === exists)
    .map(([partCode]) => partCode);

  if (usedParts.length > 0) {
    await uiAlert(
      `${exists} 目前仍有 ${usedParts.length} 個部品使用中，請先修改這些部品的素材廠商。`
    );
    return;
  }

  if (!await uiConfirm(`確定刪除素材廠商「${exists}」嗎？`, { danger: true, okText: '刪除' })) {
    return;
  }

  saveSupplierMaster(
    suppliers.filter(item => item !== exists)
  );

  renderPartLineSettings();

  toast(`已刪除素材廠商：${exists}`, 'success');
} // deleteSupplierMaster 結束

async function deleteLineMaster() {
  const lines = loadLineMaster();

  const customLines = lines.filter(
    line => !PROCESS_LINES.includes(line)
  );

  if (customLines.length === 0) {
    toast('目前沒有可刪除的線別／廠商', 'error');
    return;
  }

  const name = await uiPrompt('只能刪除自訂的線別或協力廠，A～S 內建線別不能刪除', {
    title: '刪除加工線別／廠商',
    options: customLines,
    okText: '下一步'
  });

  if (!name) return;

  const value = name.trim();

  const exists = customLines.find(
    line =>
      line.toUpperCase() === value.toUpperCase()
  );

  if (!exists) {
    toast('找不到此線別／廠商', 'error');
    return;
  }

  const partLines = loadPartLines();

  const usedParts = Object.entries(partLines)
    .filter(([, line]) => line === exists)
    .map(([partCode]) => partCode);

  if (usedParts.length > 0) {
    await uiAlert(
      `${exists} 目前仍有 ${usedParts.length} 個部品使用中，請先將這些部品改到其他線別後再刪除。`
    );
    return;
  }

  if (!await uiConfirm(`確定要刪除「${exists}」嗎？`, { danger: true, okText: '刪除' })) {
    return;
  }

  const newLines = lines.filter(
    line => line !== exists
  );

  saveLineMaster(newLines);

  renderPartLineSettings();
  renderDailyParts();

  toast(`已刪除：${exists}`, 'success');
} // deleteLineMaster 結束

function getCapacityLineSetting(line) {
  const settings = loadCapacitySettings();

  return settings[line] || {
    attendanceDays: 22,

    morningEnabled: true,
    morningHours: 8,
    morningBreak: 20,
    morningMeal: 60,

    eveningEnabled: true,
    eveningHours: 8,
    eveningMeal: 30,
    eveningBreak: 10,

    nightEnabled: true,
    nightHours: 8,
    nightBreak: 60
  };
} // getCapacityLineSetting 結束

function calculateCapacityTime(setting) {
  let dailyHours = 0;

  if (setting.morningEnabled) {
    dailyHours +=
      setting.morningHours -
      (setting.morningBreak + setting.morningMeal) / 60;
  }

  if (setting.eveningEnabled) {
    dailyHours +=
      setting.eveningHours -
      (setting.eveningBreak + setting.eveningMeal) / 60;
  }

  if (setting.nightEnabled) {
    dailyHours +=
      setting.nightHours -
      setting.nightBreak / 60;
  }

  const totalHours =
    dailyHours * setting.attendanceDays;

  return {
    dailyHours,
    totalHours
  };
} // calculateCapacityTime 結束

function loadStatus(rate) {
  if (rate > 100) return { cls: 'over', pill: 'pill-danger', text: '超載' };
  if (rate >= 85) return { cls: 'warn', pill: 'pill-warn', text: '注意' };
  return { cls: '', pill: 'pill-ok', text: '正常' };
} // loadStatus 結束

function renderCapacityLineSettings() {
  const container =
    document.getElementById('capacity-line-settings');

  if (!container) return;

  const lines = getProcessLines();

  if (lines.length === 0) {
    container.innerHTML = `
      <div class="empty-state card">
        <div class="empty-icon">${icon('gauge')}</div>
        <p>尚未建立 LINE 資料</p>
      </div>
    `;
    return;
  }

  // 全部負荷只算一次，各線再各自篩選
  const allMachineLoads = calculateMachineLoad();
  const allGroupLoads = calculateGroupLoad(allMachineLoads);
  const openLines = new Set(
    [...container.querySelectorAll('details.cap-card[open]')].map(el => el.dataset.line)
  );

  const numberField = (line, field, label, value, step = 1) => `
    <label>${label}
      <input type="number" min="0" step="${step}" value="${value}" data-line="${esc(line)}" data-field="${field}">
    </label>`;

  const shift = (line, key, name, setting, fields) => `
    <div class="shift">
      <label class="shift-head">
        <input type="checkbox" data-line="${esc(line)}" data-field="${key}Enabled" ${setting[`${key}Enabled`] ? 'checked' : ''}>
        ${name}
      </label>
      <div class="shift-fields">
        ${fields.map(([field, label, step]) => numberField(line, field, label, setting[field], step)).join('')}
      </div>
    </div>`;

  container.innerHTML = lines.map(line => {
    const setting = getCapacityLineSetting(line);
    const capacityTime = calculateCapacityTime(setting);

    const machineLoads = allMachineLoads
      .filter(item => item.line === line)
      .sort((a, b) => b.loadRate - a.loadRate);

    const groupLoads = allGroupLoads
      .filter(item => item.line === line)
      .sort((a, b) => b.loadRate - a.loadRate);

    const bottleneck = machineLoads.find(item => item.requiredHours > 0) || null;
    const rate = bottleneck ? bottleneck.loadRate : 0;
    const status = loadStatus(rate);

    const rateCell = value => {
      const s = loadStatus(value);
      return `<td class="num"><span class="pill ${s.pill}">${value.toFixed(1)}%</span></td>`;
    };

    const groupTable = groupLoads.length ? `
      <div class="cap-subtitle">加工群組負荷</div>
      <div class="cap-table table-wrap">
        <table>
          <thead><tr><th>群組</th><th>瓶頸設備</th><th class="num">需求工時</th><th class="num">負荷率</th></tr></thead>
          <tbody>
            ${groupLoads.map(item => `
              <tr>
                <td>${esc(item.group)}</td>
                <td class="mono">${esc(item.bottleneckMachine || '—')}</td>
                <td class="num mono">${item.requiredHours.toFixed(2)} hr</td>
                ${rateCell(item.loadRate)}
              </tr>`).join('')}
          </tbody>
        </table>
      </div>` : '';

    const machineTable = machineLoads.length ? `
      <div class="cap-subtitle">設備負荷（${machineLoads.length} 台）</div>
      <div class="cap-table table-wrap" style="max-height:320px">
        <table>
          <thead><tr><th>設備</th><th class="num">需求工時</th><th class="num">負荷率</th></tr></thead>
          <tbody>
            ${machineLoads.map(item => `
              <tr>
                <td class="mono">${esc(item.machine)}</td>
                <td class="num mono">${item.requiredHours.toFixed(2)} hr</td>
                ${rateCell(item.loadRate)}
              </tr>`).join('')}
          </tbody>
        </table>
      </div>` : `
      <p class="card-sub" style="margin-top:12px">這條線還沒有設備需求工時：需要每日部品計畫，以及部品的 OP／NT 與設備對應。</p>`;

    return `
    <details class="cap-card" data-line="${esc(line)}" ${openLines.has(line) ? 'open' : ''}>
      <summary>
        ${icon('chevron', 'group-caret')}
        <span class="cap-line">${esc(formatLineLabel(line))}</span>
        <span class="cap-meta">瓶頸 <strong>${bottleneck ? esc(bottleneck.machine) : '—'}</strong></span>
        <span class="meter">
          <span class="meter-track"><span class="meter-fill ${status.cls}" style="--v:${(rate / 100).toFixed(3)}"></span></span>
          <span class="meter-value">${bottleneck ? `${rate.toFixed(1)}%` : '—'}</span>
        </span>
        ${bottleneck
          ? `<span class="pill ${status.pill}"><span class="dot"></span>${status.text}</span>`
          : '<span class="pill">尚無資料</span>'}
      </summary>

      <div class="cap-body">
        <div>
          <div class="cap-stats">
            <div class="cap-stat"><span>每日有效工時</span><strong>${capacityTime.dailyHours.toFixed(2)} hr</strong></div>
            <div class="cap-stat"><span>期間有效工時</span><strong>${capacityTime.totalHours.toFixed(1)} hr</strong></div>
            <div class="cap-stat"><span>瓶頸需求工時</span><strong>${bottleneck ? bottleneck.requiredHours.toFixed(1) : '0.0'} hr</strong></div>
          </div>
          ${groupTable}
          ${machineTable}
        </div>

        <div class="cap-form">
          <div class="form-group">
            <label>出勤天數</label>
            <input type="number" min="0" step="1" value="${setting.attendanceDays}" data-line="${esc(line)}" data-field="attendanceDays">
          </div>

          ${shift(line, 'morning', '早班', setting, [['morningHours', '時數（hr）', 0.5], ['morningBreak', '休息（min）'], ['morningMeal', '午餐（min）']])}
          ${shift(line, 'evening', '中班', setting, [['eveningHours', '時數（hr）', 0.5], ['eveningMeal', '用餐（min）'], ['eveningBreak', '休息（min）']])}
          ${shift(line, 'night', '大夜', setting, [['nightHours', '時數（hr）', 0.5], ['nightBreak', '休息（min）']])}

          <button class="btn btn-primary btn-block" style="margin-top:12px" data-line="${esc(line)}" onclick="saveCapacityLineSetting(this)">
            ${icon('check')}儲存 ${esc(formatLineLabel(line))} 設定
          </button>
        </div>
      </div>
    </details>
    `;
  }).join('');
} // renderCapacityLineSettings 結束

function saveCapacityLineSetting(button) {
  const line = button.dataset.line;
  const card = button.closest('details');

  const settings = loadCapacitySettings();

  settings[line] = {
    attendanceDays: Number(
      card.querySelector('[data-field="attendanceDays"]').value
    ),

    morningEnabled:
      card.querySelector('[data-field="morningEnabled"]').checked,

    morningHours: Number(
      card.querySelector('[data-field="morningHours"]').value
    ),

    morningBreak: Number(
      card.querySelector('[data-field="morningBreak"]').value
    ),

    morningMeal: Number(
      card.querySelector('[data-field="morningMeal"]').value
    ),

    eveningEnabled:
      card.querySelector('[data-field="eveningEnabled"]').checked,

    eveningHours: Number(
      card.querySelector('[data-field="eveningHours"]').value
    ),

    eveningMeal: Number(
      card.querySelector('[data-field="eveningMeal"]').value
    ),

    eveningBreak: Number(
      card.querySelector('[data-field="eveningBreak"]').value
    ),

    nightEnabled:
      card.querySelector('[data-field="nightEnabled"]').checked,

    nightHours: Number(
      card.querySelector('[data-field="nightHours"]').value
    ),

    nightBreak: Number(
      card.querySelector('[data-field="nightBreak"]').value
    )
  };

  saveCapacitySettings(settings);

  renderCapacityLineSettings();

  toast(`${line} LINE 設定已儲存`, 'success');
} // saveCapacityLineSetting 結束

// ===== TAB =====
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    document.getElementById('crumb-current').textContent = btn.querySelector('span').textContent;
    toggleSidebar(false);
    window.scrollTo({ top: 0 });
    try { localStorage.setItem('k1_last_tab', btn.dataset.tab); } catch (e) { /* 忽略 */ }
    if (btn.dataset.tab === 'daily') renderDailyParts();
    if (btn.dataset.tab === 'line-load') renderLineLoad();
    if (btn.dataset.tab === 'part-lines') renderPartLineSettings();
    if (btn.dataset.tab === 'equipment') renderEquipmentMaster();
    if (btn.dataset.tab === 'machine-time') renderMachineRequiredTime();
    if (btn.dataset.tab === 'capacity') renderCapacityLineSettings();
    if (btn.dataset.tab === 'result') renderResult();
  });
});

// ===== BOM TAB =====
function renderBOM() {
  const bom = loadBOM();

  const thead =
    document.getElementById('bom-thead');

  thead.innerHTML = `
    <tr>
      <th>機種代號</th>

      ${PART_TYPES.map(type => `
        <th>${esc(type)}</th>
      `).join('')}

      <th class="col-actions"></th>
    </tr>
  `;

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
      <td class="col-actions">
        <div class="row-actions">
          <button class="btn btn-ghost btn-icon btn-sm" title="編輯" aria-label="編輯 ${esc(model)}" onclick="openEditModal('${jsArg(model)}')">${icon('pencil')}</button>
          <button class="btn btn-danger-ghost btn-icon btn-sm" title="刪除" aria-label="刪除 ${esc(model)}" onclick="deleteModel('${jsArg(model)}')">${icon('trash')}</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

async function deleteModel(model) {
  if (!await uiConfirm(`機種「${model}」的 BOM 會被刪除；若它在生產計畫中，台數會移回「待建立 BOM」。`, { title: '刪除機種', danger: true, okText: '刪除' })) return;

  const bom = loadBOM();
  const plan = loadPlan();
  const pending = loadPending();

  delete bom[model];
  saveBOM(bom);

  const planItem = plan.find(
    item => item.model === model
  );

  if (planItem) {
    const existingPending = pending.find(
      item => item.model === model
    );

    if (existingPending) {
      existingPending.qty += planItem.qty;
    } else {
      pending.push({
        model,
        qty: planItem.qty
      });
    }

    savePlan(
      plan.filter(item => item.model !== model)
    );

    savePending(pending);
  }

  renderBOM();
  renderPlan();
  renderPending();
  refreshPlanSelect();
  renderDailyParts();
  renderResult();

  toast('已刪除 ' + model, 'success');
} // deleteModel 結束

// ===== MODAL =====
let editingModel = null;

function exportBOMMaster() {
  const bom = loadBOM();
  const pending = loadPending();

  const allModels = [
    ...Object.keys(bom),
    ...pending.map(item => item.model)
  ];

  const models = [...new Set(allModels)]
    .filter(Boolean)
    .sort();

  if (models.length === 0) {
    toast('尚無 BOM 或待建立機種可轉出', 'error');
    return;
  }

  const rows = models.map(model => {
    const item = bom[model] || {};

    const row = {
      機種代號: model
    };

    PART_TYPES.forEach(type => {
      row[type] = item[type] || '';
    });

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(
    rows,
    {
      header: [
        '機種代號',
        ...PART_TYPES
      ]
    }
  );
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    'BOM主檔'
  );

  XLSX.writeFile(
    workbook,
    'BOM主檔.xlsx'
  );

  toast(
    `BOM 主檔已轉出，共 ${models.length} 個機種`,
    'success'
  );
} // exportBOMMaster 結束

async function importBOMMaster() {
  const fileInput =
    document.getElementById('bom-excel-file');

  const file = fileInput.files[0];

  if (!file) return;

  try {
    const arrayBuffer = await file.arrayBuffer();

    const workbook = XLSX.read(arrayBuffer, {
      type: 'array'
    });

    const worksheet =
      workbook.Sheets[workbook.SheetNames[0]];

    // 讀取 Excel 第一列欄位
    const rawRows = XLSX.utils.sheet_to_json(
      worksheet,
      {
        header: 1,
        defval: ''
      }
    );

    const headers =
      (rawRows[0] || [])
        .map(header => String(header).trim())
        .filter(Boolean);

    if (!headers.includes('機種代號')) {
      toast('找不到「機種代號」欄位', 'error');
      return;
    }

    // 除了機種代號以外，全部視為 BOM 項目
    const importedPartTypes =
      headers.filter(
        header => header !== '機種代號'
      );

    if (importedPartTypes.length === 0) {
      toast('Excel 中沒有 BOM 項目', 'error');
      return;
    }

    // 更新系統 BOM 欄位
    PART_TYPES = importedPartTypes;

    saveBOMFields(PART_TYPES);

    const rows = XLSX.utils.sheet_to_json(
      worksheet,
      { defval: '' }
    );

    const bom = loadBOM();

    let addedCount = 0;
    let updatedCount = 0;

    rows.forEach(row => {
      const model =
        String(row['機種代號'] || '')
          .trim()
          .toUpperCase();

      if (!model) return;

      const bomRow = {};

      PART_TYPES.forEach(type => {
        const value =
          String(row[type] || '')
            .trim()
            .toUpperCase();

        bomRow[type] =
          /^[\-－–—−]+$/.test(value)
            ? ''
            : value;
      });

      const hasBOM =
        PART_TYPES.some(type => bomRow[type]);

      if (!hasBOM) return;

      if (bom[model]) {
        updatedCount++;
      } else {
        addedCount++;
      }

      bom[model] = bomRow;
    });

    saveBOM(bom);

    // 待建立機種有了 BOM 之後，台數移入生產計畫（與「建立 BOM」視窗相同）
    const pending = loadPending();
    const plan = loadPlan();
    let movedCount = 0;

    const remainingPending = pending.filter(item => {
      if (!bom[item.model]) return true;

      const existing = plan.find(
        planItem => planItem.model === item.model
      );

      if (existing) {
        existing.qty += item.qty;
      } else {
        plan.push({ model: item.model, qty: item.qty });
      }

      movedCount++;
      return false;
    });

    savePlan(plan);
    savePending(remainingPending);

    renderBOM();
    renderPlan();
    renderPending();
    refreshPlanSelect();
    renderResult();

    fileInput.value = '';

    toast(
      `BOM 轉入完成｜新增 ${addedCount} 筆｜更新 ${updatedCount} 筆` +
      (movedCount ? `｜${movedCount} 個待建立機種已加入生產計畫` : ''),
      'success'
    );

  } catch (error) {
    console.error('BOM 轉入失敗：', error);

    fileInput.value = '';

    toast(
      'BOM 轉入失敗，請確認 Excel 格式',
      'error'
    );
  }
} // importBOMMaster 結束

function renderBOMModalFields(row = {}) {
  const container =
    document.getElementById('bom-modal-fields');

  container.innerHTML = PART_TYPES.map(type => {
    const fieldId =
      'field-' + type.replace(/ /g, '_');

    return `
      <div class="form-group">
        <label>${esc(type)}</label>

        <input
          type="text"
          id="${esc(fieldId)}"
          value="${esc(row[type] || '')}"
          placeholder="件號"
          style="text-transform:uppercase">
      </div>
    `;
  }).join('');
} // renderBOMModalFields 結束

function openAddModal() {
  editingModel = null;

  document.getElementById('modal-title').textContent =
    '新增機種 BOM';

  document.getElementById('modal-model').value = '';
  document.getElementById('modal-model').disabled = false;

  renderBOMModalFields();

  document.getElementById('modal-overlay')
    .classList.remove('hidden');

  document.getElementById('modal-model').focus();
}

function openEditModal(model) {
  editingModel = model;
  const bom = loadBOM();
  const row = bom[model] || {};
  document.getElementById('modal-title').textContent = '編輯機種 BOM';
  document.getElementById('modal-model').value = model;
  document.getElementById('modal-model').disabled = true;
  renderBOMModalFields(row);
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
  const bom = loadBOM();
  const sel = document.getElementById('plan-model-select');
  const keys = Object.keys(bom);
  sel.innerHTML = '<option value="">-- 選擇機種代號 --</option>' +
    keys.map(k => `<option value="${esc(k)}">${esc(k)}</option>`).join('');
}

function addPlanItem() {
  const model = document.getElementById('plan-model-select').value;
  const qty = parseInt(document.getElementById('plan-qty').value, 10);

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

async function clearPlan() {
  if (!await uiConfirm('生產計畫、待建立 BOM 與每日部品計畫（含所有月份）都會清空，加工線負荷也會歸零。', { title: '清空計畫', danger: true, okText: '全部清空' })) return;

  savePlan([]);
  savePending([]);
  saveDailyPlan({});

  renderPlan();
  renderPending();
  renderDailyParts();
  renderLineLoad();
  renderResult();

  toast('已清空生產計畫與每日部品計畫', 'success');
}

function renderPlan() {
  const plan = loadPlan();
  const el = document.getElementById('plan-list');
  const empty = document.getElementById('plan-empty');
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
      <button class="btn btn-ghost btn-icon btn-sm" title="移除" aria-label="移除 ${esc(p.model)}" onclick="removePlanItem('${jsArg(p.model)}')">${icon('x')}</button>
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
      <button class="btn btn-secondary btn-sm" onclick="openPendingBOM('${jsArg(item.model)}')">${icon('plus')}建立 BOM</button>
    </div>
  `).join('');
} // renderPending 結束

function openPendingBOM(model) {
  openAddModal();

  document.getElementById('modal-title').textContent =
    '建立待處理 BOM';

  document.getElementById('modal-model').value = model;

  const firstField =
    document.querySelector('#bom-modal-fields input');

  if (firstField) {
    firstField.focus();
  }
} // openPendingBOM 結束

// ===== DAILY PARTS PLAN =====
function renderEquipmentMaster() {
  const data = loadEquipmentMaster();

  const tbody = document.getElementById('equipment-tbody');
  const empty = document.getElementById('equipment-empty');
  const summary = document.getElementById('equipment-summary');

  const criticalCount = data.filter(item => item.critical).length;

  summary.textContent =
    `共 ${data.length} 台設備｜關鍵設備 ${criticalCount} 台`;

  if (data.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  tbody.innerHTML = data.map(item => `
  <tr>
    <td>
      <span class="part-code">${esc(item.machine)}</span>
    </td>

    <td>${esc(item.name || '—')}</td>

    <td>${esc(item.department || '—')}</td>

    <td>${item.line ? esc(formatLineLabel(item.line)) : '—'}</td>

    <td>${esc(item.group || '—')}</td>

    <td>${item.critical ? '<span class="pill pill-accent"><span class="dot"></span>關鍵</span>' : '<span class="muted">—</span>'}</td>

    <td class="col-actions">
      <div class="row-actions">
        <button class="btn btn-ghost btn-icon btn-sm" title="編輯" aria-label="編輯 ${esc(item.machine)}"
          data-machine="${esc(item.machine)}" onclick="editEquipment(this)">${icon('pencil')}</button>
        <button class="btn btn-danger-ghost btn-icon btn-sm" title="刪除" aria-label="刪除 ${esc(item.machine)}"
          data-machine="${esc(item.machine)}" onclick="deleteEquipment(this.dataset.machine)">${icon('trash')}</button>
      </div>
    </td>
  </tr>
`).join('');
} // renderEquipmentMaster 結束

function exportEquipmentMaster() {
  const data = loadEquipmentMaster();

  if (data.length === 0) {
    toast('尚無設備主檔可轉出', 'error');
    return;
  }

  const rows = data.map(item => ({
    管理編號: item.machine || '',
    設備名稱: item.name || '',
    所屬部門: item.department || '',
    所屬LINE: item.line || '',
    設備群組: item.group || '',
    關鍵設備: item.critical ? '是' : '否'
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    '設備主檔'
  );

  XLSX.writeFile(
    workbook,
    '設備主檔.xlsx'
  );

  toast('設備主檔已轉出', 'success');
} // exportEquipmentMaster 結束

async function importEquipmentMaster() {
  const fileInput =
    document.getElementById('equipment-excel-file');

  const file = fileInput.files[0];

  if (!file) return;

  try {
    const arrayBuffer = await file.arrayBuffer();

    const workbook = XLSX.read(arrayBuffer, {
      type: 'array'
    });

    const worksheet =
      workbook.Sheets[workbook.SheetNames[0]];

    const rows = XLSX.utils.sheet_to_json(
      worksheet,
      { defval: '' }
    );

    const equipment = loadEquipmentMaster();

    rows.forEach(row => {
      const machine =
        String(row['管理編號'] || '')
          .trim()
          .toUpperCase();

      const name =
        String(row['設備名稱'] || '').trim();

      const department =
        String(row['所屬部門'] || '')
          .trim()
          .toUpperCase();

      const line =
        String(
          row['所屬LINE'] ||
          row['所屬 LINE'] ||
          ''
        )
          .trim()
          .toUpperCase();

      const criticalText =
        String(row['關鍵設備'] || '')
          .trim()
          .toUpperCase();

      // 舊版轉出檔沒有「設備群組」欄，這時保留系統內原本的群組
      const hasGroupColumn = '設備群組' in row;
      const group =
        String(row['設備群組'] || '')
          .trim()
          .toUpperCase();

      if (!machine) return;

      const critical =
        ['是', 'Y', 'YES', 'TRUE', '1']
          .includes(criticalText);

      const existing =
        equipment.find(
          item => item.machine === machine
        );

      if (existing) {
        existing.name = name;
        existing.department = department;
        existing.line = line;
        existing.critical = critical;
        if (hasGroupColumn) existing.group = group;
      } else {
        equipment.push({
          machine,
          name,
          department,
          line,
          group,
          critical
        });
      }
    });

    saveEquipmentMaster(equipment);
    renderEquipmentMaster();

    fileInput.value = '';

    toast(
      `設備主檔轉入完成，共讀取 ${rows.length} 筆`,
      'success'
    );

  } catch (error) {
    console.error('設備主檔轉入失敗：', error);

    toast(
      '設備主檔轉入失敗，請確認 Excel 格式',
      'error'
    );
  }
} // importEquipmentMaster 結束

function addEquipment() {
  const tbody = document.getElementById('equipment-tbody');
  const empty = document.getElementById('equipment-empty');

  empty.style.display = 'none';

  if (tbody.querySelector('[data-new-equipment]')) return;

  tbody.insertAdjacentHTML('afterbegin', `
    <tr data-new-equipment="true">

      <td>
  <input
    type="text"
    data-field="machine"
    placeholder="1530-003166">
</td>

<td>
  <input
    type="text"
    data-field="name"
    placeholder="例：OKK HM500S">
</td>

<td>
  <input
    type="text"
    data-field="department"
    placeholder="例：M3">
</td>

<td>
  <select data-field="line">
          <option value="">選擇 LINE</option>

 ${getProcessLines().map(line => `
  <option value="${esc(line)}">
    ${esc(formatLineLabel(line))}
  </option>
`).join('')}
        </select>
      </td>

      <td>
        <input
          type="text"
          data-field="group"
          placeholder="例：G01">
      </td>

      <td>
        <input
          type="checkbox"
          data-field="critical"
          checked>
      </td>

      <td class="col-actions">
        <div class="row-actions">
          <button class="btn btn-primary btn-sm" onclick="saveNewEquipment(this)">${icon('check')}儲存</button>
          <button class="btn btn-ghost btn-sm" onclick="renderEquipmentMaster()">取消</button>
        </div>
      </td>

    </tr>
  `);
} // addEquipment 結束


function saveNewEquipment(button) {
  const row = button.closest('tr');

  const machine =
    row.querySelector('[data-field="machine"]').value
      .trim()
      .toUpperCase();

  const name =
    row.querySelector('[data-field="name"]').value
      .trim();

  const department =
    row.querySelector('[data-field="department"]').value
      .trim()
      .toUpperCase();

  const line =
    row.querySelector('[data-field="line"]').value;

  const group =
    row.querySelector('[data-field="group"]').value
      .trim()
      .toUpperCase();

  const critical =
    row.querySelector('[data-field="critical"]').checked;

  if (!machine || !line) {
    toast('請輸入管理編號並選擇加工線', 'error');
    return;
  }

  const data = loadEquipmentMaster();

  if (!machine || !name || !department || !line) {
    toast('請完整輸入管理編號、設備名稱、所屬部門與加工線', 'error');
    return;
  }

  if (data.some(item => item.machine === machine)) {
    toast(`管理編號 ${machine} 已存在`, 'error');
    return;
  }

  data.push({
    machine,
    name,
    department,
    line,
    group,
    critical
  });

  saveEquipmentMaster(data);
  renderEquipmentMaster();

  toast('已新增設備', 'success');
} // saveNewEquipment 結束

function editEquipment(button) {
  const machine = button.dataset.machine;
  const data = loadEquipmentMaster();

  const item = data.find(
    equipment => equipment.machine === machine
  );

  if (!item) return;

  const row = button.closest('tr');

  row.innerHTML = `
    <td>
      <span class="part-code">${esc(item.machine)}</span>
    </td>

    <td>
      <input
        type="text"
        data-field="name"
        value="${esc(item.name || '')}">
    </td>

    <td>
      <input
        type="text"
        data-field="department"
        value="${esc(item.department || '')}">
    </td>

    <td>
      <select data-field="line">
        ${getProcessLines().map(line => `
          <option
            value="${esc(line)}"
            ${item.line === line ? 'selected' : ''}>
            ${esc(formatLineLabel(line))}
          </option>
        `).join('')}
      </select>
    </td>

     <td>
        <input
          type="text"
          data-field="group"
          value="${esc(item.group || '')}"
          placeholder="例：G01">
      </td>

    <td>
      <input
        type="checkbox"
        data-field="critical"
        ${item.critical ? 'checked' : ''}>
    </td>

    <td class="col-actions">
      <div class="row-actions">
        <button class="btn btn-primary btn-sm" data-machine="${esc(item.machine)}" onclick="saveEquipmentEdit(this)">${icon('check')}儲存</button>
        <button class="btn btn-ghost btn-sm" onclick="renderEquipmentMaster()">取消</button>
      </div>
    </td>
  `;
} // editEquipment 結束

function saveEquipmentEdit(button) {
  const machine = button.dataset.machine;
  const row = button.closest('tr');

  const name =
    row.querySelector('[data-field="name"]').value.trim();

  const department =
    row.querySelector('[data-field="department"]').value
      .trim()
      .toUpperCase();

  const line =
    row.querySelector('[data-field="line"]').value;

  const group =
    row.querySelector('[data-field="group"]').value
      .trim()
      .toUpperCase();

  const critical =
    row.querySelector('[data-field="critical"]').checked;

  if (!name || !department || !line) {
    toast('請完整輸入設備名稱、所屬部門與線別', 'error');
    return;
  }

  const data = loadEquipmentMaster();

  const item = data.find(
    equipment => equipment.machine === machine
  );

  if (!item) return;

  item.name = name;
  item.department = department;
  item.line = line;
  item.group = group;
  item.critical = critical;

  saveEquipmentMaster(data);
  renderEquipmentMaster();

  toast('設備資料已更新', 'success');
} // saveEquipmentEdit 結束

async function deleteEquipment(machine) {
  if (!await uiConfirm(`確定刪除設備「${machine}」？`, { title: '刪除設備', danger: true, okText: '刪除' })) return;

  const data =
    loadEquipmentMaster()
      .filter(item => item.machine !== machine);

  saveEquipmentMaster(data);
  renderEquipmentMaster();

  toast('已刪除設備', 'success');
} // deleteEquipment 結束

function calculateMachineRequiredTime() {
  const dailyParts = calculateDailyParts();
  const partOperations = loadPartOperations();
  const partLines = loadPartLines();
  const result = [];

  dailyParts.forEach(part => {
    const operations = partOperations[part.code] || [];

    Object.entries(part.dates).forEach(([dateKey, qty]) => {
      operations.forEach(operation => {
        const requiredSeconds = qty * operation.nt;

        result.push({
          date: dateKey,
          line: partLines[part.code] || '',
          partCode: part.code,
          partType: part.type,
          op: operation.op,
          machine: operation.machine,
          nt: operation.nt,
          qty,
          requiredSeconds,
          requiredMinutes: requiredSeconds / 60,
          requiredHours: requiredSeconds / 3600
        });
      });
    });
  });

  return result.sort((a, b) =>
    a.date.localeCompare(b.date) ||
    a.line.localeCompare(b.line) ||
    a.partCode.localeCompare(b.partCode) ||
    a.op.localeCompare(b.op)
  );
} // calculateMachineRequiredTime 結束

function calculateMachineLoad() {
  const machineTime = calculateMachineRequiredTime();
  const equipment = loadEquipmentMaster();
  const result = {};

  // 先把設備主檔全部設備放進來
  equipment.forEach(item => {
    const machine =
      String(item.machine || '')
        .trim()
        .toUpperCase();

    const line =
      String(item.line || '')
        .trim()
        .replace(/\s*LINE$/i, '');

    if (!machine || !line) return;

    const key = `${line}__${machine}`;

    result[key] = {
      line,
      machine,
      requiredHours: 0
    };
  });

  // 再把需求工時加到對應設備
  machineTime.forEach(item => {
    const machine =
      String(item.machine || '')
        .trim()
        .toUpperCase();

    const machineInfo = equipment.find(
      equipmentItem =>
        String(equipmentItem.machine || '')
          .trim()
          .toUpperCase() === machine
    );

    const line =
      String(
        machineInfo?.line ||
        item.line ||
        ''
      )
        .trim()
        .replace(/\s*LINE$/i, '');

    if (!machine || !line) return;

    const key = `${line}__${machine}`;

    if (!result[key]) {
      result[key] = {
        line,
        machine,
        requiredHours: 0
      };
    }

    result[key].requiredHours += item.requiredHours;
  });

  return Object.values(result).map(item => {
    const setting =
      getCapacityLineSetting(item.line);

    const capacityTime =
      calculateCapacityTime(setting);

    const availableHours =
      capacityTime.totalHours;

    const loadRate =
      availableHours > 0
        ? item.requiredHours / availableHours * 100
        : 0;

    return {
      ...item,
      availableHours,
      loadRate
    };
  });
} // calculateMachineLoad 結束

function calculateGroupLoad(machineLoads = calculateMachineLoad()) {
  const equipment = loadEquipmentMaster();
  const groups = {};

  machineLoads.forEach(machineLoad => {
    const machineInfo = equipment.find(
      item => item.machine === machineLoad.machine
    );

    const group =
      String(machineInfo?.group || '')
        .trim()
        .toUpperCase();

    if (!group) return;

    const key = `${machineLoad.line}__${group}`;

    if (!groups[key]) {
      groups[key] = {
        line: machineLoad.line,
        group,
        machines: []
      };
    }

    groups[key].machines.push(machineLoad);
  });

  return Object.values(groups).map(group => {
    const machines = [...group.machines]
      .sort((a, b) => b.loadRate - a.loadRate);

    const bottleneck = machines[0];

    return {
      ...group,
      machines,
      bottleneckMachine: bottleneck?.machine || '',
      loadRate: bottleneck?.loadRate || 0,
      requiredHours: bottleneck?.requiredHours || 0
    };
  });
} // calculateGroupLoad 結束

function calculateDailyParts() {
  const dailyPlan = loadDailyPlan();
  const bomLookup = buildBOMLookup();
  const invalidSet = new Set(loadInvalidParts());
  const result = {};

  Object.entries(dailyPlan).forEach(([dateKey, models]) => {
    Object.entries(models).forEach(([model, qty]) => {
      const modelBOM = bomLookup[normalizeModelCode(model)];
      if (!modelBOM) return;

      PART_TYPES.forEach(partType => {
        const code = modelBOM[partType];
        if (!code) return;
        if (isInvalidPart(partType, code, invalidSet)) return;

        const key = code;

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
  const invalidSet = new Set(loadInvalidParts());
  const parts = {};

  Object.entries(bom).forEach(([model, row]) => {
    PART_TYPES.forEach(type => {
      const code = String(row[type] || '').trim();
      if (!code) return;
      if (isInvalidPart(type, code, invalidSet)) return;

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

function normalizeImportedLine(value) {
  const text = String(value || '').trim();

  if (!text) return '';

  const base =
    text.replace(/\s*LINE$/i, '').trim().toUpperCase();

  return PROCESS_LINES.includes(base)
    ? base
    : text;
} // normalizeImportedLine 結束

function exportPartMaster() {
  const parts = collectBOMParts();
  const partLines = loadPartLines();
  const partInfo = loadPartInfo();
  const lineMaster = loadLineMaster();
  const supplierMaster = loadSupplierMaster();

  if (parts.length === 0) {
    toast('尚無加工部品資料可轉出', 'error');
    return;
  }

  const partRows = parts.map(item => ({
    部品代號: item.code,
    加工線別: partLines[item.code]
      ? formatLineLabel(partLines[item.code])
      : '',
    素材廠商: partInfo[item.code]?.supplier || '',
    擔當人員: partInfo[item.code]?.owner || ''
  }));

  const lineRows = lineMaster.map(line => ({
    加工線別: formatLineLabel(line)
  }));

  const supplierRows = supplierMaster.map(supplier => ({
    素材廠商: supplier
  }));

  const workbook = XLSX.utils.book_new();

  const partSheet =
    XLSX.utils.json_to_sheet(partRows);

  const lineSheet =
    XLSX.utils.json_to_sheet(lineRows);

  const supplierSheet =
    XLSX.utils.json_to_sheet(supplierRows);

  XLSX.utils.book_append_sheet(
    workbook,
    partSheet,
    '部品主檔'
  );

  XLSX.utils.book_append_sheet(
    workbook,
    lineSheet,
    '加工線別主檔'
  );

  XLSX.utils.book_append_sheet(
    workbook,
    supplierSheet,
    '素材廠商主檔'
  );

  XLSX.writeFile(
    workbook,
    '加工部品主檔.xlsx'
  );

  toast(
    `加工部品主檔已轉出，共 ${parts.length} 筆部品`,
    'success'
  );
} // exportPartMaster 結束

async function importPartMaster() {
  const fileInput =
    document.getElementById('part-master-excel-file');

  const file = fileInput.files[0];

  if (!file) return;

  try {
    const arrayBuffer = await file.arrayBuffer();

    const workbook = XLSX.read(arrayBuffer, {
      type: 'array'
    });

    const partSheet =
      workbook.Sheets['部品主檔'];

    if (!partSheet) {
      toast('找不到「部品主檔」工作表', 'error');
      fileInput.value = '';
      return;
    }

    const partRows =
      XLSX.utils.sheet_to_json(
        partSheet,
        { defval: '' }
      );

    const newPartLines = {};
    const newPartInfo = {};

    partRows.forEach(row => {
      const code =
        String(row['部品代號'] || '')
          .trim()
          .toUpperCase();

      if (!code) return;

      const line =
        normalizeImportedLine(
          row['加工線別']
        );

      const supplier =
        String(row['素材廠商'] || '').trim();

      const owner =
        String(row['擔當人員'] || '').trim();

      if (line) {
        newPartLines[code] = line;
      }

      newPartInfo[code] = {
        supplier,
        owner
      };
    });

    const lineSheet =
      workbook.Sheets['加工線別主檔'];

    let newLines = [...PROCESS_LINES];

    if (lineSheet) {
      const rows =
        XLSX.utils.sheet_to_json(
          lineSheet,
          { defval: '' }
        );

      rows.forEach(row => {
        const line =
          normalizeImportedLine(
            row['加工線別']
          );

        if (
          line &&
          !newLines.includes(line)
        ) {
          newLines.push(line);
        }
      });
    }

    Object.values(newPartLines).forEach(line => {
      if (!newLines.includes(line)) {
        newLines.push(line);
      }
    });

    const supplierSheet =
      workbook.Sheets['素材廠商主檔'];

    const newSuppliers = [];

    if (supplierSheet) {
      const rows =
        XLSX.utils.sheet_to_json(
          supplierSheet,
          { defval: '' }
        );

      rows.forEach(row => {
        const supplier =
          String(row['素材廠商'] || '').trim();

        if (
          supplier &&
          !newSuppliers.includes(supplier)
        ) {
          newSuppliers.push(supplier);
        }
      });
    }

    Object.values(newPartInfo).forEach(info => {
      if (
        info.supplier &&
        !newSuppliers.includes(info.supplier)
      ) {
        newSuppliers.push(info.supplier);
      }
    });

    savePartLines(newPartLines);
    savePartInfo(newPartInfo);
    saveLineMaster(newLines);
    saveSupplierMaster(newSuppliers);

    renderPartLineSettings();
    renderDailyParts();

    fileInput.value = '';

    toast(
      `加工部品主檔轉入完成，共 ${partRows.length} 筆`,
      'success'
    );

  } catch (error) {
    console.error(
      '加工部品主檔轉入失敗：',
      error
    );

    fileInput.value = '';

    toast(
      '加工部品主檔轉入失敗，請確認 Excel 格式',
      'error'
    );
  }
} // importPartMaster 結束

function renderPartLineSettings() {
  const data = collectBOMParts();
  const partLines = loadPartLines();
  const partOperations = loadPartOperations();
  const partInfo = loadPartInfo();
  const suppliers = loadSupplierMaster();
  const searchEl =
    document.getElementById('part-master-search');

  const lineFilterEl =
    document.getElementById('part-master-line-filter');

  const supplierFilterEl =
    document.getElementById('part-master-supplier-filter');

  const keyword =
    (searchEl?.value || '').trim().toUpperCase();

  const selectedLine =
    lineFilterEl?.value || '';

  const selectedSupplier =
    supplierFilterEl?.value || '';

  if (lineFilterEl) {
    const currentValue = lineFilterEl.value;

    lineFilterEl.innerHTML =
      '<option value="">全部加工線別</option>' +
      getProcessLines().map(line => `
      <option value="${esc(line)}">
        ${formatLineLabel(line)}
      </option>
    `).join('');

    lineFilterEl.value = currentValue;
  }

  if (supplierFilterEl) {
    const currentValue = supplierFilterEl.value;

    supplierFilterEl.innerHTML =
      '<option value="">全部素材廠商</option>' +
      suppliers.map(supplier => `
      <option value="${esc(supplier)}">
        ${esc(supplier)}
      </option>
    `).join('');

    supplierFilterEl.value = currentValue;
  }

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

  const filteredData = data.filter(item => {
    const line =
      partLines[item.code] || '';

    const supplier =
      partInfo[item.code]?.supplier || '';

    const owner =
      partInfo[item.code]?.owner || '';

    const matchKeyword =
      !keyword ||
      item.code.toUpperCase().includes(keyword) ||
      owner.toUpperCase().includes(keyword);

    const matchLine =
      !selectedLine ||
      line === selectedLine;

    const matchSupplier =
      !selectedSupplier ||
      supplier === selectedSupplier;

    return (
      matchKeyword &&
      matchLine &&
      matchSupplier
    );
  });

  summary.textContent =
    `顯示 ${filteredData.length} / ${data.length} 筆部品`;

  tbody.innerHTML = filteredData.map(item => {
    const operations = partOperations[item.code] || [];

    const line = partLines[item.code] || '';

    return `
    <tr>
      <td class="col-check">
        <input type="checkbox" class="part-select-checkbox" value="${esc(item.code)}" aria-label="勾選 ${esc(item.code)}">
      </td>
      <td><span class="part-code">${esc(item.code)}</span></td>

      <td>
        <select
          data-part-code="${esc(item.code)}"
          onchange="updatePartLine(this.dataset.partCode, this.value)"
          style="width:130px${line ? '' : ';border-color:var(--warn)'}"
          aria-label="${esc(item.code)} 加工線別">
          <option value="">未設定</option>
          ${getProcessLines().map(optionLine => `
            <option value="${esc(optionLine)}" ${line === optionLine ? 'selected' : ''}>${esc(formatLineLabel(optionLine))}</option>
          `).join('')}
        </select>
      </td>

      <td>
        <select
          data-part-code="${esc(item.code)}"
          onchange="updatePartInfo(this.dataset.partCode, 'supplier', this.value)"
          style="width:120px"
          aria-label="${esc(item.code)} 素材廠商">
          <option value="">未設定</option>
          ${suppliers.map(supplier => `
            <option value="${esc(supplier)}" ${partInfo[item.code]?.supplier === supplier ? 'selected' : ''}>${esc(supplier)}</option>
          `).join('')}
        </select>
      </td>

      <td>
        <input
          type="text"
          data-part-code="${esc(item.code)}"
          value="${esc(partInfo[item.code]?.owner || '')}"
          placeholder="擔當人員"
          onchange="updatePartInfo(this.dataset.partCode, 'owner', this.value)"
          style="width:120px"
          aria-label="${esc(item.code)} 擔當人員">
      </td>

      <td class="num">${operations.length ? `<span class="pill pill-accent">${operations.length}</span>` : '<span class="muted">—</span>'}</td>

      <td class="col-actions">
        <div class="row-actions">
          <button class="btn btn-ghost btn-sm" onclick="openPartMaster('${jsArg(item.code)}')">${icon('pencil')}OP／NT</button>
          <button class="btn btn-danger-ghost btn-icon btn-sm" title="停用" aria-label="停用 ${esc(item.code)}" onclick="disablePart('${jsArg(item.type)}', '${jsArg(item.code)}')">${icon('ban')}</button>
        </div>
      </td>
    </tr>
  `;
  }).join('');
} // renderPartLineSettings 結束

let editingPartCode = null;

function openPartMaster(partCode) {
  editingPartCode = partCode;

  document.getElementById('part-master-code').textContent = partCode;
  document.getElementById('part-master-overlay').classList.remove('hidden');

  renderPartOperationRows();
} // openPartMaster 結束

function closePartMaster() {
  document.getElementById('part-master-overlay').classList.add('hidden');
  editingPartCode = null;
} // closePartMaster 結束

function renderPartOperationRows() {
  const partOperations = loadPartOperations();
  const operations = partOperations[editingPartCode] || [];
  const tbody = document.getElementById('part-master-ops');

  tbody.innerHTML = operations.map(item => `
    <tr>
      <td>
        <input type="text"
          value="${esc(item.op || '')}"
          placeholder="OP10"
          data-field="op">
      </td>

      <td>
        <input type="text"
          value="${esc(item.machine || '')}"
          placeholder="1530-002719"
          data-field="machine">
      </td>

      <td>
        <input type="number"
          value="${item.nt || ''}"
          placeholder="813"
          data-field="nt">
      </td>

      <td class="col-actions">
        <button class="btn btn-danger-ghost btn-icon btn-sm" title="刪除這個 OP" aria-label="刪除這個 OP"
          onclick="this.closest('tr').remove()">${icon('trash')}</button>
      </td>
    </tr>
  `).join('');
} // renderPartOperationRows 結束

function addPartOperationRow() {
  const tbody = document.getElementById('part-master-ops');
  const nextOP = (tbody.children.length + 1) * 10;

  tbody.insertAdjacentHTML('beforeend', `
    <tr>
      <td>
        <input type="text"
          value="OP${nextOP}"
          data-field="op">
      </td>

      <td>
        <input type="text"
          placeholder="1530-002719"
          data-field="machine">
      </td>

      <td>
        <input type="number"
          placeholder="813"
          data-field="nt">
      </td>

      <td class="col-actions">
        <button class="btn btn-danger-ghost btn-icon btn-sm" title="刪除這個 OP" aria-label="刪除這個 OP"
          onclick="this.closest('tr').remove()">${icon('trash')}</button>
      </td>
    </tr>
  `);
  tbody.lastElementChild.querySelector('[data-field="machine"]').focus();
} // addPartOperationRow 結束

function savePartMaster() {
  if (!editingPartCode) return;

  const rows = document.querySelectorAll('#part-master-ops tr');
  const operations = [];

  for (const row of rows) {
    const op = row.querySelector('[data-field="op"]').value.trim().toUpperCase();
    const machine = row.querySelector('[data-field="machine"]').value.trim().toUpperCase();
    const nt = Number(row.querySelector('[data-field="nt"]').value);

    if (!op || !machine || !Number.isFinite(nt) || nt <= 0) {
      toast('請完整輸入 OP、管理編號與 NT', 'error');
      return;
    }

    operations.push({ op, machine, nt });
  }

  const partOperations = loadPartOperations();
  partOperations[editingPartCode] = operations;

  savePartOperations(partOperations);

  closePartMaster();
  renderPartLineSettings();

  toast('已儲存加工部品資料', 'success');
} // savePartMaster 結束

async function disableSelectedParts() {
  const checked = [
    ...document.querySelectorAll(
      '.part-select-checkbox:checked'
    )
  ];

  if (checked.length === 0) {
    toast('請先勾選要停用的部品', 'error');
    return;
  }

  const codes = checked.map(item => item.value);

  if (
    !await uiConfirm(
      `停用後不參與每日部品、加工數與加工線負荷計算，之後可在「停用部品管理」恢復。`,
      { title: `停用 ${codes.length} 個部品`, danger: true, okText: '停用' }
    )
  ) {
    return;
  }

  const invalidParts = loadInvalidParts();

  codes.forEach(code => {
    if (!invalidParts.includes(code)) {
      invalidParts.push(code);
    }
  });

  saveInvalidParts(invalidParts);

  renderPartLineSettings();
  renderDailyParts();
  renderResult();

  toast(
    `已停用 ${codes.length} 個部品`,
    'success'
  );
} // disableSelectedParts 結束

async function disablePart(type, code) {
  if (
    !await uiConfirm(
      `停用後不參與每日部品、加工數與加工線負荷計算，之後可在「停用部品管理」恢復。`,
      { title: `停用部品 ${code}`, danger: true, okText: '停用' }
    )
  ) {
    return;
  }

  const invalidParts = loadInvalidParts();

  if (!invalidParts.includes(code)) {
    invalidParts.push(code);
  }

  saveInvalidParts(invalidParts);

  renderPartLineSettings();
  renderDailyParts();
  renderResult();

  toast(`已停用部品：${code}`, 'success');
} // disablePart 結束

async function restoreInvalidPart() {
  const invalidParts = loadInvalidParts();

  if (invalidParts.length === 0) {
    toast('目前沒有停用部品', 'error');
    return;
  }

  const input = await uiPrompt(
    `目前停用 ${invalidParts.length} 個部品，選擇要恢復計算的部品`,
    {
      title: '停用部品管理',
      options: invalidParts,
      okText: '恢復'
    }
  );

  if (!input) return;

  const index = invalidParts.indexOf(input);

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= invalidParts.length
  ) {
    toast('輸入的編號不正確', 'error');
    return;
  }

  const code = invalidParts[index];
  invalidParts.splice(index, 1);

  saveInvalidParts(invalidParts);

  renderPartLineSettings();
  renderDailyParts();
  renderResult();

  toast(`已恢復部品：${code}`, 'success');
} // restoreInvalidPart 結束

function updatePartInfo(partCode, field, value) {
  const partInfo = loadPartInfo();

  if (!partInfo[partCode]) {
    partInfo[partCode] = {
      supplier: '',
      owner: ''
    };
  }

  partInfo[partCode][field] = value.trim();

  savePartInfo(partInfo);

  renderDailyParts();

  toast(`已儲存 ${partCode} 的資料`, 'success');
} // updatePartInfo 結束

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

const collapsedLineGroups = new Set();

function toggleLineGroup(line) {
  if (collapsedLineGroups.has(line)) {
    collapsedLineGroups.delete(line);
  } else {
    collapsedLineGroups.add(line);
  }

  renderDailyParts();
} // toggleLineGroup 結束

function renderDailyParts() {
  const dailyPlan = loadDailyPlan();
  const partLines = loadPartLines();
  const dates = Object.keys(dailyPlan).sort();
  const data = calculateDailyParts();
  const filterEl = document.getElementById('daily-line-filter');
  const selectedLine = filterEl ? filterEl.value : '';

  if (filterEl) {
    filterEl.innerHTML =
      '<option value="">全部加工線</option>' +
      getProcessLines().map(line => `
      <option value="${line}">${formatLineLabel(line)}</option>
    `).join('');

    filterEl.value = selectedLine;
  }

  const filteredData = selectedLine
    ? data.filter(item => partLines[item.code] === selectedLine)
    : data;

  // 依加工線分組
  const groupedData = {};

  filteredData.forEach(item => {
    const line = partLines[item.code] || 'UNASSIGNED';

    if (!groupedData[line]) groupedData[line] = [];

    groupedData[line].push(item);
  });

  const groupOrder = [...getProcessLines(), 'UNASSIGNED'];

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
  summary.textContent = selectedLine
    ? `${formatLineLabel(selectedLine)}｜${filteredData.length} 種部品／${dates.length} 個生產日期`
    : `${data.length} 種部品／${dates.length} 個生產日期`;

  thead.innerHTML = `
    <tr>
      <th>加工線別</th>
      <th>部品代號</th>
      <th class="num">總數</th>
      ${dates.map(dateKey =>
    `<th class="num">${formatDailyDate(dateKey)}</th>`
  ).join('')}
    </tr>
  `;

  tbody.innerHTML = groupOrder
    .filter(line => groupedData[line]?.length)
    .map(line => {
      const items = groupedData[line];
      const lineName = line === 'UNASSIGNED'
        ? '未設定加工線'
        : formatLineLabel(line);
      const isCollapsed = collapsedLineGroups.has(line);

      const groupTotal = items.reduce(
        (sum, item) => sum + item.total,
        0
      );

      return `
        <tr class="line-group-row" onclick="toggleLineGroup('${jsArg(line)}')">
          <td colspan="${3 + dates.length}">
            ${icon('chevron', `group-caret ${isCollapsed ? '' : 'open'}`)}
            <span style="${line === 'UNASSIGNED' ? 'color:var(--warn-text)' : ''}">${esc(lineName)}</span>
            <span class="pill" style="margin-left:8px">${items.length} 種部品</span>
            <span class="pill pill-accent">合計 ${groupTotal.toLocaleString()}</span>
          </td>
        </tr>

        ${isCollapsed ? '' : items.map(item => `
          <tr>
            <td>
              <select
                data-part-code="${esc(item.code)}"
                onchange="updatePartLine(this.dataset.partCode, this.value)"
                style="width:110px"
                aria-label="${esc(item.code)} 加工線別">
                <option value="">未設定</option>
                ${getProcessLines().map(optionLine => `
                  <option value="${esc(optionLine)}" ${partLines[item.code] === optionLine ? 'selected' : ''}>${esc(formatLineLabel(optionLine))}</option>
                `).join('')}
              </select>
            </td>
            <td><span class="part-code">${esc(item.code)}</span></td>
            <td class="num qty-cell">${item.total.toLocaleString()}</td>
            ${dates.map(dateKey => {
              const qty = item.dates[dateKey];
              return `<td class="num ${qty ? 'mono' : 'muted'}">${qty ? qty.toLocaleString() : '—'}</td>`;
            }).join('')}
          </tr>
        `).join('')}
      `;
    })
    .join('');
} // renderDailyParts 結束

// ===== LINE LOAD（加工線負荷，件數） =====
const UNASSIGNED_LINE = '__UNASSIGNED__';
const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

function addNestedQty(target, key, dateKey, qty) {
  if (!target[key]) target[key] = {};
  target[key][dateKey] = (target[key][dateKey] || 0) + qty;
} // addNestedQty 結束

function sumByMonth(dateMap, month) {
  return Object.entries(dateMap || {})
    .filter(([dateKey]) => dateKey.startsWith(month))
    .reduce((sum, [, qty]) => sum + qty, 0);
} // sumByMonth 結束

function formatLoadLineLabel(line) {
  return line === UNASSIGNED_LINE
    ? '未設定線別'
    : formatLineLabel(line);
} // formatLoadLineLabel 結束

// 組車計畫 × BOM → 各加工線每日件數；同時記下展不開的機種與沒線別的部品
function calculateLineLoad() {
  const dailyPlan = loadDailyPlan();
  const bomLookup = buildBOMLookup();
  const partLines = loadPartLines();
  const invalidSet = new Set(loadInvalidParts());

  const load = {};
  const unassignedParts = {};
  const noBOMModels = {};
  const emptyBOMModels = {};
  const units = {};

  Object.entries(dailyPlan).forEach(([dateKey, models]) => {
    Object.entries(models).forEach(([model, qty]) => {
      units[dateKey] = (units[dateKey] || 0) + qty;

      const row = bomLookup[normalizeModelCode(model)];

      if (!row) {
        addNestedQty(noBOMModels, model, dateKey, qty);
        return;
      }

      const codes = PART_TYPES
        .map(type => String(row[type] || '').trim())
        .filter(code => code && !invalidSet.has(code));

      if (codes.length === 0) {
        addNestedQty(emptyBOMModels, model, dateKey, qty);
        return;
      }

      codes.forEach(code => {
        const line = partLines[code] || UNASSIGNED_LINE;

        addNestedQty(load, line, dateKey, qty);

        if (line === UNASSIGNED_LINE) {
          addNestedQty(unassignedParts, code, dateKey, qty);
        }
      });
    });
  });

  const masterLines = getProcessLines();
  const otherLines = Object.keys(load)
    .filter(line =>
      line !== UNASSIGNED_LINE &&
      !masterLines.includes(line)
    )
    .sort((a, b) => a.localeCompare(b, 'zh-TW', { numeric: true }));

  const lines = [
    ...masterLines.filter(line => load[line]),
    ...otherLines,
    ...(load[UNASSIGNED_LINE] ? [UNASSIGNED_LINE] : [])
  ];

  const dates = Object.keys(dailyPlan).sort();
  const months = [...new Set(dates.map(dateKey => dateKey.slice(0, 7)))];

  return {
    load,
    lines,
    dates,
    months,
    units,
    unassignedParts,
    noBOMModels,
    emptyBOMModels
  };
} // calculateLineLoad 結束

function renderLineLoad() {
  const monthEl = document.getElementById('line-load-month');
  const emptyEl = document.getElementById('line-load-empty');
  const contentEl = document.getElementById('line-load-content');
  const summaryEl = document.getElementById('line-load-summary');

  if (!monthEl) return;

  const data = calculateLineLoad();

  if (data.months.length === 0) {
    monthEl.innerHTML = '';
    emptyEl.style.display = 'block';
    contentEl.style.display = 'none';
    summaryEl.textContent = '尚未匯入組車計畫';
    return;
  }

  emptyEl.style.display = 'none';
  contentEl.style.display = 'block';

  // 月份選單：保留目前選擇，沒有時預設資料最多的月份
  const previous = monthEl.value;
  const busiestMonth = data.months
    .map(month => [month, sumByMonth(data.units, month)])
    .sort((a, b) => b[1] - a[1])[0][0];

  monthEl.innerHTML = data.months.map(month => {
    const [year, mon] = month.split('-');
    return `<option value="${month}">${year} 年 ${Number(mon)} 月</option>`;
  }).join('');

  monthEl.value = data.months.includes(previous) ? previous : busiestMonth;

  const month = monthEl.value;
  const monthDates = data.dates.filter(dateKey => dateKey.startsWith(month));

  // 統計卡
  const monthUnits = sumByMonth(data.units, month);
  const monthPieces = data.lines.reduce(
    (sum, line) => sum + sumByMonth(data.load[line], month),
    0
  );
  const monthUnassigned = sumByMonth(data.load[UNASSIGNED_LINE], month);
  const uncountedUnits =
    Object.values(data.noBOMModels).reduce((sum, d) => sum + sumByMonth(d, month), 0) +
    Object.values(data.emptyBOMModels).reduce((sum, d) => sum + sumByMonth(d, month), 0);

  document.getElementById('line-load-units').textContent = monthUnits.toLocaleString();
  document.getElementById('line-load-pieces').textContent = monthPieces.toLocaleString();
  document.getElementById('line-load-unassigned').textContent = monthUnassigned.toLocaleString();
  document.getElementById('line-load-uncounted').textContent = uncountedUnits.toLocaleString();

  summaryEl.textContent =
    `${data.lines.length} 條加工線／${monthDates.length} 個生產日｜資料涵蓋 ${data.months.length} 個月`;

  // 日別表
  const dailyTable = document.getElementById('line-load-daily');
  const dateTotals = monthDates.map(dateKey =>
    data.lines.reduce((sum, line) => sum + (data.load[line]?.[dateKey] || 0), 0)
  );

  dailyTable.innerHTML = `
    <thead>
      <tr>
        <th class="sticky-col">加工線</th>
        ${monthDates.map(dateKey => {
          const weekday = new Date(`${dateKey}T00:00:00`).getDay();
          return `<th class="${weekday === 0 || weekday === 6 ? 'weekend' : ''}">
            ${formatDailyDate(dateKey)}<br><small>${WEEKDAY_LABELS[weekday]}</small>
          </th>`;
        }).join('')}
        <th>月合計</th>
      </tr>
    </thead>
    <tbody>
      ${data.lines.map(line => {
        const values = monthDates.map(dateKey => data.load[line]?.[dateKey] || 0);
        const peak = Math.max(...values);
        const total = values.reduce((a, b) => a + b, 0);
        // 熱度以該列（加工線）自己的最高日為基準，小線也看得出起伏
        const rowMax = peak || 1;

        return `
          <tr class="${line === UNASSIGNED_LINE ? 'unassigned-row' : ''}">
            <td class="sticky-col">${esc(formatLoadLineLabel(line))}</td>
            ${values.map((qty, i) => {
              if (qty === 0) return '<td class="load-zero">·</td>';
              const h = Math.max(0.08, qty / rowMax);
              return `<td class="heat ${h > 0.62 ? 'hot' : ''} ${qty === peak ? 'load-peak' : ''}" style="--h:${h.toFixed(3)}"
                title="${esc(formatLoadLineLabel(line))}｜${formatDailyDate(monthDates[i])}｜${qty.toLocaleString()} 件">${qty.toLocaleString()}</td>`;
            }).join('')}
            <td class="total-col">${total.toLocaleString()}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
    <tfoot>
      <tr>
        <td class="sticky-col">合計</td>
        ${dateTotals.map(qty => `<td>${qty ? qty.toLocaleString() : '·'}</td>`).join('')}
        <td class="total-col">${monthPieces.toLocaleString()}</td>
      </tr>
    </tfoot>
  `;

  // 當月件數排行
  const ranking = data.lines
    .map(line => [line, sumByMonth(data.load[line], month)])
    .filter(([, qty]) => qty > 0)
    .sort((a, b) => b[1] - a[1]);
  const rankMax = ranking[0]?.[1] || 1;

  document.getElementById('line-load-ranking').innerHTML = ranking.length
    ? ranking.map(([line, qty], i) => `
        <div class="rank-row ${line === UNASSIGNED_LINE ? 'warn' : ''}">
          <span class="rank-name">${esc(formatLoadLineLabel(line))}</span>
          <span class="rank-value">${qty.toLocaleString()}</span>
          <div class="rank-bar"><i style="--w:${(qty / rankMax).toFixed(3)};animation-delay:${i * 25}ms"></i></div>
        </div>
      `).join('')
    : '<p class="card-sub">這個月沒有加工件數</p>';

  // 月別表（全部月份）
  const monthlyTable = document.getElementById('line-load-monthly');

  monthlyTable.innerHTML = `
    <thead>
      <tr>
        <th class="sticky-col">加工線</th>
        ${data.months.map(m => `<th class="${m === month ? 'current-month' : ''}">${m.replace('-', '/')}</th>`).join('')}
        <th>合計</th>
      </tr>
    </thead>
    <tbody>
      ${data.lines.map(line => {
        const values = data.months.map(m => sumByMonth(data.load[line], m));
        return `
          <tr class="${line === UNASSIGNED_LINE ? 'unassigned-row' : ''}">
            <td class="sticky-col">${esc(formatLoadLineLabel(line))}</td>
            ${values.map((qty, i) => `
              <td class="${data.months[i] === month ? 'current-month' : ''} ${qty === 0 ? 'load-zero' : ''}">${qty === 0 ? '·' : qty.toLocaleString()}</td>
            `).join('')}
            <td class="total-col">${values.reduce((a, b) => a + b, 0).toLocaleString()}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  `;

  // 需要補資料
  const listOf = (source, unitLabel) =>
    Object.entries(source)
      .map(([key, dates]) => [key, sumByMonth(dates, month)])
      .filter(([, qty]) => qty > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([key, qty]) => `
        <li><span class="part-code">${esc(key)}</span><span>${qty.toLocaleString()} ${unitLabel}</span></li>
      `).join('');

  const totalOf = source =>
    Object.values(source).reduce((sum, dates) => sum + sumByMonth(dates, month), 0);

  const sections = [
    ['部品沒有設定加工線別', '到「加工部品主檔」替這些部品選加工線別', listOf(data.unassignedParts, '件'), totalOf(data.unassignedParts), '件', 'part-lines'],
    ['機種在 BOM 找不到', '到「BOM 管理」建立這些機種', listOf(data.noBOMModels, '台'), totalOf(data.noBOMModels), '台', 'bom'],
    ['BOM 沒有可加工部品', '部品欄全空白或都已停用；確定這些機種不需加工可略過', listOf(data.emptyBOMModels, '台'), totalOf(data.emptyBOMModels), '台', 'bom']
  ];

  document.getElementById('line-load-warnings').innerHTML =
    sections.map(([title, hint, items, total, unit, tab]) => {
      const count = (items.match(/<li>/g) || []).length;
      return `
        <details class="warn-block ${count ? '' : 'is-empty'}">
          <summary ${count ? '' : 'onclick="event.preventDefault()"'}>
            ${icon('chevron', 'group-caret')}
            <span>${title}</span>
            ${count
              ? `<span class="pill pill-warn">${count} 筆・${total.toLocaleString()} ${unit}</span>`
              : `<span class="pill pill-ok">${icon('check')}沒有</span>`}
          </summary>
          ${count ? `
            <p class="warn-hint">${hint}　<button class="btn btn-ghost btn-sm" onclick="switchTab('${tab}')">前往${icon('chevron')}</button></p>
            <ul class="warn-list">${items}</ul>` : ''}
        </details>
      `;
    }).join('');
} // renderLineLoad 結束

function exportLineLoad() {
  const data = calculateLineLoad();

  if (data.months.length === 0) {
    toast('尚無組車計畫可轉出', 'error');
    return;
  }

  const workbook = XLSX.utils.book_new();

  // 日別：每月一張表
  data.months.forEach(month => {
    const monthDates = data.dates.filter(dateKey => dateKey.startsWith(month));
    const rows = [
      ['加工線', ...monthDates.map(formatDailyDate), '月合計'],
      ...data.lines.map(line => {
        const values = monthDates.map(dateKey => data.load[line]?.[dateKey] || 0);
        return [
          line === UNASSIGNED_LINE ? '未設定線別' : formatLineLabel(line),
          ...values,
          values.reduce((a, b) => a + b, 0)
        ];
      })
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(rows),
      `日別_${month}`
    );
  });

  // 月別
  const monthlyRows = [
    ['加工線', ...data.months, '合計'],
    ...data.lines.map(line => {
      const values = data.months.map(m => sumByMonth(data.load[line], m));
      return [
        line === UNASSIGNED_LINE ? '未設定線別' : formatLineLabel(line),
        ...values,
        values.reduce((a, b) => a + b, 0)
      ];
    })
  ];

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet(monthlyRows),
    '月別'
  );

  XLSX.writeFile(workbook, '加工線負荷.xlsx');
  toast('加工線負荷已轉出', 'success');
} // exportLineLoad 結束

function renderMachineRequiredTime() {
  const data = calculateMachineRequiredTime();

  const tbody = document.getElementById('machine-time-tbody');
  const empty = document.getElementById('machine-time-empty');
  const summary = document.getElementById('machine-time-summary');

  if (data.length === 0) {
    const dailyParts = calculateDailyParts();

    tbody.innerHTML = '';
    empty.style.display = 'block';

    if (dailyParts.length === 0) {
      summary.textContent = '尚無每日部品資料';
    } else {
      summary.textContent =
        '已有每日部品，但尚未配對到 OP／NT';
    }

    return;
  }

  empty.style.display = 'none';

  const totalHours = data.reduce(
    (sum, item) => sum + item.requiredHours,
    0
  );

  summary.textContent =
    `${data.length} 筆設備需求｜共 ${totalHours.toFixed(1)} 小時`;

  tbody.innerHTML = data.map(item => `
    <tr>
      <td>${formatDailyDate(item.date)}</td>

      <td>
        ${item.line ? esc(formatLineLabel(item.line)) : '⚠️ 未設定'}
      </td>

      <td>
        <span class="part-code">${esc(item.partCode)}</span>
      </td>

      <td>${esc(item.op)}</td>

      <td>${esc(item.machine)}</td>

      <td class="qty-cell">${item.qty}</td>

      <td>${item.nt}</td>

      <td>${item.requiredMinutes.toFixed(1)}</td>

      <td>${item.requiredHours.toFixed(2)}</td>
    </tr>
  `).join('');
} // renderMachineRequiredTime 結束

// ===== RESULT TAB =====
function calculate() {
  const bom = loadBOM();
  const plan = loadPlan();
  const invalidSet = new Set(loadInvalidParts());
  // result: partCode -> { type, code, qty, models[] }
  const result = {};

  for (const { model, qty } of plan) {
    const modelBOM = bom[model];
    if (!modelBOM) continue;
    for (const pt of PART_TYPES) {
      const code = modelBOM[pt];
      if (!code) continue;
      if (isInvalidPart(pt, code, invalidSet)) continue;
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
  const data = calculate();
  const tbody = document.getElementById('result-tbody');
  const empty = document.getElementById('result-empty');
  const plan = loadPlan();

  // stats
  const totalModels = plan.length;
  const totalUnits = plan.reduce((s, p) => s + p.qty, 0);
  const totalParts = data.length;
  const totalQty = data.reduce((s, d) => s + d.qty, 0);

  document.getElementById('stat-models').textContent = totalModels;
  document.getElementById('stat-units').textContent = totalUnits;
  document.getElementById('stat-parts').textContent = totalParts;
  document.getElementById('stat-qty').textContent = totalQty;

  if (data.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = data.map((r, i) => `
    <tr>
      <td><span class="part-code">${esc(r.code)}</span></td>
      <td class="qty-cell">${r.qty}</td>
      <td style="font-size:0.78rem;color:var(--text-sub)">
      ${r.models.join(', ')}
      </td>
    </tr>
  `).join('');
}

function exportCSV() {
  const data = calculate();
  if (data.length === 0) { toast('尚無計算結果可匯出', 'error'); return; }

  const plan = loadPlan();
  const dateStr = new Date().toLocaleDateString('zh-TW').replace(/\//g, '');
  const header = '部品代號,加工數量,來源機種\n';
  const rows = data.map(r =>
    `${r.code},${r.qty},"${r.models.join(' / ')}"`
  ).join('\n');

  const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `K1_加工數彙總_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('已匯出 CSV 檔案', 'success');
}

// ===== 介面元件 =====
function icon(name, extraClass = '') {
  return `<svg class="i ${extraClass}"><use href="#i-${name}"/></svg>`;
} // icon 結束

// ===== TOAST =====
function toast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.innerHTML = icon(type === 'success' ? 'check' : 'alert') + `<span>${esc(msg)}</span>`;
  container.appendChild(el);

  setTimeout(() => {
    el.classList.add('leaving');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, 3200);
} // toast 結束

// ===== 對話框（取代瀏覽器原生 alert／confirm／prompt）=====
// mode：alert | confirm | prompt；prompt 可帶 options 變成下拉選單
function openDialog(mode, message, opts = {}) {
  return new Promise(resolve => {
    const overlay = document.getElementById('dialog-overlay');
    const iconEl = document.getElementById('dialog-icon');
    const titleEl = document.getElementById('dialog-title');
    const messageEl = document.getElementById('dialog-message');
    const fieldEl = document.getElementById('dialog-field');
    const okBtn = document.getElementById('dialog-ok');
    const cancelBtn = document.getElementById('dialog-cancel');
    const previousFocus = document.activeElement;

    const tone = opts.danger ? 'danger' : (opts.tone || (mode === 'alert' ? 'warn' : ''));

    iconEl.className = `dialog-icon ${tone}`;
    iconEl.innerHTML = icon(
      opts.danger ? 'trash' : mode === 'prompt' ? 'pencil' : tone === 'warn' ? 'alert' : 'info'
    );

    titleEl.textContent =
      opts.title || (mode === 'confirm' ? '請確認' : mode === 'prompt' ? '請輸入' : '提醒');
    messageEl.textContent = message || '';

    fieldEl.innerHTML = '';
    let input = null;

    if (mode === 'prompt') {
      if (opts.options) {
        input = document.createElement('select');
        input.innerHTML = opts.options
          .map(option => `<option value="${esc(option)}">${esc(option)}</option>`)
          .join('');
      } else {
        input = document.createElement('input');
        input.type = 'text';
        input.placeholder = opts.placeholder || '';
        input.value = opts.defaultValue || '';
      }
      fieldEl.appendChild(input);
    }

    okBtn.textContent = opts.okText || (mode === 'alert' ? '知道了' : '確定');
    okBtn.classList.toggle('danger', Boolean(opts.danger));
    cancelBtn.style.display = mode === 'alert' ? 'none' : '';

    const close = result => {
      overlay.classList.add('hidden');
      okBtn.onclick = null;
      cancelBtn.onclick = null;
      overlay.onclick = null;
      document.removeEventListener('keydown', onKey, true);
      previousFocus?.focus?.();
      resolve(result);
    };

    const accept = () => {
      if (mode === 'prompt') close(input.value.trim() || null);
      else close(true);
    };

    const dismiss = () => close(mode === 'prompt' ? null : mode === 'alert' ? true : false);

    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); dismiss(); }
      if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') { e.preventDefault(); accept(); }
    }

    okBtn.onclick = accept;
    cancelBtn.onclick = dismiss;
    overlay.onclick = e => { if (e.target === overlay) dismiss(); };
    document.addEventListener('keydown', onKey, true);

    overlay.classList.remove('hidden');
    (input || (opts.danger ? cancelBtn : okBtn)).focus();
  });
} // openDialog 結束

const uiAlert = (message, opts) => openDialog('alert', message, opts);
const uiConfirm = (message, opts) => openDialog('confirm', message, opts);
const uiPrompt = (message, opts) => openDialog('prompt', message, opts);

// ===== 主題 =====
function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;

  try { localStorage.setItem('k1_theme', next); } catch (e) { /* 無法儲存時只影響這次 */ }
} // toggleTheme 結束

// ===== 側欄（手機）與下拉選單 =====
function toggleSidebar(force) {
  const sidebar = document.getElementById('sidebar');
  const open = typeof force === 'boolean' ? force : !sidebar.classList.contains('open');
  sidebar.classList.toggle('open', open);
} // toggleSidebar 結束

function toggleMenu(button) {
  const menu = button.nextElementSibling;
  const willOpen = !menu.classList.contains('open');

  document.querySelectorAll('.menu.open').forEach(m => m.classList.remove('open'));
  if (willOpen) menu.classList.add('open');
} // toggleMenu 結束

document.addEventListener('click', e => {
  if (!e.target.closest('.menu-wrap')) {
    document.querySelectorAll('.menu.open').forEach(m => m.classList.remove('open'));
  } else if (e.target.closest('.menu button')) {
    e.target.closest('.menu').classList.remove('open');
  }
});

function switchTab(tab) {
  document.querySelector(`.tab-btn[data-tab="${tab}"]`)?.click();
} // switchTab 結束

function onPlanFileChosen(input) {
  const label = document.getElementById('excel-file-name');
  const file = input.files[0];

  label.textContent = file ? file.name : '選擇 Excel 檔案';
  input.closest('.dropzone').classList.toggle('has-file', Boolean(file));
} // onPlanFileChosen 結束

function toggleAllParts(checked) {
  document.querySelectorAll('.part-select-checkbox').forEach(box => {
    box.checked = checked;
  });
} // toggleAllParts 結束

// ===== 指令面板（Ctrl＋K）=====
let commandItems = [];
let commandIndex = 0;

function getCommands() {
  const tabs = [...document.querySelectorAll('.tab-btn')].map(btn => ({
    group: '前往',
    label: btn.querySelector('span').textContent,
    icon: btn.querySelector('use').getAttribute('href').slice(3),
    run: () => btn.click()
  }));

  const pickFile = (tab, inputId) => () => {
    switchTab(tab);
    document.getElementById(inputId).click();
  };

  return [
    ...tabs,
    { group: '動作', label: '匯入組車計畫 Excel', icon: 'upload', hint: '生產計畫', run: pickFile('production', 'excel-file') },
    { group: '動作', label: '轉出加工線負荷 Excel', icon: 'download', hint: '加工線負荷', run: () => exportLineLoad() },
    { group: '動作', label: '新增機種 BOM', icon: 'plus', hint: 'BOM 管理', run: () => { switchTab('bom'); openAddModal(); } },
    { group: '動作', label: 'BOM 主檔轉入', icon: 'upload', hint: 'BOM 管理', run: pickFile('bom', 'bom-excel-file') },
    { group: '動作', label: '加工部品主檔轉入', icon: 'upload', hint: '加工部品主檔', run: pickFile('part-lines', 'part-master-excel-file') },
    { group: '動作', label: '設備主檔轉入', icon: 'upload', hint: '設備主檔', run: pickFile('equipment', 'equipment-excel-file') },
    { group: '動作', label: '新增設備', icon: 'plus', hint: '設備主檔', run: () => { switchTab('equipment'); addEquipment(); } },
    { group: '動作', label: '停用部品管理', icon: 'restore', hint: '加工部品主檔', run: () => { switchTab('part-lines'); restoreInvalidPart(); } },
    { group: '偏好', label: '切換深色／淺色', icon: 'moon', run: () => toggleTheme() }
  ];
} // getCommands 結束

function openCommandPalette() {
  const overlay = document.getElementById('cmdk-overlay');
  const input = document.getElementById('cmdk-input');

  overlay.classList.remove('hidden');
  input.value = '';
  renderCommandList();
  input.focus();
} // openCommandPalette 結束

function closeCommandPalette() {
  document.getElementById('cmdk-overlay').classList.add('hidden');
} // closeCommandPalette 結束

function renderCommandList() {
  const keyword = document.getElementById('cmdk-input').value.trim().toLowerCase();
  const list = document.getElementById('cmdk-list');

  commandItems = getCommands().filter(item =>
    !keyword ||
    item.label.toLowerCase().includes(keyword) ||
    (item.hint || '').toLowerCase().includes(keyword) ||
    keyword.split('').every(ch => item.label.toLowerCase().includes(ch))
  );

  commandIndex = 0;

  if (commandItems.length === 0) {
    list.innerHTML = '<div class="cmdk-empty">找不到符合的功能</div>';
    return;
  }

  let lastGroup = '';

  list.innerHTML = commandItems.map((item, index) => {
    const header = item.group !== lastGroup ? `<div class="cmdk-group">${item.group}</div>` : '';
    lastGroup = item.group;

    return `${header}
      <button class="cmdk-item ${index === 0 ? 'active' : ''}" data-index="${index}" role="option">
        ${icon(item.icon)}<span>${esc(item.label)}</span>${item.hint ? `<small>${esc(item.hint)}</small>` : ''}
      </button>`;
  }).join('');
} // renderCommandList 結束

function setCommandIndex(index) {
  const items = document.querySelectorAll('.cmdk-item');
  if (items.length === 0) return;

  commandIndex = (index + items.length) % items.length;
  items.forEach(item => item.classList.toggle('active', Number(item.dataset.index) === commandIndex));
  items[commandIndex].scrollIntoView({ block: 'nearest' });
} // setCommandIndex 結束

function runCommand(index) {
  const item = commandItems[index];
  if (!item) return;

  closeCommandPalette();
  item.run();
} // runCommand 結束

document.getElementById('cmdk-input').addEventListener('input', renderCommandList);

document.getElementById('cmdk-list').addEventListener('click', e => {
  const item = e.target.closest('.cmdk-item');
  if (item) runCommand(Number(item.dataset.index));
});

document.getElementById('cmdk-list').addEventListener('mousemove', e => {
  const item = e.target.closest('.cmdk-item');
  if (item && Number(item.dataset.index) !== commandIndex) setCommandIndex(Number(item.dataset.index));
});

document.addEventListener('keydown', e => {
  const paletteOpen = !document.getElementById('cmdk-overlay').classList.contains('hidden');

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    paletteOpen ? closeCommandPalette() : openCommandPalette();
    return;
  }

  if (paletteOpen) {
    if (e.key === 'Escape') { e.preventDefault(); closeCommandPalette(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); setCommandIndex(commandIndex + 1); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCommandIndex(commandIndex - 1); }
    if (e.key === 'Enter') { e.preventDefault(); runCommand(commandIndex); }
    return;
  }

  if (e.key === 'Escape') {
    if (!document.getElementById('modal-overlay').classList.contains('hidden')) closeModal();
    if (!document.getElementById('part-master-overlay').classList.contains('hidden')) closePartMaster();
    toggleSidebar(false);
  }
});

// ===== UTILS =====
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 放進 onclick="fn('…')" 的字串：先做 JS 跳脫，再做 HTML 跳脫
function jsArg(str) {
  return esc(String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'"));
}
function buildDateColumns(headerRow) {
  const columns = {};
  let year = null;
  let month = null;
  let previousDay = null;

  // 日期從 G 欄（索引 6）開始；F 欄是台數
  for (let col = 6; col < headerRow.length; col++) {
    if (headerRow[col] === null || headerRow[col] === '') continue;

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
    !await uiConfirm('生產計畫會換成這份檔案的內容；每日計畫只取代檔案涵蓋的日期，其他月份保留。', { title: '匯入組車計畫', okText: '匯入' })
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

    const normalizeModel = normalizeModelCode;

    const dailyPlan = {};
    let dateColumns = {};
    const fileDates = new Set();
    const excelModels = {};

    rows.forEach(row => {
      const isHeader = String(row[1] || '').trim().toUpperCase() === 'NO';

      if (isHeader) {
        dateColumns = buildDateColumns(row);
        Object.values(dateColumns).forEach(dateKey => fileDates.add(dateKey));
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

    if (fileDates.size === 0) {
      toast('找不到日期表頭（B 欄為 NO 的那一列）', 'error');
      return;
    }

    // 每日計畫依日期合併：這份檔案涵蓋的日期以新資料取代，其他月份保留
    const mergedDailyPlan = loadDailyPlan();

    fileDates.forEach(dateKey => {
      delete mergedDailyPlan[dateKey];
    });

    Object.assign(mergedDailyPlan, dailyPlan);

    saveDailyPlan(mergedDailyPlan);
    renderDailyParts();
    renderLineLoad();

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
        pendingModels.push({ model: excelModel, qty });
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
      // 每日計畫已換成新檔案，生產計畫也一併換掉，兩邊才一致
      savePlan([]);
      renderPlan();
      renderResult();
      fileInput.value = '';

      toast('沒有找到已建立 BOM 的機種', 'error');

      if (missingModels.length > 0) {
        await uiAlert(
          `${missingModels.length} 個機種尚未建立 BOM，已列在「生產計畫」的待建立清單。\n\n` +
          missingModels.slice(0, 12).join('、') +
          (missingModels.length > 12 ? ` 等` : ''),
          { title: '找不到已建立 BOM 的機種', tone: 'warn' }
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

      await uiAlert(
        `${missingModels.length} 個機種尚未建立 BOM，沒有算進加工數，已列在「待建立 BOM」：\n\n` +
        missingModels.slice(0, 12).join('、') +
        (missingModels.length > 12 ? ` 等${extraText ? '' : ''}` : ''),
        { title: `匯入完成：${newPlan.length} 個機種、${totalQty.toLocaleString()} 台`, tone: 'warn' }
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

// 開啟上次停留的頁面
(function restoreLastTab() {
  let last = null;
  try { last = localStorage.getItem('k1_last_tab'); } catch (e) { /* 忽略 */ }
  if (last && last !== 'bom') switchTab(last);
})();
