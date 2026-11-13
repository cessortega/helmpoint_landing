const TO = process.env.DEMO_TO || 'admin@helmdeck.ai';
const FROM = process.env.DEMO_FROM || 'HelmPoint Demo <noreply@helmdeck.ai>';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Método no permitido.' });
  }

  const { name, email, size, useCase } = req.body || {};
  if (!name || !email || !size) {
    return res.status(400).json({ ok: false, error: 'Faltan campos requeridos.' });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Correo inválido.' });
  }

  const isProd = process.env.VERCEL_ENV === 'production';
  if (!isProd) {
    console.log('[demo] skip send (env=%s)', process.env.VERCEL_ENV || 'local', { name, email, size, useCase });
    return res.status(200).json({ ok: true, simulated: true });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(500).json({ ok: false, error: 'Falta RESEND_API_KEY en el servidor.' });

  const useCaseBlock = useCase && useCase.trim()
    ? `<p><strong>Caso de uso / flujo:</strong><br>${esc(useCase).replace(/\n/g, '<br>')}</p>`
    : '<p><strong>Caso de uso / flujo:</strong> <em>(no especificado)</em></p>';

  const html = `
    <h2 style="margin:0 0 12px;font-family:system-ui">Nueva solicitud de demo — HelmPoint</h2>
    <p><strong>Nombre:</strong> ${esc(name)}</p>
    <p><strong>Correo:</strong> <a href="mailto:${esc(email)}">${esc(email)}</a></p>
    <p><strong>Tamaño del equipo en campo:</strong> ${esc(size)}</p>
    ${useCaseBlock}
    <hr>
    <p style="color:#6b7280;font-size:12px">Enviado desde el formulario de la landing.</p>
  `;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: TO,
        reply_to: email,
        subject: `Demo HelmPoint · ${name} · ${size}`,
        html,
      }),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      return res.status(502).json({ ok: false, error: 'No pudimos enviar el correo.', detail });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Error de red al enviar el correo.' });
  }
}
