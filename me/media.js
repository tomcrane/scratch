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
    for (div of $(".media-information")) {
        div.innerHTML = $("#imageMediaInformation").innerHTML;
    }
    for (div of $(".additional-information")) {
        div.innerHTML = $("#mediaCommonInformation").innerHTML;
    }
    for (a of $(".change-target")) {
        a.addEventListener("click", function(e) {
            e.preventDefault();
            let desc = this.previousElementSibling;
            let target = this.nextElementSibling;
            if (target.innerHTML) {
                target.innerHTML = "";
                this.innerText = "Change...";
                desc.innerHTML = "This image fills the whole Canvas."
            } else {
                target.innerHTML = $("#canvasPaintingTargetXywh").innerHTML;
                this.innerText = "Target whole Canvas";
                desc.innerHTML = "This image targets a <b><i>region</i></b> of the Canvas."
            }
        });
    }
});