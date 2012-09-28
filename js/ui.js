;( function ( $ ) {

var $page = $('html, body');


// ### Anchored headings
//
// Any heading elements containing a hash-linked anchor element are given an
// `id` based on the anchor’s href. Allows for clean plain-markdown
// production, e.g.: `### [Heading name](#heading-name)`.
$( function () {
  var rx = /^\#(.*)/;
  var $ha = $('h1, h2, h3, h4, h5').children('a[href^="#"]');
  $ha.each( function () {
    var $this = $(this);
    var id = $this.attr('href').replace( rx, "$1" );
    $this.parent().attr( 'id', id );
  });
});


// ### Local tables of contents
//
// Fills any `local-toc`-classed element with a list of the subheadings
// relative to the heading that immediately precedes it.
$( function () {
  var rxHLevel = /^h/i;
  $('div.local-toc').each( function () {
    var rxReplace;
    var $this = $(this);
    var data = $this.data();
    if ( data.pattern ) {
      rxReplace = new RegExp( data.pattern, data.flags );
    }

    // Establish the set of local subheadings
    var sel = 'h1, h2, h3, h4, h5';
    var $prev = $this.prevUntil( sel );
    $prev.length || ( $prev = $this );
    var $h = $prev.last().prev( sel );
    var level = +$h.prop('tagName').replace( rxHLevel, '' );
    var sublevel = level + 1;
    var $sh;
    while ( sublevel < 7 ) {
      $sh = $this.nextUntil( 'h' + level, 'h' + sublevel );
      if ( $sh.length ) break;
      sublevel += 1;
    }

    // Render unordered list
    var $ul = $('<ul>');
    $sh.each( function ( i ) {
      var $ha = $( 'a', this );
      var html = $ha.html();
      var $a = $('<a>').attr( 'href', $ha.attr('href') );
      $a.html( rxReplace ? html.replace( rxReplace, data.replace ) : html );
      $('<li>').append( $a ).appendTo( $ul );
    });
    $ul.appendTo( $this );
  });
});


// ### Backcrumb section footers
//
// (Not yet implemented; presently included manually in content markdown).
$( function () {
  "&#x23ce;"
});


// ### Language preferences
//
// Identifies JavaScript/CoffeeScript code block pairs, and provides UI for
// toggling display of one or the other.
( function () {
  var $pre = $('.highlight pre');
  var language = {
    selected     : window.localStorage && localStorage.getItem('language')
                     || 'javascript',
    javascript   : { $elements: null, $control: null },
    coffeescript : { $elements: null, $control: null }
  };
  var javascript = language.javascript;
  var coffeescript = language.coffeescript;
  var $ul = $('.controls ul.languages');

  function $pageScrollTop () {
    return $('html').scrollTop() || $('body').scrollTop();
  }

  function $headingInView () {
    var $els = $('.markdown-body').children(
      'h1, h2, h3, h4, h5, .highlight pre code.javascript'
    );
    var scrollTop = 108 + $pageScrollTop();
    var i, l;

    for ( i = 0, l = $els.length; i < l; i++ ) {
      if ( $els.eq(i).offset().top > scrollTop ) return $els.eq(i);
    }
  }

  function $item ( className ) {
    var $li = $('<li>').addClass( className );
    var $a  = $('<a>').attr( 'href', "#" );
    return $li.append( $a );
  }

  function makeClickListener ( active, hidden ) {
    return function ( event ) {
      var $h, localOffset;

      event.preventDefault();
      $page.stop();

      var $h = $headingInView();
      if ( $h && $h.length ) {
        localOffset = $h.offset().top - $pageScrollTop();
      }

      language[ active ].$elements.show();
      language[ hidden ].$elements.hide();

      if ( $h && $h.length ) {
        $page.scrollTop( $h.offset().top - localOffset );
      }
      
      language[ active ].$control.addClass('active');
      language[ hidden ].$control.removeClass('active');

      window.localStorage.setItem( 'language', active );

      // Simulate a resize event, for benefit of ToC viewport
      $(window).trigger('resize');
    };
  }

  // Establish sets of paired JS/CS `pre` blocks
  javascript.$elements =
    $pre.has('code.javascript').filter( function () {
      return $(this).parent().next().has('pre > code.coffeescript').length;
    });
  coffeescript.$elements =
    $pre.has('code.coffeescript');

  // Display all unpaired `pre` blocks
  $pre.not( javascript.$elements ).not( coffeescript.$elements ).show();

  // Get language preference controls ...
  if ( $ul.length ) {
    javascript.$control = $( 'li.javascript', $ul );
    coffeescript.$control = $( 'li.coffeescript', $ul );
  }
  // ...or add them if not already present
  else {
    javascript.$control   = $item('javascript');
    coffeescript.$control = $item('coffeescript');
    $('<ul>')
      .addClass('languages')
      .append( javascript.$control, coffeescript.$control )
      .appendTo('.controls');
  }

  javascript.$control.click(
    makeClickListener( 'javascript', 'coffeescript' )
  );
  coffeescript.$control.click(
    makeClickListener( 'coffeescript', 'javascript' )
  );

  language[ language.selected ].$control.click();
}() );


// ### Lightsticks
//
// Color-coded UI elements below each global nav item, which respond to
// hover events of anchor elements with matching hrefs.
( function () {
  var $li, patterns, i, l, p, $el, data;

  function addIndicatedClass ( event ) {
    event.data.$el.addClass('indicated');
  }
  function removeIndicatedClass ( event ) {
    event.data.$el.removeClass('indicated');
  }

  $li = $('.topbar ul li');
  patterns = [
    'a[href^="/docs"]',
    'a[href^="/api"]',
    'a[href^="/source"]',
    'a[href^="/tests"]',
    'a[href*="://github.com/"]'
  ];
  for ( i = 0, l = patterns.length; i < l; i++ ) {
    p = patterns[i];
    $el = $li.has( p );
    data = { $el: $el };
    $( '.content ' + p + ', .topbar ul li ' + p + ', footer ' + p )
      .on( 'mouseenter', data, addIndicatedClass )
      .on( 'mouseleave', data, removeIndicatedClass )
    ;
  }
}() );


// ### ToC Viewport
//
// A rect underlies the ToC sidebar and follows the scroll position of the
// document, such that its `top` and `height` properties are updated to
// highlight the sections of the document presently visible in the window.
( function () {
  var i, l;
  var documentHeight;
  var cachedLocationData = {};

  var $viewportRect;
  var $window = $( window );
  var $document = $( document );
  var $topbar = $('.topbar');
  var $fg = $('.toc .fg');
  var $a = $('.toc li a');

  // An array of the hash fragments href’d by each `li a` in the ToC.
  var frags = [];
  for ( i = 0, l = $a.length; i < l; i++ ) {
    frags[i] = $a[i].getAttribute('href');
  }

  // For quick index lookups, invert `frags`: key:value -> value:key
  var indices = O.invert( frags );

  // A map that keys each indexed hash fragment to the `top` number property
  // of the corresponding heading element. Care must be taken to update this
  // map on each reflow (e.g. when toggling language preferences).
  var positions = {};

  // #### headingIdAbovePosition
  //
  // Returns the `#id` of the nearest ToC-indexed heading element above the
  // provided `position` in the document.
  function headingIdAbovePosition ( position ) {
    var i, l;
    l = frags.length;
    if ( l < 2 ) return frags[0];
    for ( i = 1; i < l; i++ ) {
      if ( position < positions[ frags[i] ] ) return frags[ i - 1 ];
    }
    return frags[ l - 1 ];
  }

  // #### locate
  //
  // Identifies the top-most and bottom-most visible sections of the document,
  // given the current scroll position and window height, where a “section” is
  // defined as a vertical span of the document starting with a heading element
  // that is linked within the ToC and ending prior to the next such heading.
  //
  // Returns an object that includes the `id` of both the top-most and
  // bottom-most visible section, along with a `fraction` [0..1] for each that
  // expresses the vertical position within each section at which the section
  // is bisected by the top or bottom edge of the document viewport.
  function locate ( out ) {
    if ( !out || typeof out !== 'object' && typeof out !== 'function' ) {
      out = cachedLocationData;
    }

    var windowHeight       = $window.height();
    var topbarHeight       = $topbar.height();
    var viewportTop        = $window.scrollTop() + topbarHeight;
    var viewportHeight     = windowHeight - topbarHeight;
    var viewportBottom     = viewportTop + viewportHeight;

    var topId              = headingIdAbovePosition( viewportTop );
    var bottomId           = headingIdAbovePosition( viewportBottom );

    var topNextId          = frags[ indices[ topId    ] + 1 ];
    var bottomNextId       = frags[ indices[ bottomId ] + 1 ];

    var topPosition        = positions[ topId ];
    var bottomPosition     = positions[ bottomId ];

    var topNextPosition    = positions[ topNextId ];
    var bottomNextPosition = bottomNextId ? positions[ bottomNextId ] :
                               documentHeight;

    var topHeight          = topNextPosition - topPosition;
    var bottomHeight       = bottomNextPosition - bottomPosition;

    var topOffset          = viewportTop - topPosition;
    var bottomOffset       = viewportBottom - bottomPosition;

    out.topId              = topId;
    out.topFraction        = topOffset / topHeight;
    out.bottomId           = bottomId;
    out.bottomFraction     = bottomOffset / bottomHeight;
    return out;
  }

  // #### applyToViewportRect
  //
  // Maps the location data provided by `locate` to the viewport rect element.
  function applyToViewportRect ( data ) {
    var $topAnchor      = $( 'a[href=' + data.topId    + ']', $fg );
    var $bottomAnchor   = $( 'a[href=' + data.bottomId + ']', $fg );

    var top     = $topAnchor.position().top +
                    data.topFraction * $topAnchor.height();
    var bottom  = $bottomAnchor.position().top +
                    data.bottomFraction * $bottomAnchor.height();

    $viewportRect.css( 'top', top );
    $viewportRect.height( bottom - top );
  }

  // #### refresh
  //
  // Refreshes the position and height of the viewport rect.
  function refresh () {
    applyToViewportRect( locate() );
  }

  // #### reflow
  //
  // Recalculates the `top` values of the body elements indexed in `positions`
  // and triggers a `refresh` of the viewport rect.
  function reflow () {
    var i, l, frag, $el;
    for ( i = 0, l = frags.length; i < l; i++ ) {
      frag = frags[i];
      $el = $( frag );
      $el.length && ( positions[ frag ] = $el.offset().top );
    }
    documentHeight = $document.height();

    refresh();
  }

  // Create the viewport rect, bind relevant events, and initialize.
  $( function () {
    $viewportRect = $('<div class="viewport">').appendTo('.toc .bg');
    $window.on( 'scroll', refresh ).on( 'resize', reflow );
    reflow();
    $viewportRect.show();
  });

}() );

}( jQuery ) );
