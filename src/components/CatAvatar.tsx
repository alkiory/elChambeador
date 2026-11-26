import { useEffect, useRef, useState } from "preact/hooks";
import { animate } from "animejs";
import { CatCoat } from "../types/input";

interface Props {
  normMouse: { x: number; y: number };
  lastKeyCode: string | null;
  isTyping: boolean;
  activeMouseBtn: string | null;
  lastActivityTs: number;
  coat: CatCoat;
}

type IdleState = "active" | "lookAround" | "groom" | "blink";

interface CoatStyle {
  fur: string;
  shade: string;
  point: string;
  stroke: string;
  earInner: string;
  eyeIris: string;
  blush: string;
  spot?: string;
}

const COAT_STYLES: Record<CatCoat, CoatStyle> = {
  siamese: {
    fur: "#ebe3d5",
    shade: "#dcd2c0",
    point: "#362b25",
    stroke: "#231c18",
    earInner: "#d6a29c",
    eyeIris: "#3b82f6",
    blush: "#f43f5e",
  },
  white: {
    fur: "#ffffff",
    shade: "#f1f5f9",
    point: "#ffffff",
    stroke: "#18181b",
    earInner: "#fda4af",
    eyeIris: "#18181b",
    blush: "#fb7185",
  },
  black: {
    fur: "#27272a",
    shade: "#18181b",
    point: "#18181b",
    stroke: "#09090b",
    earInner: "#f472b6",
    eyeIris: "#facc15",
    blush: "#fb7185",
  },
  orange: {
    fur: "#fdba74",
    shade: "#fb923c",
    point: "#ea580c",
    stroke: "#431407",
    earInner: "#fed7aa",
    eyeIris: "#18181b",
    blush: "#f43f5e",
    spot: "#ea580c",
  },
  gray: {
    fur: "#cbd5e1",
    shade: "#94a3b8",
    point: "#64748b",
    stroke: "#1e293b",
    earInner: "#f9a8d4",
    eyeIris: "#18181b",
    blush: "#fb7185",
  },
  calico: {
    fur: "#ffffff",
    shade: "#f5f5f4",
    point: "#292524",
    stroke: "#1c1917",
    earInner: "#fda4af",
    eyeIris: "#18181b",
    blush: "#fb7185",
    spot: "#f97316",
  },
};

// Desplazamiento horizontal suave de la pata izquierda sobre el teclado (-70 a +45 px)
function getKeyboardOffset(code: string | null): number {
  if (!code) return -20;
  if (/^(Escape|F1|F2|BackQuote|Num1|Num2|Tab|KeyQ|KeyW|CapsLock|KeyA|KeyS|ShiftLeft|IntlBackslash|KeyZ|ControlLeft|MetaLeft)$/.test(code)) {
    return -72;
  }
  if (/^(F3|F4|F5|Num3|Num4|Num5|KeyE|KeyR|KeyT|KeyD|KeyF|KeyG|KeyX|KeyC|KeyV|AltLeft)$/.test(code)) {
    return -40;
  }
  if (/^(F6|F7|F8|Num6|Num7|Num8|KeyY|KeyU|KeyI|KeyH|KeyJ|KeyK|KeyB|KeyN|KeyM|Space)$/.test(code)) {
    return -10;
  }
  if (/^(F9|F10|Num9|Num0|Minus|KeyO|KeyP|KeyL|SemiColon|Comma|Dot|AltRight)$/.test(code)) {
    return 20;
  }
  return 48;
}

const SPECIAL_REACT_KEYS = new Set(["Escape", "Enter", "Backspace", "Space"]);

export function CatAvatar({
  normMouse,
  lastKeyCode,
  isTyping,
  activeMouseBtn,
  lastActivityTs,
  coat,
}: Props) {
  const s = COAT_STYLES[coat];

  const headTiltRef = useRef<SVGGElement | null>(null);
  const faceRef = useRef<SVGGElement | null>(null);
  const eyesRef = useRef<SVGGElement | null>(null);
  const leftEarRef = useRef<SVGGElement | null>(null);
  const rightEarRef = useRef<SVGGElement | null>(null);
  const tailRef = useRef<SVGGElement | null>(null);
  const leftPawRef = useRef<SVGGElement | null>(null);
  const rightPawRef = useRef<SVGGElement | null>(null);

  const [idleState, setIdleState] = useState<IdleState>("active");
  const [isHeadHovered, setIsHeadHovered] = useState(false);
  const [isPetting, setIsPetting] = useState(false);
  const [isFastTyping, setIsFastTyping] = useState(false);

  const lastPetX = useRef<number | null>(null);
  const petAccum = useRef(0);
  const petTimeout = useRef<number | null>(null);
  const keyTimestampsRef = useRef<number[]>([]);
  const earIndexRef = useRef(0);
  const idleCycleRef = useRef(0);

  // 1. Inclinación natural de cabeza + paralaje facial + mirada siguiendo el cursor con Anime.js
  useEffect(() => {
    if (idleState === "lookAround") return;

    const dx = normMouse.x - 0.5;
    const dy = normMouse.y - 0.5;

    if (headTiltRef.current) {
      animate(headTiltRef.current, {
        rotate: dx * 13,
        translateX: dx * 10,
        translateY: dy * 7,
        duration: 240,
        ease: "outQuad",
      });
    }

    if (faceRef.current) {
      animate(faceRef.current, {
        translateX: dx * 11,
        translateY: dy * 7,
        duration: 210,
        ease: "outQuad",
      });
    }

    if (eyesRef.current) {
      animate(eyesRef.current, {
        translateX: dx * 5,
        translateY: dy * 3.5,
        duration: 140,
        ease: "outQuad",
      });
    }
  }, [normMouse.x, normMouse.y, idleState]);

  // 2. Golpeo rítmico y corto de la pata izquierda sobre el teclado (estilo Bongo Cat)
  useEffect(() => {
    if (!leftPawRef.current || idleState === "groom") return;
    const offsetX = isTyping ? getKeyboardOffset(lastKeyCode) : -15;
    const offsetY = isTyping ? 14 : 0;

    animate(leftPawRef.current, {
      translateX: offsetX * 0.55,
      translateY: offsetY,
      rotate: isTyping ? -10 : 0,
      duration: 95,
      ease: "outBack(1.8)",
    });
  }, [lastKeyCode, isTyping, idleState]);

  // 3. Pata derecha apoyada sobre el ratón acompañando su desplazamiento y clic
  useEffect(() => {
    if (!rightPawRef.current) return;
    const dx = (normMouse.x - 0.5) * 44;
    const dy = (normMouse.y - 0.5) * 28 + (activeMouseBtn ? 6 : 0);

    animate(rightPawRef.current, {
      translateX: dx * 0.75,
      translateY: dy * 0.75,
      rotate: dx * 0.14,
      duration: 110,
      ease: "outQuad",
    });
  }, [normMouse.x, normMouse.y, activeMouseBtn]);

  // 4. Animaciones de orejas cada 15 segundos (4 variantes)
  useEffect(() => {
    const interval = window.setInterval(() => {
      const variant = earIndexRef.current % 4;
      earIndexRef.current += 1;
      const lEar = leftEarRef.current;
      const rEar = rightEarRef.current;
      if (!lEar || !rEar) return;

      if (variant === 0) {
        animate(lEar, { rotate: [0, -16, 4, -12, 0], duration: 500, ease: "inOutSine" });
      } else if (variant === 1) {
        animate(lEar, { rotate: [0, -13, -13, 0], duration: 1050, ease: "inOutQuad" });
        animate(rEar, { rotate: [0, 9, 9, 0], duration: 1050, ease: "inOutQuad" });
      } else if (variant === 2) {
        animate(rEar, { rotate: [0, 15, -10, 0], duration: 950, ease: "inOutSine" });
      } else {
        animate([lEar, rEar], { scaleY: [1, 0.82, 1], duration: 880, ease: "inOutQuad" });
      }
    }, 15000);

    return () => window.clearInterval(interval);
  }, []);

  // 5. Cola animada en reposo y rápida al teclear
  useEffect(() => {
    if (!isTyping) return;
    const now = Date.now();
    const recent = keyTimestampsRef.current.filter((ts) => now - ts < 1200);
    recent.push(now);
    keyTimestampsRef.current = recent;
    if (recent.length >= 3) setIsFastTyping(true);
  }, [lastKeyCode, isTyping]);

  useEffect(() => {
    if (!isFastTyping) return;
    const t = window.setTimeout(() => {
      const stillFast = keyTimestampsRef.current.filter((ts) => Date.now() - ts < 1200).length >= 3;
      if (!stillFast) setIsFastTyping(false);
    }, 600);
    return () => window.clearTimeout(t);
  }, [isFastTyping, lastKeyCode]);

  useEffect(() => {
    if (!tailRef.current) return;
    const anim = animate(tailRef.current, {
      rotate: isFastTyping ? [-8, 16, -8] : [-3, 9, -3],
      duration: isFastTyping ? 350 : 2800,
      loop: true,
      ease: "inOutSine",
    });
    return () => {
      anim.pause();
    };
  }, [isFastTyping]);

  // 6. Estados autónomos en reposo (mirar alrededor, lamerse la pata, espabilar)
  useEffect(() => {
    const checkIdle = window.setInterval(() => {
      if (Date.now() - lastActivityTs < 4000) {
        setIdleState("active");
        return;
      }

      const actions: IdleState[] = ["lookAround", "groom", "blink"];
      const chosen = actions[idleCycleRef.current % actions.length];
      idleCycleRef.current += 1;
      setIdleState(chosen);

      if (chosen === "lookAround" && headTiltRef.current && faceRef.current) {
        animate(headTiltRef.current, { rotate: [-11, 11, 0], duration: 2100, ease: "inOutSine" });
        animate(faceRef.current, { translateX: [-12, 12, 0], duration: 2100, ease: "inOutSine" });
      }

      if (chosen === "groom" && leftPawRef.current) {
        animate(leftPawRef.current, {
          translateX: 16,
          translateY: [-34, -44, -34, -44, 0],
          rotate: -28,
          duration: 2100,
          ease: "inOutSine",
        });
      }

      window.setTimeout(() => setIdleState("active"), 2250);
    }, 4500);

    return () => window.clearInterval(checkIdle);
  }, [lastActivityTs]);

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

  const isSpecialAlert = isTyping && lastKeyCode !== null && SPECIAL_REACT_KEYS.has(lastKeyCode);
  const eyesClosed = isHeadHovered || isPetting || idleState === "blink";
  const isGrooming = idleState === "groom" && !isTyping;

  return (
    <div class="relative w-[760px] h-0 overflow-visible z-20 pointer-events-none select-none flex justify-center">
      <svg viewBox="-380 -215 760 440" class="w-[760px] h-[440px] -mt-[198px] overflow-visible">
        <defs>
          {/* Máscara facial suave para Siamés */}
          <radialGradient id={`siameseMask-${coat}`} cx="50%" cy="56%" r="50%">
            <stop offset="0%" stop-color={s.point} stop-opacity="0.92" />
            <stop offset="55%" stop-color={s.point} stop-opacity="0.45" />
            <stop offset="100%" stop-color={s.fur} stop-opacity="0" />
          </radialGradient>
        </defs>

        {/* COLA CURVA LIMPIA (estilo ilustración Bongo Cat / Little One) */}
        <g ref={tailRef} style={{ transformOrigin: "54px -4px" }}>
          <path
            d="M 52 -4 C 96 4, 114 -34, 144 -28"
            fill="none"
            stroke={s.stroke}
            stroke-width="21"
            stroke-linecap="round"
          />
          <path
            d="M 52 -4 C 96 4, 114 -34, 144 -28"
            fill="none"
            stroke={s.point}
            stroke-width="14"
            stroke-linecap="round"
          />
        </g>

        {/* CUERPO + CABEZA CONTINUA (forma de "panecillo" suave con trazo continuo, sin cuello cortado) */}
        <g
          ref={headTiltRef}
          class="pointer-events-auto cursor-grab"
          style={{ transformOrigin: "-32px -20px" }}
          onMouseEnter={() => setIsHeadHovered(true)}
          onMouseMove={handleHeadMouseMove}
          onMouseLeave={handleHeadMouseLeave}
        >
          {/* Oreja izquierda integrada al contorno */}
          <g ref={leftEarRef} style={{ transformOrigin: "-86px -126px" }}>
            <path
              d="M -104 -106 C -112 -146, -104 -172, -88 -174 C -74 -175, -62 -152, -56 -130 Z"
              fill={s.point}
              stroke={s.stroke}
              stroke-width="3.8"
              stroke-linejoin="round"
            />
            <path
              d="M -95 -114 C -100 -140, -95 -158, -86 -159 C -76 -160, -68 -144, -64 -128 Z"
              fill={s.earInner}
            />
          </g>

          {/* Oreja derecha integrada al contorno */}
          <g ref={rightEarRef} style={{ transformOrigin: "18px -130px" }}>
            <path
              d="M -8 -132 C 2 -156, 16 -178, 30 -176 C 44 -172, 46 -142, 36 -110 Z"
              fill={s.point}
              stroke={s.stroke}
              stroke-width="3.8"
              stroke-linejoin="round"
            />
            <path
              d="M -1 -128 C 6 -146, 16 -162, 26 -161 C 35 -158, 36 -138, 29 -114 Z"
              fill={s.earInner}
            />
          </g>

          {/* Silueta única continua: cabeza redondeada que baja suavemente hasta apoyarse en el escritorio */}
          <path
            d="M -112 18
               C -122 -24, -124 -88, -94 -118
               C -66 -144, -8 -146, 26 -120
               C 58 -94, 66 -26, 62 18 Z"
            fill={s.fur}
            stroke={s.stroke}
            stroke-width="3.8"
            stroke-linejoin="round"
          />

          {/* Sombreado sutil inferior en el cuerpo */}
          <path
            d="M -108 16 C -106 -4, 56 -4, 58 16 Z"
            fill={s.shade}
            opacity="0.65"
          />

          {/* Manchas para Calicó / Naranja */}
          {s.spot && (
            <>
              <path
                d="M -98 -114 C -78 -138, -48 -138, -42 -112 C -62 -104, -82 -106, -98 -114 Z"
                fill={s.spot}
              />
              <circle cx="34" cy="-36" r="18" fill={s.spot} opacity="0.85" />
            </>
          )}

          {/* Rasgos faciales que se desplazan en bloque con paralaje 3D al seguir el ratón */}
          <g ref={faceRef}>
            {coat === "siamese" && (
              <ellipse cx="-34" cy="-78" rx="44" ry="28" fill={`url(#siameseMask-${coat})`} />
            )}

            {/* Corazones flotantes al acariciar */}
            {isPetting && (
              <g class="anim-heart" transform="translate(36, -142)">
                <path d="M 0 4 C -6 -2, -12 3, 0 12 C 12 3, 6 -2, 0 4 Z" fill="#fb7185" />
              </g>
            )}

            {/* Ojos minimalistas expresivos o cerrados felices (^ ^) */}
            {eyesClosed ? (
              <g stroke={s.stroke} stroke-width="3.4" fill="none" stroke-linecap="round">
                <path d="M -76 -92 Q -62 -105 -48 -92" />
                <path d="M -20 -94 Q -6 -107 8 -94" />
              </g>
            ) : (
              <g ref={eyesRef}>
                {/* Ojo izquierdo */}
                <g transform="translate(-62, -92)">
                  <ellipse cx="0" cy="0" rx="9.5" ry="11" fill={s.eyeIris} />
                  <circle cx="-2.8" cy="-3.5" r="3" fill="#ffffff" />
                  <circle cx="2.5" cy="3" r="1.3" fill="#ffffff" opacity="0.85" />
                </g>

                {/* Ojo derecho */}
                <g transform="translate(-6, -94)">
                  <ellipse cx="0" cy="0" rx="9.5" ry="11" fill={s.eyeIris} />
                  <circle cx="-2.8" cy="-3.5" r="3" fill="#ffffff" />
                  <circle cx="2.5" cy="3" r="1.3" fill="#ffffff" opacity="0.85" />
                </g>
              </g>
            )}

            {/* Rubor rosado en mejillas */}
            {(isPetting || isHeadHovered) && (
              <>
                <ellipse cx="-76" cy="-78" rx="9" ry="5" fill={s.blush} opacity="0.45" />
                <ellipse cx="8" cy="-80" rx="9" ry="5" fill={s.blush} opacity="0.45" />
              </>
            )}

            {/* Bigotes minimalistas laterales */}
            <g stroke={s.stroke} stroke-width="2.2" stroke-linecap="round" opacity="0.85">
              <line x1="-102" y1="-82" x2="-122" y2="-86" />
              <line x1="-102" y1="-72" x2="-122" y2="-70" />
              <line x1="42" y1="-84" x2="62" y2="-88" />
              <line x1="42" y1="-74" x2="62" y2="-72" />
            </g>

            {/* Boquita estilo Little One / Bongo Cat (ω) */}
            {isPetting ? (
              <path
                d="M -46 -74 Q -40 -63 -34 -72 Q -28 -63 -22 -74"
                fill="none"
                stroke="#f43f5e"
                stroke-width="3"
                stroke-linecap="round"
              />
            ) : isSpecialAlert ? (
              <ellipse cx="-34" cy="-70" rx="5.5" ry="6.5" fill="#fb7185" stroke={s.stroke} stroke-width="2.2" />
            ) : (
              <path
                d="M -44 -74 Q -39 -67 -34 -74 Q -29 -67 -24 -74"
                fill="none"
                stroke={s.stroke}
                stroke-width="2.8"
                stroke-linecap="round"
              />
            )}

            {/* Lengüita al lamerse la pata en reposo */}
            {isGrooming && (
              <path
                d="M -38 -71 C -38 -61, -30 -61, -30 -71 Z"
                fill="#fb7185"
                stroke={s.stroke}
                stroke-width="2"
              />
            )}
          </g>
        </g>

        {/* PATA IZQUIERDA (corta y gordita, asoma sobre el teclado y golpea cada tecla) */}
        <g ref={leftPawRef} style={{ transformOrigin: "-66px -6px" }}>
          <path
            d="M -82 -8 C -88 12, -82 32, -66 34 C -50 36, -42 16, -48 -6"
            fill={s.point}
            stroke={s.stroke}
            stroke-width="3.6"
            stroke-linecap="round"
          />
          {/* Almohadilla rosa visible cuando levanta la pata */}
          {!isTyping && (
            <circle cx="-66" cy="21" r="4.5" fill={s.earInner} opacity="0.85" />
          )}
        </g>

        {/* PATA DERECHA (apoyada sobre el ratón, siguiendo su movimiento) */}
        <g ref={rightPawRef} style={{ transformOrigin: "36px -4px" }}>
          <path
            d="M 22 -8 C 78 28, 178 96, 256 142 C 268 149, 254 166, 240 158 C 164 112, 68 46, 14 8"
            fill={s.point}
            stroke={s.stroke}
            stroke-width="3.6"
            stroke-linecap="round"
          />
        </g>
      </svg>
    </div>
  );
}