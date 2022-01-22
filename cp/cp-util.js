// Extract a string from a language map label property of `entity` in an appropriate language.
// If there is more than one value, use `separator` to join then into a single string.
// This will fall back to the "none" language, and then to any language.
function getLabel(entity, separator, lang){
    if(!entity.label) return "";
    if(!lang){
        if(navigator && navigator.language){
            lang = navigator.language.substring(0,2);
        } else {
            lang = "none";
        }               
    }
    if(!separator) separator = "\n";
    if(entity.label[lang]) return entity.label[lang].join(separator); // joined strings in desired lang
    if(entity.label["none"]) return entity.label["none"].join(separator); // joined strings in "none" lang
    return Object.values(entity.label)[0].join(separator) || ""; // joined strings in any lang
}