/* ══════════════════════════════════════════════════════════════
   CAMAZON - Compare Page JavaScript
   ══════════════════════════════════════════════════════════════ */

let compareList = JSON.parse(localStorage.getItem('camazon_compare') || '[]');
let allProducts = [];
let compareProducts = [];
let quantities = {};

document.addEventListener('DOMContentLoaded', () => {
  fetchAllProducts();
  updateCompareCount();
});

async function fetchAllProducts() {
  try {
    const res = await fetch('/api/products');
    allProducts = await res.json();
    populateAddDropdown();
    loadCompareProducts();
  } catch (err) {
    console.error('Failed to fetch products:', err);
  }
}

function populateAddDropdown() {
  const select = document.getElementById('addProductSelect');
  const available = allProducts.filter(p => !compareList.includes(p.id));
  select.innerHTML = '<option value="">+ Add a product to compare...</option>' +
    available.map(p => `<option value="${p.id}">${p.name} — $${p.price.toFixed(2)}</option>`).join('');
}

function loadCompareProducts() {
  compareProducts = allProducts.filter(p => compareList.includes(p.id));
  
  if (compareProducts.length === 0) {
    document.getElementById('compareEmpty').style.display = 'block';
    document.getElementById('compareTableWrapper').style.display = 'none';
    document.getElementById('priceCalculator').style.display = 'none';
    return;
  }

  document.getElementById('compareEmpty').style.display = 'none';
  document.getElementById('compareTableWrapper').style.display = 'block';
  document.getElementById('priceCalculator').style.display = 'block';

  // Init quantities
  compareProducts.forEach(p => { if (!quantities[p.id]) quantities[p.id] = 1; });

  renderCompareTable();
  renderPriceCalculator();
}

function renderCompareTable() {
  const head = document.getElementById('compareHead');
  const body = document.getElementById('compareBody');

  // Find best values
  const cheapest = compareProducts.reduce((a, b) => a.price < b.price ? a : b);
  const bestRated = compareProducts.reduce((a, b) => a.rating > b.rating ? a : b);
  const mostReviewed = compareProducts.reduce((a, b) => a.reviewCount > b.reviewCount ? a : b);

  // Header row with product images
  head.innerHTML = `
    <tr>
      <th>Product</th>
      ${compareProducts.map(p => `
        <td class="product-col product-header">
          <button class="remove-btn" onclick="removeFromCompare('${p.id}')" title="Remove">
            <i class="fas fa-times"></i>
          </button>
          <a href="/product.html?id=${p.id}">
            <img src="${p.image}" alt="${p.name}" onerror="this.src='https://picsum.photos/seed/default/150/150'">
          </a>
          <div class="name"><a href="/product.html?id=${p.id}">${p.name}</a></div>
          ${p.id === cheapest.id ? '<span class="best-value-badge"><i class="fas fa-trophy"></i> Best Price</span>' : ''}
        </td>
      `).join('')}
    </tr>`;

  // Body rows
  body.innerHTML = `
    <tr>
      <th>Price</th>
      ${compareProducts.map(p => `
        <td class="${p.id === cheapest.id ? 'best-value' : ''}">
          <span style="font-size:22px;font-weight:700;">$${p.price.toFixed(2)}</span>
          ${p.originalPrice ? `<br><span class="price-original">$${p.originalPrice.toFixed(2)}</span>` : ''}
        </td>
      `).join('')}
    </tr>
    <tr>
      <th>Savings</th>
      ${compareProducts.map(p => {
        const savings = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
        return `<td>${savings > 0 ? `<span class="price-saving" style="font-size:16px;">-${savings}% ($${(p.originalPrice - p.price).toFixed(2)} off)</span>` : '<span style="color:#999">—</span>'}</td>`;
      }).join('')}
    </tr>
    <tr>
      <th>Rating</th>
      ${compareProducts.map(p => `
        <td class="${p.id === bestRated.id ? 'best-value' : ''}">
          <span style="color:#ffa41c;font-size:16px;">${renderStars(p.rating)}</span><br>
          <strong>${p.rating}</strong> / 5
        </td>
      `).join('')}
    </tr>
    <tr>
      <th>Reviews</th>
      ${compareProducts.map(p => `
        <td class="${p.id === mostReviewed.id ? 'best-value' : ''}">${p.reviewCount.toLocaleString()} reviews</td>
      `).join('')}
    </tr>
    <tr>
      <th>Brand</th>
      ${compareProducts.map(p => `<td><strong>${p.brand}</strong></td>`).join('')}
    </tr>
    <tr>
      <th>Category</th>
      ${compareProducts.map(p => `<td>${p.category}</td>`).join('')}
    </tr>
    <tr>
      <th>Availability</th>
      ${compareProducts.map(p => `
        <td>
          <span class="${p.inStock ? 'in-stock' : 'out-of-stock'}" style="font-weight:600;">
            <i class="fas fa-${p.inStock ? 'check' : 'times'}-circle"></i>
            ${p.inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </td>
      `).join('')}
    </tr>
    <tr>
      <th>Features</th>
      ${compareProducts.map(p => `
        <td class="features-cell">
          <ul>${(p.features || []).map(f => `<li>${f}</li>`).join('')}</ul>
        </td>
      `).join('')}
    </tr>
    <tr>
      <th>Description</th>
      ${compareProducts.map(p => `<td style="text-align:left;font-size:13px;color:#565959;">${p.description}</td>`).join('')}
    </tr>
  `;
}

function renderPriceCalculator() {
  const calcProducts = document.getElementById('calcProducts');
  const calcSummary = document.getElementById('calcSummary');

  calcProducts.innerHTML = compareProducts.map(p => `
    <div class="calc-product" id="calc-${p.id}">
      <div class="name">${p.name.substring(0, 40)}${p.name.length > 40 ? '...' : ''}</div>
      <div class="unit-price">$${p.price.toFixed(2)} each</div>
      <div class="qty-control">
        <button onclick="changeQty('${p.id}', -1)">−</button>
        <input type="number" value="${quantities[p.id]}" min="0" max="99" 
               onchange="setQty('${p.id}', this.value)" id="qty-${p.id}">
        <button onclick="changeQty('${p.id}', 1)">+</button>
      </div>
      <div class="subtotal" id="subtotal-${p.id}">$${(p.price * quantities[p.id]).toFixed(2)}</div>
    </div>
  `).join('');

  updateCalcSummary();
}

function changeQty(id, delta) {
  quantities[id] = Math.max(0, Math.min(99, (quantities[id] || 1) + delta));
  document.getElementById(`qty-${id}`).value = quantities[id];
  const product = compareProducts.find(p => p.id === id);
  document.getElementById(`subtotal-${id}`).textContent = `$${(product.price * quantities[id]).toFixed(2)}`;
  updateCalcSummary();
}

function setQty(id, val) {
  quantities[id] = Math.max(0, Math.min(99, parseInt(val) || 0));
  const product = compareProducts.find(p => p.id === id);
  document.getElementById(`subtotal-${id}`).textContent = `$${(product.price * quantities[id]).toFixed(2)}`;
  updateCalcSummary();
}

function updateCalcSummary() {
  const total = compareProducts.reduce((sum, p) => sum + p.price * (quantities[p.id] || 0), 0);
  const totalOriginal = compareProducts.reduce((sum, p) => sum + (p.originalPrice || p.price) * (quantities[p.id] || 0), 0);
  const totalSaved = totalOriginal - total;

  const cheapest = compareProducts.reduce((a, b) => a.price < b.price ? a : b);

  document.getElementById('calcSummary').innerHTML = `
    <div class="total">Total: $${total.toFixed(2)}</div>
    ${totalSaved > 0 ? `<div class="savings"><i class="fas fa-tag"></i> Total savings: $${totalSaved.toFixed(2)} compared to list prices</div>` : ''}
    ${compareProducts.length >= 2 ? `
      <div style="margin-top:10px;">
        <span class="best-value-badge"><i class="fas fa-trophy"></i> Best Value: ${cheapest.name.substring(0, 35)}... at $${cheapest.price.toFixed(2)}</span>
      </div>
      <div style="margin-top:8px;color:#565959;font-size:14px;">
        Price difference: $${Math.abs(compareProducts[0].price - compareProducts[1].price).toFixed(2)}
      </div>
    ` : ''}
  `;
}

function removeFromCompare(id) {
  compareList = compareList.filter(pid => pid !== id);
  delete quantities[id];
  localStorage.setItem('camazon_compare', JSON.stringify(compareList));
  updateCompareCount();
  populateAddDropdown();
  loadCompareProducts();
  showToast('Product removed from comparison', 'info');
}

// Event Listeners
document.getElementById('addProductBtn').addEventListener('click', () => {
  const select = document.getElementById('addProductSelect');
  if (!select.value) return;
  if (compareList.length >= 4) {
    showToast('Maximum 4 products for comparison', 'error');
    return;
  }
  compareList.push(select.value);
  localStorage.setItem('camazon_compare', JSON.stringify(compareList));
  updateCompareCount();
  populateAddDropdown();
  loadCompareProducts();
  showToast('Product added to comparison!', 'success');
});

document.getElementById('clearAllBtn').addEventListener('click', () => {
  compareList = [];
  quantities = {};
  localStorage.setItem('camazon_compare', JSON.stringify(compareList));
  updateCompareCount();
  populateAddDropdown();
  loadCompareProducts();
  showToast('Comparison cleared', 'info');
});

function updateCompareCount() {
  document.getElementById('compareCount').textContent = compareList.length;
}

function renderStars(rating) {
  let s = '';
  for (let i = 1; i <= 5; i++) {
    s += rating >= i ? '★' : (rating >= i - 0.5 ? '★' : '☆');
  }
  return s;
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

