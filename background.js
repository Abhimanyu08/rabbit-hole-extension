let currentUrl = "root";
let urlToNodeMap = new Map();
let urlNode = {
	url: "root",
	children: [],
	parent: null
};

urlToNodeMap.set("root", urlNode);

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
	//this url is child of the root
	console.log(urlNode, currentUrl, details.url)
	const rootNode = urlToNodeMap.get(currentUrl);
	const currentNode = urlToNodeMap.has(details.url)
		? urlToNodeMap.get(details.url)
		: { url: details.url, children: []};
	if (currentNode.url !== rootNode.parent && rootNode.url !== currentNode.url) {
		currentNode.parent = rootNode.url
		rootNode.children.push(currentNode);
	}
	currentUrl = details.url;
	urlToNodeMap.set(currentUrl, currentNode);
	chrome.storage.local.set({ urlNode: JSON.stringify(urlNode) })	
});

// Listen for changes in the active tab.
chrome.tabs.onActivated.addListener(({ tabId }) => {
	// Use the chrome.tabs.get method to retrieve information about the active tab.
	chrome.tabs.get(tabId, (tab) => {
		// Check if the tab's URL starts with "chrome://newtab/".
		if (tab.url && tab.url.startsWith("chrome://newtab/")) {
			// The user is on a Chrome New Tab page, reset everything
			reset();
		}
	});
});

function reset() {
	currentUrl = "root";
	urlToNodeMap.clear();
	urlNode = {
		url: "root",
		children: [],
		parent:null
	};
	urlToNodeMap.set("root", urlNode);
	chrome.storage.local.clear();
}
