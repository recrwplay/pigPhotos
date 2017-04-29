// First add the obligatory web framework
'use strict';

// require npm packages
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
  extended: false
}));

var shuffle = require('shuffle-array');
var parseString = require('xml2js').parseString;
var request = require('request');
var fetch = require('node-fetch');

var google = require('googleapis');
var OAuth2Client = google.auth.OAuth2;
var plus = google.plus('v1');

var guserID;
var albumList = [];
var photoList = [];
var photosIncluded = 'all';
var photoRatings = {};
var photosShown = [];
var nextPhoto;


// Set up the connection to MongoDB using the connection string from your deployment overview
var connectionString = process.env.PIGPHOTOSMONGOBURL;

// Then we'll pull in the database client library
var MongoClient = require('mongodb').MongoClient;

console.log(connectionString);
var options = {
  ssl: true,
  sslValidate: false,
}

var mongodb;

// This is the MongoDB connection.
MongoClient.connect(connectionString, options,function(err, db) {
        // Here we handle the async response. This is a simple example and
        // we're not going to inject the database connection into the
        // middleware, just save it in a global variable, as long as there
        // isn't an error.
        if (err) {
            console.log(err);
        } else {
            // Although we have a connection, it's to the "admin" database
            // of MongoDB deployment. In this example, we want the
            // "examples" database so what we do here is create that
            // connection using the current connection.
            mongodb = db.db("pigPhotos");
        }
    }
);

// Get ratings from the database
function getRatings(guser) {
  return new Promise(function(resolve, reject) {
    // we call on the connection to return us all the documents in the words collection.
    mongodb.collection("ratings").find({ userID: guser }).toArray(function(err, mongoRatings) {
      if (err) {
        console.log(err);
       reject(err);
      } else {
        var photoID, photoRating;
        mongoRatings.forEach(function(mongoRating) {
          // console.log(mongoRating);
          photoID = mongoRating.photoID;
          photoRating = mongoRating.rating;
          photoRatings[photoID] = photoRating;
        });
        console.log("got ratings from MongoDB");
        // console.log(photoRatings);
       resolve("ok");
      }
    });
  });
};

function updateRating(updateDetails) {

  mongodb.collection("ratings").updateOne(
      { "photoID": updateDetails.id, "userID": guserID },
      { $set: { "rating": updateDetails.rating, "rated": Date.now() } },
      { upsert: true }, function(error, result) {
      if (error) {
        console.log(error);
        return("unable to update rating");
      } else {
        console.log("Updated a rating");
        return("Saved!");
      }
    });
};

// Client ID and client secret from a Google API project, stored as env vars
var clientVars = process.env.PIGPHOTOSAPI.split(',');
var CLIENT_ID = clientVars[0];
var CLIENT_SECRET = clientVars[1];
var REDIRECT_URL = 'http://localhost:8080/authed';

var oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

let apiUserBase = 'https://picasaweb.google.com/data/feed/api/user/default';
let apiAlbumBase = apiUserBase + '/albumid';

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
    fetch(`${apiUserBase}?kind=album&access=visible`, { headers: apiHeaders }).then(function (res) {
      return res.text();
    }).then(function (albumFeed) {

      parseString(albumFeed, function (err, result) {
        guserID = result.feed.title[0];
        getRatings(guserID).then(function(){
          // console.log('photoRatings',photoRatings);
        });
        albumList = [];
        result.feed.entry.forEach(function(album) {
          if (album['title'][0] != 'Auto-Backup') {
            albumList.push({
              'id': album['gphoto:id'][0],
              'title': album['title'][0],
              // 'userID': guserID
            });
          }
        });
        // console.log(albumList);
        resolve("ok");
      });
    }).catch(function (err) {
      console.log(err);
      reject(err);
    });
  });
}

function getPhotosFromAlbums(album) {
  return new Promise(function(resolve, reject) {
    fetch(`${apiAlbumBase}/${album.id}?imgmax=800`, { headers: apiHeaders }).then(function (res) {
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
                'width': details['$'].width,
                'height': details['$'].height,
                'url': details['$'].url,
                'rating': photoRatings[photo['gphoto:id'][0]],
                'album_id': album.id,
                'album_title': album.title
              };
              if (photoDetails.url && ( photosIncluded == 'all' | details['$'].width > details['$'].height )) {
                photoList.push(photoDetails);
              } else {
                // console.log(photoDetails);
              }
            });
          });
        });
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
    if (!err) {
      console.log("authorised");
      oauth2Client.setCredentials(tokens);
      apiHeaders.authorization = "Bearer " + oauth2Client.credentials.access_token,
      response.redirect('/options.html');
    }
  });
});

app.get("/getalbums", function(request,response) {
  getAlbums().then(function(result) {
      console.log("created list of albums");
      response.send(albumList);
  }).catch(function (err) {
      console.log(err);
      response.status(500).send(err);
    });
});

// app.put('/', function(req,res){
//   console.log(req.url);
// });

app.put("/getphotolist", function(request,response) {
  photoList = [];
  photosIncluded = request.body.sizes;
  console.log('photos included:',photosIncluded);
  var selectedAlbums = JSON.parse(request.body.selected);
  return new Promise(function(resolve, reject) {
    selectedAlbums.forEach(function(selectedAlbum) {
      getPhotosFromAlbums(selectedAlbum).then(function () {
        console.log("Added "+selectedAlbum.title+" to photoList");
      }).catch(function (err) {
        console.log(err);
        reject(err);
      }).then(function() {
          shuffle(photoList);
          if (!response.headersSent) {
            resolve(response.status(200).send("ok"));
          }
        });
    });

  });

});

// app.get("/configured", function(request,response) {
//   albumList.forEach(function() {
//     getPhotosFromAlbums(album).then(function () {
//       resolve("ok");
//     }).catch(function (err) {
//       console.log(err);
//       reject(err);
//     });
//   });
// });

app.get("/auth", function(request,response) {
  response.send(oauthUrl);
});

function getNextPhoto(){

  if (photoList[0].url){
    console.log("next photo:",photoList[0]);
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

// Update a rating
app.put("/updateRating", function(request,response) {
  console.log("request",request.body);
  updateRating(request.body);
});

// Listen for a connection.
app.listen(port,function(){
});
