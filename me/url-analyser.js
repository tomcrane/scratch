// This is from the ts version
const getImage = async (src) => {
  return new Promise((resolve, reject) => {
    const $img = document.createElement("img");
    $img.onload = () => resolve($img);
    $img.onerror = () => reject();
    $img.src = src;
    if ($img.complete) {
      resolve($img); // cached.
    }
  });
};


async function analyse(url){
    // This is not an optimised approach, which probably would not try the fetch immediately
    if(!url) return;

    let response = null;
    try{
        response = await fetch(url);
    }
    catch {
        // can handle the error better, but maybe CORS error happened so:
        return handleNonFetchableUrl(url);
    }

    if(!response.ok){
        response = await fetch(url + "/info.json");
        if(!response.ok){
            return handleNonFetchableUrl(url);            
        }
    }

    // but... it might have been a CORS-enabled image, or an image from an image service.
    // In this scenario we can capture the content type right here.
    const contentTypeHeader = response.headers.get("Content-Type");
    if(contentTypeHeader?.includes("image/")){
        return handleNonFetchableUrl(url, contentTypeHeader);
    }
    
    // OK, it's probably NOT an image, and we have an OK response, so can we get JSON from it?
    let data = null;
    try
    {
        data = await response.json();
    }
    catch{
        return null;
    }

    return await analyseJson(data, url);

}

async function analyseJson(data, url){
    if(data.protocol && data.protocol == "http://iiif.io/api/image"){
        if(!data.type) data.type = "ImageService";
        // NB this will be ImageService3 if it's a v3 img service
        return data;
    }
    // does it have an ID?
    const dataId = data.id || data["@id"];
    if(!dataId){
        return null;
    }
    const vault = new IIIFVault.Vault();
    const vaultData = await vault.load(url); // we could use dataId here, but just in case it's wrong...
    if (!vaultData) return;
    if (vaultData.type === "Manifest" || vaultData.type === "Collection") {
      return {
        id: url,
        type: vaultData.type,
        label: IIIFVaultHelpers.getValue(vaultData.label)
      };
    };
}

async function handleNonFetchableUrl(url, capturedContentType){
    // it *is* an image... but is it an image from an image service?
    // In its current form this should be tried before any fetch happens
    // that is, does it match:
    // http<s>://<any.org>/<any-prefix>/region/size/rotation/format.quality ?
    // This should really call Stephen's IIIF Image API parser, and if it's a success, we know it's
    // probably an image service
    // https://github.com/atlas-viewer/iiif-image-api
    // https://github.com/atlas-viewer/iiif-image-api/blob/main/src/utility/parse-image-service-request.ts
    const parts = url.split("/");
    if(parts.length >= 8){
        // might be an image service
        const iiifParts = parts.slice(-4);
        // need to do more than this but the parser can do the hard work
        if(iiifParts[3].split('.').length == 2){
            // This is not reliable! parse it properly!
            if(iiifParts[2][0] == "!" || iiifParts[2] == parseInt(iiifParts[2])){
                // rotation param is numeric
                // this is worth trying as an image service
                const serviceUrl = parts.slice(0, parts.length - 4).join("/") + "/info.json";
                // assume this is a low cost thing to try
                const imgService = getImageService(serviceUrl);
                if(imgService) return imgService;
            }
        }
    }

    // OK we didn't find an image service behind that image URL. So now it's time to use the DOM.

    try{
        const image = await getImage(url);
        data = {
            id: url,
            type: "Image",
            width: image.width, // naturalWidth
            height: image.height, // naturalHeight
            format: await getFormat(url, capturedContentType)
        }
        return data;
    } catch{}

    return null;

}

async function getImageService(url){
    const response = await fetch(url);
    if(response.ok){
        const data = await response.json();
        return analyseJson(data, url);
    }
    return null;
}

async function getFormat(url, capturedContentType){
    if(capturedContentType){
        // we managed to learn this earlier, the image had CORS
        return capturedContentType;
    }
    // a HEAD request doesn't have CORS issues... well it didn't used to...
    const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    const ct = response.headers.get('Content-type');
    if(ct){
        return ct;
    }

    // if the above still fails, we could fall back to guessing
    // content-type from the URL  (.jpg etc).
    const test = url.toLowerCase();
    if(test.endsWith("jpg") || test.endsWith("jpeg")){
        return "image/jpeg";
    }
    if(test.endsWith("png")){
        return "image/png";
    }
    // etc - probably a library to do this
    return "image/unknown";
}