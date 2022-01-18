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
    if(isNaN(intVal)) intVal = 0;
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


$("sourceSelect").addEventListener('change', handleSourceChange);

async function handleSourceChange(e) {
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
        await processSource();
    }
}

$("go").addEventListener('click', processSource);

for(const dimText of document.querySelectorAll(".dimension")){
    dimText.addEventListener('change', processSource);
}

for(const flag of document.querySelectorAll(".flag")){
    flag.addEventListener('change', processSource);
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

async function processSource(){
    console.log("=========== Will try to process source")
    const textBox = $("sourceDisplay");
    textBox.style.backgroundColor = "#fff";
    clearCP(); 
    currentCanvas.width = asInt("canvasWidth");
    currentCanvas.height = asInt("canvasHeight");        
    placeCanvas();
    try {
        if(textBox.value.trim()){
            currentSource = JSON.parse(textBox.value);   
            await applyStrategy();
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

async function applyStrategy(){    
    // async because it might have to fetch the full service
    console.log("Applying image selection strategy")
    // 1. place the canvas in CP

    if(typeof currentSource === "string"){
        // in use, CP will have obtained this from a Canvas, so CP already knows whether this string
        // is an image service endpoint, or just a static image resource. In this demo, it's always
        // a static image.
        setSingleImage(currentSource);
        return;
    }

    let imageService = currentSource;
    // This is shorthand, in the context of this demo for dealing with a partial image service
    // such as you might find in a manifest
    if("dctypes:Image" == currentSource["@type"] || "Image" == currentSource["type"])
    {
        // forget any other services for now, or auth, etc
        imageService = Array.isArray(currentSource.service) ? currentSource.service[0] : currentSource.service;
        imageService.partial = true; // log this here for now
    }

    if(!imageService.id){
        imageService.id = imageService["@id"];
    }

    // #### Canvas Panel tweaks and dials you can adjust ####

    // The size at which we switch to asking for advertised tiles, even if we could ask for an arbitrary region.
    // If a `size` is advertised larger than this, we can still ask for it, as long as it doesn't exceed maxWidth
    const tileThreshold = asInt("tileThreshold");

    // The maxWidth supplied by the image service. (if maxHeight or maxArea supplied, we can compute this)
    // This is also a setting CP can choose set itself, and enforce, even if the service permits something
    // higher. e.g., to *avoid requesting a very large image that incurs too much processing overhead*.
    // i.e., CP may choose a lower maxXXXX than the image server permits, for its own performnce reasons
    // TODO - extend for maxHeight, and maxArea
    let maxWidth = asInt("maxWidth");
    if(!maxWidth) maxWidth = imageService.width;
    let maxHeight = asInt("maxHeight");
    if(!maxHeight) maxHeight = imageService.height;
    // TODO: also check for maxArea and synthesise if not present

    // If there's a thumbnail service on the canvas, whether its sizes may be used as part of the
    // legacy image pyramid to choose from (CP must prefer sizes from the info.json, though)
    // This can be used to defer loading of the info.json if CP (vault) has the canvas with 
    // thumbs on it but has not yet loaded the info.json
    const includeThumbnailSizes = $("includeThumbnailSizes").checked;

    // clients should generally not do this unless they are in control of CP's size on the page AND the image services
    // Otherwise it will lead to many different large image requests from different users and defeat caching
    const preferExactInitialImage = $("preferExactInitialImage").checked;

    // Will be taken from the info.json but defaults to "jpg"
    // can also be set by the developer, e.g., set to png to consume known line art.
    const preferredFormat = $("preferredFormat").value;





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

        // when is this actually not true!
        if(needsFetching){
            const response = await fetch(imageService.id);
            imageService = await response.json();
            if(!imageService.id){
                imageService.id = imageService["@id"];
            }
        }
    }

    // Augment any advertised sizes with an additional list - again to assist caching.
    // Unlike the sizes for an individual image (which are always known width and height),
    // this list is expressed as an array of iiif /size/ parameters.
    // e.g., Wellcome might have "880," in this list.
    // format is JSON: '["1200,1200!", "880,"]';
    let virtualSizePatterns = [];
    try {
        virtualSizePatterns = JSON.parse($("virtualSizes").value);
    } catch {} finally {        
        if(!virtualSizePatterns) virtualSizePatterns = [];
    }
    const virtualSizes = virtualSizePatterns.map(pattern => {
        // TODO: This needs to "resolve" to IIIF pattern 
        // (e.g., "880," => {width:880, height:1111} 
        // (compute the specific size from imageService)
        return {width: 0, height: 0}; // obviously a useless size for now!
    });

    // TODO: merge virtual Sizes into imageService.sizes
    
    if(includeThumbnailSizes){
        if(currentSource.thumbNail){
            // TODO: merge thumbnail sizes (if any) to imageService.sizes
            // Need to make a note of the format(s) the thumbnails are in
            // e.g., if thumbnail is only jpeg and a size not in the main service sizes,
            // then it's not available as png (unlike)
        }
    }

    if($("region").value != "full"){
        alert("regions coming in a bit");
        return;
    }

    // OK...
    // how big an image do we actually need?
    // In this demo (but not in non-simple CP composition scenarios) this is the real pixels occupied by CP    
    const realPxWidth = currentCanvas.element.clientWidth * window.devicePixelRatio;
    const realPxHeight = currentCanvas.element.clientHeight * window.devicePixelRatio;

    // https://digirati.slack.com/archives/D0E15T142/p1642421467050000
    // This will now include any additional virtual sizes from attributes or settings
    // And will also include (if enabled) thumbnail sizes - but only if format matches preferredFormat
    const fixedSizes = IIIFImageApi.getFixedSizesFromService(imageService);
    // we need one >= than the viewport
    // make sure they are in ascending order
    fixedSizes.sort((s1, s2) => s1.width - s2.width);
    let fixedSize = null;
    for(const size of fixedSizes){
        if((!maxWidth || size.width <= maxWidth) && (!maxHeight || size.height <= maxHeight)){
            // TODO: maxArea
            // Doesn't exceed the max, but is it big enough?
            if(size.width >= realPxWidth && size.height >= realPxHeight){
                fixedSize = size;
                // Here we would need to consider if the fixed size is available in the preferred format
                break;
            }
        }
    }
    if(fixedSize){
        // we are able to fill our viewport with one of the gathered sizes, 
        // and it doesn't exceed maxXXX (which we might have imposed ourselves at CP end)
        // so use this image
        // There's a better way to resolve an image from a size!
        console.log("found a fixed size we can use");
        setSingleImage(fixedSize.id + "/full/" + whForm(imageService, fixedSize.width, fixedSize.height) + "/0/default." + preferredFormat);
        return;
    }

    console.log("no fixed size was big enough, look at other options")

    
    if(realPxWidth <= maxWidth && realPxHeight <= maxHeight && IIIFImageApi.supportsCustomSizes(imageService)){
        console.log("This image service might support a single image request");
        if(realPxWidth <= tileThreshold && realPxHeight <= tileThreshold){
            console.log("the required size is also below the tiling threshold");
            setSingleImage(imageService.id + "/full/" + whForm(imageService, realPxWidth, realPxHeight) + "/0/default." + preferredFormat); 
            return;
        }
        if(preferExactInitialImage){            
            console.log("We are forcing a single image request, if supported (and below maxWidth)");
            setSingleImage(imageService.id  + "/full/" + whForm(imageService, realPxWidth, realPxHeight) + "/0/default." + preferredFormat); 
            return;
        }
    }

    // tileThreshold only comes in if there is no fixed size to use
    if(preferExactInitialImage && IIIFImageApi.supportsCustomSizes(imageService)){
        if(realPxWidth <= maxWidth && realPxHeight <= maxHeight){
            if(realPxWidth <= tileThreshold && realPxHeight <= tileThreshold){
                console.log("We are able to request the full image");
                setSingleImage(imageService.id + "/full/" + whForm(imageService, realPxWidth, realPxHeight) + "/0/default." + preferredFormat);     
                return;           
            }
        }
    }

    if(imageService.tiles){
        console.log("We are going to use tiles");
        cp.innerHTML = "<p>Using the image service tiles!!!</p>"
        return;
    }


    console.log("we have not been able to find an image yet!");
    if(fixedSizes && fixedSizes.length > 0){
        console.log("We'll just use the largest fixed size");
        const size = fixedSizes[fixedSizes.length - 1];
        setSingleImage(imageService.id + "/full/" + whForm(imageService, size.width, size.height) + "/0/default." + preferredFormat);    
        return; 
    }

    console.log("No way of providing the image!")
    textBox.style.backgroundColor = "#f7979f";
    cp.innerHTML = "<p>Can't find anything to make an image!</p>";
    

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
    console.log("requesting image " + src);
    img.src = src;
}

function whForm(imageService, width, height){
    if(imageService["@id"]){
        return width + ",";
    }
    return width + "," + height;
}