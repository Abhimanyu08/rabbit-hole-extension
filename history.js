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
	console.log(data);

	const container = d3.select("#container");
	for (let [key, val] of Object.entries(data)) {
		if (/traversal-(\d+)/.test(key)) {
			const traversalArray = JSON.parse(val);
			prepareGraph(container, traversalArray);
		}
	}
});

function renderNode(traversalArray) {
	const circles = [];
	const paths = [];

	const urlToNode = new Map();
	for (let { from, to } of traversalArray) {
		console.log(from, to);
		if (!urlToNode.has(from)) {
			const urlNode = { url: from, x: 300, y: 300, id: from };
			urlToNode.set(from, urlNode);
			circles.push(urlNode);
		}
		if (!urlToNode.has(to)) {
			const urlNode = { url: to, x: 300, y: 300, id: to };
			urlToNode.set(to, urlNode);
			circles.push(urlNode);
		}

		paths.push({
			source: from,
			target: to,
			// id: from,
		});

		// if (node.children) {
		// 	node.children.map((child) => {
		// 		renderNode(child );
		// 	});
		// }
	}
	return [circles, paths];
}

function prepareGraph(container, traversalArray) {
	const svg = container.append("div").append("svg");
	const [circles, paths] = renderNode(traversalArray);

	const pathElems = preparePaths(svg, paths);
	const circleElems = prepareNodes(svg, circles);
	const labels = prepareLabels(svg, circles);

	circleElems
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
		.force("x", d3.forceX(200))
		.force("y", d3.forceY(200))
		.force("collide", d3.forceCollide(20))
		.force("center", d3.forceCenter(700 / 2, 500 / 2));

	svg.call(d3.zoom().scaleExtent(transformScale).on("zoom", zoomed));

	simulation.on("tick", () => {
		pathElems
			.attr("x1", (d) => d.source.x)
			.attr("y1", (d) => d.source.y)
			.attr("x2", (d) => d.target.x)
			.attr("y2", (d) => d.target.y);

		circleElems.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
		labels.attr("x", (d) => d.x).attr("y", (d) => d.y + 10);
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
	const circleElems = svg
		.selectAll("circle")
		.data(circles)
		.join("circle")
		.attr("r", 5)
		.attr("fill", "cornflowerblue");

	return circleElems;
}
