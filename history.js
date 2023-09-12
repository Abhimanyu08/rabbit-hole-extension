const scale = d3.scaleLinear([0, 1], [100, 600]);
const transformScale = [1, 10];
const opacityScale = d3.scaleLinear(transformScale, [0.2, 1]);
const line = d3.line();
const urls = [];

document.addEventListener("DOMContentLoaded", async () => {
	let data = await new Promise((resolve, reject) => {
		chrome.storage.local.get(null, (result) => {
			if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError);
			} else {
				resolve(result);
			}
		});
	});

	const container = d3.select("#container");

	for (let [key, val] of Object.entries(data)) {
		const keyRegex = /traversal-(\d+)/;
		if (keyRegex.test(key)) {
			const timeStamp = keyRegex.exec(key)[1];
			let { traversalArray } = val;
			console.log(key, traversalArray);
			prepareGraph(container, traversalArray, timeStamp);
		}
	}
});

function renderNode(traversalArray) {
	const paths = [];

	const urlToNode = new Map();

	function addOrModifyUrl(url) {
		if (!urlToNode.has(url)) {
			const urlNode = { url: url, x: 300, y: 300, id: url, count: 1 };
			urlToNode.set(url, urlNode);
		} else {
			const urlNode = urlToNode.get(url);
			urlToNode.set(url, { ...urlNode, count: urlNode.count + 1 });
		}
	}
	for (let { from, to } of traversalArray) {
		addOrModifyUrl(from);
		addOrModifyUrl(to);
		paths.push({
			source: from,
			target: to,
			// id: from,
		});
	}
	const circles = Array.from(urlToNode.values());
	return [circles, paths];
}

function addTimeStampDiv(container, timeStamp) {
	container
		.append("div")
		.attr("class", "info")
		.text(formatTimestamp(timeStamp));
}

function addOptionsDiv(container, timeStamp) {
	const options = container.append("div").attr("class", "options");

	const refreshNode = container
		.append("div")
		.attr("class", "options")
		.style("display", "none")
		.style("padding", "10px")
		.style("z-index", "100")
		.style("background-color", "black")
		.text("Refresh to minimize");
	options
		.append("button")
		.text("Expand")
		.on("click", () => {
			container
				.style("position", "fixed")
				.style("top", 0)
				.style("left", 0)
				.style("width", "100%")
				.style("height", "100%");

			refreshNode.style("display", "flex");
		});
	const confirmationDialog = container
		.append("div")
		.attr("class", "confirm")
		.style("visibility", "hidden");
	options
		.append("button")
		.text("Delete")
		.on("click", () => {
			confirmationDialog.style("visibility", "visible");
		});
	confirmationDialog
		.append("button")
		.text("Confirm")
		.on("click", () => {
			chrome.storage.local.remove(`traversal-${timeStamp}`);
			container.style("display", "none");
		});
	confirmationDialog
		.append("button")
		.text("Cancel")
		.on("click", () => {
			confirmationDialog.style("visibility", "hidden");
		});
}

function prepareGraph(container, traversalArray, timeStamp) {
	const div = container.append("div");

	addTimeStampDiv(div, timeStamp);
	addOptionsDiv(div, timeStamp);

	const svg = div.append("svg");
	const svgElement = svg.node();
	const svgWidth = svgElement.clientWidth;
	const svgHeight = svgElement.clientHeight;

	const [circles, paths] = renderNode(traversalArray);

	const pathElems = preparePaths(svg, paths);
	const [nodeAndLabels, circleElems, labels] = prepareNodes(svg, circles);
	// const labels = prepareLabels(svg, circles);

	nodeAndLabels
		.on("click", function (_, d) {
			const url = d.url;
			chrome.tabs.create({ url });
		})
		.on("mouseover", function (_, d) {
			const label = labels.filter((ld, _) => d.url === ld.url);
			label.attr("opacityOld", label.style("opacity"));
			labels.style("opacity", 0);
			label.style("opacity", 1);

			circleElems.style("opacity", 0.2);
			pathElems.style("opacity", 0.2);
		})

		.on("mouseleave", function (_, d) {
			const label = labels.filter((ld, _) => d.url === ld.url);
			labels.style("opacity", label.attr("opacityOld"));
			circleElems.style("opacity", 1);
			pathElems.style("opacity", 1);
		});

	function zoomed({ transform }) {
		circleElems.attr("transform", transform);
		pathElems.attr("transform", transform);
		labels
			.attr("transform", transform)
			.style("opacity", opacityScale(transform.k));
	}

	const simulation = d3
		.forceSimulation(circles)
		.force(
			"link",
			d3.forceLink(paths).id((d) => d.id)
		)
		.force("x", d3.forceX(svgWidth / 2))
		.force("y", d3.forceY(svgHeight / 2))
		.force("collide", d3.forceCollide(40))
		.force("center", d3.forceCenter(svgWidth / 2, svgHeight / 2));

	svg.call(d3.zoom().scaleExtent(transformScale).on("zoom", zoomed));

	simulation.on("tick", () => {
		pathElems
			.attr("x1", (d) => d.source.x)
			.attr("y1", (d) => d.source.y)
			.attr("x2", (d) => d.target.x)
			.attr("y2", (d) => d.target.y);

		circleElems.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
		labels.attr("x", (d) => d.x - 20).attr("y", (d) => d.y + 10);
		// pathElems.attr("d", (d) => line(d))
	});
	circleElems.call(
		d3
			.drag()
			.on("start", dragstarted)
			.on("drag", dragged)
			.on("end", dragended)
	);
	function dragstarted(event) {
		if (!event.active) simulation.alphaTarget(0.3).restart();
		event.subject.fx = event.subject.x;
		event.subject.fy = event.subject.y;
	}

	// Update the subject (dragged node) position during drag.
	function dragged(event) {
		event.subject.fx = event.x;
		event.subject.fy = event.y;
	}

	// Restore the target alpha so the simulation cools after dragging ends.
	// Unfix the subject position now that it’s no longer being dragged.
	function dragended(event) {
		if (!event.active) simulation.alphaTarget(0);
		event.subject.fx = null;
		event.subject.fy = null;
	}
}

function preparePaths(svg, paths) {
	const pathElems = svg
		.selectAll("line")
		.data(paths)
		.join("line")
		.attr("stroke", "turquoise")
		.attr("stroke-width", 2);
	return pathElems;
}

function prepareLabels(svg, circles) {
	const labels = svg
		.append("g")
		.selectAll("text")
		.data(circles)
		.join("text")
		.attr("fill", "white")
		.text((d) => d.url)
		.style("opacity", 0)
		.style("font-size", "5px")
		.style("font-weight", "400");
	return labels;
}

function prepareNodes(svg, circles) {
	const labelAndNodeG = svg
		.selectAll("g")
		.data(circles)
		.join("g")
		.attr("id", "nodewithlabel");

	const labels = labelAndNodeG
		.append("text")
		.attr("fill", "white")
		.text((d) => d.url)
		.style("opacity", 0)
		.style("font-size", "5px")
		.style("font-weight", "400");
	const circleElems = labelAndNodeG
		.append("circle")
		.attr("r", (d) => Math.min(5 * d.count, 40))
		.attr("fill", "cornflowerblue");

	return [labelAndNodeG, circleElems, labels];
}

function formatTimestamp(timestamp) {
	const date = new Date(parseInt(timestamp));

	// Define arrays for day names, month names, and AM/PM

	const months = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];

	// Get the components of the date
	const dayOfMonth = date.getDate();
	const month = months[date.getMonth()];
	const year = date.getFullYear().toString().slice(-2);
	const hours = date.getHours();
	const minutes = date.getMinutes();
	const amOrPm = hours >= 12 ? "pm" : "am";

	// Convert hours from 24-hour format to 12-hour format
	const formattedHours = hours % 12 || 12;

	// Pad single-digit minutes with a leading zero
	const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

	// Construct the formatted date string
	const formattedDate = `${dayOfMonth} ${month}, ${year} @${formattedHours}:${formattedMinutes}${amOrPm}`;

	return formattedDate;
}

// Example usage:
