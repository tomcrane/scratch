function $(s) {
    if (s.startsWith("#")) {
        return document.getElementById(s.substring(1));
    } else if (s.startsWith(".")) {
        return document.getElementsByClassName(s.substring(1));
    } else {
        return document.getElementsByTagName(s);
    }
}

const cp = $("#cp");
const vault = cp.vault;
const thumbHelper = IIIFVaultHelpers.createThumbnailHelper(cp.vault);
const collectionPath = [];
let currentManifestId = null;
let currentCanvasId = null;
let currentContentStateCapture = null;

$("#mediaUrl").addEventListener("change", loadIIIF);
$("#refreshUrl").addEventListener("click", loadIIIF);

async function loadIIIF() {
    let url = $("#mediaUrl").value.trim();
    $("#treeHolder").style.display = "none";
    $("#thumbnails").style.display = "none";
    $("#canvas").style.display = "none";
    $("#selection").innerText = "";
    if (url) {
        const iiifResource = await vault.load(url);
        if (iiifResource.type == "Manifest") {
            setManifest(iiifResource);
        } else if (iiifResource.type == "Collection") {
            startTree(iiifResource);
        } else if (iiifResource.type == "Canvas") {
            showCanvasById(iiifResource.id);
        }
    }
}

async function setManifest(manifest) {
    currentManifestId = manifest.id;
    const thumbDiv = $("#thumbnails");
    thumbDiv.style.display = "block";
    thumbDiv.innerHTML = "";
    for (canvasRef of manifest.items) {
        const canvas = vault.get(canvasRef);
        const img = document.createElement("img");
        const cvThumb = await thumbHelper.getBestThumbnailAtSize(canvas, { maxWidth: 100 });
        img.src = cvThumb.best.id;
        const canvasId = canvas.id;
        img.addEventListener("click", () => showCanvasById(canvasId));
        thumbDiv.append(img);
    }
}

function startTree(collection) {

}


function showCanvasById(canvasId) {
    $("#canvas").style.display = "block";
    cp.setCanvas(canvasId);
    currentCanvasId = canvasId;
}