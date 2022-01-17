function $(id){
    return document.getElementById(id);
}

function single(iterable, predicate){
    for(const n of iterable){
        if(predicate(n)) return n;
    }
    return null;
}

function asInt(elementId){
    let intVal = 0;
    try {
        intVal = parseInt($(elementId).value, 10);
    } catch {}
    if(intVal < 0) intVal = 0;
    return intVal;
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
        if(currentSource.maxWidth){
            $("maxWidth").value = currentSource.maxWidth;
        }   
        $("preferredFormat").value = currentSource.preferredFormats ? currentSource.preferredFormats[0] : "jpg";    
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
    currentCanvas.width = asInt("canvasWidth");
    currentCanvas.height = asInt("canvasHeight");        
    placeCanvas();
    try {
        if(textBox.value.trim()){
            currentSource = JSON.parse(textBox.value);   
            applyStrategy();
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

    let imageService = currentSource;
    // This is shorthand, in the context of this demo for dealing with a partial image service
    // such as you might find in a manifest
    if("dctypes:Image" == currentSource["@type"] || "Image" == currentSource["type"])
    {
        // forget any other services for now, or auth, etc
        imageService = currentSource.service.isArray() ? currentSource.service[0] : currentSource.service;
        imageService.partial = true; // log this here for now
    }

    // #### Canvas Panel tweaks and dials you can adjust ####

    // The size at which we switch to asking for advertised tiles, even if we could ask for an arbitrary region.
    // If a `size` is advertised larger than this, we can still ask for it, as long as it doesn't exceed maxWidth
    const tileThreshold = asInt("tileThreshold");

    // The maxWidth supplied by the image service. (if maxHeight or maxArea supplied, we can compute this)
    // This is also a setting CP can choose set itself, and enforce, even if the service permits something
    // higher. e.g., to avoid requesting a very large image that incurs too much processing overhead.
    // TODO - extend for maxHeight, and maxArea
    let maxWidth = asInt("maxWidth");
    if(!maxWidth) maxWidth = imageService.width;

    // If there's a thumbnail service on the canvas, whether its sizes may be used as part of the
    // legacy image pyramid to choose from (CP must prefer sizes from the info.json, though)
    // This can be used to defer loading of the info.json if CP (vault) has the canvas with 
    // thumbs on it but has not yet loaded the info.json
    const includeThumbnailSizes = $("includeThumbnailSizes").checked;

    // clients should generally not do this unless they are in control of CP's size on the page AND the image services
    // Otherwise it will lead to many different large image requests from different users and defeat caching
    const preferExactInitialImage = $("preferExactInitialImage").checked;

    const preferredFormat = $("preferredFormat").value;

    // Augment any advertised sizes with an additional list - again to assist caching.
    // Unlike the sizes for an individual image (which are always known width and height),
    // this list is expressed as an array of iiif /size/ parameters.
    // e.g., Wellcome might have "880," in this list.
    // format is JSON: '["1200,1200!", "880,"]';
    let virtualSizePatterns = [];
    try {
        virtualSizePatterns = JSON.parse($("virtualSizes").value);
    } finally {        
        if(!virtualSizePatterns) virtualSizePatterns = [];
    }
    const virtualSizes = virtualSizePatterns.map(pattern => {
        // TODO: This needs to "resolve" to IIIF pattern 
        // (e.g., "880," => {width:880, height:1111} 
        // (compute the specific size from imageService)
        return {width: 0, height: 0}; // obviously a useless size for now!
    });

    if(includeThumbnailSizes){

    }


    // OK, do we need to fetch the whole thing?
    if(imageService.partial){
        // under what circumstances, what combinations of info, do we need to get the full service?
        let needsFetching = false;
        if(!imageService.preferredFormat){
            // It's rare this _won't_ be jpg (or default to), but unless it's explicity declared on the inline version, we will need it
            needsFetching = true;
        }
        if(!imageService.sizes){
            // we can't tell what sizes are available
            // but we could mix in the thumbnails...
            needsFetching = true;
        }
        // .. etc
        // but now we need to consider what we're actually trying to draw, and whether we have enough to draw it
        // or whether there could always be a surprise waiting in the real info.json - like a
    }

    if($("region").value != "full"){
        alert("regions coming in a bit");
        return;
    }

    // OK...
    // how big an image do we actually need?
    // In this demo (but not in non-simple CP composition scenarios) this is the real pixels occupied by CP    
    const realPxWidth = getComputedStyle(currentCanvas.element).width * window.devicePixelRatio;
    const realPxHeight = getComputedStyle(currentCanvas.element).height * window.devicePixelRatio;

    // https://digirati.slack.com/archives/D0E15T142/p1642421467050000
    const fs = IIIFImageApi.getFixedSizesFromService(imageService);
    console.log(fs);
    

    if($("mode").value == "static"){
        if($("region") == "full"){

        } else {
            // if the region is not full, we can zoom in and fill more of the viewport
        }

    } else {
        alert("zoom later!")
    }
}

function setSingleImage(src){
    // For initial image selection algorithm we are assuming that the 
    // image targets the whole canvas. Therefore, _for now_, we won't 
    // place the image on the canvas at a particular point, we will just 
    // fill the canvas with the image.
    // later, some of the placeCanvas scaling logic can be used here.
    // Same logic to place the image on the canvas, as to place the canvas on CP
    const img = new Image();
    currentCanvas.element.append(img);    
    img.onload = function() {
        img.style.width = getComputedStyle(currentCanvas.element).width;
        img.style.height = getComputedStyle(currentCanvas.element).height;
    }
    img.src = src;
}