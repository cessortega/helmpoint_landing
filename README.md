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
- `api/demo.js` — serverless function (Vercel) para el formulario de demo

## Formulario de demo (Vercel + Resend)

El `POST /api/demo` manda un correo con los datos del formulario vía Resend.

Variables de entorno en Vercel:

- `RESEND_API_KEY` *(requerida)* — token de Resend.
- `DEMO_TO` *(opcional)* — correo destinatario. Default: `admin@helmdeck.ai`.
- `DEMO_FROM` *(opcional)* — remitente. Default: `HelmPoint Demo <noreply@helmdeck.ai>` (el dominio debe estar verificado en Resend).

Solo envía correo cuando `VERCEL_ENV === 'production'`. En local y en preview devuelve `{ ok:true, simulated:true }` y loggea el payload.

### Probar en local con Vercel

```bash
npm i -g vercel
vercel dev        # levanta index.html + /api/demo
```

Con `python3 -m http.server` el frontend se ve pero el formulario no envía — ocupa el runtime de Vercel.
