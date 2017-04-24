# pigPhotos

Get images from Google Photos for display on a Raspberry Pi

Work in progress...

## What it does

1. Asks for read authorization against image files in Google Photos / Picasa
2. Gets a list of the user's public albums.
3. Gets a list of photos from each album, requesting a link to a photo with width or height of 800px.
4. Shuffles up the photos and cycles through the images one at a time. Cycle should be random, and fairly slow. This is a discovery app.


## What it will do at some point

1. Allow you to rate an image by touching the screen or moving a slider of some sort while the image is displayed. The rating will be stored in a db somewhere.
2. Allow you to delete photos, either with another place to press, or by rating at zero.
3. Allow you to create Picasa / Google Photos albums of your favourites. Possibly cross-reference image files with their equivalent entry in google photos and do it that way, or by adding them as new files if possible.

These extra functions depend on them still being possible through the API.
