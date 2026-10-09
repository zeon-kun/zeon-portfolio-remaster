import en from "@/locales/en.json";

// Bahasa (id) and Japanese (ja) dictionaries slot in here once they exist.
export type Locale = "en";
export type Dictionary = typeof en;

const DICTIONARIES: Record<Locale, Dictionary> = { en };

export function getDictionary(locale: Locale = "en"): Dictionary {
  return DICTIONARIES[locale];
}

/** Fill `{placeholder}` tokens. Unknown tokens are left as-is so a gap is visible. */
export function format(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}
