"use strict";

const QUEST_ID_MOD = 90000;

const C = {
	p: "#FF1493",
	lp: "#FF69B4",
	r: "#FF0000",
	lr: "#FA8072",
	g: "#4de19c",
	lg: "#5bc0be",
	y: "#fdff00",
	ly: "#FFD54F",
	o: "#daa520",
	b: "#436eee",
	lb: "#08b3e5",
	v: "#9966cc"
};

const GROUP_TITLE = {
	high: "On this server",
	other: "Other dungeons",
	low: "Low lvl",
	events: "Events",
	unknown: "On this server"
};

const GROUP_ORDER = ["high", "other", "low", "events", "unknown"];

// One row per dungeon. `instances` lists normal first, then hard / other versions.
const FAMILIES = [
	{ key: "velik-sanctuary", name: "Velik's Sanctuary", instances: [9781, 9981, 8999, 9714], quests: [2142, 2190, 2143], group: "high", color: C.lp },
	{ key: "rk9", name: "RK-9 Kennel", instances: [9735, 9935, 3034, 3107], quests: [2152, 2206], group: "high", color: C.lr },
	{ key: "grotto", name: "Grotto of Lost Souls", instances: [9782, 9982, 3019, 3028], quests: [2160, 2161], group: "high", color: C.lg },
	{ key: "antaroth", name: "Antaroth's Abyss", instances: [9720, 9920, 3017, 3029], quests: [2156, 2157, 2192], group: "high", color: C.g },
	{ key: "timescape", name: "Timescape", instances: [9756, 9056], quests: [2172, 2222], group: "high", color: C.y },
	{ key: "forsaken", name: "Forsaken Island", instances: [9059, 9759], quests: [1667, 2220], group: "high", color: C.y },
	{ key: "red-refuge", name: "Red Refuge", instances: [9739, 9939], quests: [2154, 2193], group: "high", color: C.o },
	{ key: "manglemire", name: "Manglemire", instances: [9070], quests: [2184], group: "high", color: C.b },
	{ key: "ravenous", name: "Ravenous Gorge", instances: [9055], quests: [2150], group: "high", color: C.y },
	{ key: "balders-temple", name: "Balder's Temple", instances: [9025, 9725, 9825], quests: [1101], group: "high", color: C.o },
	{ key: "argon-corpus", name: "Argon Corpus", instances: [9026, 9726], quests: [], group: "high", color: C.lb },
	{ key: "manaya", name: "Manaya's Core", instances: [9727, 9027, 3011], quests: [], group: "high", color: C.v },
	{ key: "demons-wheel", name: "Demon's Wheel", instances: [9066], quests: [], group: "high", color: C.o },
	{ key: "shadow-sanguinary", name: "Shadow Sanguinary", instances: [9768, 9068], quests: [], group: "high", color: C.r },
	{ key: "broken-prison", name: "Broken Prison", instances: [9710], quests: [], group: "high", color: C.lb },
	{ key: "bastion-of-lok", name: "Bastion of Lok", instances: [9087, 3001, 9887], quests: [800001], group: "high", color: C.lb },
	{ key: "akasha", name: "Akasha's Hideout", instances: [9093, 9793, 3006], quests: [], group: "high", color: C.lp },
	{ key: "saleron", name: "Saleron's Sky Garden", instances: [9094, 3007, 9894], quests: [], group: "high", color: C.y },
	{ key: "cursed-ship", name: "Cursed Ship", instances: [3320], quests: [], group: "high", color: C.o },
	{ key: "twisted-abyss", name: "Twisted Abyss", instances: [3920], quests: [], group: "high", color: C.v },
	{ key: "fallen-god", name: "Temple of the Fallen God", instances: [3300], quests: [], group: "other", color: C.v },
	{ key: "fane-kaprima", name: "Fane of Kaprima", instances: [9024, 9724, 9824], quests: [], group: "other", color: C.o },
	{ key: "aq", name: "Akalath Quarantine", instances: [3023, 3123, 3032, 2100], quests: [2168], group: "other", color: C.b },
	{ key: "gossamer", name: "Gossamer Vault", instances: [3101, 3201, 3033], quests: [2166, 2167], group: "other", color: C.g },
	{ key: "bahaar", name: "Bahaar's Sanctum", instances: [9044, 3037], quests: [2162], group: "other", color: C.o },
	{ key: "thaumetal", name: "Thaumetal Refinery", instances: [9794, 9994], quests: [2147, 2148], group: "other", color: C.o },
	{ key: "ruinous", name: "Ruinous Manor", instances: [9770, 9970], quests: [2137, 2138], group: "other", color: C.y },
	{ key: "lilith", name: "Lilith's Keep", instances: [9769, 9969, 3016], quests: [2133, 2134], group: "other", color: C.lb },
	{ key: "drc", name: "Dark Reach Citadel", instances: [9783, 9983, 3018], quests: [2158, 2159], group: "other", color: C.lg },
	{ key: "velik-hold", name: "Velik's Hold", instances: [9780, 9980], quests: [2140, 2141], group: "other", color: C.lp },
	{ key: "catalepticon", name: "Catalepticon", instances: [3104, 3204, 2106, 3040], quests: [2199, 2181, 2200, 2182], group: "other", color: C.v },
	{ key: "skynest", name: "Corrupted Skynest", instances: [3026, 3126], quests: [2169, 2170], group: "other", color: C.v },
	{ key: "draakon", name: "Draakon Arena", instances: [3102, 3202], quests: [2173, 2174], group: "other", color: C.y },
	{ key: "forbidden-arena", name: "Forbidden Arena", instances: [3027, 3103, 3203], quests: [2178, 2171], group: "other", color: C.o },
	{ key: "killing-grounds", name: "Killing Grounds", instances: [3106, 3206], quests: [2185, 2184], group: "other", color: C.y },
	{ key: "rifts-edge", name: "Rift's Edge", instances: [9750, 9050], quests: [1900], group: "other", color: C.lb },
	{ key: "sky-cruiser", name: "Sky Cruiser Endeavor", instances: [9716, 9916, 3036], quests: [2125, 2131, 2106], group: "other", color: C.lb },
	{ key: "bathysmal", name: "Bathysmal Rise", instances: [9754, 9054], quests: [], group: "other", color: C.b },
	{ key: "akeron", name: "Akeron's Inferno", instances: [9757, 9057], quests: [], group: "other", color: C.r },
	{ key: "demokron", name: "Demokron Factory", instances: [9767, 9067], quests: [], group: "other", color: C.o },
	{ key: "kalivan", name: "Kalivan's Dreadnaught", instances: [9760, 9060, 9860], quests: [], group: "other", color: C.o },
	{ key: "wonderholme", name: "Wonderholme", instances: [9743, 9643, 9043], quests: [], group: "other", color: C.y },
	{ key: "kelsaik-nest", name: "Kelsaik's Nest", instances: [9075, 9775], quests: [], group: "other", color: C.r },
	{ key: "abscess", name: "The Abscess", instances: [9811, 9511, 9711, 9611], quests: [], group: "other", color: C.lb },
	{ key: "fusion-lab", name: "Fusion Laboratory", instances: [3105, 3205], quests: [], group: "other", color: C.v },
	{ key: "ice-throne", name: "Ice Throne", instances: [3109, 3209], quests: [], group: "other", color: C.lb },
	{ key: "argon-queen", name: "Hall of the Argon Queen", instances: [3047, 3147], quests: [], group: "other", color: C.p },
	{ key: "ghillieglade", name: "Ghillieglade", instances: [9713, 9813], quests: [], group: "other", color: C.g },
	{ key: "dreadspire", name: "Dreadspire", instances: [9034, 9885, 2800, 9850], quests: [], group: "other", color: C.r },
	{ key: "channelworks", name: "Channelworks", instances: [9777], quests: [], group: "other", color: C.lg },
	{ key: "lakan", name: "Lakan's Prison", instances: [9810], quests: [], group: "other", color: C.v },
	{ key: "sabex", name: "Sabex Armory", instances: [9808], quests: [], group: "other", color: C.o },
	{ key: "harrowhold", name: "Harrowhold", instances: [9950], quests: [], group: "other", color: C.r },
	{ key: "azart", name: "Azart Hatchery", instances: [3024, 3025], quests: [], group: "other", color: C.g },
	{ key: "balderon", name: "Training Ground (Balderon)", instances: [3012, 9081], quests: [98311], group: "low", color: C.y },
	{ key: "macellarius", name: "Macellarius Catacombs", instances: [9809], quests: [2101], group: "low", color: C.g },
	{ key: "ebon-tower", name: "Ebon Tower", instances: [9073, 9773, 3009, 9873], quests: [800010], group: "low", color: C.lb },
	{ key: "labyrinth-terror", name: "Labyrinth of Terror", instances: [9076, 9776, 3008, 9876], quests: [800009], group: "low", color: C.lb },
	{ key: "golden-labyrinth", name: "Golden Labyrinth", instances: [9072, 3005, 9872], quests: [800006], group: "low", color: C.lb },
	{ key: "necromancer", name: "Necromancer Tomb", instances: [9071, 3004, 9871], quests: [800005], group: "low", color: C.lb },
	{ key: "cultists", name: "Cultists' Refuge", instances: [9089, 3003, 9889], quests: [800004], group: "low", color: C.lb },
	{ key: "saravash", name: "Saravash's Ascent", instances: [9079, 9979, 9879], quests: [800003], group: "low", color: C.lb },
	{ key: "sinestral", name: "Sinestral Manor", instances: [9088, 3002, 9888], quests: [800002], group: "low", color: C.lb },
	{ key: "echoes-aranea", name: "Echoes of Aranea", instances: [9069], quests: [], group: "low", color: C.y },
	{ key: "sun-festival", name: "Sun Festival", instances: [230], quests: [7001], group: "events", color: C.o },
	{ key: "beach-party", name: "Beach Party", instances: [210], quests: [7003], group: "events", color: C.o },
	{ key: "santa-residence", name: "Santa's Residence", instances: [3131], quests: [], group: "events", color: C.o },
	{ key: "fluffy-arena", name: "Fluffy Arena", instances: [3927], quests: [], group: "events", color: C.p }
];

const EXTRA_NAMES = {
	2000: "Exodor Archipelago",
	2101: "Larvae Hatchery",
	2102: "Cliffside Prison",
	2103: "Black Core Engine Room",
	2802: "Aesir's End",
	2803: "Aesir's End",
	2804: "Phantom Hideout",
	2809: "The Observatory",
	2811: "Sea of Honor",
	2813: "Beach River Outpost",
	2814: "Abyssal Prison",
	2816: "Kelsaik Hall",
	3020: "Sea of Honor",
	3030: "Commander's Residence",
	3035: "Velika's Sanctum",
	3041: "Damned Citadel",
	3044: "Stormed Citadel",
	3045: "Dakuryon Depot",
	3107: "RK-9 Kennel",
	3111: "The Veil",
	9034: "Dreadspire",
	9048: "Sanctum of the Fire God",
	9053: "Kezzel's Gorge",
	9074: "Sanctum of Resurrection",
	9080: "Sigil Adstringo",
	9090: "Woodland Path",
	9091: "Altar of Vadoma",
	9092: "Dagon's Chantry",
	9095: "Crucible of Flame",
	9096: "Sirjuka Gallery",
	9713: "Ghillieglade",
	9766: "Shattered Fleet",
	9777: "Channelworks",
	9808: "Sabex Armory",
	9810: "Lakan's Prison",
	9985: "Sanctuary's Ruins"
};

const FAMILY_ALIASES = {
	"crimson killing grounds": "killing-grounds",
	"killing grounds": "killing-grounds",
	"lumikan's dream": "catalepticon",
	"lumikan's dream / catalepticon": "catalepticon",
	"catalepticon": "catalepticon",
	"corrupted rk-9 kennel": "rk9",
	"rampaging rk-9 kennel": "rk9",
	"rk-9 kennel": "rk9",
	"cursed fusion laboratory": "fusion-lab",
	"fusion laboratory": "fusion-lab",
	"chaos ice throne": "ice-throne",
	"ice throne": "ice-throne",
	"forbidden arena [hagufna]": "forbidden-arena",
	"forbidden arena [undying warlord]": "forbidden-arena",
	"forbidden arena [nightmare undying warlord]": "forbidden-arena",
	"forbidden arena [uw]": "forbidden-arena",
	"forbidden arena": "forbidden-arena",
	"cursed antaroth's abyss": "twisted-abyss",
	"twisted abyss": "twisted-abyss",
	"cursed ship": "cursed-ship",
	"santa's residence": "santa-residence",
	"fluffy arena": "fluffy-arena",
	"sky cruiser endeavor (extreme)": "sky-cruiser",
	"sky cruiser": "sky-cruiser",
	"corrupted skynest (hard) entrance": "skynest",
	"velik's sanctuary (hard) asura": "velik-sanctuary"
};

const NAMES = Object.assign({}, EXTRA_NAMES);
const INSTANCE_FAMILY = new Map();
const byInstance = new Map();
const byQuest = new Map();
const knownQuestIds = new Set();
const CATALOG = [];

FAMILIES.forEach(family => {
	family.instances.forEach(instance => {
		NAMES[instance] = family.name;
		INSTANCE_FAMILY.set(instance, family);
		byInstance.set(instance, [family]);
		CATALOG.push({
			name: family.name,
			quests: family.quests.slice(),
			instance,
			group: family.group,
			color: family.color,
			family: family.key
		});
	});
	(family.quests || []).forEach(quest => {
		knownQuestIds.add(quest);
		knownQuestIds.add(quest + QUEST_ID_MOD);
		if (quest > QUEST_ID_MOD) knownQuestIds.add(quest - QUEST_ID_MOD);
		if (!byQuest.has(quest)) byQuest.set(quest, []);
		byQuest.get(quest).push(family);
	});
});

Object.keys(EXTRA_NAMES).forEach(id => {
	const instance = Number(id);
	if (!INSTANCE_FAMILY.has(instance)) {
		const family = {
			key: slug(EXTRA_NAMES[instance]),
			name: EXTRA_NAMES[instance],
			instances: [instance],
			quests: [],
			group: "other",
			color: C.y
		};
		INSTANCE_FAMILY.set(instance, family);
		byInstance.set(instance, [family]);
	}
});

function slug(name) {
	return String(name || "")
		.toLowerCase()
		.replace(/['’]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

function stripMode(name) {
	return String(name || "")
		.replace(/\s*\((?:Hard|HM|Easy|NM|Solo|Guide|Extreme|5-Person|7-Person|10-Person|20-Person|3-Person)\)\s*/gi, "")
		.replace(/\s*-\s*(?:HM|NM|Hard|Guide).*$/i, "")
		.replace(/\s+entrance$/i, "")
		.replace(/\s+/g, " ")
		.trim();
}

function displayName(instance, fallback) {
	const inst = Number(instance);
	const family = INSTANCE_FAMILY.get(inst);
	if (family) return family.name;
	if (NAMES[inst]) return NAMES[inst];
	const cleaned = stripMode(fallback);
	if (cleaned && !/^dungeon\s+\d+$/i.test(cleaned) && !/^vanguard\s+\d+$/i.test(cleaned)) {
		return cleaned;
	}
	return inst ? `Dungeon ${inst}` : "Unknown dungeon";
}

function familyFor(instance, fallbackName) {
	const inst = Number(instance);
	if (INSTANCE_FAMILY.has(inst)) return INSTANCE_FAMILY.get(inst);
	const cleaned = stripMode(fallbackName || NAMES[inst] || "");
	const alias = FAMILY_ALIASES[cleaned.toLowerCase()];
	if (alias) {
		const match = FAMILIES.find(family => family.key === alias);
		if (match) return match;
	}
	if (cleaned) {
		const match = FAMILIES.find(family => family.name.toLowerCase() === cleaned.toLowerCase());
		if (match) return match;
		return {
			key: slug(cleaned),
			name: cleaned,
			instances: inst ? [inst] : [],
			quests: [],
			group: "high",
			color: C.y
		};
	}
	return {
		key: `instance-${inst}`,
		name: displayName(inst, fallbackName),
		instances: inst ? [inst] : [],
		quests: [],
		group: "unknown",
		color: C.y
	};
}

function preferEntry(next, prev) {
	if (!prev) return true;
	const nextFamily = familyFor(next.instance, next.name);
	const prevFamily = familyFor(prev.instance, prev.name);
	const nextRank = nextFamily.instances.indexOf(Number(next.instance));
	const prevRank = prevFamily.instances.indexOf(Number(prev.instance));
	const nextKnown = nextRank >= 0 ? nextRank : 99;
	const prevKnown = prevRank >= 0 ? prevRank : 99;
	if (nextKnown !== prevKnown) return nextKnown < prevKnown;
	return Number(next.instance) < Number(prev.instance);
}

function variants(quest) {
	const q = Number(quest);
	if (!Number.isFinite(q) || q <= 0) return [];
	const out = [q];
	if (q > QUEST_ID_MOD) out.push(q - QUEST_ID_MOD);
	else out.push(q + QUEST_ID_MOD);
	return out;
}

function isKnownQuest(id) {
	const n = Number(id);
	return Number.isFinite(n) && n >= 1000 && knownQuestIds.has(n);
}

function findByQuest(quest) {
	const q = Number(quest);
	const families = byQuest.get(q) || byQuest.get(q - QUEST_ID_MOD) || byQuest.get(q + QUEST_ID_MOD) || [];
	return families.map(family => ({
		name: family.name,
		quests: family.quests,
		instance: family.instances[0],
		group: family.group,
		color: family.color,
		family: family.key
	}));
}

function findByInstance(instance) {
	const family = INSTANCE_FAMILY.get(Number(instance));
	if (!family) return [];
	return [{
		name: family.name,
		quests: family.quests,
		instance: Number(instance),
		group: family.group,
		color: family.color,
		family: family.key
	}];
}

function questsForInstance(instance) {
	const family = INSTANCE_FAMILY.get(Number(instance));
	return family ? family.quests.slice() : [];
}

function nameForInstance(instance) {
	return displayName(instance);
}

function resolveLiveQuest(quests, liveSet) {
	if (!liveSet || !liveSet.size) return 0;
	for (const quest of quests || []) {
		for (const id of variants(quest)) {
			if (liveSet.has(id)) return id;
		}
	}
	return 0;
}

function scanBufferForQuests(buf) {
	const found = new Set();
	if (!buf || buf.length < 8) return found;
	const start = buf.length >= 4 ? 4 : 0;
	for (let i = start; i + 4 <= buf.length; i += 4) {
		const value = buf.readInt32LE(i);
		if (isKnownQuest(value)) found.add(value);
	}
	return found;
}

function dedupeEntries(entries) {
	const byFamily = new Map();
	(entries || []).forEach(entry => {
		const family = familyFor(entry.instance, entry.name);
		const next = {
			quest: entry.quest,
			instance: Number(entry.instance),
			name: family.name,
			color: family.color || entry.color || C.y,
			group: family.group || entry.group || "high",
			family: family.key
		};
		const prev = byFamily.get(family.key);
		if (preferEntry(next, prev)) byFamily.set(family.key, next);
	});
	return Array.from(byFamily.values());
}

module.exports = {
	QUEST_ID_MOD,
	CATALOG,
	FAMILIES,
	GROUP_TITLE,
	GROUP_ORDER,
	C,
	variants,
	isKnownQuest,
	findByQuest,
	findByInstance,
	questsForInstance,
	nameForInstance,
	displayName,
	familyFor,
	dedupeEntries,
	resolveLiveQuest,
	scanBufferForQuests
};
