# Lozano's Blog

Blog personal construido con [Hugo](https://gohugo.io/) y el tema [PaperMod](https://github.com/adityatelange/hugo-PaperMod), publicado en GitHub Pages.

Migrado desde Gatsby 2 + `gatsby-theme-chronoblog` (ver historial de git para la versión anterior).

## Estructura de contenido

- `content/posts/` — artículos y tutoriales.
- `content/notes/` — notas cortas, videos, embeds.
- `content/links/` — tarjetas de enlace (el título lleva directo a la URL externa en `link:`).
- `content/archives.md`, `content/search.md` — páginas especiales del tema.

Cada post puede ser un "page bundle" (una carpeta con `index.md` + imágenes junto a él), igual que antes.

Frontmatter típico de un post:

```md
---
title: "Título del post"
date: 2024-08-23
tags: ["desarrollo", "RabbitMQ"]
cover:
  image: "cover.jpg" # relativo a la carpeta del post
  alt: "Descripción"
  relative: true
---
```

Frontmatter típico de un link:

```md
---
title: "Nombre del enlace"
link: https://example.com
date: 2024-03-02
---
```

## Desarrollo local

Requiere [Hugo Extended](https://gohugo.io/installation/) (ver versión exacta en `.github/workflows/hugo.yml`).

```sh
git clone --recurse-submodules git@github.com:Lozan0/lozan0.github.io.git
cd lozan0.github.io
hugo server
```

Sitio disponible en `http://localhost:1313`.

Si ya clonaste sin `--recurse-submodules`, trae el tema con:

```sh
git submodule update --init --recursive
```

## Build

```sh
hugo --gc --minify
```

Genera el sitio estático en `public/`.

## Despliegue

El despliegue es automático vía GitHub Actions (`.github/workflows/hugo.yml`): cada push a `master` compila el sitio con Hugo y lo publica en GitHub Pages.

Para que quede activo, en el repositorio de GitHub: **Settings → Pages → Build and deployment → Source: "GitHub Actions"**.

## Tema

[PaperMod](https://github.com/adityatelange/hugo-PaperMod) como submódulo git en `themes/PaperMod`. La paleta oscura y la tipografía monospace (Source Code Pro, auto-hospedada en `static/fonts/`) se personalizan en `assets/css/extended/custom.css` para mantener el estilo del theme anterior.
