# elChambeador

![elChambaBanner](./elChambaBanner.png)

[![Tauri](https://img.shields.io/badge/Tauri-v2-24C8DB?logo=tauri&logoColor=white)](https://v2.tauri.app/)
[![Preact](https://img.shields.io/badge/Preact-673AB8?logo=preact&logoColor=white)](https://preactjs.com/)
[![animejs](https://img.shields.io/badge/animejs-FF6B6B?logo=animejs&logoColor=white)](https://animejs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Rust](https://img.shields.io/badge/Rust-000000?logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![Bun](https://img.shields.io/badge/Bun-FBF0DF?logo=bun&logoColor=black)](https://bun.sh/)

Aplicación de escritorio interactiva construida con **Tauri**, **Preact**, **TypeScript**, **Vite**, **animejs** y **Rust** (`src-tauri`). Presenta una escena SVG animada de un gato de escritorio (`CatDeskScene`) que responde a la actividad global del sistema (teclado y ratón), alterna conductas de reposo y acicalamiento, y pasa a modo dormido tras un periodo de inactividad.

## Apoyar el proyecto

Si te resulta útil o te gusta el proyecto, puedes invitarme a un café para seguir manteniendo y mejorando **elChambeador**:

[![Apoyar en PayPal](https://img.shields.io/badge/Donar%20con-PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/SergioCampbelldev)

## Características principales

- **Seguimiento global de entrada (`useGlobalInput`)**: escucha eventos globales de teclado y ratón emitidos desde el backend de Tauri (`input-key` y `input-mouse`) para actualizar posición normalizada del cursor, pulsaciones activas, botones de ratón y marcas de actividad.
- **Animación reactiva y conductas autónomas (`CatDeskScene`)**:
  - Seguimiento de mirada y cabeza con el puntero, respiración del torso, movimiento de patas sobre el teclado o el ratón, teclas flotantes y variación de velocidad de la cola según el ritmo de escritura.
  - Ciclo autónomo en reposo con alternancia de mirar alrededor (`lookAround`), acicalamiento con movimiento sincronizado de cabeza, lengua y pata (`groom`) y parpadeo (`blink`).
  - Modo dormido (`SLEEP_TIMEOUT_MS = 60000` ms) con congelación de la animación del ratón/patas en reposo y despertar inmediato ante nuevo movimiento de ratón o pulsación de teclas.
  - Paletas de pelaje configurables (`siamese`, `white`, `black`, `orange`, `gray`, `calico`), temas (`dark` / claro) y sombras difusas suaves (`softFurShadow`).
- **Integración de escritorio en Rust (`src-tauri`)**: gestión de ventana y eventos globales mediante `rdev` y APIs de Tauri.

## Stack tecnológico

- **Frontend**: Preact, TypeScript, Vite, `animejs`
- **Escritorio / Backend**: Tauri (v2), Rust (`rdev`)
- **Gestor de paquetes y runtime**: Bun

## Requisitos previos

- [Bun](https://bun.sh/)
- [Rust](https://www.rust-lang.org/) y Cargo
- Dependencias del sistema requeridas por [Tauri](https://v2.tauri.app/start/prerequisites/) para tu plataforma

## Desarrollo

Instala las dependencias y arranca el entorno de desarrollo de Tauri + Vite:

```bash
bun install
bun run tauri dev

```

Para compilar la aplicación de escritorio para producción:

```bash
bun run tauri build

```

## Estructura del proyecto

- `src/hooks/useGlobalInput.tsx`: suscripción a eventos `input-key` e `input-mouse` y normalización de estado de entrada.
- `src/components/CatDeskScene.tsx`: escena SVG interactiva, estados de animación, acicalamiento, modo dormido y sombras suaves.
- `src-tauri/src/lib.rs`: escucha global de entrada y control de ventana/interacción en Rust.

## Entorno de desarrollo recomendado

- [VS Code](https://code.visualstudio.com/)
- [Tauri VS Code Extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
