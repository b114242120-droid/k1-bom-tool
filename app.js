// ===== CONSTANTS =====
const BOM_KEY  = 'k1_bom_data';
const PLAN_KEY = 'k1_production_plan';

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

// ===== TAB =====
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'result') renderResult();
  });
});

// ===== BOM TAB =====
function renderBOM() {
  const bom = loadBOM();
  const keys = Object.keys(bom);
  const tbody = document.getElementById('bom-tbody');
  const empty = document.getElementById('bom-empty');
  const countEl = document.getElementById('bom-count');

  countEl.textContent = keys.length + ' 筆機種';

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

  bom[model] = row;
  saveBOM(bom);
  closeModal();
  renderBOM();
  refreshPlanSelect();
  toast((editingModel ? '已更新 ' : '已新增 ') + model, 'success');
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
  if (!confirm('確定清空所有生產計畫？')) return;
  savePlan([]);
  renderPlan();
  toast('已清空生產計畫', 'success');
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
        .toUpperCase();

    const excelModels = {};

    rows.forEach(row => {
      const no = Number(row[1]);       // B 欄：NO
      const rawModel = row[2];         // C 欄：機種
      const qty = Number(row[5]);      // F 欄：台數

      // 排除標題、合計、空白列
      if (!Number.isFinite(no)) return;
      if (!rawModel) return;
      if (!Number.isFinite(qty) || qty <= 0) return;

      const model = normalizeModel(rawModel);

      if (!model) return;

      // 同機種自動加總
      excelModels[model] = (excelModels[model] || 0) + Math.trunc(qty);
    });

    const bom = loadBOM();

    // 建立 BOM 機種比對表
    const bomLookup = {};

    Object.keys(bom).forEach(model => {
      bomLookup[normalizeModel(model)] = model;
    });

    const newPlan = [];
    const missingModels = [];

    Object.entries(excelModels).forEach(([excelModel, qty]) => {
      const bomModel = bomLookup[excelModel];

      if (!bomModel) {
        missingModels.push(excelModel);
        return;
      }

      newPlan.push({
        model: bomModel,
        qty
      });
    });

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
refreshPlanSelect();
