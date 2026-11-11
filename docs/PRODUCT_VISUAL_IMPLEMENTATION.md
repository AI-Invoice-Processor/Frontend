# Implementación visual del AI Invoice Processor

Fecha: 2026-11-11

## Alcance y fuente de decisiones

Se implementó la arquitectura visual aprobada **Propuesta A — Centro de control financiero**:

- Bandeja orientada a excepciones.
- Resumen financiero prominente.
- Documento, extracción y evidencia en regiones diferenciadas.
- Propuesta contable separada de la decisión humana.
- Step rail contextual para causación.
- Acciones de revisión persistentes y explícitamente simuladas.

`docs/PRODUCT_VISUAL_RESEARCH.md` no existe en el workspace al momento de esta
verificación. Las decisiones se contrastaron contra las auditorías disponibles:
`UX_VISUAL_REFINEMENT.md`, `COGNITIVE_LOAD_AUDIT.md`, `USER_FLOW_AUDIT.md`,
`LAYOUT_SCROLL_AUDIT.md` y `TASK_FLOW_OPTIMIZATION.md`.

No se modificó `Backend/`, los contratos REST, los fixtures de negocio ni la
lógica de importes.

## Arquitectura visual implementada

### App Shell

- Sidebar persistente en escritorio con navegación a bandeja y carga.
- Header persistente con modo de ejecución (`Simulación`/`API conectada`) y menú móvil.
- Scroll vertical único en `.page-content`.
- Sidebar móvil como drawer con overlay y cierre al navegar.
- Tema claro/oscuro conservado mediante tokens CSS.

### Bandeja `/facturas`

- Encabezado de “Excepciones prioritarias” con leyenda contextual.
- Orden visual por casos que requieren revisión.
- Tabla de escritorio con motivo principal y acción textual específica.
- Tarjetas móviles con factura, proveedor, total, motivo, estado y siguiente acción.
- Filtros por texto, estado y acceso rápido a “Requieren revisión”.

### Carga `/facturas/nueva`

- Dropzone con validación local de tipo y tamaño.
- Timeline de recepción, procesamiento simulado y análisis.
- Estados de archivo seleccionado, error recuperable y procesamiento.
- Etiquetas visibles de `Simulado` y `Modo demostración`.

### Análisis `/facturas/:invoiceId/analisis`

- Barra contextual con número, estado y total del caso.
- `ExceptionSummary` antes del contenido documental.
- Comparación visible de factura, orden de compra y diferencia.
- Documento sintético en panel sticky de escritorio.
- En móvil, el resumen y la evidencia aparecen antes del visor.
- Extracción separada de verificación documental y confianza OCR.
- Documentos relacionados, validaciones y evidencia bajo demanda.

### Causación `/facturas/:invoiceId/causacion`

- Barra contextual persistente del caso.
- Step rail de cuatro etapas.
- Información extraída, validaciones, propuesta y decisión en regiones distintas.
- Mensaje explícito de que no se recomienda causación automática.
- Acciones de revisión y observación simuladas con historial.
- Continuidad al siguiente caso pendiente después de registrar una acción.
- Enlaces de navegación separados de las acciones de trabajo.

## Componentes y archivos modificados

### Componentes reutilizados o ajustados

- `ExceptionSummary`: prioridad financiera y diferencia crítica.
- `StepRail`: progresión contextual de causación.
- `ReviewCallout`: explicación accionable de la excepción.
- `ProcessingTimeline`: estados de procesamiento simulado.
- `ConfidenceIndicator` y `VerificationStatus`: confianza OCR y verificación documental separadas.
- `NextActions` y `ReviewActionDialog`: acciones humanas simuladas con trazabilidad.
- `StatePanel`: carga, vacío y error.

### Archivos de interfaz

- `src/features/invoices/pages.tsx`: contexto del caso, acciones explícitas de bandeja y navegación contextual.
- `src/features/invoices/components.tsx`: resumen de excepciones, evidencia y progresión.
- `src/index.css`: tokens, densidad, layout, responsive, foco y regiones de acción.
- `src/features/extraction/components.tsx`: indicador de confianza y fuente documental.

Los tipos, mocks, adaptador y repositorio de revisión se conservaron sin cambios
de contrato.

## Información conservada

La implementación mantiene:

- Los cuatro fixtures: `INV-001`, `INV-002`, `INV-003` e `INV-004`.
- El escenario obligatorio: factura `$52.000.000`, OC `$50.000.000`, diferencia `$2.000.000`.
- Estados de carga, vacío, error, incertidumbre y campos faltantes.
- Evidencias y referencias documentales.
- Confianza de extracción separada de verificación documental.
- Revisión humana separada de la propuesta contable.
- Acciones simuladas sin aprobar causación, registrar pagos ni cambiar importes.
- Rutas y contratos API existentes.

## Problemas corregidos en esta iteración

1. La última columna de la bandeja mostraba únicamente un icono; ahora comunica
   la acción específica del caso (`Revisar diferencia`, `Ver duplicado`, etc.).
2. La bandeja no tenía una señal de sección que explicara el orden de prioridad;
   ahora incluye “Excepciones prioritarias” y una leyenda de revisión.
3. Análisis y causación podían perder el identificador y el total al desplazarse;
   ahora mantienen una barra contextual junto al encabezado.
4. Las tarjetas de decisión tenían riesgo de ocupar un ancho desigual; ahora
   usan `grid-column: 1 / -1` y los grupos de botones son adaptables.
5. Los botones de acciones largas podían desbordar en tablet o móvil; ahora
   tienen ancho mínimo controlado, texto envolvente y una columna en móvil.

## Evidencias visuales

Capturas finales generadas con Chrome headless después de esperar el estado cargado
en `http://127.0.0.1:5186`:

| Pantalla  | 375 px                                                     | 768 px                                                     | 1024 px                                                     | 1440 px                                                     |
| --------- | ---------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| Bandeja   | `/tmp/ai-invoice-final-facturas-375.png`                   | `/tmp/ai-invoice-final-facturas-768.png`                   | `/tmp/ai-invoice-final-facturas-1024.png`                   | `/tmp/ai-invoice-final-facturas-1440.png`                   |
| Análisis  | `/tmp/ai-invoice-final-facturas-INV-002-analisis-375.png`  | `/tmp/ai-invoice-final-facturas-INV-002-analisis-768.png`  | `/tmp/ai-invoice-final-facturas-INV-002-analisis-1024.png`  | `/tmp/ai-invoice-final-facturas-INV-002-analisis-1440.png`  |
| Causación | `/tmp/ai-invoice-final-facturas-INV-002-causacion-375.png` | `/tmp/ai-invoice-final-facturas-INV-002-causacion-768.png` | `/tmp/ai-invoice-final-facturas-INV-002-causacion-1024.png` | `/tmp/ai-invoice-final-facturas-INV-002-causacion-1440.png` |

Observaciones visuales verificadas:

- En 375 px, la bandeja muestra primero motivo, importe y acción.
- En 375 px, análisis muestra la diferencia antes del documento completo.
- En 1440 px, análisis conserva documento y extracción en dos paneles.
- En 1440 px, causación alinea información extraída y validaciones, y deja la
  propuesta a ancho completo.
- La extracción muestra el porcentaje, `Alta confianza`/`Confianza media` y
  `Factura pág. 1` en la misma región derecha del campo.

## Pruebas ejecutadas

### Calidad técnica

```text
pnpm run format:check  PASS
pnpm run lint          PASS con warning conocido de React Compiler/useReactTable
pnpm test              PASS — 3 archivos, 13 pruebas
pnpm run build         PASS — TypeScript y Vite producción
```

### Rutas

Con Vite ejecutándose en `http://127.0.0.1:5185`:

```text
200 /facturas
200 /facturas/nueva
200 /facturas/INV-002/analisis
200 /facturas/INV-002/causacion
```

### Escenarios

Se generó el DOM cargado de los cuatro casos y se verificaron estos marcadores:

```text
INV-001: Sin diferencias detectadas
INV-002: Diferencia con la OC, Requiere revisión, $2.000.000
INV-003: Requiere revisión, Duplicado
INV-004: Requiere revisión, Soporte
```

### Navegador y responsive

- Chrome headless generó capturas en 375, 768, 1024 y 1440 px para bandeja,
  análisis y causación.
- Se repitió la captura móvil de bandeja con perfil Chrome limpio para evitar
  estado residual del drawer.
- Se revisó visualmente la diferencia crítica, la jerarquía de acciones y la
  alineación de confianza en análisis.
- No se detectó desbordamiento visible en las capturas revisadas.

La ejecución final produjo 12 capturas: tres pantallas (`facturas`, análisis y
causación) en cuatro viewport. La bandeja móvil se generó con un perfil Chrome
aislado y mostró el drawer cerrado inicialmente.

## Limitaciones pendientes

1. Playwright no está instalado en el workspace (`pnpm exec playwright` no está
   disponible); por eso no se declaran pruebas Playwright de teclado, focus,
   diálogo o navegación automatizada.
2. No se ejecutó axe ni una auditoría automatizada WCAG.
3. `docs/PRODUCT_VISUAL_RESEARCH.md` no existe; el informe usa las auditorías
   disponibles y deja esta ausencia explícita.
4. El visor sigue usando una representación sintética hasta recibir URLs PDF o
   imagen del backend.
5. La advertencia de React Compiler asociada a `useReactTable` continúa vigente.
6. Las acciones de revisión permanecen simuladas hasta que exista el endpoint
   backend correspondiente.
7. No se realizaron pruebas con usuarios reales; los criterios de usabilidad
   siguen siendo hipótesis de diseño.
