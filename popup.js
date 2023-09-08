const nodeToCoords = new Map();

const scale = d3.scaleLinear([0, 1], [10, 400]);
const line = d3.line();

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
	const container = d3.select("#svg")

    const urlNode = JSON.parse(data.urlNode);
	console.log(urlNode)
	renderNode(urlNode, undefined, container)

	// 	console.log(svg)
		// container.node().append(svg.node())
});

function processNode(node) {
	if (!node.children) return node;
	for (let child of node.children) {
		child.parent = node;
		processNode(child);
	}
	return node;
}

function renderNode(node, parentCoords, container) {
	const xCoord = Math.floor(scale(Math.random()));
	const yCoord = parentCoords ? parentCoords.y + 100 : 20;

	if (!nodeToCoords.has(node.url)) {
		nodeToCoords.set(node.url, { x: xCoord, y: yCoord });
	}
	const coords = nodeToCoords.get(node.url);

	container.append("circle")
		.attr("cx", coords.x)
		.attr("cy", coords.y)
		.attr("r", 20)
		.attr("fill", "white")

		container.append("text")
		.attr("x", coords.x + 22)
		.attr("y", coords.y)
		.attr("fill","white")
		.text(node.url);
	if (parentCoords) {
		container.append("path")
			.attr("fill", "none")
			.attr("strokeWidth", 2)
			.attr("stroke", "white")
			.attr(
				"d",
				line([
					[coords.x, coords.y],
					[parentCoords.x, parentCoords.y],
				])
			);
	}



	if (node.children) {
		node.children.map((child) => {
			renderNode(child, { x: coords.x, y: coords.y }, container);
		});
	}
}
