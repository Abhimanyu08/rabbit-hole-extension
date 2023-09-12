document.addEventListener("DOMContentLoaded", () => {
	const inputEl = document.getElementById("start");
	const label = document.getElementsByTagName("label").item(0);

	chrome.storage.session.get("traversalTimeStamp", function (data) {
		console.log(data);
		if (Object.hasOwn(data, "traversalTimeStamp")) {
			label.textContent = "Stop Digging";
			inputEl.checked = true;
			return;
		}
		label.textContent = "Start Digging";
		inputEl.checked = false;
	});

	inputEl.addEventListener("change", (e) => {
		if (e.target.checked) {
			// chrome.runtime.sendMessage("start-digging");
			chrome.storage.session.set({
				traversalTimeStamp: `traversal-${Date.now()}`,
			});
			label.textContent = "Stop Digging";
			return;
		}

		// chrome.runtime.sendMessage("stop-digging");
		chrome.storage.session.remove("traversalTimeStamp");
		label.textContent = "Start Digging";
	});
});
