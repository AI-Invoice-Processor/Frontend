# Auditoría de flujos de usuario

Fecha: 2026-11-10

## Alcance

Se revisaron y mejoraron los recorridos de las cuatro rutas existentes sin crear nuevas pantallas, cambiar contratos REST ni alterar la lógica financiera:

- `/facturas`
- `/facturas/nueva`
- `/facturas/:invoiceId/analisis`
- `/facturas/:invoiceId/causacion`

## Mapa inicial

```text
Bandeja
├── Cargar factura → selección/validación → análisis de INV-001
├── Abrir factura → análisis documental
│   └── Ver propuesta → propuesta de causación
└── Filtrar/buscar → abrir factura

Análisis
├── Ver documento, extracción, relaciones y validaciones
├── Volver a bandeja
└── Ver propuesta

Causación
├── Ver información extraída, validaciones y propuesta
├── Volver al análisis
└── Registrar revisión: botón deshabilitado, sin salida de trabajo
```

El bloqueo confirmado estaba en causación: el usuario podía consultar la propuesta, pero solo encontraba `Registrar revisión (próximamente)` deshabilitado. No existía una acción contextual, confirmación, historial ni actualización compartida del estado.

## Problemas detectados

| Área            | Problema                                                                          | Impacto                                              |
| --------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Causación       | Única acción deshabilitada                                                        | El flujo terminaba sin siguiente paso.               |
| Revisión humana | No había observación, confirmación ni historial                                   | No se podía demostrar trazabilidad.                  |
| Estado          | La revisión no tenía persistencia mock compartida                                 | Bandeja, análisis y causación podían divergir.       |
| Escenarios      | Duplicado y soporte faltante no ofrecían acciones específicas                     | El usuario no podía expresar qué debía investigarse. |
| Excepciones     | Una revisión registrada podía ocultar el hallazgo si se usaba solo `reviewStatus` | Riesgo de perder contexto financiero.                |

## Correcciones aplicadas

### Acciones contextuales

La propuesta ahora incluye `Siguientes acciones`:

- Todos los escenarios: `Solicitar revisión`.
- Todos los escenarios: `Registrar observación`.
- Duplicado probable: `Solicitar verificación de duplicado`.
- Soporte faltante: `Solicitar soporte faltante`.
- Extracción incierta o fallida: `Solicitar corrección de extracción`.
- Todos los escenarios: volver a documentos/evidencia y volver a la bandeja.

Las acciones no aprueban causación, no contabilizan y no modifican importes.

### Revisión humana simulada

Se agregó un diálogo nativo accesible con:

- tipo de acción;
- explicación del alcance simulado;
- observación obligatoria;
- confirmación y cancelación;
- estado de guardado/procesamiento;
- mensaje de éxito o error;
- historial con acción, observación y fecha.

El repositorio mock compartido usa `localStorage` bajo la clave `ai-invoice-processor:human-reviews`. El adaptador hidrata el resultado de `list` y `get`, de modo que la bandeja, análisis y causación observan el mismo estado durante la demostración.

Una revisión cambia únicamente el estado de revisión humana a `completada` y el estado de revisión de interfaz a `revisada`. No cambia total, comparación, validaciones, propuesta, pagos ni aprobación automática.

### Conservación de excepciones

El resumen de excepción continúa visible aunque una revisión simulada haya sido registrada. Una revisión no borra la diferencia, el duplicado probable ni el soporte faltante.

## Mapa final

```text
Bandeja
├── Cargar factura → validación → análisis
└── Abrir caso → análisis
    ├── Revisar documento/extracción/relaciones/validaciones
    ├── Volver a bandeja
    └── Propuesta de causación
        ├── Ver propuesta y excepción persistente
        ├── Solicitar revisión → diálogo → confirmar → historial/estado
        ├── Registrar observación → diálogo → confirmar → historial/estado
        ├── Acción específica del escenario → diálogo → historial/estado
        ├── Ver documentos y evidencia → análisis
        └── Volver a bandeja → estado revisado visible
```

Todos los recorridos tienen salida lógica y ninguna acción nueva aparenta aprobar o ejecutar una causación real.

## Archivos modificados

- `src/shared/types.ts`: eventos y tipos de acciones de revisión.
- `src/shared/review.ts`: repositorio mock compartido e hidratación de estados.
- `src/shared/api.ts`: integración de historial en `list` y `get` del mock.
- `src/features/invoices/components.tsx`: conservación visual de excepciones después de revisar.
- `src/features/invoices/pages.tsx`: diálogo, acciones contextuales, feedback e historial.
- `src/index.css`: estilos responsive, foco y estados del diálogo/acciones.
- `src/shared/api.test.ts`: prueba de consistencia de revisión sin alterar valores financieros.
- `docs/USER_FLOW_AUDIT.md`: este informe.

## Pruebas ejecutadas

- `pnpm run format:check`: pasa.
- `pnpm run lint`: pasa con la advertencia conocida de React Compiler para `useReactTable`.
- `pnpm test`: 9 pruebas pasan.
- `pnpm run build`: pasa con TypeScript.

### Verificación funcional con Chrome/CDP

Se verificó el recorrido real en `/facturas/INV-002/causacion`:

1. La pantalla muestra `Siguientes acciones` y no el botón deshabilitado anterior.
2. `Solicitar revisión` abre un `<dialog>` nativo con título correcto.
3. La observación se puede escribir y confirmar.
4. El evento queda almacenado en `localStorage`.
5. Aparece feedback de acción registrada en modo demostración.
6. Al navegar a `/facturas`, `INV-002` aparece como `Revisada`.
7. El shell conserva `body: hidden`, `.page-content: auto`, `.sidebar: auto` y header de 72 px.

Acciones disponibles verificadas por escenario:

| Escenario        | Acciones específicas observadas                                |
| ---------------- | -------------------------------------------------------------- |
| Normal           | Solicitar revisión, registrar observación                      |
| Diferencia       | Solicitar revisión, registrar observación                      |
| Duplicado        | Solicitar revisión, verificar duplicado, registrar observación |
| Soporte faltante | Solicitar revisión, solicitar soporte, registrar observación   |

También se conservaron las rutas HTTP `200`, el layout responsive de 375/768/1024/1440 px y el valor crítico de diferencia `$2.000.000`.

## Pendientes y dependencias futuras del backend

1. Sustituir el repositorio `localStorage` por `POST /api/invoices/:id/human-review` cuando exista el endpoint.
2. Obtener identidad, permisos, fecha oficial y auditoría desde backend.
3. Definir con negocio los estados de autorización y quién puede cerrar una revisión.
4. Añadir Playwright y axe para automatizar foco, teclado, diálogo, cambio de rutas y comportamiento de scroll.
5. No se realizó prueba con usuarios reales; no se presentan resultados de usabilidad inventados.
