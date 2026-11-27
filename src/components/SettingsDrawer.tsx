import { AppSettings, CatCoat, KeyboardSkin } from "../types/input";

interface Props {
  open: boolean;
  onClose: () => void;
  settings: AppSettings;
  onChange: (next: AppSettings) => void;
}

const COATS: { id: CatCoat; label: string; swatch: string }[] = [
  { id: "siamese", label: "Siamés", swatch: "radial-gradient(circle at 45% 55%, #261e1a 35%, #dfd6c5 75%)" },
  { id: "white", label: "Blanco", swatch: "#faf9f5" },
  { id: "black", label: "Negro", swatch: "#232326" },
  { id: "orange", label: "Naranja", swatch: "#f6a25e" },
  { id: "gray", label: "Gris", swatch: "#9aa5b4" },
  { id: "calico", label: "Manchas", swatch: "linear-gradient(135deg, #faf9f5 40%, #e38b47 42%, #e38b47 70%, #231f1e 72%)" },
];

export function SettingsDrawer({ open, onClose, settings, onChange }: Props) {
  if (!open) return null;

  const setCoat = (catCoat: CatCoat) => onChange({ ...settings, catCoat });
  const setSkin = (skin: KeyboardSkin) => onChange({ ...settings, skin });
  const setAvatarScale = (avatarScale: number) => onChange({ ...settings, avatarScale });
  const setKeySounds = (keySounds: boolean) => onChange({ ...settings, keySounds });

  const scalePercent = Math.round((settings.avatarScale || 1) * 100);

  return (
    <div
      class="pointer-events-auto fixed top-11 right-3 z-50 max-h-[calc(100vh-3.25rem)] w-64 overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950/95 p-3 text-zinc-100 shadow-2xl backdrop-blur-md"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div class="mb-2 flex items-center justify-between">
        <span class="text-xs font-semibold tracking-wide text-zinc-300">Color del gato</span>
        <button
          type="button"
          onClick={onClose}
          class="rounded-md px-1.5 py-0.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div class="mb-2.5 grid grid-cols-3 gap-1.5">
        {COATS.map((coat) => {
          const active = settings.catCoat === coat.id;
          return (
            <button
              key={coat.id}
              type="button"
              onClick={() => setCoat(coat.id)}
              class={`flex flex-col items-center gap-1 rounded-xl border p-1.5 text-[11px] transition ${active
                ? "border-cyan-400 bg-zinc-900 text-white"
                : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700"
                }`}
            >
              <span
                class="h-3.5 w-3.5 rounded-full border border-zinc-600"
                style={{ background: coat.swatch }}
              />
              <span>{coat.label}</span>
            </button>
          );
        })}
      </div>

      <div class="mb-2.5 flex items-center justify-between">
        <span class="text-xs font-semibold text-zinc-300">Skin del teclado</span>
        <div class="flex rounded-lg border border-zinc-800 bg-zinc-900 p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setSkin("dark")}
            class={`rounded-md px-2 py-0.5 transition ${settings.skin === "dark" ? "bg-zinc-700 font-medium text-white" : "text-zinc-400"
              }`}
          >
            Negro
          </button>
          <button
            type="button"
            onClick={() => setSkin("light")}
            class={`rounded-md px-2 py-0.5 transition ${settings.skin === "light" ? "bg-zinc-200 font-medium text-zinc-900" : "text-zinc-400"
              }`}
          >
            Blanco
          </button>
        </div>
      </div>

      <div class="mb-2">
        <div class="mb-1 flex items-center justify-between text-xs text-zinc-300">
          <span>Tamaño del gato</span>
          <span class="font-mono text-[11px] text-zinc-400">{scalePercent}%</span>
        </div>
        <input
          type="range"
          min="65"
          max="150"
          step="5"
          value={scalePercent}
          onInput={(e) =>
            setAvatarScale(Number((e.target as HTMLInputElement).value) / 100)
          }
          class="w-full cursor-pointer accent-cyan-400"
        />
      </div>

      <label class="flex cursor-pointer items-center justify-between py-1 text-xs text-zinc-300">
        <span>Acentos ámbar</span>
        <input
          type="checkbox"
          checked={settings.highlightSpecialKeys}
          onChange={(e) =>
            onChange({ ...settings, highlightSpecialKeys: (e.target as HTMLInputElement).checked })
          }
          class="h-4 w-4 rounded accent-amber-400"
        />
      </label>

      <label class="flex cursor-pointer items-center justify-between pt-1 text-xs text-zinc-300">
        <span>Sonidos de teclado y ratón</span>
        <input
          type="checkbox"
          checked={Boolean(settings.keySounds)}
          onChange={(e) => setKeySounds((e.target as HTMLInputElement).checked)}
          class="h-4 w-4 rounded accent-cyan-400"
        />
      </label>
    </div>
  );
}