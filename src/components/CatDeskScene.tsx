import { useEffect, useRef, useState } from "preact/hooks";
import { animate } from "animejs";
import { AppSettings, CatCoat } from "../types/input";

interface Props {
  normMouse: { x: number; y: number };
  lastKeyCode: string | null;
  keyTick: number;
  isTyping: boolean;
  activeMouseBtn: string | null;
  lastActivityTs: number;
  lastMouseTs: number;
  settings: AppSettings;
}

type IdleState = "active" | "lookAround" | "groom" | "blink";

interface CoatPalette {
  body: string;
  shade: string;
  point: string;
  pawTip: string;
  earLeft: string;
  earRight: string;
  earInner: string;
  eyeIris: string;
  whisker: string;
  hindOutline: string;
  spot?: string;
  stripe?: string;
}

interface FloatingKeyItem {
  id: number;
  label: string;
  x: number;
  y: number;
}

const COAT_PALETTES: Record<CatCoat, CoatPalette> = {
  siamese: {
    body: "#dfd6c5",
    shade: "#9c8f7b",
    point: "#261e1a",
    pawTip: "#261e1a",
    earLeft: "#261e1a",
    earRight: "#261e1a",
    earInner: "#57463f",
    eyeIris: "#6aa9e6",
    whisker: "#d6cfc2",
    hindOutline: "#1c1613",
  },
  white: {
    body: "#faf9f5",
    shade: "#9ca3af",
    point: "#faf9f5",
    pawTip: "#faf9f5",
    earLeft: "#faf9f5",
    earRight: "#faf9f5",
    earInner: "#f3b8be",
    eyeIris: "#5b9bd5",
    whisker: "#a8a29e",
    hindOutline: "#9ca3af",
  },
  black: {
    body: "#232326",
    shade: "#3f3f46",
    point: "#18181b",
    pawTip: "#18181b",
    earLeft: "#232326",
    earRight: "#232326",
    earInner: "#52525b",
    eyeIris: "#eab308",
    whisker: "#71717a",
    hindOutline: "#09090b",
  },
  orange: {
    body: "#f6a25e",
    shade: "#b45309",
    point: "#d97724",
    pawTip: "#f6a25e",
    earLeft: "#f6a25e",
    earRight: "#f6a25e",
    earInner: "#fed7aa",
    eyeIris: "#34d399",
    whisker: "#fff7ed",
    hindOutline: "#9a3412",
    stripe: "#d47328",
  },
  gray: {
    body: "#9aa5b4",
    shade: "#475569",
    point: "#526071",
    pawTip: "#64748b",
    earLeft: "#9aa5b4",
    earRight: "#9aa5b4",
    earInner: "#f3b8be",
    eyeIris: "#f59e0b",
    whisker: "#e2e8f0",
    hindOutline: "#475569",
    stripe: "#64748b",
  },
  calico: {
    body: "#faf9f5",
    shade: "#9ca3af",
    point: "#231f1e",
    pawTip: "#faf9f5",
    earLeft: "#faf9f5",
    earRight: "#231f1e",
    earInner: "#f3b8be",
    eyeIris: "#c88a1e",
    whisker: "#9ca3af",
    hindOutline: "#9ca3af",
    spot: "#e38b47",
  },
};

const KEY_LABELS: Record<string, string> = {
  Escape: "ESC", Backspace: "⌫", Tab: "TAB", CapsLock: "⇪",
  ShiftLeft: "⇧", ShiftRight: "⇧", ControlLeft: "CTRL", ControlRight: "CTRL",
  MetaLeft: "WIN", AltLeft: "ALT", AltRight: "ALTGR", Space: "␣",
  Enter: "↵", ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→",
  BackQuote: "º", Minus: "'", Equal: "¡", LeftBracket: "`", RightBracket: "+",
  SemiColon: "Ñ", Quote: "´", BackSlash: "Ç", IntlBackslash: "< >",
  Comma: ",", Dot: ".", Slash: "-", PrintScreen: "PRT", Delete: "DEL",
};

function formatKeyCap(code: string): string {
  if (KEY_LABELS[code]) return KEY_LABELS[code];
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Num")) return code.slice(3);
  return code.toUpperCase();
}

function getKeyStrikeTarget(code: string | null): { paw: "left" | "right"; x: number; y: number } {
  if (!code) return { paw: "right", x: 30, y: 98 };

  if (/^(ControlLeft|MetaLeft|AltLeft)$/.test(code)) {
    const map: Record<string, number> = { ControlLeft: -80, MetaLeft: -62, AltLeft: -42 };
    return { paw: "left", x: map[code], y: 98 };
  }
  if (code === "Space") return { paw: "right", x: 10, y: 98 };
  if (/^(AltRight|ControlRight|ArrowLeft|ArrowDown|ArrowUp|ArrowRight)$/.test(code)) {
    return { paw: "right", x: code === "AltRight" ? 72 : 88, y: 98 };
  }

  const row2Left: Record<string, number> = {
    ShiftLeft: -78, IntlBackslash: -60, KeyZ: -44, KeyX: -27, KeyC: -10,
  };
  if (row2Left[code] !== undefined) return { paw: "left", x: row2Left[code], y: 109 };

  const row2Right: Record<string, number> = {
    KeyV: 6, KeyB: 23, KeyN: 40, KeyM: 57, Comma: 74, Dot: 74, Slash: 74, ShiftRight: 88,
  };
  if (row2Right[code] !== undefined) return { paw: "right", x: row2Right[code], y: 109 };

  const row3Left: Record<string, number> = {
    CapsLock: -78, KeyA: -60, KeyS: -44, KeyD: -27, KeyF: -10,
  };
  if (row3Left[code] !== undefined) return { paw: "left", x: row3Left[code], y: 120 };

  const row3Right: Record<string, number> = {
    KeyG: 6, KeyH: 23, KeyJ: 40, KeyK: 57, KeyL: 74, SemiColon: 74, Quote: 74, BackSlash: 74, Enter: 88,
  };
  if (row3Right[code] !== undefined) return { paw: "right", x: row3Right[code], y: 120 };

  const row4Left: Record<string, number> = {
    Escape: -80, BackQuote: -80, Tab: -78, F1: -62, Num1: -62, F2: -45, Num2: -45,
    KeyQ: -62, KeyW: -45,
    F3: -28, Num3: -28, KeyE: -28,
    F4: -11, Num4: -11, KeyR: -11,
  };
  if (row4Left[code] !== undefined) return { paw: "left", x: row4Left[code], y: 127 };

  const row4Right: Record<string, number> = {
    F5: 8, Num5: 8, KeyT: 8,
    F6: 25, Num6: 25, KeyY: 25,
    F7: 42, Num7: 42, KeyU: 42,
    F8: 59, Num8: 59, KeyI: 59,
    F9: 75, Num9: 75, KeyO: 75,
    F10: 88, Num0: 88, KeyP: 88, Minus: 88, Equal: 88, Backspace: 88, Delete: 88, PrintScreen: 88,
  };
  if (row4Right[code] !== undefined) return { paw: "right", x: row4Right[code], y: 127 };

  return { paw: "right", x: 42, y: 127 };
}

function buildArticulatedLimb(
  shoulder: { x: number; y: number },
  paw: { x: number; y: number },
  elbowBendX: number,
  elbowLiftY: number
): {
  armPath: string;
  innerEdge: string;
  outerEdge: string;
  elbowCrease: string;
} {
  const midX = (shoulder.x + paw.x) * 0.5 + elbowBendX;
  const midY = (shoulder.y + paw.y) * 0.5 + elbowLiftY;

  const armPath = `M ${shoulder.x.toFixed(1)} ${shoulder.y.toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${paw.x.toFixed(1)} ${paw.y.toFixed(1)}`;

  const dx = paw.x - shoulder.x;
  const dy = paw.y - shoulder.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const halfWidth = 8.4;

  const iStartX = shoulder.x + dx * 0.14 + nx * (halfWidth * 0.75);
  const iStartY = shoulder.y + dy * 0.14 + ny * (halfWidth * 0.75);
  const iMidX = midX + nx * halfWidth;
  const iMidY = midY + ny * halfWidth;
  const iEndX = paw.x - dx * 0.12 + nx * (halfWidth * 0.8);
  const iEndY = paw.y - dy * 0.12 + ny * (halfWidth * 0.8);
  const innerEdge = `M ${iStartX.toFixed(1)} ${iStartY.toFixed(1)} Q ${iMidX.toFixed(1)} ${iMidY.toFixed(1)} ${iEndX.toFixed(1)} ${iEndY.toFixed(1)}`;

  const oStartX = shoulder.x + dx * 0.22 - nx * (halfWidth * 0.75);
  const oStartY = shoulder.y + dy * 0.22 - ny * (halfWidth * 0.75);
  const oMidX = midX - nx * halfWidth;
  const oMidY = midY - ny * halfWidth;
  const oEndX = paw.x - dx * 0.16 - nx * (halfWidth * 0.8);
  const oEndY = paw.y - dy * 0.16 - ny * (halfWidth * 0.8);
  const outerEdge = `M ${oStartX.toFixed(1)} ${oStartY.toFixed(1)} Q ${oMidX.toFixed(1)} ${oMidY.toFixed(1)} ${oEndX.toFixed(1)} ${oEndY.toFixed(1)}`;

  const c1x = midX - nx * 4.5 + (dx / len) * 2;
  const c1y = midY - ny * 4.5 + (dy / len) * 2;
  const c2x = midX + nx * 4.5 - (dx / len) * 2;
  const c2y = midY + ny * 4.5 - (dy / len) * 2;
  const elbowCrease = `M ${c1x.toFixed(1)} ${c1y.toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)}`;

  return { armPath, innerEdge, outerEdge, elbowCrease };
}

const SPECIAL_REACT_KEYS = new Set(["Escape", "Enter", "Backspace", "Space"]);
const SLEEP_TIMEOUT_MS = 60_000;
const MOUSE_RELEASE_MS = 1_500;

export function CatDeskScene({
  normMouse,
  lastKeyCode,
  keyTick,
  isTyping,
  activeMouseBtn,
  lastActivityTs,
  lastMouseTs,
  settings,
}: Props) {
  const c = COAT_PALETTES[settings.catCoat];
  const isDarkKb = settings.skin === "dark";

  const upperBodyPivotRef = useRef<SVGGElement | null>(null);
  const torsoRef = useRef<SVGGElement | null>(null);
  const headRef = useRef<SVGGElement | null>(null);
  const faceRef = useRef<SVGGElement | null>(null);
  const leftEarRef = useRef<SVGGElement | null>(null);
  const rightEarRef = useRef<SVGGElement | null>(null);
  const tailRef = useRef<SVGPathElement | null>(null);
  const mouseDeviceRef = useRef<SVGGElement | null>(null);

  const [leftPawPos, setLeftPawPos] = useState<{ x: number; y: number }>({ x: -44, y: 92 });
  const [rightPawPos, setRightPawPos] = useState<{ x: number; y: number }>({ x: 28, y: 92 });
  const [gazeOffset, setGazeOffset] = useState({
    headRot: 0,
    headX: 0,
    headY: 0,
    irisX: 0,
    irisY: 0,
    leftPupilX: 0,
    rightPupilX: 0,
    pupilY: 0,
    pupilScale: 1,
  });

  const [idleState, setIdleState] = useState<IdleState>("active");
  const [groomPhase, setGroomPhase] = useState<"none" | "bow" | "lick" | "return">("none");
  const [tongueOut, setTongueOut] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const [isMouseActive, setIsMouseActive] = useState(false);
  const [isHeadHovered, setIsHeadHovered] = useState(false);
  const [isPetting, setIsPetting] = useState(false);
  const [tailSpeedLevel, setTailSpeedLevel] = useState<"idle" | "normal" | "fast">("idle");
  const [floatingKeys, setFloatingKeys] = useState<FloatingKeyItem[]>([]);

  const leftPawAnimObj = useRef({ x: -44, y: 92 });
  const rightPawAnimObj = useRef({ x: 28, y: 92 });
  const gazeAnimObj = useRef({
    headRot: 0,
    headX: 0,
    headY: 0,
    irisX: 0,
    irisY: 0,
    leftPupilX: 0,
    rightPupilX: 0,
    pupilY: 0,
    pupilScale: 1,
  });

  const lastPetX = useRef<number | null>(null);
  const petAccum = useRef(0);
  const petTimeout = useRef<number | null>(null);
  const keyTimestampsRef = useRef<number[]>([]);
  const earIndexRef = useRef(0);
  const idleCycleRef = useRef(0);
  const hasMovedMouseOnce = useRef(false);
  const groomTimersRef = useRef<number[]>([]);
  const isInitialMountRef = useRef(true);

  const clearGroomTimers = () => {
    groomTimersRef.current.forEach((id) => window.clearTimeout(id));
    groomTimersRef.current = [];
  };

  // Si el usuario escribe o mueve el ratón en mitad del acicalamiento, cancela limpio
  useEffect(() => {
    if ((isTyping || activeMouseBtn !== null) && idleState === "groom") {
      clearGroomTimers();
      setTongueOut(false);
      setGroomPhase("none");
      setIdleState("active");
    }
  }, [isTyping, activeMouseBtn, idleState]);

  // 0. Respiración suave del torso
  useEffect(() => {
    if (!torsoRef.current) return;
    const breathAnim = animate(torsoRef.current, {
      scaleX: [1, 1.022, 1],
      scaleY: [1, 1.014, 1],
      duration: isSleeping ? 4000 : 3000,
      loop: true,
      ease: "inOutSine",
    });
    return () => {
      breathAnim.pause();
    };
  }, [isSleeping]);

  // Activa agarre del ratón al moverlo o hacer clic, y lo suelta tras 1.5s sin movimiento
  useEffect(() => {
    if (!hasMovedMouseOnce.current) {
      hasMovedMouseOnce.current = true;
      return;
    }
    setIsMouseActive(true);
    const releaseTimer = window.setTimeout(() => {
      setIsMouseActive(false);
    }, MOUSE_RELEASE_MS);

    return () => window.clearTimeout(releaseTimer);
  }, [lastMouseTs, activeMouseBtn]);

  // Despertar inmediatamente al detectar movimiento/clic de ratón o pulsación de tecla tras montar
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    setIsSleeping(false);
    window.setTimeout(() => {
      setIdleState("active");
    }, 0);
  }, [lastMouseTs, keyTick]);

  // Dormir tras 60s sin actividad de ratón ni teclado
  useEffect(() => {
    const sleepTimer = window.setTimeout(() => {
      clearGroomTimers();
      setTongueOut(false);
      setGroomPhase("none");
      setIsSleeping(true);
      setIdleState("active");
    }, SLEEP_TIMEOUT_MS);

    return () => window.clearTimeout(sleepTimer);
  }, [lastActivityTs]);

  // 1. Inclinación postural natural del dorso sobre la cadera
  useEffect(() => {
    if (!upperBodyPivotRef.current) return;

    const strike = getKeyStrikeTarget(lastKeyCode);
    const holdingMouse = isMouseActive || activeMouseBtn !== null;
    let bodyTilt = 0;

    if (!isSleeping) {
      if (idleState === "groom" && groomPhase !== "return") {
        bodyTilt = -2.5;
      } else if (holdingMouse && isTyping) {
        bodyTilt = strike.paw === "left" ? -4.5 : -3.5;
      } else if (holdingMouse) {
        bodyTilt = -6.5;
      } else if (isTyping) {
        bodyTilt = strike.paw === "left" ? -3 : 2.5;
      }
    }

    animate(upperBodyPivotRef.current, {
      rotate: bodyTilt,
      duration: 280,
      ease: "outQuad",
    });
  }, [isMouseActive, activeMouseBtn, isTyping, lastKeyCode, isSleeping, idleState, groomPhase]);

  // Cola de teclas flotantes en el aire
  useEffect(() => {
    if (!lastKeyCode || keyTick === 0) return;
    const strike = getKeyStrikeTarget(lastKeyCode);
    const item: FloatingKeyItem = {
      id: keyTick,
      label: formatKeyCap(lastKeyCode),
      x: strike.x + (strike.paw === "right" ? 16 : -16),
      y: strike.y - 34,
    };

    setFloatingKeys((prev) => [...prev.slice(-2), item]);

    const timer = window.setTimeout(() => {
      setFloatingKeys((prev) => prev.filter((k) => k.id !== item.id));
    }, 680);

    return () => window.clearTimeout(timer);
  }, [keyTick, lastKeyCode]);

  // 2. Seguimiento continuo del puntero y postura de cabeza al acicalarse
  useEffect(() => {
    if (isSleeping) {
      animate(gazeAnimObj.current, {
        headRot: -6,
        headX: 0,
        headY: 9,
        irisX: 0,
        irisY: 0,
        leftPupilX: 0,
        rightPupilX: 0,
        pupilY: 0,
        pupilScale: 1,
        duration: 850,
        ease: "inOutQuad",
        onUpdate: () => setGazeOffset({ ...gazeAnimObj.current }),
      });
      return;
    }

    if (idleState === "groom") {
      if (groomPhase === "bow") {
        animate(gazeAnimObj.current, {
          headRot: -11,
          headX: -4,
          headY: 13,
          irisX: 0,
          irisY: 0,
          leftPupilX: 0,
          rightPupilX: 0,
          pupilY: 0,
          pupilScale: 1,
          duration: 360,
          ease: "outQuad",
          onUpdate: () => setGazeOffset({ ...gazeAnimObj.current }),
        });
      } else if (groomPhase === "lick") {
        animate(gazeAnimObj.current, {
          headRot: [-11, -13.5, -10.5, -13.5, -11],
          headX: -4,
          headY: [13, 15, 12.5, 15, 13],
          irisX: 0,
          irisY: 0,
          leftPupilX: 0,
          rightPupilX: 0,
          pupilY: 0,
          pupilScale: 1,
          duration: 1150,
          ease: "inOutSine",
          onUpdate: () => setGazeOffset({ ...gazeAnimObj.current }),
        });
      } else if (groomPhase === "return") {
        animate(gazeAnimObj.current, {
          headRot: 0,
          headX: 0,
          headY: 0,
          irisX: 0,
          irisY: 0,
          leftPupilX: 0,
          rightPupilX: 0,
          pupilY: 0,
          pupilScale: 1,
          duration: 380,
          ease: "outBack(1.2)",
          onUpdate: () => setGazeOffset({ ...gazeAnimObj.current }),
        });
      }
      return;
    }

    if (idleState === "lookAround") return;

    const dx = normMouse.x - 0.5;
    const dy = normMouse.y - 0.5;
    const radialDist = Math.min(1, Math.hypot(dx, dy) / 0.7071);
    const nearFactor = 1 - radialDist;

    const convergence = nearFactor * 1.45;
    const basePupilX = dx * 8.5;

    animate(gazeAnimObj.current, {
      headRot: dx * 15,
      headX: dx * 9,
      headY: dy * 6 + nearFactor * 2.2 - radialDist * 1.8,
      irisX: dx * 3.2,
      irisY: dy * 2.4,
      leftPupilX: basePupilX + convergence,
      rightPupilX: basePupilX - convergence,
      pupilY: dy * 5.2,
      pupilScale: 0.9 + nearFactor * 0.2,
      duration: 150,
      ease: "outQuad",
      onUpdate: () => setGazeOffset({ ...gazeAnimObj.current }),
    });
  }, [normMouse.x, normMouse.y, idleState, groomPhase, isSleeping]);

  // 3. Cinemática de patas y ratón
  useEffect(() => {
    if (isSleeping) {
      if (mouseDeviceRef.current) {
        animate(mouseDeviceRef.current, {
          translateX: 0,
          translateY: 0,
          duration: 180,
          ease: "outQuad",
        });
      }
      animate(leftPawAnimObj.current, {
        x: -44,
        y: 92,
        duration: 220,
        ease: "outQuad",
        onUpdate: () => {
          setLeftPawPos({ x: leftPawAnimObj.current.x, y: leftPawAnimObj.current.y });
        },
      });
      animate(rightPawAnimObj.current, {
        x: 28,
        y: 92,
        duration: 220,
        ease: "outQuad",
        onUpdate: () => {
          setRightPawPos({ x: rightPawAnimObj.current.x, y: rightPawAnimObj.current.y });
        },
      });
      return;
    }

    const holdingMouse = isMouseActive || activeMouseBtn !== null;
    const mx = (normMouse.x - 0.5) * 12;
    const my = (normMouse.y - 0.5) * 8 + (activeMouseBtn ? 2.5 : 0);

    if (mouseDeviceRef.current) {
      animate(mouseDeviceRef.current, {
        translateX: holdingMouse ? mx : 0,
        translateY: holdingMouse ? my : 0,
        duration: 150,
        ease: "outQuad",
      });
    }

    if (idleState === "groom") return;

    const strike = getKeyStrikeTarget(lastKeyCode);

    let leftTargetX = -44;
    let leftTargetY = 92;

    if (holdingMouse) {
      leftTargetX = -109 + mx;
      leftTargetY = 93 + my;
    } else if (isTyping && strike.paw === "left") {
      leftTargetX = strike.x;
      leftTargetY = strike.y;
    } else if (isTyping && strike.paw === "right") {
      leftTargetX = -28;
      leftTargetY = 44;
    }

    let rightTargetX = 28;
    let rightTargetY = 92;

    if (isTyping) {
      if (holdingMouse) {
        rightTargetX = strike.x;
        rightTargetY = strike.y;
      } else if (strike.paw === "right") {
        rightTargetX = strike.x;
        rightTargetY = strike.y;
      } else {
        rightTargetX = 14;
        rightTargetY = 44;
      }
    }

    animate(leftPawAnimObj.current, {
      x: leftTargetX,
      y: leftTargetY,
      duration: isTyping && !holdingMouse ? 105 : 190,
      ease: isTyping && !holdingMouse ? "outBack(1.35)" : "outQuad",
      onUpdate: () => {
        setLeftPawPos({ x: leftPawAnimObj.current.x, y: leftPawAnimObj.current.y });
      },
    });

    animate(rightPawAnimObj.current, {
      x: rightTargetX,
      y: rightTargetY,
      duration: isTyping ? 105 : 190,
      ease: isTyping ? "outBack(1.35)" : "outQuad",
      onUpdate: () => {
        setRightPawPos({ x: rightPawAnimObj.current.x, y: rightPawAnimObj.current.y });
      },
    });
  }, [normMouse.x, normMouse.y, activeMouseBtn, isTyping, isMouseActive, lastKeyCode, keyTick, idleState, isSleeping]);

  // 4. Orejas cada 15s
  useEffect(() => {
    if (isSleeping) return;
    const interval = window.setInterval(() => {
      const variant = earIndexRef.current % 4;
      earIndexRef.current += 1;
      const lEar = leftEarRef.current;
      const rEar = rightEarRef.current;
      if (!lEar || !rEar) return;

      if (variant === 0) {
        animate(lEar, { rotate: [0, -15, 4, -11, 0], duration: 540, ease: "inOutSine" });
      } else if (variant === 1) {
        animate(lEar, { rotate: [0, -13, -13, 0], duration: 1050, ease: "inOutQuad" });
        animate(rEar, { rotate: [0, 8, 8, 0], duration: 1050, ease: "inOutQuad" });
      } else if (variant === 2) {
        animate(rEar, { rotate: [0, 14, -9, 0], duration: 950, ease: "inOutSine" });
      } else {
        animate([lEar, rEar], { scaleY: [1, 0.84, 1], duration: 880, ease: "inOutQuad" });
      }
    }, 15000);

    return () => window.clearInterval(interval);
  }, [isSleeping]);

  // 5. Velocidad de cola acorde al ritmo de escritura vs. estado idle
  useEffect(() => {
    if (!isTyping) return;
    const now = Date.now();
    const recent = keyTimestampsRef.current.filter((ts) => now - ts < 1200);
    recent.push(now);
    keyTimestampsRef.current = recent;

    if (recent.length >= 4) {
      setTailSpeedLevel("fast");
    } else {
      setTailSpeedLevel("normal");
    }
  }, [keyTick, isTyping]);

  useEffect(() => {
    const checkTailDecay = window.setInterval(() => {
      const now = Date.now();
      const recentCount = keyTimestampsRef.current.filter((ts) => now - ts < 1200).length;
      if (recentCount >= 4) {
        setTailSpeedLevel("fast");
      } else if (recentCount >= 1 || isTyping || isMouseActive) {
        setTailSpeedLevel("normal");
      } else {
        setTailSpeedLevel("idle");
      }
    }, 450);

    return () => window.clearInterval(checkTailDecay);
  }, [isTyping, isMouseActive]);

  useEffect(() => {
    if (!tailRef.current) return;

    const config = isSleeping
      ? { rotate: [-0.8, 1.4, -0.8], duration: 6200 }
      : tailSpeedLevel === "fast"
        ? { rotate: [-9, 17, -9], duration: 330 }
        : tailSpeedLevel === "normal"
          ? { rotate: [-4, 10, -4], duration: 1650 }
          : { rotate: [-2.2, 5.5, -2.2], duration: 4800 };

    const anim = animate(tailRef.current, {
      rotate: config.rotate,
      duration: config.duration,
      loop: true,
      ease: "inOutSine",
    });

    return () => {
      anim.pause();
    };
  }, [tailSpeedLevel, isSleeping]);

  // 6. Conductas autónomas en reposo breve (secuencia completa para acicalamiento)
  useEffect(() => {
    if (isSleeping) return;
    const checkIdle = window.setInterval(() => {
      const elapsed = Date.now() - lastActivityTs;
      if (elapsed < 4000 || elapsed >= SLEEP_TIMEOUT_MS || idleState !== "active") {
        return;
      }

      const actions: IdleState[] = ["lookAround", "groom", "blink"];
      const chosen = actions[idleCycleRef.current % actions.length];
      idleCycleRef.current += 1;
      setIdleState(chosen);

      if (chosen === "lookAround") {
        animate(gazeAnimObj.current, {
          headRot: [-10, 10, 0],
          leftPupilX: [-5, 5, 0],
          rightPupilX: [-5, 5, 0],
          duration: 2200,
          ease: "inOutSine",
          onUpdate: () => setGazeOffset({ ...gazeAnimObj.current }),
        });
        window.setTimeout(() => setIdleState("active"), 2300);
        return;
      }

      if (chosen === "blink") {
        window.setTimeout(() => setIdleState("active"), 550);
        return;
      }

      if (chosen === "groom") {
        clearGroomTimers();
        setGroomPhase("bow");

        const t1 = window.setTimeout(() => {
          animate(rightPawAnimObj.current, {
            x: -12,
            y: -13,
            duration: 360,
            ease: "outQuad",
            onUpdate: () => {
              setRightPawPos({ x: rightPawAnimObj.current.x, y: rightPawAnimObj.current.y });
            },
          });
        }, 220);

        const t2 = window.setTimeout(() => {
          setGroomPhase("lick");
          setTongueOut(true);
          animate(rightPawAnimObj.current, {
            y: [-13, -17, -12, -17, -13],
            duration: 1150,
            ease: "inOutSine",
            onUpdate: () => {
              setRightPawPos({ x: rightPawAnimObj.current.x, y: rightPawAnimObj.current.y });
            },
          });
        }, 580);

        const t3 = window.setTimeout(() => setTongueOut(false), 880);
        const t4 = window.setTimeout(() => setTongueOut(true), 1040);
        const t5 = window.setTimeout(() => setTongueOut(false), 1340);
        const t6 = window.setTimeout(() => setTongueOut(true), 1480);

        const t7 = window.setTimeout(() => {
          setTongueOut(false);
          animate(rightPawAnimObj.current, {
            x: 28,
            y: 92,
            duration: 420,
            ease: "outQuad",
            onUpdate: () => {
              setRightPawPos({ x: rightPawAnimObj.current.x, y: rightPawAnimObj.current.y });
            },
          });
        }, 1760);

        const t8 = window.setTimeout(() => {
          setGroomPhase("return");
        }, 2160);

        const t9 = window.setTimeout(() => {
          setGroomPhase("none");
          setIdleState("active");
        }, 2580);

        groomTimersRef.current = [t1, t2, t3, t4, t5, t6, t7, t8, t9];
      }
    }, 4500);

    return () => {
      window.clearInterval(checkIdle);
      clearGroomTimers();
    };
  }, [lastActivityTs, isSleeping]);

  const handleHeadMouseMove = (e: MouseEvent) => {
    if (lastPetX.current !== null) {
      petAccum.current += Math.abs(e.clientX - lastPetX.current);
      if (petAccum.current > 24) {
        setIsPetting(true);
        petAccum.current = 0;
        if (petTimeout.current) window.clearTimeout(petTimeout.current);
        petTimeout.current = window.setTimeout(() => setIsPetting(false), 950);
      }
    }
    lastPetX.current = e.clientX;
  };

  const handleHeadMouseLeave = () => {
    setIsHeadHovered(false);
    setIsPetting(false);
    lastPetX.current = null;
    petAccum.current = 0;
  };

  const isSpecialAlert = !isSleeping && isTyping && lastKeyCode !== null && SPECIAL_REACT_KEYS.has(lastKeyCode);
  const isGrooming = !isSleeping && idleState === "groom" && !isTyping;
  const eyesClosed = !isSleeping && (isHeadHovered || isPetting || idleState === "blink");
  const activeStrike = isTyping && !isSleeping ? getKeyStrikeTarget(lastKeyCode) : null;

  const kbSideColor = isDarkKb ? "#141417" : "#1c1c20";
  const kbTopColor = isDarkKb ? "#27272d" : "#2e2e33";
  const keyCapSide = isDarkKb ? "#2e2e35" : "#d8d4c8";
  const keyCapTop = isDarkKb ? "#4b4b54" : "#f7f6f1";
  const keyAltSide = isDarkKb ? "#3f3f47" : "#bcb8ac";
  const keyAltTop = isDarkKb ? "#5c5c66" : "#e5e2d8";
  const keyAccentSide = "#c27828";
  const keyAccentTop = "#f3a847";

  const leftShoulder = { x: -34, y: 12 };
  const rightShoulder = { x: 8, y: 12 };

  const isLeftTucked = leftPawPos.y < 60;
  const isRightTucked = rightPawPos.y < 60;

  const leftElbow = {
    x: (leftShoulder.x + leftPawPos.x) * 0.5 + (isLeftTucked ? -14 : -6),
    y: (leftShoulder.y + leftPawPos.y) * 0.5 + (isLeftTucked ? 14 : -2),
  };
  const rightElbow = {
    x: (rightShoulder.x + rightPawPos.x) * 0.5 + (isGrooming || isRightTucked ? 18 : 6),
    y: (rightShoulder.y + rightPawPos.y) * 0.5 + (isGrooming || isRightTucked ? 20 : -2),
  };

  const leftLimb = buildArticulatedLimb(
    leftShoulder,
    leftPawPos,
    isLeftTucked ? -14 : -6,
    isLeftTucked ? 14 : -2
  );
  const rightLimb = buildArticulatedLimb(
    rightShoulder,
    rightPawPos,
    isGrooming || isRightTucked ? 18 : 6,
    isGrooming || isRightTucked ? 20 : -2
  );

  const softShadowOpacity = settings.catCoat === "black" ? "0.42" : "0.22";

  return (
    <div class="pointer-events-none relative w-full max-w-[540px] flex flex-col items-center justify-center select-none">
      <svg viewBox="-200 -145 410 325" class="pointer-events-none w-full h-auto overflow-visible">
        <defs>
          <filter id="softFurShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5.5" />
          </filter>
          <radialGradient id={`siameseMuzzle-${settings.catCoat}`} cx="48%" cy="56%" r="54%">
            <stop offset="0%" stop-color={c.point} stop-opacity="0.96" />
            <stop offset="62%" stop-color={c.point} stop-opacity="0.65" />
            <stop offset="100%" stop-color={c.body} stop-opacity="0" />
          </radialGradient>

          <linearGradient
            id={`pawGradLeft-${settings.catCoat}`}
            gradientUnits="userSpaceOnUse"
            x1={leftShoulder.x}
            y1={leftShoulder.y}
            x2={leftPawPos.x}
            y2={leftPawPos.y}
          >
            <stop offset="0%" stop-color={c.body} />
            <stop offset="45%" stop-color={c.body} />
            <stop offset="100%" stop-color={c.pawTip} />
          </linearGradient>

          <linearGradient
            id={`pawGradRight-${settings.catCoat}`}
            gradientUnits="userSpaceOnUse"
            x1={rightShoulder.x}
            y1={rightShoulder.y}
            x2={rightPawPos.x}
            y2={rightPawPos.y}
          >
            <stop offset="0%" stop-color={c.body} />
            <stop offset="45%" stop-color={c.body} />
            <stop offset="100%" stop-color={c.pawTip} />
          </linearGradient>

          <filter id="kbGrain" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" result="grain" />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.05 0"
              in="grain"
              result="softGrain"
            />
            <feComposite operator="in" in="softGrain" in2="SourceGraphic" result="clippedGrain" />
            <feBlend mode="multiply" in="SourceGraphic" in2="clippedGrain" />
          </filter>
        </defs>

        {/* Grupo interactivo del personaje (único elemento que captura arrastre en el DOM) */}
        <g data-cat-interactive="true" class="pointer-events-auto cursor-grab active:cursor-grabbing">
          {/* 1. COLA CURVA CON PUNTA CALICÓ */}
          <g ref={tailRef} style={{ transformOrigin: "44px 52px" }}>
            <path
              d={isSleeping ? "M 44 60 C 76 72, 102 70, 128 72" : "M 44 52 C 78 60, 92 28, 118 32"}
              fill="none"
              stroke={c.point}
              stroke-width="14"
              stroke-linecap="round"
            />
            {settings.catCoat === "calico" && !isSleeping && (
              <path
                d="M 102 35 C 109 31, 114 31, 118 32"
                fill="none"
                stroke="#e38b47"
                stroke-width="14"
                stroke-linecap="round"
              />
            )}
          </g>

          {/* 2. PATAS TRASERAS ANCLADAS AL SUELO */}
          <g>
            <ellipse
              cx="-46"
              cy="78"
              rx="15"
              ry="11"
              fill={c.pawTip}
              stroke={c.hindOutline}
              stroke-width="1.8"
            />
            <ellipse
              cx="24"
              cy="78"
              rx="15"
              ry="11"
              fill={c.pawTip}
              stroke={c.hindOutline}
              stroke-width="1.8"
            />
            {/* Sombras suaves bajo las patas traseras */}
            <g filter="url(#softFurShadow)" opacity="0.28" pointer-events-none>
              <ellipse cx="-46" cy="87" rx="16" ry="5.5" fill={c.shade} />
              <ellipse cx="24" cy="87" rx="16" ry="5.5" fill={c.shade} />
            </g>
          </g>

          {/* 3. RATÓN COMPACTO A LA IZQUIERDA */}
          <g ref={mouseDeviceRef}>
            <g transform="translate(-112, 102) rotate(-12)">
              <ellipse
                cx="0"
                cy="0"
                rx="16"
                ry="21"
                fill={isDarkKb ? "#27272a" : "#ffffff"}
                stroke="#18181b"
                stroke-width="2.2"
              />
              {activeMouseBtn === "Left" && (
                <path d="M -14 -2 C -14 -14, -2 -20, 0 -20 L 0 -2 Z" fill="#22d3ee" />
              )}
              {activeMouseBtn === "Right" && (
                <path d="M 14 -2 C 14 -14, 2 -20, 0 -20 L 0 -2 Z" fill="#22d3ee" />
              )}
              <rect x="-1.8" y="-13" width="3.6" height="7" rx="1.8" fill="#f59e0b" />
              <line x1="0" y1="-20" x2="0" y2="-2" stroke="#18181b" stroke-width="1.5" />
            </g>
          </g>

          {/* 4. TECLADO HORIZONTAL COMPACTO SIN RGB */}
          <g transform="translate(8, 114)">
            <path
              d="M -104 -27 L 104 -27 L 114 33 Q 114 38 107 38 L -107 38 Q -114 38 -114 33 Z"
              fill={kbSideColor}
              stroke="#09090b"
              stroke-width="2"
              stroke-linejoin="round"
            />

            <path
              filter="url(#kbGrain)"
              d="M -102 -28 L 102 -28 L 111 28 L -111 28 Z"
              fill={kbTopColor}
              stroke="#09090b"
              stroke-width="1.4"
              stroke-linejoin="round"
            />

            {/* Fila 1 */}
            <g transform="translate(0, -16)">
              <rect x="-96" y="-3" width="14" height="8" rx="2" fill={keyAltSide} />
              <rect x="-96" y="-4.5" width="14" height="7.5" rx="2" fill={keyAltTop} />
              <rect x="-78" y="-3" width="15" height="8" rx="2" fill={keyAltSide} />
              <rect x="-78" y="-4.5" width="15" height="7.5" rx="2" fill={keyAltTop} />
              <rect x="-59" y="-3" width="17" height="8" rx="2" fill={keyAltSide} />
              <rect x="-59" y="-4.5" width="17" height="7.5" rx="2" fill={keyAltTop} />
              <rect x="-38" y="-3" width="92" height="8" rx="2.2" fill={keyCapSide} />
              <rect x="-38" y="-4.5" width="92" height="7.5" rx="2.2" fill={keyCapTop} />
              <rect x="58" y="-3" width="17" height="8" rx="2" fill={keyAltSide} />
              <rect x="58" y="-4.5" width="17" height="7.5" rx="2" fill={keyAltTop} />
              <rect x="79" y="-3" width="18" height="8" rx="2" fill={keyAltSide} />
              <rect x="79" y="-4.5" width="18" height="7.5" rx="2" fill={keyAltTop} />
            </g>

            {/* Fila 2 */}
            <g transform="translate(0, -5)">
              <rect x="-98" y="-3" width="20" height="8" rx="2" fill={settings.highlightSpecialKeys ? keyAccentSide : keyAltSide} />
              <rect x="-98" y="-4.5" width="20" height="7.5" rx="2" fill={settings.highlightSpecialKeys ? keyAccentTop : keyAltTop} />
              {[-69, -52, -35, -18, -1, 16, 33, 50, 67].map((kx, idx) => (
                <g key={idx}>
                  <rect x={kx - 6.5} y="-3" width="13" height="8" rx="2" fill={keyCapSide} />
                  <rect x={kx - 6.5} y="-4.5" width="13" height="7.5" rx="2" fill={keyCapTop} />
                </g>
              ))}
              <rect x="76" y="-3" width="22" height="8" rx="2" fill={keyAltSide} />
              <rect x="76" y="-4.5" width="22" height="7.5" rx="2" fill={keyAltTop} />
            </g>

            {/* Fila 3 */}
            <g transform="translate(0, 6)">
              <rect x="-99" y="-3" width="22" height="8" rx="2" fill={keyAltSide} />
              <rect x="-99" y="-4.5" width="22" height="7.5" rx="2" fill={keyAltTop} />
              {[-68, -51, -34, -17, 0, 17, 34, 51, 68].map((kx, idx) => (
                <g key={idx}>
                  <rect x={kx - 6.5} y="-3" width="13" height="8" rx="2" fill={keyCapSide} />
                  <rect x={kx - 6.5} y="-4.5" width="13" height="7.5" rx="2" fill={keyCapTop} />
                </g>
              ))}
              <rect x="77" y="-3" width="22" height="8" rx="2" fill={keyAltSide} />
              <rect x="77" y="-4.5" width="22" height="7.5" rx="2" fill={keyAltTop} />
            </g>

            {/* Fila 4 */}
            <g transform="translate(0, 17)">
              {[-89, -71, -53, -35, -17, 1, 19, 37, 55, 73, 91].map((kx, idx) => {
                const isEdge = idx === 0 || idx === 10;
                const isRightAccent = idx === 10 && settings.highlightSpecialKeys;
                return (
                  <g key={idx}>
                    <rect
                      x={kx - 7}
                      y="-3"
                      width="14"
                      height="8.5"
                      rx="2"
                      fill={isRightAccent ? keyAccentSide : isEdge ? keyAltSide : keyCapSide}
                    />
                    <rect
                      x={kx - 7}
                      y="-4.5"
                      width="14"
                      height="8"
                      rx="2"
                      fill={isRightAccent ? keyAccentTop : isEdge ? keyAltTop : keyCapTop}
                    />
                  </g>
                );
              })}
            </g>

            {/* Tecla iluminada en ámbar cálido al ser pulsada */}
            {activeStrike && (
              <rect
                x={activeStrike.x - 15}
                y={activeStrike.y - 118.5}
                width={lastKeyCode === "Space" ? "60" : "15"}
                height="8"
                rx="2"
                fill="#f3d5a5"
                opacity="0.95"
              />
            )}
          </g>

          {/* 5. GRUPO PIVOTE SUPERIOR (Dorso felino anatómico + Brazos + Cabeza) */}
          <g ref={upperBodyPivotRef} style={{ transformOrigin: "-12px 76px" }}>
            <g ref={torsoRef} style={{ transformOrigin: "-12px 76px" }}>
              <path
                d="M -52 75
                   C -58 56, -52 24, -44 -2
                   C -40 -16, -38 -28, -36 -38
                   C -22 -48, 2 -46, 12 -34
                   C 20 -22, 26 -12, 34 2
                   C 46 22, 52 50, 44 73
                   C 34 83, -44 83, -52 75 Z"
                fill={c.body}
              />

              {/* Sombra difusa suave bajo el cuello y barbilla */}
              <ellipse
                cx="-14"
                cy="-22"
                rx="28"
                ry="9"
                fill={c.shade}
                opacity={settings.catCoat === "black" ? "0.45" : "0.24"}
                filter="url(#softFurShadow)"
                pointer-events-none
              />

              <path
                d="M -52 75 C -58 56, -52 24, -44 -2"
                fill="none"
                stroke={c.shade}
                stroke-width="1.4"
                stroke-linecap="round"
                opacity="0.45"
              />

              {c.spot && (
                <path
                  d="M 22 -14 C 36 4, 48 34, 43 66 C 28 62, 18 36, 15 10 Z"
                  fill={c.spot}
                  opacity="0.92"
                />
              )}
              {settings.catCoat === "calico" && (
                <path
                  d="M -51 28 C -55 46, -54 62, -49 72 C -44 60, -45 42, -51 28 Z"
                  fill="#231f1e"
                />
              )}

              {c.stripe && (
                <g fill="none" stroke={c.stripe} stroke-width="4" stroke-linecap="round" opacity="0.72">
                  <path d="M 8 -14 Q 18 -12 25 -8" />
                  <path d="M 12 2 Q 24 4 33 9" />
                  <path d="M 15 18 Q 28 21 38 26" />
                </g>
              )}
            </g>

            {/* Sombras suaves bajo codos/rodillas delanteras */}
            <g filter="url(#softFurShadow)" opacity={softShadowOpacity} pointer-events-none>
              <ellipse cx={leftElbow.x} cy={leftElbow.y + 8} rx="11" ry="6" fill={c.shade} />
              <ellipse cx={rightElbow.x} cy={rightElbow.y + 8} rx="11" ry="6" fill={c.shade} />
            </g>

            {/* Brazo izquierdo */}
            <g>
              <path
                d={leftLimb.armPath}
                fill="none"
                stroke={`url(#pawGradLeft-${settings.catCoat})`}
                stroke-width="18"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d={leftLimb.innerEdge}
                fill="none"
                stroke={c.shade}
                stroke-width="1.45"
                stroke-linecap="round"
                opacity="0.82"
              />
              <path
                d={leftLimb.outerEdge}
                fill="none"
                stroke={c.shade}
                stroke-width="1.15"
                stroke-linecap="round"
                opacity="0.48"
              />
              <path
                d={leftLimb.elbowCrease}
                fill="none"
                stroke={c.shade}
                stroke-width="1.2"
                stroke-linecap="round"
                opacity="0.55"
              />
              <circle
                cx={leftPawPos.x}
                cy={leftPawPos.y}
                r="9.5"
                fill={c.pawTip}
                stroke={isLeftTucked ? c.shade : "none"}
                stroke-width={isLeftTucked ? "1.4" : "0"}
              />
            </g>

            {/* Cabeza (se dibuja antes que el brazo derecho para que la pata quede por delante al acicalarse) */}
            <g
              ref={headRef}
              transform={`translate(${gazeOffset.headX.toFixed(2)}, ${gazeOffset.headY.toFixed(2)}) rotate(${gazeOffset.headRot.toFixed(2)} -14 -44)`}
              onMouseEnter={() => setIsHeadHovered(true)}
              onMouseMove={handleHeadMouseMove}
              onMouseLeave={handleHeadMouseLeave}
            >
              {/* Oreja izquierda */}
              <g ref={leftEarRef} style={{ transformOrigin: "-42px -74px" }}>
                <path d="M -54 -62 Q -58 -96 -45 -100 Q -32 -96 -26 -74 Z" fill={c.earLeft} />
                <path d="M -49 -66 Q -51 -88 -44 -90 Q -35 -88 -31 -74 Z" fill={c.earInner} />
              </g>

              {/* Oreja derecha */}
              <g ref={rightEarRef} style={{ transformOrigin: "12px -78px" }}>
                <path d="M -2 -76 Q 7 -106 20 -106 Q 30 -98 25 -66 Z" fill={c.earRight} />
                <path d="M 3 -76 Q 9 -96 18 -96 Q 25 -90 21 -68 Z" fill={c.earInner} />
              </g>

              {/* Cráneo */}
              <ellipse cx="-15" cy="-54" rx="44" ry="35" transform="rotate(-4 -15 -54)" fill={c.body} />

              {/* Manchas faciales */}
              {settings.catCoat === "calico" && (
                <>
                  <path
                    d="M -56 -64 C -54 -84, -32 -90, -14 -86 C -16 -68, -36 -60, -56 -64 Z"
                    fill="#e38b47"
                  />
                  <path
                    d="M 4 -86 C 20 -82, 30 -68, 28 -52 C 16 -54, 6 -68, 4 -86 Z"
                    fill="#231f1e"
                  />
                </>
              )}
              {settings.catCoat === "orange" && c.spot && (
                <path
                  d="M -50 -74 C -36 -90, -16 -88, -10 -70 C -24 -64, -40 -66, -50 -74 Z"
                  fill={c.spot}
                />
              )}

              <g
                ref={faceRef}
                transform={`translate(${(gazeOffset.headX * 0.55).toFixed(2)}, ${(gazeOffset.headY * 0.55).toFixed(2)})`}
              >
                {settings.catCoat === "siamese" && (
                  <ellipse cx="-16" cy="-46" rx="35" ry="22" fill={`url(#siameseMuzzle-${settings.catCoat})`} />
                )}

                {isSleeping && (
                  <g fill="#94a3b8" font-family="ui-sans-serif, system-ui, sans-serif" font-weight="800">
                    <text x="34" y="-78" font-size="13" class="anim-zzz-1">
                      z
                    </text>
                    <text x="46" y="-92" font-size="17" class="anim-zzz-2">
                      Z
                    </text>
                  </g>
                )}

                {isPetting && !isSleeping && (
                  <g class="anim-heart" transform="translate(34, -92)">
                    <path d="M 0 4 C -6 -2, -12 3, 0 12 C 12 3, 6 -2, 0 4 Z" fill="#fb7185" />
                  </g>
                )}

                {/* Ojos */}
                {isSleeping || isGrooming ? (
                  <g
                    stroke={isGrooming ? c.eyeIris : "#18181b"}
                    stroke-width="2.6"
                    fill="none"
                    stroke-linecap="round"
                    opacity="0.9"
                  >
                    <path d="M -42 -54 Q -31 -48 -20 -54" />
                    <path d="M -5 -57 Q 6 -51 17 -57" />
                  </g>
                ) : eyesClosed ? (
                  <g stroke="#18181b" stroke-width="2.6" fill="none" stroke-linecap="round">
                    <path d="M -42 -55 Q -31 -65 -20 -55" />
                    <path d="M -5 -58 Q 6 -68 17 -58" />
                  </g>
                ) : (
                  <>
                    <g transform="translate(-31, -54) rotate(-5)">
                      <g transform={`translate(${gazeOffset.irisX.toFixed(2)}, ${gazeOffset.irisY.toFixed(2)})`}>
                        <ellipse cx="0" cy="0" rx="11.5" ry="9" fill={c.eyeIris} />
                      </g>
                      <g
                        transform={`translate(${gazeOffset.leftPupilX.toFixed(2)}, ${gazeOffset.pupilY.toFixed(2)}) scale(${gazeOffset.pupilScale.toFixed(3)})`}
                      >
                        <ellipse cx="0" cy="0" rx="4" ry="6.8" fill="#09090b" />
                        <circle cx="-1.6" cy="-2.2" r="1.5" fill="#ffffff" opacity="0.9" />
                      </g>
                    </g>

                    <g transform="translate(6, -57) rotate(5)">
                      <g transform={`translate(${gazeOffset.irisX.toFixed(2)}, ${gazeOffset.irisY.toFixed(2)})`}>
                        <ellipse cx="0" cy="0" rx="11.5" ry="9" fill={c.eyeIris} />
                      </g>
                      <g
                        transform={`translate(${gazeOffset.rightPupilX.toFixed(2)}, ${gazeOffset.pupilY.toFixed(2)}) scale(${gazeOffset.pupilScale.toFixed(3)})`}
                      >
                        <ellipse cx="0" cy="0" rx="4" ry="6.8" fill="#09090b" />
                        <circle cx="-1.6" cy="-2.2" r="1.5" fill="#ffffff" opacity="0.9" />
                      </g>
                    </g>
                  </>
                )}

                {/* Bigotes */}
                <g stroke={c.whisker} stroke-width="1.2" stroke-linecap="round" opacity="0.85">
                  <line x1="-38" y1="-42" x2="-56" y2="-40" />
                  <line x1="-37" y1="-37" x2="-55" y2="-32" />
                  <line x1="-36" y1="-32" x2="-52" y2="-25" />
                  <line x1="10" y1="-45" x2="28" y2="-47" />
                  <line x1="11" y1="-40" x2="29" y2="-39" />
                  <line x1="10" y1="-35" x2="27" y2="-32" />
                </g>

                {/* Boca */}
                {isPetting && !isSleeping ? (
                  <path
                    d="M -21 -36 Q -16 -29 -12 -35 Q -8 -29 -3 -36"
                    fill="none"
                    stroke="#f43f5e"
                    stroke-width="2.2"
                    stroke-linecap="round"
                  />
                ) : isSpecialAlert ? (
                  <ellipse cx="-14" cy="-34" rx="3.5" ry="4.5" fill="#fb7185" />
                ) : null}

                {/* Lengüita con ajuste vertical fino en faceRef */}
                {isGrooming && tongueOut && (
                  <g transform="translate(-14, -34) rotate(-14)">
                    <ellipse cx="0" cy="0" rx="3.8" ry="6.2" fill="#f47296" />
                    <line
                      x1="0"
                      y1="-3.5"
                      x2="0"
                      y2="3.5"
                      stroke="#db537a"
                      stroke-width="1.1"
                      stroke-linecap="round"
                      opacity="0.7"
                    />
                  </g>
                )}
              </g>
            </g>

            {/* Brazo derecho (renderizado encima de la cabeza para que la pata se apoye visualmente frente al hocico) */}
            <g>
              <path
                d={rightLimb.armPath}
                fill="none"
                stroke={`url(#pawGradRight-${settings.catCoat})`}
                stroke-width="18"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d={rightLimb.innerEdge}
                fill="none"
                stroke={c.shade}
                stroke-width="1.45"
                stroke-linecap="round"
                opacity="0.82"
              />
              <path
                d={rightLimb.outerEdge}
                fill="none"
                stroke={c.shade}
                stroke-width="1.15"
                stroke-linecap="round"
                opacity="0.48"
              />
              <path
                d={rightLimb.elbowCrease}
                fill="none"
                stroke={c.shade}
                stroke-width="1.2"
                stroke-linecap="round"
                opacity="0.55"
              />
              <circle
                cx={rightPawPos.x}
                cy={rightPawPos.y}
                r="9.5"
                fill={c.pawTip}
                stroke={isRightTucked || isGrooming ? c.shade : "none"}
                stroke-width={isRightTucked || isGrooming ? "1.4" : "0"}
              />
            </g>
          </g>
        </g>

        {/* 6. COLA DE TECLAS FLOTANTES EN EL AIRE (sin capturar ratón) */}
        {floatingKeys.map((fk, idx) => {
          const isOldest = idx < floatingKeys.length - 1;
          return (
            <g
              key={fk.id}
              transform={`translate(${fk.x + (isOldest ? 22 : 0)}, ${fk.y - (isOldest ? 10 : 0)})`}
              opacity={isOldest ? 0.55 : 1}
              class="pointer-events-none"
            >
              <g class="anim-keycap-pop">
                <rect
                  x="-15"
                  y="-14"
                  width="30"
                  height="28"
                  rx="6.5"
                  fill="#ffffff"
                  stroke="#57534e"
                  stroke-width="1.8"
                />
                <text
                  x="0"
                  y="3"
                  text-anchor="middle"
                  fill="#292524"
                  font-family="ui-sans-serif, system-ui, sans-serif"
                  font-weight="800"
                  font-size={fk.label.length > 3 ? "8" : "11.5"}
                >
                  {fk.label}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}