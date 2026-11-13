## Resumen

<!-- Qué cambia y por qué. -->

## Verificación

- [ ] `node --check` para `js/*.js`
- [ ] `docker compose -f docker-compose.prod.yml config --quiet`
- [ ] `docker build` y comprobación de `/health`

## Checklist trunk-based

- [ ] La rama nació de `main` y es de corta duración.
- [ ] El título sigue Conventional Commits.
- [ ] No se incluyen secretos, `.env` ni artefactos generados.
- [ ] El cambio mantiene `main` desplegable.
