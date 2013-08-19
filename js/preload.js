// As a mobile web app, force internal navigation for internal links. This
// must be done early to catch interactions that precede document-ready.
//
( function () {
  if ( !navigator.standalone ) return;

  var location, rx;
  location = document.location;
  rxA = /^html|a$/i;
  rxHttp = /^https?:\/\//;
  rxJS = /.*\.js$/;
  document.addEventListener( 'click', function ( e ) {
    var el, href;
    for ( el = e.target; !rxA.test( el.nodeName ); el = el.parentNode );
    href = el.href;
    if ( typeof href !== 'string' ) return;
    if ( rxHttp.test( href ) && !~href.indexOf( location.host ) ) return;
    if ( rxJS.test( href ) ) return;
    e.preventDefault();
    location.href = href;
  });
}() );


// Auto-zoom the page in a wide- or full-screen window.
//
( function () {
  return;  // disabled

  if ( !document.querySelector ) return;

  var BASE_WIDTH = 960;
  var html = document.querySelector('html');

  function zoom ( event ) {
    var width = document.width;
    html.style.zoom = width > BASE_WIDTH ? width / BASE_WIDTH : 1;
  }

  window.addEventListener( 'resize', zoom );

  zoom();
}() );
