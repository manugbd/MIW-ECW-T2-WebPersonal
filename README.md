# Manuel García Baldó · Web personal

Sitio personal y académico desarrollado para la asignatura **Estándares y Computación Web** del Máster Universitario en Ingeniería Web de la Universidad de Oviedo.

Reúne mi perfil, trayectoria, proyectos e intereses en una web estática construida con HTML semántico, CSS y pequeñas mejoras en JavaScript.

## Contenido

| Página | Contenido |
| --- | --- |
| Inicio | Presentación y acceso a las secciones |
| Perfil y CV | Formación, trayectoria y currículum en PDF |
| Proyectos | Trabajos académicos y proyectos de desarrollo |
| Tecnología y estudios | Intereses profesionales y formación |
| Ocio y tiempo libre | Aficiones, música, naturaleza y vídeo |

## Tecnologías

- **Eleventy (11ty)** para generar las páginas estáticas.
- **Nunjucks** para compartir la plantilla, la navegación y el pie de página.
- **HTML5 y CSS** para el contenido y el diseño adaptable.
- **JavaScript** para mejoras como la actualización del año y la coordinación de reproductores.
- **GitHub Actions y GitHub Pages** para generar y publicar la web con dominio personalizado.

## Desarrollo local

Requisitos: **Node.js 22** (la versión utilizada en Actions) y npm.

```sh
npm ci
npm start
```

El servidor de desarrollo utiliza el puerto **80**. Si está ocupado o requiere permisos, puedes usar otro:

```sh
npx eleventy --serve --port=8080
```

Para generar la web:

```sh
npm run build
```

El resultado se escribe en `public/`. Esta carpeta se genera automáticamente y está excluida de Git: los cambios se hacen en `src/`.

## Estructura

```text
src/
├── _includes/base.njk          # Estructura común de las páginas
├── index.njk                   # Inicio
├── perfil.njk                  # Perfil y CV
├── proyectos.njk               # Proyectos
├── intereses-profesionales.njk # Tecnología y estudios
├── ocio.njk                    # Aficiones y multimedia
├── css/                        # Estilos
├── js/                         # Comportamiento del sitio
├── img/                        # Fotografías e iconos
├── video/                      # Vídeo
└── docs/                       # CV y documentos
.github/workflows/              # Publicación automática
.eleventy.js                    # Configuración del generador
package.json                    # Dependencias y comandos
package-lock.json               # Versiones de dependencias
```

## Publicación

1. Desarrollar y comprobar los cambios en `main`.
2. Abrir una pull request con **origen `main` y destino `deploy`** cuando se quiera publicar.
3. Fusionar la pull request: el cambio en `deploy` inicia GitHub Actions.
4. Actions instala las dependencias, genera `public/` y publica el resultado en GitHub Pages.

Modificar `main` o abrir la pull request no actualiza la web pública. La publicación ocurre al actualizar `deploy` y completar correctamente el workflow. También se puede iniciar manualmente desde Actions.

## SEO y dominio

El dominio no está fijado en las plantillas. El workflow pasa a Eleventy `SITE_URL` con la URL pública obtenida de la configuración de GitHub Pages. Esto incluye el dominio personalizado o, si no hay uno, la dirección de Pages y la ruta del repositorio.

Al cambiar el dominio en **Settings → Pages**, hay que volver a desplegar para regenerar los enlaces canónicos, el sitemap, las tarjetas sociales y los datos estructurados con la nueva dirección. No es necesario editar cada página.

La configuración de identidad e imagen para compartir está en `src/_data/site.js`. Las descripciones y los títulos se definen en la cabecera de cada plantilla; `seoTitle` permite personalizar el título completo.

El sitio genera:

- `sitemap.xml` con las páginas públicas, excluyendo la página de error.
- `robots.txt` con acceso de rastreo y la dirección del sitemap.
- Enlaces canónicos y metadatos Open Graph y Twitter para compartir enlaces.
- Datos estructurados JSON-LD de persona, sitio, página y migas de pan; el perfil utiliza `ProfilePage`.
- `404.html` con enlaces de recuperación y `noindex`.

En desarrollo local, sin `SITE_URL`, se omiten los metadatos que necesitan un dominio público y el sitemap queda vacío. Para generar una copia con metadatos completos desde PowerShell, define antes de compilar:

```powershell
$env:SITE_URL = 'https://tu-dominio.es'
npm run build
```

Si se publica bajo una subcarpeta, `SITE_URL` debe incluirla y `ELEVENTY_PATH_PREFIX` debe coincidir con ella. En Actions se configuran ambas automáticamente.

### Pasos después de publicar

1. Comprobar que el dominio configurado en Pages es el definitivo, que resuelve correctamente y que **Enforce HTTPS** está activado.
2. Añadir el dominio a Google Search Console y verificarlo mediante el registro TXT de DNS que proporcione Google.
3. Enviar `https://tu-dominio.es/sitemap.xml` en la sección de sitemaps de Search Console.
4. Inspeccionar la portada y el perfil, comprobar la URL canónica y solicitar su indexación.
5. Revisar el perfil con la prueba de resultados enriquecidos de Google.
6. Enlazar la web desde el perfil de GitHub y los perfiles profesionales propios. Añadir sus direcciones reales a `profiles` en `src/_data/site.js` cuando también estén enlazadas en la web.

Si se cambia el dominio, conservar el anterior con redirecciones permanentes siempre que sea posible y actualizar los enlaces externos y Search Console. Las redirecciones y la verificación DNS se gestionan fuera de estas plantillas.

Estas mejoras facilitan el rastreo y la interpretación del contenido; no garantizan posiciones ni resultados enriquecidos. El siguiente paso editorial es ampliar los proyectos con resultados, capturas y enlaces específicos verificables.
