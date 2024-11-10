document.getElementById('emoji_editor').addEventListener('click', function () {
	chrome.runtime.sendMessage({
		type: 'empanel_event',
		event: 'open'
	});
});
