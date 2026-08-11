// ===== CONSTANTS =====
const BOM_KEY = 'k1_bom_data';
const PLAN_KEY = 'k1_production_plan';
const PENDING_KEY = 'k1_pending_bom';
const DAILY_PLAN_KEY = 'k1_daily_production_plan';
const PART_LINE_KEY = 'k1_part_lines';
const PART_OPS_KEY = 'k1_part_operations';
const EQUIPMENT_KEY = 'k1_equipment_master';
const PART_TYPES = ['L CASE', 'R CASE', 'L COVER', 'R COVER', 'M CASE', 'UPPER CASE', 'BED CASE'];
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
function loadBOM() { return JSON.parse(localStorage.getItem(BOM_KEY) || '{}'); }
function saveBOM(d) { localStorage.setItem(BOM_KEY, JSON.stringify(d)); }
function loadPlan() { return JSON.parse(localStorage.getItem(PLAN_KEY) || '[]'); }
function savePlan(d) { localStorage.setItem(PLAN_KEY, JSON.stringify(d)); }
function loadPending() { return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]'); }
function savePending(d) { localStorage.setItem(PENDING_KEY, JSON.stringify(d)); }
function loadDailyPlan() { return JSON.parse(localStorage.getItem(DAILY_PLAN_KEY) || '{}'); }
function saveDailyPlan(d) { localStorage.setItem(DAILY_PLAN_KEY, JSON.stringify(d)); }
function loadPartLines() { return JSON.parse(localStorage.getItem(PART_LINE_KEY) || '{}'); }
function savePartLines(d) { localStorage.setItem(PART_LINE_KEY, JSON.stringify(d)); }

function loadPartOperations() { return JSON.parse(localStorage.getItem(PART_OPS_KEY) || '{}'); }
function savePartOperations(d) { localStorage.setItem(PART_OPS_KEY, JSON.stringify(d)); }

function loadEquipmentMaster() {
  return JSON.parse(localStorage.getItem(EQUIPMENT_KEY) || '[]');
}

function saveEquipmentMaster(d) {
  localStorage.setItem(EQUIPMENT_KEY, JSON.stringify(d));
}

function getProcessLines() {
  const equipment = loadEquipmentMaster();

  const equipmentLines = equipment
    .map(item =>
      String(item.line || '')
        .trim()
        .replace(/\s*LINE$/i, '')
    )
    .filter(Boolean);

  return [...new Set([
    ...PROCESS_LINES,
    ...equipmentLines
  ])];
} // getProcessLines 結束

// ===== TAB =====
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'daily') renderDailyParts();
    if (btn.dataset.tab === 'part-lines') renderPartLineSettings();
    if (btn.dataset.tab === 'equipment') renderEquipmentMaster();
    if (btn.dataset.tab === 'machine-time') renderMachineRequiredTime();
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

    return {
      機種代號: model,
      'L CASE': item['L CASE'] || '',
      'R CASE': item['R CASE'] || '',
      'L COVER': item['L COVER'] || '',
      'R COVER': item['R COVER'] || '',
      'M CASE': item['M CASE'] || '',
      'UPPER CASE': item['UPPER CASE'] || '',
      'BED CASE': item['BED CASE'] || ''
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
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
        bomRow[type] =
          String(row[type] || '')
            .trim()
            .toUpperCase();
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

    const pending = loadPending();

    const remainingPending = pending.filter(
      item => !bom[item.model]
    );

    savePending(remainingPending);

    renderBOM();
    renderPending();
    refreshPlanSelect();

    fileInput.value = '';

    toast(
      `BOM 轉入完成｜新增 ${addedCount} 筆｜更新 ${updatedCount} 筆`,
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

    <td>${esc(item.line || '—')} LINE</td>

    <td>${item.critical ? '✅ 是' : '— 否'}</td>

    <td>
  <button
    class="btn btn-secondary btn-sm"
    data-machine="${esc(item.machine)}"
    onclick="editEquipment(this)">
    編輯
  </button>

  <button
    class="btn btn-danger btn-sm"
    data-machine="${esc(item.machine)}"
    onclick="deleteEquipment(this.dataset.machine)">
    刪除
  </button>
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
      } else {
        equipment.push({
          machine,
          name,
          department,
          line,
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
            <option value="${line}">
              ${line} LINE
            </option>
          `).join('')}
        </select>
      </td>

      <td>
        <input
          type="checkbox"
          data-field="critical"
          checked>
      </td>

      <td>
        <button
          class="btn btn-primary btn-sm"
          onclick="saveNewEquipment(this)">
          儲存
        </button>

        <button
          class="btn btn-secondary btn-sm"
          onclick="renderEquipmentMaster()">
          取消
        </button>
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

  data.push({
    machine,
    name,
    department,
    line,
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
            value="${line}"
            ${item.line === line ? 'selected' : ''}>
            ${line} LINE
          </option>
        `).join('')}
      </select>
    </td>

    <td>
      <input
        type="checkbox"
        data-field="critical"
        ${item.critical ? 'checked' : ''}>
    </td>

    <td>
      <button
        class="btn btn-primary btn-sm"
        data-machine="${esc(item.machine)}"
        onclick="saveEquipmentEdit(this)">
        儲存
      </button>

      <button
        class="btn btn-secondary btn-sm"
        onclick="renderEquipmentMaster()">
        取消
      </button>
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
  item.critical = critical;

  saveEquipmentMaster(data);
  renderEquipmentMaster();

  toast('設備資料已更新', 'success');
} // saveEquipmentEdit 結束

function deleteEquipment(machine) {
  if (!confirm(`確定刪除設備「${machine}」？`)) return;

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
  const partOperations = loadPartOperations();

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

  tbody.innerHTML = data.map(item => {
    const operations = partOperations[item.code] || [];

    return `
    <tr>
      <td>
        <span class="part-code">${esc(item.code)}</span>
      </td>

      <td>
        <select
        data-part-code="${esc(item.code)}"
        onchange="updatePartLine(this.dataset.partCode, this.value)"
        style="width:120px"
        >
        <option value="">未設定</option>

        ${getProcessLines().map(line => `
        <option
          value="${line}"
          ${partLines[item.code] === line ? 'selected' : ''}>
          ${line} LINE
        </option>
          `).join('')}
        </select>
      </td>

      <td>${operations.length}</td>

      <td>
        <button class="btn btn-secondary btn-sm"
          onclick="openPartMaster('${esc(item.code)}')">
          編輯
        </button>
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

      <td>
        <button class="btn btn-danger btn-sm"
          onclick="this.closest('tr').remove()">
          刪除
        </button>
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

      <td>
        <button class="btn btn-danger btn-sm"
          onclick="this.closest('tr').remove()">
          刪除
        </button>
      </td>
    </tr>
  `);
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
      <option value="${line}">${line} LINE</option>
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
    ? `${selectedLine} LINE｜${filteredData.length} 種部品／${dates.length} 個生產日期`
    : `${data.length} 種部品／${dates.length} 個生產日期`;

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

  tbody.innerHTML = groupOrder
    .filter(line => groupedData[line]?.length)
    .map(line => {
      const items = groupedData[line];
      const lineName = line === 'UNASSIGNED'
        ? '⚠️ 未設定加工線'
        : `${line} LINE`;
      const isCollapsed = collapsedLineGroups.has(line);

      const groupTotal = items.reduce(
        (sum, item) => sum + item.total,
        0
      );

      return `
       <tr class="line-group-row"
       onclick="toggleLineGroup('${line}')"
       style="cursor:pointer">
          <td colspan="${4 + dates.length}"
              style="text-align:left;font-weight:700">
            ${isCollapsed ? '▶' : '▼'}
            ${lineName}
            ｜${items.length} 種部品
            ｜總數 ${groupTotal}
          </td>
        </tr>

        ${isCollapsed ? '' : items.map(item => `
          <tr>
            <td>
              <select
                data-part-code="${esc(item.code)}"
                onchange="updatePartLine(this.dataset.partCode, this.value)"
                style="width:100px"
              >
                <option value="">未設定</option>

                ${getProcessLines().map(optionLine => `
                  <option
                    value="${optionLine}"
                    ${partLines[item.code] === optionLine ? 'selected' : ''}>
                    ${optionLine} LINE
                  </option>
                `).join('')}
              </select>
            </td>

          <td>
            <span class="part-type-tag ${PART_TAG_CLASS[item.type]}">
              ${esc(item.type)}
            </span>
          </td>

          <td>
            <span class="part-code">${esc(item.code)}</span>
          </td>

          <td class="qty-cell">${item.total}</td>

          ${dates.map(dateKey =>
        `<td>${item.dates[dateKey] || '—'}</td>`
      ).join('')}
        </tr>
      `).join('')}
    `;
    })
    .join('');
} // renderDailyParts 結束

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
        ${item.line ? `${esc(item.line)} LINE` : '⚠️ 未設定'}
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
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
