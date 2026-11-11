# Auditoría de layout y scroll

Fecha: 2026-11-10

## Alcance

Se auditó y corrigió el shell compartido de AI Invoice Processor y su interacción con las cuatro rutas del MVP:

- `/facturas`
- `/facturas/nueva`
- `/facturas/:invoiceId/analisis`
- `/facturas/:invoiceId/causacion`

No se modificaron `Backend/`, contratos REST, tipos de dominio ni fixtures.

## Problema original y causa raíz

El shell utilizaba `min-height: 100vh` en `.app-shell`, pero no tenía una cadena de alturas flex explícita ni un propietario único del scroll. `.main-area` no era un contenedor flex vertical y `.page-content` no tenía `min-height: 0` ni `overflow-y: auto`.

Como consecuencia, el documento podía desplazar simultáneamente el sidebar, el header y el contenido. El sidebar tampoco tenía una región de overflow propia. El problema no se resolvía únicamente con `position: sticky`: faltaba separar estructuralmente navegación, header y contenido.

La tabla ya disponía de `overflow-x: auto`, pero la región no declaraba `min-width: 0` ni una contención explícita del overscroll, lo que podía facilitar desbordamientos percibidos en layouts flexibles.

## Correcciones aplicadas

### Shell compartido

- `.app-shell` ahora ocupa `100dvh`, conserva fallback `100vh` y oculta el overflow externo.
- `body` no crea un segundo scroll vertical.
- `.sidebar` ocupa la altura disponible, mantiene su ancho estable y tiene `overflow-y: auto` independiente.
- `.main-area` es una columna flex con `min-height: 0`.
- `.topbar` tiene tamaño flex fijo y queda fuera del área desplazable.
- `.page-content` es el único propietario del scroll vertical del área principal, con `min-height: 0`, `min-width: 0` y `overscroll-behavior: contain`.
- El drawer móvil conserva su overlay y posición fija, sin afectar el scroll del contenido.

### Tablas y regiones horizontales

- `.table-wrap` declara `min-width: 0` y `overflow-x: auto`.
- El overscroll horizontal queda contenido en la tabla.
- No se agregó overflow global como solución a tablas.

### Documento y navegación

- El visor mantiene `position: sticky` únicamente en escritorio, dentro del contenedor de contenido que desplaza.
- En tablet y móvil el visor vuelve a flujo normal.
- En móvil el resumen de excepción y los datos clave aparecen antes del documento; el enlace `Ver documento original` lleva al visor sin introducir un segundo scroll.
- El menú móvil se cierra al elegir una ruta.

## Evidencia posterior a la corrección

Capturas generadas con Chrome headless después del cambio:

- [375 px](/tmp/layout-mobile.png)
- [768 px](/tmp/layout-tablet.png)
- [1024 px](/tmp/layout-laptop.png)
- [1440 px](/tmp/layout-desktop.png)

La captura de 1440 px muestra sidebar y header estables, resumen de excepción visible y paneles de documento/extracción sin desbordamiento global. La captura de 375 px muestra drawer preparado para navegación móvil, contenido en una sola columna y la diferencia financiera antes del documento.

## Pruebas ejecutadas

### Rutas

Con el servidor Vite activo, las cuatro rutas respondieron `200`:

| Ruta                          | Resultado |
| ----------------------------- | --------: |
| `/facturas`                   |       200 |
| `/facturas/nueva`             |       200 |
| `/facturas/INV-002/analisis`  |       200 |
| `/facturas/INV-002/causacion` |       200 |

### Calidad técnica

- `pnpm run format:check`: pasa.
- `pnpm run lint`: pasa con una advertencia existente de compatibilidad de React Compiler al usar `useReactTable`.
- `pnpm test`: 2 archivos y 8 pruebas pasan.
- `pnpm run build`: pasa.
- TypeScript incluido en el build: pasa.

### Escenarios y datos críticos

La verificación DOM de análisis `INV-002` confirmó la presencia simultánea de:

- `$52.000.000` de factura.
- `$50.000.000` de orden de compra.
- `$2.000.000` de diferencia.
- `Evidencia disponible en el análisis`.
- `Ver documento original`.

## Verificación por viewport

| Viewport | Captura | Resultado visual                                                                      |
| -------: | ------- | ------------------------------------------------------------------------------------- |
|      375 | Sí      | Excepción antes del documento, una columna, sin contenido fuera del viewport visible. |
|      768 | Sí      | Layout tablet en una columna, visor en flujo normal.                                  |
|     1024 | Sí      | Sidebar y contenido contenidos; análisis adaptable.                                   |
|     1440 | Sí      | Sidebar estable, header fuera del scroll, dos paneles y visor sticky.                 |

## Playwright y pruebas de comportamiento

Playwright no está instalado en el workspace y no se añadió una dependencia nueva durante esta corrección. Por ello no se afirma que se hayan ejecutado aserciones Playwright sobre `scrollTop`, posiciones DOM antes/después, teclado automatizado, dropdowns o diálogos.

Se usó Chrome headless para las cuatro capturas, comprobación HTTP y comprobación DOM. Las aserciones de comportamiento que requieren un navegador automatizado con API de interacción quedan pendientes de ejecutar cuando se habilite Playwright.

## Regresiones revisadas

- No se modificaron rutas ni payloads.
- La navegación de las cuatro pantallas continúa disponible.
- El modo demostración y los cuatro fixtures permanecen intactos.
- El scroll horizontal de tablas continúa encapsulado en su región.
- El visor no queda sticky en tablet/móvil.
- No se introdujeron botones ficticios ni autenticación.

## Pendientes

1. Ejecutar una suite Playwright real con aserciones de `scrollTop`, bounding boxes, foco, teclado y cambio de rutas.
2. Ejecutar axe u otra herramienta automatizada de accesibilidad.
3. Probar documentos PDF/imágenes reales dentro de un visor nativo cuando el backend entregue URLs de documentos.
4. Resolver o documentar la advertencia de `useReactTable` si se activa React Compiler en producción.

Estos pendientes están explicitados y no se presentan como verificaciones realizadas.
