// UI strings for Great Guide. To add a language, add a key to STRINGS and to
// SUPPORTED. POI / interest content is held in data/pois.js (already bilingual).
//
// Future-ready: 'es', 'fr', 'de', 'zh' slots are reserved — add the dictionary
// keys (mirroring 'en') and the language picker will surface them automatically.

export const SUPPORTED = [
  { id: 'en', label: 'English',     short: 'EN', enabled: true },
  { id: 'pt', label: 'Português',   short: 'PT', enabled: true },
  { id: 'es', label: 'Español',     short: 'ES', enabled: false },
  { id: 'fr', label: 'Français',    short: 'FR', enabled: false },
  { id: 'de', label: 'Deutsch',     short: 'DE', enabled: false },
  { id: 'zh', label: '中文',         short: 'ZH', enabled: false },
];

export const STRINGS = {
  en: {
    appName: 'Great Guide',
    poweredBy: 'Powered by Great Guide',

    welcome: {
      eyebrow: 'A bespoke private tour',
      title: 'Discover the city the way you want to.',
      lede: "Tell us a little about you and what you love. We'll design a tour that fits your time, your interests, and your party.",
      cta: 'Start',
      duration: 'About 90 seconds',
    },

    nav: {
      step1: 'About you',
      step2: 'Interests',
      step3: 'Tour',
    },

    profile: {
      title: 'About you',
      sub: "Just so we know who's coming.",
      name: 'Your name',
      namePh: 'First & last',
      email: 'Email',
      emailPh: 'you@example.com',
      homeCity: 'Where are you from?',
      homeCityPh: 'City, Country',
      arrival: 'When do you arrive?',
      partySize: 'Party size',
      partySizePh: 'How many people?',
      next: 'Continue',
    },

    interests: {
      title: 'What do you love?',
      sub: 'Drag the slider to weight each one (1 = mild interest, 5 = must-do). Skip anything that doesn\'t apply.',
      slider: 'Importance',
      noInterest: 'Not interested',
      mild: 'Mild',
      strong: 'Strong',
      mustDo: 'Must do',
      addCustom: '+ Add your own',
      addCustomPh: 'e.g. local theater, vintage cars, rock climbing…',
      addCustomBtn: 'Add',
      duration: 'How long do you want the tour to be?',
      hours: 'hours',
      hour: 'hour',
      back: 'Back',
      next: 'Generate my tour',
      validateAtLeastOne: 'Pick at least one interest above to continue.',
    },

    tour: {
      generating: 'Designing your tour…',
      generatingSub: 'Matching {n} interests across {m} hand-picked stops.',
      title: 'Your tour',
      subtitle: '{hours} • {stops} stops • {start}',
      addGuest: 'Add another guest',
      addGuestSub: "Different interests? Add them and we'll re-balance the tour.",
      addGuestEmail: 'Their email',
      addGuestEmailPh: 'guest@example.com',
      addGuestName: 'Their name',
      addGuestNamePh: 'First & last',
      addGuestSend: 'Send them their interest form',
      addGuestSent: "Sent. Once they fill it out we'll regenerate the tour.",
      stops: 'Stops',
      transport: 'Getting there',
      duration: 'Duration',
      script: 'Tap a stop for the full story',
      done: 'All set',
      doneSub: "We've emailed your guide and they'll meet you on arrival.",
      shareLink: 'Share this tour',
      copyLink: 'Copy link',
      copied: 'Copied',
      emailGuide: 'Email itinerary to guide',
      tourId: 'Tour ID',
    },

    transport: {
      foot: 'on foot',
      taxi: 'by taxi',
      car: 'by private car',
      boat: 'by boat',
      bike: 'by bicycle',
    },

    guide: {
      login: 'Guide login',
      password: 'Password',
      passwordPh: 'Enter access code',
      signIn: 'Sign in',
      wrongPassword: 'Incorrect password.',
      tours: 'Tours',
      noTours: 'No tours yet. Tours guests create here will appear in this list.',
      backToTours: '← All tours',
      guests: 'Guests',
      arriving: 'Arriving',
      duration: 'Duration',
      created: 'Created',
      itinerary: 'Itinerary',
      script: 'Storytelling script',
      stopOf: 'Stop {n} of {total}',
      arrive: 'Arrive',
      leave: 'Leave',
      logout: 'Log out',
      printItinerary: 'Print',
    },

    common: {
      required: 'Required',
      retry: 'Retry',
      close: 'Close',
      language: 'Language',
    },
  },

  pt: {
    appName: 'Great Guide',
    poweredBy: 'Powered by Great Guide',

    welcome: {
      eyebrow: 'Um tour particular sob medida',
      title: 'Conheça a cidade do seu jeito.',
      lede: 'Conte um pouco sobre você e o que você gosta. Vamos desenhar um tour que se encaixa no seu tempo, nos seus interesses e na sua família.',
      cta: 'Começar',
      duration: 'Cerca de 90 segundos',
    },

    nav: {
      step1: 'Você',
      step2: 'Interesses',
      step3: 'Tour',
    },

    profile: {
      title: 'Sobre você',
      sub: 'Só para saber quem vem.',
      name: 'Seu nome',
      namePh: 'Nome e sobrenome',
      email: 'E-mail',
      emailPh: 'voce@exemplo.com',
      homeCity: 'De onde você é?',
      homeCityPh: 'Cidade, País',
      arrival: 'Quando você chega?',
      partySize: 'Pessoas no grupo',
      partySizePh: 'Quantas pessoas?',
      next: 'Continuar',
    },

    interests: {
      title: 'Do que você gosta?',
      sub: 'Arraste o slider para indicar o peso (1 = curiosidade, 5 = obrigatório). Pule o que não se aplica.',
      slider: 'Importância',
      noInterest: 'Sem interesse',
      mild: 'Leve',
      strong: 'Forte',
      mustDo: 'Obrigatório',
      addCustom: '+ Adicionar próprio',
      addCustomPh: 'ex.: teatro local, carros antigos, escalada…',
      addCustomBtn: 'Adicionar',
      duration: 'Quantas horas você quer de tour?',
      hours: 'horas',
      hour: 'hora',
      back: 'Voltar',
      next: 'Gerar meu tour',
      validateAtLeastOne: 'Escolha pelo menos um interesse acima.',
    },

    tour: {
      generating: 'Desenhando seu tour…',
      generatingSub: 'Cruzando {n} interesses com {m} paradas selecionadas.',
      title: 'Seu tour',
      subtitle: '{hours} • {stops} paradas • {start}',
      addGuest: 'Adicionar outro hóspede',
      addGuestSub: 'Interesses diferentes? Adicione e vamos rebalancear o tour.',
      addGuestEmail: 'E-mail dele(a)',
      addGuestEmailPh: 'hospede@exemplo.com',
      addGuestName: 'Nome',
      addGuestNamePh: 'Nome e sobrenome',
      addGuestSend: 'Enviar formulário de interesses',
      addGuestSent: 'Enviado. Assim que preencher, refaremos o tour.',
      stops: 'Paradas',
      transport: 'Como chegar',
      duration: 'Duração',
      script: 'Toque numa parada para ver o roteiro completo',
      done: 'Pronto',
      doneSub: 'Enviamos para seu guia, que vai te encontrar na chegada.',
      shareLink: 'Compartilhar tour',
      copyLink: 'Copiar link',
      copied: 'Copiado',
      emailGuide: 'Enviar roteiro ao guia',
      tourId: 'ID do tour',
    },

    transport: {
      foot: 'a pé',
      taxi: 'de táxi',
      car: 'de carro privado',
      boat: 'de barco',
      bike: 'de bicicleta',
    },

    guide: {
      login: 'Login do guia',
      password: 'Senha',
      passwordPh: 'Código de acesso',
      signIn: 'Entrar',
      wrongPassword: 'Senha incorreta.',
      tours: 'Tours',
      noTours: 'Nenhum tour ainda. Tours criados aqui vão aparecer nesta lista.',
      backToTours: '← Todos os tours',
      guests: 'Hóspedes',
      arriving: 'Chegando',
      duration: 'Duração',
      created: 'Criado',
      itinerary: 'Roteiro',
      script: 'Texto de apresentação',
      stopOf: 'Parada {n} de {total}',
      arrive: 'Chegar',
      leave: 'Sair',
      logout: 'Sair',
      printItinerary: 'Imprimir',
    },

    common: {
      required: 'Obrigatório',
      retry: 'Tentar novamente',
      close: 'Fechar',
      language: 'Idioma',
    },
  },
};

// Get current language. Order: ?lang=, localStorage, browser, default 'en'.
export function getLang() {
  const url = new URL(window.location.href);
  const fromQuery = url.searchParams.get('lang');
  if (fromQuery && STRINGS[fromQuery]) return fromQuery;

  try {
    const saved = localStorage.getItem('greatguide.lang');
    if (saved && STRINGS[saved]) return saved;
  } catch {}

  const browser = (navigator.language || 'en').toLowerCase();
  if (browser.startsWith('pt')) return 'pt';
  return 'en';
}

export function setLang(lang) {
  if (!STRINGS[lang]) return;
  try { localStorage.setItem('greatguide.lang', lang); } catch {}
  document.documentElement.setAttribute('data-lang', lang);
  document.documentElement.setAttribute('lang', lang === 'pt' ? 'pt-BR' : lang);
  window.dispatchEvent(new CustomEvent('greatguide:lang', { detail: { lang } }));
}

// Lookup with safe fallback through 'en' if a key is missing in target lang.
export function t(lang, path, vars) {
  const fallback = (path) => path.split('.').reduce((o, k) => (o == null ? null : o[k]), STRINGS.en);
  const get = (path) => path.split('.').reduce((o, k) => (o == null ? null : o[k]), STRINGS[lang] || STRINGS.en);
  let v = get(path);
  if (v == null) v = fallback(path);
  if (v == null) return path;
  if (vars) {
    Object.entries(vars).forEach(([k, val]) => {
      v = v.replace(new RegExp(`\\{${k}\\}`, 'g'), val);
    });
  }
  return v;
}

// Localize a {en, pt, ...} object — falls through to en if missing.
export function localize(lang, obj) {
  if (!obj) return '';
  return obj[lang] || obj.en || '';
}
