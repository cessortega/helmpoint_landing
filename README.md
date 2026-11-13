# HelmPoint · Landing

Sitio estático, sin build ni dependencias.

## Probar local

```bash
python3 -m http.server 8080
# abre http://localhost:8080
```

(También abre directo con doble clic en `index.html`.)

## Estructura

- `index.html` — la página (plantilla con `{{ }}`, `sc-if`, `sc-for`)
- `assets/app.js` — motor mínimo de plantillas + lógica y animaciones
- `assets/styles.css` — tokens de marca y estilos
- `assets/icons.js` — íconos de línea
- `assets/favicon.svg` — logo
