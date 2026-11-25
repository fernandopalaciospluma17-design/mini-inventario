const MAX_INTEGER = 2_147_483_647;

export class ProductDataError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ProductDataError';
  }
}

function normalize(input) {
  if (!input || typeof input !== 'object') throw new ProductDataError('Los datos del producto no son válidos.');
  const nombre = typeof input.nombre === 'string' ? input.nombre.trim() : '';
  const sku = typeof input.sku === 'string' ? input.sku.trim().toUpperCase() : '';
  if (!nombre) throw new ProductDataError('Escribe el nombre del producto.');
  if (!sku) throw new ProductDataError('Escribe el SKU del producto.');
  if (nombre.length > 120) throw new ProductDataError('El nombre no puede superar 120 caracteres.');
  if (sku.length > 80) throw new ProductDataError('El SKU no puede superar 80 caracteres.');
  for (const [label, value] of [['La cantidad', input.cantidad], ['La cantidad mínima', input.minimo]]) {
    if (!Number.isSafeInteger(value) || value < 0 || value > MAX_INTEGER) {
      throw new ProductDataError(`${label} debe ser un entero entre 0 y ${MAX_INTEGER}.`);
    }
  }
  return { nombre, sku, cantidad: input.cantidad, minimo: input.minimo };
}

export function createProductosStore(client) {
  if (!client?.from) throw new ProductDataError('No se pudo iniciar la conexión con Supabase.');
  const table = () => client.from('productos');
  const fail = (error) => {
    if (error?.code === '23505') throw new ProductDataError('Ya existe un producto con ese SKU.');
    throw new ProductDataError('No se pudieron guardar los productos. Revisa tu conexión e inténtalo de nuevo.');
  };

  return {
    async list() {
      const { data, error } = await table().select('id,user_id,nombre,sku,cantidad,minimo,created_at').order('nombre');
      if (error) fail(error);
      return data;
    },
    async add(input) {
      const product = normalize(input);
      const { data: { user }, error: authError } = await client.auth.getUser();
      if (authError || !user) throw new ProductDataError('Inicia sesión nuevamente para continuar.');
      const { data, error } = await table().insert({ ...product, user_id: user.id }).select().single();
      if (error) fail(error);
      return data;
    },
    async update(id, input) {
      const { data, error } = await table().update(normalize(input)).eq('id', id).select().maybeSingle();
      if (error) fail(error);
      if (!data) throw new ProductDataError('No se encontró el producto que quieres editar.');
      return data;
    },
    async remove(id) {
      const { data, error } = await table().delete().eq('id', id).select('id').maybeSingle();
      if (error) fail(error);
      if (!data) throw new ProductDataError('No se encontró el producto que quieres eliminar.');
    },
  };
}
