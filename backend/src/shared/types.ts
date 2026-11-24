export interface Site {
  name: string; tagline: string; logo: string;
  phone1: string; phone2: string; email?: string; facebook?: string;
  address: string; addressShort: string; hours: string;
  byCar: string; byBus: string; lat: string; lng: string;
  association: string; taxId: string; bank: string; privacyUrl: string;
  footerText: string; ctaTitle: string; ctaText: string;
  onePercentTitle?: string; onePercentText?: string; onePercentImage?: string;
}
export interface Stat { value: string; suffix: string; label: string }
export interface Problem { icon: string; quote: string; why: string; fix: string; course: string }
export interface JourneyStep { label: string; title: string; text: string }
export interface Home {
  badge: string; heroTitle1: string; heroTitle2: string; heroText: string; heroImages: string[];
  stats: Stat[];
  whyTitle: string; whyTitleRed: string; whyText: string; whyImage: string; whyBadge: string; whyBadgeText: string; whyPoints: string[];
  marquee: string[];
  problemsTitle: string; problemsText: string; problems: Problem[];
  journeyTitle: string; journeyText: string; journeyImage: string; journey: JourneyStep[];
}
export interface Course { title: string; age: string; image: string; text: string; for: string; tags: string }
export interface Courses { pageImage: string; intro: string; items: Course[]; note: string; levels: { title: string; text: string }[] }
export interface Schedule { title: string; text: string; rows: { time: string; name: string; note: string }[] }
export interface Trainer { name: string; role: string; image: string; text: string; memorial: boolean }
export interface Trainers { pageImage: string; intro: string; items: Trainer[] }
export interface Review { text: string; name: string; detail: string; sample: boolean }
export interface Reviews { title: string; intro: string; items: Review[] }
export interface Faq { items: { q: string; a: string }[]; rules: string[]; equipment: { text: string; no: boolean }[] }
export interface NewsItem { id: string; title: string; date: string; label: string; image: string; excerpt: string; body: string; facts: string; warning: string }
export interface EventItem { title: string; when: string; text: string; images: string[]; link: string; linkText: string }
export interface Events { pageImage: string; intro: string; items: EventItem[]; videoTitle: string; videoText: string; videoUrl: string }
export interface Gallery { intro: string; items: { image: string; caption: string }[] }

export interface Content {
  site: Site; home: Home; courses: Courses; schedule: Schedule; trainers: Trainers;
  reviews: Reviews; faq: Faq; news: { items: NewsItem[] }; events: Events; gallery: Gallery;
}
export type SectionKey = keyof Content;
export const SECTIONS: SectionKey[] = ['site', 'home', 'courses', 'schedule', 'trainers', 'reviews', 'faq', 'news', 'events', 'gallery'];

export interface Pass {
  id: string; token: string; type: string; dog: string; start: string; end: string;
  total: number; used: string[]; paid: boolean; note: string;
}
export type MemberPass = Omit<Pass, 'note'>;
export interface MemberView { name: string; email: string; dogs: string; passes: MemberPass[] }
export interface AdminMember {
  id: string; name: string; email: string; phone: string; dogs: string; note: string;
  passes: Pass[]; created: string; hasPassword: boolean;
}
export interface TrainerAccount { id: string; name: string; username: string; active: boolean; created: string }
export interface TodayItem { name: string; dog: string; type: string; left: number | null; by: string }
export interface TrainerPassView {
  name: string; dog: string; type: string; start: string; end: string; total: number; used: number;
  left: number | null; paid: boolean; usedToday: number; lastUsed: string; problem: string | null; note: string;
}
export interface LogEntry {
  t: string; by: string; role: string; action: string; ip: string;
  member?: string; memberId?: string; dog?: string; passId?: string; pass?: string; date?: string;
  trainer?: string; section?: string; reason?: string; left?: number | null; count?: number;
}
export interface SessionInfo { member: { name: string } | null; trainer: { name: string } | null; admin: boolean }
