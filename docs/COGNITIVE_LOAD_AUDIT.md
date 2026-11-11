# Auditoría de carga cognitiva, microcopy y densidad

Fecha: 2026-11-11

## Componentes auditados

- Bandeja de facturas.
- Carga documental y timeline.
- Resumen de excepciones.
- Extracción documental.
- Documentos relacionados.
- Validaciones y evidencias.
- Propuesta de causación y acciones humanas.
- Shell, navegación y estados.

## Problemas identificados

1. El resumen de excepción repetía causa, explicación extensa, estado e investigación humana en el primer nivel.
2. Documentos relacionados mostraban evidencia y explicación heurística siempre visibles, compitiendo con nombre, referencia y estado.
3. Los hallazgos mostraban descripción y evidencia al mismo nivel que el dato principal.
4. En filas de extracción, el estado documental y la confianza ya estaban separados conceptualmente, pero el bloque de confianza quedaba debajo del badge y no en una columna derecha clara.
5. Varias etiquetas secundarias usaban 10–11 px en zonas que el analista consulta habitualmente.

## Microcopy original y mejorado

| Original                                                                                      | Mejorado                                               |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Los documentos del caso sintético están alineados. La propuesta aún requiere criterio humano. | Revisión humana pendiente.                             |
| Diferencia frente a orden de compra                                                           | Diferencia con la OC                                   |
| El origen exacto requiere investigación humana                                                | Requiere revisión; explicación disponible bajo demanda |
| Evidencia disponible en el análisis                                                           | Evidencia: VAL-001                                     |
| Relaciones documentales del escenario + explicación siempre visible                           | Nombre, referencia y estado; `Ver detalle de relación` |
| Descripción completa + evidencia siempre visible                                              | Resumen breve; `Ver explicación y evidencia`           |

La información financiera y la incertidumbre no se eliminaron: se movieron a `details` accesibles.

## Cambios tipográficos

- Los labels, metadatos y fuentes de extracción relevantes usan 12 px.
- Los nombres de documentos relacionados usan 14 px.
- Los títulos y datos principales mantienen jerarquía superior.
- Los importes continúan usando numerales tabulares.
- Los tamaños de 10 px permanecen únicamente en la representación sintética del documento y elementos no esenciales.
- El bloque de extracción usa una cuadrícula: valor a la izquierda; verificación y confianza a la derecha.

## Cambios de componentes

### Excepción

El primer nivel muestra únicamente problema, estado, importes, diferencia y referencias de evidencia. La descripción completa se abre con `Ver explicación`.

### Documentos relacionados

Cada fila prioriza nombre, referencia y estado de relación. La justificación, fuente o explicación se encuentra en `Ver detalle de relación`.

### Hallazgos

El primer nivel muestra título, estado y comparación financiera. La explicación completa y la evidencia se encuentran en `Ver explicación y evidencia`.

### Extracción

La confianza permanece separada de la validación documental. En cada fila:

- izquierda: label y valor;
- derecha: badge documental y ring de confianza con nivel y fuente.

Esto evita interpretar `Alta confianza` como `Verificado` automáticamente.

## Evidencia responsive

Capturas posteriores a la corrección:

- [375 px](/tmp/density-mobile.png)
- [768 px](/tmp/density-tablet.png)
- [1024 px](/tmp/density-laptop.png)
- [1440 px](/tmp/density-desktop.png)

Observaciones:

- 375 px: el ring queda en la columna derecha del campo y el valor conserva legibilidad; la fuente permanece visible.
- 768 px: el panel mantiene filas sin recorte y las divulgaciones no fuerzan scroll horizontal global.
- 1024 px: la composición de análisis conserva documento y extracción sin superposición.
- 1440 px: la columna de extracción muestra badge y confianza alineados horizontalmente con cada valor.

## Pruebas ejecutadas

- `pnpm run format:check`: pasa.
- `pnpm run lint`: pasa con la advertencia conocida de React Compiler para `useReactTable`.
- `pnpm test`: 13 pruebas pasan.
- `pnpm run build`: pasa con TypeScript.
- Las cuatro rutas principales respondieron `200` en la verificación previa.
- Chrome headless generó capturas en 375, 768, 1024 y 1440 px.
- Se revisó el escenario obligatorio `INV-002` con `$52.000.000`, `$50.000.000` y `$2.000.000`.

No se ejecutaron Playwright, axe ni pruebas con usuarios reales porque no están disponibles en este entorno. No se afirma cumplimiento WCAG completo ni resultados de investigación.

## Defectos pendientes

1. Autoalojar Inter si el despliegue no puede depender de Google Fonts.
2. Ejecutar pruebas automatizadas de foco y teclado sobre los elementos `details` cuando Playwright esté disponible.
3. Sustituir la representación sintética del documento por el recurso PDF/imagen real del backend.
4. Resolver la advertencia de React Compiler asociada a `useReactTable` si se activa ese compilador en producción.
