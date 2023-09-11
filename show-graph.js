const urlToNode = new Map();

const scale = d3.scaleLinear([0, 1], [100, 600]);
const transformScale = [1, 3];
const opacityScale = d3.scaleLinear(transformScale, [0, 0.5]);
const line = d3.line();
const circles = [];
const paths = [];
const urls = [];

document.addEventListener("DOMContentLoaded", async () => {
	let data = await new Promise((resolve, reject) => {
		chrome.storage.local.get("urlNode", (result) => {
			if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError);
			} else {
				resolve(result);
			}
		});
	});
	const svg = d3.select("#svg");

	const urlNode = JSON.parse(data.urlNode);

	renderNode(urlNode, svg);

	const pathElems = preparePaths(svg);
	const circleElems = prepareNodes(svg);
	const labels = prepareLabels(svg);

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
});

function renderNode(node, container) {
	if (!urlToNode.has(node.url)) {
		const urlNode = { url: node.url, x: 300, y: 300, id: node.url };
		urlToNode.set(node.url, urlNode);
		circles.push(urlNode);
	}

	if (node.parent) {
		paths.push({
			source: node.parent,
			target: node.url,
			id: node.url,
		});
	}

	if (node.children) {
		node.children.map((child) => {
			renderNode(child, container);
		});
	}
}

function preparePaths(svg) {
	const pathElems = svg
		.selectAll("line")
		.data(paths)
		.join("line")
		.attr("stroke", "turquoise")
		.attr("stroke-width", 2);
	return pathElems;
}

function prepareLabels(svg) {
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

function prepareNodes(svg) {
	const circleElems = svg
		.selectAll("circle")
		.data(circles)
		.join("circle")
		.attr("r", 5)
		.attr("fill", "cornflowerblue");

	return circleElems;
}
