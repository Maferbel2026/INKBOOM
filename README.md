# INKBOOM! — Vista de revisión

Sitio estático de revisión: seis historias, 36 combinaciones visuales, Inky animado y personalización de demostración. No recibe compras ni genera cómics personalizados. Las fotografías de esta vista permanecen en la memoria del navegador; el registro de correo usa el receptor configurado.

## Construir y comprobar

Requiere Node.js 24 o superior, sin dependencias:

```sh
node scripts/check.mjs
node scripts/build.mjs
python3 -m http.server 4180 --directory dist
```

La fuente del sitio está en `public/`. Sites publica `dist/` según `.openai/hosting.json`. El repositorio contiene solamente código y recursos de marca; no incluye fotografías de clientes, datos de pedidos, capturas de revisión ni secretos.

El servidor de pedidos y Checkout Sandbox se mantiene separado. Esta publicación no activa pagos reales ni modifica ese servidor. El borrado automático de datos sigue pendiente de verificación.

Todos los importes se muestran en MXN. Imágenes e identidad de INKBOOM! conservan sus derechos; este repositorio no concede una licencia para reutilizarlas.
