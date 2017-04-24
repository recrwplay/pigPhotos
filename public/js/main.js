$(document).ready(function() {

  var curPic = '1.jpg';

  var timer = setInterval(getNext(), 10000);

  // getNext();

  function getNext() {

    // var curPic = $('#displayImage img').prop('src');
    // console.log(curPic);
    $.ajax({
      url: '/pigphoto',
      type: 'GET',
      data: { showing: curPic },
      success: function(data) {
        console.log(data);
        if (!data.auth) {
          window.location = data.oauthUrl;
        } else {
          updateImage(data.photoDetails.url).then(function(updateResult){
            $('#displayImage').fadeIn(1000);
          });
          curPic = data.showing;
          clearInterval(timer); //clear interval
          timer = setInterval('$("#next").click()', 30000); //start it again
        }
      }
    });
  };

  function updateImage(src) {
    return new Promise(function(resolve, reject) {
      $('#displayImage').fadeOut(500, function() {
        $('#displayImage').html('<img src="'+src+'" />');
      });
      resolve("image link updated");
    });
  }

  // $('#auth').submit(function(e) {
  //   e.preventDefault();
  //   $.get( '/auth', function(url) {
  //     window.location = url;
  //   });
  // });

  window.setInterval(function(){
    getNext();
  }, 30000);

  $('#next-photo').submit(function(e) {
    e.preventDefault();
    getNext();
  });

});
