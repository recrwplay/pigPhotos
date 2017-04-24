# pigPhotos

Get images from Google Photos for display on a Raspberry Pi

Work in progress...

## What it does

1. Asks for read authorization against image files in google drive
2. Cycles through the images one at a time. Images are downloaded and resized to a width of 800 pixels for the touchscreen. Cycle should be random, and fairly slow. This is a discovery app.


## What it will do at some point

1. Allow you to rate an image by touching the screen or moving a slider of some sort while the image is displayed. The rating will be stored in a db somewhere
2. Allow you to delete photos from your drive, either with another place to press, or by rating at zero.
3. Allow you to create Picasa / Google Photos albums of your favourites. Possibly cross-reference image files with their equivalent entry in google photos and do it that way, or by adding them as new files if possible.
