import { createProductosStore, ProductDataError } from './productos.js';

const form = document.querySelector('#product-form');
const list = document.querySelector('#product-list');
const emptyState = document.querySelector('#empty-state');
const formMessage = document.querySelector('#form-message');
const statusMessage = document.querySelector('#status-message');
const title = document.querySelector('#form-title');
const saveButton = document.querySelector('#save-button');
const cancelButton = document.querySelector('#cancel-edit');
const authPanel = document.querySelector('#auth-panel');
const authForm = document.querySelector('#auth-form');
const authMessage = document.querySelector('#auth-message');
const inventory = document.querySelector('#inventory');
const signUpButton = document.querySelector('#sign-up');
const signOutButton = document.querySelector('#sign-out');
const signedInEmail = document.querySelector('#signed-in-email');
let editingId = null;
let store;
let client;

function setMessage(element, message, kind = '') {
  element.textContent = message;
  element.className = kind ? `message ${kind}` : 'message';
}

function addCell(row, text, className = '') {
  const cell = document.createElement('td');
  if (className) cell.className = className;
  cell.textContent = text;
  row.append(cell);
  return cell;
}

function render(products) {
  list.replaceChildren();
  const lowCount = products.filter((product) => product.cantidad < product.minimo).length;
  document.querySelector('#total-count').textContent = String(products.length);
  document.querySelector('#low-count').textContent = String(lowCount);
  document.querySelector('#product-count').textContent = `${products.length} ${products.length === 1 ? 'producto' : 'productos'}`;
  emptyState.hidden = products.length !== 0;

  for (const product of products) {
    const row = document.createElement('tr');
    if (product.cantidad < product.minimo) row.classList.add('row-low');
    addCell(row, product.nombre, 'product-name');
    addCell(row, product.sku, 'sku-cell');
    addCell(row, String(product.cantidad), 'number-cell');
    addCell(row, String(product.minimo), 'number-cell');

    const statusCell = document.createElement('td');
    const badge = document.createElement('span');
    const isLow = product.cantidad < product.minimo;
    badge.className = isLow ? 'status-badge low' : 'status-badge enough';
    badge.textContent = isLow ? 'Por debajo del mínimo' : 'Suficiente';
    statusCell.append(badge);
    row.append(statusCell);

    const actions = document.createElement('td');
    actions.className = 'row-actions';
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'link-button';
    editButton.textContent = 'Editar';
    editButton.setAttribute('aria-label', `Editar ${product.nombre}`);
    editButton.addEventListener('click', () => startEdit(product));
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'link-button delete-button';
    deleteButton.textContent = 'Eliminar';
    deleteButton.setAttribute('aria-label', `Eliminar ${product.nombre}`);
    deleteButton.addEventListener('click', () => deleteProduct(product));
    actions.append(editButton, deleteButton);
    row.append(actions);
    list.append(row);
  }
}

async function refresh() {
  const products = await store.list();
  render(products);
}

function startEdit(product) {
  editingId = product.id;
  form.elements.nombre.value = product.nombre;
  form.elements.sku.value = product.sku;
  form.elements.cantidad.value = String(product.cantidad);
  form.elements.minimo.value = String(product.minimo);
  title.textContent = 'Editar producto';
  saveButton.textContent = 'Guardar cambios';
  cancelButton.hidden = false;
  setMessage(formMessage, '');
  form.elements.nombre.focus();
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cancelEdit() {
  editingId = null;
  form.reset();
  title.textContent = 'Agregar producto';
  saveButton.textContent = '＋ Agregar producto';
  cancelButton.hidden = true;
  setMessage(formMessage, '');
}

async function deleteProduct(product) {
  if (!window.confirm(`¿Eliminar «${product.nombre}» de tu inventario?`)) return;
  try {
    await store.remove(product.id);
    if (editingId === product.id) cancelEdit();
    await refresh();
    setMessage(statusMessage, 'Producto eliminado.', 'success');
  } catch (error) {
    setMessage(statusMessage, error.message, 'error');
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage(formMessage, '');
  const data = {
    nombre: form.elements.nombre.value,
    sku: form.elements.sku.value,
    cantidad: form.elements.cantidad.value === '' ? NaN : Number(form.elements.cantidad.value),
    minimo: form.elements.minimo.value === '' ? NaN : Number(form.elements.minimo.value),
  };

  try {
    if (editingId) {
      await store.update(editingId, data);
      cancelEdit();
      setMessage(statusMessage, 'Producto actualizado.', 'success');
    } else {
      await store.add(data);
      form.reset();
      setMessage(statusMessage, 'Producto agregado.', 'success');
    }
    await refresh();
  } catch (error) {
    setMessage(formMessage, error instanceof ProductDataError ? error.message : 'No se pudo guardar el producto.', 'error');
  }
});

cancelButton.addEventListener('click', cancelEdit);

function setAuthBusy(busy) {
  authForm.querySelectorAll('input, button').forEach((control) => { control.disabled = busy; });
  signUpButton.disabled = busy;
}

function showSession(session) {
  const signedIn = Boolean(session);
  authPanel.hidden = signedIn;
  inventory.hidden = !signedIn;
  signOutButton.hidden = !signedIn;
  signedInEmail.textContent = signedIn ? session.user.email : '';
  if (!signedIn) {
    render([]);
    cancelEdit();
  }
  if (signedIn && store) refresh().catch((error) => setMessage(statusMessage, error.message, 'error'));
}

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setAuthBusy(true);
  setMessage(authMessage, 'Iniciando sesión…');
  const { email, password } = Object.fromEntries(new FormData(authForm));
  try {
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) setMessage(authMessage, 'No se pudo iniciar sesión. Revisa el correo y la contraseña e inténtalo de nuevo.', 'error');
    else setMessage(authMessage, 'Sesión iniciada.', 'success');
  } catch {
    setMessage(authMessage, 'No se pudo conectar con Supabase. Revisa tu conexión e inténtalo de nuevo.', 'error');
  } finally {
    setAuthBusy(false);
  }
});

signUpButton.addEventListener('click', async () => {
  if (!authForm.reportValidity()) return;
  setAuthBusy(true);
  setMessage(authMessage, 'Creando cuenta…');
  const { email, password } = Object.fromEntries(new FormData(authForm));
  try {
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) setMessage(authMessage, 'No se pudo crear la cuenta. Revisa los datos e inténtalo de nuevo.', 'error');
    else if (!data.session) setMessage(authMessage, 'Cuenta creada. Revisa tu correo para confirmarla y después inicia sesión.', 'success');
    else setMessage(authMessage, 'Cuenta creada y sesión iniciada.', 'success');
  } catch {
    setMessage(authMessage, 'No se pudo conectar con Supabase. Revisa tu conexión e inténtalo de nuevo.', 'error');
  } finally {
    setAuthBusy(false);
  }
});

signOutButton.addEventListener('click', async () => {
  signOutButton.disabled = true;
  try {
    const { error } = await client.auth.signOut();
    if (error) setMessage(statusMessage, 'No se pudo cerrar la sesión. Inténtalo de nuevo.', 'error');
  } catch {
    setMessage(statusMessage, 'No se pudo conectar con Supabase. Revisa tu conexión e inténtalo de nuevo.', 'error');
  } finally {
    signOutButton.disabled = false;
  }
});

try {
  const config = window.MINI_INVENTARIO_CONFIG;
  if (!config || !window.supabase?.createClient) throw new ProductDataError('Falta la configuración de Supabase. Revisa el archivo .env y reinicia el servidor.');
  client = window.supabase.createClient(config.url, config.key);
  store = createProductosStore(client);
  client.auth.onAuthStateChange((_event, session) => queueMicrotask(() => showSession(session)));
  client.auth.getSession().then(({ data, error }) => {
    if (error) throw error;
    showSession(data.session);
  }).catch(() => setMessage(authMessage, 'No se pudo restaurar la sesión. Recarga la página e inténtalo de nuevo.', 'error'));
} catch (error) {
  authForm.querySelectorAll('input, button').forEach((control) => { control.disabled = true; });
  setMessage(authMessage, error.message || 'No se pudo iniciar la aplicación.', 'error');
}
