// Everything that names the brand lives here, so a new name is a one-file change in the app.
// When the name changes, also update: app.json (name, slug, scheme), public/index.html (title and link
// previews), public/manifest.json, the terms and privacy text (src/components/terms-text.tsx) and the icons.

export const BRAND = {
  /** The name people see, e.g. in buttons and messages. */
  name: 'Loftrobin',
  /** The logo text, split so the second part can be shown in the accent colour. */
  wordmark: ['loft', 'robin'] as const,
  tagline: 'Pre-loved finds from London neighbours who speak your language.',
  city: 'London',
};
