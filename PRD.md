# Funcionalidades principales del sistema de gestión para constructoras

## 1. Dashboard general

El sistema debe contar con un panel principal donde el usuario pueda ver un resumen rápido del estado de la empresa y de las obras activas.

### Métricas principales

* Cantidad de obras activas.
* Obras finalizadas.
* Obras pausadas o con retraso.
* Gastos totales del mes.
* Gastos por obra.
* Gastos generales.
* Presupuestos enviados.
* Presupuestos aprobados.
* Rentabilidad estimada por obra.
* Alertas importantes: vencimientos, desvíos de presupuesto, etapas atrasadas o gastos elevados.

---

## 2. Módulo de obras

El módulo de obras debe permitir crear, administrar y hacer seguimiento de cada proyecto constructivo.

### Datos de una obra

Cada obra debe poder tener:

* Nombre de la obra.
* Cliente asociado.
* Ubicación.
* Fecha de inicio.
* Fecha estimada de finalización.
* Estado: pendiente, activa, pausada, finalizada, cancelada.
* Responsable de obra.
* Presupuesto asignado.
* Gastos acumulados.
* Porcentaje de avance.
* Observaciones generales.
* Archivos adjuntos, imágenes, planos o documentación.

### Etapas configurables

Cada obra debe estar compuesta por etapas configurables. Por ejemplo:

* Replanteo.
* Cavado de cimientos.
* Llenado de cimientos.
* Levantamiento de muros.
* Llenado de columnas.
* Instalación eléctrica.
* Instalación sanitaria.
* Revoque.
* Contrapiso.
* Colocación de pisos.
* Pintura.
* Terminaciones.
* Limpieza final.

Cada etapa debería poder tener:

* Nombre.
* Descripción.
* Estado: pendiente, en proceso, completada, pausada.
* Porcentaje de avance.
* Peso dentro de la obra.
* Fecha estimada de inicio.
* Fecha estimada de finalización.
* Responsable.
* Gastos vinculados.
* Materiales asociados.
* Mano de obra asociada.
* Fotos de avance.
* Comentarios o novedades.

### Plantillas reutilizables de obra

El sistema debe permitir crear plantillas de etapas reutilizables para distintos tipos de trabajos.

Ejemplos de plantillas:

* Casa desde cero.
* Remodelación.
* Ampliación.
* Local comercial.
* Departamento.
* Obra menor.
* Instalación eléctrica.
* Instalación sanitaria.
* Terminaciones.

Cada plantilla debe permitir definir etapas, orden, peso porcentual y tareas internas. Al crear una nueva obra, el usuario puede seleccionar una plantilla y adaptarla según el caso.

### Avance de obra

El sistema debe calcular automáticamente el porcentaje de avance general de una obra en base al progreso de sus etapas.

El avance puede calcularse de dos formas:

* Promedio simple de etapas completadas.
* Promedio ponderado, donde cada etapa tiene un peso distinto según su importancia dentro de la obra.

Ejemplo: los cimientos pueden representar un 15%, la estructura un 25%, las instalaciones un 20% y las terminaciones un 40%.

---

## 3. Módulo de gastos

El sistema debe permitir registrar gastos de forma clara, categorizarlos y asociarlos a una obra específica o marcarlos como gastos generales de la empresa.

### Datos de un gasto

Cada gasto debe incluir:

* Fecha.
* Monto.
* Categoría.
* Descripción.
* Obra asociada, opcional.
* Etapa asociada, opcional.
* Proveedor.
* Método de pago.
* Comprobante adjunto.
* Estado: pendiente, pagado, cancelado.
* Usuario que cargó el gasto.

### Categorías de gastos

El sistema debe permitir crear categorías personalizadas, por ejemplo:

* Materiales.
* Mano de obra.
* Transporte.
* Herramientas.
* Maquinaria.
* Alquiler de equipos.
* Servicios.
* Combustible.
* Administración.
* Impuestos.
* Gastos generales.
* Otros.

### Gastos por obra y gastos generales

El usuario debe poder diferenciar entre:

* Gastos vinculados a una obra.
* Gastos vinculados a una etapa específica de una obra.
* Gastos generales de la empresa.

Esto permite conocer el costo real de cada obra y también los costos operativos generales de la constructora.

---

## 4. Módulo de presupuestos

El módulo de presupuestos debe permitir crear presupuestos profesionales para distintos tipos de trabajos, incluyendo materiales, mano de obra, adicionales, margen de ganancia e impuestos.

### Datos de un presupuesto

Cada presupuesto debe incluir:

* Cliente.
* Tipo de trabajo.
* Descripción del proyecto.
* Fecha de creación.
* Fecha de vencimiento.
* Estado: borrador, enviado, aprobado, rechazado, vencido.
* Items presupuestados.
* Subtotal.
* Descuentos.
* Impuestos.
* Margen de ganancia.
* Total final.
* Condiciones comerciales.
* Forma de pago.
* Tiempo estimado de ejecución.

### Items del presupuesto

Cada presupuesto debe poder componerse de items como:

* Materiales.
* Mano de obra.
* Herramientas.
* Maquinaria.
* Transporte.
* Servicios tercerizados.
* Administración.
* Extras o imprevistos.

Cada item debe tener:

* Nombre.
* Descripción.
* Cantidad.
* Unidad de medida.
* Precio unitario.
* Subtotal.
* Categoría.

### Plantillas de presupuestos

El sistema debe permitir crear plantillas reutilizables para presupuestos frecuentes.

Ejemplos:

* Construcción por metro cuadrado.
* Remodelación de baño.
* Remodelación de cocina.
* Instalación eléctrica.
* Revoque por metro cuadrado.
* Pintura por metro cuadrado.
* Colocación de pisos.
* Mano de obra general.

### Conversión de presupuesto a obra

Una funcionalidad clave es que un presupuesto aprobado pueda convertirse automáticamente en una obra.

Al convertirlo, el sistema debería generar:

* Obra nueva.
* Cliente asociado.
* Presupuesto base.
* Etapas sugeridas según la plantilla.
* Items estimados de materiales y mano de obra.
* Margen previsto.
* Rentabilidad estimada.

---

## 5. Reportes y exportación en PDF

El sistema debe permitir exportar información en PDF para uso interno o para enviar a clientes.

### Reportes de obra

El usuario debe poder exportar un reporte de obra con:

* Datos generales de la obra.
* Cliente.
* Responsable.
* Estado actual.
* Porcentaje de avance.
* Etapas completadas.
* Etapas pendientes.
* Gastos acumulados.
* Comparación entre presupuesto estimado y gasto real.
* Fotos de avance.
* Observaciones.
* Fecha del reporte.

### Reportes financieros

El sistema debe permitir generar reportes de:

* Gastos por obra.
* Gastos generales.
* Gastos por categoría.
* Gastos por proveedor.
* Gastos por período.
* Rentabilidad estimada por obra.
* Comparación presupuesto vs gasto real.

### Presupuestos en PDF

Cada presupuesto debe poder exportarse en PDF con una presentación profesional, incluyendo:

* Logo de la empresa.
* Datos de la constructora.
* Datos del cliente.
* Descripción del trabajo.
* Detalle de materiales.
* Detalle de mano de obra.
* Totales.
* Condiciones comerciales.
* Validez del presupuesto.
* Firma o aceptación del cliente.

---

## 6. Clientes

El sistema debe contar con un módulo simple de clientes para vincularlos con presupuestos y obras.

### Datos del cliente

* Nombre o razón social.
* Teléfono.
* Email.
* Dirección.
* CUIT o DNI, opcional.
* Obras asociadas.
* Presupuestos enviados.
* Historial de actividad.
* Observaciones.

---

## 7. Proveedores

El sistema debería permitir cargar proveedores para tener un mejor control de gastos, compras y materiales.

### Datos del proveedor

* Nombre.
* Rubro.
* Teléfono.
* Email.
* Dirección.
* CUIT, opcional.
* Materiales o servicios que ofrece.
* Gastos asociados.
* Observaciones.

Esto permite saber cuánto se le compra a cada proveedor y comparar costos a futuro.

---

## 8. Materiales e insumos

El sistema puede incluir una base de materiales para reutilizar en presupuestos y registrar gastos más rápido.

### Datos de un material

* Nombre.
* Categoría.
* Unidad de medida.
* Precio estimado.
* Proveedor habitual.
* Última actualización de precio.
* Observaciones.

Esto permite armar presupuestos más rápido y mantener una referencia de costos.

---

## 9. Usuarios, roles y permisos

El sistema debe permitir distintos tipos de usuarios según el rol dentro de la constructora.

### Roles posibles

* Administrador.
* Dueño o gerente.
* Responsable de obra.
* Administrativo.
* Cargador de gastos.
* Solo lectura.

### Permisos sugeridos

* Ver obras.
* Crear obras.
* Editar obras.
* Cargar gastos.
* Aprobar gastos.
* Ver reportes financieros.
* Crear presupuestos.
* Exportar PDFs.
* Administrar usuarios.
* Configurar plantillas.

---

## 10. Historial y trazabilidad

El sistema debe guardar un historial de acciones importantes.

Ejemplos:

* Quién creó una obra.
* Quién modificó una etapa.
* Quién cargó un gasto.
* Quién aprobó un presupuesto.
* Quién cambió el estado de una obra.
* Cuándo se exportó un reporte.

Esto ayuda a tener control interno y evitar pérdidas de información.

---

## 11. Adjuntos y evidencia visual

El sistema debe permitir adjuntar archivos en distintas partes del sistema.

### Adjuntos posibles

* Facturas.
* Recibos.
* Comprobantes de pago.
* Fotos de avance de obra.
* Planos.
* Contratos.
* Presupuestos firmados.
* Documentación del cliente.

Los adjuntos pueden vincularse a obras, etapas, gastos, clientes o presupuestos.

---

## 12. Alertas y recordatorios

El sistema debería contar con alertas automáticas para ayudar a la gestión diaria.

### Alertas sugeridas

* Obra atrasada.
* Etapa vencida.
* Presupuesto próximo a vencer.
* Gasto pendiente de pago.
* Gasto elevado respecto al presupuesto.
* Obra que superó el costo estimado.
* Falta de actualización de avance.
* Documentación pendiente.

---

## 13. Configuración general

El sistema debe permitir configurar datos propios de la empresa.

### Configuraciones básicas

* Nombre de la constructora.
* Logo.
* Datos fiscales.
* Moneda.
* Categorías de gastos.
* Estados personalizados.
* Plantillas de obra.
* Plantillas de presupuesto.
* Formato de PDF.
* Usuarios y permisos.

---

## 14. Funcionalidades recomendadas para una segunda etapa

Estas funcionalidades pueden no ser obligatorias para el MVP, pero pueden aumentar mucho el valor del producto.

### Inventario de materiales

Controlar stock de materiales disponibles, materiales usados por obra y alertas de reposición.

### Compras y órdenes de compra

Crear solicitudes de compra, órdenes de compra y vincularlas con proveedores, obras y gastos.

### Certificados de avance

Generar certificados de avance de obra para presentar al cliente, cobrar por etapas o documentar progreso.

### Flujo de aprobación de gastos

Permitir que ciertos usuarios carguen gastos, pero que un administrador tenga que aprobarlos antes de impactar en el reporte financiero.

### Comparación presupuesto vs realidad

Mostrar automáticamente cuánto se presupuestó, cuánto se gastó realmente y cuál es la diferencia.

### Rentabilidad por obra

Calcular si una obra está dejando ganancia o pérdida en base al presupuesto aprobado, gastos reales y margen esperado.

### Cronograma tipo Gantt

Visualizar las etapas de obra en una línea de tiempo para entender fechas, retrasos y dependencias.

### App mobile para carga rápida en obra

Permitir que responsables de obra carguen avances, fotos y gastos desde el celular directamente en el lugar de trabajo.

### Firma digital o aceptación de presupuestos

Permitir que el cliente apruebe un presupuesto desde un enlace, dejando registro de la aceptación.

### Portal de cliente

Permitir que el cliente vea el avance de su obra, reportes, fotos y documentación sin acceder al panel interno completo.
