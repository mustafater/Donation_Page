export type Locale = "tr" | "en";

const STORAGE_KEY = "locale";

export function getInitialLocale(): Locale {
  if (typeof window === "undefined") {
    return "tr";
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "tr" || stored === "en") {
    return stored;
  }

  return navigator.language.toLowerCase().startsWith("en") ? "en" : "tr";
}

export function setLocale(locale: Locale) {
  document.documentElement.lang = locale;
  localStorage.setItem(STORAGE_KEY, locale);
  window.dispatchEvent(new CustomEvent<Locale>("localechange", { detail: locale }));
}

export function subscribeLocale(callback: (locale: Locale) => void) {
  const handler = (event: Event) => {
    callback((event as CustomEvent<Locale>).detail);
  };

  callback(getInitialLocale());
  window.addEventListener("localechange", handler);

  return () => window.removeEventListener("localechange", handler);
}
