# Guía de Paso a Producción — Facturación Electrónica ARCA

Esta guía detalla los pasos requeridos para configurar y habilitar la facturación electrónica oficial de ARCA (ex AFIP) para un cliente en **Turnik**.

---

## 1. Requisitos previos

El contribuyente (titular o apoderado del negocio) debe contar con:
- CUIT activo.
- Clave fiscal nivel 3 o superior en el portal de ARCA (afip.gob.ar).
- Régimen Monotributo activo (para emisión de Factura C y Nota de crédito C).
- Servicios adheridos en ARCA:
  - *Administración de Puntos de Venta y Domicilios*.
  - *Administrador de Relaciones de Clave Fiscal*.

---

## 2. Generación del certificado de producción

1. **Generar la clave privada y el CSR (Certificate Signing Request):**
   En una terminal con OpenSSL:
   ```bash
   # Generar clave privada RSA de 2048 bits
   openssl genrsa -out privada.key 2048

   # Generar la solicitud de certificado (CSR)
   openssl req -new -key privada.key -subj "/C=AR/O=MI_NEGOCIO/CN=turnik/serialNumber=CUIT 20XXXXXXXX9" -out pedido.csr
   ```
   *(Reemplazar `20XXXXXXXX9` por el CUIT real del contribuyente).*

2. **Cargar el CSR en ARCA:**
   - Ingresar con Clave Fiscal a **Administrador de Relaciones de Clave Fiscal** (o **Certificados Digitales**).
   - Crear un nuevo computador fiscal con el alias (ej: `turnik-facturacion`).
   - Cargar el archivo `pedido.csr`.
   - Descargar el certificado generado (`certificado.crt`).

---

## 3. Asociar el servicio de Facturación Electrónica (wsfe)

1. En el portal de ARCA, ingresar a **Administrador de Relaciones de Clave Fiscal**.
2. Seleccionar **Nueva Relación**.
3. Buscar el servicio:
   `ARCA (o AFIP) -> Web Services -> Facturación Electrónica (wsfe)`
4. En **Representante / Computador fiscal**, seleccionar el alias creado en el paso anterior (`turnik-facturacion`).
5. Confirmar la relación.

---

## 4. Crear el punto de venta en ARCA

1. Ingresar con Clave Fiscal a **Administración de Puntos de Venta y Domicilios**.
2. Seleccionar la empresa / contribuyente y pulsar **A/B/M Puntos de Venta**.
3. Pulsar **Agregar**:
   - **Número de punto de venta**: elegir un número libre (ej: `2`, `3`, `4`).
   - **Nombre de fantasía**: nombre del local (ej: `Turnik Local Centro`).
   - **Sistema de facturación**: seleccionar obligatoriamente **RECE para aplicativo y web services** (no elegir Facturador Móvil ni Comprobantes en Línea).
   - **Domicilio**: seleccionar el domicilio fiscal correspondiente.
4. Confirmar el alta y anotar el número de punto de venta registrado.

---

## 5. Cargar credenciales y datos fiscales en Turnik

1. Iniciar sesión en el panel de administración de Turnik (`/admin`).
2. En el menú lateral, acceder a **Configuración ARCA**.
3. Completar los campos:
   - **Entorno de facturación**: seleccionar **Producción (comprobantes oficiales)**.
   - **CUIT del emisor**: CUIT de 11 dígitos sin guiones.
   - **Punto de venta**: número exacto dado de alta en el paso 4.
   - **Razón social**: nombre del titular o razón social inscripta.
   - **Domicilio comercial**: dirección fiscal registrada ante ARCA.
   - **Ingresos brutos**: número de inscripción en IIBB o CUIT.
   - **Inicio de actividades**: fecha declarada de inicio de actividades (AAAA-MM-DD).
   - **Certificado digital (PEM)**: abrir el archivo `.crt` descargado con un editor de texto y pegar el contenido completo (`-----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----`).
   - **Clave privada (PEM)**: abrir `privada.key` y pegar el contenido completo (`-----BEGIN PRIVATE KEY----- ... -----END PRIVATE KEY-----`).
   - **Passphrase**: dejar en blanco salvo que la clave haya sido creada con contraseña.
4. Pulsar **Guardar cambios**.

---

## 6. Probar conexión

1. En la misma pantalla de **Configuración ARCA**, ubicar la sección **Probar conexión**.
2. Pulsar **Probar conexión**.
3. El sistema validará:
   - Servidores de ARCA (FEDummy activo).
   - Ticket de acceso WSAA (autenticación con el certificado y clave cargados).
   - Consulta de punto de venta ante WSFE.
   - Verificación de último comprobante emitido.
4. Asegurar que los 4 pasos muestren tilde verde (`✓`).

---

## 7. Primera factura oficial

1. Acceder a la sección **Comprobantes** en el menú de administración.
2. Pulsar **Emitir factura**.
3. Se puede emitir:
   - **Lote de turnos**: seleccionando un período con turnos cobrados.
   - **Emisión manual individual**: indicando monto, cliente y documento.
4. Al emitir, verificar:
   - Recepción exitosa del número de CAE y fecha de vencimiento.
   - En la tabla de comprobantes, pulsar la fila para expandirla y tocar **Ver comprobante**.
   - Validar que el comprobante muestre los datos fiscales completos del emisor, el total, el CAE y el código QR oficial.

---

## 8. Anulación mediante nota de crédito

Si un comprobante fue emitido con un monto o cliente erróneo:
1. En la tabla de **Comprobantes**, expandir la fila de la factura aprobada.
2. Pulsar el botón **Anular con nota de crédito**.
3. En la pantalla de confirmación, revisar el resumen del comprobante.
4. Pulsar **Emitir nota de crédito**:
   - Se solicitará a ARCA una **Nota de crédito C (tipo 13)** vinculada formalmente a la Factura C original.
   - Al autorizarse, la Factura C pasa al estado **Anulada**.
   - El turno o la venta asociada se libera automáticamente para que pueda corregirse o volverse a facturar.

---

## 9. Renovación de certificados digitales

Los certificados X.509 de producción otorgados por ARCA tienen una validez de **2 años**:
- Turnik notifica en el panel cuando un certificado tiene 30 días o menos para su vencimiento.
- Para renovar:
  1. Generar un nuevo CSR o cargar uno nuevo en ARCA.
  2. Descargar el nuevo certificado `.crt`.
  3. En **Configuración ARCA**, pegar el nuevo certificado en el campo **Certificado digital (PEM)** y la clave correspondiente.
  4. Guardar cambios y probar la conexión.
  5. El sistema renovará el ticket de acceso (WSAA) de forma transparente sin interrumpir las operaciones.
