let currentUrl = "root";
let urlToNodeMap = new Map();
let urlNode = {
	url: "root",
	children: [],
	parent: null,
};

urlToNodeMap.set("root", urlNode);

// chrome.runtime.onMessage.addListener((message) => {
// 	console.log(message);
// 	if (message === "start-digging") {
// 		startDigging = true;
// 		return;
// 	}
// 	startDigging = false;
// });

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
	//this url is child of the root
	updateGraph(details.url);
});

// Listen for changes in the active tab.
chrome.tabs.onActivated.addListener(({ tabId }) => {
	// Use the chrome.tabs.get method to retrieve information about the active tab.
	chrome.tabs.get(tabId, (tab) => {
		// Check if the tab's URL starts with "chrome://newtab/".
		// if (tab.url && !tab.url.startsWith("chrome://newtab")) {
		// 	currentUrl = tab.url;
		// }
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
	if (changeInfo.url && changeInfo.url.startsWith("chrome://")) {
		// This tab is likely a new tab page
		// updateGraph(changeInfo.url);
		return;
	}

	if (changeInfo.url) {
		updateGraph(changeInfo.url);
	}
});

function updateGraph(url) {
	chrome.storage.session.get("startDigging", function (data) {
		if (!data.startDigging) return;
		console.log(urlNode);
		const rootNode = urlToNodeMap.has(currentUrl)
			? urlToNodeMap.get(currentUrl)
			: {
					url,
					children: [],
					parent: null,
			  };
		const currentNode = urlToNodeMap.has(url)
			? urlToNodeMap.get(url)
			: { url, children: [] };
		if (
			currentNode.url !== rootNode.parent &&
			rootNode.url !== currentNode.url
		) {
			currentNode.parent = rootNode.url;
			rootNode.children.push(currentNode);
		}
		currentUrl = url;
		urlToNodeMap.set(currentUrl, currentNode);
		chrome.storage.local.set({ urlNode: JSON.stringify(urlNode) });
	});
}

function reset() {
	currentUrl = "root";
	urlToNodeMap.clear();
	urlNode = {
		url: "root",
		children: [],
		parent: null,
	};
	urlToNodeMap.set("root", urlNode);
	chrome.storage.local.clear();
}
