import { useEffect, useState } from "preact/hooks";
import { listen, emit } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { CatDeskScene } from "./components/CatDeskScene";
import { SettingsDrawer } from "./components/SettingsDrawer";
import { useGlobalInput } from "./hooks/useGlobalInput";
import { AppSettings } from "./types/input";

const STORAGE_KEY = "bongo-cat-settings-v1";
const IS_DEV = import.meta.env.DEV;

const DEFAULT_SETTINGS: AppSettings = {
  catCoat: "siamese",
  skin: "dark",
  highlightSpecialKeys: true,
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
    document.documentElement.style.backgroundColor = IS_DEV ? "#09090b" : "transparent";
    document.body.style.backgroundColor = IS_DEV ? "#09090b" : "transparent";
  }, []);

  const updateSettings = (next: AppSettings) => {
    setSettings(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignorar errores de almacenamiento
    }
    emit("settings-updated", next).catch(() => { });
  };

  useEffect(() => {
    const unlistenPromise = listen<Partial<AppSettings>>("tray-update-settings", (event) => {
      setSettings((prev) => {
        const merged = { ...prev, ...event.payload };
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
        lastActivityTs={input.lastActivityTs}
        lastMouseTs={input.lastMouseTs}
        settings={settings}
      />
    </main>
  );
}