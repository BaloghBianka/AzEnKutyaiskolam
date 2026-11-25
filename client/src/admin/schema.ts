import type { SectionKey } from '@shared/types';

export type FieldDef =
  | { t: 'text' | 'date'; label: string; hint?: string }
  | { t: 'textarea'; label: string; hint?: string; big?: boolean }
  | { t: 'image'; label: string; hint?: string }
  | { t: 'images'; label: string; hint?: string }
  | { t: 'strings'; label: string; hint?: string }
  | { t: 'check'; label: string; hint?: string }
  | { t: 'select'; label: string; hint?: string; options: [string, string][] }
  | { t: 'group'; label: string; fields: Fields }
  | { t: 'list'; label: string; addLabel: string; addTop?: boolean; open?: boolean; bulkImages?: boolean; titleKey: string; imgKey?: string; newItem: () => Record<string, unknown>; fields: Fields };
export type Fields = Record<string, FieldDef>;

export interface SectionDef { key: SectionKey | 'members' | 'trainer' | 'push'; title: string; view: string; help?: string; fields?: Fields; custom?: boolean }
export type SchemaEntry = SectionDef | { group: string };

const T = (label: string, hint?: string): FieldDef => ({ t: 'text', label, hint });
const TA = (label: string, hint?: string, big?: boolean): FieldDef => ({ t: 'textarea', label, hint, big });
const IMG = (label: string, hint?: string): FieldDef => ({ t: 'image', label, hint });
const FORMAT_HINT = 'Üres sor = új bekezdés. Sor eleji "- " = felsorolás. "## " = alcím. **félkövér**. Link: [szöveg](https://...)';
const ICONS: [string, string][] = [['poraz', 'Póráz'], ['vissza', 'Visszahívás'], ['ugras', 'Ugrálás'], ['figyelem', 'Figyelem'], ['sziv', 'Szív'], ['villam', 'Villám'], ['csillag', 'Csillag']];

export const SCHEMA: SchemaEntry[] = [
  { group: 'Tagok' },
  { key: 'members', title: 'Tagok és bérletek', view: '/tagoknak', custom: true },
  { key: 'trainer', title: 'Bérlet-szkennelés', view: '/kikepzo', custom: true },
  { key: 'push', title: 'Értesítések', view: '/tagoknak', custom: true },
  { group: 'Tartalom' },
  { key: 'news', title: 'Hírek', view: '/hirek', help: 'Új hír: „Új hír hozzáadása”, töltsd ki, majd Mentés. A legújabb dátumú hír kerül előre.', fields: {
    items: { t: 'list', label: 'Hírek', addLabel: 'Új hír hozzáadása', addTop: true, titleKey: 'title', imgKey: 'image',
      newItem: () => ({ id: '', title: 'Új hír', date: new Date().toISOString().slice(0, 10), label: '', image: '', excerpt: '', body: '', facts: '', warning: '' }),
      fields: { title: T('Cím'), date: { t: 'date', label: 'Dátum' }, label: T('Címke', 'Pl. Vizsga, Rendezvény, Fontos'), image: IMG('Kép'),
        excerpt: TA('Rövid bevezető', 'A hírek listájában jelenik meg.'), body: TA('Teljes szöveg', FORMAT_HINT, true),
        facts: TA('Fontos adatok (oldalsáv)', 'Soronként egy: "Megnevezés: érték". Pl. Határidő: szerda éjfél'), warning: TA('Figyelmeztetés (piros doboz)', 'Ha üres, nem jelenik meg.') } } } },
  { key: 'events', title: 'Rendezvények', view: '/rendezvenyek', fields: {
    pageImage: IMG('Oldal fejléckép'), intro: TA('Bevezető szöveg'),
    items: { t: 'list', label: 'Rendezvények', addLabel: 'Új rendezvény', addTop: true, titleKey: 'title', imgKey: 'images',
      newItem: () => ({ title: 'Új rendezvény', when: '', text: '', images: [], link: '', linkText: '' }),
      fields: { title: T('Név'), when: T('Időpont', 'Pl. 2026. december 6., szombat 10:00'), text: TA('Leírás'), images: { t: 'images', label: 'Képek', hint: 'Az első 3 kép jelenik meg a kártyán.' },
        link: T('Link (nem kötelező)', 'https://... vagy /hirek/...'), linkText: T('Link szövege') } },
    videoTitle: T('Videó címe'), videoText: T('Videó leírása'), videoUrl: T('Videó linkje', 'Ha üres, a videósáv nem jelenik meg.') } },
  { key: 'gallery', title: 'Galéria', view: '/galeria', help: 'Több képet is kijelölhetsz egyszerre a „+ Képek feltöltése” gombbal.', fields: {
    intro: TA('Bevezető szöveg'),
    items: { t: 'list', label: 'Képek', addLabel: '', bulkImages: true, titleKey: 'caption', imgKey: 'image', newItem: () => ({ image: '', caption: '' }),
      fields: { image: IMG('Kép'), caption: T('Képaláírás') } } } },
  { group: 'Oldalak' },
  { key: 'home', title: 'Főoldal', view: '/', fields: {
    _hero: { t: 'group', label: 'Nyitókép', fields: { badge: T('Felső kis felirat'), heroTitle1: T('Főcím 1. sor (fehér)'), heroTitle2: T('Főcím 2. sor (piros)'), heroText: TA('Szöveg a cím alatt'), heroImages: { t: 'images', label: 'Háttérképek', hint: '4 kép ajánlott. Mobilon csak az első látszik.' } } },
    stats: { t: 'list', label: 'Számok a nyitókép alatt', addLabel: 'Új szám', titleKey: 'label', newItem: () => ({ value: '', suffix: '', label: '' }),
      fields: { value: T('Szám', 'Csak számjegy esetén pörög fel.'), suffix: T('Utótag', 'Pl. + vagy %'), label: T('Felirat') } },
    _why: { t: 'group', label: 'Miért mi?', fields: { whyTitle: T('Cím (fekete rész)'), whyTitleRed: T('Cím (piros rész)'), whyText: TA('Szöveg'), whyImage: IMG('Kép'), whyBadge: T('Kép melletti doboz címe'), whyBadgeText: T('Kép melletti doboz szövege'), whyPoints: { t: 'strings', label: 'Pipás pontok' } } },
    marquee: { t: 'strings', label: 'Futó sáv szavai' },
    _pr: { t: 'group', label: 'Problémás esetek', fields: { problemsTitle: T('Cím'), problemsText: TA('Bevezető') } },
    problems: { t: 'list', label: 'Esetek', addLabel: 'Új eset', titleKey: 'quote', newItem: () => ({ icon: 'csillag', quote: '', why: '', fix: '', course: '' }),
      fields: { icon: { t: 'select', label: 'Ikon', options: ICONS }, quote: T('A gazdi mondata'), why: TA('Miért csinálja?'), fix: TA('Nálunk így megy'), course: T('Ajánlott képzés') } },
    _j: { t: 'group', label: 'Az út (3 hónap)', fields: { journeyTitle: T('Cím'), journeyText: TA('Szöveg'), journeyImage: IMG('Háttérkép') } },
    journey: { t: 'list', label: 'Lépések', addLabel: 'Új lépés', titleKey: 'title', newItem: () => ({ label: '', title: '', text: '' }),
      fields: { label: T('Időszak'), title: T('Cím'), text: TA('Szöveg') } } } },
  { key: 'courses', title: 'Képzések', view: '/kepzesek', fields: {
    pageImage: IMG('Oldal fejléckép'), intro: TA('Bevezető'),
    items: { t: 'list', label: 'Képzések', addLabel: 'Új képzés', titleKey: 'title', imgKey: 'image', newItem: () => ({ title: 'Új képzés', age: '', image: '', text: '', for: '', tags: '' }),
      fields: { title: T('Név'), age: T('Piros címke a képen', 'Pl. 3-7 hónap'), image: IMG('Kép'), text: TA('Leírás'), for: T('Kinek ajánlott?'), tags: T('Címkék', 'Függőleges vonallal elválasztva: Vasárnap 11:00 | folyamatos kezdés') } },
    note: TA('Megjegyzés a kártyák alatt'),
    levels: { t: 'list', label: 'Képzési rend lépései', addLabel: 'Új szint', titleKey: 'title', newItem: () => ({ title: '', text: '' }), fields: { title: T('Szint'), text: TA('Leírás') } } } },
  { key: 'schedule', title: 'Órarend', view: '/kepzesek#orarend', fields: {
    title: T('Cím'), text: TA('Szöveg'),
    rows: { t: 'list', label: 'Órák', addLabel: 'Új óra', titleKey: 'name', open: true, newItem: () => ({ time: '', name: '', note: '' }),
      fields: { time: T('Időpont', 'Pl. 09:00-10:30'), name: T('Foglalkozás'), note: T('Megjegyzés', 'Pl. Vasárnap') } } } },
  { key: 'trainers', title: 'Oktatók', view: '/oktatok', fields: {
    pageImage: IMG('Oldal fejléckép'), intro: TA('Bevezető'),
    items: { t: 'list', label: 'Oktatók', addLabel: 'Új oktató', titleKey: 'name', imgKey: 'image', newItem: () => ({ name: '', role: '', image: '', text: '', memorial: false }),
      fields: { name: T('Név'), role: T('Titulus'), image: IMG('Fotó', 'Négyzetes kép ajánlott.'), text: TA('Bemutatkozás'), memorial: { t: 'check', label: 'Emlékdoboz (fekete, teljes szélesség)' } } } } },
  { key: 'reviews', title: 'Vélemények', view: '/', help: 'Csak valódi gazdi-véleményt tegyél ki. A „Minta” jelölésű elemeken MINTA felirat látszik.', fields: {
    title: T('Cím'), intro: TA('Bevezető'),
    items: { t: 'list', label: 'Vélemények', addLabel: 'Új vélemény', titleKey: 'name', newItem: () => ({ text: '', name: '', detail: '', sample: false }),
      fields: { text: TA('Vélemény szövege'), name: T('Gazdi neve'), detail: T('Kutya / képzés', 'Pl. és Bodri, Engedelmes E'), sample: { t: 'check', label: 'Minta (MINTA felirat látszik)' } } } } },
  { key: 'faq', title: 'GYIK és házirend', view: '/gyik', fields: {
    items: { t: 'list', label: 'Kérdések', addLabel: 'Új kérdés', titleKey: 'q', newItem: () => ({ q: '', a: '' }), fields: { q: T('Kérdés'), a: TA('Válasz', FORMAT_HINT) } },
    rules: { t: 'strings', label: 'Házirend pontjai' },
    equipment: { t: 'list', label: 'Felszerelés', addLabel: 'Új tétel', titleKey: 'text', open: true, newItem: () => ({ text: '', no: false }), fields: { text: T('Tétel'), no: { t: 'check', label: 'Tilos (piros X)' } } } } },
  { group: 'Beállítások' },
  { key: 'site', title: 'Elérhetőség, általános', view: '/kapcsolat', fields: {
    _a: { t: 'group', label: 'Alapadatok', fields: { name: T('Név'), tagline: T('Alcím a logó mellett'), logo: IMG('Logó', 'Fehér, átlátszó hátterű kép.') } },
    _b: { t: 'group', label: 'Elérhetőség', fields: { phone1: T('Telefon 1'), phone2: T('Telefon 2'), email: T('E-mail cím'), facebook: T('Facebook-oldal linkje'), address: T('Teljes cím'), addressShort: T('Rövid cím (felső sáv)'), hours: T('Nyitvatartás'), byCar: TA('Megközelítés autóval'), byBus: TA('Megközelítés busszal'), lat: T('GPS szélesség'), lng: T('GPS hosszúság') } },
    _d: { t: 'group', label: 'Adó 1% felhívás (főoldal)', fields: { onePercentTitle: T('Cím', 'Ha üres, a blokk nem jelenik meg.'), onePercentText: TA('Szöveg'), onePercentImage: IMG('Kép') } },
    _c: { t: 'group', label: 'Lábléc és felhívás', fields: { ctaTitle: T('Piros felhívás címe'), ctaText: TA('Piros felhívás szövege'), footerText: TA('Lábléc szöveg'), association: T('Egyesület neve'), taxId: T('Adószám'), bank: T('Bankszámla'), privacyUrl: T('Adatkezelési tájékoztató linkje') } } } }
];
export const isSection = (e: SchemaEntry): e is SectionDef => 'key' in e;
