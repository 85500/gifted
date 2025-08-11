export type InterestKey = keyof typeof INTEREST_CLUSTERS

export const INTEREST_CLUSTERS = {
  tech: ["software", "engineer", "programmer", "ai", "ml", "data", "linux", "arduino", "raspberry pi", "gadget", "ipad", "iphone", "android", "mechanical keyboard"],
  gamer: ["steam", "xbox", "playstation", "nintendo", "esports", "twitch", "fps", "rpg", "mmorpg"],
  outdoors: ["hiking", "camping", "climbing", "trail", "backpacking", "national park", "kayak", "fishing"],
  homechef: ["chef", "cooking", "kitchen", "sous vide", "espresso", "barista", "baking", "wine", "beer", "foodie"],
  maker: ["maker", "3d print", "cnc", "woodworking", "craft", "sewing", "cosplay"],
  fitness: ["fitness", "gym", "running", "cycling", "peloton", "yoga", "crossfit", "marathon"],
  bookworm: ["goodreads", "author", "novel", "book club", "sci-fi", "fantasy", "nonfiction", "history"],
  music: ["spotify", "apple music", "band", "guitar", "piano", "dj", "vinyl", "concert"],
  fashion: ["ootd", "fashion", "sneaker", "streetwear", "makeup", "skincare", "hairstyle"],
  cozyhome: ["home decor", "plants", "gardening", "indoor", "apartment", "aroma", "candle"],
  parent: ["mom", "dad", "parent", "toddler", "newborn", "pregnant", "kindergarten"],
  pet: ["dog", "cat", "pet", "rescue", "vet", "puppy", "kitten", "aquarium"]
} as const

export const OCCASION_BOOST: Record<string, Partial<Record<keyof typeof INTEREST_CLUSTERS, number>>> = {
  wedding: { cozyhome: 0.8, homechef: 0.6 },
  anniversary: { homechef: 0.5, music: 0.4, fashion: 0.3 },
  birthday: {},
  new_baby: { parent: 1.0 },
  housewarming: { cozyhome: 1.0, homechef: 0.6 }
}

export const CLUSTER_QUERIES: Record<keyof typeof INTEREST_CLUSTERS, string[]> = {
  tech: [
    "mechanical keyboard hot-swap wireless",
    "usb-c hub 8-in-1",
    "smart home hub matter thread",
    "anker power bank 20k 65w",
    "raspberry pi kit"
  ],
  gamer: [
    "xbox controller elite",
    "steam deck accessory case dock",
    "gaming headset wireless",
    "rgb mouse pad xl",
    "8bitdo controller"
  ],
  outdoors: [
    "hiking daypack 20l",
    "camping stove backpacking",
    "insulated water bottle 40oz",
    "headlamp rechargeable",
    "camp chair ultralight"
  ],
  homechef: [
    "espresso scale with timer",
    "cast iron skillet 12 inch",
    "vacuum sealer",
    "chef knife 8 inch",
    "sourdough banneton set"
  ],
  maker: [
    "3d printer filament sampler",
    "soldering station",
    "woodworking clamps set",
    "rotary tool kit",
    "sewing kit deluxe"
  ],
  fitness: [
    "adjustable dumbbells",
    "massage gun",
    "running belt phone",
    "foam roller",
    "yoga mat non-slip"
  ],
  bookworm: [
    "kindle paperwhite",
    "book light rechargeable",
    "bookends metal",
    "notebook dotted",
    "fountain pen"
  ],
  music: [
    "noise cancelling headphones",
    "vinyl record cleaning kit",
    "bluetooth speaker portable",
    "guitar tuner clip-on",
    "microphone usb"
  ],
  fashion: [
    "leather wallet rfid",
    "silk pillowcase",
    "skincare set",
    "sneaker cleaner kit",
    "watch box organizer"
  ],
  cozyhome: [
    "throw blanket weighted",
    "scented candle set",
    "indoor plant grow light",
    "frame set gallery wall",
    "aeropress coffee"
  ],
  parent: [
    "white noise machine",
    "baby monitor",
    "diaper bag backpack",
    "stroller organizer",
    "silicone bibs"
  ],
  pet: [
    "automatic pet feeder",
    "pet hair remover",
    "cat tree",
    "dog harness no pull",
    "aquarium test kit"
  ]
}
