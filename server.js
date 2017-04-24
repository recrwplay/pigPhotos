// First add the obligatory web framework
'use strict';

// require npm packages
var bodyParser = require('body-parser');
var shuffle = require('shuffle-array');
var parseString = require('xml2js').parseString;
var request = require('request');
var fetch = require('node-fetch');

var express = require('express');
var app = express();

var google = require('googleapis');
var OAuth2Client = google.auth.OAuth2;
var plus = google.plus('v1');

var albumList = [];
var photoList = [];
var photosShown = [];
var nextPhoto;


// Client ID and client secret from a Google API project, stored as env vars
var clientVars = process.env.PIGPHOTOSAPI.split(',');
var CLIENT_ID = clientVars[0];
var CLIENT_SECRET = clientVars[1];
var REDIRECT_URL = 'http://localhost:8080/authed';

var oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

let apiAlbumBase = "https://picasaweb.google.com/data/feed/api/user/default/albumid";
let apiUserBase = "https://picasaweb.google.com/data/feed/api/user/default"

//we'll add the Authorization value to the headers later
let apiHeaders = {
                "Host": "picasaweb.google.com",
                "GData-Version": 3
            };

// set auth as a global default
google.options({
  auth: oauth2Client
});

var scopes = [
  // 'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://picasaweb.google.com/data/'
];

var oauthUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // will return a refresh token
  scope: scopes
});

function getAlbums() {
  return new Promise(function(resolve, reject) {
    fetch(`${apiUserBase}?kind=album&access=public`, { headers: apiHeaders }).then(function (res) {
      return res.text();
    }).then(function (albumFeed) {
      parseString(albumFeed, function (err, result) {
        result.feed.entry.forEach(function(album) {
          albumList.push({ 'id': album['gphoto:id'][0], 'title': album['title'][0] });
        });
        albumList.forEach(function(album) {
          getPhotosFromAlbums(album).then(function () {
            resolve("ok");
          }).catch(function (err) {
            console.log(err);
            reject(err);
          });
        });
      });
    }).catch(function (err) {
      console.log(err);
      reject(err);
    });
  });
}

function getPhotosFromAlbums(album) {
  return new Promise(function(resolve, reject) {
    fetch(`${apiAlbumBase}/${album.id}?prettyprint=true&imgmax=800`, { headers: apiHeaders }).then(function (res) {
      return res.text();
    }).then(function (albumList) {
      parseString(albumList, function (err, result) {
        result.feed.entry.forEach(function(photo) {
          photo['media:group'].forEach(function(link) {
            var mediaContent = link['media:content'];
            mediaContent.forEach(function(details) {
              var photoDetails = {
                'id': photo['gphoto:id'][0],
                'title': photo['title'][0],
                'url': details['$'].url,
                'album_id': album.id,
                'album_title': album.title
              };
              if (photoDetails.url) {
                photoList.push(photoDetails);
              } else {
                console.log(photoDetails);
              }
            });
          });
        });
        shuffle(photoList);
        resolve(photoList);
      });
    }).catch(function (err) {
      console.log(err);
      reject(err);
    });
  });
}

// We want to extract the port to publish our app on
var port = process.env.PORT || 8080;

// Set up our web server. First up we set it to server static pages
app.use(express.static(__dirname + '/public'));

app.get("/authed", function(request,response) {
  oauth2Client.getToken(request.query.code, function (err, tokens) {
    if ( !err) {
      oauth2Client.setCredentials(tokens);
      apiheaders.authorization = "Bearer " + oauth2Client.credentials.access_token,

      getAlbums().then(function(result) {

          console.log("photoList created");
          response.redirect('/');
      }).catch(function (err) {
          console.log(err);
          response.status(500).send(err);
        });

    }
  });
});

app.get("/auth", function(request,response) {
  response.send(oauthUrl);
});

function getNextPhoto(){

  if (photoList[0].url){
    console.log(photoList[0]);
    var result = {
      'auth': 'true',
      'photoDetails': photoList[0]
    }

  } else {
    photoList.shift();
    nextPhoto = getNextPhoto();
  }
  photosShown.push(nextPhoto);
  photoList.shift();
  return(result);
}

// Get a photo
app.get("/pigphoto", function(request, response) {
  if ( oauth2Client.credentials.hasOwnProperty('access_token') ) {
    nextPhoto = getNextPhoto();
    response.send(nextPhoto);
  } else {
      var result = {
        'oauthUrl': oauthUrl
      }
      response.send(result);
  }
});

// Listen for a connection.
app.listen(port,function(){
});
