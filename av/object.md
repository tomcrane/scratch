# Object hint service

_(Write up of conversation with @stephenwf)_

IIIF does not and should not tell clients how to render a resource. While it assumes a web environment, it does not require a web browser; presentation could be by other means. The inclusion of an image with an image service isn't telling the client to render an `<img />` tag, or use OpenSeadragon - these are left to the client. The IIIF Manifest points at resources, like images, PDFs, videos etc., providing a _model_. The rendering of that model is up to the client.

There is a whole class of web content that we would like to paint onto canvases, but are not simple web resources. Videos on YouTube and Vimeo are good examples of this. YouTube doesn't grant us access to a simple video file we can paint onto a Canvas, but conceptually there's nothing wrong with painting a YouTube video onto a Canvas, annotating it, pointing Ranges at it, and so on.

IIIF is also highly extensible. It's quite simple to propose service profiles that would allow a client to paint a YouTube video onto a Canvas; one suggestion is here: 

```json
{
  "type": "Annotation",
  "target": "http://example.org/canvas/1",
  "body": {
    "id": "http://youtube.com/video",
    "service": {
      "id": "http://youtube.com/video/api",
      "profile": "uri-for-youtube-api",
      "more": ["params", "go","here", "too"]
    }
  }
}
```

[IIIF-AV Issues #46](https://github.com/IIIF/iiif-av/issues/46#issue-170212297)

You could imagine similar service profiles for other services, and other types of embeddable object. This kind of approach is to be encouraged, with cookbook recipes. 

However, it means that clients would end up with an increasing number of service profiles to recognise, and understand how to render with their appropriate embed syntax. The benefit of the above service is that it still leaves the rendering up to the client (although the client's options are in practice going to be limited). We can keep this kind of benefit, but give help to clients, by taking advantage of the fact that many resources of different types can be embedded with the HTML `<object>` tag.

The service proposed here is a means of supplying a client with the parameters to give an HTML `<object>` tag. This goes against the spirit of the opening sentence above, but if regarded as a rendering hint _alongside_ a resource, rather than the resource _being_ an object tag, it's an acceptable approach.

## As a service on a painted resource

In the case of a YouTube vide maybe the only thing we have to paint conventionally is a static image, but we'd like a client to replace that image with the video from YouTube. This example could also benefit from a posterCanvas as well (not shown).

```json
{
    "id": "https://example.org/iiif/video/canvas",
    "type": "Canvas",
    "label": { "en": [ "example" ] },
    "height": 1920,
    "width": 1080,
    "duration": 3600,
    "items": [
        {
            "id": "https://example.org/iiif/video/annopage1",
            "type": "AnnotationPage",
            "items": [
                {
                    "id": "https://example.org/iiif/video/annotation1",
                    "type": "Annotation",
                    "motivation": "painting",
                    "body": {
                        "id": "https://example.org/iiif/video/poster.jpg",
                        "type": "Image", 
                        "service": [{
                            "type": "ObjectTagService",
                            "profile": "http://example.com/object-hint-service",
                            "width": 1920,
                            "height": 1080,
                            "params": [
                                {
                                    "id": "data",
                                    "value": "https://www.youtube.com/embed/dQw4w9WgXcQ"
                                }
                            ]
                        }]
                    },
                    "target": "https://example.org/iiif/video/canvas"
                }
            ]
        }
    ]
}
```

The service itself is reusable for any kind of object tag embed. All it does is supply the parameters of the object tag. The `width` and `height` values are direct properties, then all other properties are in the parameter list.

> An additional `@context` will be required to define `ObjectTagService`, `params` and the use of `id` and `value` within it, and remove the Presentation context within the scope of the service.

## As a service on any resource to assist with rendering

Another example, this time embedding a PDF. In this case it would be usual to just give the PDF URL and let the client decide, but you could still provide an object service. A client that didn't specifically know how to recognise and render a PDF, but just knew about the `ObjectTagService`, would still be able to render the PDF:

```json
{
    "rendering": [        
        {
          "id": "https://iiif.wellcomecollection.org/file/b17502792_Science and the Public.pdf",
          "type": "Text",
          "label": { "en": [ "Science and the Public (PDF)" ] },
          "format": "application/pdf",
          "service": [
            {
                "type": "ObjectTagService",
                "profile": "http://example.com/object-hint-service",
                "params": [
                    {
                        "id": "data",
                        "value": "https://iiif.wellcomecollection.org/file/b17502792_Science and the Public.pdf"
                    },
                    {
                        "id": "type",
                        "value": "application/pdf"
                    }
                ]
            }
          ]
        }
    ]
}

```

Note that this approach is compatible with the suggestions in [this born digital proposal](https://github.com/wellcomecollection/docs/blob/ee64326e8f399c7c91acafa60fafb0287cffa4e0/rfcs/046-born-digital-iiif/README.md)
