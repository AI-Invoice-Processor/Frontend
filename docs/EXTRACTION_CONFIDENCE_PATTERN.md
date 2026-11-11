# Patrón de confianza de extracción

## Propósito

El análisis documental presenta dos señales distintas por campo:

1. **Confianza de extracción:** qué tan seguro es el sistema de haber leído el valor.
2. **Verificación documental:** si el valor fue contrastado con la evidencia disponible.

Una señal nunca sustituye a la otra. Por ejemplo, un campo puede mostrar `76% · Revisar extracción` y, al mismo tiempo, `Verificado` si una persona o una validación documental confirmó el valor pese a una lectura automática incierta.

## Componente reutilizable

`src/features/extraction/components.tsx` contiene:

- `ConfidenceIndicator`: ring progress, porcentaje, etiqueta interpretativa y fuente.
- `VerificationStatus`: badge independiente con iconografía y texto.

### Rangos

| Porcentaje | Interpretación     | Tratamiento |
| ---------: | ------------------ | ----------- |
|     95–100 | Alta confianza     | Verde       |
|      80–94 | Confianza media    | Ámbar       |
|       0–79 | Revisar extracción | Rojo        |

El porcentaje se limita a 0–100, se redondea para lectura rápida y también se expone mediante `aria-label` en el ring. La fuente se muestra como `Factura · pág. 1`.

## Aplicación

El patrón se aplica en el panel `Extracción documental` para proveedor, NIT, número de factura, fecha, subtotal, IVA, retenciones y total. La variante compacta mantiene el patrón en filas densas sin convertirlo en texto ambiguo.

Los fixtures incluyen ejemplos verificables:

- 99%, 98%, 97% y 95%: alta confianza.
- 84%: confianza media en `INV-003`.
- 76%: revisar extracción en `INV-004`.

La verificación se mantiene como `Verificado`, `Pendiente`, `Con diferencia` o `Requiere revisión` según el estado documental; no se deriva automáticamente del porcentaje.

## Verificación

- Prueba de componente de rangos 99%, 84% y 76%.
- Prueba de separación entre `Revisar extracción` y `Verificado`.
- Tests totales: 13/13.
- Build TypeScript/Vite: pasa.
- Lint: pasa con la advertencia previa de React Compiler asociada a `useReactTable`.
- Capturas Chrome headless: 375, 768, 1024 y 1440 px.

Capturas:

- [375 px](/tmp/confidence-mobile.png)
- [768 px](/tmp/confidence-tablet.png)
- [1024 px](/tmp/confidence-laptop.png)
- [1440 px](/tmp/confidence-desktop.png)

Playwright y axe no están instalados en el entorno actual; no se afirma una auditoría automatizada completa de accesibilidad.
