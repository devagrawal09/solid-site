import * as i18n from '@solid-primitives/i18n';
import * as storage from '@solid-primitives/storage';
import * as router from '@solidjs/router';
import {
  ParentComponent,
  Loading,
  createContext,
  createEffect,
  createMemo,
  createUniqueId,
  useContext,
  untrack,
} from 'solid-js';
import { createStore } from 'solid-js';
import { Meta, Title } from '@solidjs/meta';

// en dictionary is loaded by default
import { dict as en_dict } from '../lang/en/en';

type RawDictionary = typeof en_dict;

export type Locale =
  | 'en'
  | 'az'
  | 'it'
  | 'de'
  | 'pt'
  | 'ja'
  | 'fr'
  | 'id'
  | 'he'
  | 'ru'
  | 'ar'
  | 'fa'
  | 'tr'
  | 'tl'
  | 'ko-kr'
  | 'zh-cn'
  | 'zh-tw'
  | 'es'
  | 'pl'
  | 'uk';

/*
for validating of other dictionaries have same keys as en dictionary
some might be missing, but the shape should be the same
*/
type DeepPartial<T> =
  T extends Record<string, unknown>
    ? { [K in keyof T]?: DeepPartial<T[K]> } & Record<string, unknown>
    : T;

const raw_dict_map: Record<Locale, () => Promise<{ dict: DeepPartial<RawDictionary> }>> = {
  en: () => Promise.resolve({ dict: en_dict }),
  az: () => import('../lang/az/az'),
  it: () => import('../lang/it/it'),
  de: () => import('../lang/de/de'),
  pt: () => import('../lang/pt/pt'),
  ja: () => import('../lang/ja/ja'),
  fr: () => import('../lang/fr/fr'),
  id: () => import('../lang/id/id'),
  he: () => import('../lang/he/he'),
  ru: () => import('../lang/ru/ru'),
  ar: () => import('../lang/ar/ar'),
  fa: () => import('../lang/fa/fa'),
  tr: () => import('../lang/tr/tr'),
  tl: () => import('../lang/tl/tl'),
  'ko-kr': () => import('../lang/ko-kr/ko-kr'),
  'zh-cn': () => import('../lang/zh-cn/zh-cn'),
  'zh-tw': () => import('../lang/zh-tw/zh-tw'),
  es: () => import('../lang/es/es'),
  pl: () => import('../lang/pl/pl'),
  uk: () => import('../lang/uk/uk'),
};

export type Dictionary = i18n.Flatten<RawDictionary>;

const en_flat_dict: Dictionary = i18n.flatten(en_dict);

async function fetchDictionary(locale: Locale): Promise<Dictionary> {
  if (locale === 'en') return en_flat_dict;

  const { dict } = await raw_dict_map[locale]();
  const flat_dict = i18n.flatten(dict) as RawDictionary;
  return { ...en_flat_dict, ...flat_dict };
}

// Some browsers does not map correctly to some locale code
// due to offering multiple locale code for similar language (e.g. tl and fil)
// This object maps it to correct `langs` key
const LANG_ALIASES: Partial<Record<string, Locale>> = {
  fil: 'tl',
};

const toLocale = (string: unknown): Locale | undefined =>
  typeof string !== 'string'
    ? undefined
    : string in raw_dict_map
      ? (string as Locale)
      : string in LANG_ALIASES
        ? (LANG_ALIASES[string] as Locale)
        : undefined;

interface Settings {
  locale: Locale;
  dark: boolean;
}

function initialLocale(location: router.Location): Locale {
  let locale: Locale | undefined;

  locale = toLocale(location.query.locale);
  if (locale) return locale;

  locale = toLocale(navigator.language.slice(0, 2));
  if (locale) return locale;

  locale = toLocale(navigator.language.toLocaleLowerCase());
  if (locale) return locale;

  return 'en';
}

function initialSettings(location: router.Location): Settings {
  return {
    locale: initialLocale(location),
    dark: window.matchMedia('(prefers-color-scheme: dark)').matches,
  };
}

function deserializeSettings(value: string, location: router.Location): Settings {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return initialSettings(location);
  }
  if (!parsed || typeof parsed !== 'object') return initialSettings(location);

  return {
    locale:
      ('locale' in parsed && typeof parsed.locale === 'string' && toLocale(parsed.locale)) ||
      initialLocale(location),
    dark: 'dark' in parsed && typeof parsed.dark === 'boolean' ? parsed.dark : false,
  };
}

interface AppState {
  get isDark(): boolean;
  setDark(value: boolean): void;
  get locale(): Locale;
  setLocale(value: Locale): void;
  t: i18n.Translator<Dictionary>;
  get dir(): 'ltr' | 'rtl';
}

const AppContext = createContext<AppState>();

export const useAppState = () => useContext(AppContext);

export const AppContextProvider: ParentComponent = (props) => {
  const location = router.useLocation();

  const now = new Date();
  const cookieOptions: storage.CookieOptions = {
    path: '/',
    expires: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
  };

  // Restore before creating the store: initialization must not write from a component.
  // Keep makePersisted's cookie naming so existing preferences remain readable.
  const settingsKey = `storage-${createUniqueId()}`;
  const [settings, set] = createStore(
    untrack(() => {
      const persisted = storage.cookieStorage.getItem(settingsKey, cookieOptions);
      return persisted ? deserializeSettings(persisted, location) : initialSettings(location);
    }),
  );
  createEffect(
    () => ({ locale: settings.locale, dark: settings.dark }),
    (value) => storage.cookieStorage.setItem(settingsKey, JSON.stringify(value), cookieOptions),
  );

  const locale = () => settings.locale;

  const dict = createMemo(() => (locale() === 'en' ? en_flat_dict : fetchDictionary(locale())));

  createEffect(locale, (value) => {
    document.documentElement.lang = value;
  });

  createEffect(
    () => settings.dark,
    (dark) => {
      document.documentElement.classList.toggle('dark', dark);
    },
  );

  const t = i18n.translator(dict, i18n.resolveTemplate);

  const state: AppState = {
    get isDark() {
      return settings.dark;
    },
    setDark(value) {
      set((draft) => {
        draft.dark = value;
      });
    },
    get locale() {
      return settings.locale;
    },
    setLocale(value) {
      set((draft) => {
        draft.locale = value;
      });
    },
    t,
    get dir() {
      return t('global.dir') === 'ltr' ? 'ltr' : 'rtl';
    },
  };

  return (
    <Loading>
      <AppContext value={state}>
        <Title>{t('global.title')}</Title>
        <Meta name="lang" content={locale()} />
        <div dir={state.dir}>{props.children}</div>
      </AppContext>
    </Loading>
  );
};
