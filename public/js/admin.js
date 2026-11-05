/* ══════════════════════════════════════════════════════════════
   CAMAZON - Admin Panel JavaScript
   ══════════════════════════════════════════════════════════════ */

let isLoggedIn = sessionStorage.getItem('camazon_admin') === 'true';
let products = [];
let deleteTargetId = null;

document.addEventListener('DOMContentLoaded', () => {
  if (isLoggedIn) showDashboard();
  setupEventListeners();
});

// ─── Auth ───
function setupEventListeners() {
  // Login form
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('loginPassword').value;
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('camazon_admin', 'true');
        isLoggedIn = true;
        showDashboard();
        showToast('Welcome back, Admin!', 'success');
      } else {
        document.getElementById('loginError').style.display = 'block';
      }
    } catch {
      showToast('Connection error', 'error');
    }
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.removeItem('camazon_admin');
    isLoggedIn = false;
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
    showToast('Logged out successfully', 'info');
  });

  // Tab switching
  document.querySelectorAll('[data-tab]').forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('[data-tab]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const tabName = tab.dataset.tab;
      document.getElementById('productsTab').style.display = tabName === 'products' ? 'block' : 'none';
      document.getElementById('addTab').style.display = tabName === 'add' ? 'block' : 'none';

      if (tabName === 'add') resetForm();
    });
  });

  // Product form submit
  document.getElementById('productForm').addEventListener('submit', handleProductSubmit);

  // Cancel form
  document.getElementById('cancelFormBtn').addEventListener('click', () => {
    document.querySelector('[data-tab="products"]').click();
  });

  // Delete confirmation
  document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);

  // Admin search
  document.getElementById('adminSearch').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q)
    );
    renderProductsTable(filtered);
  });

  // Image preview
  document.getElementById('formImage').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const preview = document.getElementById('imagePreview');
        preview.src = ev.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });
}

function showDashboard() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('adminDashboard').style.display = 'flex';
  loadProducts();
}

// ─── Products ───
async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    products = await res.json();
    renderProductsTable(products);
    updateStats();
  } catch (err) {
    console.error('Failed to load products:', err);
    showToast('Failed to load products', 'error');
  }
}

function renderProductsTable(data) {
  const tbody = document.getElementById('adminProductsBody');
  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding:40px;color:#999;">
      <i class="fas fa-box-open" style="font-size:40px;display:block;margin-bottom:10px;"></i>No products found
    </td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(p => `
    <tr>
      <td><img src="${p.image}" alt="" class="product-thumb" onerror="this.src='https://picsum.photos/seed/default/50/50'"></td>
      <td><strong>${p.name.substring(0, 40)}${p.name.length > 40 ? '...' : ''}</strong></td>
      <td>${p.category}</td>
      <td>${p.brand}</td>
      <td>
        <strong>$${p.price.toFixed(2)}</strong>
        ${p.originalPrice ? `<br><small style="color:#999;text-decoration:line-through;">$${p.originalPrice.toFixed(2)}</small>` : ''}
      </td>
      <td><span style="color:#ffa41c;">${renderStars(p.rating)}</span> (${p.rating})</td>
      <td>
        <span style="color:${p.inStock ? '#067d62' : '#d13212'};font-weight:600;">
          ${p.inStock ? '✓ Yes' : '✗ No'}
        </span>
      </td>
      <td>
        <div class="actions">
          <button class="btn-edit" onclick="editProduct('${p.id}')"><i class="fas fa-edit"></i> Edit</button>
          <button class="btn-delete" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash"></i> Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function updateStats() {
  document.getElementById('statTotal').textContent = products.length;
  const categories = [...new Set(products.map(p => p.category))];
  document.getElementById('statCategories').textContent = categories.length;
  document.getElementById('statInStock').textContent = products.filter(p => p.inStock).length;
  document.getElementById('statOutStock').textContent = products.filter(p => !p.inStock).length;
}

// ─── Add/Edit Product ───
async function handleProductSubmit(e) {
  e.preventDefault();
  const editId = document.getElementById('editId').value;
  const formData = new FormData();

  formData.append('name', document.getElementById('formName').value);
  formData.append('description', document.getElementById('formDescription').value);
  formData.append('price', document.getElementById('formPrice').value);
  formData.append('originalPrice', document.getElementById('formOriginalPrice').value);
  formData.append('category', document.getElementById('formCategory').value);
  formData.append('brand', document.getElementById('formBrand').value);
  formData.append('rating', document.getElementById('formRating').value);
  formData.append('reviewCount', document.getElementById('formReviewCount').value);
  formData.append('inStock', document.getElementById('formInStock').value);
  formData.append('features', document.getElementById('formFeatures').value);

  const imageFile = document.getElementById('formImage').files[0];
  const imageUrl = document.getElementById('formImageUrl').value;
  if (imageFile) {
    formData.append('image', imageFile);
  } else if (imageUrl) {
    formData.append('imageUrl', imageUrl);
  }

  try {
    const url = editId ? `/api/products/${editId}` : '/api/products';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, body: formData });

    if (res.ok) {
      showToast(editId ? 'Product updated!' : 'Product created!', 'success');
      document.querySelector('[data-tab="products"]').click();
      loadProducts();
    } else {
      showToast('Error saving product', 'error');
    }
  } catch {
    showToast('Connection error', 'error');
  }
}

function editProduct(id) {
  const p = products.find(pr => pr.id === id);
  if (!p) return;

  document.getElementById('formTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Product';
  document.getElementById('editId').value = p.id;
  document.getElementById('formName').value = p.name;
  document.getElementById('formDescription').value = p.description;
  document.getElementById('formPrice').value = p.price;
  document.getElementById('formOriginalPrice').value = p.originalPrice || '';
  document.getElementById('formCategory').value = p.category;
  document.getElementById('formBrand').value = p.brand;
  document.getElementById('formRating').value = p.rating;
  document.getElementById('formReviewCount').value = p.reviewCount;
  document.getElementById('formInStock').value = p.inStock ? 'true' : 'false';
  document.getElementById('formFeatures').value = (p.features || []).join(', ');
  document.getElementById('formImageUrl').value = p.image.startsWith('/') ? '' : p.image;

  if (p.image) {
    const preview = document.getElementById('imagePreview');
    preview.src = p.image;
    preview.style.display = 'block';
  }

  document.querySelector('[data-tab="add"]').click();
}

function resetForm() {
  document.getElementById('formTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Add New Product';
  document.getElementById('editId').value = '';
  document.getElementById('productForm').reset();
  document.getElementById('formRating').value = '4.0';
  document.getElementById('formReviewCount').value = '0';
  document.getElementById('imagePreview').style.display = 'none';
}

// ─── Delete ───
function deleteProduct(id) {
  deleteTargetId = id;
  document.getElementById('deleteModal').classList.add('active');
}

async function confirmDelete() {
  if (!deleteTargetId) return;
  try {
    const res = await fetch(`/api/products/${deleteTargetId}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Product deleted', 'success');
      loadProducts();
    } else {
      showToast('Failed to delete', 'error');
    }
  } catch {
    showToast('Connection error', 'error');
  }
  document.getElementById('deleteModal').classList.remove('active');
  deleteTargetId = null;
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

