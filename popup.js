const nodeToCoords = new Map();

const scale = d3.scaleLinear([0, 1], [100, 600]);
const transformScale = [1,10]
const opacityScale = d3.scaleLinear(transformScale, [0,1])
const line = d3.line();
const circles =[]
 const paths = []
 const urls = []

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

	const circleElems = svg.selectAll("circle").data(circles).join("circle").attr("transform", d => `translate(${d})`).attr("r", 5).attr("fill", "cornflowerblue")
  	const pathElems = svg.selectAll("path").data(paths).join("path").attr("d", (d) => line(d)).attr("strokeWidth", 3).attr("stroke", "turquoise")
	const labels = svg.selectAll("text").data(circles).join("text")
	.attr("transform", d => `translate(${d})`).attr("fill", "white").text((_,i) => urls[i]).style("opacity", 0)
	function zoomed({transform}) {
		circleElems.attr("r", 5*transform.k).attr("transform", (d) => `translate(${transform.apply(d)})`)
		pathElems.attr("transform", transform)
		labels.attr("transform", (d) => `translate(${transform.apply(d)})`).style("opacity", opacityScale(transform.k))
	}

 	svg.call(d3.zoom().scaleExtent(transformScale).on("zoom", zoomed))


});



function renderNode(node, parentCoords, container) {
	const xCoord = Math.floor(scale(Math.random()));
	const yCoord = parentCoords ? parentCoords.y + 20 : 20;

	if (!nodeToCoords.has(node.url)) {
		nodeToCoords.set(node.url, { x: xCoord, y: yCoord });
	}
	const coords = nodeToCoords.get(node.url);

	circles.push([coords.x, coords.y])
	urls.push(node.url)
	if (parentCoords) {
			paths.push([[coords.x,coords.y], [parentCoords.x, parentCoords.y]])
	}



	if (node.children) {
		node.children.map((child) => {
			renderNode(child, { x: coords.x, y: coords.y }, container);
		});
	}
}
