// This simulates the app's local-storage recently used
const recentStarts = [{
        "id": "https://tomcrane.github.io/scratch/cs/wellcomefoods.json",
        "type": "Collection",
        "label": { "en": ["Some foodstuffs from Wellcome"] }
    },
    {
        "id": "https://iiif.bodleian.ox.ac.uk/iiif/collection/top",
        "type": "Collection",
        "label": { "en": ["Bodleian Library, Oxford"] },
        "summary": { "en": ["Top-level collection of IIIF manifests from the Bodleian Library and Oxford Colleges"] }
    },
    {
        "id": "https://iiif.wellcomecollection.org/presentation/b28974141",
        "type": "Manifest",
        "label": {
            "en": [
                "The floral emblems of purity are the white lily & the star of Bethlehem : for purity of blood use Frazer's Sulphur Tablets : test them free of charge."
            ]
        },
        "summary": {
            "en": [
                "<p>Leaflet issued by Frazer's Tablets, Limited advertising Frazer's Sulphur Tablets and Frazer's Sulphur Soap, used to treat ulcers, tuberculosis, and scurvy.</p>"
            ]
        },
        "thumbnail": [{
            "id": "https://iiif.wellcomecollection.org/thumbs/b28974141_0001.jp2/full/66,100/0/default.jpg",
            "type": "Image",
            "width": 66,
            "height": 100,
            "service": [{
                "@id": "https://iiif.wellcomecollection.org/thumbs/b28974141_0001.jp2",
                "@type": "ImageService2",
                "profile": "http://iiif.io/api/image/2/level0.json",
                "width": 680,
                "height": 1024,
                "sizes": [
                    { "width": 66, "height": 100 },
                    { "width": 133, "height": 200 },
                    { "width": 265, "height": 400 },
                    { "width": 680, "height": 1024 }
                ]
            }]
        }],
    },
    {
        "id": "https://iiif.wellcomecollection.org/presentation/b19318388",
        "type": "Manifest",
        "label": { "en": ["Receipt-Book, Italian: 16th century"] },
        "summary": {
            "en": [
                "Collection of medical receipts: mainly in Italian, the rest in Latin. Written in a small semi-current humanistic hand with a few later additions. On the verso of the fifth leaf is scribbled the name 'Alsinoro Marco 1648'."
            ]
        },
        "thumbnail": [{
            "id": "https://iiif.wellcomecollection.org/thumbs/b19318388_MS_650_0001.JP2/full/74,100/0/default.jpg",
            "type": "Image",
            "width": 74,
            "height": 100,
            "service": [{
                "@id": "https://iiif.wellcomecollection.org/thumbs/b19318388_MS_650_0001.JP2",
                "@type": "ImageService2",
                "profile": "http://iiif.io/api/image/2/level0.json",
                "width": 759,
                "height": 1024,
                "sizes": [
                    { "width": 74, "height": 100 },
                    { "width": 148, "height": 200 },
                    { "width": 296, "height": 400 },
                    { "width": 759, "height": 1024 }
                ]
            }]
        }]
    },
    {
        "id": "https://iiif.wellcomecollection.org/presentation/b19974760",
        "type": "Collection",
        "label": { "en": ["The Chemist and Druggist"] }
    },
    {
        "id": "http://ryanfb.github.io/iiif-universe/iiif-universe.json",
        "type": "Collection",
        "label": { "en": ["IIIF Universe (danger!)"] }
    }
];