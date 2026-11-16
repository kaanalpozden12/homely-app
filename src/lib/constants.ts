// Product settings. Change these to adjust how the app behaves.

/** Where buyers start if they have not entered a postcode (Chelsea, SW3). */
export const DEFAULT_LOCATION = { label: 'SW3', lat: 51.4900, lng: -0.1680 };

export const MAX_PHOTOS = 5;

export type Category = { name: string; short: string; icon: string; hint: string };

export const CATEGORIES: Category[] = [
  { name: 'Furniture', short: 'Furniture', icon: 'sofa-outline', hint: 'Wardrobes, sofas, beds, tables, chairs, shelves' },
  { name: 'Electronics', short: 'Electronics', icon: 'television', hint: 'TVs, laptops, phones, speakers, gaming' },
  { name: 'Kitchen & appliances', short: 'Kitchen', icon: 'microwave', hint: 'Microwaves, kettles, pans, plates, fridges' },
  { name: 'Home & decor', short: 'Decor', icon: 'lamp-outline', hint: 'Rugs, lamps, curtains, mirrors, bedding' },
  { name: 'Kids & baby', short: 'Kids & baby', icon: 'baby-carriage', hint: "Prams, cots, toys, kids' clothes" },
  { name: 'Clothing & shoes', short: 'Clothing', icon: 'tshirt-crew-outline', hint: 'Coats, dresses, shoes, bags' },
  { name: 'Books & study', short: 'Books', icon: 'book-open-page-variant-outline', hint: 'Textbooks, novels, stationery' },
  { name: 'Sports & bikes', short: 'Sports', icon: 'bike', hint: 'Bikes, gym kit, rackets, camping' },
  { name: 'Garden & outdoor', short: 'Garden', icon: 'flower-outline', hint: 'Plants, pots, balcony furniture, BBQs' },
  { name: 'DIY & tools', short: 'DIY & tools', icon: 'hammer-wrench', hint: 'Drills, toolkits, ladders, paint' },
  { name: 'Other', short: 'Other', icon: 'package-variant-closed', hint: "Anything else that's legal and safe to sell" },
];

export const categoryIcon = (name: string) =>
  CATEGORIES.find((c) => c.name === name)?.icon ?? 'package-variant-closed';

export { langCode } from './languages';

export const CONDITIONS = ['Like new', 'Very good', 'Good', 'Fair'];

export const HYGIENE = ['Smoke-free home', 'Pet-free home', 'Cleaned before sale', 'No damp or mould'];

export const RADII: { label: string; value: number | null }[] = [
  { label: '1 mi', value: 1 }, { label: '2 mi', value: 2 }, { label: '3 mi', value: 3 },
  { label: '5 mi', value: 5 }, { label: 'Any', value: null },
];
