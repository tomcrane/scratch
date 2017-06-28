Changes:

* Add in a fake v3 context, alongside the W3C anno context (https://github.com/IIIF/iiif.io/issues/1186)
* change the id to @id where the v2 Image API context has been introduced (this needs further discussion...)
* remove `dctypes` prefix; common DC types are aliased in the W3C anno context (to enhance readability)
** e.g., `"type" : "Image"`
* Your seeAlso link to MODS would benefit from a `profile` (not significant)
* normalised some `@type/type` and `@id/id` in various places
* changed `on` to `target` (use W3C anno vocab)
* reordered the terms order in the `body` of the image annotation (no change in meaning, just to help readability for me)


