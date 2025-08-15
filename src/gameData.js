// Enhanced word database for Hangman game
// 150+ common English words (4-8 letters) organized by categories

export const gameData = {
  ANIMALS: {
    name: 'Animals',
    color: '#22543d', // Forest green
    words: [
      { word: 'BEAR', hint: 'Large mammal that hibernates in winter' },
      { word: 'WOLF', hint: 'Pack animal that howls at the moon' },
      { word: 'DEER', hint: 'Graceful animal with antlers' },
      { word: 'LION', hint: 'King of the jungle' },
      { word: 'TIGER', hint: 'Striped big cat from Asia' },
      { word: 'EAGLE', hint: 'Majestic bird of prey' },
      { word: 'SHARK', hint: 'Feared ocean predator' },
      { word: 'WHALE', hint: 'Largest mammal in the ocean' },
      { word: 'HORSE', hint: 'Animal used for riding and racing' },
      { word: 'ZEBRA', hint: 'African animal with black and white stripes' },
      { word: 'GIRAFFE', hint: 'Tallest animal in the world' },
      { word: 'MONKEY', hint: 'Playful primate that swings from trees' },
      { word: 'RABBIT', hint: 'Fast hopping animal with long ears' },
      { word: 'TURTLE', hint: 'Slow reptile with a shell' },
      { word: 'FROG', hint: 'Amphibian that croaks and jumps' },
      { word: 'SNAKE', hint: 'Long reptile without legs' },
      { word: 'BIRD', hint: 'Flying animal with feathers' },
      { word: 'FISH', hint: 'Swimming animal with gills' },
      { word: 'CAT', hint: 'Common pet that purrs' },
      { word: 'DOG', hint: 'Loyal pet known as mans best friend' },
      { word: 'COW', hint: 'Farm animal that gives milk' },
      { word: 'PIG', hint: 'Pink farm animal that oinks' },
      { word: 'SHEEP', hint: 'Woolly farm animal' },
      { word: 'GOAT', hint: 'Farm animal that climbs and eats everything' },
      { word: 'DUCK', hint: 'Water bird that quacks' },
      { word: 'CHICKEN', hint: 'Farm bird that lays eggs' },
      { word: 'MOUSE', hint: 'Small rodent that squeaks' },
      { word: 'RAT', hint: 'Larger rodent often found in cities' },
      { word: 'BAT', hint: 'Flying mammal active at night' },
      { word: 'OWL', hint: 'Wise nocturnal bird' },
      { word: 'FOX', hint: 'Clever red-furred animal' },
      { word: 'SEAL', hint: 'Marine mammal that barks' },
      { word: 'CRAB', hint: 'Ocean creature that walks sideways' },
      { word: 'SPIDER', hint: 'Eight-legged creature that spins webs' },
      { word: 'ANT', hint: 'Tiny insect that works in colonies' },
      { word: 'BEE', hint: 'Flying insect that makes honey' },
      { word: 'FLY', hint: 'Common buzzing insect' },
      { word: 'MOTH', hint: 'Night-flying insect attracted to light' }
    ]
  },
  
  FOOD: {
    name: 'Food',
    color: '#dc2626', // Red
    words: [
      { word: 'PIZZA', hint: 'Italian dish with cheese and toppings' },
      { word: 'BURGER', hint: 'Sandwich with meat patty' },
      { word: 'PASTA', hint: 'Italian noodles in many shapes' },
      { word: 'BREAD', hint: 'Baked staple food made from flour' },
      { word: 'CHEESE', hint: 'Dairy product made from milk' },
      { word: 'APPLE', hint: 'Red or green crunchy fruit' },
      { word: 'BANANA', hint: 'Yellow curved tropical fruit' },
      { word: 'ORANGE', hint: 'Citrus fruit rich in vitamin C' },
      { word: 'GRAPE', hint: 'Small fruit that grows in bunches' },
      { word: 'LEMON', hint: 'Sour yellow citrus fruit' },
      { word: 'CHERRY', hint: 'Small red fruit with a pit' },
      { word: 'PEACH', hint: 'Fuzzy orange summer fruit' },
      { word: 'PEAR', hint: 'Sweet fruit shaped like a teardrop' },
      { word: 'PLUM', hint: 'Purple or red stone fruit' },
      { word: 'MANGO', hint: 'Sweet tropical fruit' },
      { word: 'MELON', hint: 'Large round juicy fruit' },
      { word: 'BERRY', hint: 'Small colorful fruit' },
      { word: 'CAKE', hint: 'Sweet baked dessert for celebrations' },
      { word: 'COOKIE', hint: 'Small sweet baked treat' },
      { word: 'CANDY', hint: 'Sweet confection' },
      { word: 'HONEY', hint: 'Sweet substance made by bees' },
      { word: 'SUGAR', hint: 'Sweet white crystals' },
      { word: 'SALT', hint: 'White seasoning from the sea' },
      { word: 'PEPPER', hint: 'Spicy black seasoning' },
      { word: 'RICE', hint: 'White grain staple food' },
      { word: 'BEANS', hint: 'Protein-rich legumes' },
      { word: 'CORN', hint: 'Yellow kernels on a cob' },
      { word: 'POTATO', hint: 'Underground vegetable for fries' },
      { word: 'CARROT', hint: 'Orange root vegetable' },
      { word: 'ONION', hint: 'Layered vegetable that makes you cry' },
      { word: 'TOMATO', hint: 'Red fruit used as a vegetable' },
      { word: 'LETTUCE', hint: 'Green leafy salad vegetable' },
      { word: 'SPINACH', hint: 'Dark green leafy vegetable' },
      { word: 'BROCCOLI', hint: 'Green tree-like vegetable' },
      { word: 'CELERY', hint: 'Crunchy green vegetable stalk' },
      { word: 'GARLIC', hint: 'Strong-smelling bulb seasoning' },
      { word: 'GINGER', hint: 'Spicy root used in cooking' },
      { word: 'MINT', hint: 'Fresh herb with cooling flavor' }
    ]
  },
  
  PLACES: {
    name: 'Places',
    color: '#0284c7', // Blue
    words: [
      { word: 'BEACH', hint: 'Sandy shore by the ocean' },
      { word: 'FOREST', hint: 'Dense area filled with trees' },
      { word: 'DESERT', hint: 'Hot dry sandy region' },
      { word: 'MOUNTAIN', hint: 'High rocky peak' },
      { word: 'RIVER', hint: 'Flowing body of water' },
      { word: 'LAKE', hint: 'Large body of still water' },
      { word: 'OCEAN', hint: 'Vast body of salt water' },
      { word: 'ISLAND', hint: 'Land surrounded by water' },
      { word: 'VALLEY', hint: 'Low area between hills' },
      { word: 'HILL', hint: 'Small elevated area of land' },
      { word: 'CAVE', hint: 'Underground hollow space' },
      { word: 'PARK', hint: 'Green space for recreation' },
      { word: 'GARDEN', hint: 'Area for growing plants' },
      { word: 'FARM', hint: 'Land for growing crops and animals' },
      { word: 'CITY', hint: 'Large urban area' },
      { word: 'TOWN', hint: 'Small urban community' },
      { word: 'VILLAGE', hint: 'Small rural community' },
      { word: 'SCHOOL', hint: 'Place for learning and education' },
      { word: 'HOSPITAL', hint: 'Place for medical care' },
      { word: 'LIBRARY', hint: 'Place filled with books' },
      { word: 'MUSEUM', hint: 'Place displaying art and history' },
      { word: 'THEATER', hint: 'Place for watching plays and movies' },
      { word: 'STORE', hint: 'Place for buying goods' },
      { word: 'MARKET', hint: 'Place for buying fresh goods' },
      { word: 'MALL', hint: 'Large shopping center' },
      { word: 'HOTEL', hint: 'Place for travelers to stay' },
      { word: 'AIRPORT', hint: 'Place where planes take off and land' },
      { word: 'STATION', hint: 'Place where trains stop' },
      { word: 'BRIDGE', hint: 'Structure crossing over water' },
      { word: 'TUNNEL', hint: 'Underground passage' },
      { word: 'ROAD', hint: 'Path for vehicles to travel' },
      { word: 'STREET', hint: 'Urban road with buildings' },
      { word: 'AVENUE', hint: 'Wide city street' },
      { word: 'PLAZA', hint: 'Open public square' },
      { word: 'CASTLE', hint: 'Medieval fortress palace' },
      { word: 'PALACE', hint: 'Grand royal residence' },
      { word: 'TEMPLE', hint: 'Sacred place of worship' },
      { word: 'CHURCH', hint: 'Christian place of worship' }
    ]
  },
  
  OBJECTS: {
    name: 'Objects',
    color: '#7c3aed', // Purple
    words: [
      { word: 'CHAIR', hint: 'Furniture for sitting' },
      { word: 'TABLE', hint: 'Flat surface with legs' },
      { word: 'LAMP', hint: 'Device that provides light' },
      { word: 'BOOK', hint: 'Collection of pages with words' },
      { word: 'PEN', hint: 'Writing instrument with ink' },
      { word: 'PENCIL', hint: 'Writing tool with graphite' },
      { word: 'PAPER', hint: 'Thin material for writing' },
      { word: 'PHONE', hint: 'Device for making calls' },
      { word: 'CAMERA', hint: 'Device for taking pictures' },
      { word: 'CLOCK', hint: 'Device that shows time' },
      { word: 'WATCH', hint: 'Timepiece worn on wrist' },
      { word: 'KEY', hint: 'Metal tool for opening locks' },
      { word: 'LOCK', hint: 'Security device opened with a key' },
      { word: 'DOOR', hint: 'Entrance to a room or building' },
      { word: 'WINDOW', hint: 'Glass opening in a wall' },
      { word: 'MIRROR', hint: 'Reflective glass surface' },
      { word: 'BRUSH', hint: 'Tool with bristles for cleaning' },
      { word: 'COMB', hint: 'Tool for arranging hair' },
      { word: 'TOWEL', hint: 'Cloth for drying' },
      { word: 'SOAP', hint: 'Cleaning agent that makes bubbles' },
      { word: 'BOTTLE', hint: 'Container for liquids' },
      { word: 'CUP', hint: 'Small drinking container' },
      { word: 'GLASS', hint: 'Transparent drinking container' },
      { word: 'PLATE', hint: 'Flat dish for serving food' },
      { word: 'BOWL', hint: 'Round deep dish' },
      { word: 'SPOON', hint: 'Utensil for eating liquids' },
      { word: 'FORK', hint: 'Utensil with prongs' },
      { word: 'KNIFE', hint: 'Sharp cutting utensil' },
      { word: 'BAG', hint: 'Container for carrying items' },
      { word: 'BOX', hint: 'Square container for storage' },
      { word: 'BASKET', hint: 'Woven container' },
      { word: 'BUCKET', hint: 'Round container with handle' },
      { word: 'HAMMER', hint: 'Tool for hitting nails' },
      { word: 'NAIL', hint: 'Metal fastener hit by hammer' },
      { word: 'SCREW', hint: 'Threaded metal fastener' },
      { word: 'ROPE', hint: 'Thick cord for tying' },
      { word: 'STRING', hint: 'Thin cord or thread' },
      { word: 'THREAD', hint: 'Very thin strand for sewing' },
      { word: 'NEEDLE', hint: 'Sharp tool for sewing' },
      { word: 'BUTTON', hint: 'Small fastener for clothes' },
      { word: 'ZIPPER', hint: 'Sliding fastener for clothes' },
      { word: 'SHOE', hint: 'Footwear for protection' },
      { word: 'HAT', hint: 'Head covering accessory' },
      { word: 'SHIRT', hint: 'Upper body clothing' },
      { word: 'PANTS', hint: 'Lower body clothing' }
    ]
  }
};

// Get all categories as an array
export const getAllCategories = () => {
  return Object.keys(WORD_CATEGORIES);
};

// Get a random word from a specific category
export const getRandomWordFromCategory = (category) => {
  const categoryData = WORD_CATEGORIES[category];
  if (!categoryData || !categoryData.words.length) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * categoryData.words.length);
  return {
    ...categoryData.words[randomIndex],
    category: category,
    categoryName: categoryData.name,
    categoryColor: categoryData.color
  };
};

// Get a random word from any category
export const getRandomWord = () => {
  const categories = getAllCategories();
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  return getRandomWordFromCategory(randomCategory);
};

// Get category information
export const getCategoryInfo = (category) => {
  return WORD_CATEGORIES[category] || null;
};

// Hangman ASCII art stages (6 wrong guesses maximum)
export const HANGMAN_STAGES = [
  '', // 0 wrong guesses
  '  |\n  |\n  |\n  |\n  |', // 1
  '  +---+\n  |   |\n      |\n      |\n      |\n  ====', // 2
  '  +---+\n  |   |\n  O   |\n      |\n      |\n  ====', // 3
  '  +---+\n  |   |\n  O   |\n  |   |\n      |\n  ====', // 4
  '  +---+\n  |   |\n  O   |\n /|   |\n      |\n  ====', // 5
  '  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n  ====', // 6
  '  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n  ====', // 7 (game over)
];

export default {
  WORD_CATEGORIES,
  getAllCategories,
  getRandomWordFromCategory,
  getRandomWord,
  getCategoryInfo,
  HANGMAN_STAGES
};

