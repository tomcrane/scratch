function $(s) {
    if (s.startsWith("#")) {
        return document.getElementById(s.substring(1));
    } else if (s.startsWith(".")) {
        return document.getElementsByClassName(s.substring(1));
    } else {
        return document.getElementsByTagName(s);
    }
}

function setMediaInfoValue(container, disabled, className, value){
    let element = container.getElementsByClassName(className)[0];
    console.log(element);
    element.disabled = disabled;
    element.value = value;
}

function setMediaInfo(container, disabled, width, height, duration, type, format){
    setMediaInfoValue(container, disabled, "media-width", width);
    setMediaInfoValue(container, disabled, "media-height", height);
    setMediaInfoValue(container, disabled, "media-duration", duration);
    setMediaInfoValue(container, disabled, "media-type", type);
    setMediaInfoValue(container, disabled, "media-format", format);
}

document.addEventListener("DOMContentLoaded", function(event) {
    for (div of $(".media-information")) {
        div.innerHTML = $("#imageMediaInformation").innerHTML;
        let caseNumber = div.id.split("-")[1];
        switch(caseNumber){
            case "1":
                setMediaInfo(div, true, 2000, 3000, "n/a", "Image", "image/jpeg");
                break;
            case "2":
                setMediaInfo(div, true, 791, 1024, "n/a", "Image", "image/jpeg");
                break;
            case "4":
                setMediaInfo(div, true, 6000, 4000, "n/a", "Image", "image/jpeg");
                break;
            case "5":
                setMediaInfo(div, false, 1920, 1080, 8567.3, "Video", "video/mp4");
                break;

        }
    }
    for(div of $(".imgservice-information")){
        div.innerHTML = $("#imageFromImageService").innerHTML;
        
    }
    for (div of $(".additional-information")) {
        div.innerHTML = $("#mediaCommonInformation").innerHTML;
    }
    for (a of $(".change-target")) {
        a.addEventListener("click", function(e) {
            e.preventDefault();
            let desc = this.previousElementSibling;
            let target = this.nextElementSibling;
            let targetT = target.nextElementSibling;
            if (target.innerHTML) {
                target.innerHTML = "";
                this.innerText = "Change...";
                desc.innerHTML = "This media fills the whole Canvas.";
                if(targetT){
                    targetT.innerHTML = "";
                }
            } else {
                target.innerHTML = $("#canvasPaintingTargetXywh").innerHTML;
                this.innerText = "Target whole Canvas";
                desc.innerHTML = "This media targets a <b><i>region</i></b> of the Canvas."
                if(targetT){
                    targetT.innerHTML = $("#canvasPaintingTargetT").innerHTML;
                }
            }
        });
    }
});