const nodeToCoords = new Map();

const scale = d3.scaleLinear([0, 1], [100, 600]);
const line = d3.line();
const circles =[]
 const paths = []

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
	const svg = d3.select("#svg")

    const urlNode = JSON.parse(data.urlNode);
	
	renderNode(urlNode, undefined, svg)

	const circleElems = svg.selectAll("circle").data(circles).join("circle").attr("transform", d => `translate(${d})`).attr("r", 5).attr("fill", "red")
  	const pathElems = svg.selectAll("path").data(paths).join("path").attr("d", (d) => line(d)).attr("strokeWidth", 3).attr("stroke", "white")
	function zoomed({transform}) {
	circleElems.attr("r", 5*transform.k).attr("transform", (d) => `translate(${transform.apply(d)})`)
	pathElems.attr("transform", transform)
	}

 	svg.call(d3.zoom().on("zoom", zoomed))


});



function renderNode(node, parentCoords, container) {
	const xCoord = Math.floor(scale(Math.random()));
	const yCoord = parentCoords ? parentCoords.y + 20 : 20;

	if (!nodeToCoords.has(node.url)) {
		nodeToCoords.set(node.url, { x: xCoord, y: yCoord });
	}
	const coords = nodeToCoords.get(node.url);

	circles.push([coords.x, coords.y])
	// container.append("circle")
	// 	.attr("cx", coords.x)
	// 	.attr("cy", coords.y)
	// 	.attr("r", 5)
	// 	.attr("fill", "cornflowerblue")

		// container.append("text")
		// .attr("x", coords.x)
		// .attr("y", coords.y + 22)
		// .attr("fill","white")
		// .text(node.url);
	if (parentCoords) {
		// container.append("path")
		// 	.attr("fill", "none")
		// 	.attr("strokeWidth", 3)
		// 	.attr("stroke", "turquoise")
		// 	.attr(
		// 		"d",
		// 		line([
		// 			[coords.x, coords.y],
		// 			[parentCoords.x, parentCoords.y],
		// 		])
		// 	);
			paths.push([[coords.x,coords.y], [parentCoords.x, parentCoords.y]])
	}



	if (node.children) {
		node.children.map((child) => {
			renderNode(child, { x: coords.x, y: coords.y }, container);
		});
	}
}
