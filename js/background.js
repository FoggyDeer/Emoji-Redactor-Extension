function changeObjKey(obj, keyToFind, newValue) {
	if (obj === undefined || keyToFind === undefined) {
		return undefined;
	}
	if (newValue == null || newValue == undefined)
		newValue = null;
	else
		newValue = newValue;

	for (let key in obj) {
		if (key == keyToFind) {
			obj[key] = newValue;
		} else if (typeof obj[key] === 'object') {
			changeObjKey(obj[key], keyToFind, newValue);
		}
	}
}

function findObjectByKey(obj, key) {
	if (obj === undefined || key === undefined || obj === null || key === null) {
		return undefined;
	} else {
		for (var i in obj) {
			if (i === key) {
				return obj[i];
			}
			if (typeof obj[i] === 'object') {
				var found = findObjectByKey(obj[i], key);
				if (found != null) return found;
			}
		}
		return null;
	}
}


/////////////////////////////////////////////////////////////////
//---     SETTINGS CLASS     ------------------------------------
class Settings {
	static defaultSettings = {

		emoji_editor: {
			emojiDB: null
		},
		emoji_editor_panel: {
			disable_emoji: false,
			adaptive_mode: false,
			animations: true,
			opened: false
		}
	};

	//   settings initialization

	static async init() {
		FileManager(['config_resources/emojiDB.txt'], 'load_file', function (data) {
			Settings.defaultSettings.emoji_editor.emojiDB = data;
			chrome.storage.sync.clear();
			chrome.storage.local.set({
				default_settings: Settings.defaultSettings,
				current_settings: JSON.parse(JSON.stringify(Settings.defaultSettings))
			}, function () {
				return this;
			});
		});
	}

	//   settings changing

	static async change(option) {
		chrome.storage.local.get('current_settings', function (obj) {
			let settings = JSON.parse(JSON.stringify(obj.current_settings))
			changeObjKey(settings, option.key, option.value)
			chrome.storage.local.set({
				current_settings: settings
			}, function () {
				return this;
			});
		});
	}

	//   settings reset

	static async resetSettings(elem) {
		chrome.storage.local.get('current_settings', function (obj) {
			if (elem != undefined) {
				let settings = obj.current_settings;
				for (let ckey in settings[elem]) {
					changeObjKey(settings, ckey, findObjectByKey(Settings.defaultSettings, ckey))
				}
				chrome.storage.local.set({
					current_settings: settings
				}, function () {
					return this;
				});
			} else {
				Settings.init();
				return this;
			}
		});
	}

	//   getting settings value

	static async getSettingsValue(key, showInConsole, callback) {
		let group = (key != undefined ? 'current_settings' : null);
		chrome.storage.local.get(group, function (obj) {
			let foundObj = findObjectByKey(obj, key);
			obj = foundObj != null ? foundObj : obj;
			if (showInConsole)
				console.log(obj)
			callback(obj)
			return true;
		});
	}
};


/////////////////////////////////////////////////////////////////
//---     FILE MANAGER     --------------------------------------

function FileManager(path, method, sendResponse, rules) {
	switch (method) {

		case "load_file":

			fetch(chrome.runtime.getURL(path[0])).then((response) => response.text()).then((data) => {
				sendResponse(data);
			});

			break;

		case "injectJS":
			chrome.scripting.executeScript({
				target: {
					tabId: rules.tab.id
				},
				files: [...path],
			}, () => chrome.runtime.lastError);
			break;
	}
}

/////////////////////////////////////////////////////////////////
//---     EVENT ON INSTALL     ---------------------------------- 

chrome.runtime.onInstalled.addListener(function (event) {
	if (event.reason == 'install') {
		Settings.init();
	}
});
chrome.runtime.onConnect.addListener(function (port) {
	console.log(port.name)
});

//---     EVENT ON MESSAGE     ---------------------------------- 

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	chrome.tabs.query({
		currentWindow: true,
		active: true
	}, function (tabs) {
		if (request.type == 'update') {
			sendResponse(true)
		} else if (request.type == 'empanel_event') {
			if (request.event == 'open') {
				Settings.getSettingsValue('opened', false, function (data) {
					if (!data) {
						Settings.change({
							key: 'opened',
							value: true
						}).then(sendResponse(true));
						FileManager(['js/jquery-3.6.0.js', 'js/emoji-editor.js'], 'injectJS', sendResponse(true), {
							tab: tabs[0]
						});
					} else
						sendResponse(true);
				})
			} else if (request.event == 'close') {
				Settings.change({
					key: 'opened',
					value: false
				}).then(sendResponse(true));
			}
		} else if (request.type == 'file') {
			FileManager(request.path, request.method, sendResponse);
		} else if (request.type == 'change_settings') {
			Settings.change(request.option).then(sendResponse(true));
		} else if (request.type == 'reset_settings') {
			Settings.resetSettings(request.target).then(sendResponse(true));
		} else if (request.type == 'onload') {
			if (sender.tab && tabs[0].id == sender.tab.id) {
				Settings.getSettingsValue('opened', false, function (data) {
					if (data) {
						FileManager(['js/jquery-3.6.0.js', 'js/emoji-editor.js'], 'injectJS', sendResponse(true), {
							tab: tabs[0]
						})
					} else
						sendResponse(true);
				})
			}
		}
	});
	return true;
});
