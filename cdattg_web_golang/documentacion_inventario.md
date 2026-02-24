# Módulo de Inventario — Reglas de Negocio, Restricciones y Lógica

Este documento describe el **módulo de inventario** del CDATTG: cómo funciona, reglas de negocio, restricciones y lógica aplicada. No incluye código; solo especificaciones para análisis y diseño.

---

## 1. Alcance del módulo

El módulo no incluye una funcionalidad llamada “tomar inventario” (conteo físico). Cubre:

- **Productos**: catálogo, stock, imágenes, códigos de barras.
- **Órdenes**: solicitudes de préstamo o salida de productos.
- **Carrito**: selección de productos tipo e-commerce para generar órdenes.
- **Aprobaciones**: aprobar o rechazar detalles de órdenes (por rol).
- **Devoluciones**: registro de devoluciones totales, parciales o cierre sin stock (consumibles).
- **Proveedores, categorías, marcas, contratos/convenios**: maestros para productos.
- **Notificaciones**: nuevas órdenes, stock bajo, aprobaciones/rechazos, devoluciones.
- **Dashboard**: resumen y métricas del inventario.

---

## 2. Cómo funciona (flujos generales)

### 2.1. Solicitud desde catálogo/carrito

1. Usuario ve catálogo o carrito (según permiso).
2. Agrega productos al carrito (cantidad ≥ 1, producto existente).
3. Para confirmar: elige tipo (préstamo o salida), descripción, y si es préstamo — fecha de devolución futura.
4. El sistema valida stock de todos los ítems antes de crear la orden.
5. Se crea la orden en estado “EN ESPERA” y se notifica a quienes pueden aprobar.
6. El carrito se vacía tras crear la orden.

### 2.2. Aprobación de órdenes

1. Solo usuarios con permiso “APROBAR ORDEN” ven y procesan pendientes.
2. Se puede aprobar o rechazar por **detalle** o la **orden completa**.
3. Para aprobar: el detalle debe estar “EN ESPERA”, no tener aprobación previa y haber stock suficiente.
4. Al aprobar: se descuenta stock del producto, se cambia estado del detalle a “APROBADA” y se notifica al solicitante.
5. Al rechazar: se cambia a “RECHAZADA”, se registra motivo y se notifica al solicitante. No se descuenta stock.

### 2.3. Devoluciones

1. Solo usuarios con permiso “DEVOLVER PRESTAMO” pueden registrar devoluciones.
2. Se elige detalle de orden (préstamo) y cantidad devuelta (0 permitido solo en cierre sin stock).
3. La cantidad devuelta no puede superar la pendiente por devolver.
4. Si hay devolución parcial o total con cantidad &gt; 0: se restaura stock del producto.
5. Si cantidad = 0: solo se permite como “cierre sin stock” para productos **consumibles** y con observaciones obligatorias; no se restaura stock.
6. Un préstamo no puede tener más de un cierre sin stock; si ya tiene cierre sin stock, no se aceptan más devoluciones.

### 2.4. Stock y notificaciones

- Al crear/actualizar órdenes o productos se valida siempre que exista stock suficiente antes de descontar.
- Si al actualizar un producto el stock baja y cruza el umbral mínimo (o ya estaba bajo y baja más), se notifica stock bajo a administradores (si la opción está activa en configuración).

---

## 3. Reglas de negocio por área

### 3.1. Productos

- **Nombre**: obligatorio, único en el sistema, guardado en mayúsculas.
- **Creación**: cantidad inicial ≥ 1; proveedor obligatorio.
- **Actualización**: cantidad puede ser ≥ 0 (permite dejar en cero).
- **Tipos**: definidos por parámetros (ej. CONSUMIBLE para cierre sin stock).
- **Código de barras**: opcional; si no se envía, se puede generar automáticamente.
- **Imagen**: opcional; formatos jpg, jpeg, png; tamaño máximo 5120 KB; si no se envía, se usa imagen por defecto.
- **Relaciones obligatorias**: tipo de producto, descripción, peso ≥ 0, unidad de medida, estado, categoría, marca, contrato/convenio, ambiente.
- **Eliminación**: se elimina producto e imagen asociada; no hay regla explícita que impida eliminar si tiene órdenes (las FK en BD pueden restringir según migraciones).

### 3.2. Órdenes (préstamos y salidas)

- **Tipos**: solo “préstamo” o “salida” (desde carrito); en órdenes normales, tipo viene de parámetros.
- **Préstamo**: fecha de devolución obligatoria y debe ser **posterior a hoy**.
- **Salida**: fecha de devolución no obligatoria.
- **Descripción**: obligatoria.
- **Productos**: al menos un ítem; cada ítem debe tener producto_id existente, cantidad ≥ 1 y estado de orden válido.
- **Carrito**: debe enviarse como JSON válido en la ruta de préstamos/salidas; rol y programa de formación obligatorios en esa ruta.
- **Stock**: no se crea la orden si algún producto no tiene stock suficiente; se usan transacciones para consistencia.

### 3.3. Carrito

- **Agregar**: ítems con producto_id existente y cantidad ≥ 1.
- **Actualizar**: solo cantidad, y debe ser ≥ 1.
- **Validación previa a orden**: se verifica disponibilidad de todos los ítems antes de crear la orden; si falta stock, se devuelven errores por producto (solicitado vs disponible).

### 3.4. Aprobaciones

- **Detalle aprobable**: estado “EN ESPERA” y sin registro de aprobación previo.
- **Stock**: debe haber stock suficiente para la cantidad del detalle en el momento de aprobar.
- **Efecto de aprobar**: descuento de stock, cambio de estado a “APROBADA”, registro de aprobación y notificación al solicitante.
- **Efecto de rechazar**: cambio a “RECHAZADA”, registro con motivo y notificación; no se modifica stock.
- **Orden completa**: se aprueban o rechazan todos los detalles en estado “EN ESPERA” de esa orden; para aprobar, se valida stock de todos antes de aplicar cambios.

### 3.5. Devoluciones

- **Detalle de orden**: debe existir y no tener ya un cierre sin stock.
- **Cantidad devuelta**: entero ≥ 0.
- **Cantidad &gt; 0**: no puede superar la cantidad pendiente de devolución (cantidad del detalle menos lo ya devuelto).
- **Cierre sin stock (cantidad = 0)**:
  - Solo permitido si el producto es de tipo **CONSUMIBLE**.
  - Observaciones obligatorias (motivo del consumo total).
- **Stock**: solo se restaura stock cuando cantidad devuelta &gt; 0 (no en cierre sin stock).
- **Vencimiento**: se puede calcular si la devolución fue a tiempo y los días de retraso respecto a la fecha de devolución de la orden.

### 3.6. Stock y umbrales

- **Umbral mínimo**: configurable (ej. 10); bajo este valor el nivel se considera “bajo”.
- **Umbral crítico**: configurable (ej. 5); bajo este valor el nivel se considera “crítico”.
- **Notificación de stock bajo**: opcional (config); se dispara cuando el stock cruza el umbral mínimo a la baja o cuando ya estaba bajo y disminuye más.
- **Niveles**: crítico, bajo, normal, alto (según umbrales y, en algún código, el doble del umbral mínimo para “normal”).

### 3.7. Proveedores, categorías y marcas

- **Proveedor**: no se puede eliminar si tiene productos asociados o contratos/convenios asociados.
- **Categoría / Marca**: no se puede eliminar si tiene productos asociados; deben existir los temas CATEGORIAS y MARCAS.
- **Contrato/convenio**: no se puede eliminar si tiene productos asociados.
- **NIT (proveedor)**: en BD puede tener índice único (según migraciones).

---

## 4. Restricciones

### 4.1. Validaciones de entrada (Form Requests)

- **Orden (préstamos/salidas)**: rol, programa de formación, tipo (prestamo|salida), fecha_devolucion si tipo=prestamo (obligatoria y después de hoy), descripción, carrito (JSON).
- **Orden (store/update normal)**: descripción, tipo_orden_id y estado_orden_id existentes en parametros_temas, productos array con al menos un ítem; cada ítem: producto_id existente, cantidad ≥ 1, estado_orden_id existente; fecha_devolucion opcional pero si se envía debe ser después de hoy.
- **Carrito agregar**: items con producto_id existente y cantidad ≥ 1.
- **Carrito actualizar**: cantidad ≥ 1.
- **Producto (crear/editar)**: tipo_producto_id, descripción, peso ≥ 0, unidad_medida_id, estado_producto_id, categoria_id, marca_id, contrato_convenio_id, ambiente_id; codigo_barras opcional max 13; imagen opcional image|mimes:jpg,jpeg,png|max:5120; name único; en creación cantidad ≥ 1 y proveedor obligatorio; en actualización cantidad ≥ 0.
- **Devolución**: detalle_orden_id existente, cantidad_devuelta ≥ 0, observaciones opcional max 500.

### 4.2. Base de datos (integridad referencial)

- **productos**: FKs a parametros_temas, users, etc. con `onDelete('restrict')` en varias relaciones (no borrar parámetros/users si hay productos).
- **detalle_ordenes**: orden_id (cascade al borrar orden), producto_id (restrict), estado_orden_id (restrict); cantidad entero.
- **devoluciones**: detalle_orden_id (cascade al borrar detalle); cantidad_devuelta entero; cierra_sin_stock booleano.
- **ordenes**: user_create_id, tipo, fecha_devolucion nullable; programa_formacion en migraciones posteriores.

### 4.3. Permisos (autorización)

- **VER DASHBOARD INVENTARIO**: acceso al dashboard de inventario.
- **VER PRODUCTOS**: listado administrativo de productos.
- **VER PRODUCTO / VER CATALOGO PRODUCTO**: según menú y rutas (catálogo público o por rol).
- **VER ORDEN**: ver órdenes.
- **APROBAR ORDEN**: ver pendientes y aprobar/rechazar detalles u órdenes completas.
- **VER CARRITO**: acceso a la vista del carrito (carrito-sena).
- **DEVOLVER PRESTAMO**: index, create y store de devoluciones.
- **VER TODAS LAS ORDENES**: sin este permiso, el usuario solo ve sus propias órdenes (creadas por él).
- **VER DEVOLUCION**: acceso a vistas de devoluciones.
- **VER NOTIFICACION**: acceso al módulo de notificaciones.
- **VER MARCA, VER CATEGORIA, VER PROVEEDOR, VER CONTRATO**: acceso a cada maestro.

Las rutas de inventario están protegidas por `auth` y por estos permisos según el controlador o el grupo de rutas.

---

## 5. Lógica relevante (sin código)

### 5.1. Stock

- **Descontar**: solo si cantidad disponible ≥ cantidad a descontar; si no, se lanza error y no se aplica el cambio. Se usa en creación/actualización de órdenes (al aprobar) y en actualización de stock desde producto.
- **Devolver**: se suma la cantidad devuelta al stock del producto; no se valida tope máximo.
- **Validación antes de orden/aprobación**: siempre se comprueba producto existente y stock suficiente; si falla, no se crea la orden o no se aprueba el detalle.

### 5.2. Consumibles y cierre sin stock

- Un producto es “consumible” si su tipo (parametro asociado) tiene nombre “CONSUMIBLE” (comparación en mayúsculas).
- Solo en consumibles se permite registrar una devolución con cantidad 0 como “cierre sin stock”, con observaciones obligatorias.
- Tras un cierre sin stock, la cantidad pendiente de devolución se considera 0 y no se aceptan más devoluciones para ese detalle.

### 5.3. Fechas

- **Fecha de devolución (orden)**: para préstamos desde carrito debe ser posterior a hoy; en órdenes normales, si se envía, también debe ser posterior a hoy.
- **Días de retraso**: se calculan como diferencia entre fecha real de devolución y fecha de devolución esperada de la orden; solo positivo cuando la devolución es tarde.

### 5.4. Transacciones y consistencia

- Creación de orden con detalles, aprobación (descuento de stock + estado + aprobación), rechazo y registro de devolución (crear devolución + actualizar stock si aplica) se ejecutan dentro de transacciones de base de datos; en caso de error se hace rollback.

### 5.5. Notificaciones

- **Nueva orden**: se notifica a super administradores (configurable).
- **Stock bajo**: se notifica a administradores cuando se cumple la condición de umbral (configurable activar/desactivar).
- **Orden aprobada / rechazada**: se notifica al usuario que creó la orden (solicitante).
- Otras notificaciones (devolución registrada, recordatorio de devolución) según implementación en notificaciones del módulo.

### 5.6. Configuración (env/config)

- **Stock**: umbral_minimo, umbral_critico, notificar_stock_bajo.
- **Imágenes**: disco, directorio, tamaño máximo, formatos, calidad, imagen por defecto.
- **Códigos de barras**: formato, dimensiones, prefijo y longitud para generación automática.
- **Órdenes**: días máximos de devolución (referencia), notificar nuevas órdenes, roles aprobadores (Administrador, Coordinador de Inventario).
- **Temas**: nombres de temas para estados de producto, estados de orden, tipos de producto, tipos de orden, unidades de medida, categorías, marcas.
- **Notificaciones**: cantidad por página y límite para dropdown.

---

## 6. Resumen de restricciones críticas

| Área            | Restricción principal                                                                 |
|-----------------|---------------------------------------------------------------------------------------|
| Productos      | Nombre único; cantidad ≥ 0 en edición, ≥ 1 en creación; proveedor obligatorio en alta. |
| Órdenes         | Fecha devolución &gt; hoy en préstamos; al menos un producto; stock suficiente.       |
| Carrito         | Producto existente, cantidad ≥ 1; validación de stock antes de crear orden.           |
| Aprobación      | Detalle en “EN ESPERA”, sin aprobación previa, stock suficiente.                     |
| Devolución      | Cantidad ≤ pendiente; cierre sin stock solo consumibles y con observaciones.          |
| Eliminaciones   | Proveedor/categoría/marca/contrato no eliminables si tienen productos asociados.     |

---