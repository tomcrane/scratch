function $(s) {
    if (s.startsWith("#")) {
        return document.getElementById(s.substring(1));
    } else {
        return document.querySelectorAll(s);
    }
}

const cp = $("#cp");
const vault = cp.vault;
const thumbHelper = IIIFVaultHelpers.createThumbnailHelper(cp.vault);
const collectionPath = [];
let currentManifestId = null;
let currentCanvasId = null;
let currentContentStateCapture = null;


clear();
setRecents();

$("#mediaUrl").addEventListener("change", loadIIIF);
$("#refreshUrl").addEventListener("click", loadIIIF);

function clear() {
    $("#treeHolder").style.display = "none";
    $("#thumbnails").style.display = "none";
    $("#canvas").style.display = "none";
    $("#selection").innerText = "";
}

function truncate(s) {
    if (s && s.length > 55) {
        return s.substring(0, 52) + "...";
    }
    return s;
}

function setRecents() {
    const recents = $("#recentResources");
    recents.innerHTML = "";
    const header = document.createElement("li");
    header.innerHTML = '<h6 class="dropdown-header">Recent manifests and collections</h6>';
    recents.append(header);
    for (resource of recentStarts) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.className = "dropdown-item";
        a.href = resource.id;
        a.innerHTML = getLabelledIcon(resource, resource.label.en[0]); // this is not normally safe!
        a.addEventListener("click", function(e) {
            e.preventDefault();
            $("#mediaUrl").value = this.href;
            loadIIIF();
        });
        li.append(a);
        recents.append(li);
    }
}

function getLabelledIcon(resource, label) {
    return '<i class="' + getIconClass(resource) + '"></i> ' + truncate(label);
}

function getIconClass(resource) {
    return resource.type == "Collection" ? "bi bi-folder" : "bi bi-file-earmark-richtext";
}

async function loadIIIF() {
    let url = $("#mediaUrl").value.trim();
    clear();
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
        // hack to fix thumbnail bug - not a very safe hack but anyway...
        let thumbUrl = cvThumb.best.id;
        thumbUrl = thumbUrl.replace("/99,", "/100,");
        thumbUrl = thumbUrl.replace(",99/", ",100/");
        img.src = thumbUrl;
        const canvasId = canvas.id;
        img.addEventListener("click", () => showCanvasById(canvasId));
        thumbDiv.append(img);
    }
}

async function startTree(collection) {
    const top = $("#treeHolder");
    top.innerHTML = "";
    top.style.display = "block";
    await renderInto(top, collection);
}

function getLabel(res1, res2) {
    return IIIFVaultHelpers.getValue(res1.label) || IIIFVaultHelpers.getValue(res2.label);
}

async function renderInto(element, collection) {
    const h4 = document.createElement("h4");
    const vColl = await vault.load(collection);
    h4.innerText = getLabel(collection, vColl);
    element.append(h4);
    const ul = document.createElement("ul");
    for (item of vColl.items) {
        const vItem = vault.get(item);
        const label = getLabel(vItem, item);
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = item.id;
        a.setAttribute("data-type", item.type);
        a.innerHTML = getLabelledIcon(item, label)
        li.append(a);
        ul.append(li);
        a.addEventListener("click", async function(e) {
            e.preventDefault();
            if (this.getAttribute("data-type") == "Manifest") {
                const manifest = await vault.load(this.href);
                setManifest(manifest);
            } else if (this.getAttribute("data-type") == "Collection") {
                if (this.getAttribute("data-rendered")) {
                    // already rendered
                } else {
                    const lip = this.parentElement;
                    renderInto(lip, vault.get(this.href));
                    this.setAttribute("data-rendered", "true");
                }
            }
        });
    }
    element.append(ul);

}

function showCanvasById(canvasId) {
    $("#canvas").style.display = "block";
    cp.setCanvas(canvasId);
    currentCanvasId = canvasId;
}