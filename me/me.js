// TODO
// specify a specific order for the props when enumerating them so that they are better logically grouped for visual purposes
// breadcrumb trail, with working links

// import * as IIIFVault from '@iiif/vault';
// import * as IIIFVaultHelpers from '@iiif/vault-helpers';

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
    selectedResourceRef: null, // may be more specific than canvas
    selectedPropertyName: null, // may be more specific than canvas
    selectedPropertyValue: null, // may be more specific than canvas
    activeShortcuts: [],
    outlineRendered: false, // these three only work for a static app - no editing!
    stripRendered: false,
    gridRendered: false,
    manifestTreeElement: null
};

function $(s) {
    if (s.startsWith("#")) {
        return document.getElementById(s.substring(1));
    } else if (s.startsWith(".")) {
        return document.getElementsByClassName(s.substring(1));
    } else {
        return document.getElementsByTagName(s);
    }
}

function $$(s) { return $("#" + s) };

for (let btn of $(".btn-mode")) {
    btn.addEventListener("change", e => {
        renderApp();
    });
}

$("#loadManifest").addEventListener("click", e => loadManifest(e));
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
$("#manifestUri").value = manifestUri;

loadManifest();

async function loadManifest(e) {
    if (e) {
        e.preventDefault();
    }
    const manifestUri = $("#manifestUri").value;
    if (manifestUri) {
        shell.resource = await shell.vault.loadManifest(manifestUri);
        if (shell.resource) {
            includeEmpty = $("#includeEmpty").checked;
            // useModelColours = $("#useModelColours").checked;
            app.selectedResourceRef = asRef(shell.resource);
            renderApp();
            activateResource(app.manifestTreeElement);
            $("#resourceLabel").innerText = IIIFVaultHelpers.getValue(shell.resource.label);
        }
    }
}

function showId(id) {
    $$(id).style.display = "";
}

function hideId(id) {
    $$(id).style.display = "none";
}

function setColClass(id, className) {
    const el = $$(id);
    for (let cls of el.classList) {
        if (cls.indexOf("col-") == 0) {
            el.classList.remove(cls);
        }
    }
    el.classList.add(className);
}

function renderApp() {

    // in the demo just draw all these up front
    renderGrid(shell.resource);
    renderOutline(shell.resource);
    renderStrip(shell.resource);
    const mode = $("#topForm").elements["btnMode"].value;
    //console.log(mode);
    if (mode != app.displayMode) {
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

async function drawThumbs(container, manifest) {
    container.innerHTML = "";
    for (const canvas of shell.vault.get(manifest.items)) {
        const label = IIIFVaultHelpers.getValue(canvas.label);
        const cvThumb = await shell.thumbHelper.getBestThumbnailAtSize(canvas, { maxWidth: 100, maxHeight: 200 });
        const thumbContainer = document.createElement("div");
        thumbContainer.className = "tc";
        thumbContainer.appendChild(document.createTextNode(label));
        thumbContainer.appendChild(document.createElement("br"));
        const thumbImg = document.createElement("img");
        thumbContainer.appendChild(thumbImg);
        thumbImg.setAttribute("data-iiif-id", canvas.id);
        thumbImg.src = cvThumb.best.id;
        thumbImg.addEventListener("click", e => selectCanvas(canvas.id, false));
        container.appendChild(thumbContainer);
    }
}

async function renderGrid(manifest) {
    if (!app.gridRendered) {
        const gridContainer = $("#gridview");
        drawThumbs(gridContainer, manifest);
    }
    app.gridRendered = true;
}

async function renderStrip(manifest) {
    if (!app.stripRendered) {
        const stripContainer = $("#slidestrip");
        drawThumbs(stripContainer, manifest);
    }
    app.stripRendered = true;
}

function renderOutline(manifest) {
    if (!app.outlineRendered) {
        const container = $("#treeContainer");
        container.innerHTML = "";
        renderResource(manifest, container);
        const manifestUL = container.firstElementChild;
        manifestUL.style.display = "block";
        for (let li of manifestUL.children) {
            if (!app.manifestTreeElement) {
                app.manifestTreeElement = li;
            }
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
    for (let property in iiifResource) {
        if (
            property == "id" ||
            property == "type" ||
            property == "@id" || // for ImageService2 etc
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
                for (let member of value) {
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
                        //console.log("b: " + value);
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
            //console.log("a: " + value);
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


function toggleList(e, element, force) {
    let toggle = element || this;
    let ul = toggle;
    while (ul && ul.nodeName != "UL") {
        ul = ul.nextElementSibling;
    }
    if (toggle.innerText == "-" && "open" != force) {
        if (ul) {
            closeAll(ul);
        } else {
            let ul = toggle.parentElement.parentElement;
            for (let li of ul.children) {
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
                for (let li of ul.children) {
                    li.style.display = "block";
                    if (li.children[0].getAttribute("data-iiif-type")) {
                        li.children[0].style.display = "block"; // the resource UL
                        li.children[0].children[0].style.display = "block"; // the first LI
                    }
                }
            }
        } else {
            let ul = toggle.parentElement.parentElement;
            for (let li of ul.children) {
                li.style.display = "block";
            }
        }
        toggle.innerText = "-";
    }
}

function closeAll(ul) {
    ul.style.display == "none";
    for (let li of ul.children) {
        li.style.display = "none";
        for (let el of li.children) {
            if (el.nodeName == "UL") {
                closeAll(el);
            }
            if (el.nodeName == "BUTTON") {
                el.innerText = ">";
            }
        }
    }
}

function* treeId() {
    var index = 0;
    while (true)
        yield "tn_" + index++;
}

const treeIdGenerator = treeId();

function makeListItem(propertyName) {
    const li = document.createElement("li");
    li.id = treeIdGenerator.next().value;
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
    li.id = treeIdGenerator.next().value;
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


function selectCanvas(canvasId, fromOutline) {
    const cp = $("#cp");
    cp.setCanvas(canvasId);
    const ref = { id: canvasId, type: "Canvas" };
    app.canvas = ref;
    app.selectedResourceRef = ref;
    app.selectedPropertyValue = null;
    app.selectedPropertyName = null;
    for (let thumbDiv of $(".tc")) {
        thumbDiv.classList.remove("selected-canvas");
        const thumbImg = thumbDiv.getElementsByTagName('img')[0];
        const id = thumbImg.getAttribute("data-iiif-id");
        if (id == canvasId) {
            thumbDiv.classList.add("selected-canvas");
            if ($$("canvasThumbnail")) {
                $$("canvasThumbnail").src = thumbImg.src;
                $$("canvasPaintingBody").src = thumbImg.src;
                $$("canvasPaintingTarget").src = thumbImg.src;
            }
        }
    }
    if (!fromOutline) {
        // need to update the outline tree to select this canvas, because the selection came from something else
        // TODO: general purpose select tree node from ID and open parents and scrollIntoView
        // open the items list on Manifest, if not already
        const tree = $("#treeContainer");
        app.canvas = ref;
        app.selectedResourceRef = ref;
        let canvasHeader = null;
        for (let cvUl of $("ul")) {
            if (cvUl.getAttribute("data-iiif-id") == canvasId) {
                canvasHeader = cvUl.children[0];
                break;
            }
        }
        if (canvasHeader) {
            displayResourceInternal(shell.vault.get(ref), canvasHeader)
        }
    }
}

function displayProperty(objectWithProperty, propertyName, propertyValue, element) {
    app.selectedPropertyName = propertyName;
    app.selectedPropertyValue = propertyValue;
    app.selectedResourceRef = asRef(objectWithProperty);
    displayResourceInternal(propertyValue, element);
}


function displayResource(resource, element) {
    app.selectedResourceRef = asRef(resource);
    app.selectedPropertyValue = null;
    displayResourceInternal(resource, element);
}

function asRef(resource) {
    return {
        id: resource.id,
        type: resource.type
    }
}

function displayResourceInternal(resource, element) {
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

    makeBreadcrumbs(element);
    updateResourceEditor();
}







/* Breadcrumbs and Path */

function makeBreadcrumbs(element) {
    const breadcrumbs = $("#breadcrumbs");
    breadcrumbs.innerHTML = "";
    app.path = [];
    let crumbSource = element;
    let prevElement = null;
    while (crumbSource.id != "treeContainer") {
        if (crumbSource.tagName == "LI") {
            addBreadcrumb(crumbSource);
        }
        if (crumbSource.tagName == "UL") {
            if (crumbSource.children.length > 0) {
                const header = crumbSource.children[0];
                const iiifType = header.getAttribute("data-iiif-type");
                if (header != prevElement && iiifType) {
                    addBreadcrumb(header, iiifType);
                }
            }
        }
        prevElement = crumbSource;
        crumbSource = crumbSource.parentElement;
    }
}

function addBreadcrumb(treeElement, iiifType) {
    const breadcrumbs = $("#breadcrumbs");
    const text = getTextNodes(treeElement);
    if (!text) return;
    const li = document.createElement("li");
    li.className = "breadcrumb-item";
    li.innerText = text;
    if (!breadcrumbs.innerHTML) {
        li.classList.add("active");
    }
    if (iiifType) {
        li.classList.add("resource-colour-" + iiifType);
    }
    li.setAttribute("data-tree-id", treeElement.id);
    li.addEventListener("click", handleBreadCrumbClick);
    breadcrumbs.prepend(li);
    const buttons = treeElement.getElementsByTagName("button");
    if (buttons && buttons[0]) {
        toggleList(null, buttons[0], "open");
    }
}

function handleBreadCrumbClick() {
    treeElement = $$(this.getAttribute("data-tree-id"));
    if (this.getAttribute("data-iiif-property")) {
        activateProperty(treeElement);
    } else {
        activateResource(treeElement);
    }
}

function getTextNodes(element) {
    let str = "";
    for (const child of element.childNodes) {
        if (child.nodeType == Node.TEXT_NODE) {
            str += child.nodeValue;
        }
        // if(child.tagName == "I"){
        //     str += child.innerText;
        // }
    }
    return str;
}

function getParentPropertyAndType(fromEnd) {
    const offset = fromEnd || 1;
    const breadcrumbs = $("#breadcrumbs");
    const propertyAndType = {
        propertyName: null,
        type: null,
        id: null,
        offset: offset,
        totalItems: breadcrumbs.children.length
    };
    for (let i = breadcrumbs.children.length - (1 + offset); i >= 0; i--) {
        const treeId = breadcrumbs.children[i].getAttribute("data-tree-id");
        const treeEl = $$(treeId);
        const prop = treeEl.getAttribute("data-iiif-property");
        if (prop) {
            propertyAndType.propertyName = prop;
        }
        const type = treeEl.getAttribute("data-iiif-type");
        const id = treeEl.getAttribute("data-iiif-id");
        if (type && propertyAndType.propertyName) {
            // we can't set the type until we have a property, because we want the type that has this property
            propertyAndType.type = type;
            propertyAndType.id = id;
        }
        if (propertyAndType.type && propertyAndType.propertyName) {
            return propertyAndType;
        }
    }
    return propertyAndType;
}









function updateResourceEditor() {
    // At this point, the tree is open and selected, the breadcrumb trail is updated.
    // canvas is highlighted in grid and strip.
    if (!app.selectedResourceRef) {
        return;
    }
    const vaultResource = shell.vault.get(app.selectedResourceRef)
        // TODO - will need to go up and down to get the best resource as in the tree
    const bestResource = vaultResource || app.selectedResourceRef;

    let bestComponent = tryGetBestComponent(bestResource.type, app.selectedPropertyName);
    if (bestComponent) {
        renderRhsComponent(bestComponent);
        $("#rhsHeader").innerText = bestComponent.getAttribute("resource-editor-title") || bestResource.type + " properties";
    }
}


function tryGetBestComponent(type, propertyName) {

    let bestComponent = null;
    let parentPropertyAndType = getParentPropertyAndType();
    if (type == "AnnotationPage" || type == "Agent") {
        // display within their parent type editor
        // AnnoPage depends on whether it's the .items property or the .annotation property.
        // Will this happen anyway?

        type = parentPropertyAndType.type;
        propertyName = parentPropertyAndType.propertyName;
    }
    let offset = 0;
    while (true) {
        for (let rhs of $(".rhs-component")) {
            if (rhs.getAttribute("data-resource") == type) {
                if (bestComponent == null) {
                    bestComponent = rhs; // default to the first one
                }
                const props = rhs.getAttribute("data-props").split(",");
                if (propertyName && props.includes(propertyName)) {
                    bestComponent = rhs; // refine to the one with the property, if we can
                    break;
                }
            }
        }
        if (bestComponent) break;
        if (offset >= parentPropertyAndType.totalItems) break;
        offset += 2;
        parentPropertyAndType = getParentPropertyAndType(offset);
        console.log(parentPropertyAndType);
        type = parentPropertyAndType.type;
        propertyName = parentPropertyAndType.propertyName;
    }
    return bestComponent;
}

function getOtherTab(type, tab) {
    let otherTab = null;
    for (let rhs of $(".rhs-component")) {
        if (rhs.getAttribute("data-resource") == type) {
            if (otherTab == null) {
                otherTab = rhs;
            }
            const tabs = rhs.getAttribute("data-tabs").split(",");
            if (tabs.includes("-" + tab)) {
                otherTab = rhs;
                break;
            }
        }
    }
    return otherTab;
}

function renderRhsComponent(rhsComponent) {
    const type = rhsComponent.getAttribute("data-resource");
    const componentRef = rhsComponent.getAttribute("data-component-ref");
    if (componentRef) {
        $("#resourceEditorInner").innerHTML = $$("data-component-" + componentRef).innerHTML;
        if (componentRef == "annotationpage") {
            if (type == "Canvas") {
                makeAnnoPagingUI();
            } else {
                alert("See annotations property on a canvas for demo");
            }
        }
    } else {
        $("#resourceEditorInner").innerHTML = rhsComponent.innerHTML;
    }
    setResourceEditorEventHandlers();
    const tabs = rhsComponent.getAttribute("data-tabs").split(",");
    const ulTabs = $("#resourceTabs");
    ulTabs.innerHTML = "";
    for (let tab of tabs) {
        const li = document.createElement("li");
        li.className = "nav-item";
        const a = document.createElement("a");
        li.append(a);
        a.className = "nav-link";
        if (tab.startsWith("-")) {
            a.classList.add("active");
            a.innerHTML = "<small>" + tab.substring(1) + "</small>";
        } else {
            a.innerHTML = "<small>" + tab + "</small>";
            const ttab = tab;
            a.addEventListener("click", () => {
                const clicked = getOtherTab(type, ttab);
                if (clicked) {
                    renderRhsComponent(clicked);
                }
            });
        }
        ulTabs.append(li);
    }
}

function makeAnnoPagingUI() {
    let idx = 0;
    const listEls = Array.from($$("annopageSwitch").children);
    window.annoPages = listEls.map(li => {
        const i = idx++;
        const link = li.children[0];
        link.addEventListener("click", () => showAnnoPage(i));
        return {
            index: i,
            html: link.getAttribute("data-source"),
            label: link.innerText,
            selected: false
        };
    });
    $$("annoPagePrevPage").addEventListener("click", () => cycleAnnoPage(-1));
    $$("annoPageNextPage").addEventListener("click", () => cycleAnnoPage(1));
    showAnnoPage(0);
}

function setResourceEditorEventHandlers() {
    const annoContainer = $$("hoistedAnnoContainer");
    for (let el of $(".annotation-full")) {
        const fullAnno = el;
        const miniAnno = el.previousElementSibling;
        fullAnno.style.display = "none";
        miniAnno.addEventListener("click", () => {
            // Hide the contents of the current resourceEditor panel
            $$("rhsHeader").style.display = "none";
            $$("resourceTabs").style.display = "none";
            $$("resourceEditorInner").style.display = "none";
            $$("resourceEditorExtra").style.display = "none";
            annoContainer.style.display = "block";
            fullAnno.style.display = "block";
            annoContainer.innerHTML = fullAnno.outerHTML;
            const backArrow = annoContainer.getElementsByTagName("h4")[0].getElementsByClassName("anno-back")[0];
            backArrow.addEventListener("click", () => {
                annoContainer.innerHTML = "";
                annoContainer.style.display = "none";
                $$("rhsHeader").style.display = "";
                $$("resourceTabs").style.display = "";
                $$("resourceEditorInner").style.display = "";
                $$("resourceEditorExtra").style.display = "";
                fullAnno.style.display = "none";
            });
            for (let el of $(".external-resource-mini")) {
                el.addEventListener("click", window.showResourceEditor);
            }
        });
    }
    for (let el of $(".external-resource-mini")) {
        el.addEventListener("click", window.showResourceEditor);
    }
    for (let el of $(".add-another-resource")) {
        el.addEventListener("click", window.showResourceEditor);
    }
    for (let el of $(".media-mini")) {
        el.addEventListener("click", window.showMediaModal);
    }
    const changeTarget = $$("changeTarget");
    if (changeTarget) {
        $$("canvasPaintingTargetXywh").style.display = "none";
        changeTarget.addEventListener("click", () => {
            $$("canvasPaintingTargetXywh").style.display = "block";
        });
    }
}

function showAnnoPage(idx) {
    for (let i = 0; i < window.annoPages.length; i++) {
        const annoPage = window.annoPages[i];
        if (i == idx) {
            fetch(annoPage.html)
                .then(resp => resp.text())
                .then(text => $$("annoPageContainer").innerHTML = text);
            annoPage.selected = true;
            $$("annoPageCurrent").value = annoPage.label;
            setTimeout(() => setupAnnoPage(annoPage.index), 500);
        } else {
            annoPage.selected = false;
        }
    }
}

function setupAnnoPage(idx) {
    setResourceEditorEventHandlers();
    if (app.canvas && app.selectedResourceRef && app.selectedResourceRef.type != "Manifest") {
        const canvas = shell.vault.get(app.canvas);
        if (canvas.annotations.length > 0 && canvas.annotations[0].id.startsWith("https://iiif.wellcomecollection.org")) {
            const annoPage = canvas.annotations[0];
            const label = IIIFVaultHelpers.getValue(annoPage.label); // This is empty!
            if (idx == 1) {
                // This is our fake internal annotation page
                // We'll make this work with Wellcome manifests for now
                let embedded = annoPage.items && !shell.vault.requestStatus(annoPage);
                if (!embedded) {
                    console.log("This needs to be loaded");
                    // As a resource external to the manifest, we load annotations specifically, from their id:
                    shell.vault.load(annoPage.id).then(loadedAnnoPage => {
                        const template = new String($$("textualBodyTemplate").innerHTML);
                        $$("textualBodyTemplate").style.display = "none";
                        const mediaAnnoPage = shell.vault.get(canvas.items[0]);
                        const mediaAnno = shell.vault.get(mediaAnnoPage.items[0]);
                        const mediaBody = shell.vault.get(mediaAnno.body[0]);
                        const imgServiceId = mediaBody.service[0].id || mediaBody.service[0]["@id"]; // AAARGG
                        for (let annoRef of loadedAnnoPage.items) {
                            const anno = shell.vault.get(annoRef);
                            let htmlAnno = template.replace("{anno-id}", anno.id);
                            const text = shell.vault.get(anno.body[0]).value;
                            htmlAnno = htmlAnno.replace("{text}", text);
                            htmlAnno = htmlAnno.replaceAll("{elidedText}", truncate(text));
                            htmlAnno = htmlAnno.replaceAll("{img-service}", imgServiceId);
                            // we are making a big assumption here!!!
                            const xywh = anno.target.split("=")[1].split(",");
                            htmlAnno = htmlAnno.replaceAll("{x}", xywh[0]);
                            htmlAnno = htmlAnno.replaceAll("{y}", xywh[1]);
                            htmlAnno = htmlAnno.replaceAll("{w}", xywh[2]);
                            htmlAnno = htmlAnno.replaceAll("{h}", xywh[3]);
                            const cardAnno = document.createElement("div");
                            cardAnno.className = "card";
                            cardAnno.classList.add("annotation");
                            cardAnno.innerHTML = htmlAnno;
                            $$("annoPageItems").append(cardAnno);
                        }
                    }).then(() => setResourceEditorEventHandlers());
                }

            } else if (idx == 2) {
                // This is our annotation as external resource
                $$("sampleExternalAnnoPageLabel").innerText = label;
                $$("sampleExternalAnnoPageLink").href = canvas.annotations[0].id;
                $$("sampleExternalAnnoPageLink").innerText = canvas.annotations[0].id;
            } else {
                const tbt = $$("textualBodyTemplate");
                if (tbt) tbt.style.display = "none";
            }
        }
    }

}

function cycleAnnoPage(move) {
    const current = window.annoPages.filter(ap => ap.selected)[0];
    let newIdx = current.index + move;
    if (newIdx < 0) newIdx = 0;
    if (newIdx >= window.annoPages.length) newIdx = window.annoPages.length - 1;
    showAnnoPage(newIdx);
}



function headerClick(e) {
    e.stopPropagation();
    activateResource(this);
}

function propertyClick(e) {
    e.stopPropagation();
    activateProperty(this);
}

function activateProperty(propertyTreeElement) {
    let objectWithProperty = getTypedResourceFromElement(propertyTreeElement.parentElement);
    const propertyName = propertyTreeElement.getAttribute("data-iiif-property");
    //console.log("Displaying " + objectWithProperty.type + "::" + propertyName);
    let propertyValue = objectWithProperty[propertyName];
    if (typeof propertyValue === "undefined") {
        // We got here because a property that was traversed 
        // when building the tree appears to be missing
        // from the object when recovered using 
        // vault.get(ref); 
        console.log("WARNING: Could not find property '" + propertyName + "' of object:");
        console.log(objectWithProperty);
        objectWithProperty = getObjectFromArrayViaParent(propertyTreeElement.parentElement, objectWithProperty);
        propertyValue = objectWithProperty[propertyName];
    }
    displayProperty(objectWithProperty, propertyName, propertyValue, propertyTreeElement);
}

function activateResource(resourceTreeElement) {
    let obj = getTypedResourceFromElement(resourceTreeElement);
    //console.log("Displaying resource of type " + obj.type);
    if (Object.keys(obj).length == 2) {
        console.log("WARNING: this object only has two keys!");
        console.log(obj);
        obj = getObjectFromArrayViaParent(resourceTreeElement, obj);
    }
    displayResource(obj, resourceTreeElement);
    if (obj.type == "Canvas") {
        selectCanvas(obj.id, true);
    }
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

// ***************** MODALS

document.addEventListener("DOMContentLoaded", function(event) {
    createNewCanvasModal();
    createResourceEditorModal();
    createMediaModal();
});

function createNewCanvasModal() {
    const newCanvasModalEl = $("#newCanvasModal");
    const newCanvasModal = new bootstrap.Modal(newCanvasModalEl);
    newCanvasModalEl.addEventListener('shown.bs.modal', function(event) {
        setMediaEventListeners("newCanvas");
        newCanvasModal.handleUpdate();
    })
    newCanvasModalEl.addEventListener('hide.bs.modal', () => {
        alert("This will create:\n\na new canvas\nwith an items property\nwith an anno page\nwith a painting annotation targeting the canvas\nwith a body that is a full static image\nwith an image service if supplied.")
    });
    $("#btnNewCanvas").addEventListener("click", () => newCanvasModal.show());
}

function createMediaModal() {
    const mediaModalEl = $("#mediaModal");
    const mediaModal = new bootstrap.Modal(mediaModalEl);
    mediaModalEl.addEventListener('shown.bs.modal', function(event) {
        setMediaEventListeners("media");
        mediaModal.handleUpdate();
    })
    mediaModalEl.addEventListener('hide.bs.modal', () => {
        alert("This will return a media resource.\n\nIf an image service was supplied, it will be a media resource with that image service attached.")
    });
    window.showMediaModal = () => mediaModal.show();
}

function setMediaEventListeners(prefix) {
    $$(prefix + "MediaUrl").addEventListener("change", () => analyseUrl(prefix));
    $$(prefix + "RefreshUrl").addEventListener("click", () => analyseUrl(prefix));
    $$(prefix + "ImgPreview").addEventListener("load", function() {
        if ($$(prefix + "StaticImg").style.display == "block") {
            setDimensions(prefix, this.naturalWidth, this.naturalHeight, (prefix == "newCanvas"));
        }
    });
}

function createResourceEditorModal() {
    const resourceEditorModalEl = $("#externalResourceModal");
    const resourceEditorModal = new bootstrap.Modal(resourceEditorModalEl);
    resourceEditorModalEl.addEventListener('shown.bs.modal', function(event) {
        resourceEditorModal.handleUpdate();
    })
    window.showResourceEditor = () => resourceEditorModal.show();
}

function analyseUrl(prefix) {
    // This is, quite obviously, not an implementation of
    // https://github.com/digirati-co-uk/iiif-manifest-editor/issues/45
    let url = $$(prefix + "MediaUrl").value.trim();
    $$(prefix + "MediaInfo").style.display = "none";
    $$(prefix + "ImgPreview").style.display = "none";
    $$(prefix + "StaticImg").style.display = "none";
    $$(prefix + "ImgService").style.display = "none";
    $$(prefix + "ManifestPreview").style.display = "none";
    if (url) {
        $$(prefix + "MediaInfo").style.display = "block";
        const ringerI = "https://iiif.wellcomecollection.org/image/";
        const ringerT = "https://iiif.wellcomecollection.org/thumbs/";
        if (url.startsWith(ringerI) || url.startsWith(ringerT)) {
            const idPart = url.split("/")[4];
            url = (url.startsWith(ringerI) ? ringerI : ringerT) + idPart;
            fetch(url).then(response => response.json()).then(info => {
                $$(prefix + "ImgPreview").style.display = "block";
                $$(prefix + "ImgService").style.display = "block";
                setDimensions(prefix, info.width, info.height, false);
                $$(prefix + "ImgPreview").src = url + "/full/!200,200/0/default.jpg";
            });
        } else if (url.indexOf("wellcomecollection.org/presentation") != -1) {
            $$(prefix + "ManifestPreview").style.display = "block";
        } else {
            // assume this is a static image                                          
            $$(prefix + "ImgPreview").style.display = "block";
            $$(prefix + "StaticImg").style.display = "block";
            $$(prefix + "ImgPreview").src = url;
        }
        if ($$("mediaModalType")) {
            $$("mediaModalType").value = "Image";
        }
        if ($$("mediaModalFormat")) {
            $$("mediaModalFormat").value = "application/jpeg";
        }
    }
}

function setDimensions(prefix, width, height, enforceMinSize) {
    // This is no longer in the spec for 3.0, but maybe we want to do it
    // can be a config flag
    if (enforceMinSize) {
        while (width < 1200 || height < 1200) {
            width = width * 2;
            height = height * 2;
        }
    }
    $$(prefix + "Width").value = width;
    $$(prefix + "Height").value = height;
    $$(prefix + "Duration").value = "";
}