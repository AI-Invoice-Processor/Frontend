# Optimización de recorridos de tareas

Fecha: 2026-11-11

## Alcance

Se auditaron las cuatro rutas existentes y se conservaron sus URLs:

- `/facturas`
- `/facturas/nueva`
- `/facturas/:invoiceId/analisis`
- `/facturas/:invoiceId/causacion`

No se modificaron backend, contratos REST, lógica contable ni autenticación.

## Mapa inicial

```text
Bandeja → análisis → causación → revisión humana
   └───────────────────────────────┘
```

El flujo terminaba en causación porque `Registrar revisión` estaba deshabilitado. Después de una revisión simulada, el usuario debía volver manualmente a la bandeja y volver a buscar el siguiente caso.

## Ocho tareas auditadas

| Tarea                          | Inicio              | Resultado esperado          | Línea base observada                           |
| ------------------------------ | ------------------- | --------------------------- | ---------------------------------------------- |
| Encontrar factura con revisión | Bandeja             | Abrir el caso priorizado    | Búsqueda/filtro y apertura disponibles         |
| Cargar factura                 | Carga               | Llegar al análisis          | Selección, validación y envío funcionales      |
| Consultar extracción/evidencia | Análisis            | Ver campos y fuentes        | Campos visibles; evidencia disponible en panel |
| Comparar factura y OC          | Análisis            | Entender valores comparados | Comparación crítica visible sin navegación     |
| Identificar diferencia         | Análisis            | Ver `$2.000.000` y estado   | Diferencia visible en resumen y validación     |
| Consultar causación            | Análisis            | Abrir propuesta             | Acción `Ver propuesta` disponible              |
| Solicitar revisión             | Causación           | Registrar evento trazable   | Antes bloqueado por botón deshabilitado        |
| Continuar con otra factura     | Después de revisión | Abrir siguiente pendiente   | Antes requería volver y buscar manualmente     |

Los conteos anteriores describen comportamiento observado en código y navegador; no son tiempos humanos ni resultados de usuarios.

## Problemas detectados

1. La revisión humana no tenía una acción ejecutable.
2. La observación debía escribirse desde cero aunque la excepción ya estaba disponible.
3. El resultado de la revisión no ofrecía continuidad directa.
4. La bandeja perdía búsqueda y estado de filtro al remontarse.
5. Las acciones de trabajo y navegación competían en la misma fila visual.

## Cambios implementados

### Acciones contextuales

- `Solicitar revisión` permanece como acción principal.
- `Registrar observación` es secundaria.
- Duplicados y soportes faltantes conservan sus acciones específicas.
- Documentos/evidencia y bandeja se agrupan como navegación secundaria.
- Después de registrar una revisión aparece `Siguiente factura pendiente: <número>`.

La siguiente factura se obtiene del adaptador mock, excluye la actual y excluye casos ya marcados como `revisada`. No aprueba causación ni realiza operaciones financieras.

### Reducción de entrada manual

La observación se precarga con el contexto del caso, por ejemplo:

```text
Solicitar revisión humana del caso. Motivo: Diferencia frente a orden de compra.
```

El usuario puede editarla antes de confirmar. La confirmación se mantiene porque la acción crea un evento de revisión.

### Persistencia de contexto

- Búsqueda y filtro de la bandeja se conservan durante la sesión con `sessionStorage`.
- El historial de revisión continúa en el repositorio mock compartido.
- La bandeja hidrata el estado revisado desde el mismo adaptador.

### Layout de acciones

- Escritorio: hasta tres acciones de trabajo en una fila uniforme.
- Tablet: dos columnas.
- Móvil: una columna.
- Navegación en fila separada para reducir decisiones simultáneas.

## Comparación antes/después

| Tarea                         | Antes                                 | Después                                          | Rutas                          | Resultado                            |
| ----------------------------- | ------------------------------------- | ------------------------------------------------ | ------------------------------ | ------------------------------------ |
| Solicitar revisión            | Botón deshabilitado; flujo bloqueado  | Abrir diálogo, observación precargada, confirmar | No cambia durante la acción    | Evento simulado y estado actualizado |
| Continuar después de revisar  | Volver a bandeja y buscar manualmente | Enlace directo a siguiente pendiente             | Causación → análisis siguiente | Continuidad contextual               |
| Volver a bandeja con búsqueda | Filtro podía reiniciarse              | Estado conservado por sesión                     | Detalle → bandeja              | Contexto recuperado                  |
| Consultar comparación         | Requería leer varias secciones        | Diferencia visible en resumen                    | Sin cambio                     | Menor reconstrucción mental          |

No se declara una reducción numérica de clics para tareas cuyo flujo anterior estaba bloqueado o cuyo tiempo humano no fue medido.

## Verificación funcional con navegador

Se comprobó con Chrome/CDP:

1. Abrir `/facturas/INV-002/causacion`.
2. Clicar `Solicitar revisión`.
3. Confirmar que el diálogo abre con observación precargada.
4. Confirmar la acción sin escritura manual adicional.
5. Confirmar evento en `localStorage` y feedback de éxito.
6. Confirmar aparición de `Siguiente factura pendiente`.
7. Volver a `/facturas` y comprobar búsqueda conservada (`FE-10482`).

También se verificaron los cuatro escenarios sintéticos y sus acciones contextuales en recorridos anteriores.

## Responsive y scroll

Se conservaron las correcciones del shell: sidebar estable, header fuera del scroll principal y tablas con overflow contenido. Se generaron capturas de causación en 375 y 1440 px durante esta iteración:

- [Móvil](/tmp/actions-mobile.png)
- [Escritorio](/tmp/actions-desktop.png)

La validación responsive acumulada cubre 375, 768, 1024 y 1440 px.

## Pruebas ejecutadas

- `pnpm run format:check`: pasa.
- `pnpm run lint`: pasa con la advertencia conocida de React Compiler para `useReactTable`.
- `pnpm test`: 13 pruebas pasan.
- `pnpm run build`: pasa con TypeScript.
- Chrome/CDP: revisión humana, siguiente factura y persistencia de filtro verificadas.

Playwright y axe no están instalados en el entorno; no se afirma automatización completa de los ocho recorridos ni cumplimiento WCAG completo.

## Riesgos y pendientes

1. La selección de siguiente factura deberá respetar permisos, orden de trabajo y paginación cuando exista backend.
2. La fecha y actor de revisión deben venir del backend en producción.
3. La precarga de observación debe validarse con negocio antes de convertirse en plantilla contractual.
4. Se requiere prueba con usuarios reales para medir tiempo, errores y carga cognitiva.
