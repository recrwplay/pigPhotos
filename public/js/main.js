$(document).ready(function() {

  var photoInfo = $("#scorebox");
  var currentValue;
  var newValue;

  $('#scorebox').barrating('show', {
    theme: 'bars-1to10',
    showSelectedRating: false,
    onSelect: function(value, text, event) {
      if (typeof(event) !== 'undefined') {
        // rating was selected by a user
        photoInfo.data("newValue", photoInfo.val());
      } else {
        // rating was selected programmatically
        // by calling `set` method
      }
    }
  });

  // var timer = setInterval(getNext(), 300000);
  var timer;
  var params = getAllUrlParams(window.location.search);
  console.log(params);
  if (params.optioned === 'true') {
    getNext();
  }

  function getNext() {

    // update rating in db if necessary
    if (photoInfo.data("currentValue") !== photoInfo.data("newValue") ) {
      console.log("rating has been updated");
      console.log(photoInfo.data("id"));
      updateRating();
    };

    // console.log(curPic);
    $.ajax({
      url: '/pigphoto',
      type: 'GET',
      success: function(data) {
        // console.log(data);
        if (!data.auth) {
          clearInterval(timer); //clear interval
          window.location = data.oauthUrl;
        } else {
          $('#page-info').hide();
          updateImage(data.photoDetails).then(function(updateResult){
            $('#displayImage').fadeIn(1000);
            $('#rate').addClass('hidden');
            // $('#displayImage img').animate({
            //     top:"-50%",
            //     left:"-50%"
            //   }, 5000
            // );
          });
          $('#interact').empty();
          clearInterval(timer); //clear interval
          timer = setInterval('$("#next-arrow").click()', 180000); //start it again

        }
      }
    });
  };

  function updateImage(photoDetails) {
    // console.log(photoDetails);
    return new Promise(function(resolve, reject) {
      $('#displayImage').fadeOut(500, function() {
        $('#displayImage').html('<img src="'+photoDetails.url+'" />');
        if ( photoDetails.height > photoDetails.width ) {
            $('#displayImage img').addClass("portrait");
        }
        $('#album-title').text(photoDetails.album_title);
        photoInfo.data("id",photoDetails.id);
        if (photoDetails.rating) {
          console.log('setting rating ' + photoDetails.rating);
          $('#scorebox').barrating('set', photoDetails.rating);
          // console.log("rating",photoInfo.val());
          photoInfo.data("currentValue", photoDetails.rating);
          photoInfo.data("newValue", photoDetails.rating);
        } else {
          $('#scorebox').barrating('clear');
          photoInfo.data("currentValue", 0);
          photoInfo.data("newValue", 0);
        }
      });
      resolve("image link updated");
    });
  }

  function updateRating() {
    var photoData = {
      'id': photoInfo.data("id"),
      'rating': photoInfo.data("newValue")
    }
    console.log(photoData);
    $.ajax({
      url: '/updateRating',
      type: 'PUT',
      // contentType: 'application/json',
      data: photoData,
      // dataType: 'json',
      success: function(data) {
        console.log(data);
      }
    });
  };

  window.setInterval(function(){
    getNext();
  }, 180000);

  $('#next-arrow').click(function(e) {
    e.preventDefault();
    getNext();
  });

  $('#authorize').click(function(e) {
    e.preventDefault();
    getNext();
  });

  $('#displayImage').click(function() {
    $('#rate').toggleClass( "hidden" );
  });


  function getAllUrlParams(url) {

  // get query string from url (optional) or window
  var queryString = url ? url.split('?')[1] : window.location.search.slice(1);

  // we'll store the parameters here
  var obj = {};

  // if query string exists
  if (queryString) {

    // stuff after # is not part of query string, so get rid of it
    queryString = queryString.split('#')[0];

    // split our query string into its component parts
    var arr = queryString.split('&');

    for (var i=0; i<arr.length; i++) {
      // separate the keys and the values
      var a = arr[i].split('=');

      // in case params look like: list[]=thing1&list[]=thing2
      var paramNum = undefined;
      var paramName = a[0].replace(/\[\d*\]/, function(v) {
        paramNum = v.slice(1,-1);
        return '';
      });

      // set parameter value (use 'true' if empty)
      var paramValue = typeof(a[1])==='undefined' ? true : a[1];

      // (optional) keep case consistent
      paramName = paramName.toLowerCase();
      paramValue = paramValue.toLowerCase();

      // if parameter name already exists
      if (obj[paramName]) {
        // convert value to array (if still string)
        if (typeof obj[paramName] === 'string') {
          obj[paramName] = [obj[paramName]];
        }
        // if no array index number specified...
        if (typeof paramNum === 'undefined') {
          // put the value on the end of the array
          obj[paramName].push(paramValue);
        }
        // if array index number specified...
        else {
          // put the value at that index number
          obj[paramName][paramNum] = paramValue;
        }
      }
      // if param name doesn't exist yet, set it
      else {
        obj[paramName] = paramValue;
      }
    }
  }

  return obj;
}



});
