// prototype state
const state = {
  user: null,
  shipments: [
    { id:1, vehicle:'GC-1234-22', gross:15200, tare:7000, origin:'Sunyani', destination:'Tema Port', status:'En Route' },
    { id:2, vehicle:'GN-9090-23', gross:10500, tare:6800, origin:'Takoradi', destination:'Accra Warehouse', status:'Delivered' },
    { id:3, vehicle:'GT-7744-21', gross:18000, tare:7000, origin:'Asankragwa', destination:'Takoradi Port', status:'Arrived' }
  ]
};

// -----------------------------
// Toast Notification Function
// -----------------------------
function showToast(message, type = "info", duration = 3000) {
  const toast = document.getElementById('toast');
  const toastIcon = document.getElementById('toast-icon');
  const toastMessage = document.getElementById('toast-message');

  // Reset classes
  toast.className = "toast";
  toast.classList.add(type);

  // Set icon based on type
  switch (type) {
    case "success":
      toastIcon.className = "fas fa-check-circle";
      break;
    case "warning":
      toastIcon.className = "fas fa-exclamation-triangle";
      break;
    case "error":
      toastIcon.className = "fas fa-times-circle";
      break;
    default:
      toastIcon.className = "fas fa-info-circle";
  }

  // Set message and show toast
  toastMessage.textContent = message;
  toast.classList.add("show");

  // Hide after duration
  setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}



const API_BASE = "http://localhost:3000/api";

//helper functions for API

async function loadInventory() {
  const res = await fetch(`${API_BASE}/inventory`);
  const items = await res.json();
  renderInventory(items);
}

async function loadSuppliers() {
  const res = await fetch(`${API_BASE}/suppliers`);
  const suppliers = await res.json();
  renderSuppliers(suppliers);
}

async function loadClients() {
  const res = await fetch(`${API_BASE}/clients`);
  const clients = await res.json();
  renderClients(clients);
}

async function loadReports() {
  const res = await fetch(`${API_BASE}/reports/summary`);
  const summary = await res.json();
  renderReports(summary);
}


// helpers
function showApp() {
  document.getElementById('screen-login').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  document.getElementById('user-display').innerText = state.user || 'User';
  document.getElementById('avatar-initials').innerText = (state.user || 'AC').split(' ').map(s=>s[0]).slice(0,2).join('');
  renderShipments();
}

// login
document.getElementById('btn-login').addEventListener('click', () => {
  const u = document.getElementById('login-username').value || 'Field Officer';
  state.user = u;
  showApp();
});

document.getElementById('btn-demo-login').addEventListener('click', () => {
  state.user = 'Demo User';
  showApp();
});

// navigation
document.querySelectorAll('#nav button[data-target]').forEach(btn=>{
  btn.addEventListener('click', e=>{
    document.querySelectorAll('#nav button[data-target]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const t = btn.dataset.target;
    showPage(t);
  });
});

function showPage(id){
  document.querySelectorAll('.page').forEach(p=>{
    p.style.display = 'none';
    p.classList.remove('active');
  });
  const map = {
    'dashboard':'page-dashboard',
    'tracking':'page-tracking',
    'inventory':'page-inventory',
    'suppliers':'page-suppliers',
    'reports':'page-reports',
    'settings':'page-settings'
  };
  const sel = map[id] || 'page-dashboard';
  const page = document.getElementById(sel);
  if(page) {
    page.style.display = 'block';
    page.classList.add('active');
  }
}

document.getElementById('btn-logout').addEventListener('click', ()=>{
  // simple logout to login view
  state.user = null;
  document.getElementById('app').style.display = 'none';
  document.getElementById('screen-login').style.display = '';
  window.scrollTo(0,0);
});

// shipment UI
const modal = document.getElementById('modal-backdrop');
document.getElementById('open-add-shipment').addEventListener('click', openModal);

function openModal(){
  modal.classList.add('active');
  // reset fields
  ['f-vehicle','f-driver','f-gross','f-tare','f-origin','f-destination'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('f-status').value = 'En Route';
  updateCalculated();
  // attach listeners
  ['f-gross','f-tare'].forEach(id => document.getElementById(id).addEventListener('input', updateCalculated));
}

function closeModal(){
  modal.classList.remove('active');
}

function updateCalculated(){
  const gross = Number(document.getElementById('f-gross').value) || 0;
  const tare = Number(document.getElementById('f-tare').value) || 0;
  const net = Math.max(0, gross - tare);
  const ton = (net / 1000);
  document.getElementById('calculated-net').innerText = net.toFixed(0) + ' kg';
  document.getElementById('calculated-ton').innerText = ton.toFixed(2) + ' MT';
}

function addShipment(){
  const vehicle = document.getElementById('f-vehicle').value || 'UNKNOWN';
  const driver = document.getElementById('f-driver').value || '';
  const gross = Number(document.getElementById('f-gross').value) || 0;
  const tare = Number(document.getElementById('f-tare').value) || 0;
  const origin = document.getElementById('f-origin').value || '';
  const destination = document.getElementById('f-destination').value || '';
  const status = document.getElementById('f-status').value || 'En Route';
  const id = Date.now();
  state.shipments.unshift({ id, vehicle, gross, tare, origin, destination, status, driver });
  closeModal();
  renderShipments();
  goTo('tracking');
}

function renderShipments(){
  const tbody = document.getElementById('shipments-tbody');
  tbody.innerHTML = '';
  state.shipments.forEach(s=>{
    const net = Math.max(0, s.gross - (s.tare||0));
    const ton = (net/1000).toFixed(2);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(s.vehicle)}</td>
      <td>${ton}</td>
      <td>${s.gross}</td>
      <td>${s.tare}</td>
      <td>${escapeHtml(s.origin)}</td>
      <td>${escapeHtml(s.destination)}</td>
      <td>${statusBadge(s.status)}</td>
      <td class="table-actions">
        <button class="btn btn-secondary btn-small" onclick="viewShipment(${s.id})">View</button>
        <button class="btn btn-primary btn-small" onclick="markDelivered(${s.id})">Mark Delivered</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  document.getElementById('shipment-count').innerText = state.shipments.length;
}

/* -------------------------
   CSV Export Feature
   ------------------------- */
function exportShipmentsToCSV() {
  if (!state.shipments.length) {
    showToast("No shipment data to export!", "warning");
    return;
  }

  const headers = ["Vehicle", "Driver", "Gross (kg)", "Tare (kg)", "Origin", "Destination", "Status"];
  const rows = state.shipments.map(s => [
    s.vehicle, s.driver || 'N/A', s.gross, s.tare, s.origin, s.destination, s.status
  ]);

  const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `Adikanfo_Shipments_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast("Shipments exported successfully!", "success");

}


// attach handler
document.addEventListener('DOMContentLoaded', () => {
  const exportBtn = document.getElementById('export-csv');
  if (exportBtn) exportBtn.addEventListener('click', exportShipmentsToCSV);
  
});


function statusBadge(status){
  if(status === 'En Route') return `<span class="badge enroute">${status}</span>`;
  if(status === 'Delivered') return `<span class="badge delivered">${status}</span>`;
  return `<span class="small">${status}</span>`;
}

function viewShipment(id){
  const s = state.shipments.find(x=>x.id===id);
  if(!s) return alert('Not found');
  alert(`Vehicle: ${s.vehicle}\nDriver: ${s.driver || 'N/A'}\nNet: ${Math.max(0,s.gross - s.tare)} kg (${((Math.max(0,s.gross-s.tare))/1000).toFixed(2)} MT)\nOrigin: ${s.origin}\nDestination: ${s.destination}\nStatus: ${s.status}`);
}

function markDelivered(id){
  const s = state.shipments.find(x=>x.id===id);
  if(!s) return;
  s.status = 'Delivered';
  renderShipments();
}

// =========================
// MODAL CONTROL LOGIC
// =========================

// --- Supplier Modal ---
const supplierModal = document.getElementById("add-supplier-modal");
const closeSupplierModal = document.getElementById("close-supplier-modal");
const supplierForm = document.getElementById("add-supplier-form");

document.querySelectorAll(".btn-add-supplier").forEach(btn => {
  btn.addEventListener("click", () => {
    supplierModal.style.display = "flex";
  });
});

closeSupplierModal.onclick = () => supplierModal.style.display = "none";
window.onclick = (e) => { if (e.target === supplierModal) supplierModal.style.display = "none"; };

supplierForm.addEventListener("submit", (e) => {
  e.preventDefault();
  showToast("Supplier added successfully!", "success");
  supplierModal.style.display = "none";
  supplierForm.reset();
});

// --- Update Stock Modal ---
const stockModal = document.getElementById("update-stock-modal");
const closeStockModal = document.getElementById("close-stock-modal");
const stockForm = document.getElementById("update-stock-form");

document.querySelectorAll(".btn-update-stock").forEach(btn => {
  btn.addEventListener("click", (e) => {
    const commodity = e.target.closest(".inventory-card").querySelector(".inventory-title").textContent;
    document.getElementById("commodity").value = commodity;
    stockModal.style.display = "flex";
  });
});

closeStockModal.onclick = () => stockModal.style.display = "none";
window.onclick = (e) => { if (e.target === stockModal) stockModal.style.display = "none"; };

stockForm.addEventListener("submit", (e) => {
  e.preventDefault();
  showToast("Stock updated successfully!", "success");
  stockModal.style.display = "none";
  stockForm.reset();
});


// small utilities
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, function(m){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])}); }

// helpers for routing
function goTo(page){
  // map friendly names
  const map = { 'dashboard':'dashboard','tracking':'tracking','inventory':'inventory','suppliers':'suppliers','reports':'reports','settings':'settings' };
  const navBtn = [...document.querySelectorAll('#nav button[data-target]')].find(b => b.dataset.target === page);
  if(navBtn){
    navBtn.click();
  } else {
    // fallback show
    showPage(page);
  }
}

// filters (simple)
document.getElementById('filter-search').addEventListener('input', function(){
  const q = this.value.toLowerCase().trim();
  const rows = document.querySelectorAll('#shipments-tbody tr');
  rows.forEach(r=>{
    r.style.display = (r.innerText.toLowerCase().indexOf(q) >= 0) ? '' : 'none';
  });
});

document.getElementById('filter-status').addEventListener('change', function(){
  const val = this.value;
  document.querySelectorAll('#shipments-tbody tr').forEach(r=>{
    if(!val) r.style.display = '';
    else r.style.display = (r.innerText.indexOf(val) >= 0) ? '' : 'none';
  });
});

//helping API at the TOP

function renderInventory(items) {
  const container = document.getElementById('inventory-list');
  if (!container) return;
  container.innerHTML = items.map(i => `
    <div class="inventory-card">
      <div class="inventory-header">
        <div class="inventory-icon"><i class="fas fa-box"></i></div>
        <div>
          <div class="inventory-title">${i.item}</div>
          <div class="text-sm">${i.location}</div>
        </div>
      </div>
      <div class="inventory-stats">
        <div class="inventory-value">${i.quantity} ${i.unit}</div>
      </div>
    </div>
  `).join('');
}

function renderSuppliers(list) {
  const container = document.getElementById('suppliers-list');
  if (!container) return;
  container.innerHTML = list.map(s => `
    <div class="card">
      <h4>${s.name}</h4>
      <p><strong>Contact:</strong> ${s.contact}</p>
      <p><strong>Location:</strong> ${s.location}</p>
    </div>
  `).join('');
}

function renderClients(list) {
  const container = document.getElementById('clients-list');
  if (!container) return;
  container.innerHTML = list.map(c => `
    <div class="card">
      <h4>${c.name}</h4>
      <p><strong>Contact:</strong> ${c.contact}</p>
      <p><strong>Location:</strong> ${c.location}</p>
    </div>
  `).join('');
}

function renderReports(summary) {
  const container = document.getElementById('reports-summary');
  if (!container) return;
  container.innerHTML = `
    <div class="report-card">
      <h3>Reports Summary</h3>
      <ul>
        <li>Total Shipments: <strong>${summary.totalShipments}</strong></li>
        <li>Delivered Shipments: <strong>${summary.totalDelivered}</strong></li>
        <li>Total Inventory Items: <strong>${summary.totalInventoryItems}</strong></li>
        <li>Suppliers: <strong>${summary.totalSuppliers}</strong></li>
        <li>Clients: <strong>${summary.totalClients}</strong></li>
      </ul>
    </div>
  `;
}


// initialize small demo state if already logged in via demo
// nothing else

