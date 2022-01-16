function $(id){
    return document.getElementById(id);
}

function single(iterable, predicate){
    for(const n of iterable){
        if(predicate(n)) return n;
    }
    return null;
}

const cp = $("cp");
$("cpWidth").value = getComputedStyle(cp).width;
$("cpHeight").value = getComputedStyle(cp).height;
let sources = [];
let currentSource = null;
let currentCanvas = {width: 1000, height:1000, element: null};
$("canvasWidth").value = currentCanvas.width;
$("canvasHeight").value = currentCanvas.height;
placeCanvas();

function getAspect(obj){
    return (obj.width * 1.0)/obj.height;
}


$("sourceSelect").addEventListener('change', (e) => {
    const label = e.target.options[e.target.selectedIndex].text;
    const sourceByLabel = single(sources, s => s.label == label);
    if(sourceByLabel){
        currentSource = sourceByLabel.value;
        currentCanvas = sourceByLabel.canvas;
        $("canvasWidth").value = currentCanvas.width;
        $("canvasHeight").value = currentCanvas.height;
        $("sourceDisplay").value = JSON.stringify(currentSource, null, 4);
        processSource();
    }
});

$("go").addEventListener('click', processSource);

for(const dimText of document.querySelectorAll(".dimension")){
    dimText.addEventListener('change', processSource);
}

$("region").addEventListener('change', processSource);
$("full").addEventListener('click', () => $("region").value = "full");


fetch("strategy-sources.json")
    .then(response => response.json())
    .then(data => {
        sources = data;
        for(const source of sources){
            const opt = document.createElement("option");
            opt.innerText = source.label;
            $("sourceSelect").append(opt);
        }
    });

function clearCP(){
    cp.removeAttribute("style");    
    cp.style.width = $("cpWidth").value;
    cp.style.height = $("cpHeight").value;
    cp.innerHTML = "";
}

function processSource(){
    console.log("Will try to process source")
    const textBox = $("sourceDisplay");
    textBox.style.backgroundColor = "#fff";
    clearCP();
    try {
        if(textBox.value.trim()){
            currentSource = JSON.parse(textBox.value);            
            currentCanvas.width = $("canvasWidth").value;
            currentCanvas.height = $("canvasHeight").value;
            placeCanvas();
            // applyStrategy();
        }
    } catch (e) {
        textBox.style.backgroundColor = "#f7979f";
        cp.innerText = e;
    }
}

function placeCanvas(){
    // the canvas maximises the space it takes up in CP.
    // we need to work out how big the canvas is in pixels
    const cvElement = document.createElement("div");
    cvElement.className = "canvas";
    cp.append(cvElement);
    currentCanvas.element = cvElement; 
    // Which dimension do we need to match on?
    const cvAspect = getAspect(currentCanvas);
    const cpAspect = getAspect({width:cp.clientWidth, height:cp.clientHeight});
    let scale = 1;
    if(cvAspect > cpAspect){
        scale = (cp.clientWidth * 1.0) / currentCanvas.width;
    } else {        
        scale = (cp.clientHeight * 1.0) / currentCanvas.height;
    }
    cvElement.style.width = (currentCanvas.width * scale) + "px";
    cvElement.style.height = (currentCanvas.height * scale) + "px";
}

function applyStrategy(){    
    console.log("Applying image selection strategy")
    // 1. place the canvas in CP

    if(typeof currentSource === "string"){
        // in use, CP will have obtained this from a Canvas, so CP already knows whether this string
        // is an image service endpoint, or just a static image resource. In this demo, it's always
        // a static image.
        setSingleImage(currentSource);
    }
}

function setSingleImage(src){

    // Same logic to place the image on the canvas, as to place the canvas on CP
    const img = new Image();
    cp.append(img);
    cvAspect = getAspect(currentCanvas);
    imgAspect = getAspect(img);
    if(imgAspect > cvAspect){

    }
    
    img.onload = function() {
        console.log(img.width);
        console.log(img.height);
    }
    img.src = src;
}