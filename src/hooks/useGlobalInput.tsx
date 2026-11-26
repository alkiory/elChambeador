import { useEffect, useRef, useState } from "preact/hooks";
import { listen } from "@tauri-apps/api/event";

export interface GlobalInputState {
  normMouse: { x: number; y: number };
  lastKeyCode: string | null;
  keyTick: number;
  isTyping: boolean;
  activeMouseBtn: string | null;
  lastActivityTs: number;
  lastMouseTs: number;
}

interface KeyPayload {
  code: string;
  pressed: boolean;
}

interface MousePayload {
  kind: "move" | "down" | "up";
  x: number;
  y: number;
  screenW: number;
  screenH: number;
  button: string | null;
}

export function useGlobalInput(): GlobalInputState {
  const [normMouse, setNormMouse] = useState({ x: 0.5, y: 0.5 });
  const [lastKeyCode, setLastKeyCode] = useState<string | null>(null);
  const [keyTick, setKeyTick] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [activeMouseBtn, setActiveMouseBtn] = useState<string | null>(null);
  const [lastActivityTs, setLastActivityTs] = useState(() => Date.now());
  const [lastMouseTs, setLastMouseTs] = useState(() => Date.now());

  const typingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const triggerTyping = (code: string) => {
      const now = Date.now();
      setLastKeyCode(code);
      setKeyTick((t) => t + 1);
      setIsTyping(true);
      setLastActivityTs(now);

      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = window.setTimeout(() => {
        setIsTyping(false);
      }, 280);
    };

    const unlisteners: (() => void)[] = [];

    listen<KeyPayload>("input-key", (event) => {
      if (event.payload.pressed) {
        triggerTyping(event.payload.code);
      }
    }).then((fn) => unlisteners.push(fn));

    listen<MousePayload>("input-mouse", (event) => {
      const { kind, x, y, screenW, screenH, button } = event.payload;
      const now = Date.now();

      if (kind === "move") {
        const nx = Math.min(1, Math.max(0, x / (screenW || window.screen.width || 1920)));
        const ny = Math.min(1, Math.max(0, y / (screenH || window.screen.height || 1080)));
        setNormMouse({ x: nx, y: ny });
        setLastMouseTs(now);
        setLastActivityTs(now);
      } else if (kind === "down") {
        setLastMouseTs(now);
        setLastActivityTs(now);
        setActiveMouseBtn(button);
      } else if (kind === "up") {
        setActiveMouseBtn(null);
        setLastMouseTs(now);
        setLastActivityTs(now);
      }

      setLastMouseTs(now);
      setLastActivityTs(now);
    }).then((fn) => unlisteners.push(fn));

    return () => {
      unlisteners.forEach((fn) => fn());
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    };
  }, []);

  return {
    normMouse,
    lastKeyCode,
    keyTick,
    isTyping,
    activeMouseBtn,
    lastActivityTs,
    lastMouseTs,
  };
}