// The search-area map on the web: a free OpenStreetMap map centred on the buyer's postcode,
// with a circle they can resize by dragging the white handle (or by tapping the map).
// Only the buyer's own postcode is shown; sellers never appear on this map.
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import { formatMiles, snapMiles } from '@/lib/miles';
import { C, R, shadow } from '@/lib/theme';

export type RadiusMapProps = { lat: number; lng: number; radius: number | null; onChange: (miles: number) => void };

const METRES_PER_MILE = 1609.344;
const PREVIEW_MILES = 3; // where the handle sits while "Any distance" is chosen

const CSS = `
.lr-map { background: ${C.sunken}; font-family: inherit; }
.lr-map .leaflet-tile-pane { filter: saturate(0.6) brightness(1.03) contrast(0.96); }
.lr-map .leaflet-control-attribution { font: 10px/1.4 system-ui, sans-serif; background: rgba(255,255,255,0.8); border-top-left-radius: 6px; }
.lr-handle { touch-action: none; cursor: grab; }
.lr-handle:active { cursor: grabbing; }
.lr-handle > div { width: 30px; height: 30px; border-radius: 50%; background: #fff; border: 2.5px solid ${C.accent};
  box-shadow: 0 2px 8px rgba(22,32,28,0.25); display: flex; align-items: center; justify-content: center;
  color: ${C.accent}; font: 700 14px/1 system-ui, sans-serif; box-sizing: border-box; }
.lr-dot > div { width: 16px; height: 16px; border-radius: 50%; background: ${C.accent}; border: 3px solid #fff;
  box-shadow: 0 1px 4px rgba(22,32,28,0.35); box-sizing: border-box; }
`;

function injectCss() {
  if (document.getElementById('lr-map-css')) return;
  const el = document.createElement('style');
  el.id = 'lr-map-css';
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** The point due east of the centre at the given distance, where the handle sits. */
const eastOf = (c: L.LatLng, miles: number) =>
  L.latLng(c.lat, c.lng + (miles * METRES_PER_MILE) / (111320 * Math.cos((c.lat * Math.PI) / 180)));

export function RadiusMap({ lat, lng, radius, onChange }: RadiusMapProps) {
  const box = useRef<HTMLElement | null>(null); // on the web a View is a <div>
  const parts = useRef<{ map: L.Map; circle: L.Circle; dot: L.Marker; handle: L.Marker } | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [live, setLive] = useState<number | null>(null); // miles while dragging

  const shown = live ?? radius ?? PREVIEW_MILES;
  const anyDistance = radius === null && live === null;

  // Build the map once.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    injectCss();
    const centre = L.latLng(lat, lng);
    const map = L.map(el, {
      center: centre, zoom: 13, zoomSnap: 0.25, zoomControl: false, attributionControl: true,
      // The map stays put so the page scrolls normally on phones; only the handle moves.
      dragging: false, touchZoom: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false,
    });
    map.attributionControl.setPrefix(false);
    el.classList.add('lr-map');
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(map);

    const miles = radius ?? PREVIEW_MILES;
    const circle = L.circle(centre, { radius: miles * METRES_PER_MILE, color: C.accent, weight: 2, fillColor: C.accent, fillOpacity: 0.12, interactive: false }).addTo(map);
    const dot = L.marker(centre, { icon: L.divIcon({ className: 'lr-dot', html: '<div></div>', iconSize: [16, 16] }), interactive: false, keyboard: false }).addTo(map);
    const handle = L.marker(eastOf(centre, miles), {
      draggable: true, autoPan: false, keyboard: false, title: 'Drag to change the search area',
      icon: L.divIcon({ className: 'lr-handle', html: '<div>&harr;</div>', iconSize: [30, 30] }),
    }).addTo(map);

    const milesAt = (p: L.LatLng) => snapMiles(map.distance(circle.getLatLng(), p) / METRES_PER_MILE);
    const fit = (m: number) => map.fitBounds(circle.setRadius(m * METRES_PER_MILE).getBounds(), { padding: [34, 34], animate: true });
    const commit = (m: number) => {
      handle.setLatLng(eastOf(circle.getLatLng(), m));
      setLive(null);
      fit(m);
      onChangeRef.current(m);
    };

    handle.on('drag', () => {
      const m = milesAt(handle.getLatLng());
      circle.setRadius(m * METRES_PER_MILE);
      setLive(m);
    });
    handle.on('dragend', () => commit(milesAt(handle.getLatLng())));
    map.on('click', (e: L.LeafletMouseEvent) => commit(milesAt(e.latlng)));

    map.fitBounds(circle.getBounds(), { padding: [34, 34], animate: false });
    parts.current = { map, circle, dot, handle };
    // The map may be laid out after it is created; make sure it fills its box.
    const ro = new ResizeObserver(() => { map.invalidateSize(); map.fitBounds(circle.getBounds(), { padding: [34, 34], animate: false }); });
    ro.observe(el);
    return () => { ro.disconnect(); map.remove(); parts.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow a new postcode or a distance picked from the chips.
  useEffect(() => {
    const p = parts.current;
    if (!p) return;
    const centre = L.latLng(lat, lng);
    const miles = radius ?? PREVIEW_MILES;
    p.circle.setLatLng(centre).setRadius(miles * METRES_PER_MILE);
    p.circle.setStyle({ dashArray: radius === null ? '6 6' : undefined, fillOpacity: radius === null ? 0.04 : 0.12 });
    p.dot.setLatLng(centre);
    p.handle.setLatLng(eastOf(centre, miles));
    p.map.fitBounds(p.circle.getBounds(), { padding: [34, 34], animate: true });
  }, [lat, lng, radius]);

  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ height: 260, borderRadius: R.lg, overflow: 'hidden', borderWidth: 1, borderColor: C.line, backgroundColor: C.sunken }}>
        <View ref={box as never} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        <View pointerEvents="none" style={[{ position: 'absolute', top: 10, left: 10, zIndex: 1000, flexDirection: 'row', alignItems: 'center', gap: 6,
          backgroundColor: C.surface, borderRadius: R.pill, paddingVertical: 6, paddingHorizontal: 11 }, shadow(1)]}>
          <Icon name="map-marker-radius-outline" size={16} color={C.accent} />
          <Text style={{ fontSize: 13.5, fontWeight: '700', color: C.ink }}>
            {anyDistance ? 'Any distance' : `Within ${formatMiles(shown)}`}
          </Text>
        </View>
      </View>
      <Text style={{ fontSize: 12.5, color: C.muted, marginTop: 7 }}>
        Drag the white handle to make the circle bigger or smaller, or tap the map.
      </Text>
    </View>
  );
}
