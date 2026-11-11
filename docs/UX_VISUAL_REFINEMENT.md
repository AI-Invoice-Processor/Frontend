# Refinamiento UX visual

Fecha: 2026-11-10

## Alcance y línea base

Se revisaron las cuatro pantallas del MVP y los tokens existentes antes de editar. La interfaz ya tenía una base funcional sólida: Lucide React, estados de carga/error/vacío, comparación de excepciones, timeline de carga, step rail y revisión humana simulada.

Los principales problemas identificados fueron:

- Dos familias tipográficas (`DM Sans` y `Space Grotesk`) sin una razón operacional clara.
- Escala dispersa con etiquetas de 10–11 px en zonas de lectura frecuente.
- Importes destacados, pero sin una regla tipográfica centralizada para números tabulares.
- Algunas instrucciones repetían el funcionamiento de la interfaz en vez de indicar el siguiente paso.
- El icono de carga era genérico para una acción de documento.
- La propuesta tenía varias acciones importantes, pero ahora las jerarquiza entre primaria, secundaria y navegación.

No se modificaron backend, contratos API, OCR, servicios de IA ni fixtures.

## Ronda 1 — Tipografía, claridad y jerarquía

### Decisiones

- Se eligió `Inter` como única familia operativa, adecuada para tablas, formularios e importes.
- Se eliminaron las referencias visuales a `DM Sans` y `Space Grotesk`.
- Se centralizaron tokens `--font-sans`, `--text-xs`, `--text-sm`, `--text-md`, `--text-lg` y `--text-xl`.
- Los importes usan `font-variant-numeric: tabular-nums`.
- La escala principal evita que el texto de contenido dependa de tamaños de 10–11 px.
- Se mantuvo el tamaño menor solo en metadatos documentales y la representación sintética del papel.

### Textos simplificados

| Antes                                                                                          | Después                                                              |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Revisa el procesamiento documental y prioriza las excepciones antes de proponer una causación. | Prioriza excepciones y revisa cada caso antes de proponer causación. |
| Adjunta una factura para iniciar el análisis simulado del caso.                                | Selecciona una factura para iniciar el análisis simulado.            |
| Flujo de demostración transparente                                                             | Flujo de carga                                                       |
| Se valida tipo y tamaño del archivo en el navegador.                                           | Tipo y tamaño se validan en el navegador.                            |
| Datos extraídos del documento sintético                                                        | Campos extraídos del documento sintético                             |
| Relaciones simuladas para este escenario                                                       | Relaciones documentales del escenario                                |
| Resultados observados, no decisiones contables definitivas                                     | Hallazgos observados; no son decisiones contables                    |
| Las acciones se habilitarán con el backend                                                     | Revisión humana pendiente                                            |

Las advertencias financieras, el carácter simulado y la distinción entre revisado y causado se conservaron.

## Ronda 2 — Iconografía y acciones

- Se mantiene Lucide React como biblioteca única.
- La acción `Cargar documento` usa `FileUp`, más específica que un icono de nube genérico.
- Se conservaron iconos semánticos para alerta, validación, evidencia, documentos y revisión.
- Los botones iconográficos existentes mantienen `aria-label` y foco visible.
- La causación mantiene una única acción primaria (`Solicitar revisión`).
- Las acciones de escenario y observación son secundarias.
- Ver documentos y volver a bandeja son acciones de navegación discretas.
- No se eliminaron capacidades: se redujo la competencia visual entre acciones.

## Ronda 3 — Visualización, consistencia y responsive

Se conservaron visualizaciones que explican datos reales del fixture:

- Comparación Factura / Orden de compra / Diferencia.
- Timeline de procesamiento.
- Step rail de causación.
- Evidencias documentales.
- Estados de extracción y campos faltantes.
- Historial de revisión simulada.

No se añadieron métricas estadísticas, gráficos decorativos ni porcentajes nuevos.

Capturas posteriores al refinamiento:

- [375 px](/tmp/ux-refinement-mobile.png)
- [768 px](/tmp/ux-refinement-tablet.png)
- [1024 px](/tmp/ux-refinement-laptop.png)
- [1440 px](/tmp/ux-refinement-desktop.png)

En 375 px, el resumen de excepción aparece antes del documento y conserva `$52.000.000`, `$50.000.000` y `$2.000.000`. En 1440 px, documento y extracción permanecen legibles en dos paneles, con sidebar y header estables.

## Componentes modificados

- `src/index.css`: fuente, tokens tipográficos, escala, numerales tabulares y ajuste de jerarquía.
- `src/features/invoices/pages.tsx`: textos UX y `FileUp` para carga documental.
- `docs/UX_VISUAL_REFINEMENT.md`: este informe.

## Pruebas ejecutadas

- `pnpm run format:check`: pasa.
- `pnpm run lint`: pasa con la advertencia conocida de React Compiler para `useReactTable`.
- `pnpm test`: 9 pruebas pasan.
- `pnpm run build`: pasa con TypeScript.
- Las cuatro rutas respondieron HTTP `200`.
- Chrome headless generó capturas en 375, 768, 1024 y 1440 px.
- Se comprobó visualmente el escenario de diferencia de `$2.000.000`.

No se ejecutaron Playwright, axe ni pruebas con usuarios reales porque no están instalados/disponibles en este entorno. No se afirma cumplimiento WCAG completo ni resultados de investigación de usuarios.

## Riesgos residuales

1. La fuente Inter depende de Google Fonts en runtime; debe autoalojarse si el despliegue requiere independencia de red.
2. La advertencia de `useReactTable` sigue pendiente mientras se mantenga React Compiler activo.
3. La representación del documento continúa siendo sintética hasta disponer de URLs PDF/imagen reales.
4. La accesibilidad automatizada y la validación con usuarios deben ejecutarse antes de declarar el refinamiento definitivo.
