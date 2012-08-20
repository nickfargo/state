;( function ( $ ) {

var history = window.history;
var $container = $('html, body');

var topbarHeight = $('.topbar').height();
var maxScrollMargin = 16;

function lerp ( n0, n1, a ) { return n0 + ( n1 - n0 ) * a; }

$.easing.accel = function ( a ) {
  return Math.pow( a, 2 );
};

$.easing.brake = function ( a ) {
  return 1 - Math.pow( 1 - a, 6 );
};

function scroll ( event ) {
  var $target, href, frag, $a, $h, margin, offset, method,
      targetTop, startPoint, endPoint;

  event.preventDefault();

  $target = $( event.target );
  href = $target.attr('href') ||
         $target.parent('a').attr('href') ||
         window.location.hash;
  frag = href.replace( /^\#(.*)/, "$1" );
  if ( !frag ) return;
  $h = $( href );
  if ( !$h.length ) {
    $a = $( "a[name=" + frag + "]" );
    $h = $a.parent().next();
  }
  if ( !$h.length ) return;
  
  margin = parseInt( $h.css('margin-top').replace( /(\d+)px/, "$1" ) );
  offset = topbarHeight + Math.min( margin, maxScrollMargin );
  targetTop = $h.offset().top;
  startPoint = $('html').scrollTop() || $('body').scrollTop();
  endPoint = targetTop - offset;

  function depart () {
    $('html, body')
      .stop()
      .animate( { scrollTop: lerp( startPoint, endPoint, 0.5 ) },
        300, 'accel', arrive
      );
  }
  function arrive () {
    $('html, body')
      .stop()
      .animate( { scrollTop: endPoint },
        900, 'brake'
      );
  }

  if ( history ) {
    method = href === location.hash ? 'replaceState' : 'pushState';
    history[ method ]( null, null, href );
  }
  depart();
}

$( document ).on( 'ready', scroll );
$('.toc, .markdown-body, #source .text').on( 'click', 'a[href^="#"]', scroll );

}( jQuery ) );