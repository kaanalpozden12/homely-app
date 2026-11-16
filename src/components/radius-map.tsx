// Phone apps (iOS / Android): no map yet, the distance chips set the search area.
// The web version, with the draggable circle, lives in radius-map.web.tsx.

export type RadiusMapProps = {
  lat: number;
  lng: number;
  /** Miles, or null for "any distance". */
  radius: number | null;
  onChange: (miles: number) => void;
  /** The buyer dragged the circle to a new centre. */
  onMove: (lat: number, lng: number) => void;
};

export function RadiusMap(_: RadiusMapProps) {
  return null;
}
