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

export type KeyboardSkin = "dark" | "light";
export type CatCoat = "siamese" | "white" | "black" | "orange" | "gray" | "calico";

export interface AppSettings {
  skin: KeyboardSkin;
  highlightSpecialKeys: boolean;
  catCoat: CatCoat;
}