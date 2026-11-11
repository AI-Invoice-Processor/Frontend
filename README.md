# AI Invoice Processor

Frontend del Reto 04 — NEPXA AI Ops Challenge 2026. La aplicación representa extracción documental, cruce contra documentos relacionados, validaciones y propuesta de causación usando datos sintéticos deterministas.

> Importante: este prototipo no ejecuta OCR, LLM, reglas contables ni causación real. Cada resultado está identificado como simulado y las excepciones requieren revisión humana.

## Stack

- React 19 + TypeScript + Vite 8
- TanStack Router, Query y Table (la capa visual usa una tabla semántica preparada para TanStack Table)
- Tailwind CSS 4 vía plugin de Vite, tokens CSS y componentes locales estilo shadcn/ui
- Lucide React, React Hook Form/Zod preparados para formularios futuros
- Vitest para pruebas deterministas

## Instalación y comandos

Requiere Node.js 24+ y pnpm 12+.

```bash
pnpm install
pnpm dev
pnpm run build
pnpm run lint
pnpm test
```

Para el equipo que usa npm, los mismos comandos son:

```bash
npm install
npm run dev
npm run build
npm run lint
npm test
```

`pnpm-lock.yaml` se conserva para el entorno local y `package-lock.json` fija la instalación reproducible del equipo y de Docker.

## Docker y despliegue

La imagen de producción se construye con `Dockerfile` y se sirve mediante Nginx. El archivo `docker-compose.prod.yml` levanta el frontend y el proxy Caddy sobre la red externa `ai-invoice-network`; el backend se publica internamente como `backend:8000` bajo `/api`.

Para una prueba local, crea la red una vez y levanta el servicio:

```bash
docker network create ai-invoice-network 2>/dev/null || true
docker compose -f docker-compose.prod.yml up --build
```

El despliegue automático se ejecuta en cada push a `main` mediante `.github/workflows/deploy.yml`. Requiere los secretos `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` y `DEPLOY_KNOWN_HOSTS`.

Copia `.env.example` como `.env`. `VITE_DATA_MODE=mock` es el modo actual. `VITE_API_BASE_URL` documenta el destino futuro; no se consumen servicios reales todavía.

## Rutas

- `/facturas`: bandeja con búsqueda, filtro y estados de carga/vacío/error.
- `/facturas/nueva`: validación local de PDF/PNG/JPG, tamaño máximo de 10 MB y carga simulada.
- `/facturas/:invoiceId/analisis`: visor representativo, extracción, documentos relacionados, evidencia y validaciones.
- `/facturas/:invoiceId/causacion`: información extraída, validaciones, propuesta contable y decisión humana.

Fixtures disponibles: `INV-001` normal, `INV-002` diferencia oficial de $52.000.000 frente a $50.000.000, `INV-003` duplicado probable e `INV-004` soporte faltante.

## Arquitectura

`src/shared/types.ts` contiene los contratos independientes de la UI. `src/shared/api.ts` define el adaptador que deberá sustituirse por un cliente REST. `src/mocks/fixtures.ts` concentra datos reproducibles. Las pantallas viven en `src/features/invoices/` y el árbol único de TanStack Router en `src/app/router.tsx`.

## Contrato REST futuro

El frontend queda preparado para estos endpoints, aún inexistentes:

| Método | Ruta                                   | Propósito                                                       |
| ------ | -------------------------------------- | --------------------------------------------------------------- |
| GET    | `/api/invoices`                        | Lista paginada con búsqueda y estado de revisión                |
| POST   | `/api/invoices`                        | Recibe una factura y devuelve su identificador de procesamiento |
| GET    | `/api/invoices/:id`                    | Detalle de factura                                              |
| GET    | `/api/invoices/:id/extraction`         | Resultado de extracción y confianza                             |
| GET    | `/api/invoices/:id/related-documents`  | Contrato, OC y soportes relacionados                            |
| GET    | `/api/invoices/:id/validations`        | Validaciones, excepciones y evidencia                           |
| GET    | `/api/invoices/:id/causation-proposal` | Propuesta contable no definitiva                                |
| POST   | `/api/invoices/:id/human-review`       | Registra decisión de una persona autorizada                     |

Errores esperados: `400` archivo inválido, `404` factura inexistente, `409` procesamiento concurrente, `422` respuesta incompleta y `5xx` fallo del servicio. La validación del cliente nunca sustituye la del backend.

## Seguridad y limitaciones

Solo se usan datos sintéticos. No hay secretos, claves de IA, autenticación falsa ni controles de acceso simulados. El backend debe repetir validación de archivos, autorización, análisis documental y reglas contables. El visor documental actual es una representación nativa para la demo y no interpreta documentos reales.

## Licencia

El código generado para este reto es del proyecto. Se conservarán los avisos de terceros cuando se incorporen componentes derivados de Shadcn Admin, referencia MIT: https://github.com/satnaing/shadcn-admin/blob/main/LICENSE
