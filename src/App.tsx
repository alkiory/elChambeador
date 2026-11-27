import { useEffect, useState } from "preact/hooks";
import { listen, emit } from "@tauri-apps/api/event";
import { CatDeskScene } from "./components/CatDeskScene";
import { SettingsDrawer } from "./components/SettingsDrawer";
import { useGlobalInput } from "./hooks/useGlobalInput";
import { AppSettings } from "./types/input";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";

const STORAGE_KEY = "bongo-cat-settings-v1";
const IS_DEV = import.meta.env.DEV;

// Ajusta estas medidas base a las que tengas definidas en src-tauri/tauri.conf.json:
const BASE_WINDOW_WIDTH = 380;
const BASE_WINDOW_HEIGHT = 300;

const DEFAULT_SETTINGS: AppSettings = {
  catCoat: "siamese",
  skin: "dark",
  highlightSpecialKeys: true,
  avatarScale: 1,
  keySounds: false,
};

function loadInitialSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // Fallback por defecto
  }
  return DEFAULT_SETTINGS;
}

export function App() {
  const input = useGlobalInput();
  const [settings, setSettings] = useState<AppSettings>(loadInitialSettings);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const scale = Math.min(1.5, Math.max(0.65, settings.avatarScale || 1));
    const width = Math.round(BASE_WINDOW_WIDTH * scale);
    const height = Math.round(BASE_WINDOW_HEIGHT * scale);

    getCurrentWindow()
      .setSize(new LogicalSize(width, height))
      .catch((err) => console.error("Error redimensionando ventana:", err));
  }, [settings.avatarScale]);

  useEffect(() => {
    document.documentElement.style.backgroundColor = IS_DEV ? "#09090b" : "transparent";
    document.body.style.backgroundColor = IS_DEV ? "#09090b" : "transparent";
  }, []);

  const persistSettings = (next: AppSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignorar errores de almacenamiento
    }
    emit("settings-updated", next).catch(() => { });
  };

  const updateSettings = (next: AppSettings) => {
    const clampedScale = Math.min(1.5, Math.max(0.65, Number(next.avatarScale) || 1));
    const normalized: AppSettings = { ...next, avatarScale: clampedScale };
    setSettings(normalized);
    persistSettings(normalized);
  };

  useEffect(() => {
    const unlistenPromise = listen<Partial<AppSettings>>("tray-update-settings", (event) => {
      setSettings((prev) => {
        const merged: AppSettings = {
          ...prev,
          ...event.payload,
          avatarScale: Math.min(
            1.5,
            Math.max(0.65, Number(event.payload.avatarScale ?? prev.avatarScale) || 1)
          ),
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        } catch {
          // Ignorar
        }
        return merged;
      });
    });

    return () => {
      unlistenPromise.then((fn) => fn());
    };
  }, []);

  const handleStartDragging = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target || target.closest("button, input, label")) return;
    if (!target.closest('[data-cat-interactive="true"]')) return;
    getCurrentWindow().startDragging().catch(() => { });
  };

  return (
    <main
      onMouseDown={handleStartDragging}
      class={`pointer-events-none relative flex h-screen w-screen items-center justify-center overflow-hidden select-none ${IS_DEV ? "bg-zinc-950" : "bg-transparent"
        }`}
    >
      {IS_DEV && (
        <>
          <button
            type="button"
            onClick={() => setDrawerOpen((v) => !v)}
            class="pointer-events-auto fixed top-3 right-3 z-40 rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs font-medium text-zinc-200 shadow-lg backdrop-blur hover:border-zinc-700 hover:bg-zinc-800"
          >
            Ajustes
          </button>

          <SettingsDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            settings={settings}
            onChange={updateSettings}
          />
        </>
      )}

      <CatDeskScene
        normMouse={input.normMouse}
        lastKeyCode={input.lastKeyCode}
        keyTick={input.keyTick}
        isTyping={input.isTyping}
        activeMouseBtn={input.activeMouseBtn}
        mouseClickTick={input.mouseClickTick}
        lastActivityTs={input.lastActivityTs}
        lastMouseTs={input.lastMouseTs}
        settings={settings}
      />
    </main>
  );
}