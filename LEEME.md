# ¿Qué personaje de The Office sos? — modo en vivo

Un solo link para todos:
- **Vos (proyector):** `https://TU-PROYECTO.vercel.app/?admin=TU_CLAVE`
- **Tus amigos (celular):** `https://TU-PROYECTO.vercel.app/` (o escanean el QR que aparece en pantalla)

## Puesta en marcha (unos 20 minutos)

1. **GitHub.** Creá un repositorio nuevo (puede ser privado), por ejemplo `quiz-office-vivo`. En la pantalla del repo vacío, elegí "uploading an existing file" y arrastrá todo el contenido de esta carpeta: `index.html`, `app.js`, `data.js`, `package.json` y las carpetas `api` e `img`. Confirmá con "Commit changes".
2. **Vercel.** "Add New… → Project", importá ese repositorio. En "Framework Preset" dejá **Other**. Deploy.
3. **Base de datos.** Dentro del proyecto en Vercel: pestaña **Storage** → crear o conectar **Upstash for Redis** (desde el Marketplace), plan gratuito, y conectalo a este proyecto. Vercel agrega solo las credenciales.
4. **Tu clave de presentador.** Settings → Environment Variables → agregá `ADMIN_KEY` con una clave que solo sepas vos.
5. **Redeploy.** Deployments → en el último, "Redeploy", para que tome la base y la clave.
6. **Prueba (recomendado el día anterior).** Abrí el link con `?admin=TU_CLAVE` en la compu y entrá desde dos celulares. Pasá un par de preguntas y llegá al final.

Los nombres exactos de los menús de Vercel pueden cambiar; si algo no coincide, buscá la opción equivalente.

## Durante la presentación

- Pantalla completa en el proyector (F11 o Ctrl/Cmd+Shift+F).
- Avanzás con el botón, con la flecha derecha o con un control de presentaciones. Flecha izquierda vuelve.
- El contador muestra cuántos respondieron. Al final aparece el reparto de personajes de la sala y cada uno tiene su expediente en el celular.
- **Nueva ronda** borra el estado y vuelve a la pantalla de inicio (las respuestas anteriores dejan de contar).
- Si a alguien se le corta la conexión, su celular le ofrece "Seguir por mi cuenta" y llega igual a su resultado.

## Si algo falla

- **"Clave de presentador incorrecta":** revisá `ADMIN_KEY` y hacé Redeploy.
- **Los celulares se quedan en "Conectando…":** la base no está conectada. Revisá en Storage que Upstash esté vinculado al proyecto y hacé Redeploy.
- **El QR no aparece:** igual se puede entrar escribiendo la dirección que figura en pantalla.

## Privacidad

No se piden nombres ni datos. Cada celular usa un identificador anónimo y las respuestas se borran solas a las 48 horas.
