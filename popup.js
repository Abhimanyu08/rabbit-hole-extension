const nodeToCoords = new Map();

const scale = d3.scaleLinear([0, 1], [100, 600]);
const transformScale = [1, 10];
const opacityScale = d3.scaleLinear(transformScale, [0, 1]);
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

	renderNode(urlNode, 0, undefined, svg);
	console.log(paths, circles);

	const pathElems = svg
		.selectAll("line")
		.data(paths)
		.join("line")
		.attr("stroke", "turquoise")
		.attr("stroke-width", 2);

	const labels = svg
		.selectAll("text")
		.data(circles)
		.join("text")
		// .attr("transform", (d) => `translate(${d})`)
		.attr("fill", "white")
		.text((_, i) => urls[i])
		.style("opacity", 0);
	const circleElems = svg
		.selectAll("circle")
		.data(circles)
		.join("circle")
		// .attr("transform", (d) => `translate(${d})`)
		.attr("r", 5)
		.attr("fill", "cornflowerblue")
		.on("mouseover", function (_, d) {
			console.log(d);
			const label = labels.filter((ld, i) => d.url === ld.url);

			label.attr("opacityOld", label.style("opacity"));
			label.style("opacity", 1);
		})
		.on("mouseleave", function (_, d) {
			console.log(d);
			const label = labels.filter((ld, i) => d.url === ld.url);
			label.style("opacity", label.attr("opacityOld"));
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
		.force("x", d3.forceX(200))
		.force("y", d3.forceY(200))
		.force("collide", d3.forceCollide(10))
		.force("link", d3.forceLink(paths));

	svg.call(d3.zoom().scaleExtent(transformScale).on("zoom", zoomed));

	simulation.on("tick", () => {
		pathElems
			.attr("x1", (d) => d.source.x)
			.attr("y1", (d) => d.source.y)
			.attr("x2", (d) => d.target.x)
			.attr("y2", (d) => d.target.y);

		circleElems.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
		labels.attr("x", (d) => d.x).attr("y", (d) => d.y);
		// pathElems.attr("d", (d) => line(d))
	});
});

function renderNode(node, parentIndex, parentCoords, container) {
	const xCoord = Math.floor(scale(Math.random()));
	const yCoord = parentCoords ? parentCoords.y + 20 : 20;

	if (!nodeToCoords.has(node.url)) {
		nodeToCoords.set(node.url, { x: xCoord, y: yCoord });
	}
	const coords = nodeToCoords.get(node.url);

	circles.push({ ...coords, url: node.url });
	urls.push(node.url);
	if (parentCoords) {
		paths.push({
			source: parentIndex,
			target: circles.length - 1,
			url: node.url,
		});
	}

	if (node.children) {
		node.children.map((child) => {
			renderNode(
				child,
				circles.length - 1,
				{ x: coords.x, y: coords.y },
				container
			);
		});
	}
}
