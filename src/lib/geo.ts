// UK postcode lookup using the free postcodes.io service (no key needed).

export type Place = { label: string; outcode: string; lat: number; lng: number };

const FULL = /^([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})$/;
const OUTCODE = /^[A-Z]{1,2}\d[A-Z\d]?$/;

export function normalise(input: string) {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Accepts a full postcode ("SW3 4RY") or just the first half ("SW3"). Returns null if not found. */
export async function lookupPostcode(input: string): Promise<Place | null> {
  const v = normalise(input);
  try {
    const full = v.match(FULL);
    if (full) {
      const r = await fetch(`https://api.postcodes.io/postcodes/${full[1]}${full[2]}`);
      if (!r.ok) return null;
      const j = await r.json();
      const res = j.result;
      return { label: `${full[1]} ${full[2]}`, outcode: res.outcode, lat: res.latitude, lng: res.longitude };
    }
    if (OUTCODE.test(v)) {
      const r = await fetch(`https://api.postcodes.io/outcodes/${v}`);
      if (!r.ok) return null;
      const res = (await r.json()).result;
      return { label: v, outcode: v, lat: res.latitude, lng: res.longitude };
    }
  } catch {
    return null;
  }
  return null;
}

/** Full postcodes only, for sellers: the exact spot is stored privately. */
export const isFullPostcode = (input: string) => FULL.test(normalise(input));
