type Translations = { [key: string]: string };

export class Translator {
  private translations: { [locale: string]: Translations } = {};
  private currentLocale: string;

  constructor(defaultLocale: string = 'en') {
    this.currentLocale = defaultLocale;
  }

  addTranslations(locale: string, translations: Translations): void {
    this.translations[locale] = translations;
  }

  translate(key: string): string {
    const translation = this.translations[this.currentLocale];
    return translation && translation[key] ? translation[key] : key;
  }

  setLocale(locale: string): void {
    this.currentLocale = locale;
  }
}
