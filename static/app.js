const $ = (selector) => document.querySelector(selector);
const loginView = $('#login-view');
const inventoryView = $('#inventory-view');
const dialog = $('#product-dialog');
const form = $('#product-form');
let products = [];
let editingId = null;

async function api(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || 'Ocurrió un error. Inténtalo de nuevo.');
  return data;
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function render() {
  const low = products.filter((item) => item.low_stock);
  $('#total-count').textContent = products.length;
  $('#low-count').textContent = low.length;
  $('#product-count').textContent = `${products.length} ${products.length === 1 ? 'producto' : 'productos'}`;
  const target = $('#inventory-content');
  if (!products.length) {
    target.innerHTML = '<div class="empty-state"><div class="empty-icon">▦</div><h3>Aún no hay productos</h3><p>Agrega tu primer producto para empezar a organizar tu inventario.</p><button id="empty-add" class="button primary">Agregar primer producto</button></div>';
    $('#empty-add').addEventListener('click', () => openForm());
    return;
  }
  const rows = products.map((item) => `<tr>
    <td><div class="product-name">${escapeHtml(item.name)}</div><div class="sku">${escapeHtml(item.sku)}</div></td>
    <td class="stock">${item.quantity}</td><td>${item.minimum}</td>
    <td><span class="${item.low_stock ? 'low-badge' : 'ok-badge'}">${item.low_stock ? 'Por reponer' : 'En existencia'}</span></td>
    <td class="actions"><button data-edit="${item.id}">Editar</button><button data-delete="${item.id}">Eliminar</button></td>
  </tr>`).join('');
  target.innerHTML = `<table class="product-table"><thead><tr><th>Producto</th><th>Cantidad</th><th>Mínimo</th><th>Estado</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
  target.querySelectorAll('[data-edit]').forEach((button) => button.addEventListener('click', () => openForm(Number(button.dataset.edit))));
  target.querySelectorAll('[data-delete]').forEach((button) => button.addEventListener('click', () => removeProduct(Number(button.dataset.delete))));
}

async function loadProducts() {
  products = await api('/api/products');
  render();
}

function openForm(id = null) {
  editingId = id;
  const product = products.find((item) => item.id === id);
  form.reset();
  form.elements.quantity.value = product?.quantity ?? 0;
  form.elements.minimum.value = product?.minimum ?? 5;
  form.elements.name.value = product?.name ?? '';
  form.elements.sku.value = product?.sku ?? '';
  $('#dialog-title').textContent = product ? 'Editar producto' : 'Agregar producto';
  $('#form-message').textContent = '';
  dialog.showModal();
  form.elements.name.focus();
}

async function removeProduct(id) {
  const product = products.find((item) => item.id === id);
  if (!product || !window.confirm(`¿Eliminar “${product.name}” de tu inventario?`)) return;
  try {
    await api(`/api/products/${id}`, { method: 'DELETE' });
    await loadProducts();
    showToast('Producto eliminado');
  } catch (error) { showToast(error.message); }
}

$('#add-button').addEventListener('click', () => openForm());
$('#close-dialog').addEventListener('click', () => dialog.close());
$('#cancel-dialog').addEventListener('click', () => dialog.close());
$('#logout-button').addEventListener('click', async () => {
  await api('/auth/logout', { method: 'POST' });
  location.reload();
});
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  data.quantity = Number(data.quantity);
  data.minimum = Number(data.minimum);
  try {
    await api(editingId ? `/api/products/${editingId}` : '/api/products', {
      method: editingId ? 'PUT' : 'POST', body: JSON.stringify(data),
    });
    dialog.close();
    await loadProducts();
    showToast(editingId ? 'Producto actualizado' : 'Producto agregado');
  } catch (error) { $('#form-message').textContent = error.message; }
});

async function start() {
  try {
    const session = await api('/api/session');
    if (!session.user) {
      loginView.hidden = false;
      if (!session.google_ready) {
        $('#login-button').hidden = true;
        $('#login-message').textContent = 'El inicio con Google requiere configuración. Consulta el README.';
      }
      if (new URLSearchParams(location.search).has('login_error')) $('#login-message').textContent = 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.';
      return;
    }
    inventoryView.hidden = false;
    $('#user-name').textContent = session.user.name || session.user.email;
    await loadProducts();
  } catch (error) {
    loginView.hidden = false;
    $('#login-message').textContent = error.message;
  }
}

start();
