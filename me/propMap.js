const propMap = {
    "Common": {
        "inline": ["label", "summary", "requiredStatement", "metadata", "rights", "behavior"],
    }
    "Manifest": {
        "inline": ["navDate", "viewingDirection"],
        "nonPaintingAnnoPage": ["annotations"],
        "resource": ["service", "services", "rendering", "partOf", "seeAlso"],
        "canvas": ["accompanyingCanvas", "placeholderCanvas"],
        "agent": ["provider"],
        "defer": ["start", "structures"],
        "media": ["thumbnail"],
        "ignore": ["items", "motivation", "posterCanvas"]
    },
    "Canvas": {
        "inline": ["width", "height", "duration", "label", "summary", "requiredStatement", "metadata", "rights", "navDate", "behavior", "viewingDirection"],
        "nonPaintingAnnoPage": ["annotations"],
        "paintingAnnoPage": ["items"],
        "resource": ["service", "rendering", "partOf", "seeAlso"],
        "canvas": ["accompanyingCanvas", "placeholderCanvas"],
        "agent": ["provider"],
        "defer": [],
        "media": ["thumbnail"],
        "ignore": ["motivation", "posterCanvas"]
    },
    "AnnotationPage": {

    }
    "Canvas": {
        "inline": [
            "width", 
            "height",
            "duration",
            "label", 
            "behavior", 
            "motivation", 
            "summary", 
            "requiredStatement", 
            "metadata",
            "rights",
            "navDate"  ],
            "resources": [],
        ""
    }
}
id
annotations
behavior
homepage
items
label
logo
metadata
motivation
navDate
provider
partOf
posterCanvas
accompanyingCanvas
placeholderCanvas
rendering
requiredStatement
rights
seeAlso
service
services
start
structures
summary
thumbnail
viewingDirection