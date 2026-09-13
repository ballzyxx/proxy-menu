/* eslint-disable no-lonely-if */
/* eslint-disable no-shadow */
/* eslint-disable no-undef */
/* eslint-disable no-param-reassign */
String.prototype.clr = function(hexColor) { return `<font color='#${hexColor}'>${this}</font>` ;};
const OPCODES = {
	C_REQUEST_EVENT_MATCHING_TELEPORT: {
		366226: 23975, // GF v92.03
		367078: 38468, // GF v92.04
		367081: 59605, // GF v92.04
		376012: 33555, // TW v100.02
		385362: 64660, // GF v110.02
		384821: 33555, // GF v110.03
		386769: 26653, // GF v112.02
		387400: 36934, // GF v114.02
		387463: 26295 // GF v115.02
	}
};

const moment = require("moment-timezone");
const globalShortcut = global.TeraProxy.GUIMode ? require("electron").globalShortcut : null;
const Vec3 = require("tera-vec3");
const drinkAbnormalities = [48732, 48733, 48734, 48735, 48736, 48737, 48738, 48739, 70251, 70252, 70253, 70254, 70255, 70256];


function addOpcodeAndDefinition(mod, name, version = null, definition = null) {
	if (OPCODES[name] !== undefined && OPCODES[name][mod.dispatch.protocolVersion] !== undefined) {
		mod.dispatch.addOpcode(name, OPCODES[name][mod.dispatch.protocolVersion]);
	}
	if (version !== null && definition !== null) {
		mod.dispatch.addDefinition(name, version, definition);
	}
}

module.exports = function ProxyMenu(mod) {
	
//	mod.dispatch.addDefinition("S_DIALOG", 10, `${__dirname }/S_DIALOG.def`, true);
	
	const cmd = mod.command || mod.require.command;
	const COMMAND = "m";
	const { player } = mod.require.library;
	const keybinds = new Set();
	const path = jsonRequire("path");
	const fs = jsonRequire("fs");
	const NecklaceIDs = [20715, 20716, 20717, 20752];
	const Message2 = "You are wearing the Resource Gathering Amulet!";
	const WhiskerIDs = [206100, 206101, 206102, 206103, 206104, 206105, 206106, 206107, 206108, 206109];
	const Message = "You are wearing a fisherman's moustache!";
	const weather = {
		normal: "acn_aeroset.AERO.SPR_Corruption_AERO",
		snow: "BF_snowBattle_aeroset.AERO.BF_snowBattle_renew_AERO",
		night: "EX_Halloween_T42_AEROSet.AERO.EX_Halloween_Inside_Aeroset",
		dark: "Kubel_Fortress_Pegasus_AERO.AERO.Kubel_Fortress_Pegasus_AERO"
	};
	const liveNpc = new Map();
	let lastServerKey = null;
	const REMOTE_HUB_ZONES = new Set([183, 2800]);
	const SHOP_DEFAULTS = {
		store: 70310,
		sstore: 250,
		ssstore: 111,
		vstore: 600,
		fstore: 16094,
		ffstore: 16095,
		fishstore: 1000,
		boxfstore: 1001,
		acraft: 193,
		scraft: 190,
		pcraft: 191,
		ecraft: 192,
		jcraft: 195,
		bel: 141,
		vng: 609,
		vgc: 6090,
		guard: 6112,
		bank: 1,
		gbank: 3,
		pbank: 9,
		cbank: 12
	};
	const SHOP_BY_VALUE = {
		70310: "store",
		16063: "store",
		16072: "store",
		16081: "store",
		16084: "store",
		16091: "store",
		16092: "store",
		58001: "store",
		59901: "store",
		2851665: "store",
		250: "sstore",
		58002: "sstore",
		111: "ssstore",
		600: "vstore",
		16094: "fstore",
		16096: "fstore",
		16095: "ffstore",
		1000: "fishstore",
		1001: "boxfstore",
		141: "bel",
		609: "vng",
		6090: "vgc",
		6112: "guard",
		193: "acraft",
		190: "scraft",
		191: "pcraft",
		192: "ecraft",
		195: "jcraft"
	};

	const gui = {
		parse(array, title, d = "") {
			for (let i = 0; i < array.length; i++) {
				if (d.length >= 20000) {
					d += "Gui data limit exceeded, some values may be missing.";
					break;
				}
				if (array[i].command) d += `<a href="admincommand:/@${array[i].command}">${array[i].text}</a>`;
				else if (!array[i].command) d += `${array[i].text}`;
				else continue;
			}
			mod.send("S_ANNOUNCE_UPDATE_NOTIFICATION", 1, {
				id: 0,
				title: title,
				body: d
			});
		}
	};


	const menu = require("./menu");
	const dungeonData = require("./dungeons");

	let bookmarks = new Map();
	let debug = false;
	let debugData = [];
	let premiumAvailable = false;
	let currentChannel = 0;
	let changeZoneEvent = null;
	let locationEvent = null;
	let isDrop = false;
	let curHp = 0;
	let maxHp = 0;
	let blockselectuser = false;
	let blockselectusertimer = null;
	let walkW = 0;
	let lasttimemoved = Date.now();
	let contract = null;
	let contractType = null;
	let opening = false;
	let gachaId = null;
	let gacha = false;
	let lastLocation = null;
	const liveQuestIds = new Set();
	const liveInstanceIds = new Set();
	const clientEvents = new Map();
	let eventListParsed = false;

	if (mod.majorPatchVersion >= 94) {
		// enable padding
		[
			"C_REQUEST_REPUTATION_STORE_TELEPORT"
		].forEach(name =>
			mod.dispatch.addOpcode(name, mod.dispatch.connection.metadata.maps.protocol[name], true)
		);
	}

	mod.dispatch.addDefinition("C_REQUEST_CONTRACT", 50, [
		["name", "refString"],
		["data", "refBytes"],
		["type", "int32"],
		["target", "int64"],
		["value", "int32"],
		["name", "string"],
		["data", "bytes"]
	], true);

	mod.dispatch.addDefinition("C_REQUEST_REPUTATION_STORE_TELEPORT", 2, [
	], true);

	mod.dispatch.addDefinition("C_AVAILABLE_EVENT_MATCHING_LIST", 1, [
		["unk", "byte"]
	], true);

	mod.dispatch.addDefinition("S_VOTE_DISMISS_PARTY", 1, [
		["accept", "byte"]
	], true);

	mod.dispatch.addDefinition("C_VOTE_DISMISS_PARTY", 1, [
		["accept", "byte"]
	], true);

	mod.game.initialize(["party", "me.abnormalities", "inventory"]);

	if (menu.pages !== undefined) {
		Object.values(menu.pages).forEach(page =>
			bindHotkeys(page)
		);
	}

	bindHotkeys(menu.categories);
	keybinds.add(mod.settings.hotkey);
	globalShortcut.register(mod.settings.hotkey, () => show());

	addOpcodeAndDefinition(mod, "C_REQUEST_EVENT_MATCHING_TELEPORT", 0, [
		["unk1", "uint32"],
		["quest", "uint32"],
		["instance", "uint32"],
		["unk2", "uint32"],
		["unk3", "uint32"]
	]);

	mod.game.me.on("change_zone", () => {
		if (mod.game.me.inDungeon) {
			if (mod.game.inventory.findInEquipment(WhiskerIDs)) {
				mod.setTimeout(() => {
					mod.send("S_CHAT", 3, {
						channel: 21,
						authorName: "",
						message: Message
					});
				}, 10000);
			}
			if (mod.game.inventory.findInEquipment(NecklaceIDs)) {
				mod.setTimeout(() => {
					mod.send("S_CHAT", 3, {
						channel: 21,
						authorName: "",
						message: Message2
					});
				}, 15000);
			}
		}
	});

	mod.game.me.on("change_zone", changeZoneEvent = zone => {
		loadZone(zone);
	});

	mod.hook("C_CONFIRM_UPDATE_NOTIFICATION", 1, { order: 100010 }, () => false);

	mod.hook("C_ADMIN", 1, { order: 100010, filter: { fake: false, silenced: false, modified: null } }, event => {
		if (event.command.includes(";")) {
			event.command.split(";").forEach(cmd => {
				try {
					mod.command.exec(cmd);
				} catch (e) {
					return;
				}
			});
			return false;
		}
	});

	mod.hook("S_PLAYER_STAT_UPDATE", mod.majorPatchVersion === 92 ? 13 : 14, e => {
		curHp = e.hp;
		maxHp = e.maxHp;
	});

	mod.hook("S_CREATURE_CHANGE_HP", 6, e => {
		if (e.target !== mod.game.me.gameId) return;
		curHp = e.curHp;
		maxHp = e.maxHp;
	});

	mod.hook("C_PLAYER_LOCATION", 5, { filter: { fake: null } }, (event, fake) => {
		locationEvent = event;
		if (!fake) {
			if (!isDrop && (event.type === 2 || event.type === 10)) return false;
		}
	});

	mod.hook("C_REQUEST_EVENT_MATCHING_TELEPORT", 0, { filter: { fake: false } }, event => {
		rememberDungeonQuest(event.quest, event.instance);
		liveQuestIds.add(Number(event.quest));
		liveInstanceIds.add(Number(event.instance));
		if (debug) console.log("C_REQUEST_EVENT_MATCHING_TELEPORT:", event);
	});

	function ingestEventIds(ids, replace) {
		const next = (ids || []).map(Number).filter(n => Number.isFinite(n) && n > 0);
		if (!next.length) return;
		if (replace) liveQuestIds.clear();
		next.forEach(id => liveQuestIds.add(id));
		mod.settings.lastVanguardQuests = Array.from(liveQuestIds);
		if (debug) mod.command.message(`Vanguard list: ${liveQuestIds.size} events`);
	}

	function onEventMatchingList(event) {
		const rows = event.events || event.quests || [];
		eventListParsed = true;
		ingestEventIds(rows.map(row => row.id), true);
	}

	try {
		mod.hook("S_AVAILABLE_EVENT_MATCHING_LIST", 1, onEventMatchingList);
	} catch (_) {}
	try {
		mod.hook("S_AVAILABLE_EVENT_MATCHING_LIST", "raw", buf => {
			if (eventListParsed) return;
			ingestEventIds(Array.from(dungeonData.scanBufferForQuests(buf)), false);
		});
	} catch (_) {}

	try {
		mod.hook("S_DUNGEON_CLEAR_COUNT_LIST", 1, event => {
			const rows = (event && event.dungeons) || [];
			rows.forEach(row => {
				const id = Number(row.id);
				if (id > 0) liveInstanceIds.add(id);
			});
			mod.settings.lastVanguardInstances = Array.from(liveInstanceIds);
		});
	} catch (_) {}

	(mod.settings.lastVanguardQuests || []).forEach(id => liveQuestIds.add(Number(id)));
	(mod.settings.lastVanguardInstances || []).forEach(id => liveInstanceIds.add(Number(id)));

	if (mod.game && typeof mod.game.on === "function") {
		mod.game.on("enter_game", () => {
			eventListParsed = false;
			loadClientDungeonEvents();
			mod.setTimeout(requestVanguardList, 1500);
		});
	}
	loadClientDungeonEvents();

	mod.hook("S_PREMIUM_SLOT_OFF", "raw", () => !mod.settings.premiumSlotEnabled);

	mod.hook("S_RETURN_TO_LOBBY", "raw", () => {
		premiumAvailable = false;
	});

	mod.hook("S_LOAD_TOPO", "raw", () => {
		if (premiumAvailable || !mod.settings.premiumSlotEnabled || menu.premium.length === 0) return;
		mod.send("S_PREMIUM_SLOT_DATALIST", 2, {
			sets: [
				{ id: 0, inventory: [] }
			]
		});
	});

	mod.hook("S_PREMIUM_SLOT_DATALIST", 2, { order: Infinity, filter: { fake: null } }, event => {
		if (!mod.settings.premiumSlotEnabled || menu.premium.length === 0 || event.sets.length === 0) return;
		premiumAvailable = true;
		menu.premium.forEach(slot => {
			if (slot.class) {
				const classes = (Array.isArray(slot.class) ? slot.class : [slot.class]);
				if (!classes.includes(mod.game.me.class)) {
					return;
				}
			}
			if (slot.ifcmd && !mod.command.base.hooks.has(slot.ifcmd.toLocaleLowerCase())) {
				return;
			}
			if (slot.ifnocmd && mod.command.base.hooks.has(slot.ifnocmd.toLocaleLowerCase())) {
				return;
			}
			if (!mod.command.base.hooks.has(slot.command.split(" ")[0])) {
				return;
			}
			event.sets[0].inventory.push({
				slot: event.sets[0].inventory.length + 1,
				unk1: 1,
				type: 1,
				id: slot.id,
				amount: -1,
				cooldown: "30000",
				cooldownRemaining: "0",
				unk2: true
			});
		});
		return true;
	});

	mod.hook("C_USE_PREMIUM_SLOT", 1, event => {
		if (menu.premium.length === 0) return;
		let used = false;
		menu.premium.forEach(slot => {
			if (slot.command && event.id === slot.id) {
				mod.command.exec(slot.command);
				used = true;
			}
		});
		if (used) {
			return false;
		}
	});

	function toEntityId(id) {
		if (id == null || id === "") return null;
		if (typeof id === "bigint") return id === 0n ? null : id;
		if (typeof id === "string") {
			const s = id.startsWith("BIGINT:") ? id.slice(7) : id;
			if (!s || s === "0") return null;
			try {
				const n = BigInt(s);
				return n === 0n ? null : n;
			} catch (_) {
				return null;
			}
		}
		const n = Number(id);
		if (!Number.isFinite(n) || n === 0) return null;
		return n;
	}

	function currentServerId() {
		try {
			if (mod.serverId != null && mod.serverId !== "") return String(mod.serverId);
		} catch (_) {}
		try {
			if (mod.game && mod.game.me && mod.game.me.serverId != null && mod.game.me.serverId !== "")
				return String(mod.game.me.serverId);
		} catch (_) {}
		return null;
	}

	function shopBag() {
		if (!mod.settings.shopByServer || typeof mod.settings.shopByServer !== "object")
			mod.settings.shopByServer = {};
		const key = currentServerId();
		if (!key) return null;
		if (!mod.settings.shopByServer[key]) mod.settings.shopByServer[key] = {};
		return mod.settings.shopByServer[key];
	}

	function applyPersistedShops() {
		const key = currentServerId();
		if (key === lastServerKey) return;
		lastServerKey = key;
		const bag = shopBag();
		if (!bag) return;
		Object.entries(bag).forEach(([name, e]) => {
			if (!e || !mod.settings.npc[name]) return;
			const id = toEntityId(e.gameId);
			const v = Number(e.value);
			if (id == null || !Number.isFinite(v) || v <= 0) return;
			mod.settings.npc[name].gameId = id;
			mod.settings.npc[name].value = v;
		});
	}

	function noteLive(name, target, value) {
		if (!name || !mod.settings.npc[name]) return;
		const id = toEntityId(target);
		const v = Number(value);
		if (id == null || !Number.isFinite(v) || v <= 0) return;
		liveNpc.set(name, { gameId: id, value: v });
	}

	function persistHubShop(name, target, value, zone) {
		noteLive(name, target, value);
		const id = toEntityId(target);
		const v = Number(value);
		if (id == null || !Number.isFinite(v) || v <= 0) return;
		const isHub = REMOTE_HUB_ZONES.has(Number(zone));
		const bag = shopBag();
		if (!isHub && bag && bag[name] && bag[name].hub) return;
		mod.settings.npc[name].gameId = id;
		mod.settings.npc[name].value = v;
		if (bag) bag[name] = { gameId: String(id), value: v, hub: !!isHub };
		try { if (typeof mod.saveSettings === "function") mod.saveSettings(); } catch (_) {}
	}

	function shopNameForValue(value) {
		const v = Number(value);
		if (!Number.isFinite(v) || v <= 0) return null;
		if (SHOP_BY_VALUE[v]) return SHOP_BY_VALUE[v];
		if (v >= 16000 && v <= 17000) return "store";
		return null;
	}

	applyPersistedShops();
	try {
		mod.game.on("enter_game", () => {
			lastServerKey = null;
			applyPersistedShops();
		});
	} catch (_) {}

	mod.hook("S_SPAWN_NPC", mod.majorPatchVersion >= 101 ? 12 : 11, event => {
		applyPersistedShops();
		Object.entries(mod.settings.npc).forEach(([name, npc]) => {
			if (npc.opts === undefined) return;
			let opt = npc.opts.find(option => option.templateId === event.templateId && option.huntingZoneId === event.huntingZoneId);
			if (!opt && REMOTE_HUB_ZONES.has(Number(event.huntingZoneId))) {
				opt = npc.opts.find(option => option.templateId === event.templateId);
			}
			if (opt) persistHubShop(name, event.gameId, opt._value, event.huntingZoneId);
		});
	});

	mod.hook("S_LOAD_TOPO", "raw", () => {
		liveNpc.clear();
	});

	function hookDialog(event) {
		const optType = event.options && event.options[0] && event.options[0].type;
		if (debug) {
			debugData = [
				"Detected NPC:",
				`   "value": ${optType}`,
				`   "gameId": ${event.gameId}`,
				`   "templateId": ${event.questId}`,
				`   "huntingZoneId": ${event.huntingZoneId}`
			];
		}
		const options = event.options || [];
		for (let i = 0; i < options.length; i++) {
			const name = shopNameForValue(options[i] && options[i].type);
			if (name) persistHubShop(name, event.gameId, options[i].type, event.huntingZoneId);
		}
	}
	try {
		mod.hook("S_DIALOG", "*", hookDialog);
	} catch (_) {
		mod.hook("S_DIALOG", 2, hookDialog);
	}

	mod.hook("C_PLAYER_LOCATION", 5, event => {
		if ([0, 1, 5, 6].indexOf(event.type) > -1)
			lasttimemoved = Date.now();
	});

	mod.hook("C_RETURN_TO_LOBBY", "raw", () => {
		if (Date.now() - lasttimemoved >= 3600000) return false;
	});

	const commands = {
		$none: () => show(),
		tohw: () => {
			mod.send("C_REQUEST_REPUTATION_STORE_TELEPORT", 2);
		},
		premium: () => {
			mod.settings.premiumSlotEnabled = !mod.settings.premiumSlotEnabled;
			mod.command.message(`Extra premium-bar menu icons: ${mod.settings.premiumSlotEnabled ? "enabled" : "disabled"}`);
		},
		lobby: () => {
			mod.send("C_RETURN_TO_LOBBY", 1);
		},
		drop: () => {
			mod.send("C_LEAVE_PARTY", 1);
		},
		disband: () => {
			mod.send("C_DISMISS_PARTY", 1);
		},
		reset: () => {
			mod.send("C_RESET_ALL_DUNGEON", 1);
		},
		exit: () => {
			mod.send("S_EXIT", 3, { category: 0, code: 0 });
		},
		journal: () => {
			mod.send("C_USE_PREMIUM_SLOT", 1, {
				set: 433,
				slot: 3,
				type: 1,
				id: 181117
			});
		},
		build: () => {
			mod.settings.spawnBuild = !mod.settings.spawnBuild;
			mod.command.message(`Signs, trees, calendar: ${mod.settings.spawnBuild ? "hidden" : "visible"}`);
		},
		scene: () => {
			mod.settings.blockscene = !mod.settings.blockscene;
			mod.command.message(`Skip cutscenes: ${mod.settings.blockscene ? "enabled" : "disabled"}`);
		},
		fix: () => {
			mod.settings.fix = !mod.settings.fix;
			mod.command.message(`JustSpam F: ${mod.settings.fix ? "enabled" : "disabled"}`);
		},
		tolobby: () => {
			mod.settings.lobby = !mod.settings.lobby;
			mod.command.message(`Fast character select: ${mod.settings.lobby ? "enabled" : "disabled"}`);
		},
		drunk: () => {
			mod.settings.drunk = !mod.settings.drunk;
			mod.command.message(`Hide drunk screen: ${mod.settings.drunk ? "on" : "off"}`);
		},
		brooch: () => {
			mod.settings.brooch = !mod.settings.brooch;
			mod.command.message(`Hide brooch animation: ${mod.settings.brooch ? "on" : "off"}`);
		},
		dbe: () => {
			mod.settings.backstep = !mod.settings.backstep;
			mod.command.message(`Auto reset evade (Priest): ${mod.settings.backstep ? "enabled" : "disabled"}`);
		},
		ggreset: () => {
			mod.settings.ggreset = !mod.settings.ggreset;
			mod.command.message(`Auto reset Velik's Sanctuary after teleport scroll: ${mod.settings.ggreset ? "enabled" : "disabled"}`);
		},
		autoaccept: () => {
			mod.settings.autoaccept = !mod.settings.autoaccept;
			mod.command.message(`Auto accept party: ${mod.settings.autoaccept ? "enabled" : "disabled"}`);
		},
		autoreset: () => {
			mod.settings.autoreset = !mod.settings.autoreset;
			mod.command.message(`Auto accept dungeon reset / party disband: ${mod.settings.autoreset ? "enabled" : "disabled"}`);
		},
		hotkey: arg => {
			if (!arg) {
				mod.command.message(`Current hotkey: ${mod.settings.hotkey}`);
			} else {
				if (arg.toLowerCase() !== mod.settings.hotkey.toLowerCase()) {
					const hotkey = arg.toLowerCase().split("+").map(w => w[0].toUpperCase() + w.substr(1)).join("+");
					try {
						globalShortcut.register(hotkey, () => show());
						globalShortcut.unregister(mod.settings.hotkey);
						keybinds.add(hotkey);
						keybinds.delete(mod.settings.hotkey);
						mod.settings.hotkey = hotkey;
					} catch (e) {
						return mod.command.message(`Invalid hotkey: ${hotkey}`);
					}
				}
				mod.command.message(`New hotkey: ${mod.settings.hotkey}`);
			}
		},
		use: id => useItem(id),
		et: (quest, instance) => eventTeleport(quest, instance),
		dangscan: () => {
			requestVanguardList();
			mod.command.message("Scanning this server's Vanguard dungeon list...");
			mod.setTimeout(() => show("dang"), 600);
		},
		debug: () => {
			debug = !debug;
			mod.command.message(`Debug mode ${debug ? "enabled" : "disabled"}.`);
		},
		$default: arg => {
			if (arg[0] === "$") {
				show(arg.slice(1));
			}
		},
		cha: (meow) => {
			if (!isNaN(meow)) changeChannel(meow);
			else if (["n"].includes(meow)) changeChannel(currentChannel.channel + 1);
			else if (["b"].includes(meow)) changeChannel(currentChannel.channel - 1);
			else console.log("Invalid value");
		},
		broker: () => {
			mod.send("S_NPC_MENU_SELECT", 1, { type: 28 });
		},
		sla: percent => {
			if (!percent || isDrop) return;
			percent = (parseInt(curHp) * 100 / parseInt(maxHp)) - Number(percent);
			if (percent <= 0) {
				return mod.command.message("Not enough HP");
			}
			dropHp(percent);
		},
		backwalk: () => {
			mod.settings.backwalk = !mod.settings.backwalk;
			mod.command.message(`Walk backward (others see it): ${mod.settings.backwalk ? "enabled" : "disabled"}`);
		},
		circlewalk: () => {
			mod.settings.circlewalk = !mod.settings.circlewalk;
			mod.command.message(`Spin walk (others see it): ${mod.settings.circlewalk ? "enabled" : "disabled"}`);
		},
		circle: arg => {
			mod.settings.circle = arg;
			mod.command.message(`Turn rate <font color="#5da8ce">${arg}</font>`);
		},
		autobox: () => {
			mod.settings.openbox = !mod.settings.openbox;
			mod.command.message(`One-click box open: ${mod.settings.openbox ? "enabled" : "disabled"}`);
		},
		boxdelay: (arg) => {
			if (arg === "0") {
				mod.settings.boxdelay = 0;
				mod.command.message("Box open delay removed");
			} else if (!isNaN(arg)) {
				mod.settings.boxdelay = parseInt(arg);
				mod.command.message(`Open delay: ${ mod.settings.boxdelay / 1000 } sec`);
			}
		},
		aero: (arg) => {
			if (mod.settings.aeromanual) {
				if (weather[arg]) {
					if (mod.settings.aero === arg) {
						mod.settings.aeromanual = false;
						mod.settings.aero = "normal";
						mod.command.message("Weather disabled.");
					} else {
						mod.settings.aero = arg;
						mod.command.message(`Weather changed to: ${arg}`);
					}
					meteo();
				} else {
					mod.command.message("Invalid weather. Options: normal, snow, dark, night.");
				}
			} else if (weather[arg]) {
				mod.settings.aeromanual = true;
				mod.settings.aero = arg;
				mod.command.message(`Weather enabled: ${arg}`);
				meteo();
			} else {
				mod.command.message("Invalid weather. Options: normal, snow, dark, night.");
			}
		}
	};

	function openRemoteNpc(name) {
		const npc = mod.settings.npc[name];
		if (!npc) return;
		applyPersistedShops();
		const live = liveNpc.get(name);
		const value = Number((live && live.value) || npc.value || SHOP_DEFAULTS[name]) || 0;
		const target = toEntityId(live && live.gameId) || toEntityId(npc.gameId) || 0;
		const buffer = Buffer.alloc(4);
		buffer.writeUInt32LE(value >>> 0);
		mod.send("C_REQUEST_CONTRACT", 50, {
			type: npc.type,
			target,
			value,
			name: "",
			data: buffer
		});
	}

	Object.keys(mod.settings.npc).forEach(name => {
		commands[name] = () => openRemoteNpc(name);
	});

	mod.command.add(COMMAND, commands);

	mod.command.add("clear", () => {
		mod.command.message("\n".repeat(75));
	});

	mod.command.add("just", {
		loc: () => {
			mod.command.message(
				`Zone: ${mod.game.me.zone} ` +
				`x: ${Math.round(locationEvent.loc.x)} ` +
				`y: ${Math.round(locationEvent.loc.y)} ` +
				`z: ${Math.round(locationEvent.loc.z)} ` +
				`w: ${locationEvent.w.toFixed(2)}`
			);
			console.log(
				`loc: ${locationEvent.loc.x}, ${locationEvent.loc.y}, ${locationEvent.loc.z}`, "|",
				`w: ${locationEvent.w} (${180 * locationEvent.w / Math.PI})`);
		},
		to: name => {
			loadZone(mod.game.me.zone);

			if (name) {
				if (!bookmarks.has(name)) {
					return mod.command.message(`Cannot found bookmark: ${name}, zone: ${mod.game.me.zone}`);
				}
				const loc = bookmarks.get(name);
				teleportInstant(loc.x, loc.y, loc.z, loc.w, mod.game.me.zone);
			} else {
				teleportList();
			}
		},
		save: (name, zOffset = 0) => {
			const z = zOffset ? locationEvent.loc.z + Number(zOffset) : locationEvent.loc.z;
			if (name) {
				bookmarks.set(name, {
					x: locationEvent.loc.x,
					y: locationEvent.loc.y,
					z: z,
					w: locationEvent.w
				});
				saveBookmarks();
			}
			mod.command.message(
				`Location is saved: ${name}. Zone: ${mod.game.me.zone}, ` +
				`x: ${Math.round(locationEvent.loc.x)}, ` +
				`y: ${Math.round(locationEvent.loc.y)}, ` +
				`z: ${Math.round(z)}, w: ${locationEvent.w.toFixed(2)}]`
			);
		},
		remove: name => {
			if (name) {
				if (!bookmarks.has(name)) {
					mod.command.message(`Cannot found bookmark: ${name}, zone: ${mod.game.me.zone}`);
				} else {
					bookmarks.delete(name);
					mod.command.message(`Bookmark has removed: ${name}, zone: ${mod.game.me.zone}`);
					saveBookmarks();
				}
			}
		},
		guiremove: (name, action) => {
			if (name) {
				if (!bookmarks.has(name)) {
					mod.command.message(`Cannot found bookmark: ${name}, zone: ${mod.game.me.zone}`);
				} else if (action === "yes") {
					bookmarks.delete(name);
					mod.command.message(`Bookmark has removed: ${name}, zone: ${mod.game.me.zone}`);
					saveBookmarks();
					if (bookmarks.size !== 0) {
						teleportList();
					}
				} else if (action === "no") {
					teleportList();
				} else {
					const tmpData = [
						{ text: `<font color="#cccccc" size="+24">Do you want to remove bookmark &quot;${name}&quot; from zone ${mod.game.me.zone}?</font><br><br>` },
						{ text: "<font color=\"#fe6f5e\" size=\"+24\">[Yes]</font>", command: `tp guiremove '${name}' yes` },
						{ text: "&nbsp;".repeat(4) },
						{ text: "<font color=\"#4de19c\" size=\"+24\">[No]</font>", command: `tp guiremove '${name}' no` }
					];
					parseGui(tmpData, "<font color=\"#e0b0ff\">Confirm Deletion</font>");
				}
			}
		},
		blink: (distacne, zOffset) => blink(distacne ? Number(distacne) : 50, zOffset ? Number(zOffset) : 0),
		back: () => {
			if (lastLocation) {
				teleportInstant(lastLocation.loc.x, lastLocation.loc.y, lastLocation.loc.z, lastLocation.w);
			} else {
				mod.command.message("No last point saved!");
			}
		},
		up: zOffset => {
			if (zOffset) {
				teleportInstant(locationEvent.loc.x, locationEvent.loc.y, locationEvent.loc.z + Number(zOffset));
			}
		},
		down: zOffset => {
			if (zOffset) {
				teleportInstant(locationEvent.loc.x, locationEvent.loc.y, locationEvent.loc.z - Number(zOffset));
			}
		},
		x: (oper, xOffset) => {
			if (xOffset) {
				switch (oper) {
					case "+":
						teleportInstant(locationEvent.loc.x + Number(xOffset), locationEvent.loc.y, locationEvent.loc.z);
						break;
					case "-":
						teleportInstant(locationEvent.loc.x - Number(xOffset), locationEvent.loc.y, locationEvent.loc.z);
						break;
				}
			}
		},
		y: (oper, yOffset) => {
			if (yOffset) {
				switch (oper) {
					case "+":
						teleportInstant(locationEvent.loc.x, locationEvent.loc.y + Number(yOffset), locationEvent.loc.z);
						break;
					case "-":
						teleportInstant(locationEvent.loc.x, locationEvent.loc.y - Number(yOffset), locationEvent.loc.z);
						break;
				}
			}
		},
		z: (oper, zOffset) => {
			if (zOffset) {
				switch (oper) {
					case "+":
						teleportInstant(locationEvent.loc.x, locationEvent.loc.y, locationEvent.loc.z + Number(zOffset));
						break;
					case "-":
						teleportInstant(locationEvent.loc.x, locationEvent.loc.y, locationEvent.loc.z - Number(zOffset));
						break;
				}
			}
		},
		$default: (x, y, z) => {
			if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
				teleportInstant(x, y, z);
			}
		}
	});

	mod.hook("S_REQUEST_CONTRACT", 1, e => {
		contract = e.id;
		contractType = e.type;
		if (!debug) return;
		debugData.push(`   "type": ${e.type}`);
		debugData.forEach(data => {
			console.log(data);
			mod.command.message(data);
		});
		debugData = [];
	});

	mod.hook("C_PLAYER_LOCATION", 5, { order: Infinity }, event => {
		if (!mod.settings.circlewalk) return;
		walkW = Math.max(-3.14, Math.min(3.14, walkW + mod.settings.circle));
		if (walkW <= -3.14 || walkW >= 3.14) {
			walkW = -walkW;
		}
		if (event.type <= 1) {
			event.w = walkW;
			return true;
		}
	});

	mod.hook("C_PLAYER_LOCATION", 5, { order: Infinity }, event => {
		if (!mod.settings.backwalk) return;
		if (event.type <= 1) {
			event.w += 3.14;
			return true;
		}
	});

	mod.hook("S_PREPARE_RETURN_TO_LOBBY", 1, () => {
		if (mod.settings.lobby) {
			blockselectuser = true;
			mod.send("S_RETURN_TO_LOBBY", 1, {});
			return false;
		}
	});

	mod.hook("S_RETURN_TO_LOBBY", 1, () => {
		if (mod.settings.lobby) {
			blockselectuser = false;
			mod.hookOnce("S_GET_USER_LIST", "raw", () => false);
			return false;
		}
	});

	mod.hook("C_SELECT_USER", 1, event => {
		if (blockselectuser) {
			mod.clearInterval(blockselectusertimer);
			blockselectusertimer = mod.setInterval(() => {
				if (!blockselectuser) {
					mod.clearInterval(blockselectusertimer);
					mod.send("C_SELECT_USER", 1, event);
				}
			}, 1);
			mod.send("S_SELECT_USER", 2, {
				unk1: 0,
				unk2: 0,
				unk3: "0"
			});
			return false;
		}
	});

	mod.hook("S_ABNORMALITY_BEGIN", "*", { order: Infinity, filter: { fake: null } }, e => {
		if (mod.game.me.is(e.target) && drinkAbnormalities.includes(e.id) && mod.settings.drunk) return false;
		if (mod.settings.brooch && e.id === 301806) return false;
	});

	mod.hook("S_DIALOG", "*", e => {
		if (!e.buttons.length || !mod.settings.fix) return;
		for (let i = 0; i < e.buttons.length; i++) {
			if ([1, 2, 3, 4, 5, 51, 53, 54, 55, 56, 63].includes(e.buttons[i].type)) e.buttons[i].type = 43;
		}
		e.type = 1;
		return true;
	});

	mod.hook("S_ACTION_END", 5, e => {
		if (!mod.game.me.is(e.gameId) || !mod.settings.backstep) return;
		if (e.skill.id == 380100 && mod.game.me.inCombat && mod.game.me.class === "priest") {
			mod.setTimeout(() => startSkill(310200), 0 / player.aspd
			);
		}
	});

	mod.hook("S_EVENT_GUIDE", 4, () => {
		if (mod.settings.spawnBuild)
			return false;
	});

	mod.hook("S_SPAWN_BUILD_OBJECT", 2, () => {
		if (mod.settings.spawnBuild)
			return false;
	});

	mod.hook("S_SPAWN_NPC", 11, event => {
		if (mod.settings.spawnBuild && event.huntingZoneId == 183 && (event.templateId == 9001 || event.templateId == 9002 || event.templateId == 9003)) return false;
	});

	mod.hook("S_PLAY_MOVIE", 1, event => {
		if (mod.settings.blockscene) {
			mod.send("C_END_MOVIE", 1, { unk: 1, ...event });
			return false;
		}
	});

	mod.hook("S_VOTE_RESET_ALL_DUNGEON", 1, () => {
		if (!mod.settings.autoreset) return;
		mod.setTimeout(() =>
			mod.send("C_VOTE_RESET_ALL_DUNGEON", 1, {
				accept: true
			}), 500);
	});

	mod.hook("S_VOTE_DISMISS_PARTY", 1, () => {
		if (!mod.settings.autoreset) return;
		mod.setTimeout(() =>
			mod.send("C_VOTE_DISMISS_PARTY", 1, {
				accept: true
			}), 5000);
	});

	mod.hook("S_BEGIN_THROUGH_ARBITER_CONTRACT", 1, e => {
		if (mod.settings.autoaccept && !mod.game.me.inDungeon) {
			mod.send("C_REPLY_THROUGH_ARBITER_CONTRACT", 1, {
				type: e.type,
				id: e.id,
				response: 1,
				recipient: e.sender
			});
		}
	});

	mod.hook("S_EXIT", "raw", () => false);

	mod.hook("S_LOAD_TOPO", 3, e => {
		if (mod.settings.ggreset && e.zone === 9714) {
			mod.send("C_RESET_ALL_DUNGEON", 1, {});
		}
		if (mod.settings.aeromanual) {
			meteo();
		}
	});

	mod.hook("S_START_ACTION_SCRIPT", "*", event => {
		if (mod.settings.blockscene && [40003, 60029801, 9782001, 9783001, 9783003, 9794001, 9794002, 9794004, 9794005, 9794006].includes(event.script)) return false;
	});

	mod.hook("S_CURRENT_CHANNEL", 2, event => {
		currentChannel = event;
	});

	mod.hook("C_USE_ITEM", 3, event => {
		if (!mod.settings.openbox) return;
		if (!opening) {
			gachaId = event.id;
			mod.hookOnce("S_REQUEST_CONTRACT", "*", (e) => {
				if ([33, 44, 53].includes(e.type)) {
					opening = true;
					openGacha(gachaId);
					if (mod.game.inventory.getTotalAmount(gachaId) >= 5) {
						mod.command.message("Opening. Click the item again to stop.");
					}
				}
			});
		} else {
			opening = false;
			openGacha(gachaId);
			gachaId = null;
			mod.command.message("Stopped.");
			return false;
		}
	});

	mod.hook("S_GACHA_START", 2, () => {
		if (!mod.settings.openbox) return;
		if (opening && gachaId !== null) {
			gacha = true;
			openGacha(gachaId);
		}
		return false;
	});

	mod.hook("S_RESULT_EVENT_SEED", 2, () => {
		if (!mod.settings.openbox) return;
		if (opening && gachaId !== null) {
			openGacha(gachaId);
		}
	});

	// /////////////////////
	// //// FUNCTION ///////
	// /////////////////////

	function meteo() {
		if (mod.settings.aero === "normal") {
			mod.send("S_START_ACTION_SCRIPT", 3, {
				gameId: mod.game.me.gameId,
				script: 105,
				unk2: 0
			});
		} else {
			const aeroSet = weather[mod.settings.aero] || weather.normal;
			mod.send("S_AERO", 1, {
				enabled: true,
				blendTime: 1,
				aeroSet: aeroSet
			});
		}
	}

	function openGacha(id) {
		if (opening && mod.game.inventory.getTotalAmount(id) >= 1) {
			if (gacha) {
				mod.send("C_GACHA_TRY", mod.majorPatchVersion <= 93 ? 1 : 2, { id: contract, amount: 1 });
				mod.hookOnce("S_GACHA_END", mod.majorPatchVersion <= 93 ? 1 : "*", () => {
					mod.setTimeout(() => (mod.majorPatchVersion <= 93 ?
						useItem(id) :
						openGacha(id)), mod.settings.boxdelay);
					return false;
				});
			} else {
				mod.setTimeout(() => useItem(id), mod.settings.boxdelay);
			}
		} else {
			if (gacha) {
				if (mod.majorPatchVersion >= 93) {
					mod.send("C_GACHA_CANCEL", 1, { id: contract });
				}
				mod.send("C_CANCEL_CONTRACT", 1, { type: contractType, id: contract });
				mod.hookOnce("S_CANCEL_CONTRACT", 1, () => {
					opening = false; gacha = false;
					if (mod.game.inventory.getTotalAmount(id) < 1) {
						gachaId = null;
						mod.command.message("Finished opening.");
					}
				});
			} else {
				opening = false;
				if (mod.game.inventory.getTotalAmount(id) < 1) {
					gachaId = null;
					mod.command.message("Finished opening.");
				}
			}
		}
	}

	function changeChannel(newChannel) {
		if (currentChannel.channel > 20) return;
		if (newChannel == 0) newChannel = 10;
		if (newChannel == currentChannel.channel) {
			console.log("You already on this channel.");
			return;
		}
		newChannel -= 1;
		mod.send("C_SELECT_CHANNEL", 1, {
			unk: 1,
			zone: currentChannel.zone,
			channel: newChannel
		});
	}

	function dropHp(percent) {
		if (!locationEvent) return;
		isDrop = true;
		mod.send("C_PLAYER_LOCATION", 5, { ...locationEvent, loc: locationEvent.loc.addN({ z: 400 + percent * (mod.game.me.race === "castanic" ? 20 : 10) }), type: 2 });
		mod.send("C_PLAYER_LOCATION", 5, Object.assign(locationEvent, { type: 7 }));
		isDrop = false;
	}

	function teleportInstant(x, y, z, w = null) {
		if (!locationEvent) return;
		mod.send("S_INSTANT_MOVE", 3, {
			gameId: mod.game.me.gameId,
			loc: new Vec3(x, y, z),
			w: w || locationEvent.w
		});
		lastLocation = {
			loc: locationEvent.loc,
			w: locationEvent.w
		};
	}

	function readBookmarks(id) {
		try {
			delete require.cache[require.resolve(path.join(__dirname, "bookmark", `${id}.json`))];
			return new Map(Object.entries(require(path.join(__dirname, "bookmark", `${id}.json`))));
		} catch (err) {
			return null;
		}
	}

	function loadZone(zone) {
		const bookmarksData = readBookmarks(zone);
		if (bookmarksData) {
			bookmarks = bookmarksData;
		} else {
			bookmarks = new Map();
		}
	}

	function saveBookmarks() {
		if (!fs.existsSync(path.join(__dirname, "bookmark"))) {
			fs.mkdirSync(path.join(__dirname, "bookmark"));
		}
		fs.writeFileSync(path.join(__dirname, "bookmark", `${mod.game.me.zone}.json`), JSON.stringify(Object.fromEntries(bookmarks), null, 2));
	}

	function teleportList() {
		if (bookmarks.size === 0) return;
		const tempData = [
			{ text: "&nbsp;".repeat(180) },
			{ text: "<font color=\"#9966cc\" size=\"+24\">[back]</font>", command: "m $Loger" },
			{ text: "<font size=\"+4\"><br></font>" }
		];
		bookmarks.forEach((bookmarkData, bookmarkName) => {
			tempData.push(
				{ text: "&nbsp;".repeat(2) },
				{ text: "<font color=\"#fe6f5e\" size=\"+18\">[x]</font>", command: `just guiremove '${bookmarkName}'` },
				{ text: "&nbsp;".repeat(6) },
				{ text: `<font color="#4de19c" size="+38">${bookmarkName}</font><br>`, command: `just to '${bookmarkName}'` }
			);
		});
		parseGui(tempData, `<font color="#e0b0ff">${"Teleport List"} [${mod.game.me.zone}]</font>`);
	}

	function parseGui(array, title) {
		let body = "";
		try {
			array.forEach(data => {
				if (body.length >= 20000)
					throw "GUI data limit exceeded, some values may be missing.";
				if (data.command)
					body += `<a href="admincommand:/@${data.command};">${data.text}</a>`;
				else if (!data.command)
					body += `${data.text}`;
				else
					return;
			});
		} catch (e) {
			body += e;
		}
		mod.send("S_ANNOUNCE_UPDATE_NOTIFICATION", 1, { id: 0, title, body });
	}

	function blink(distacne, zOffset) {
		teleportInstant(
			(Math.cos(locationEvent.w) * distacne) + locationEvent.loc.x,
			(Math.sin(locationEvent.w) * distacne) + locationEvent.loc.y,
			locationEvent.loc.z + zOffset,
			locationEvent.w
		);
	}

	function jsonRequire(data) {
		delete require.cache[require.resolve(data)];
		return require(data);
	}

	function show(page = null) {
		if (page === "dang") requestVanguardList();
		const categories = page === "dang"
			? buildDungeonPage()
			: (menu.pages !== undefined && menu.pages[page] ? menu.pages[page] : menu.categories);
		const tmpData = [];
		if (page !== null) {
			tmpData.push(
				{ text: "<font color=\"#9966cc\" size=\"+20\">[Back]</font>", command: COMMAND },
				{ text: "<br>" }
			);
		}
		Object.keys(categories).forEach(category => {
			tmpData.push(
				{ text: `<font color="#cccccc" size="+22">${category}</font>` },
				{ text: "<br>" }
			);
			categories[category].forEach(menuEntry => {
				if (menuEntry.class) {
					const classes = (Array.isArray(menuEntry.class) ? menuEntry.class : [menuEntry.class]);
					if (!classes.includes(mod.game.me.class)) {
						return;
					}
				}
				if (menuEntry.ifcmd && !mod.command.base.hooks.has(menuEntry.ifcmd.toLocaleLowerCase())) {
					return;
				}
				if (menuEntry.ifnocmd && mod.command.base.hooks.has(menuEntry.ifnocmd.toLocaleLowerCase())) {
					return;
				}
				if (!menuEntry.command || !menuEntry.name) {
					tmpData.push({ text: "<br>" });
					return;
				}
				const commandParts = menuEntry.command.split(" ");
				let available = mod.command.base.hooks.has(commandParts[0]);
				if (commandParts[0].toLocaleLowerCase() === COMMAND && commandParts[1] !== undefined && commandParts[1].toLocaleLowerCase() === "use") {
					available = false;
					const items = mod.game.inventory.findAll(parseInt(commandParts[2]));
					if (items.length !== 0) {
						available = items[0].amount > 0;
					}
				}
				if (available) {
					tmpData.push(
						{ text: "&nbsp;&nbsp;&nbsp;&nbsp;" },
						{ text: `<font color="${
							menuEntry.color || "#4de19c"}" size="+${
							menuEntry.size || "20"}">[${
							menuEntry.name || menuEntry.command}]</font>`,
						command: `${menuEntry.command}` }
					);
				} else {
					tmpData.push(
						{ text: "&nbsp;&nbsp;&nbsp;&nbsp;" },
						{ text: `<font color="#777777" size="+${
							menuEntry.size || "20"}">[${
							menuEntry.name || menuEntry.command}]</font>` }
					);
				}
			});
			tmpData.push(
				{ text: "<font size=\"+2\"><br><br></font>" }
			);
		});
		const command = page ? `${COMMAND} $${page}` : COMMAND;
		tmpData.push(
			{ text: "<br>" },
			{ text: "<font color=\"#9966cc\" size=\"+15\">[Reload]</font>", command: `proxy reload proxy-menu; ${command}` },
			{ text: "&nbsp;&nbsp;&nbsp;&nbsp;" },
			{ text: "&nbsp;&nbsp;&nbsp;&nbsp;" },
			{ text: `<font color="#dddddd" size="+18">${moment().tz("Europe/Berlin").format("HH:mm z")} / ${moment().tz("Europe/Kiev").format("HH:mm z")}/ ${moment().tz("Europe/Moscow").format("HH:mm z")}</font>` }
		);
		parse(tmpData, "<font>Menu</font>");
	}

	function useItem(id) {
		if (!player) return;
		mod.send("C_USE_ITEM", 3, {
			gameId: mod.game.me.gameId,
			id: id,
			amount: 1,
			loc: player.loc,
			w: player.loc.w,
			unk4: true
		});
	}

	function startSkill(id) {
		mod.send("C_START_SKILL", 7, {
			skill: {
				reserved: 0,
				npc: false,
				type: 1,
				huntingZoneId: 0,
				id: `${id}`
			},
			w: player.loc.w,
			loc: player.loc,
			dest: {
				x: 0,
				y: 0,
				z: 0
			},
			unk: true,
			moving: false,
			continue: false,
			target: "0",
			unk2: false
		});
	}

	const DUNGEON_QUEST_FALLBACKS = {
		3107: [2206, 2152]
	};

	let teleportBusy = false;

	function rememberDungeonQuest(quest, instance) {
		const q = Number(quest);
		const inst = Number(instance);
		if (!q || !inst) return;
		if (!mod.settings.dungeonQuests) mod.settings.dungeonQuests = {};
		if (!mod.settings.dungeonInstances) mod.settings.dungeonInstances = {};
		mod.settings.dungeonQuests[String(inst)] = q;
		mod.settings.dungeonInstances[String(q)] = inst;
	}

	function requestVanguardList() {
		try {
			mod.send("C_AVAILABLE_EVENT_MATCHING_LIST", 1, { unk: 0 });
		} catch (_) {}
	}

	function getQueryData() {
		if (typeof mod.queryData === "function") return (...args) => mod.queryData(...args);
		if (mod.clientInterface && typeof mod.clientInterface.queryData === "function") {
			return (...args) => mod.clientInterface.queryData(...args);
		}
		return null;
	}

	async function loadClientDungeonEvents() {
		const queryData = getQueryData();
		if (!queryData) return;
		try {
			const result = await queryData("/EventMatching/EventGroup/Event@type=?", ["Dungeon"], true, true, ["id", "requiredItemLevel"]);
			if (!result || !result.length) return;
			const byZone = new Map();
			result.forEach(entry => {
				const eventId = Number(entry.attributes && entry.attributes.id);
				if (!eventId) return;
				let zoneId = 0;
				const targetList = (entry.children || []).find(child => child.name === "TargetList");
				const target = targetList && (targetList.children || []).find(child => child.name === "Target");
				if (target && target.attributes) zoneId = Number(target.attributes.id) || 0;
				clientEvents.set(eventId, {
					quest: eventId,
					instance: zoneId,
					name: dungeonData.displayName(zoneId, ""),
					ilvl: entry.attributes && entry.attributes.requiredItemLevel
				});
				if (zoneId) byZone.set(zoneId, eventId);
			});
			try {
				const names = await queryData("/StrSheet_Dungeon/String@id=?", [[...byZone.keys()]], true);
				(names || []).forEach(row => {
					const zoneId = Number(row.attributes && row.attributes.id);
					const eventId = byZone.get(zoneId);
					if (eventId && clientEvents.has(eventId) && row.attributes && row.attributes.string) {
						clientEvents.get(eventId).name = dungeonData.displayName(zoneId, row.attributes.string);
					}
				});
			} catch (_) {}
			if (debug) mod.command.message(`Client dungeon data: ${clientEvents.size} events`);
		} catch (_) {}
	}

	function instanceForQuest(quest) {
		const q = Number(quest);
		const learned = Number(mod.settings.dungeonInstances && mod.settings.dungeonInstances[String(q)]);
		if (learned) return learned;
		const client = clientEvents.get(q);
		if (client && client.instance) return client.instance;
		const catalog = dungeonData.findByQuest(q)[0];
		return catalog ? catalog.instance : 0;
	}

	function questMapsToInstance(quest, instance) {
		const inst = Number(instance);
		const q = Number(quest);
		const client = clientEvents.get(q);
		if (client && Number(client.instance) === inst) return true;
		const family = dungeonData.familyFor(inst);
		if (family && (family.quests || []).some(id => dungeonData.variants(id).includes(q))) return true;
		return dungeonData.findByQuest(q).some(entry => {
			const found = dungeonData.familyFor(entry.instance, entry.name);
			return found.instances && found.instances.includes(inst);
		});
	}

	function menuButton(entry) {
		return {
			command: `m et ${entry.quest} ${entry.instance}`,
			name: entry.name,
			color: entry.color || dungeonData.C.y
		};
	}

	function addMenuBreak(list) {
		if (list.length && list[list.length - 1].command) list.push({});
	}

	function buildDungeonPage() {
		const scan = [{
			command: "m dangscan",
			name: liveQuestIds.size
				? `Scan this server (${liveQuestIds.size} Vanguard events)`
				: "Scan this server",
			color: dungeonData.C.y
		}, {
			command: "m tohw",
			name: "City (Vanguard store)",
			color: dungeonData.C.o
		}];
		const detected = [];

		clientEvents.forEach((info, quest) => {
			if (liveQuestIds.size && !dungeonData.resolveLiveQuest([quest], liveQuestIds)) return;
			const inst = Number(info.instance) || instanceForQuest(quest);
			if (!inst) return;
			detected.push({
				quest: dungeonData.resolveLiveQuest([quest], liveQuestIds) || quest,
				instance: inst,
				name: dungeonData.displayName(inst, info.name)
			});
		});

		dungeonData.CATALOG.forEach(entry => {
			const liveQuest = dungeonData.resolveLiveQuest(entry.quests, liveQuestIds);
			const instanceKnown = liveInstanceIds.has(entry.instance);
			if (liveQuestIds.size && !liveQuest && !instanceKnown) return;
			if (!liveQuestIds.size && !liveInstanceIds.size && clientEvents.size) return;
			detected.push({
				quest: liveQuest || Number(mod.settings.dungeonQuests && mod.settings.dungeonQuests[String(entry.instance)]) || entry.quests[0],
				instance: entry.instance,
				name: entry.name
			});
		});

		liveQuestIds.forEach(quest => {
			if (clientEvents.has(quest) || dungeonData.findByQuest(quest).length) return;
			const inst = instanceForQuest(quest) || quest;
			detected.push({
				quest,
				instance: inst,
				name: dungeonData.displayName(inst)
			});
		});

		const unique = dungeonData.dedupeEntries(detected)
			.sort((a, b) => a.name.localeCompare(b.name));
		if (!unique.length) {
			return { Scan: scan };
		}

		const items = [];
		unique.forEach(entry => {
			addMenuBreak(items);
			items.push(menuButton({
				quest: entry.quest,
				instance: entry.instance,
				name: entry.name,
				color: entry.color
			}));
		});

		return {
			Scan: scan,
			"On this server": items
		};
	}

	function sendEventTeleport(quest, instance) {
		mod.send("C_REQUEST_EVENT_MATCHING_TELEPORT", 0, {
			unk1: 0,
			quest: Number(quest) || 0,
			instance: Number(instance) || 0,
			unk2: 0,
			unk3: 0
		});
	}

	function eventTeleport(quest, instance) {
		const inst = Number(instance);
		const primary = Number(quest);
		if (!inst) return;
		if (teleportBusy) return;

		if (!mod.settings.dungeonQuests) mod.settings.dungeonQuests = {};
		const learned = Number(mod.settings.dungeonQuests[String(inst)]);
		const tries = [];
		const addTry = (value) => {
			const n = Number(value);
			if (!Number.isFinite(n) || n <= 0 || tries.includes(n)) return;
			tries.push(n);
		};
		liveQuestIds.forEach(id => {
			if (questMapsToInstance(id, inst)) addTry(id);
		});
		addTry(learned);
		addTry(primary);
		dungeonData.variants(primary).forEach(addTry);
		dungeonData.questsForInstance(inst).forEach(id => {
			addTry(id);
			if (liveQuestIds.has(id + dungeonData.QUEST_ID_MOD)) addTry(id + dungeonData.QUEST_ID_MOD);
			if (liveQuestIds.has(id - dungeonData.QUEST_ID_MOD)) addTry(id - dungeonData.QUEST_ID_MOD);
		});
		(DUNGEON_QUEST_FALLBACKS[inst] || []).forEach(addTry);
		addTry(inst);

		teleportBusy = true;
		let step = 0;
		let done = false;
		let timer = null;

		const finish = (ok) => {
			if (done) return;
			done = true;
			teleportBusy = false;
			if (timer) {
				mod.clearTimeout(timer);
				timer = null;
			}
			try { mod.unhook(zoneHook); } catch (_) {}
			if (ok) {
				const used = tries[Math.max(0, step - 1)];
				rememberDungeonQuest(used, inst);
			} else {
				mod.command.message("Dungeon teleport failed. Open Vanguard and click Go once so the menu can learn this dungeon.");
			}
		};

		const zoneHook = mod.hook("S_LOAD_TOPO", "raw", () => {
			finish(true);
		});

		const tryOne = () => {
			if (done) return;
			if (step >= tries.length) {
				finish(false);
				return;
			}
			sendEventTeleport(tries[step], inst);
			step += 1;
			timer = mod.setTimeout(tryOne, 450);
		};

		tryOne();
	}

	function bindHotkeys(categories) {
		Object.keys(categories).forEach(category =>
			Object.keys(categories[category]).forEach(command => {
				if (categories[category][command].keybind) {
					try {
						globalShortcut.register(categories[category][command].keybind, () =>
							mod.command.exec(categories[category][command].command)
						);
						keybinds.add(categories[category][command].keybind);
					} catch (e) {}
				}
			})
		);
	}

	function parse(array, title) {
		let body = "";
		try {
			array.forEach(data => {
				if (body.length >= 20000)
					throw "GUI data limit exceeded, some values may be missing.";
				if (data.command)
					body += `<a href="admincommand:/@${data.command};">${data.text}</a>`;
				else if (!data.command)
					body += `${data.text}`;
				else
					return;
			});
		} catch (e) {
			body += e;
		}
		mod.send("S_ANNOUNCE_UPDATE_NOTIFICATION", 1, { id: 0, title, body });
	}

	this.saveState = () => ({
		premiumAvailable
	});

	this.loadState = state => {
		premiumAvailable = state.premiumAvailable;
	};

	this.destructor = () => {
		keybinds.forEach(keybind => globalShortcut.unregister(keybind));
		mod.command.remove(COMMAND);
		if (changeZoneEvent) {
			mod.game.me.off("change_zone", changeZoneEvent);
		}
	};
};