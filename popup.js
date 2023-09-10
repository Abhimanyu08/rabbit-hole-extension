document.addEventListener("DOMContentLoaded", () => {
	const inputEl = document.getElementById("start");
	const label = document.getElementsByTagName("label").item(0);

	chrome.storage.session.get("startDigging", function (data) {
		inputEl.checked = data.startDigging || false;
		if (data.startDigging) {
			label.textContent = "Stop Digging";
		}
	});

	inputEl.addEventListener("change", (e) => {
		if (e.target.checked) {
			// chrome.runtime.sendMessage("start-digging");
			chrome.storage.session.set({ startDigging: true });
			label.textContent = "Stop Digging";
			return;
		}

		// chrome.runtime.sendMessage("stop-digging");
		chrome.storage.session.set({ startDigging: false });
		label.textContent = "Start Digging";
	});
});
