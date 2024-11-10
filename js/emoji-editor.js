var inAdaptiveMode = false;
if (typeof EmojiDB === 'function') {
	window.postMessage({
		source: 'emoji_panel',
		event: 'open'
	});
	chrome.runtime.sendMessage({
		type: 'file',
		method: 'load_file',
		path: ['html/emoji-editor.html']
	}, function (response) {
		var htmlDoc = new DOMParser().parseFromString(response, 'text/html');

		//get emoji database from sttorage
		chrome.storage.local.get('current_settings', (data) => {
			var emojiDB = new EmojiDB(data.current_settings.emoji_editor.emojiDB),
				emojiDB_groups = Object.keys(emojiDB),
				emoji_cell = '',
				code = '',
				title = '',
				tag = '',
				emoji_panel_iframe,
				emoji_panel_div,
				emoji_panel,
				emoji_categories;

			emojiDB.insertEmojiToDoc(htmlDoc.documentElement.querySelector('#emoji_categories'));

			emoji_panel_iframe = document.createElement('iframe');
			emoji_panel_iframe.id = 'emoji_panel';
			emoji_panel_iframe.classList.add('magic_designer', 'bottom_location');
			emoji_panel_iframe.setAttribute('frameborder', '0');
			emoji_panel_iframe.setAttribute('allowtransparency', 'true');
			document.body.appendChild(emoji_panel_iframe);

			let hover_scrim = document.createElement('div');
			hover_scrim.id = 'hover_scrim';
			hover_scrim.classList.add('magic_designer');
			document.body.appendChild(hover_scrim);

			emoji_panel_iframe.contentWindow.document.body.innerHTML = htmlDoc.documentElement.querySelector('#parse_content').innerHTML;
			htmlDoc.documentElement.querySelector('#parse_content').remove();

			emoji_panel_div = emoji_panel_iframe.contentWindow.document.getElementById('emoji_panel');
			emoji_panel_div.classList.add('magic_designer', 'bottom_location');

			emoji_panel = emoji_panel_iframe.contentWindow.document;
			emoji_categories = emoji_panel.getElementById('emoji_categories');
			initSettings('emoji_editor_panel', emoji_panel, function () {
				chrome.runtime.sendMessage({
					type: 'file',
					method: 'load_file',
					path: ['css/emoji-editor-iframe.css']
				}, function (response) {
					const emojiEditorCSSFile = response;
					add_CSS_toFrame(emojiEditorCSSFile, emoji_panel);
					document.body.insertAdjacentHTML('beforeend', htmlDoc.documentElement.innerHTML);
					emoji_panel_iframe.style.left = window.innerWidth - 65 - $(emoji_panel_iframe).outerWidth() + 'px';
					emoji_panel_iframe.style.display = (emoji_panel_iframe.classList.contains('top')) ? 'flex' : 'block';

					setTimeout(function () {
						emoji_panel_iframe.setAttribute('visible', '');
					}, 200)

					//------------      MAIN INTERACTION       ----------------------------

					var prev_class = emoji_panel_iframe.classList[1],
						ratio = 0,
						scroll_sector = 0;

					function digitLimit(digit, MIN, MAX) {
						return parseInt(Math.min(Math.max(digit, MIN), MAX + 1));
					}

					//------      SET HEIGHT OF CONTAINERS       ---------------------

					var container_height_tb = document.createElement('style');
					container_height_tb.id = 'container_height_tb';
					container_height_tb.classList.add('magic_designer');

					var container_height_rl = document.createElement('style');
					container_height_rl.id = 'container_height_rl';
					container_height_rl.classList.add('magic_designer');

					emoji_panel.getElementsByTagName('head')[0].appendChild(container_height_tb);
					emoji_panel.getElementsByTagName('head')[0].appendChild(container_height_rl);

					function change_container_height(ratio, groupName) {
						let tb_height, rl_height;
						let emoji_categories_BoundingRect = emoji_categories.getBoundingClientRect();
						let containsEmoji = false;
						let firstMatch = false;

						for (let [i, group] of emojiDB.groups.entries()) {
							if (groupName === null || groupName === undefined || groupName === group) {
								current_class = '.category_container.' + group;

								if (ratio[group] == 0) {
									tb_height = 0;
									rl_height = 0;
									emoji_panel.getElementsByClassName('sort_btn_row')[i].style.display = 'none';
									emoji_panel.querySelector('.' + group).style.display = 'none';
								} else {
									containsEmoji = true;
									emoji_panel.querySelector('.' + group).removeAttribute('style');
									emoji_panel.getElementsByClassName('sort_btn_row')[i].removeAttribute('style');
									if (inAdaptiveMode) {
										tb_height = Math.ceil(ratio[group] / 6) * 50.6 + 49.4;
										rl_height = Math.ceil(ratio[group] / 8) * 47.4 + 49.4;
									} else {
										tb_height = Math.ceil(ratio[group] / 4) * 85.8 + ((group != 'smiles_and_emotions') ? 40.4 : 44.4);
										rl_height = Math.ceil(ratio[group] / 5) * 85.8 + ((group != 'smiles_and_emotions') ? 40.4 : 44.4);
									}
									if (!firstMatch) {
										firstMatch = true;
										firstMatchIndex = i;
									}
								}

								if (container_height_tb.sheet.cssRules[i]) container_height_tb.sheet.deleteRule(i);
								container_height_tb.sheet.insertRule('.magic_designer#emoji_panel.bottom_location ' + current_class + ', .magic_designer#emoji_panel.top_location ' + current_class + '{height: ' + tb_height + 'px !important;}', i);

								if (container_height_rl.sheet.cssRules[i]) container_height_rl.sheet.deleteRule(i);
								container_height_rl.sheet.insertRule('.magic_designer#emoji_panel.right_location ' + current_class + ', .magic_designer#emoji_panel.left_location ' + current_class + '{height: ' + rl_height + 'px !important;}', i);
							}
						}
						return containsEmoji;
					}
					change_container_height(emojiDB.emojiCounts);

					//------     CLOSE BUTTON     -----------------------------------------

					$(emoji_panel).find('#close_btn').click(() => {
						try {
							chrome.runtime.sendMessage({
								type: 'empanel_event',
								event: 'close'
							}, function () {
								if (chrome.runtime.lastError) {}
							});
							window.postMessage({
								source: 'emoji_panel',
								event: 'close'
							});
						} catch (err) {
							let shouldReload = confirm("𝗘𝗺𝗼𝗷𝗶 𝗘𝗱𝗶𝘁𝗼𝗿\n\nSomething went wrong. You need to reload page. Reload?")
							if (shouldReload) {
								window.location.reload();
							}
						}
						setTimeout(() => {
							emoji_panel_iframe.classList.add('closed');
						}, 50)
						setTimeout(() => {
							emoji_panel_iframe.remove();
							document.querySelector("#hover_scrim.magic_designer").remove();
							document.querySelectorAll('script.magic_designer').forEach(element => {
								element.remove();
							});
						}, 300)
					});

					//------     CHANGE SKIN TONE     -------------------------------------

					var currentSkinTone = 'default_skin_tone';
					$(emoji_panel).find('#skin_tone_selector').change(function (event) {
						currentSkinTone = event.target.id;
						emoji_panel.getElementsByClassName('emoji_category people_and_body')[0].innerHTML = '';
						if (isSearching) {
							emojiDB.insertEmojiToDoc(emoji_categories, 'people_and_body', event.target.id, {
								tags: searched_tags
							});
						} else
							emojiDB.insertEmojiToDoc(emoji_categories, 'people_and_body', event.target.id);

						emoji_panel.getElementsByClassName('category_container people_and_body')[0].classList.remove(Array.from(emoji_panel.getElementsByClassName('category_container people_and_body')[0].classList)[2]);
						emoji_panel.getElementsByClassName('category_container people_and_body')[0].classList.add(event.target.id);
						change_container_height(emojiDB.emojiCounts, 'people_and_body');
					});

					//------     MOVING BUTTON     -----------------------------------------

					var difference, isMoving = false,
						isSearching = false;

					function panelSticking(axis, event) {
						let x = event.screenX;
						let y = event.screenY;
						emoji_panel_iframe.classList.remove(prev_class);
						emoji_panel_div.classList.remove(prev_class);
						switch (prev_class) {
							case 'bottom_location':
								emoji_panel_iframe.style.top = window.innerHeight - 65 - $(emoji_panel_iframe).outerHeight() + 'px';
								break;
							case 'right_location':
								emoji_panel_iframe.style.left = window.innerWidth - 65 - $(emoji_panel_iframe).outerWidth() + 'px';
								break;
							case 'top_location':
								emoji_panel_iframe.style.top = '65px';
								break;
							case 'left_location':
								emoji_panel_iframe.style.left = '65px';
								break;
						}
						if (axis == 'x') {
							difference.x = x - emoji_panel_iframe.getBoundingClientRect().left;
						} else if (axis == 'y') {
							difference.y = y - emoji_panel_iframe.getBoundingClientRect().top;
						}
						prev_class = emoji_panel_iframe.classList[1];
						emoji_panel_iframe.style.display = (prev_class == 'top_location') ? 'flex' : 'block';
						if (!isSearching) {
							emoji_panel.getElementById(emoji_panel.getElementsByClassName('checked')[0].getAttribute('href')).scrollIntoView({
								behavior: 'auto'
							});
						} else {
							if (nearestChild) {
								nearestChild.scrollIntoView({
									behavior: 'auto'
								});
							} else {
								emoji_categories.scrollTo({
									top: 0
								});
							}
						}
					}

					function mm_listener(event) {
						requestAnimationFrame(() => {
							if ($(emoji_panel_iframe).hasClass('bottom_location') || $(emoji_panel_iframe).hasClass('top_location')) {
								emoji_panel_iframe.style.top = null;

								if (window.innerWidth - emoji_panel_iframe.getBoundingClientRect().right <= 0) {
									$(emoji_panel_iframe).addClass('right_location');
									$(emoji_panel_div).addClass('right_location');
									panelSticking('y', event);
								} else if (emoji_panel_iframe.getBoundingClientRect().left <= 0) {
									$(emoji_panel_iframe).addClass('left_location');
									$(emoji_panel_div).addClass('left_location');
									panelSticking('y', event);
								}
								emoji_panel_iframe.style.left = digitLimit(event.screenX - difference.x, 0, window.innerWidth - $(emoji_panel_iframe).outerWidth()) + 'px';
								ratio = (emoji_panel_iframe.getBoundingClientRect().left + $(emoji_panel_iframe).outerWidth() / 2) / window.innerWidth * 100;
							} else if ($(emoji_panel_iframe).hasClass('right_location') || $(emoji_panel_iframe).hasClass('left_location')) {
								emoji_panel_iframe.style.left = null;

								if (window.innerHeight - emoji_panel_iframe.getBoundingClientRect().bottom <= 0) {
									$(emoji_panel_iframe).addClass('bottom_location');
									$(emoji_panel_div).addClass('bottom_location');
									panelSticking('x', event);
								} else if (emoji_panel_iframe.getBoundingClientRect().top <= 0) {
									$(emoji_panel_iframe).addClass('top_location');
									$(emoji_panel_div).addClass('top_location');
									panelSticking('x', event);
								}
								emoji_panel_iframe.style.top = digitLimit(event.screenY - difference.y, 0, window.innerHeight - $(emoji_panel_iframe).outerHeight()) + 'px';
								ratio = (emoji_panel_iframe.getBoundingClientRect().top + $(emoji_panel_iframe).outerHeight() / 2) / window.innerHeight * 100;
							}
						});
					}
					var nearestChild;
					emoji_panel.getElementById('navigation_btn').addEventListener('mousedown', (md_event) => {
						if (!isScrolling) {
							isMoving = true;
							document.ondragstart = () => {
								if (isMoving) {
									return false;
								}
							};
							difference = {
								x: md_event.screenX - emoji_panel_iframe.getBoundingClientRect().left,
								y: md_event.screenY - emoji_panel_iframe.getBoundingClientRect().top
							};
							document.getElementById('hover_scrim').classList.add('visible');
							emoji_panel_iframe.contentWindow.document.getElementById('emoji_panel').setAttribute('style', 'pointer-events: none !important;');
							emoji_panel.documentElement.style.cursor = 'move';
							md_event.target.style.opacity = '1';

							const visibleElements = emoji_categories.querySelectorAll('[style*="display: inline-flex"]');
							var parent = emoji_categories,
								parentRect = parent.getBoundingClientRect();

							if (isSearching && hasSearchResults) {
								let children = Array.from(parent.children);
								nearestChild = children[0];
								for (let i = 1; i < children.length - 1; i++) {
									if (Math.abs(nearestChild.getBoundingClientRect().top - parentRect.top) > Math.abs(children[i].getBoundingClientRect().top - parentRect.top)) {
										nearestChild = children[i];
									}
								}
								$(emoji_categories).animate({
									scrollTop: emoji_categories.scrollTop - (emoji_categories.getBoundingClientRect().top - nearestChild.getBoundingClientRect().top)
								}, 200);
							} else if (visibleElements.length == 2) {
								let firstChildRect = visibleElements[0].parentNode.getBoundingClientRect().bottom,
									secondChildRect = visibleElements[visibleElements.length - 1].parentNode.getBoundingClientRect().top,
									parentCenter = parentRect.bottom - (parentRect.height / 2);

								if (firstChildRect > parentCenter) {
									emoji_categories.scrollBy({
										top: firstChildRect - parentRect.bottom,
										behavior: 'smooth'
									});
									$(visibleElements[visibleElements.length - 1].querySelector('.emoji_category')).fadeTo('fast', 0, () => {
										visibleElements[visibleElements.length - 1].querySelector('.emoji_category').style.opacity = null;
									});
								} else if (secondChildRect < parentCenter) {
									visibleElements[visibleElements.length - 1].parentNode.scrollIntoView({
										behavior: 'smooth'
									});
									$(visibleElements[0].querySelector('.emoji_category')).fadeTo('fast', 0, () => {
										visibleElements[0].querySelector('.emoji_category').style.opacity = null;
									});
								}
							}
							emoji_panel_iframe.contentWindow.addEventListener('mousemove', mm_listener, true);
							emoji_panel_iframe.contentWindow.addEventListener('mouseup', () => {
								emoji_panel_iframe.contentWindow.removeEventListener('mousemove', mm_listener, true);
								isMoving = false;

								emoji_panel.getElementById('navigation_btn').removeAttribute('style');
								document.getElementById('hover_scrim').classList.remove('visible');
								emoji_panel_iframe.contentWindow.document.getElementById('emoji_panel').removeAttribute('style');
								emoji_panel.documentElement.style.cursor = null;
							}, {
								once: true
							});
						}
					});

					//--------    OPTIMIZED LOADING ON SCROLL     ----------------------------

					function activate_sector(index) {
						if (Number.isInteger(index)) {
							emoji_panel.getElementsByClassName('checked')[0].classList.remove('checked');
							emoji_panel.getElementsByClassName('emoji_sort_btn')[index].classList.add('checked');
						} else if (isSearching && emoji_categories.scrollTop == 0) {
							emoji_panel.getElementsByClassName('checked')[0].classList.remove('checked');
							emoji_panel_div.getElementsByClassName('emoji_sort_btn')[firstMatchIndex].classList.add('checked');
							emoji_categories.addEventListener('scroll', activate_sector, {
								once: true,
								passive: true
							});
						} else if (!isScrolling && (!isSearching || hasSearchResults)) {
							emoji_panel.getElementsByClassName('checked')[0].classList.remove('checked');
							emoji_panel.getElementsByClassName('emoji_sort_btn')[scroll_sector].classList.add('checked');
						}
					}

					const edgeIntersectionObserver = new IntersectionObserver((entries, observer) => {
						entries.forEach((entry) => {
							if (entry.isIntersecting) {
								entry.target.getElementsByClassName('emoji_category')[0].style.display = 'inline-flex';
							} else {
								entry.target.getElementsByClassName('emoji_category')[0].style.display = 'none';
							}
						});
					}, {
						root: emoji_categories,
					});

					const halfIntersectionObserver = new IntersectionObserver((entries, observer) => {
						entries.forEach((entry) => {
							if (entry.isIntersecting) {
								scroll_sector = entry.target.id[0];
								activate_sector();
							}
						});
					}, {
						root: emoji_categories,
						rootMargin: `-50% 0px -50% 0px`
					});

					Array.from(emoji_panel.getElementsByClassName('category_container')).forEach((container) => {
						edgeIntersectionObserver.observe(container);
						halfIntersectionObserver.observe(container);
					});

					//--------    RESIZING FUNCTION    -----------------------------------------------------------------------------------------------------------

					if (prev_class == 'bottom_location' || prev_class == 'top_location') {
						ratio = (emoji_panel_iframe.getBoundingClientRect().left + $(emoji_panel_iframe).outerWidth() / 2) / window.innerWidth * 100;
					} else if (prev_class == 'right_location' || prev_class == 'left_location') {
						ratio = (emoji_panel_iframe.getBoundingClientRect().top + $(emoji_panel_iframe).outerHeight() / 2) / window.innerHeight * 100;
					}
					window.addEventListener('resize', function (event) {
						if (prev_class == 'bottom_location' || prev_class == 'top_location') {
							emoji_panel_iframe.style.left = window.innerWidth / 100 * ratio - $(emoji_panel_iframe).outerWidth() / 2 + 'px';
							emoji_panel_iframe.style.left = digitLimit(emoji_panel_iframe.getBoundingClientRect().left, 0, window.innerWidth - $(emoji_panel_iframe).outerWidth()) + 'px';
						} else if (prev_class == 'left_location' || prev_class == 'right_location') {
							emoji_panel_iframe.style.top = window.innerHeight / 100 * ratio - $(emoji_panel_iframe).outerHeight() / 2 + 'px';
							emoji_panel_iframe.style.top = digitLimit(emoji_panel_iframe.getBoundingClientRect().top, 0, window.innerHeight - $(emoji_panel_iframe).outerHeight()) + 'px';
						}
					}, true);

					//--------    SEARCHING    ----------------------------------------------------------------------------------------------------------------------

					function contains(tag, rule) {
						for (var i = 0; i < rule.length; i++) {
							if (tag.includes(rule[i])) {
								continue;
							} else {
								return false;
							}
						}
						return true;
					}

					function clearGroups(groupName) {
						let groups = groupName ? [groupName] : emojiDB.groups;
						for (let group of groups) {
							emoji_panel.querySelectorAll('.' + group)[2].innerHTML = '';
						}
					}

					var searched_tags = [''],
						searchTimeout,
						hasSearchResults = false,
						firstMatchIndex = 0;

					emoji_panel.getElementById('emoji_search').addEventListener('mousedown', hideEmojiListScrim, false);
					emoji_panel.getElementById('search_cross').addEventListener('mousedown', hideEmojiListScrim, false);
					emoji_panel.getElementById('emoji_search').addEventListener('input', function (event) {
						searched_tags = ['']
						clearTimeout(searchTimeout);
						searchTimeout = setTimeout(function () {
							isSearching = true;
							clearGroups();
							emoji_categories.scrollTop = 0;
							for (var i = 0; i < event.target.value.length; i++) {
								if (searched_tags[searched_tags.length - 1] != '' && event.target.value[i] == ' ') {
									searched_tags[searched_tags.length] = '';
								} else if (event.target.value[i] != ' ') {
									searched_tags[searched_tags.length - 1] += event.target.value[i].toLowerCase();
								}
							}
							emojiDB.insertEmojiToDoc(emoji_categories, null, currentSkinTone, {
								tags: searched_tags
							});
							hasSearchResults = change_container_height(emojiDB.emojiCounts);
							if (searched_tags[0] === '') {
								isSearching = false
								hasSearchResults = false;
								emoji_panel.getElementById('search_cross').removeAttribute('visible');
								activate_sector(0);
							} else {
								emoji_panel.getElementById('search_cross').setAttribute('visible', '');
								emoji_panel.getElementById('search_cross').setAttribute('tabindex', '0');
								activate_sector();
							}
							visible_categories = emoji_categories.querySelectorAll('.category_container:not([style*="display: none;"])');
						}, 50);
					}, false);
					emoji_panel.getElementById('emoji_search').addEventListener('blur', function () {
						emoji_panel.getElementById('search_cross').removeAttribute('tabindex');
					}, false);
					emoji_panel.getElementById('search_cross').addEventListener('click', function () {
						emoji_panel.getElementById('emoji_search').value = '';
						emoji_panel.getElementById('emoji_search').focus();
						setTimeout(function () {
							emoji_panel.getElementById('emoji_search').dispatchEvent(new Event('input', {
								bubbles: true
							}));
						}, 10)
					});
					//------     SORT BUTTONS     -----------------------------------------

					var isScrolling = false,
						scrollingTimeout;

					function scrollEnd() {
						isScrolling = true;
						clearTimeout(scrollingTimeout);

						scrollingTimeout = setTimeout(() => {
							isScrolling = false;
							emoji_categories.removeEventListener("scroll", scrollEnd, false);
						}, 150);
					}

					function onWheel() {
						isScrolling = false;
						clearTimeout(scrollingTimeout);
						emoji_categories.removeEventListener("scroll", scrollEnd, false);
						emoji_categories.scrollTop = emoji_categories.scrollTop;
						if (!isSearching)
							activate_sector();
					}

					var emoji_sort = emoji_panel.querySelector('#emoji_sort');
					$(emoji_panel).find('.emoji_sort_btn').click(function () {
						isScrolling = true;

						emoji_categories.removeEventListener('wheel', onWheel, {
							once: true,
							passive: true
						});
						emoji_categories.addEventListener('wheel', onWheel, {
							once: true,
							passive: true
						});
						emoji_categories.addEventListener("scroll", scrollEnd, false);

						hideEmojiListScrim();
						if (!this.classList.contains('checked')) {
							emoji_sort.getElementsByClassName('checked')[0].classList.remove('checked');
							this.classList.add('checked');
						}
						emoji_categories.scrollTo({
							top: emoji_panel.getElementById(this.getAttribute('href')).offsetTop,
							behavior: 'smooth'
						});
					});

					//--------    EMOJI VIEWER    --------------------------------------------------------------------------------------------------------------

					function hideEmojiListScrim() {
						emoji_panel.getElementById('emoji_viewer_wrap').querySelector('#action_alert').removeAttribute('visible');
						emoji_panel.getElementById("emoji_viewer_wrap").removeAttribute('visible');
						emoji_panel.getElementById("emoji_list_scrim").removeAttribute('visible');
					}

					let prev_emoji, main_emoji, next_emoji, visible_categories;
					let emoji_data_wrap = emoji_panel.getElementById("emoji_data_wrap");
					let regex = /^(.*?)[\_\-\:\s]{0,2}((?:dark skin|medium skin|light skin).*)?$/;

					function getEmojiInBlock(pos, element) {
						if (pos == 'n') {
							element = element.nextElementSibling;

							while (element && element.tagName == 'DIV') {
								if (window.getComputedStyle(element).display !== 'none') {
									return element.querySelector('.emoji_cell');
								}
								element = element.nextElementSibling;
							}
						} else if (pos == 'p') {
							element = element.previousElementSibling;

							while (element && element.tagName == 'DIV') {
								if (window.getComputedStyle(element).display !== 'none') {
									return element.querySelector('.emoji_cell:last-of-type');
								}
								element = element.previousElementSibling;
							}
						}

						return null;
					}

					function setPrevEmoji(elem) {
						prev_emoji = elem || main_emoji.previousElementSibling || getEmojiInBlock('p', main_emoji.parentElement.parentElement);
						if (!prev_emoji) {
							let containers = emoji_categories.querySelectorAll('.category_container:not([style*="display: none;"])');
							prev_emoji = containers[containers.length - 1].querySelector('.emoji_cell:last-of-type');
						}

						if (prev_emoji) {
							emoji_data_wrap.querySelector('#prev_emoji').querySelector('#text_content').innerHTML = prev_emoji.title.match(regex)[1].replaceAll('_', '-');
							emoji_data_wrap.querySelector('#prev_emoji').querySelector('#emoji').innerHTML = prev_emoji.querySelector('.emoji').getAttribute('alt');
						}
					}

					function setNextEmoji(elem) {
						next_emoji = elem || main_emoji.nextElementSibling || getEmojiInBlock('n', main_emoji.parentElement.parentElement) || emoji_categories.querySelector('.emoji_cell');

						if (next_emoji) {
							emoji_data_wrap.querySelector('#next_emoji').querySelector('#text_content').innerHTML = next_emoji.title.match(regex)[1].replaceAll('_', '-');
							emoji_data_wrap.querySelector('#next_emoji').querySelector('#emoji').innerHTML = next_emoji.querySelector('.emoji').getAttribute('alt');
						}
					}

					function setMainEmoji(elem) {
						main_emoji = elem;

						emoji_data_wrap.querySelector('#main_emoji').querySelector('#text_content').innerHTML = main_emoji.title.match(regex)[1].replaceAll('_', '-');
						emoji_data_wrap.querySelector('#main_emoji').querySelector('#emoji').innerHTML = main_emoji.querySelector('.emoji').getAttribute('alt');
					}

					emoji_panel_div.addEventListener('click', function (event) {
						if (event.target.classList.contains('emoji_cell')) {
							setMainEmoji(event.target);
							setPrevEmoji();
							setNextEmoji();

							emoji_panel.getElementById("emoji_viewer_wrap").setAttribute('visible', '');
							emoji_panel.getElementById("emoji_list_scrim").setAttribute('visible', '');

						} else if (event.target.id == 'emoji_list_scrim') {

							hideEmojiListScrim();
						}
					}, false);

					let actionTimer = null;
					let slideTimeout = null;

					function showNotify(text) {
						emoji_panel.getElementById('emoji_viewer_wrap').querySelector('#action_alert').removeAttribute('visible');
						clearTimeout(actionTimer);
						actionTimer = setTimeout(() => {
							emoji_panel.getElementById('emoji_viewer_wrap').querySelector('#action_alert').removeAttribute('visible');
						}, 1400);
						setTimeout(() => {
							emoji_panel.getElementById('emoji_viewer_wrap').querySelector('#action_alert').innerHTML = text;
							emoji_panel.getElementById('emoji_viewer_wrap').querySelector('#action_alert').setAttribute('visible', '');
						}, 20);
					}

					function slideLeft() {
						emoji_data_wrap.classList.remove('left')
						setNextEmoji(main_emoji);
						setMainEmoji(prev_emoji);
						setPrevEmoji();
					}

					function slideRight() {
						emoji_data_wrap.classList.remove('right')
						setPrevEmoji(main_emoji);
						setMainEmoji(next_emoji);
						setNextEmoji();
					}
					emoji_panel.getElementById('emoji_viewer_wrap').addEventListener('click', function (event) {
						if (event.target.classList[0] == 'evnb') {
							if (slideTimeout) {
								(event.target.id == 'left_btn') ? slideLeft(): slideRight();
								clearTimeout(slideTimeout);
								slideTimeout = null;
							}

							setTimeout(function () {
								emoji_data_wrap.classList.add((event.target.id == 'left_btn') ? 'left' : 'right')
							}, 20);

							slideTimeout = setTimeout(function () {
								(event.target.id == 'left_btn') ? slideLeft(): slideRight();
								slideTimeout = null;
							}, 400)

						} else {
							switch (event.target.id) {
								case 'emoji':
									navigator.clipboard.writeText(event.target.textContent).then(function () {
										showNotify('Copied');
									});
									break;
								case 'emoji_name':
									navigator.clipboard.writeText(event.target.querySelector('#text_content').textContent).then(function () {
										showNotify('Copied');
									});
									break;
								case 'Copy':
									this.querySelector('#paste_btn').setAttribute('visible', '');
									showNotify('Copied');
									break;
							}
						}
					}, false)

					//--------    SETTINGS     -------------------------------------------------------------------------------------------------------------------

					emoji_panel.getElementById('menu-button').addEventListener('click', function () {
						if (emoji_panel.getElementById('settings').classList.contains('visible')) {
							emoji_panel.getElementById('settings').classList.remove('visible');
						} else {
							emoji_panel.getElementById('settings').classList.add('visible');

							function hideSettings(e) {
								if (!emoji_panel.getElementById('settings').contains(e.target)) {
									document.removeEventListener('mousedown', hideSettings, false);
									emoji_panel.removeEventListener('mousedown', hideSettings, false);
									emoji_panel.getElementById('settings').classList.remove('visible');
								}
							}
							$(emoji_panel).find('.settings_checkbox').change(function () {
								chrome.runtime.sendMessage({
									type: 'change_settings',
									option: {
										key: this.id,
										value: $(this).is(':checked')
									}
								});
								if (this.id == 'adaptive_mode') {

									emoji_categories.removeAttribute('visible');
									setTimeout(() => {
										inAdaptiveMode = this.checked;
										change_container_height(emojiDB.emojiCounts);
										emoji_panel_div.setAttribute('mode', (inAdaptiveMode ? 'adaptive' : 'default'));
										emoji_categories.setAttribute('visible', '');
										emoji_panel.getElementById(emoji_panel.getElementsByClassName('checked')[0].getAttribute('href')).scrollIntoView({
											behavior: 'auto'
										});
									}, 250);
								}
							});
							emoji_panel.getElementById('reset_settings').addEventListener('click', () => resetSettings('emoji_editor_panel', emoji_panel));
							document.addEventListener('mousedown', hideSettings, false);
							emoji_panel.addEventListener('mousedown', hideSettings, false);
						}
					});

					lowFpsWarning(emoji_panel.getElementById('low_fps_warning'));
				});
			});
		});
	});
}

function lowFpsWarning(elem) {
	var fps = 0,
		lastTime = performance.now();

	function update() {
		let currentTime = performance.now();
		fps = 1000 / (currentTime - lastTime);
		lastTime = currentTime;
		requestAnimationFrame(update);
	}

	update();

	setInterval(() => {
		if (fps < 45) {
			elem.classList.add('visible');
		} else {
			elem.classList.remove('visible');
		}
	}, 1000)
}

function add_CSS_toFrame(cssText, frameNode) {
	let style = document.createElement('style');
	style.id = 'style';
	style.textContent = cssText;

	let target = frameNode.getElementsByTagName('head')[0] || frameNode.body || frameNode.documentElement;
	target.appendChild(style);
}

function initSettings(name, target, callback) {
	chrome.storage.local.get('current_settings', (data) => {
		let opt = data.current_settings[name];
		for (let key in opt) {
			if (key != 'opened')
				target.getElementById(key).checked = opt[key];
		}
		if (opt.adaptive_mode) {
			inAdaptiveMode = true;
			target.getElementById('emoji_panel').setAttribute('mode', 'adaptive');
		} else {
			inAdaptiveMode = false;
			target.getElementById('emoji_panel').setAttribute('mode', 'default');
		}
		callback();
	})
}

function resetSettings(name, elem) {
	let shouldReset = confirm("𝗘𝗺𝗼𝗷𝗶 𝗘𝗱𝗶𝘁𝗼𝗿\n\nAre you sure? You will not able to restore any saved information. We recommend to save your settings.");
	if (shouldReset) {
		chrome.runtime.sendMessage({
			type: 'reset_settings',
			target: name
		})
		chrome.storage.local.get('default_settings', (data) => {
			let opt = data.default_settings[name];
			for (let key in opt) {
				if (key != 'opened')
					elem.getElementById(key).checked = opt[key];
			}
		});
	}
}
