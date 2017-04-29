$(document).ready(function() {

  $('#choose').on('click', '.album-title', function(){
    $( this ).toggleClass( "selected" );
  });

  $('#options').on('click', '.size-choice', function(){
    $(this).text(function(i, text){
              return text === "Only Landscape" ? "All Photos" : "Only Landscape";
          })
  });

  getAlbums();

  function getPhotos() {
    var selectedAlbums = [];
    console.log("getting photos");
    $('#use-albums h1').text("Getting photos...");
    $('.selected').each(function(i, obj) {
        var data = {'id': obj.id, 'title': obj.getAttribute("value"), 'selected': 'true' };
        selectedAlbums.push(data);
    });
    console.log(selectedAlbums);
    $.ajax({
      url: '/getphotolist',
      type: 'PUT',
      data: { 'selected': JSON.stringify(selectedAlbums), 'sizes': $('.size-choice').text() },
      success: function(response) {
        console.log('success');
        // window.location = data.URL;
      },
      statusCode: {
        200: function(response){
          console.log(response);
          window.location.href = "/?optioned=true";
        }
      }
    });
  }


  function getAlbums() {

    // send list of selected albums
    $('#get-albums h1').text("Getting albums...");

    $.ajax({
      url: '/getalbums',
      type: 'GET',
      data: "ok",
      success: function(data) {
        console.log(data);

        var rendered = '';
        data.forEach(function(item) {
          rendered = rendered + '<span class="album-title" id="'+item.id+'" value="'+item.title+'">'+item.title+'</span>';
        });
        $('#choose').html(rendered);
        // $('#get-albums').addClass("use-albums").removeClass("get-albums");
        $('#get-albums').empty().hide();
        $('#options >div#photos-selected').css('display','inline-block');;
        $('#use-albums').html('<h1 class="clickable">Use selected</h1>');
      }
    });
  };

  // $('.get-albums').click(function(e) {
  //   e.preventDefault();
  //   getAlbums();
  // });

  $('.use-albums').click(function(e) {
    e.preventDefault();
    getPhotos();
  });

  $('#get-photolist').click(function(e) {
    e.preventDefault();
    getPhotoList();
  });

});
