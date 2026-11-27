# elChambeador

![elChambaBanner](./elChambaBanner.png)

[![Tauri](https://img.shields.io/badge/Tauri-v2-24C8DB?logo=tauri&logoColor=white)](https://v2.tauri.app/)
[![Preact](https://img.shields.io/badge/Preact-673AB8?logo=preact&logoColor=white)](https://preactjs.com/)
[![animejs](https://img.shields.io/badge/animejs-FF6B6B?logo=animejs&logoColor=white)](https://animejs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Rust](https://img.shields.io/badge/Rust-000000?logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![Bun](https://img.shields.io/badge/Bun-FBF0DF?logo=bun&logoColor=black)](https://bun.sh/)

Aplicación de escritorio interactiva construida con **Tauri**, **Preact**, **TypeScript**, **Vite**, **animejs** y **Rust** (`src-tauri`). Presenta una escena SVG animada de un gato de escritorio (`CatDeskScene`) que acompaña tu jornada reaccionando en tiempo real a la actividad global del sistema (teclado y ratón), alternando un repertorio completo de conductas autónomas y entrando en modo siesta tras un periodo de inactividad.

## Descarga e instalación

Descarga el instalador correspondiente a tu sistema operativo desde la sección [**Releases**](../../releases) (en **Assets**):

- **Windows**: `.msi` o `-setup.exe`
- **macOS**: `.dmg` (Apple Silicon / Intel)
- **Linux**: `.AppImage` o `.deb`

## Apoyar el proyecto

Si te resulta útil o te gusta el proyecto, puedes invitarme a un café para seguir manteniendo y mejorando **elChambeador**:

[![Apoyar en PayPal](https://img.shields.io/badge/Donar%20con-PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/SergioCampbelldev)

## Características principales

- **Seguimiento global de entrada (`useGlobalInput`)**: escucha eventos globales de teclado y ratón emitidos desde el backend de Tauri (`input-key` e `input-mouse`) para actualizar posición normalizada del cursor, pulsaciones activas, botones de ratón y marcas de actividad.
- **Animación reactiva y ergonomía de escritorio (`CatDeskScene`)**:
  - Seguimiento continuo de mirada y cabeza con el puntero, respiración suave del torso, cinemática de patas articuladas sobre teclado y ratón separado (sin solapamientos), teclas flotantes en el aire y velocidad de cola adaptativa según el ritmo de escritura.
  - Interacción directa con caricias sobre la cabeza del gato (cierre de ojos y corazones animados) y respuesta a teclas especiales (`Escape`, `Enter`, `Backspace`, `Space`).
  - Repertorio autónomo de **7 animaciones de reposo** mediante selección sin repetición (*shuffle bag*): mirar alrededor (`lookAround`), acicalamiento con movimiento sincronizado de cabeza, lengua y pata (`groom`), parpadeo (`blink`), sacudida de orejas (`earTwitch`), estiramiento (`stretch`), ladeado curioso (`curiousTilt`) y latigazo de cola (`tailFlick`).
  - Modo dormido (`SLEEP_TIMEOUT_MS = 60000` ms) con reposo de patas/ratón y despertar inmediato ante nuevo movimiento de ratón o pulsación de teclas.
  - Personalización visual y sonora: 6 pelajes configurables (`siamese`, `white`, `black`, `orange`, `gray`, `calico`), tema de teclado (`dark` / claro), escala ajustable, resaltado de teclas especiales y efectos de sonido mecánicos opcionales (`deskAudio`).
- **Integración de escritorio en Rust (`src-tauri`)**: gestión de ventana transparente, *hitboxes* interactivos y captura global de eventos mediante `rdev` y APIs de Tauri v2.

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
- `src/components/CatDeskScene.tsx`: escena SVG interactiva, cinemática de extremidades, repertorio de 7 animaciones de reposo, caricias y modo dormido.
- `src/utils/deskAudio.ts`: síntesis y reproducción de sonidos mecánicos de teclado y clics de ratón.
- `src-tauri/src/lib.rs`: escucha global de entrada y control de ventana e interacción en Rust.

## Entorno de desarrollo recomendado

- [VS Code](https://code.visualstudio.com/)
- [Tauri VS Code Extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-analyzer.rust-analyzer)