// TODO
// specify a specific order for the props when enumerating them so that they are better logically grouped for visual purposes
// breadcrumb trail, with working links

const shell = {
    vault: new IIIFVault.globalVault(),
    resource: null
};
shell.thumbHelper = IIIFVaultHelpers.createThumbnailHelper(shell.vault);
const app = {
    displayMode: null,
    manifest: null, // our "app" is a manifest editor
    resourceEditor: null,
    canvas: null,
    selectedResource: null, // may be more specific than canvas
    selectedProperty: null, // may be more specific than canvas
    activeShortcuts: [],
    outlineRendered: false,    // these three only work for a static app - no editing!
    stripRendered: false,
    gridRendered: false
};

for(btn of document.getElementsByClassName("btn-mode")){
    btn.addEventListener("change", e => {
        renderApp();    
    });
}

document.getElementById("loadManifest").addEventListener("click", e => loadManifest(e));
let includeEmpty = false;
let useModelColours = true; // false if checkbox included

let manifestUri = "https://iiif.wellcomecollection.org/presentation/b28799495"
let qs = /iiif-content=(.*)/g.exec(window.location.search);
if (qs && qs[1]) {
    manifestUri = qs[1];
} else {
    qs = /manifest=(.*)/g.exec(window.location.search);
    if (qs && qs[1]) {
        manifestUri = qs[1];
    }
}
document.getElementById("manifestUri").value = manifestUri;

loadManifest();

async function loadManifest(e) {
    if (e) {
        e.preventDefault();
    }
    const manifestUri = document.getElementById("manifestUri").value;
    if (manifestUri) {
        shell.resource = await shell.vault.loadManifest(manifestUri);
        if (shell.resource) {
            includeEmpty = document.getElementById("includeEmpty").checked;
            // useModelColours = document.getElementById("useModelColours").checked;
            renderApp();
            document.getElementById("resourceLabel").innerText = IIIFVaultHelpers.getValue(shell.resource.label);
        }
    }
}

function showId(id){
    document.getElementById(id).style.display = "";
}
function hideId(id){
    document.getElementById(id).style.display = "none";
}
function setColClass(id, className){
    const el = document.getElementById(id);
    for(cls of el.classList){
        if(cls.indexOf("col-") == 0){
            el.classList.remove(cls);
        }
    }
    el.classList.add(className);
}

function renderApp(){

    renderOutline(shell.resource);     
    const mode = document.getElementById("topForm").elements["btnMode"].value;
    console.log(mode);
    if(mode != app.displayMode){
        hideId("treeContainer");
        hideId("slidestrip");
        hideId("gridview");
        hideId("canvasContainer");
        // resource Editor is ALWAYS visible
        // does changing render moder change the editor? sometimes.

        // These probably wouldn't re-render when changing modes... just show / hide?
        switch (mode) {
            case "manifest":        
                setColClass("gridview", "col-9");
                setColClass("resourceEditor", "col-3");        
                showId("gridview");
                renderGrid(shell.resource);    
                break;

            case "strip":    
                setColClass("slidestrip", "col-1");
                setColClass("canvasContainer", "col-8");    
                setColClass("resourceEditor", "col-3");                     
                showId("slidestrip");
                showId("canvasContainer");
                renderStrip(shell.resource);  
                break;

            case "outline":
                setColClass("treeContainer", "col-3");
                setColClass("canvasContainer", "col-6");    
                setColClass("resourceEditor", "col-3");  
                showId("treeContainer");
                showId("canvasContainer");  
                renderOutline(shell.resource);        
                break;

            case "noNav":
                setColClass("canvasContainer", "col-9");    
                setColClass("resourceEditor", "col-3");  
                showId("canvasContainer");                
                break;
        
            default:
                console.log("Not a mode!");
        }   

    }
}

async function drawThumbs(container, manifest){
    container.innerHTML = "";
    for(const canvas of shell.vault.get(manifest.items)){              
        const label = IIIFVaultHelpers.getValue(canvas.label);
        const cvThumb = await shell.thumbHelper.getBestThumbnailAtSize(canvas, {maxWidth:100, maxHeight:200});
        const thumbContainer = document.createElement("div");
        thumbContainer.className = "tc";
        thumbContainer.appendChild(document.createTextNode(label));        
        thumbContainer.appendChild(document.createElement("br"));
        const thumbImg = document.createElement("img");
        thumbContainer.appendChild(thumbImg);
        thumbImg.setAttribute("data-id", canvas.id);
        thumbImg.src = cvThumb.best.id;
        thumbImg.addEventListener("click", e => selectCanvas(canvas.id, false)); 
        container.appendChild(thumbContainer);
    }
}

async function renderGrid(manifest){  
    if(!app.gridRendered){
        const gridContainer = document.getElementById("gridview");
        drawThumbs(gridContainer, manifest);
    }  
    app.gridRendered = true;
}

async function renderStrip(manifest){
    if(!app.stripRendered){
        const stripContainer = document.getElementById("slidestrip");
        drawThumbs(stripContainer, manifest);
    }
    app.stripRendered = true;
}

function renderOutline(manifest) {
    if(!app.outlineRendered){
        const container = document.getElementById("treeContainer");
        container.innerHTML = "";
        renderResource(manifest, container);
        const manifestUL = container.firstElementChild;
        manifestUL.style.display = "block";
        for (li of manifestUL.children) {
            li.style.display = "block";
        }
        const btn = manifestUL.firstElementChild.firstElementChild
        btn.innerText = "-";
    }
    app.outlineRendered = true;
}

function renderResource(iiifResource, parent) {
    if (!iiifResource) return;
    // A little wrinkle for older version service inclusion, e.g., ImageService2
    const resourceId = iiifResource.id || iiifResource["@id"];
    const resourceType = iiifResource.type || iiifResource["@type"];
    const ul = document.createElement("ul");
    ul.className = "list-group";
    ul.setAttribute("data-iiif-id", resourceId);
    let headerListItem = null;
    if (resourceType) {
        ul.setAttribute("data-iiif-type", resourceType);
        headerListItem = makeHeaderListItem(iiifResource);
        ul.appendChild(headerListItem);
        if (useModelColours) {
            headerListItem.className += " resource-colour-" + resourceType;
        }
    }
    parent.appendChild(ul);
    iiifResource = shell.vault.get(iiifResource);
    for (property in iiifResource) {
        if (
            property == "id" ||
            property == "type" ||
            property == "@id" ||       // for ImageService2 etc
            property == "@type" ||
            property == "@context") {
            continue;
        }
        const value = iiifResource[property];
        const isArray = value && Array.isArray(value);
        if (!includeEmpty && (!value || isArray && value.length == 0)) {
            continue;
        }
        const li = makeListItem(property);
        ul.appendChild(li);
        if (isArray) {
            li.appendChild(document.createTextNode(" "));
            li.appendChild(getCountBadge(value.length));
            if (value.length > 0) {
                let ula = null;
                for (member of value) {
                    if (member.type || member["@type"]) {
                        if (ula == null) {
                            prependChevron(li);
                            ula = document.createElement("ul");
                            ula.className = "list-group iiif-array";
                            li.appendChild(ula);
                        }
                        const lia = makeListItem();
                        ula.appendChild(lia);
                        renderResource(member, lia);
                    } else {
                        console.log("b: " + value);
                    }
                }
            }
        } else if (value && typeof value === "object") {
            if (value.id) {
                li.setAttribute("data-iiif-id", value.id);
                li.className += " iiif-resource"
            }
            if (property === "label") {
                const labelEl = document.createElement("i");
                labelEl.innerHTML = "&nbsp; | &nbsp;" + truncate(getLabel(iiifResource));
                headerListItem.appendChild(labelEl);
            } else {
                prependChevron(li);
                renderResource(value, li);
            }
        } else {
            console.log("a: " + value);
        }
    }
}

function prependChevron(li) {
    // this list needs a chevron                       
    const btn = document.createElement("button");
    btn.innerText = ">"; // "▶";
    btn.addEventListener("click", toggleList);
    li.prepend(btn);
}


function toggleList(e, element) {
    let toggle = this || element;
    let ul = toggle;
    while (ul && ul.nodeName != "UL") {
        ul = ul.nextElementSibling;
    }
    if (toggle.innerText == "-") {
        if (ul) {
            closeAll(ul);
        } else {
            let ul = toggle.parentElement.parentElement;
            for (li of ul.children) {
                if (!li.classList.contains("resource-header")) {
                    li.style.display = "none";
                }
            }
        }
        toggle.innerText = ">";
    } else {
        if (ul) {
            ul.style.display = "block";
            if (ul.classList.contains("iiif-array")) {
                for (li of ul.children) {
                    li.style.display = "block";
                    if (li.children[0].getAttribute("data-iiif-type")) {
                        li.children[0].style.display = "block"; // the resource UL
                        li.children[0].children[0].style.display = "block"; // the first LI
                    }
                }
            }
        } else {
            let ul = toggle.parentElement.parentElement;
            for (li of ul.children) {
                li.style.display = "block";
            }
        }
        toggle.innerText = "-";
    }
}

function closeAll(ul) {
    ul.style.display == "none";
    for (li of ul.children) {
        li.style.display = "none";
        for (el of li.children) {
            if (el.nodeName == "UL") {
                closeAll(el);
            }
            if (el.nodeName == "BUTTON") {
                el.innerText = ">";
            }
        }
    }
}

function makeListItem(propertyName) {
    const li = document.createElement("li");
    li.className = "list-group-item";
    if (propertyName) {
        li.setAttribute("data-iiif-property", propertyName);
        li.addEventListener("click", propertyClick);
        const lbl = document.createTextNode(propertyName);
        li.appendChild(lbl);
    }
    return li;
}

function makeHeaderListItem(iiifResource) {
    const li = document.createElement("li");
    li.className = "list-group-item active resource-header";
    li.setAttribute("data-iiif-id", iiifResource.id);
    li.setAttribute("data-iiif-type", iiifResource.type || iiifResource["@type"]);
    li.addEventListener("click", headerClick);
    prependChevron(li);
    const lbl = document.createTextNode(" " + (iiifResource.type || iiifResource["@type"]));
    li.appendChild(lbl);
    return li;
}

function getCountBadge(count) {
    const badge = document.createElement("span");
    badge.className = "badge bg-primary rounded-pill";
    badge.innerText = count;
    return badge;
}

// Extract a string from a language map in an appropriate language.
function getLabel(entity) {
    return entity.label ? IIIFVaultHelpers.getValue(entity.label) : "";
}

function truncate(s) {
    if (s && s.length > 35) {
        return s.substring(0, 32) + "...";
    }
    return s;
}


function selectCanvas(canvasId, fromOutline){
    const cp = document.getElementById("cp");
    cp.setCanvas(canvasId);
    const ref = { id: canvasId, type:"Canvas"};
    app.canvas = ref;
    app.selectedResource = ref;
    if(!fromOutline){
        // open the items list on Manifest, if not already
        const tree = document.getElementById("treeContainer");
        for(const li of tree.children[0].children){
            if(li.getAttribute("data-iiif-property") == "items"){
                // this is gross
                const button = li.getElementsByTagName("button")[0];
                if(button.innerText == ">"){
                    button.click();
                }
                break;
            }
        }
        let canvasHeader = null;
        for(cvUl of document.getElementsByTagName("ul")){
            if(cvUl.getAttribute("data-iiif-id") == canvasId){
                canvasHeader = cvUl.children[0];
                break;
            }
        }
        if(canvasHeader){
            // let treeEl = canvasHeader;
            // while(true){
            //     treeEl.style.display = "block";
            //     treeEl = treeEl.parentElement;
            //     if(treeEl.tagName != "UL" && treeEl.tagName == "LI"){
            //         break;
            //     } 
            // }
            displayResourceInternal(shell.vault.get(ref), canvasHeader)
        }
    }
    updateResourceEditor(fromOutline);
}

function updateResourceEditor(fromOutline){
    const temp = document.getElementById("resourceTempText");
    temp.innerHTML = "Resource Editor:<br/><span>" + app.selectedResource + "</span>";
}


function displayProperty(prop, element){
    app.selectedProperty = prop;
    displayResourceInternal(prop, element);
}


function displayResource(resource, element){
    app.selectedResource = resource;
    displayResourceInternal(resource, element);
}

function displayResourceInternal(resource, element) {
    // canvas selection in strip or grid updates the outline tree
    // then update the breadcrumb after this.
    // const data = document.getElementById("json");
    // data.innerHTML = JSON.stringify(resource, null, 2);
    // const offset = element.getBoundingClientRect().top + document.documentElement.scrollTop;
    // data.style.marginTop = offset - 133 + "px";
    let highlightEl = element;
    let highlightClass = "list-group-item-primary";
    document.querySelectorAll("." + highlightClass).forEach(li => li.classList.remove(highlightClass));
    document.querySelectorAll(".bordered").forEach(li => li.classList.remove("bordered"));
    if (element.classList.contains("resource-header")) {
        highlightEl = element.parentElement;
        highlightClass = "bordered";
    }
    highlightEl.classList.add(highlightClass);

    // make crumbs
    const breadcrumbs = document.getElementById("breadcrumbs");
    breadcrumbs.innerHTML = "";

    crumbSource = element;
    prevElement = null;
    while(crumbSource.id != "treeContainer"){
        if(crumbSource.tagName == "LI"){
            addBreadcrumb(crumbSource);
        }
        if(crumbSource.tagName == "UL"){
            if(crumbSource.children.length > 0){
                const header = crumbSource.children[0];
                const iiifType = header.getAttribute("data-iiif-type");
                if(header != prevElement && iiifType){
                    addBreadcrumb(header, iiifType);
                }
            }
        }
        prevElement = crumbSource;
        crumbSource = crumbSource.parentElement;
    }    
}

function addBreadcrumb(treeElement, iiifType){
    const breadcrumbs = document.getElementById("breadcrumbs");
    const text = getTextNodes(treeElement);
    if(!text) return;
    const li = document.createElement("li");
    li.className = "breadcrumb-item";
    li.innerText = text;
    if(!breadcrumbs.innerHTML){
        li.classList.add("active");
    }
    if(iiifType){
        li.classList.add("resource-colour-" + iiifType);
    }
    breadcrumbs.prepend(li);
}

function getTextNodes(element){
    let str = "";
    for(const child of element.childNodes){
        if(child.nodeType == Node.TEXT_NODE){
            str += child.nodeValue;
        }
        // if(child.tagName == "I"){
        //     str += child.innerText;
        // }
    }
    return str;
}


function headerClick(e) {
    e.stopPropagation();
    let obj = getTypedResourceFromElement(this);
    console.log("Displaying resource of type " + obj.type);
    if (Object.keys(obj).length == 2) {
        console.log("WARNING: This object only has two keys!");
        console.log(obj);
        obj = getObjectFromArrayViaParent(this, obj);
    }
    displayResource(obj, this);
    if(obj.type == "Canvas"){
        selectCanvas(obj.id, true);
    }
}

function propertyClick(e) {
    e.stopPropagation();
    const obj = getTypedResourceFromElement(this.parentElement);
    const propertyName = this.getAttribute("data-iiif-property");
    console.log("Displaying " + obj.type + "::" + propertyName);
    let prop = obj[propertyName];
    if (typeof prop === "undefined") {
        // We got here because a property that was traversed 
        // when building the tree appears to be missing
        // from the object when recovered using 
        // vault.get(ref); 
        console.log("WARNING: Could not find property '" + propertyName + "' of object:");
        console.log(obj);
        const reAcquiredObj = getObjectFromArrayViaParent(this.parentElement, obj);
        prop = reAcquiredObj[propertyName];
    }
    displayProperty(prop, this);
}

function getTypedResourceFromElement(element) {
    // Walk up HTML tree until we find a header element
    let type = null;
    let id = null;
    do {
        type = element.getAttribute("data-iiif-type");
        id = element.getAttribute("data-iiif-id");
        element = element.parentElement;
    } while (element && !type)
    if (id && type) {
        return shell.vault.get({ id: id, type: type });
    }
}

// This should not be needed
function getObjectFromArrayViaParent(element, objRef) {
    // Ideally this NEVER happens - and Vault has helpers to stop it.
    // However we can mitigate it for the purposes of the tree demo by
    // trying to go up further, obtaining the parent resource and walking back down

    // I think this happens in arrays
    // go up to the array property and come back down to this one.
    let prevElement = null;
    do {
        prevElement = element;
        element = element.parentElement;
    } while (!element.classList.contains("iiif-array"));
    // `element` is now the array UL, prevElement is the LI for the selected item
    const propertyName = element.parentElement.getAttribute("data-iiif-property");
    const objWithProperty = getTypedResourceFromElement(element);
    const index = Array.prototype.indexOf.call(element.children, prevElement);
    return objWithProperty[propertyName][index];


    // The other way is to re-find the object in the array by its ID.
    // But what if two entries in the array had the same ID, but were not identical in the orginal serialisation?
    // This is probaly rare, and bad anyway, but I'd find the first of these.
    // However Vault might be doing this internally too.

}

function getDisplayMode(){

}
