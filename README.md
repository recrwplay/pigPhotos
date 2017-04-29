# pigPhotos

Get images from Google Photos for display on a Raspberry Pi

Work in progress...

## What it does

1. Asks for read authorization against image files in Google Photos / Picasa
2. Gets a list of the user's public albums.
3. Asks user to select albums to include in slideshow and whether to use all images or only landscape images. Portrait images are rotated 90 degrees.
3. Gets a list of photos from each album, requesting a link to a photo with width or height of 800px.
4. Shuffles up the photos and cycles through the images one at a time. Cycle should be random, and fairly slow. Currently set to move to the next image every 180 seconds.
5. Clicking the screen shows the album name and an icon to move on to the next aimage.
6. User can rate photos. Current version is set up to use a MongoDB database to store ratings.


## What it will do at some point


1. Allow you to delete photos, either with another place to press, or by rating at zero.
2. Allow you to create Picasa / Google Photos albums of your favourites. Possibly cross-reference image files with their equivalent entry in google photos and do it that way, or by adding them as new files if possible.
3. Allow you to only show images with a minimum rating.

These extra functions depend on them still being possible through the API.
