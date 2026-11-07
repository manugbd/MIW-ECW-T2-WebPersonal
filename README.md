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