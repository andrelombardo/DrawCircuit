import type { CircuitObject, ComponentType, Point, Rotation } from '../model/types';

export const presetCategories = ['Diagrams', 'Resistors', 'Basic circuits', 'RLC', 'Networks'] as const;
export type PresetCategory = (typeof presetCategories)[number];
export interface PresetComponent extends Point {
  key: string;
  type: ComponentType;
  rotation?: Rotation;
  label: string;
  labelOffset?: Point;
  bodyText?: string;
}
export interface PresetJunction extends Point {
  key: string;
  label: string;
  labelOffset?: Point;
}
export type PresetEndpoint = { component: string; terminal: string } | { junction: string };
export interface PresetWire {
  start: PresetEndpoint;
  end: PresetEndpoint;
  vertices?: Point[];
}
/** Thumbnail-only drawing coordinates; the inserted document always uses native objects. */
export interface PresetThumbnail {
  components: { type: ComponentType; x: number; y: number; rotation: number }[];
  paths: string[];
  nodes: Point[];
}
export interface CircuitPreset {
  id: string;
  name: string;
  shortName: string;
  category: PresetCategory;
  keywords: string[];
  components: PresetComponent[];
  junctions: PresetJunction[];
  wires: PresetWire[];
  annotations?: { x: number; y: number; text: string }[];
  thumbnail?: PresetThumbnail;
  /** Fresh native drawing objects, already positioned and rotated for insertion. */
  graphics?: (origin: Point, rotation: Rotation) => CircuitObject[];
}
