// let currentUrl = "root";
// let currentSessionKey = "";
// let traversalArray = [];
// instead of a graph data structure, we should have an array of {from: url, to: url}

async function getTraversalTimeStamp() {
	const traversalTimeStamp = await new Promise((res) => {
		chrome.storage.session.get("traversalTimeStamp", function (data) {
			res(data.traversalTimeStamp);
		});
	});
	return traversalTimeStamp;
}

async function getPreviousData(traversalTimeStamp) {
	const previousData = await new Promise((res) => {
		chrome.storage.local.get(traversalTimeStamp, function (data) {
			res(data[traversalTimeStamp]);
		});
	});

	if (previousData) {
		return previousData;
	}
	return null;
}

function setTraversalData(traversalTimeStamp, traversalArray, currentUrl) {
	chrome.storage.local.set({
		[traversalTimeStamp]: {
			traversalArray,
			currentUrl,
		},
	});
}

async function changeCurrentUrl(url) {
	const traversalTimeStamp = await getTraversalTimeStamp();
	if (!traversalTimeStamp) return;
	const previousData = await getPreviousData(traversalTimeStamp);

	if (previousData) {
		const { traversalArray } = previousData;
		setTraversalData(traversalTimeStamp, traversalArray, url);
		return;
	}

	setTraversalData(traversalTimeStamp, [], url);
}

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
	//this url is child of the root
	// updateGraph(details.url);

	if (!details.url) return;

	if (details.url.includes("google.com/uviewer")) {
		return;
	}
	if (details.url.startsWith("chrome://newTab")) {
		changeCurrentUrl(details.url + `${Date.now()}`);
		return;
	}
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

// chrome.tabs.onCreated.addListener(function (tab) {
// 	// Check if the tab has a "chrome://" URL (new tab page)
// 	if (tab.url && tab.url.startsWith("chrome://")) {
// 		// This tab is likely a new tab page
// 		console.log("User opened a new tab page");
// 	}
// });

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	// Check if the URL changes to a "chrome://" URL (new tab page)

	if (!changeInfo.url) return;
	if (changeInfo.url.includes("google.com/uviewer")) {
		return;
	}
	if (changeInfo.url.startsWith("chrome://newtab")) {
		changeCurrentUrl(changeInfo.url + `${Date.now()}`);
		return;
	}
	if (changeInfo.url.startsWith("chrome://")) {
		// This tab is likely a new tab page
		// updateGraph(changeInfo.url);
		return;
	}

	updateGraph(changeInfo.url);
});

async function updateGraph(url) {
	const traversalTimeStamp = await getTraversalTimeStamp();

	if (!traversalTimeStamp) return;

	const previousData = await getPreviousData(traversalTimeStamp);
	if (!previousData) {
		setTraversalData(traversalTimeStamp, [{ from: "root", to: url }], url);
		return;
	}

	const { traversalArray, currentUrl } = previousData;

	if (url === currentUrl) return;
	const previousArray = traversalArray;

	previousArray.push({ from: currentUrl || "root", to: url });
	setTraversalData(traversalTimeStamp, previousArray, url);
}

function reset() {
	chrome.storage.local.clear();
}
