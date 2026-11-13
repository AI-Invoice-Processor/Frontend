# AI Invoice Processor · Frontend estático

Frontend del Reto 04 — NEPXA AI Ops Challenge 2026. Esta versión sirve la interfaz en HTML, CSS y JavaScript puro, con navegación, roles, revisiones, filtros, modales y datos provenientes del Backend FastAPI.

No requiere React, Node ni un proceso de compilación para producción.

## Páginas

- `/index.html`: espacio de revisiones y operación documental.
- `/landing.html`: portada pública y explicación del producto.
- `/login.html`: acceso de demostración por rol.
- `/registro.html`: creación de acceso de demostración.

El dashboard de `index.html` es la entrada raíz del despliegue. Las páginas de autenticación solo configuran el rol en `sessionStorage`; no representan autenticación real.

## Stack y estructura

- HTML semántico, CSS propio y JavaScript sin framework.
- Nginx para servir los archivos estáticos dentro del contenedor.
- Assets de marca, fuentes, iconos y animaciones incluidos en el repositorio.

La plantilla se organiza en `css/`, `js/`, `fonts/`, `img/`, `vendor/` y `AI_Invoice_Processor_Enterprise_Identity_v1/`. El cliente API usa `API_BASE_URL` generado al iniciar el contenedor para conectarse al Backend.

## Ejecución local

```bash
python3 -m http.server 8080
```

Abrir `http://localhost:8080/landing.html`.

## Conexión con Backend

El Frontend consulta expedientes, documentos, propuestas, validaciones y auditoría mediante el Backend FastAPI. En local:

```bash
docker run --rm -p 8080:80 \
  -e API_BASE_URL=http://localhost:8000 \
  ai-invoice-processor/frontend:latest
```

Si el Backend no está disponible, la interfaz muestra un estado de conexión y no reemplaza la información por datos sintéticos.

## Docker y despliegue

El `Dockerfile` usa Nginx directamente y sirve la carpeta raíz del frontend en el puerto `80`.

```bash
docker build -t ai-invoice-processor/frontend:latest .
docker run --rm -p 8080:80 -e API_BASE_URL=http://localhost:8000 ai-invoice-processor/frontend:latest
```

Health check:

```text
GET /health
```

En producción, `docker-compose.prod.yml` sirve el frontend y Caddy en la red compartida con el backend. Caddy envía `/api/*` al servicio `backend:8000`; `API_BASE_URL=/` hace que el navegador use ese mismo origen.

El despliegue automático se ejecuta al integrar cambios en `main` y requiere los secretos `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` y `DEPLOY_KNOWN_HOSTS`.

En AWS se puede cambiar `API_BASE_URL` al iniciar el contenedor sin reconstruir los archivos estáticos.
