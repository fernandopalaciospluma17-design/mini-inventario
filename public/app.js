import { createProductosStore, ProductDataError } from './productos.js';

const form = document.querySelector('#product-form');
const list = document.querySelector('#product-list');
const emptyState = document.querySelector('#empty-state');
const formMessage = document.querySelector('#form-message');
const statusMessage = document.querySelector('#status-message');
const title = document.querySelector('#form-title');
const saveButton = document.querySelector('#save-button');
const cancelButton = document.querySelector('#cancel-edit');
let editingId = null;
let store;

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

function refresh() {
  render(store.list());
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

function deleteProduct(product) {
  if (!window.confirm(`¿Eliminar «${product.nombre}» del inventario de este dispositivo?`)) return;
  try {
    store.remove(product.id);
    if (editingId === product.id) cancelEdit();
    refresh();
    setMessage(statusMessage, 'Producto eliminado.', 'success');
  } catch (error) {
    setMessage(statusMessage, error.message, 'error');
  }
}

form.addEventListener('submit', (event) => {
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
      store.update(editingId, data);
      cancelEdit();
      setMessage(statusMessage, 'Producto actualizado.', 'success');
    } else {
      store.add(data);
      form.reset();
      setMessage(statusMessage, 'Producto agregado.', 'success');
    }
    refresh();
  } catch (error) {
    setMessage(formMessage, error instanceof ProductDataError ? error.message : 'No se pudo guardar el producto.', 'error');
  }
});

cancelButton.addEventListener('click', cancelEdit);

try {
  store = createProductosStore(window.localStorage);
  refresh();
} catch (error) {
  form.querySelectorAll('input, button[type="submit"]').forEach((control) => { control.disabled = true; });
  setMessage(formMessage, error.message || 'No se pudieron cargar los productos guardados.', 'error');
}
