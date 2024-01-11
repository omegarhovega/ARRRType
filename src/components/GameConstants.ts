// sets opponent WPM speed for campaign games against computer
export const OPPONENT_WPM: Record<number, number> = {
    1: 20,
    2: 30,
    3: 40,
    4: 50,
    5: 60,
    6: 70,
    7: 80,
    8: 90,
    9: 100,
    10: 110,
    11: 120,
    12: 130,
    13: 140,
    14: 150,
    15: 160
};

// ranking system based on levels successfully completed
export const RANKS: Record<number, string> = {
    0: "Landlubber",
    1: "Deck Hand",
    2: "Swabbie",
    3: "Lookout",
    4: "Powder Monkey",
    5: "Gunner's Mate",
    6: "Boatswain",
    7: "Helmsman",
    8: "Quartermaster",
    9: "Ship's Surgeon",
    10: "First Mate",
    11: "Master Gunner",
    12: "Sailing Master",
    13: "Captain's Advisor",
    14: "Pirate Captain",
    15: "Dread Pirate",
};

export const WINNINGS: Record<number, number> = {
    1: 20,
    2: 30,
    3: 40,
    4: 50,
    5: 60,
    6: 70,
    7: 80,
    8: 90,
    9: 100,
    10: 110,
    11: 120,
    12: 130,
    13: 140,
    14: 150,
    15: 160
};

// calculated as length of OPPONENT_WPM records defined above
export const LEVELS = Object.keys(OPPONENT_WPM).length;

// sets countdown length
export const DEFAULT_COUNTDOWN_VALUE = 3;

// maximum number of players in an online PvP game
export const MAX_PLAYERS = 3;

// maximum rounds in a game vs. a computer opponent in campaign mode  (default: best of 3)
export const MAX_ROUNDS = 3;

// Taunts for campaign games vs. computer opponent
export const PIRATE_TAUNTS: string[] = [
    "Ye type like a drunken sailor who's lost his sea legs!",
    "I've seen better typing from a parrot with a quill in its beak!",
    "Ye be slower than a snail in a race across the deck!",
    "Me peg leg could outtype ye even with a blindfold on!",
    "Ye be as tangled in yer words as a fishin' net in a storm!",
    "I've faced fiercer storms in me teacup than yer typing skills!",
    "Ye be typin' like a seasick sailor, all wobbly and confused!",
    "Arrr, even me old sea charts make more sense than yer words!",
    "Ye be duller than a rusty cutlass when it comes to typin'!",
    "I reckon even a ghost ship moves faster than yer fingers!",
    "Ye be missin' keys like a blind lookout in a crow's nest!",
    "Arrr, I've heard more graceful typing from a crew of drunken pirates!",
    "Ye be as steady as a Jolly Roger in the fiercest hurricane, matey!",
    "I've seen shipwrecked messages in bottles with better grammar!",
    "Ye be typin' with the finesse of a cannonball through the hull!",
    "Arrr, ye're so slow, ye make a sea cucumber look agile!",
    "Ye type like a ship in irons, stuck and goin' nowhere fast!",
    "I reckon even a ship's cat could outtype ye with its claws!",
    "Ye be typin' as if the Kraken's got yer fingers in its grip!",
    "Arrr, ye're a landlubber lost in a world of typing buccaneers!",
    "Ye be sailin' like a landlubber with a paper hat!",
    "Arrr, me parrot types faster than ye do!",
    "Ye be more lost than a treasure map in a storm!",
    "I've seen barnacles with better typing skills!",
    "Ye couldn't swab a deck, let alone type a word!",
    "Arrr, ye be a slowpoke even Davy Jones would laugh at!",
    "Me grandmother types faster with one hand tied behind her back!",
    "Ye call that typing? It's more like a drunken stumble on a keyboard!",
    "I've plundered faster ships than ye type words, matey!",
    "Ye be as quick as a three-legged sea turtle on a sandy beach!",
    "Ye type as if ye be swiggin' grog by the barrel!",
    "I've seen shipwrecks with better accuracy than yer typing!",
    "Arrr, ye be slower than a snail's race on a slippery deck!",
    "Me peg leg could outtype ye blindfolded, matey!",
    "Ye be more tangled in yer words than a fishin' net in a storm!",
    "I've faced fiercer storms in me teacup than ye on the keyboard!",
    "Ye be typin' like a seasick sailor, all wobbly and confused!",
    "Arrr, even me old sea charts make more sense than yer words!",
    "Ye be as sharp as a rusty cutlass when it comes to typin'!",
    "I reckon even a ghost ship moves faster than yer fingers!",
    "Ye be missin' keys like a blind lookout in a crow's nest!",
    "Arrr, I've heard better typing from a crew of drunken pirates!",
    "Ye be as steady as a Jolly Roger in a hurricane, matey!",
    "I've seen shipwrecked messages in bottles with better grammar!",
    "Ye be typin' with the finesse of a cannonball through the hull!",
    "Arrr, ye're so slow, ye make a sea cucumber look agile!",
    "Ye type like a ship in irons, stuck and goin' nowhere fast!",
    "I reckon even a ship's cat could outtype ye with its claws!",
    "Ye be typin' as if the Kraken's got yer fingers in its grip!",
    "Arrr, ye're a landlubber in a world of typing buccaneers!",
];