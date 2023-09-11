let currentUrl = "root";
let currentSessionKey = "";
let traversalArray = [];
// instead of a graph data structure, we should have an array of {from: url, to: url}

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
	//this url is child of the root
	// updateGraph(details.url);

	if (!details.url) return;

	if (details.url.includes("google.com/uviewer")) {
		return;
	}
	if (details.url.startsWith("chrome://newTab")) {
		currentUrl = details.url + `${Date.now()}`;
		return;
	}
	currentUrl = details.url;
});

// Listen for changes in the active tab.
chrome.tabs.onActivated.addListener(({ tabId }) => {
	// Use the chrome.tabs.get method to retrieve information about the active tab.
	chrome.tabs.get(tabId, (tab) => {
		// Check if the tab's URL starts with "chrome://newtab/".
		if (tab.url && !tab.url.startsWith("chrome://newtab")) {
			currentUrl = tab.url;
		}
	});
});

chrome.tabs.onCreated.addListener(function (tab) {
	// Check if the tab has a "chrome://" URL (new tab page)
	if (tab.url && tab.url.startsWith("chrome://")) {
		// This tab is likely a new tab page
		console.log("User opened a new tab page");
	}
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	// Check if the URL changes to a "chrome://" URL (new tab page)

	if (!changeInfo.url) return;
	if (changeInfo.url.includes("google.com/uviewer")) {
		return;
	}
	if (changeInfo.url.startsWith("chrome://newtab")) {
		currentUrl = changeInfo.url + `${Date.now()}`;
		return;
	}
	if (changeInfo.url.startsWith("chrome://")) {
		// This tab is likely a new tab page
		// updateGraph(changeInfo.url);
		return;
	}

	updateGraph(changeInfo.url);
});

function updateGraph(url) {
	chrome.storage.session.get("startDigging", function (data) {
		if (!data.startDigging) {
			traversalArray = [];
			return;
		}
		if (url === currentUrl) return;
		if (traversalArray.length === 0) {
			currentSessionKey = "traversal-" + Date.now().toString();
		}
		traversalArray.push({ from: currentUrl || "root", to: url });
		currentUrl = url;
		chrome.storage.local.set({
			[currentSessionKey]: JSON.stringify(traversalArray),
		});
	});
}

function reset() {
	chrome.storage.local.clear();
}
