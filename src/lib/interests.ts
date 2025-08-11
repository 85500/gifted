export type InterestKey = keyof typeof INTEREST_CLUSTERS
export const INTEREST_CLUSTERS = {
  tech:["software","engineer","programmer","ai","ml","data","linux","arduino","raspberry pi","gadget","ipad","iphone","android","mechanical keyboard"],
  gamer:["steam","xbox","playstation","nintendo","esports","twitch","fps","rpg","mmorpg"],
  outdoors:["hiking","camping","climbing","trail","backpacking","national park","kayak","fishing"],
  homechef:["chef","cooking","kitchen","sous vide","espresso","barista","baking","wine","beer","foodie"],
  maker:["maker","3d print","cnc","woodworking","craft","sewing","cosplay"],
  fitness:["fitness","gym","running","cycling","peloton","yoga","crossfit","marathon"],
  bookworm:["goodreads","author","novel","book club","sci-fi","fantasy","nonfiction","history"],
  music:["spotify","apple music","band","guitar","piano","dj","vinyl","concert"],
  fashion:["ootd","fashion","sneaker","streetwear","makeup","skincare","hairstyle"],
  cozyhome:["home decor","plants","gardening","indoor","apartment","aroma","candle"],
  parent:["mom","dad","parent","toddler","newborn","pregnant","kindergarten"],
  pet:["dog","cat","pet","rescue","vet","puppy","kitten","aquarium"]
} as const
export const OCCASION_BOOST: Record<string, Partial<Record<keyof typeof INTEREST_CLUSTERS, number>>> = {
  wedding:{cozyhome:0.8,homechef:0.6},
  anniversary:{homechef:0.5,music:0.4,fashion:0.3},
  birthday:{},
  new_baby:{parent:1.0},
  housewarming:{cozyhome:1.0,homechef:0.6}
}