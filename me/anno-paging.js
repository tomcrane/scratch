function $(s) {
    if (s.startsWith("#")) {
        return document.getElementById(s.substring(1));
    } else if (s.startsWith(".")) {
        return document.getElementsByClassName(s.substring(1));
    } else {
        return document.getElementsByTagName(s);
    }
}

for(rad of $(".case-1-check")){
    rad.addEventListener("change", () => {                
        const annoPageType = $("#case1Form").elements["radPage"].value;
        if(annoPageType == "embedded"){            
            $("#case1Intro").style.display = "none";
            $("#case1Add").style.display = "block";
            $("#case1Embedded").style.display = "block";
            $("#case1RefUrl").style.display = "none";                    
        } else {
            $("#case1Intro").style.display = "none";
            $("#case1Add").style.display = "none";
            $("#case1Embedded").style.display = "none";
            $("#case1RefUrl").style.display = "block";
        }
    });
}

$("#case1AddNewAnno").addEventListener("click", () => {
    alert("will skip the full annotation editor here...\n\nYou'll see the mini version as if we had created it.")
    $("#case1BeforeAnno").style.display = "none";
    $("#case1AfterAnno").style.display = "block";
    $("#case1Radios").style.display = "none";
});

$("#case1CreateExternalLink").addEventListener("click", () => {
    alert("See Case 2 for what this looks like")
    $("#case1Radios").style.display = "none";
});
