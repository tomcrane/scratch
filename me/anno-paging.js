function $(s) {
    if (s.startsWith("#")) {
        return document.getElementById(s.substring(1));
    } else if (s.startsWith(".")) {
        return document.getElementsByClassName(s.substring(1));
    } else {
        return document.getElementsByTagName(s);
    }
}

document.addEventListener("DOMContentLoaded", function(event) { 
    for(ul of $(".nav-tabs")){
        ul.innerHTML = $("#tabsTemplate").innerHTML;
    }
    for(nap of $(".new-anno-page-launcher")){
        nap.addEventListener("click", function(e){
            e.preventDefault();
            showNewAnnoPage(this.getAttribute("data-resource-editor"));
        });
    } 
    for(btn of $(".convert-to-internal")){
        btn.addEventListener("click", function(e){
            e.preventDefault();
            alert("This will create an additional anno page.");
        });
    }    
    for(ana of $(".add-new-annotation")){
        ana.addEventListener("click", function(e){
            e.preventDefault();
            const container = document.getElementById(this.getAttribute("data-anno-container"));
            const itemHeader = document.getElementById(this.getAttribute("data-anno-items-header"));
            const template = document.getElementById("exampleAnno").innerHTML;
            const newAnnoCount = parseInt(container.getAttribute("data-anno-count")) + 1;
            alert("This would show the individual anno form taking up the whole RHS panel.");
            container.setAttribute("data-anno-count", newAnnoCount);
            if(newAnnoCount > 1){
                container.innerHTML += template;
            } else {
                container.innerHTML = template;
            }
            itemHeader.innerText = "Items (" + newAnnoCount + ")";
        });
    }
    for(aps of $(".anno-page-switcher")){
        aps.addEventListener("click", function(e){
            e.preventDefault();
            for(form of $(".anno-page-form")){
                if(form.id == this.getAttribute("data-source")){
                    form.style.display = "block";
                } else {
                    form.style.display = "none";
                }
                $("#annoPageCurrent").value = this.innerText;
                for(aps of $(".anno-page-switcher")){
                    aps.setAttribute("data-selected", "");
                }
                this.setAttribute("data-selected", "selected");                
            }
        });
    }    
    $("#annoPagePrevPage").addEventListener("click", () => {
        setSelectedPageIndex(getSelectedPageIndex() - 1);        
    });
    $("#annoPageNextPage").addEventListener("click", () => {
        setSelectedPageIndex(getSelectedPageIndex() + 1);       
    });
});


function getSelectedPageIndex(){
    let index = 0;
    for(aps of $(".anno-page-switcher")){
        if(aps.getAttribute("data-selected") == "selected"){
            return index;
        }     
        index++;
    }
}

function setSelectedPageIndex(index){
    if(index > 4) index = 4;
    if(index < 0) index = 0;
    let i = 0;
    let dataSource = null;
    for(aps of $(".anno-page-switcher")){
        if(i == index){
            aps.setAttribute("data-selected", "selected");            
            $("#annoPageCurrent").value = aps.innerText;
            dataSource = aps.getAttribute("data-source");
        } else {
            aps.setAttribute("data-selected", "");
        }
        i++;
    }    
    for(form of $(".anno-page-form")){
        if(form.id == dataSource){
            form.style.display = "block";
        } else {
            form.style.display = "none";
        }
    }
}

$("#toggleComments").addEventListener("click", () => {
    const style = $("#toggleComments").checked ? "block" : "none";
    for(p of $(".very-small")){
        p.style.display = style;
    }
});

function showNewAnnoPage(resourceEditorId){
    window.resourceEditorId = resourceEditorId;
    moveElementContents(resourceEditorId, "reHolder");
    moveElementContents("newAnnotationPageTemplate", resourceEditorId);
}

function moveElementContents(sourceElementId, targetElementId){
    const sourceElement = document.getElementById(sourceElementId);
    const targetElement = document.getElementById(targetElementId);
    while (sourceElement.childNodes.length > 0) {
        targetElement.appendChild(sourceElement.childNodes[0]);
    }
}


for(rad of $(".new-anno-page-check")){
    rad.addEventListener("change", () => {                
        if($("#radEmbedded").checked){            
            $("#newAnnoPageCreate").innerText = "Create embedded annotation page";
            $("#newAnnoPageRefUrl").style.display = "none";                    
        } else {
            $("#newAnnoPageCreate").innerText = "Create link to external annotation page";
            $("#newAnnoPageRefUrl").style.display = "block";
        }
    });
}

$("#newAnnoPageCreate").addEventListener("click", () => {
    alert("This will create the appropriate anno page case (2-6)");    
    moveElementContents(window.resourceEditorId, "newAnnotationPageTemplate");
    moveElementContents("reHolder", resourceEditorId);
});
