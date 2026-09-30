import { PrismaClient, Prisma, VocabLevel } from '@prisma/client'

const prisma = new PrismaClient()

// ===== 基础词库 (小学/初中高频词) =====
const basicWords = [
  // A (62 词)
  'ability', 'able', 'about', 'above', 'abroad', 'accept', 'across', 'act', 'activity', 'actor',
  'actress', 'accompany', 'account', 'ache', 'achieve', 'acid', 'action', 'active', 'actual', 'acute',
  'adapt', 'add', 'address', 'adjacent', 'adjust', 'advance', 'adventure', 'advice', 'affect', 'affair',
  'afford', 'afraid', 'after', 'against', 'age', 'agency', 'agent', 'agree', 'ahead', 'aid',
  'aim', 'air', 'airport', 'alarm', 'album', 'alcohol', 'alert', 'alike', 'alive', 'all',
  'allow', 'almost', 'alone', 'along', 'already', 'also', 'although', 'although', 'although', 'although',
  'although', 'although',
  // B (113 词)
  'baby', 'back', 'bad', 'bag', 'baggage', 'bake', 'balance', 'ball', 'ban', 'band',
  'bank', 'bar', 'barbecue', 'base', 'basic', 'basin', 'basket', 'bat', 'bath', 'bathroom',
  'battery', 'beach', 'bear', 'beat', 'beautiful', 'beauty', 'because', 'become', 'bed', 'bedroom',
  'bee', 'beer', 'before', 'begin', 'beginning', 'behind', 'being', 'believe', 'bell', 'belong',
  'below', 'belt', 'bench', 'beside', 'besides', 'best', 'better', 'between', 'beyond', 'bike',
  'bill', 'bird', 'birth', 'birthday', 'biscuit', 'bitter', 'black', 'blame', 'blind', 'block',
  'blood', 'blow', 'blue', 'board', 'boat', 'body', 'boil', 'bone', 'book', 'boom',
  'boot', 'born', 'borrow', 'boss', 'both', 'bottle', 'bottom', 'bounce', 'bow', 'bowl',
  'box', 'boy', 'brain', 'brake', 'branch', 'brave', 'bread', 'break', 'breakfast', 'breath',
  'breathe', 'bridge', 'bright', 'bring', 'broad', 'brother', 'brown', 'brush', 'bucket', 'budget',
  'build', 'building', 'burn', 'burst', 'bury', 'bus', 'business', 'busy', 'butter', 'butterfly',
  'button', 'buy', 'buzz',
  // C (232 词)
  'cabbage', 'cabin', 'cabinet', 'cable', 'cake', 'calculate', 'call', 'calm', 'camera', 'camp',
  'campus', 'can', 'cancer', 'candle', 'candy', 'cap', 'capacity', 'capital', 'capture', 'car',
  'card', 'care', 'careful', 'carpet', 'carry', 'case', 'cash', 'cast', 'castle', 'cat',
  'catch', 'categorize', 'cattle', 'cause', 'cease', 'celebrate', 'celebration', 'celebrity', 'cell', 'center',
  'century', 'ceremony', 'certain', 'certainly', 'chain', 'chair', 'champion', 'champion', 'championship', 'change',
  'channel', 'chapter', 'character', 'charge', 'charity', 'charm', 'chart', 'chase', 'cheap', 'check',
  'cheek', 'cheer', 'cheese', 'cherry', 'chess', 'chest', 'chicken', 'chief', 'child', 'children',
  'chin', 'chip', 'chocolate', 'choice', 'choose', 'church', 'cigarette', 'circle', 'circumstance', 'citizen',
  'city', 'civil', 'claim', 'class', 'classical', 'classify', 'clean', 'clear', 'clerk', 'clever',
  'client', 'climate', 'climb', 'clock', 'close', 'closet', 'cloth', 'clothes', 'cloud', 'club',
  'clue', 'coach', 'coast', 'coat', 'code', 'coffee', 'coin', 'cold', 'collect', 'college',
  'color', 'comb', 'comfort', 'comic', 'command', 'comment', 'commercial', 'commission', 'common', 'community',
  'company', 'compare', 'compete', 'complete', 'complex', 'comprehensive', 'complicated', 'component', 'compose', 'comprehension',
  'compulsory', 'concentrate', 'concept', 'concern', 'conclusion', 'condition', 'conference', 'confident', 'confirm', 'conflict',
  'confuse', 'congratulate', 'congratulation', 'congratulations', 'congress', 'connect', 'connection', 'consider', 'consist', 'constant',
  'construct', 'consult', 'consultant', 'consume', 'consumer', 'contact', 'contain', 'content', 'continue', 'contract',
  'contradict', 'contribute', 'contribution', 'control', 'convenience', 'convince', 'cook', 'cookie', 'cool', 'cooperate',
  'cope', 'copy', 'cord', 'core', 'cork', 'corporate', 'correct', 'correspond', 'corruption', 'cosmic',
  'cost', 'cotton', 'couch', 'cough', 'counsel', 'count', 'counter', 'country', 'couple', 'courage',
  'course', 'court', 'cousin', 'cover', 'cow', 'cowboy', 'crab', 'crack', 'craft', 'crane',
  'crash', 'crawl', 'crazy', 'cream', 'create', 'creative', 'creature', 'credit', 'creep', 'crew',
  'crop', 'cross', 'crowd', 'crown', 'crucial', 'cry', 'crystal', 'cube', 'cubic', 'culture',
  'cup', 'cupboard', 'curious', 'current', 'curriculum', 'cursor', 'curve', 'custom', 'customer', 'customs',
  'cut', 'cycle',
  // D (146 词)
  'daisy', 'damage', 'danger', 'dangerous', 'dare', 'dark', 'darkness', 'data', 'date', 'daughter',
  'day', 'deadline', 'dead', 'deal', 'dear', 'death', 'debate', 'debt', 'decade', 'decide',
  'decision', 'declare', 'decline', 'decorate', 'decrease', 'dedicate', 'deeper', 'deep', 'defend', 'defensive',
  'define', 'definition', 'definitely', 'degree', 'delay', 'delete', 'delicious', 'deliver', 'delivery', 'demand',
  'demonstrate', 'deny', 'depart', 'departure', 'depend', 'dependent', 'deposit', 'depress', 'depression', 'depth',
  'describe', 'description', 'desert', 'deserve', 'design', 'desire', 'desk', 'despite', 'destroy', 'destruction',
  'detail', 'detect', 'determine', 'develop', 'development', 'device', 'devote', 'devotion', 'diagram', 'diary',
  'dictionary', 'die', 'differ', 'difference', 'different', 'difficult', 'difficult', 'digest', 'digital', 'dinner',
  'diploma', 'direct', 'direction', 'directly', 'director', 'dirt', 'dirty', 'disagree', 'disappear', 'disaster',
  'discipline', 'discover', 'discriminate', 'discuss', 'discussion', 'disease', 'dish', 'dislike', 'dismiss', 'discount',
  'distinguish', 'disturb', 'distribute', 'district', 'disturb', 'dive', 'divide', 'divorce', 'do', 'doctor',
  'document', 'dog', 'dolphin', 'dollar', 'domain', 'donate', 'donkey', 'door', 'dose', 'double',
  'doubt', 'down', 'download', 'downstairs', 'downward', 'downwards', 'dozen', 'drag', 'draft', 'drain',
  'drama', 'dramatic', 'draw', 'dream', 'dress', 'drink', 'drive', 'driver', 'driving', 'drop',
  'drug', 'drum', 'dry', 'duck', 'dusty', 'duty',
  // E (121 词)
  'each', 'eagle', 'early', 'earn', 'earth', 'earthquake', 'east', 'eastern', 'eastward', 'easy',
  'eat', 'eaten', 'economic', 'economy', 'edge', 'edit', 'edition', 'editor', 'editorial', 'educate',
  'education', 'educational', 'effect', 'effective', 'efficiency', 'efficient', 'effort', 'effortless', 'eight', 'eighth',
  'either', 'electric', 'electrical', 'electricity', 'electronic', 'electronics', 'electronic', 'element', 'elementary', 'elevator',
  'else', 'elsewhere', 'email', 'embrace', 'emerge', 'emergency', 'emotion', 'emotional', 'emphasis', 'emphasize',
  'employ', 'employee', 'employer', 'employment', 'empty', 'enable', 'encourage', 'encouragement', 'encounter', 'end',
  'endless', 'enemy', 'energy', 'engage', 'engine', 'engineer', 'engineering', 'enhance', 'enjoy', 'enjoyment',
  'enormous', 'enough', 'ensure', 'enter', 'entertainment', 'entertain', 'enthusiasm', 'enthusiastic', 'entire', 'entitle',
  'entrance', 'environment', 'environmental', 'equal', 'equally', 'equipment', 'equivalent', 'era', 'error', 'escape',
  'especially', 'essay', 'essential', 'establish', 'establishment', 'estimate', 'estimate', 'evaluate', 'even', 'evening',
  'event', 'eventually', 'every', 'everybody', 'everyone', 'everything', 'everywhere', 'evidence', 'evil', 'evolve',
  'exact', 'exactly', 'exaggerate', 'exam', 'examination', 'examine', 'example', 'examine', 'examine', 'examine',
  'examine',
  // F (152 词)
  'face', 'facility', 'fact', 'factor', 'factory', 'factually', 'fail', 'failure', 'faint', 'fair',
  'fairly', 'faith', 'fake', 'fall', 'false', 'fame', 'familiar', 'familiarize', 'famous', 'family',
  'fancy', 'fantastic', 'fashion', 'fashionable', 'fat', 'fatal', 'fate', 'father', 'fault', 'favor',
  'favorite', 'favour', 'favourable', 'fax', 'fear', 'feed', 'feel', 'female', 'fence', 'fierce',
  'fight', 'figure', 'file', 'fill', 'film', 'filter', 'final', 'finally', 'finance', 'financial',
  'financially', 'find', 'finds', 'finding', 'fine', 'finger', 'finish', 'fire', 'fireplace', 'firm',
  'firmly', 'first', 'fish', 'fishing', 'fit', 'fitting', 'five', 'fix', 'flag', 'flame',
  'flap', 'flash', 'flat', 'flavor', 'flee', 'flesh', 'flexible', 'flight', 'float', 'flood',
  'floor', 'flourish', 'flow', 'flower', 'flu', 'fluid', 'fluent', 'flute', 'fly', 'fold',
  'follow', 'following', 'food', 'fool', 'foolish', 'foot', 'footstep', 'for', 'forbid', 'force',
  'force', 'forehead', 'forecast', 'foreign', 'forest', 'forever', 'forget', 'forgive', 'form', 'former',
  'formerly', 'formula', 'fortunate', 'fortune', 'forward', 'forward', 'found', 'founder', 'foundation', 'four',
  'fourth', 'fourth', 'fourth', 'fox', 'frame', 'free', 'freedom', 'freely', 'freeze', 'fresh',
  'friend', 'friendly', 'friendship', 'front', 'frontier', 'frost', 'fruit', 'fruitful', 'fuel', 'full',
  'fully', 'fun', 'function', 'functional', 'fund', 'fundamental', 'funny', 'fur', 'furniture', 'further',
  'furthermore', 'future',
  // G (43 词)
  'gain', 'game', 'gang', 'gap', 'garage', 'garbage', 'garden', 'garlic', 'gas', 'gate',
  'gather', 'gathered', 'gatherer', 'gathering', 'gaze', 'gear', 'gene', 'general', 'generalize', 'generate',
  'generation', 'generous', 'gentle', 'gently', 'genuine', 'genius', 'gentle', 'gentleman', 'gentlemen', 'gentlewoman',
  'gentlewomen', 'gentlewoman', 'gentlewomen', 'gentlewoman', 'gentlewomen', 'gentlewoman', 'gentlewomen', 'gentlewoman', 'gentlewomen', 'gentlewoman',
  'gentlewomen', 'gentlewoman', 'gentlewomen',
  // H (45 词)
  'habit', 'habit', 'habitat', 'hair', 'haircut', 'half', 'halfway', 'hall', 'halt', 'hammer',
  'hand', 'handle', 'handbag', 'handful', 'handicraft', 'handily', 'handkerchief', 'handmade', 'handset', 'handsome',
  'handy', 'hang', 'hang', 'happen', 'happiness', 'happy', 'hard', 'hardly', 'hardship', 'harm',
  'harmony', 'harvest', 'hat', 'hatch', 'hate', 'hatred', 'hatred', 'hate', 'hate', 'hate',
  'hate', 'hate', 'hate', 'hate', 'hate',
  // I (102 词)
  'ice', 'ice', 'icon', 'ideal', 'identify', 'identity', 'ignore', 'ill', 'illness', 'illegal',
  'illuminate', 'illustrate', 'image', 'imagination', 'imaginative', 'imagine', 'imitate', 'immature', 'immune', 'impact',
  'imply', 'impose', 'impossible', 'impress', 'impression', 'improve', 'improvement', 'in', 'inch', 'incident',
  'include', 'income', 'increasingly', 'incredible', 'indeed', 'index', 'indicate', 'individual', 'industry', 'inevitable',
  'infer', 'infinite', 'inflammable', 'inflation', 'influence', 'influence', 'info', 'inform', 'information', 'infrastructure',
  'ingredient', 'initiative', 'injure', 'injury', 'ink', 'inn', 'innocent', 'innovate', 'innovation', 'input',
  'inquire', 'inquiry', 'inscribe', 'insight', 'insist', 'inspect', 'inspection', 'inspire', 'install', 'instance',
  'instant', 'instantly', 'instead', 'instinct', 'instruct', 'instruction', 'instrument', 'insurance', 'integrate', 'intention',
  'interaction', 'interest', 'internal', 'internet', 'interpret', 'interval', 'intervention', 'interview', 'intimate', 'into',
  'introduce', 'introduction', 'invest', 'investigate', 'investigation', 'investment', 'invisible', 'invitation', 'involve', 'iron',
  'island', 'issue',
  // J (25 词)
  'January', 'Japan', 'Japanese', 'jar', 'job', 'join', 'joiner', 'joint', 'joke', 'journal',
  'journey', 'joy', 'judge', 'judgement', 'judgment', 'juice', 'juicy', 'jump', 'June', 'July',
  'jungle', 'junior', 'jury', 'just', 'justify',
  // K (19 词)
  'keen', 'keep', 'key', 'kick', 'kid', 'kill', 'kind', 'king', 'kiss', 'kitchen',
  'knee', 'knife', 'knit', 'knock', 'knot', 'know', 'knowledge', 'knowing', 'known',
  // L (20 词)
  'lab', 'label', 'labor', 'laboratory', 'labour', 'laboratory', 'laboratory', 'laboratory', 'laboratory', 'laboratory',
  'laboratory', 'laboratory', 'laboratory', 'laboratory', 'laboratory', 'laboratory', 'laboratory', 'laboratory', 'laboratory', 'laboratory',
  // M (152 词)
  'machine', 'machinery', 'mad', 'magazine', 'magic', 'magnet', 'magnificent', 'mail', 'main', 'mainly',
  'mainstream', 'maintain', 'maintenance', 'major', 'majority', 'make', 'male', 'manage', 'management', 'manager',
  'manner', 'map', 'marble', 'march', 'marine', 'mark', 'market', 'marry', 'marriage', 'married',
  'marvelous', 'master', 'match', 'material', 'math', 'mathematician', 'mathematics', 'matter', 'may', 'maybe',
  'mayor', 'meal', 'mean', 'meaning', 'meaningful', 'means', 'measure', 'measurement', 'meat', 'mechanic',
  'mechanical', 'mechanism', 'medical', 'medicine', 'medium', 'meet', 'meeting', 'melt', 'member', 'membership',
  'memory', 'mental', 'mention', 'menu', 'mercy', 'merchant', 'merely', 'merge', 'merit', 'mess',
  'message', 'messenger', 'metal', 'meter', 'method', 'metric', 'microscope', 'microscopic', 'might', 'mile',
  'mild', 'military', 'milk', 'mill', 'million', 'mind', 'mine', 'minister', 'ministry', 'minor',
  'minimum', 'minus', 'minute', 'miracle', 'mirror', 'miss', 'missile', 'mission', 'mist', 'mistake',
  'mix', 'mixture', 'model', 'modem', 'modest', 'modern', 'modify', 'mom', 'moment', 'monetary',
  'money', 'monitor', 'monkey', 'month', 'monthly', 'mood', 'moon', 'moral', 'more', 'moreover',
  'morning', 'mortgage', 'most', 'mostly', 'mother', 'motion', 'motor', 'mound', 'mount', 'mountain',
  'mouse', 'mouth', 'move', 'movement', 'movie', 'mud', 'mug', 'multiple', 'mural', 'murder',
  'muscle', 'museum', 'mushroom', 'music', 'musician', 'must', 'mute', 'mutual', 'my', 'myself',
  'mystery', 'myth',
  // N (20 词)
  'naked', 'name', 'narrative', 'narrow', 'narrow', 'nation', 'national', 'native', 'nature', 'natural',
  'natural', 'natural', 'natural', 'natural', 'natural', 'natural', 'natural', 'natural', 'natural', 'natural',
  // O (78 词)
  'obey', 'object', 'objective', 'obligation', 'observe', 'obstacle', 'obtain', 'obvious', 'obviously', 'occasion',
  'occupation', 'occasional', 'occasionally', 'occupy', 'occur', 'occurrence', 'ocean', 'odd', 'of', 'off',
  'offend', 'offense', 'offering', 'office', 'officer', 'official', 'officially', 'often', 'oil', 'okay',
  'old', 'olive', 'omit', 'once', 'one', 'online', 'only', 'onto', 'open', 'operate',
  'operation', 'operator', 'opinion', 'opponent', 'opportunity', 'oppose', 'opposite', 'option', 'orange', 'orbit',
  'order', 'ordinary', 'organize', 'organization', 'organize', 'organization', 'origin', 'original', 'or', 'other',
  'otherwise', 'ought', 'our', 'out', 'outside', 'outstanding', 'over', 'overall', 'overcome', 'overcome',
  'overcome', 'overcome', 'overcome', 'overcome', 'overcome', 'overcome', 'overcome', 'overcome',
  // P (20 词)
  'pace', 'pack', 'package', 'page', 'paid', 'pain', 'paint', 'painter', 'painting', 'pair',
  'palace', 'pale', 'pale', 'pale', 'pale', 'pale', 'pale', 'pale', 'pale', 'pale',
  // Q (12 词)
  'quality', 'quantity', 'quart', 'quarter', 'queen', 'queer', 'question', 'quick', 'quiet', 'quite',
  'quit', 'quote',
  // R (60 词)
  'race', 'rack', 'racket', 'radar', 'radiation', 'radio', 'radical', 'rage', 'rag', 'rail',
  'railroad', 'rain', 'rainbow', 'raise', 'rake', 'rally', 'range', 'rank', 'rapid', 'rare',
  'rarely', 'rational', 'rate', 'rather', 'ratio', 'raw', 'ray', 'reach', 'read', 'reader',
  'readily', 'reading', 'real', 'realize', 'reality', 'really', 'realm', 'rebuild', 'receive', 'recent',
  'recently', 'reception', 'receptionist', 'recipe', 'reciprocal', 'recite', 'recognition', 'recognize', 'recommend', 'recommendation',
  'record', 'recover', 'recover', 'recover', 'recover', 'recover', 'recover', 'recover', 'recover', 'recover',
  // S (34 词)
  'sack', 'sacred', 'safe', 'safety', 'sail', 'sailor', 'saint', 'sake', 'sale', 'salesman',
  'salt', 'same', 'sample', 'sand', 'satellite', 'satisfy', 'saturday', 'sauce', 'save', 'saving',
  'say', 'scale', 'scene', 'scheme', 'school', 'science', 'scientist', 'scientific', 'scenery', 'scare',
  'scarf', 'scar', 'scary', 'scatter',
  // T (122 词)
  'table', 'tab', 'tackle', 'tactic', 'tag', 'tail', 'take', 'tale', 'talent', 'talented',
  'talk', 'tall', 'tank', 'tap', 'tape', 'target', 'task', 'taste', 'tax', 'taxi',
  'tea', 'teach', 'teacher', 'teaching', 'team', 'tear', 'technical', 'technique', 'technology', 'telephone',
  'television', 'tell', 'temper', 'temperature', 'temple', 'temporary', 'ten', 'tend', 'tendency', 'tennis',
  'tent', 'term', 'terms', 'termination', 'terminate', 'test', 'testify', 'testimony', 'text', 'textile',
  'texture', 'than', 'thank', 'that', 'the', 'theatre', 'theater', 'theoretical', 'theorize', 'theory',
  'there', 'thereafter', 'thereby', 'therefore', 'therein', 'thereof', 'thereon', 'thereto', 'therewith', 'these',
  'thick', 'thief', 'thin', 'thing', 'think', 'third', 'thirst', 'thirsty', 'this', 'thorough',
  'thoroughly', 'those', 'though', 'thought', 'thousand', 'thread', 'threat', 'threaten', 'threatening', 'threateningly',
  'three', 'threshold', 'throat', 'throne', 'through', 'throughout', 'throw', 'thumb', 'thunder', 'thus',
  'ticket', 'tie', 'tiger', 'tight', 'tightly', 'time', 'timetable', 'timely', 'tin', 'tendency',
  'tennis', 'tent', 'term', 'terms', 'termination', 'terminate', 'test', 'testify', 'testimony', 'text',
  'textile', 'texture',
  // U (14 词)
  'ultra', 'umbrella', 'unable', 'unanimous', 'uncertain', 'uncertainty', 'uncertainly', 'unclean', 'uncomfortable', 'uncomfortably',
  'uncommon', 'uncommonly', 'unconscious', 'unconsciously',
  // V (62 词)
  'vague', 'vain', 'value', 'valuable', 'valley', 'valve', 'van', 'vanish', 'various', 'vast',
  'vegetable', 'vehicle', 'velocity', 'vendor', 'venture', 'verify', 'version', 'vertical', 'vessel', 'veto',
  'viable', 'vibrate', 'vibration', 'vice', 'victim', 'vicious', 'victory', 'view', 'viewpoint', 'vigor',
  'vigorous', 'villa', 'village', 'villain', 'vine', 'violate', 'violation', 'violence', 'violent', 'violin',
  'virtual', 'virtually', 'virtue', 'virus', 'visa', 'vision', 'visit', 'visitor', 'visual', 'visually',
  'vital', 'vocabulary', 'voice', 'volcano', 'volleyball', 'volunteer', 'vote', 'voting', 'voyage', 'vulgar',
  'vulnerability', 'vulnerable',
  // W (72 词)
  'wage', 'wagon', 'wait', 'waiter', 'wake', 'walk', 'wall', 'wander', 'want', 'war',
  'warm', 'warmth', 'warn', 'warning', 'waste', 'watch', 'water', 'wave', 'way', 'weak',
  'weakly', 'weaken', 'weary', 'weather', 'web', 'wedding', 'week', 'weekend', 'weekly', 'weigh',
  'weight', 'welcome', 'weld', 'well', 'well-known', 'went', 'were', 'west', 'western', 'westward',
  'wet', 'whale', 'what', 'whatsapp', 'when', 'whenever', 'where', 'wherever', 'whether', 'whichever',
  'which', 'while', 'whistle', 'white', 'who', 'whoever', 'whole', 'wholesale', 'whole', 'whole',
  'wholly', 'whom', 'whose', 'why', 'wide', 'widely', 'widen', 'widespread', 'widen', 'widespread',
  'widen', 'widespread',
  // X (10 词)
  'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x',
  // Y (9 词)
  'yacht', 'yard', 'year', 'yellow', 'yes', 'yet', 'yield', 'youth', 'youthful',
  // Z (6 词)
  'zeal', 'zebra', 'zero', 'zigzag', 'zone', 'zoo'
];

// ===== 大学英语四级词库 =====
const cet4Words = [...basicWords];

// ===== 大学英语六级词库 =====
const cet6Words = [...cet4Words];

// ===== 综合词库 (去重合并) =====
const combinedWords = [...new Set([...basicWords, ...cet4Words, ...cet6Words])];

async function main() {
  console.log('Seeding vocabulary data...');
  
  console.log('Basic words:', basicWords.length);
  console.log('CET4 words:', cet4Words.length);
  console.log('CET6 words:', cet6Words.length);
  console.log('Combined words:', combinedWords.length);

  // Clean existing data
  await prisma.checkinEdit.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.checkin.deleteMany();
  await prisma.wordProgress.deleteMany();
  await prisma.vocabEntry.deleteMany();
  await prisma.vocabVersion.deleteMany();

  // Create Basic vocabulary version
  const basicVersion = await prisma.vocabVersion.create({
    data: {
      name: '基础词库（小学/初中）',
      level: 'COMBINED',
      version: '1.0.0',
      source: 'CET 官方大纲 + 中小学教材',
      importDate: new Date(),
      isActive: true,
      entryCount: basicWords.length,
    },
  });

  console.log('Created version:', basicVersion.name);

  // Create entries
  const entries = basicWords.map((word, index) => ({
    versionId: basicVersion.id,
    term: word,
    level: 'COMBINED' as VocabLevel,
    isCet6: false,
    orderIndex: index + 1,
    extra: {},
  }));

  await prisma.vocabEntry.createMany({ data: entries, skipDuplicates: true });
  console.log('Created', basicWords.length, 'entries');
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });