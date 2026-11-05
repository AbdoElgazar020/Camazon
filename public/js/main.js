/* ══════════════════════════════════════════════════════════════
   CAMAZON - Main Page JavaScript
   ══════════════════════════════════════════════════════════════ */

// ─── State ───
let allProducts = [];
let compareList = JSON.parse(localStorage.getItem('camazon_compare') || '[]');
let currentFilters = { category: '', search: '', sort: '', minPrice: '', maxPrice: '', minRating: '', brand: '' };

// ─── Init ───
document.addEventListener('DOMContentLoaded', () => {
  loadURLParams();
  fetchProducts();
  loadCategories();
  loadBrands();
  setupHeroSlider();
  setupEventListeners();
  updateCompareUI();
});

// ─── URL Params ───
function loadURLParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('category')) {
    currentFilters.category = params.get('category');
  }
  if (params.get('search')) {
    currentFilters.search = params.get('search');
    document.getElementById('searchInput').value = params.get('search');
  }
}

// ─── Fetch Products ───
async function fetchProducts() {
  try {
    const params = new URLSearchParams();
    Object.entries(currentFilters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const res = await fetch(`/api/products?${params}`);
    allProducts = await res.json();
    renderProducts(allProducts);
    document.getElementById('resultsCount').textContent = allProducts.length;
  } catch (err) {
    console.error('Failed to fetch products:', err);
    document.getElementById('productGrid').innerHTML = '<p style="padding:40px;text-align:center;color:#999;">Failed to load products. Please refresh.</p>';
  }
}

// ─── Render Products ───
function renderProducts(products) {
  const grid = document.getElementById('productGrid');
  if (products.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;">
        <i class="fas fa-search" style="font-size:60px;color:#ddd;margin-bottom:15px;display:block;"></i>
        <h3 style="color:#555;">No products found</h3>
        <p style="color:#999;">Try adjusting your filters or search terms</p>
      </div>`;
    return;
  }

  grid.innerHTML = products.map((p, i) => {
    const savings = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
    const isCompared = compareList.includes(p.id);
    const priceParts = p.price.toFixed(2).split('.');
    return `
      <div class="product-card" style="animation-delay:${i * 0.05}s">
        ${savings >= 20 ? '<span class="badge badge-sale">-' + savings + '%</span>' : ''}
        <div class="product-card-image" onclick="window.location.href='/product.html?id=${p.id}'">
          <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='https://picsum.photos/seed/default/400/400'">
        </div>
        <div class="product-card-title">
          <a href="/product.html?id=${p.id}">${p.name}</a>
        </div>
        <div class="product-card-brand">${p.brand}</div>
        <div class="star-rating">
          <span class="stars">${renderStars(p.rating)}</span>
          <a href="/product.html?id=${p.id}" class="review-count">${p.reviewCount.toLocaleString()}</a>
        </div>
        <div class="product-card-price">
          <span class="price-current">
            <span class="price-symbol">$</span>${priceParts[0]}<span class="price-fraction">${priceParts[1]}</span>
          </span>
          ${p.originalPrice ? `<span class="price-original">$${p.originalPrice.toFixed(2)}</span>` : ''}
          ${savings > 0 ? `<span class="price-saving">(${savings}% off)</span>` : ''}
        </div>
        <div class="product-card-stock ${p.inStock ? 'in-stock' : 'out-of-stock'}">
          ${p.inStock ? '<i class="fas fa-check-circle"></i> In Stock' : '<i class="fas fa-times-circle"></i> Out of Stock'}
        </div>
        <label class="compare-checkbox">
          <input type="checkbox" ${isCompared ? 'checked' : ''} onchange="toggleCompare('${p.id}', '${p.name}', '${p.image}')">
          Add to Compare
        </label>
      </div>`;
  }).join('');
}

// ─── Stars ───
function renderStars(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) stars += '★';
    else if (rating >= i - 0.5) stars += '★';
    else stars += '☆';
  }
  return stars;
}

// ─── Compare Logic ───
function toggleCompare(id, name, image) {
  const idx = compareList.indexOf(id);
  if (idx > -1) {
    compareList.splice(idx, 1);
    showToast(`Removed from compare`, 'info');
  } else {
    if (compareList.length >= 4) {
      showToast('Maximum 4 products for comparison', 'error');
      // Uncheck the checkbox
      document.querySelectorAll('.compare-checkbox input').forEach(cb => {
        if (!compareList.includes(cb.closest('.product-card')?.querySelector('a')?.href?.split('id=')[1])) {
          // Just refresh UI
        }
      });
      renderProducts(allProducts);
      return;
    }
    compareList.push(id);
    showToast(`Added to compare!`, 'success');
  }
  localStorage.setItem('camazon_compare', JSON.stringify(compareList));
  updateCompareUI();
}

function updateCompareUI() {
  // Update count badges
  document.getElementById('compareCount').textContent = compareList.length;

  // Update floating bar
  const bar = document.getElementById('compareBar');
  const barItems = document.getElementById('compareBarItems');
  const barCount = document.getElementById('compareBarCount');

  if (compareList.length > 0) {
    bar.classList.add('visible');
    barCount.textContent = compareList.length;

    // Show thumbnail images in bar
    const products = allProducts.filter(p => compareList.includes(p.id));
    barItems.innerHTML = products.map(p =>
      `<div class="compare-bar-item"><img src="${p.image}" alt="${p.name}"></div>`
    ).join('');
  } else {
    bar.classList.remove('visible');
  }
}

// ─── Categories ───
async function loadCategories() {
  try {
    const res = await fetch('/api/categories');
    const categories = await res.json();

    // Search dropdown
    const catSelect = document.getElementById('searchCategory');
    categories.forEach(c => {
      catSelect.innerHTML += `<option value="${c}">${c}</option>`;
    });

    // Sidebar
    const catFilters = document.getElementById('categoryFilters');
    catFilters.innerHTML = categories.map(c => `
      <label class="filter-option">
        <input type="checkbox" value="${c}" ${currentFilters.category === c ? 'checked' : ''}>
        <label>${c}</label>
      </label>
    `).join('');

    // Category filter click
    catFilters.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', (e) => {
        // Single select for category
        catFilters.querySelectorAll('input[type="checkbox"]').forEach(other => {
          if (other !== e.target) other.checked = false;
        });
        currentFilters.category = e.target.checked ? e.target.value : '';
        fetchProducts();
      });
    });
  } catch (err) {
    console.error('Failed to load categories:', err);
  }
}

// ─── Brands ───
async function loadBrands() {
  try {
    const res = await fetch('/api/brands');
    const brands = await res.json();
    const brandFilters = document.getElementById('brandFilters');
    brandFilters.innerHTML = brands.map(b => `
      <label class="filter-option">
        <input type="checkbox" value="${b}">
        <label>${b}</label>
      </label>
    `).join('');

    brandFilters.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', (e) => {
        brandFilters.querySelectorAll('input[type="checkbox"]').forEach(other => {
          if (other !== e.target) other.checked = false;
        });
        currentFilters.brand = e.target.checked ? e.target.value : '';
        fetchProducts();
      });
    });
  } catch (err) {
    console.error('Failed to load brands:', err);
  }
}

// ─── Event Listeners ───
function setupEventListeners() {
  // Search
  document.getElementById('searchBtn').addEventListener('click', () => {
    currentFilters.search = document.getElementById('searchInput').value;
    fetchProducts();
  });
  document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      currentFilters.search = e.target.value;
      fetchProducts();
    }
  });

  // Sort
  document.getElementById('sortSelect').addEventListener('change', (e) => {
    currentFilters.sort = e.target.value;
    fetchProducts();
  });

  // Price filter
  document.getElementById('priceFilterBtn').addEventListener('click', () => {
    currentFilters.minPrice = document.getElementById('minPrice').value;
    currentFilters.maxPrice = document.getElementById('maxPrice').value;
    fetchProducts();
  });

  // Rating filter
  document.querySelectorAll('#ratingFilters input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      currentFilters.minRating = e.target.value;
      fetchProducts();
    });
  });

  // Clear filters
  document.getElementById('clearFiltersBtn').addEventListener('click', () => {
    currentFilters = { category: '', search: '', sort: '', minPrice: '', maxPrice: '', minRating: '', brand: '' };
    document.getElementById('searchInput').value = '';
    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';
    document.getElementById('sortSelect').value = '';
    document.querySelectorAll('.sidebar-filter input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('.sidebar-filter input[type="radio"]').forEach(r => r.checked = false);
    fetchProducts();
  });

  // Compare clear
  document.getElementById('compareClearBtn').addEventListener('click', () => {
    compareList = [];
    localStorage.setItem('camazon_compare', JSON.stringify(compareList));
    updateCompareUI();
    renderProducts(allProducts);
    showToast('Compare list cleared', 'info');
  });

  // Category card links
  document.querySelectorAll('[data-category]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      currentFilters.category = link.dataset.category;
      fetchProducts();
      document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Mobile menu
  const mobileBtn = document.getElementById('mobileMenuBtn');
  if (mobileBtn) {
    mobileBtn.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebarFilter');
      sidebar.style.display = sidebar.style.display === 'block' ? 'none' : 'block';
      sidebar.style.position = 'fixed';
      sidebar.style.top = '120px';
      sidebar.style.left = '0';
      sidebar.style.zIndex = '999';
      sidebar.style.background = '#fff';
      sidebar.style.height = 'calc(100vh - 120px)';
      sidebar.style.overflowY = 'auto';
      sidebar.style.boxShadow = '2px 0 10px rgba(0,0,0,.2)';
    });
  }
}

// ─── Hero Slider ───
function setupHeroSlider() {
  const slider = document.getElementById('heroSlider');
  const slides = slider.children;
  const dotsContainer = document.getElementById('heroDots');
  let current = 0;
  const total = slides.length;

  // Create dots
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('button');
    dot.className = `hero-dot${i === 0 ? ' active' : ''}`;
    dot.addEventListener('click', () => goToSlide(i));
    dotsContainer.appendChild(dot);
  }

  function goToSlide(n) {
    current = n;
    slider.style.transform = `translateX(-${current * 100}%)`;
    dotsContainer.querySelectorAll('.hero-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  document.getElementById('heroNext').addEventListener('click', () => goToSlide((current + 1) % total));
  document.getElementById('heroPrev').addEventListener('click', () => goToSlide((current - 1 + total) % total));

  // Auto slide
  setInterval(() => goToSlide((current + 1) % total), 5000);
}

// ─── Toast Notifications ───
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

