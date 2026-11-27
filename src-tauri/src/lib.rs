use rdev::{listen, Button, Event, EventType, Key};
use serde::Serialize;
use serde_json::json;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Mutex;
use std::thread;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{
    image::Image,
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem, Submenu},
    tray::TrayIconBuilder,
    AppHandle, Emitter, Manager, WebviewWindow,
};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};
use tauri_plugin_notification::NotificationExt;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct KeyPayload {
    code: String,
    pressed: bool,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct MousePayload {
    kind: String,
    x: f64,
    y: f64,
    screen_w: f64,
    screen_h: f64,
    button: Option<String>,
}

fn map_key(key: Key) -> String {
    match key {
        Key::Return | Key::KpReturn => "Enter".into(),
        Key::Space => "Space".into(),
        Key::Backspace => "Backspace".into(),
        Key::Escape => "Escape".into(),
        Key::Tab => "Tab".into(),
        Key::CapsLock => "CapsLock".into(),
        Key::ShiftLeft => "ShiftLeft".into(),
        Key::ShiftRight => "ShiftRight".into(),
        Key::ControlLeft => "ControlLeft".into(),
        Key::ControlRight => "ControlRight".into(),
        Key::Alt => "AltLeft".into(),
        Key::AltGr => "AltRight".into(),
        Key::MetaLeft => "MetaLeft".into(),
        Key::MetaRight => "MetaRight".into(),
        Key::UpArrow => "ArrowUp".into(),
        Key::DownArrow => "ArrowDown".into(),
        Key::LeftArrow => "ArrowLeft".into(),
        Key::RightArrow => "ArrowRight".into(),
        Key::SemiColon => "SemiColon".into(),
        Key::Quote => "Quote".into(),
        Key::BackSlash => "BackSlash".into(),
        Key::LeftBracket => "LeftBracket".into(),
        Key::RightBracket => "RightBracket".into(),
        Key::Comma => "Comma".into(),
        Key::Dot => "Dot".into(),
        Key::Slash => "Slash".into(),
        Key::Minus => "Minus".into(),
        Key::Equal => "Equal".into(),
        Key::Unknown(192) => "SemiColon".into(),
        Key::Unknown(222) => "Quote".into(),
        Key::Unknown(191) => "BackSlash".into(),
        Key::Unknown(186) => "LeftBracket".into(),
        Key::Unknown(187) => "RightBracket".into(),
        other => format!("{:?}", other),
    }
}

fn map_button(btn: Button) -> String {
    match btn {
        Button::Left => "Left".into(),
        Button::Right => "Right".into(),
        Button::Middle => "Middle".into(),
        _ => "Other".into(),
    }
}

/// Genera un icono RGBA 32x32 nítido con la silueta de la cara del gato y ojos brillantes
fn build_cat_face_icon() -> Image<'static> {
    let size = 32u32;
    let mut rgba = vec![0u8; (size * size * 4) as usize];

    let set_px = |buf: &mut Vec<u8>, x: i32, y: i32, r: u8, g: u8, b: u8, a: u8| {
        if x >= 0 && y >= 0 && x < size as i32 && y < size as i32 {
            let idx = ((y as u32 * size + x as u32) * 4) as usize;
            buf[idx] = r;
            buf[idx + 1] = g;
            buf[idx + 2] = b;
            buf[idx + 3] = a;
        }
    };

    for y in 0..32i32 {
        for x in 0..32i32 {
            let dx = (x - 16) as f32 / 12.5;
            let dy = (y - 19) as f32 / 10.5;
            let in_head = dx * dx + dy * dy <= 1.0;

            let in_left_ear =
                y >= 3 && y <= 14 && x >= 4 + (y - 3) / 5 && x <= 6 + ((y - 3) * 7) / 11;

            let in_right_ear =
                y >= 3 && y <= 14 && x <= 27 - (y - 3) / 5 && x >= 25 - ((y - 3) * 7) / 11;

            if in_head || in_left_ear || in_right_ear {
                set_px(&mut rgba, x, y, 36, 36, 40, 255);
            }

            let in_left_inner = y >= 6 && y <= 12 && x >= 6 && x <= 6 + ((y - 6) * 4) / 6;
            let in_right_inner = y >= 6 && y <= 12 && x <= 25 && x >= 25 - ((y - 6) * 4) / 6;
            if in_left_inner || in_right_inner {
                set_px(&mut rgba, x, y, 243, 184, 190, 255);
            }
        }
    }

    for &(cx, cy) in &[(11i32, 19i32), (21i32, 19i32)] {
        for dy in -3..=3i32 {
            for dx in -3..=3i32 {
                if (dx as f32 / 3.2).powi(2) + (dy as f32 / 2.6).powi(2) <= 1.0 {
                    set_px(&mut rgba, cx + dx, cy + dy, 245, 180, 35, 255);
                }
            }
        }
        for dy in -2..=2i32 {
            set_px(&mut rgba, cx, cy + dy, 15, 15, 18, 255);
        }
    }

    Image::new_owned(rgba, size, size)
}

/// Evalúa si el cursor está exactamente sobre la silueta del gato, teclado o ratón.
fn is_cursor_inside_cat_hitbox(window: &WebviewWindow, x: f64, y: f64) -> bool {
    let (Ok(win_pos), Ok(win_size)) = (window.outer_position(), window.outer_size()) else {
        return false;
    };

    #[cfg(target_os = "macos")]
    let (wx, wy, ww, wh) = {
        let scale = window.scale_factor().unwrap_or(1.0);
        (
            win_pos.x as f64 / scale,
            win_pos.y as f64 / scale,
            win_size.width as f64 / scale,
            win_size.height as f64 / scale,
        )
    };

    #[cfg(not(target_os = "macos"))]
    let (wx, wy, ww, wh) = (
        win_pos.x as f64,
        win_pos.y as f64,
        win_size.width as f64,
        win_size.height as f64,
    );

    if ww <= 1.0 || wh <= 1.0 {
        return false;
    }

    let nx = (x - wx) / ww;
    let ny = (y - wy) / wh;

    if !(0.0..=1.0).contains(&nx) || !(0.0..=1.0).contains(&ny) {
        return false;
    }

    let in_head = (0.31..=0.58).contains(&nx) && (0.13..=0.46).contains(&ny);
    let in_body = (0.33..=0.76).contains(&nx) && (0.42..=0.74).contains(&ny);
    let in_desk = (0.18..=0.80).contains(&nx) && (0.68..=0.92).contains(&ny);

    in_head || in_body || in_desk
}

fn spawn_input_listener(app: AppHandle) {
    thread::spawn(move || {
        let (sw, sh) = rdev::display_size().unwrap_or((1920, 1080));
        let screen_w = sw as f64;
        let screen_h = sh as f64;
        let last_move_ms = AtomicU64::new(0);

        let is_ignoring = AtomicBool::new(true);
        let is_mouse_down = AtomicBool::new(false);
        let last_cursor = Mutex::new((0.0_f64, 0.0_f64));

        let update_click_through = move |app: &AppHandle, x: f64, y: f64, mouse_down: bool| {
            if let Some(window) = app.get_webview_window("main") {
                let in_cat = is_cursor_inside_cat_hitbox(&window, x, y);
                let should_ignore = !in_cat && !mouse_down;

                if is_ignoring.load(Ordering::Relaxed) != should_ignore {
                    is_ignoring.store(should_ignore, Ordering::Relaxed);
                    let win_clone = window.clone();
                    let _ = app.run_on_main_thread(move || {
                        let _ = win_clone.set_ignore_cursor_events(should_ignore);
                    });
                }
            }
        };

        let callback = move |event: Event| match event.event_type {
            EventType::KeyPress(key) => {
                let _ = app.emit(
                    "input-key",
                    KeyPayload {
                        code: map_key(key),
                        pressed: true,
                    },
                );
            }
            EventType::KeyRelease(key) => {
                let _ = app.emit(
                    "input-key",
                    KeyPayload {
                        code: map_key(key),
                        pressed: false,
                    },
                );
            }
            EventType::MouseMove { x, y } => {
                if let Ok(mut pos) = last_cursor.lock() {
                    *pos = (x, y);
                }
                update_click_through(&app, x, y, is_mouse_down.load(Ordering::Relaxed));

                let now = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .map(|d| d.as_millis() as u64)
                    .unwrap_or(0);
                let prev = last_move_ms.load(Ordering::Relaxed);
                if now.saturating_sub(prev) >= 16 {
                    last_move_ms.store(now, Ordering::Relaxed);
                    let _ = app.emit(
                        "input-mouse",
                        MousePayload {
                            kind: "move".into(),
                            x,
                            y,
                            screen_w,
                            screen_h,
                            button: None,
                        },
                    );
                }
            }
            EventType::ButtonPress(btn) => {
                is_mouse_down.store(true, Ordering::Relaxed);
                let (cx, cy) = last_cursor.lock().map(|p| *p).unwrap_or((0.0, 0.0));
                update_click_through(&app, cx, cy, true);

                let _ = app.emit(
                    "input-mouse",
                    MousePayload {
                        kind: "down".into(),
                        x: cx,
                        y: cy,
                        screen_w,
                        screen_h,
                        button: Some(map_button(btn)),
                    },
                );
            }
            EventType::ButtonRelease(btn) => {
                is_mouse_down.store(false, Ordering::Relaxed);
                let (cx, cy) = last_cursor.lock().map(|p| *p).unwrap_or((0.0, 0.0));
                update_click_through(&app, cx, cy, false);

                let _ = app.emit(
                    "input-mouse",
                    MousePayload {
                        kind: "up".into(),
                        x: cx,
                        y: cy,
                        screen_w,
                        screen_h,
                        button: Some(map_button(btn)),
                    },
                );
            }
            _ => {}
        };

        if let Err(err) = listen(callback) {
            eprintln!("Error en rdev::listen: {:?}", err);
        }
    });
}

fn setup_tray_menu(app: &tauri::App) -> tauri::Result<()> {
    let handle = app.handle();

    let coat_siamese = MenuItem::with_id(handle, "coat:siamese", "Siamés", true, None::<&str>)?;
    let coat_white = MenuItem::with_id(handle, "coat:white", "Blanco", true, None::<&str>)?;
    let coat_black = MenuItem::with_id(handle, "coat:black", "Negro", true, None::<&str>)?;
    let coat_orange = MenuItem::with_id(handle, "coat:orange", "Naranja", true, None::<&str>)?;
    let coat_gray = MenuItem::with_id(handle, "coat:gray", "Gris", true, None::<&str>)?;
    let coat_calico = MenuItem::with_id(
        handle,
        "coat:calico",
        "Manchas (Calicó)",
        true,
        None::<&str>,
    )?;
    let coat_submenu = Submenu::with_items(
        handle,
        "Color del gato",
        true,
        &[
            &coat_siamese,
            &coat_white,
            &coat_black,
            &coat_orange,
            &coat_gray,
            &coat_calico,
        ],
    )?;

    let skin_dark = MenuItem::with_id(handle, "skin:dark", "Negro", true, None::<&str>)?;
    let skin_light = MenuItem::with_id(handle, "skin:light", "Blanco", true, None::<&str>)?;
    let skin_submenu =
        Submenu::with_items(handle, "Skin del teclado", true, &[&skin_dark, &skin_light])?;

    let scale_65 = MenuItem::with_id(handle, "scale:65", "65% (Pequeño)", true, None::<&str>)?;
    let scale_80 = MenuItem::with_id(handle, "scale:80", "80%", true, None::<&str>)?;
    let scale_100 = MenuItem::with_id(handle, "scale:100", "100% (Normal)", true, None::<&str>)?;
    let scale_125 = MenuItem::with_id(handle, "scale:125", "125%", true, None::<&str>)?;
    let scale_150 = MenuItem::with_id(handle, "scale:150", "150% (Grande)", true, None::<&str>)?;
    let scale_submenu = Submenu::with_items(
        handle,
        "Tamaño del gato",
        true,
        &[&scale_65, &scale_80, &scale_100, &scale_125, &scale_150],
    )?;

    let amber_item = CheckMenuItem::with_id(
        handle,
        "toggle:amber",
        "Acentos ámbar",
        true,
        true,
        None::<&str>,
    )?;

    let sounds_item = CheckMenuItem::with_id(
        handle,
        "toggle:sounds",
        "Sonidos de teclado y ratón",
        true,
        false,
        None::<&str>,
    )?;

    let autostart_enabled = app.autolaunch().is_enabled().unwrap_or(false);
    let autostart_item = CheckMenuItem::with_id(
        handle,
        "toggle:autostart",
        "Iniciar con el sistema",
        true,
        autostart_enabled,
        None::<&str>,
    )?;

    let quit_item = MenuItem::with_id(handle, "app:quit", "Salir", true, None::<&str>)?;

    let tray_menu = Menu::with_items(
        handle,
        &[
            &coat_submenu,
            &skin_submenu,
            &scale_submenu,
            &amber_item,
            &sounds_item,
            &PredefinedMenuItem::separator(handle)?,
            &autostart_item,
            &PredefinedMenuItem::separator(handle)?,
            &quit_item,
        ],
    )?;

    let amber_clone = amber_item.clone();
    let sounds_clone = sounds_item.clone();
    let autostart_clone = autostart_item.clone();

    TrayIconBuilder::new()
        .icon(build_cat_face_icon())
        .tooltip("ElChambeador")
        .menu(&tray_menu)
        .on_menu_event(move |app, event| {
            let id = event.id().as_ref();
            if let Some(coat) = id.strip_prefix("coat:") {
                let _ = app.emit("tray-update-settings", json!({ "catCoat": coat }));
            } else if let Some(skin) = id.strip_prefix("skin:") {
                let _ = app.emit("tray-update-settings", json!({ "skin": skin }));
            } else if let Some(scale_str) = id.strip_prefix("scale:") {
                if let Ok(pct) = scale_str.parse::<f64>() {
                    let _ = app.emit(
                        "tray-update-settings",
                        json!({ "avatarScale": pct / 100.0 }),
                    );
                }
            } else if id == "toggle:amber" {
                let checked = amber_clone.is_checked().unwrap_or(true);
                let _ = app.emit(
                    "tray-update-settings",
                    json!({ "highlightSpecialKeys": checked }),
                );
            } else if id == "toggle:sounds" {
                let checked = sounds_clone.is_checked().unwrap_or(false);
                let _ = app.emit("tray-update-settings", json!({ "keySounds": checked }));
            } else if id == "toggle:autostart" {
                let manager = app.autolaunch();
                let want_enable = autostart_clone.is_checked().unwrap_or(false);
                let res = if want_enable {
                    manager.enable()
                } else {
                    manager.disable()
                };
                if let Err(err) = res {
                    eprintln!("Error configurando autostart: {:?}", err);
                }
                let actual = manager.is_enabled().unwrap_or(false);
                let _ = autostart_clone.set_checked(actual);
            } else if id == "app:quit" {
                app.exit(0);
            }
        })
        .build(app)?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
            let _ = app
                .notification()
                .builder()
                .title("ElChambeador")
                .body("ElChambeador ya se encuentra en ejecución en tu escritorio.")
                .show();
        }))
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_shadow(false);
                let _ = window.set_icon(build_cat_face_icon());
            }
            setup_tray_menu(app)?;
            spawn_input_listener(app.handle().clone());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}