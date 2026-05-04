// Curated points of interest for Caraguatatuba, SP, Brazil.
// Each POI has bilingual content, interest weights, dwell time, and a guide script
// keyed by interest — so the guide gets different talking points depending on
// which interests pulled this stop into the itinerary.

export const CITY = {
  id: 'caraguatatuba',
  name: { en: 'Caraguatatuba', pt: 'Caraguatatuba' },
  region: { en: 'North Coast of São Paulo, Brazil', pt: 'Litoral Norte de São Paulo, Brasil' },
  center: { lat: -23.6205, lng: -45.4128 },
};

// Interest taxonomy — keep stable; POIs reference these IDs.
export const INTERESTS = [
  { id: 'food',         icon: '🍽️', en: 'Food & Dining',          pt: 'Gastronomia' },
  { id: 'history',      icon: '🏛️', en: 'History',                 pt: 'História' },
  { id: 'arts',         icon: '🎨', en: 'Arts & Culture',           pt: 'Arte e Cultura' },
  { id: 'nature',       icon: '🌿', en: 'Nature & Hiking',          pt: 'Natureza e Trilhas' },
  { id: 'beaches',      icon: '🏖️', en: 'Beaches',                  pt: 'Praias' },
  { id: 'wildlife',     icon: '🦋', en: 'Wildlife',                 pt: 'Vida Selvagem' },
  { id: 'architecture', icon: '🏗️', en: 'Architecture',             pt: 'Arquitetura' },
  { id: 'photography',  icon: '📷', en: 'Photography Spots',        pt: 'Pontos para Fotos' },
  { id: 'shopping',     icon: '🛍️', en: 'Local Shopping & Crafts',  pt: 'Compras e Artesanato' },
  { id: 'nightlife',    icon: '🌙', en: 'Nightlife',                pt: 'Vida Noturna' },
  { id: 'family',       icon: '👨‍👩‍👧', en: 'Family-friendly',           pt: 'Para Família' },
  { id: 'adventure',    icon: '🚣', en: 'Adventure Sports',         pt: 'Esportes de Aventura' },
  { id: 'relaxation',   icon: '🧘', en: 'Relaxation & Wellness',    pt: 'Relaxamento e Bem-estar' },
  { id: 'religion',     icon: '⛪', en: 'Religion & Spirituality',  pt: 'Religião e Espiritualidade' },
  { id: 'music',        icon: '🎷', en: 'Live Music',               pt: 'Música ao Vivo' },
  { id: 'coffee',       icon: '☕', en: 'Coffee & Cafés',           pt: 'Cafés' },
  { id: 'viewpoints',   icon: '🌄', en: 'Scenic Viewpoints',        pt: 'Mirantes' },
  { id: 'water',        icon: '🐬', en: 'Boat & Water Tours',       pt: 'Passeios de Barco' },
  { id: 'romantic',     icon: '🌹', en: 'Romantic Spots',           pt: 'Pontos Românticos' },
  { id: 'social',       icon: '🤝', en: 'Local Life & Social',      pt: 'Vida Local' },
];

// Points of interest. Each POI:
// - tags: subset of interest IDs this stop satisfies
// - intensity: { tag: 1..5 } how strongly the stop satisfies each tag
// - dwellMin: typical visit length in minutes
// - script: { tag: { en, pt } } talking points keyed by interest
// - kind: category for transport heuristics ('beach', 'restaurant', 'museum', 'hike', 'shop', 'view', 'church')
export const POIS = [
  {
    id: 'praia-martim-de-sa',
    name: { en: 'Martim de Sá Beach', pt: 'Praia de Martim de Sá' },
    blurb: {
      en: 'The lively heart of Caraguá — a wide crescent of golden sand lined with kiosks and palm trees.',
      pt: 'O coração animado de Caraguá — um amplo arco de areia dourada com quiosques e coqueiros.',
    },
    address: 'Av. da Praia, Martim de Sá',
    coords: { lat: -23.6394, lng: -45.4130 },
    kind: 'beach',
    dwellMin: 60,
    tags: ['beaches', 'social', 'family', 'photography'],
    intensity: { beaches: 5, social: 4, family: 4, photography: 3 },
    script: {
      beaches: {
        en: 'Martim de Sá is the busiest beach in town. The sand is firm enough to walk for kilometers — locals come here to play futevôlei in the late afternoon. The water deepens gradually, which is why families pick this beach over the rougher ones up north.',
        pt: 'Martim de Sá é a praia mais movimentada da cidade. A areia é firme o suficiente para caminhar por quilômetros — os caiçaras vêm jogar futevôlei no fim da tarde. A água é rasa, por isso famílias preferem essa praia em relação às mais bravas do norte.',
      },
      social: {
        en: "If you want to feel the rhythm of Caraguá, this is it. Late afternoons the kiosks fill with locals — you'll hear forró spilling out alongside families finishing the workday. Order an água de coco and just watch.",
        pt: 'Se quer sentir o ritmo de Caraguá, é aqui. No fim da tarde os quiosques enchem — você vai ouvir forró tocando, famílias terminando o dia. Peça uma água de coco e observe.',
      },
      family: {
        en: 'Safest beach in town for kids — gentle slope, lifeguard posts every few hundred meters, kiosks with bathrooms.',
        pt: 'Praia mais segura da cidade para crianças — descida suave, postos de salva-vidas a cada poucas centenas de metros, quiosques com banheiros.',
      },
      photography: {
        en: 'Best light is around 5pm when the sun comes from behind the Serra do Mar — the mountains glow gold while the beach stays soft.',
        pt: 'A melhor luz é por volta das 17h, quando o sol vem por trás da Serra do Mar — as montanhas brilham douradas enquanto a praia fica suave.',
      },
    },
  },
  {
    id: 'praia-cocanha',
    name: { en: 'Cocanha Beach', pt: 'Praia da Cocanha' },
    blurb: {
      en: 'A calm, family-friendly beach famous for its mussel farms — you can see the lines bobbing offshore.',
      pt: 'Praia calma e familiar, famosa pelos mexilhões cultivados — dá para ver as cordas balançando ao largo.',
    },
    address: 'Rua da Cocanha, Cocanha',
    coords: { lat: -23.5469, lng: -45.3050 },
    kind: 'beach',
    dwellMin: 75,
    tags: ['beaches', 'family', 'food', 'nature', 'water'],
    intensity: { beaches: 4, family: 5, food: 3, nature: 3, water: 4 },
    script: {
      beaches: {
        en: 'Cocanha sits in a protected bay — the water is glass-flat most mornings. Almost no waves, which is rare on this coast.',
        pt: 'Cocanha fica numa baía protegida — a água é como vidro de manhã. Quase sem ondas, raro nesse litoral.',
      },
      family: {
        en: 'You can wade out a hundred meters and still be at waist height. Kayak rentals here cost about the same as a coffee back home.',
        pt: 'Dá para entrar cem metros e ainda estar na cintura. O aluguel de caiaque aqui custa quase o mesmo que um café na sua cidade.',
      },
      food: {
        en: 'Those black lines you see in the water? Mussel farms. The kiosks here serve them within hours of harvest — order them ao bafo, steamed in white wine.',
        pt: 'Aquelas linhas pretas na água? Cultivo de mexilhão. Os quiosques aqui servem em horas após colhidos — peça ao bafo, no vinho branco.',
      },
      water: {
        en: "Best beach in town for SUP and kayaks because of the calm bay. You can paddle out to the mussel lines and back in 40 minutes.",
        pt: 'Melhor praia da cidade para SUP e caiaque pela baía calma. Dá para remar até as linhas de mexilhão e voltar em 40 minutos.',
      },
    },
  },
  {
    id: 'centro-historico',
    name: { en: 'Historic Downtown', pt: 'Centro Histórico' },
    blurb: {
      en: "The old town center — the city's 17th-century origins are still visible in the street grid.",
      pt: 'O centro antigo — as origens do século XVII ainda visíveis no traçado das ruas.',
    },
    address: 'Rua Major Ayres, Centro',
    coords: { lat: -23.6217, lng: -45.4131 },
    kind: 'walk',
    dwellMin: 45,
    tags: ['history', 'architecture', 'social', 'photography'],
    intensity: { history: 5, architecture: 4, social: 3, photography: 3 },
    script: {
      history: {
        en: 'Caraguatatuba was founded in 1653 — the name comes from the Tupi caraguatá-tuba, "place of many bromeliads." For its first 250 years it was a tiny fishing settlement; the road over the Serra do Mar didn\'t exist until 1939, so the only way in or out was by boat.',
        pt: 'Caraguatatuba foi fundada em 1653 — o nome vem do tupi caraguatá-tuba, "lugar de muitas bromélias". Por seus primeiros 250 anos foi uma pequena vila de pescadores; a estrada pela Serra do Mar só foi construída em 1939, então só dava para entrar e sair de barco.',
      },
      architecture: {
        en: 'Notice how short the buildings are — there\'s a city ordinance: nothing taller than the coconut palms along the seafront. That keeps the historic scale intact.',
        pt: 'Repare como os prédios são baixos — há uma lei municipal: nada mais alto que os coqueiros da orla. Isso mantém a escala histórica.',
      },
      social: {
        en: "On weekday mornings the centro is where you see the real Caraguá — vendors setting up, fishermen selling the night's catch, retirees having coffee at the same cafés they have for forty years.",
        pt: 'Nas manhãs de dia útil, o centro é onde você vê o Caraguá de verdade — vendedores arrumando, pescadores vendendo a captura da noite, aposentados tomando café nos mesmos lugares de quarenta anos atrás.',
      },
    },
  },
  {
    id: 'igreja-santo-antonio',
    name: { en: 'Santo Antônio Church', pt: 'Igreja Matriz de Santo Antônio' },
    blurb: {
      en: "The city's mother church, rebuilt several times since the 1600s on the same hilltop site.",
      pt: 'A igreja matriz da cidade, reconstruída várias vezes desde o século XVII no mesmo morro.',
    },
    address: 'Praça Dr. Cândido Mota, Centro',
    coords: { lat: -23.6224, lng: -45.4136 },
    kind: 'church',
    dwellMin: 25,
    tags: ['religion', 'history', 'architecture', 'viewpoints'],
    intensity: { religion: 5, history: 4, architecture: 3, viewpoints: 3 },
    script: {
      religion: {
        en: 'Saint Anthony is the patron saint of Caraguatatuba — every June the city holds a 10-day festa with novenas, food stalls, and a procession that ends here.',
        pt: 'Santo Antônio é o padroeiro de Caraguatatuba — todo mês de junho a cidade faz uma festa de 10 dias com novenas, quermesse e procissão que termina aqui.',
      },
      history: {
        en: 'The original chapel was built in 1665, destroyed by storms twice, and the current structure dates to 1846. The bell out front was cast in Portugal and shipped over.',
        pt: 'A capela original foi construída em 1665, destruída por tempestades duas vezes; a estrutura atual é de 1846. O sino na frente foi fundido em Portugal e veio de navio.',
      },
      viewpoints: {
        en: "From the steps you get the best free view of the seafront — locals come here to watch storms roll in over the bay.",
        pt: 'Da escadaria você tem a melhor vista grátis da orla — os caiçaras vêm aqui ver as tempestades chegarem pela baía.',
      },
    },
  },
  {
    id: 'parque-serra-do-mar',
    name: { en: 'Serra do Mar State Park — Caraguá Center', pt: 'Parque Estadual Serra do Mar — Núcleo Caraguá' },
    blurb: {
      en: "One of the largest stretches of protected Atlantic rainforest in Brazil, with marked trails right behind the city.",
      pt: 'Uma das maiores áreas de Mata Atlântica preservada do Brasil, com trilhas demarcadas logo atrás da cidade.',
    },
    address: 'Rod. Manoel Hipólito do Rego, km 79',
    coords: { lat: -23.6892, lng: -45.4453 },
    kind: 'hike',
    dwellMin: 120,
    tags: ['nature', 'wildlife', 'adventure', 'photography'],
    intensity: { nature: 5, wildlife: 5, adventure: 3, photography: 4 },
    script: {
      nature: {
        en: 'The Atlantic Forest used to cover the entire eastern coast of Brazil — today only about 12% remains, and this park protects one of the largest remaining pieces. The biodiversity per hectare here rivals the Amazon.',
        pt: 'A Mata Atlântica cobria todo o litoral leste do Brasil — hoje restam apenas cerca de 12%, e este parque protege uma das maiores áreas remanescentes. A biodiversidade por hectare aqui rivaliza a Amazônia.',
      },
      wildlife: {
        en: 'Listen — that two-tone whistle is the sabiá-laranjeira, the national bird. If we\'re lucky we\'ll see saguís (marmosets) overhead — they\'re common but quick. The rarer animal here is the muriqui, the largest primate in the Americas.',
        pt: 'Escute — esse assobio de duas notas é o sabiá-laranjeira, ave nacional. Se tivermos sorte vemos saguis nas árvores — são comuns mas rápidos. O animal mais raro aqui é o muriqui, o maior primata das Américas.',
      },
      adventure: {
        en: 'The full Trilha do Jequitibá is a 6km loop with about 200m of elevation gain — moderate but humid. We can do a shorter version if you prefer.',
        pt: 'A Trilha do Jequitibá completa tem 6km com cerca de 200m de subida — moderada mas úmida. Dá para fazer uma versão menor se preferir.',
      },
    },
  },
  {
    id: 'cachoeira-pamonhas',
    name: { en: 'Pamonhas Waterfall', pt: 'Cachoeira das Pamonhas' },
    blurb: {
      en: 'A natural pool waterfall a short hike from the road — locals bring picnics and spend the whole day.',
      pt: 'Uma cachoeira com piscina natural a uma curta caminhada da estrada — os caiçaras trazem piquenique e passam o dia.',
    },
    address: 'Bairro Rio Claro, north of Caraguá',
    coords: { lat: -23.4958, lng: -45.2603 },
    kind: 'hike',
    dwellMin: 90,
    tags: ['nature', 'adventure', 'family', 'relaxation', 'photography'],
    intensity: { nature: 4, adventure: 3, family: 3, relaxation: 4, photography: 4 },
    script: {
      nature: {
        en: "The water comes straight off the Serra do Mar — it's cold, clear, and so clean you can drink it upstream of the pool.",
        pt: 'A água vem direto da Serra do Mar — é fria, cristalina, e tão limpa que dá para beber acima da piscina.',
      },
      relaxation: {
        en: 'There\'s a reason people stay here for hours — the negative ions from the falling water are real. Twenty minutes here resets your nervous system.',
        pt: 'Há uma razão de as pessoas ficarem horas aqui — os íons negativos da água em queda são reais. Vinte minutos aqui reinicia o sistema nervoso.',
      },
    },
  },
  {
    id: 'mercado-municipal',
    name: { en: 'Municipal Market', pt: 'Mercado Municipal' },
    blurb: {
      en: 'Where locals buy fresh fish straight off the boats and produce from the Vale do Paraíba farms.',
      pt: 'Onde os moradores compram peixe fresco direto dos barcos e produtos das fazendas do Vale do Paraíba.',
    },
    address: 'Av. da Praia, Centro',
    coords: { lat: -23.6240, lng: -45.4140 },
    kind: 'shop',
    dwellMin: 35,
    tags: ['food', 'social', 'shopping', 'photography'],
    intensity: { food: 5, social: 4, shopping: 3, photography: 3 },
    script: {
      food: {
        en: 'The fish here was in the ocean this morning. Look for tainha (mullet), robalo (snook), garoupa (grouper) — anything labeled fresco da praia means it didn\'t see ice. Banana-da-terra here is a regional specialty: thick, starchy, fried in butter.',
        pt: 'O peixe aqui estava no mar hoje cedo. Procure tainha, robalo, garoupa — qualquer coisa "fresco da praia" não viu gelo. Banana-da-terra aqui é especialidade regional: grossa, amilácea, frita na manteiga.',
      },
      social: {
        en: 'Notice the relationships — the same families have been buying from the same vendors for generations. Watch for the moment a customer arrives and the vendor already starts wrapping their order.',
        pt: 'Repare nas relações — as mesmas famílias compram dos mesmos vendedores há gerações. Veja o momento em que o cliente chega e o vendedor já começa a embrulhar.',
      },
      shopping: {
        en: "Bring cash. Best souvenir from here isn't a souvenir — it's pinga artesanal (artisan cachaça) from the Serra. Ask for one aged in jequitibá wood.",
        pt: 'Traga dinheiro. O melhor "souvenir" daqui não é um souvenir — é pinga artesanal da serra. Peça uma envelhecida em jequitibá.',
      },
    },
  },
  {
    id: 'restaurante-acquarello',
    name: { en: 'Acquarello (Sea-view Italian)', pt: 'Acquarello (Italiano com Vista)' },
    blurb: {
      en: 'Italian-Brazilian seafood — the linguine ao frutos do mar uses the same morning catch as the market.',
      pt: 'Cozinha ítalo-brasileira de frutos do mar — o linguine ao frutos do mar usa a captura da manhã.',
    },
    address: 'Av. da Praia, Martim de Sá',
    coords: { lat: -23.6385, lng: -45.4140 },
    kind: 'restaurant',
    dwellMin: 75,
    tags: ['food', 'romantic', 'viewpoints'],
    intensity: { food: 5, romantic: 4, viewpoints: 3 },
    script: {
      food: {
        en: 'Order the moqueca de peixe if you\'ve never had it — palm oil, coconut milk, peppers, fresh fish, served bubbling in a clay pot. It\'s the most Brazilian dish on the coast.',
        pt: 'Peça a moqueca se nunca experimentou — azeite de dendê, leite de coco, pimentões, peixe fresco, servida fervendo no barro. O prato mais brasileiro do litoral.',
      },
      romantic: {
        en: 'The terrace tables face directly west — sunset reservations book out a week ahead in season. Tell them you want a vista do pôr do sol.',
        pt: 'As mesas do terraço dão direto para o oeste — reservas para o pôr do sol esgotam com uma semana de antecedência na alta. Peça vista do pôr do sol.',
      },
    },
  },
  {
    id: 'praia-prainha',
    name: { en: 'Prainha Beach', pt: 'Praia da Prainha' },
    blurb: {
      en: "A small, hidden beach surrounded by Atlantic Forest — only locals come here.",
      pt: 'Uma praia pequena e escondida cercada pela Mata Atlântica — só caiçara conhece.',
    },
    address: 'Estrada Caraguá-Ubatuba, Tabatinga',
    coords: { lat: -23.4711, lng: -45.1633 },
    kind: 'beach',
    dwellMin: 90,
    tags: ['beaches', 'nature', 'romantic', 'photography', 'relaxation'],
    intensity: { beaches: 4, nature: 4, romantic: 5, photography: 4, relaxation: 5 },
    script: {
      romantic: {
        en: "Most tourists never find this beach — the access is a 5-minute walk through forest. There's no kiosk, no music, just the sound of water on stones.",
        pt: 'A maioria dos turistas nunca encontra essa praia — o acesso é uma caminhada de 5 minutos pela mata. Sem quiosque, sem som, só água nas pedras.',
      },
      relaxation: {
        en: 'Bring a book and water — there are no services here. That\'s the point. Two hours and you forget you have a phone.',
        pt: 'Traga um livro e água — não há serviços. Esse é o ponto. Duas horas aqui e você esquece que tem celular.',
      },
    },
  },
  {
    id: 'mirante-camaroeiro',
    name: { en: 'Camaroeiro Lookout', pt: 'Mirante do Camaroeiro' },
    blurb: {
      en: 'The classic postcard view of the entire Caraguá bay, from a small hilltop.',
      pt: 'A vista postal clássica de toda a baía de Caraguá, de um pequeno morro.',
    },
    address: 'Ponta do Camaroeiro',
    coords: { lat: -23.6483, lng: -45.4256 },
    kind: 'view',
    dwellMin: 25,
    tags: ['viewpoints', 'photography', 'romantic', 'nature'],
    intensity: { viewpoints: 5, photography: 5, romantic: 4, nature: 2 },
    script: {
      viewpoints: {
        en: 'From here you can see the entire arc of the bay — Martim de Sá straight ahead, the harbor to the south, and on a clear day Ilhabela to the southeast.',
        pt: 'Daqui você vê todo o arco da baía — Martim de Sá em frente, o porto ao sul e, em dia limpo, Ilhabela a sudeste.',
      },
      photography: {
        en: 'Best at sunrise — the sun comes up over the ocean and lights the Serra behind us. Worth setting an alarm for.',
        pt: 'Melhor ao nascer do sol — o sol vem do oceano e ilumina a Serra atrás de nós. Vale despertar cedo.',
      },
    },
  },
  {
    id: 'tabatinga-surf',
    name: { en: 'Tabatinga Beach (Surf)', pt: 'Praia de Tabatinga (Surfe)' },
    blurb: {
      en: 'The most consistent surf break on this coast — locals run schools right on the beach.',
      pt: 'O pico de surfe mais consistente do litoral — escolas funcionam direto na areia.',
    },
    address: 'Praia de Tabatinga',
    coords: { lat: -23.4900, lng: -45.1758 },
    kind: 'beach',
    dwellMin: 90,
    tags: ['beaches', 'adventure', 'social', 'photography'],
    intensity: { beaches: 4, adventure: 5, social: 3, photography: 3 },
    script: {
      adventure: {
        en: "Tabatinga has the most reliable beach break in Caraguá — the swell wraps around the point and produces clean lefts. Lessons run about R$120 for two hours including board.",
        pt: 'Tabatinga tem o melhor beach break de Caraguá — o swell contorna a ponta e produz esquerdas limpas. Aulas custam cerca de R$120 por duas horas com prancha.',
      },
      social: {
        en: 'The surf community here is tight — show interest, you\'ll get invited to a board demo. The surf shop on the corner doubles as a café.',
        pt: 'A comunidade de surfe aqui é unida — demonstre interesse, vai ser convidado a testar uma prancha. A loja de surfe da esquina também é café.',
      },
    },
  },
  {
    id: 'casa-do-cha',
    name: { en: 'Casa do Chá Café', pt: 'Casa do Chá' },
    blurb: {
      en: 'Garden café in a restored colonial house — specialty teas, Brazilian coffee, and afternoon pastries.',
      pt: 'Café com jardim numa casa colonial restaurada — chás especiais, café brasileiro e doces.',
    },
    address: 'Rua das Palmeiras, Centro',
    coords: { lat: -23.6231, lng: -45.4115 },
    kind: 'restaurant',
    dwellMin: 50,
    tags: ['coffee', 'food', 'history', 'relaxation', 'romantic'],
    intensity: { coffee: 5, food: 3, history: 3, relaxation: 4, romantic: 3 },
    script: {
      coffee: {
        en: 'Brazil produces a third of the world\'s coffee — and most of the best stays in country. Try a coado here, the traditional cloth-filter method. Different from the espresso you know.',
        pt: 'O Brasil produz um terço do café do mundo — e o melhor fica por aqui. Experimente um coado, método tradicional com filtro de pano. Diferente do espresso que você conhece.',
      },
      history: {
        en: 'This building is from 1893 — one of the few surviving wooden colonial homes. The owners restored it instead of tearing it down, which is rare on this coast.',
        pt: 'Esse prédio é de 1893 — uma das poucas casas coloniais de madeira que sobrou. Os donos restauraram em vez de demolir, raro nessa costa.',
      },
    },
  },
  {
    id: 'porto-de-pesca',
    name: { en: 'Fishermen\'s Wharf', pt: 'Porto de Pesca Artesanal' },
    blurb: {
      en: "The active artisan fishing port — see the boats unload at sunrise or sundown.",
      pt: 'Porto de pesca artesanal ativo — veja os barcos descarregarem ao amanhecer ou entardecer.',
    },
    address: 'Av. da Praia, Sumaré',
    coords: { lat: -23.6312, lng: -45.4109 },
    kind: 'walk',
    dwellMin: 30,
    tags: ['social', 'food', 'photography', 'history'],
    intensity: { social: 5, food: 3, photography: 4, history: 4 },
    script: {
      social: {
        en: 'These fishermen are caiçaras — descendants of the Tupi indigenous people, Portuguese settlers, and African slaves. Their dialect has dozens of words for ocean conditions that don\'t exist in standard Portuguese.',
        pt: 'Esses pescadores são caiçaras — descendentes de tupi, portugueses e africanos. O dialeto deles tem dezenas de palavras para condições do mar que não existem em português padrão.',
      },
      history: {
        en: 'For 300 years this was the only economy in Caraguá — fishing and bananas, traded with Santos by boat. Most of these families are still in the same houses their great-great-grandparents built.',
        pt: 'Por 300 anos essa foi a única economia de Caraguá — pesca e bananas, vendidos para Santos por barco. A maioria dessas famílias ainda mora nas casas dos tataravôs.',
      },
    },
  },
  {
    id: 'casa-cultura',
    name: { en: 'Casa da Cultura', pt: 'Casa da Cultura Maria Bethânia Moreira César' },
    blurb: {
      en: 'The city\'s cultural center — rotating exhibits of regional artists, music nights, and a small museum.',
      pt: 'Centro cultural da cidade — exposições rotativas, noites de música e um pequeno museu.',
    },
    address: 'Rua Eng. João Fonseca, Centro',
    coords: { lat: -23.6231, lng: -45.4148 },
    kind: 'museum',
    dwellMin: 60,
    tags: ['arts', 'history', 'music', 'architecture'],
    intensity: { arts: 5, history: 3, music: 3, architecture: 3 },
    script: {
      arts: {
        en: 'The current generation of caiçara artists is fascinating — they paint the ocean and forest with the same urgency you see in indigenous Australian art. Look for the Tarsila-influenced canvases by Marcos Lopes; he lives two blocks from here.',
        pt: 'A geração atual de artistas caiçaras é fascinante — pintam o mar e a mata com a mesma urgência que se vê em arte aborígene. Procure os quadros do Marcos Lopes, influenciado por Tarsila; ele mora a dois quarteirões.',
      },
      music: {
        en: "Friday nights they host samba de raiz — old-style samba with cavaquinho, pandeiro, surdo. Free entry, beer is cheap, dancing starts around 10pm.",
        pt: 'Sextas tem samba de raiz — samba antigo com cavaquinho, pandeiro, surdo. Entrada grátis, cerveja barata, dança começa por volta das 22h.',
      },
    },
  },
  {
    id: 'praia-massaguacu',
    name: { en: 'Massaguaçu Beach', pt: 'Praia de Massaguaçu' },
    blurb: {
      en: 'A long, wild stretch of beach popular with surfers and dog-walkers — much less developed than Martim de Sá.',
      pt: 'Uma faixa longa e selvagem de praia, popular com surfistas e pessoas com cachorro — bem menos urbanizada que Martim de Sá.',
    },
    address: 'Praia de Massaguaçu, north Caraguá',
    coords: { lat: -23.5800, lng: -45.3522 },
    kind: 'beach',
    dwellMin: 75,
    tags: ['beaches', 'nature', 'adventure', 'photography'],
    intensity: { beaches: 4, nature: 4, adventure: 4, photography: 4 },
    script: {
      beaches: {
        en: '4 kilometers of unbroken sand — you can run, walk, ride a bike. The southern end has tide pools at low tide.',
        pt: '4 km de areia sem interrupção — dá para correr, andar de bike. A ponta sul tem piscinas naturais na maré baixa.',
      },
    },
  },
  {
    id: 'feira-artesanato',
    name: { en: 'Artisan Fair (Praça da Cultura)', pt: 'Feira de Artesanato' },
    blurb: {
      en: 'Weekend craft fair — local woodwork, ceramics, jewelry from Atlantic Forest seeds.',
      pt: 'Feira de fim de semana — madeira, cerâmica, joias com sementes da Mata Atlântica.',
    },
    address: 'Praça da Cultura, Centro',
    coords: { lat: -23.6225, lng: -45.4128 },
    kind: 'shop',
    dwellMin: 40,
    tags: ['shopping', 'arts', 'social', 'family'],
    intensity: { shopping: 5, arts: 3, social: 3, family: 3 },
    script: {
      shopping: {
        en: 'Look for jewelry made from jequitibá and pau-brasil seeds — sustainable, local, and unique. The wooden bowls turned from fallen jacarandá are heirloom-quality.',
        pt: 'Procure joias feitas de sementes de jequitibá e pau-brasil — sustentáveis, locais, únicas. As tigelas de jacarandá caído são qualidade de herança.',
      },
    },
  },
  {
    id: 'passeio-de-escuna',
    name: { en: 'Schooner Bay Tour', pt: 'Passeio de Escuna' },
    blurb: {
      en: 'Half-day boat tour around the bay with stops for swimming and a fresh-fish lunch on board.',
      pt: 'Passeio de meio-dia pela baía, com paradas para banho e almoço de peixe a bordo.',
    },
    address: 'Píer da Av. da Praia',
    coords: { lat: -23.6258, lng: -45.4135 },
    kind: 'boat',
    dwellMin: 240,
    tags: ['water', 'family', 'food', 'photography', 'nature'],
    intensity: { water: 5, family: 4, food: 3, photography: 4, nature: 3 },
    script: {
      water: {
        en: "We'll see two protected coves you can't reach by road — water clear enough to see fish from the deck.",
        pt: 'Vamos ver duas enseadas protegidas que não dão para chegar por estrada — água limpa para ver peixe do convés.',
      },
      food: {
        en: 'The lunch on board is whatever the captain caught that morning — usually robalo or tainha grilled with garlic and lime. Simple, perfect.',
        pt: 'O almoço a bordo é o que o capitão pescou — geralmente robalo ou tainha grelhados com alho e limão. Simples, perfeito.',
      },
    },
  },
  {
    id: 'capela-santo-antonio-velho',
    name: { en: 'Santo Antônio Velho Chapel', pt: 'Capela de Santo Antônio Velho' },
    blurb: {
      en: 'A 17th-century chapel above town — one of the oldest standing buildings in the region.',
      pt: 'Capela do século XVII no morro acima da cidade — uma das construções mais antigas da região.',
    },
    address: 'Morro de Santo Antônio',
    coords: { lat: -23.6193, lng: -45.4067 },
    kind: 'church',
    dwellMin: 35,
    tags: ['history', 'religion', 'architecture', 'viewpoints'],
    intensity: { history: 5, religion: 4, architecture: 4, viewpoints: 4 },
    script: {
      history: {
        en: "The chapel from 1665 — the original structure, walls of stone-and-shell mortar (cal de conchas), the technique the Portuguese learned from the Tupi. The path up was the original entrance to town from the sea.",
        pt: 'A capela de 1665 — estrutura original, paredes de cal de conchas, técnica que os portugueses aprenderam com os tupi. O caminho que subimos foi a entrada original da cidade vinda do mar.',
      },
      architecture: {
        en: 'Notice the doors — wood from a single piece of jequitibá that took two oxen to drag up the hill. The hinges are hand-forged iron.',
        pt: 'Repare nas portas — madeira de jequitibá em peça única que precisou de dois bois para subir o morro. As dobradiças são de ferro forjado à mão.',
      },
    },
  },
  {
    id: 'spa-orla',
    name: { en: 'Orla Spa & Day Pass', pt: 'Spa da Orla' },
    blurb: {
      en: 'Beach-side spa offering massages with locally-sourced oils and a sauna with ocean view.',
      pt: 'Spa na orla com massagens de óleos locais e sauna com vista para o mar.',
    },
    address: 'Av. da Praia',
    coords: { lat: -23.6354, lng: -45.4138 },
    kind: 'restaurant',
    dwellMin: 90,
    tags: ['relaxation', 'romantic'],
    intensity: { relaxation: 5, romantic: 3 },
    script: {
      relaxation: {
        en: 'Ask for the massagem com óleo de andiroba — the oil comes from a Mata Atlântica tree, anti-inflammatory, used by indigenous people for centuries.',
        pt: 'Peça a massagem com óleo de andiroba — vem de uma árvore da Mata Atlântica, anti-inflamatório, usado por indígenas há séculos.',
      },
    },
  },
  {
    id: 'bar-do-zezinho',
    name: { en: 'Bar do Zezinho (Live Music)', pt: 'Bar do Zezinho (Música ao Vivo)' },
    blurb: {
      en: 'Local institution for samba, MPB, and chopp — five nights a week, no tourists.',
      pt: 'Instituição local de samba, MPB e chopp — cinco noites por semana, sem turistas.',
    },
    address: 'Rua Major Ayres, 230, Centro',
    coords: { lat: -23.6224, lng: -45.4145 },
    kind: 'restaurant',
    dwellMin: 90,
    tags: ['nightlife', 'music', 'social', 'food'],
    intensity: { nightlife: 5, music: 5, social: 4, food: 2 },
    script: {
      nightlife: {
        en: 'This is where Caraguá goes out — not the kiosks on the beach. Order chopp Brahma in the gelado glass, share a porção of bolinho de bacalhau.',
        pt: 'É aqui que Caraguá sai à noite — não nos quiosques. Peça chopp Brahma no copo gelado e divida uma porção de bolinho de bacalhau.',
      },
      music: {
        en: 'Wednesdays roda de samba, Fridays MPB trio, Saturdays full band. Tip the musicians — R$10 in the hat is generous and remembered.',
        pt: 'Quartas roda de samba, sextas trio de MPB, sábados banda completa. Gorjeta nos músicos — R$10 no chapéu é generoso e lembrado.',
      },
    },
  },
  {
    id: 'sambaqui-archeology',
    name: { en: 'Sambaqui Archaeological Site', pt: 'Sítio Arqueológico do Sambaqui' },
    blurb: {
      en: 'A 6,000-year-old shell mound — pre-Tupi people lived here for millennia.',
      pt: 'Um sambaqui de 6.000 anos — povos pré-tupi viveram aqui por milênios.',
    },
    address: 'Bairro Pegorelli',
    coords: { lat: -23.6109, lng: -45.3964 },
    kind: 'museum',
    dwellMin: 45,
    tags: ['history', 'arts', 'nature'],
    intensity: { history: 5, arts: 2, nature: 2 },
    script: {
      history: {
        en: 'A sambaqui is essentially a pre-historic garbage heap — but made of shells, fish bones, ceramic shards, and human burials accumulated over thousands of years. This one is dated to 4000 BC. The people who built it predated the Tupi by millennia and left no descendants we can identify.',
        pt: 'Um sambaqui é basicamente um lixão pré-histórico — mas de conchas, ossos de peixe, cacos de cerâmica e enterros humanos acumulados em milhares de anos. Esse é datado de 4000 a.C. O povo que construiu antecede os tupi em milênios e não deixou descendentes identificáveis.',
      },
    },
  },
  {
    id: 'restaurant-pier-39',
    name: { en: 'Pier 39 Seafood', pt: 'Pier 39 (Frutos do Mar)' },
    blurb: {
      en: 'Mid-range seafood right over the water — best mussel moqueca in town.',
      pt: 'Frutos do mar sobre a água — a melhor moqueca de mexilhão da cidade.',
    },
    address: 'Av. da Praia',
    coords: { lat: -23.6276, lng: -45.4128 },
    kind: 'restaurant',
    dwellMin: 75,
    tags: ['food', 'family', 'viewpoints'],
    intensity: { food: 5, family: 4, viewpoints: 3 },
    script: {
      food: {
        en: "Mussel moqueca uses the mussels we saw at Cocanha. Order it for two people minimum — they bring it bubbling in a clay pot with rice, pirão (fish broth thickened with cassava flour), and farofa.",
        pt: 'A moqueca de mexilhão usa os mexilhões da Cocanha. Peça para duas pessoas no mínimo — vem fervendo no barro com arroz, pirão e farofa.',
      },
    },
  },
];
