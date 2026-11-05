/* ══════════════════════════════════════════════════════════════
   CAMAZON - Product Detail Page JavaScript
   ══════════════════════════════════════════════════════════════ */

let product = null;
let allProducts = [];
let compareList = JSON.parse(localStorage.getItem('camazon_compare') || '[]');

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) { window.location.href = '/'; return; }
  fetchProduct(id);
  fetchAllProducts();
  updateCompareCount();
});

async function fetchProduct(id) {
  try {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) throw new Error('Not found');
    product = await res.json();
    renderProduct();
    loadRelated();
  } catch {
    document.getElementById('productDetail').innerHTML = `
      <div style="text-align:center;padding:60px;width:100%">
        <i class="fas fa-exclamation-triangle" style="font-size:60px;color:#ddd;margin-bottom:15px;display:block"></i>
        <h2>Product Not Found</h2>
        <p style="color:#999;margin-bottom:20px">The product you're looking for doesn't exist.</p>
        <a href="/" class="btn btn-primary">Back to Home</a>
      </div>`;
  }
}

async function fetchAllProducts() {
  try {
    const res = await fetch('/api/products');
    allProducts = await res.json();
    populateCompareDropdown();
  } catch (err) { console.error(err); }
}

function renderProduct() {
  document.title = `${product.name} - Camazon`;
  
  // Breadcrumb
  document.getElementById('breadCategory').innerHTML = `<a href="/?category=${encodeURIComponent(product.category)}">${product.category}</a>`;
  document.getElementById('breadProduct').textContent = product.name;

  // Main image
  const allImages = [product.image, ...(product.images || [])];
  document.getElementById('mainImage').innerHTML = `<img src="${allImages[0]}" alt="${product.name}" id="mainImg" onerror="this.src='https://picsum.photos/seed/default/400/400'">`;

  // Thumbnails
  const strip = document.getElementById('thumbStrip');
  strip.innerHTML = allImages.map((img, i) => `
    <div class="thumb-item ${i === 0 ? 'active' : ''}" onclick="changeImage('${img}', this)">
      <img src="${img}" alt="Thumbnail ${i+1}" onerror="this.src='https://picsum.photos/seed/default/100/100'">
    </div>
  `).join('');

  // Product info
  const savings = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
  const priceParts = product.price.toFixed(2).split('.');
  const isCompared = compareList.includes(product.id);

  document.getElementById('productInfo').innerHTML = `
    <h1>${product.name}</h1>
    <div class="detail-brand">Brand: <span><a href="/?brand=${encodeURIComponent(product.brand)}">${product.brand}</a></span></div>
    <div class="star-rating" style="font-size:16px;">
      <span class="stars" style="font-size:18px;">${renderStars(product.rating)}</span>
      <span class="review-count" style="font-size:15px;">${product.reviewCount.toLocaleString()} ratings</span>
    </div>
    <div class="divider"></div>
    <div class="detail-price">
      <div class="price-label">${savings > 0 ? `<span class="price-saving" style="font-size:16px;">-${savings}%</span> ` : ''}Price:</div>
      <span class="price-current" style="font-size:32px;">
        <span class="price-symbol">$</span>${priceParts[0]}<span class="price-fraction">${priceParts[1]}</span>
      </span>
      ${product.originalPrice ? `
        <div class="price-saving-row">
          <span style="color:#565959;">List Price: <span class="price-original">$${product.originalPrice.toFixed(2)}</span></span>
          <span class="price-saving">You Save: $${(product.originalPrice - product.price).toFixed(2)} (${savings}%)</span>
        </div>
      ` : ''}
    </div>
    <div class="divider"></div>
    <div class="product-card-stock ${product.inStock ? 'in-stock' : 'out-of-stock'}" style="font-size:18px;margin-bottom:15px;">
      ${product.inStock ? '<i class="fas fa-check-circle"></i> In Stock' : '<i class="fas fa-times-circle"></i> Out of Stock'}
    </div>
    <div class="detail-description">${product.description}</div>
    ${product.features && product.features.length > 0 ? `
      <div class="detail-features">
        <h3>About this item</h3>
        <ul>${product.features.map(f => `<li>${f}</li>`).join('')}</ul>
      </div>
    ` : ''}
    <div class="detail-actions">
      <button class="btn ${isCompared ? 'btn-orange' : 'btn-compare-action'} btn-lg" id="compareBtn" onclick="toggleCompare()">
        <i class="fas fa-balance-scale"></i> ${isCompared ? 'Remove from Compare' : 'Add to Compare'}
      </button>
      <a href="/compare.html" class="btn btn-secondary btn-lg"><i class="fas fa-columns"></i> View Comparison</a>
    </div>
  `;

  // Show quick compare section
  document.getElementById('quickCompare').style.display = 'block';
}

function changeImage(src, thumb) {
  document.getElementById('mainImg').src = src;
  document.querySelectorAll('.thumb-item').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
}

function renderStars(rating) {
  let s = '';
  for (let i = 1; i <= 5; i++) {
    s += rating >= i ? '★' : (rating >= i - 0.5 ? '★' : '☆');
  }
  return s;
}

// ─── Compare ───
function toggleCompare() {
  const idx = compareList.indexOf(product.id);
  if (idx > -1) {
    compareList.splice(idx, 1);
    showToast('Removed from compare', 'info');
  } else {
    if (compareList.length >= 4) {
      showToast('Maximum 4 products for comparison', 'error');
      return;
    }
    compareList.push(product.id);
    showToast('Added to compare!', 'success');
  }
  localStorage.setItem('camazon_compare', JSON.stringify(compareList));
  updateCompareCount();
  renderProduct();
}

function updateCompareCount() {
  document.getElementById('compareCount').textContent = compareList.length;
}

// ─── Quick Compare Dropdown ───
function populateCompareDropdown() {
  const select = document.getElementById('compareWithSelect');
  const others = allProducts.filter(p => p.id !== product?.id);
  select.innerHTML = '<option value="">Select a product to compare...</option>' +
    others.map(p => `<option value="${p.id}">${p.name} - $${p.price.toFixed(2)}</option>`).join('');

  select.addEventListener('change', () => {
    if (!select.value) {
      document.getElementById('quickCompareResult').innerHTML = '';
      return;
    }
    const other = allProducts.find(p => p.id === select.value);
    if (other && product) renderQuickCompare(product, other);
  });
}

function renderQuickCompare(p1, p2) {
  const p1Cheaper = p1.price < p2.price;
  const diff = Math.abs(p1.price - p2.price).toFixed(2);
  const container = document.getElementById('quickCompareResult');
  
  container.innerHTML = `
    <table class="quick-compare-table">
      <thead>
        <tr>
          <th>Feature</th>
          <th>${p1.name.substring(0, 30)}...</th>
          <th>${p2.name.substring(0, 30)}...</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Price</strong></td>
          <td class="${p1Cheaper ? 'better' : ''}">$${p1.price.toFixed(2)}</td>
          <td class="${!p1Cheaper ? 'better' : ''}">$${p2.price.toFixed(2)}</td>
        </tr>
        <tr>
          <td><strong>Rating</strong></td>
          <td class="${p1.rating >= p2.rating ? 'better' : ''}">${renderStars(p1.rating)} (${p1.rating})</td>
          <td class="${p2.rating >= p1.rating ? 'better' : ''}">${renderStars(p2.rating)} (${p2.rating})</td>
        </tr>
        <tr>
          <td><strong>Reviews</strong></td>
          <td class="${p1.reviewCount >= p2.reviewCount ? 'better' : ''}">${p1.reviewCount.toLocaleString()}</td>
          <td class="${p2.reviewCount >= p1.reviewCount ? 'better' : ''}">${p2.reviewCount.toLocaleString()}</td>
        </tr>
        <tr>
          <td><strong>Brand</strong></td>
          <td>${p1.brand}</td>
          <td>${p2.brand}</td>
        </tr>
        <tr>
          <td><strong>Stock</strong></td>
          <td class="${p1.inStock ? 'better' : ''}">${p1.inStock ? '✓ In Stock' : '✗ Out of Stock'}</td>
          <td class="${p2.inStock ? 'better' : ''}">${p2.inStock ? '✓ In Stock' : '✗ Out of Stock'}</td>
        </tr>
      </tbody>
    </table>
    <div style="text-align:center;margin-top:15px;padding:12px;background:#f7f8f8;border-radius:8px;">
      <strong>💰 You save $${diff}</strong> by choosing 
      <span style="color:var(--success);font-weight:700;">${p1Cheaper ? p1.name.substring(0,30) : p2.name.substring(0,30)}</span>
      <br>
      <a href="/compare.html" class="btn btn-primary btn-sm" style="margin-top:10px;">Full Comparison <i class="fas fa-arrow-right"></i></a>
    </div>
  `;
}

// ─── Related Products ───
async function loadRelated() {
  const related = allProducts.length > 0 ? allProducts : (await (await fetch('/api/products')).json());
  const items = related.filter(p => p.category === product.category && p.id !== product.id).slice(0, 8);
  const scroll = document.getElementById('relatedScroll');

  if (items.length === 0) {
    scroll.innerHTML = '<p style="color:#999;padding:20px;">No related products found.</p>';
    return;
  }

  scroll.innerHTML = items.map(p => `
    <a href="/product.html?id=${p.id}" class="related-item" style="text-decoration:none;color:inherit;">
      <img src="${p.image}" alt="${p.name}" onerror="this.src='https://picsum.photos/seed/default/150/150'">
      <div class="title">${p.name}</div>
      <div class="star-rating"><span class="stars" style="font-size:12px;">${renderStars(p.rating)}</span></div>
      <div class="price" style="font-size:15px;">$${p.price.toFixed(2)}</div>
    </a>
  `).join('');
}

// ─── Toast ───
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

