export interface KeyPayload {
  code: string;
  pressed: boolean;
}

export interface MousePayload {
  kind: "move" | "down" | "up";
  x: number;
  y: number;
  screenW: number;
  screenH: number;
  button?: string;
}

export type CatCoat = "siamese" | "white" | "black" | "orange" | "gray" | "calico";
export type KeyboardSkin = "dark" | "light";

export interface AppSettings {
  catCoat: CatCoat;
  skin: KeyboardSkin;
  highlightSpecialKeys: boolean;
  avatarScale: number;
  keySounds: boolean;
}