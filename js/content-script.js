let emojiPanelOpened = false;
var origin = 'chrome-extension://' + chrome.runtime.id;
if (!location.ancestorOrigins.contains(origin)) {
	window.onload = function () {
		chrome.runtime.sendMessage({
			type: 'onload'
		}, function () {
			chrome.runtime.lastError
		});

		var port = chrome.runtime.connect(null, {
			name: 'Magic_Designer'
		});
		var connectInterval = setInterval(function () {
			try {
				port.postMessage({
					message: true
				});
			} catch (e) {
				clearInterval(connectInterval);
			}
		}, 5000)

		port.onDisconnect.addListener(function (e) {
			setTimeout(function () {
				try {
					port = chrome.runtime.connect(null, {
						name: 'Magic_Designer'
					});
				} catch (e) {
					let shouldReload = confirm("𝗘𝗺𝗼𝗷𝗶 𝗘𝗱𝗶𝘁𝗼𝗿\n\nSomething went wrong. You need to reload page. Reload?")
					if (shouldReload)
						window.location.reload();
				}
			}, 100)
		});

		window.addEventListener("message", function (event) {
			if (event.data.source == 'emoji_panel') {
				switch (event.data.event) {
					case 'open':
						emojiPanelOpened = true;
						break;
					case 'close':
						emojiPanelOpened = false;
						break;
				}
			}
		});
	}
}

//window.btoa(unescape(encodeURIComponent(JSON.stringify(*****))));
//decodeURIComponent(escape(window.atob(*****)));
//&#x...;
class EmojiDB {
	constructor(encryptedDB) {
		this.DB = JSON.parse(decodeURIComponent(escape(window.atob(encryptedDB))));
		this.emojiCounts = new Object();
		for (
			let group in this.DB) {
			this.emojiCounts[group] = 0;
		}
		this.groups = Object.keys(this.DB)
	}

	insertEmojiToDoc(target, groupsName, skinTone, rules) {
		if (groupsName === undefined || groupsName === null) {
			groupsName = Object.keys(this.DB);
		} else {
			groupsName = [groupsName];
		}

		skinTone = skinTone || 'default_skin_tone';

		let shouldContinue = true;

		for (let group of groupsName) {
			this.emojiCounts[group] = 0;
			if (shouldContinue) {
				let trg = target.querySelectorAll('.' + group)[2];
				if (group === 'people_and_body') {
					shouldContinue = this.insertEmoji(this.DB[group][skinTone], trg, group, rules);
				} else {
					shouldContinue = this.insertEmoji(this.DB[group], trg, group, rules);
				}
			}
		}
	}

	insertEmoji(array, target, group, rules) {
		for (let emoji of array) {
			if ((rules !== undefined && rules !== null && (
					(((rules.quality === undefined || rules.quality === null) && emoji.quality == 'fully-qualified') || emoji.quality === rules.quality) &&
					(rules.code === undefined || rules.code === null || emoji.code === rules.code) &&
					this.contains(emoji.tags, rules.tags))) || ((rules === undefined || rules === null) && emoji.quality == 'fully-qualified')) {
				let emoji_cell = '<div title="' + emoji.tags + '" class="emoji_cell"><div class="emoji_wrap"><div class="emoji" alt="' + emoji.code + '">' + emoji.data + ';</div></div></div>';
				target.insertAdjacentHTML('beforeend', emoji_cell);
				this.emojiCounts[group]++;
				if (rules !== undefined && rules !== null && emoji.code === rules.code) return false;
			}
		}
		return true;
	}

	contains(string, expArray) {
		string = string.toLowerCase();
		expArray = expArray || [''];
		return expArray.every(sub => {
			return string.includes(sub);
		});
	}

	showALL() {
		console.log(this.DB);
	}

	showEmojiCounts() {
		for (let key in this.emojiCounts) {
			console.log(this.emojiCounts[key])
		}
	}
}
