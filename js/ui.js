;( function ( $ ) {

var $page = $('html, body');


// ### Auto-scrolling
//
$( function () {
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
    $h = $( href.replace( /\./g, '\\.' ) );
    if ( !$h.length ) {
      $a = $( "a[name=" + frag.replace( /\./g, '\\.' ) + "]" );
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
  $( window ).on( 'hashchange', scroll );
  $('.toc, .markdown-body, #source .text')
    .on( 'click', 'a[href^="#"]', scroll );
});


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
// Fills any empty `.local-toc` element with a list of the subheadings
// relative to the heading that immediately precedes it.
$( function () {
  var rxHLevel = /^h/i;
  $('div.local-toc')
    .filter( function () { return !$(this).children().length; } )
    .each( function () {
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


// ### Polyglot
//
// Assume contiguous `.highlight` code blocks to be linguistically analagous,
// and group their contents into a single common `div.highlight` container.
//
// Besides making for a less cluttered DOM, this step helps simplify the task
// of keeping the viewport’s apparent scroll position anchored to a visible
// element when a language preference is changed.
$( function () {

  // Select `.highlight` blocks that are contiguous sets and contain code in
  // the languages of interest (i.e.: JS, CS).
  var $blocks =
    $('.highlight')
      .has('code.javascript, code.coffeescript')
      .filter( function () {
        var $this = $(this);
        return $this.next().hasClass('highlight') ||
               $this.prev().hasClass('highlight');
      });

  // Select the first blocks of each contiguous set.
  var $initial = $blocks.filter( function ( index ) {
    var $prev = $(this).prev();
    return !$prev.length || !$blocks.eq( index - 1 ).is( $prev );
  });

  // Move the `pre` from succeeding `.highlight` blocks in the contiguous
  // set to the first block in the set, and then mark the common container
  // with the `polyglot` class.
  $initial
    .each( function () {
      var $this = $(this);
      var $next = $this;
      while ( true ) {
        $next = $next.next('.highlight')
        if ( !( $next.length && $next.is( $blocks ) ) ) break;
        $( 'pre', $next ).appendTo( $this );
      }
    })
    .addClass('polyglot');
    
  // Remove the blocks that are now empty.
  $blocks.not( $initial ).remove();
});


// ### Language preferences
//
// Identifies JavaScript/CoffeeScript code block pairs, and provides UI for
// toggling display of one or the other.
$( function () {
  var $window = $(window);
  var $topbar = $('.topbar');
  var $polyglot = $('.polyglot');
  var $polyglotPre = $('.polyglot pre');
  var $ul = $('.controls ul.languages');

  var languagesSupported = [ 'javascript', 'coffeescript' ];
  var language = {
    selected     : window.localStorage && localStorage.getItem('language')
                     || 'javascript',
    javascript   : { $elements: null, $control: null },
    coffeescript : { $elements: null, $control: null }
  };
  var javascript = language.javascript;
  var coffeescript = language.coffeescript;


  function $pageScrollTop () {
    return $('html').scrollTop() || $('body').scrollTop();
  }

  function $topElementInView () {
    var $els = $('.markdown-body').children(
      'h1, h2, h3, h4, h5, p, .highlight'
    );
    var windowHeight   = window.innerHeight || $window.height();
    var topbarHeight   = $topbar.height();
    var viewportHeight = windowHeight - topbarHeight;
    var pageScrollTop  = $pageScrollTop();
    var viewportTop    = pageScrollTop + topbarHeight;
    var viewportBottom = viewportTop + viewportHeight;
    var i, l, elementTop;

    for ( i = 0, l = $els.length; i < l; i++ ) {
      elementTop = $els.eq(i).offset().top;
      if ( elementTop > viewportTop ) {
        return $els.eq( elementTop > viewportBottom ? i - 1 : i );
      }
    }
  }

  function $item ( className ) {
    var $li = $('<li>').addClass( className );
    var $a  = $('<a>').attr( 'href', "#" );
    return $li.append( $a );
  }

  function makeListenerFor ( activeLanguage ) {
    var initialized = false;

    return function ( event ) {
      var hiddenLanguage, $el, localOffset;

      event.preventDefault();

      hiddenLanguage = language.selected;
      if ( initialized && activeLanguage === hiddenLanguage ) return;

      initialized = true;

      $page.stop();

      // Determine the topmost element currently visible in the viewport.
      var $el = $topElementInView();

      // Record where the top element is currently rendered relative to the
      // top of the browser window.
      if ( $el && $el.length ) {
        localOffset = $el.offset().top - $pageScrollTop();
      }

      // Show or hide the affected code blocks.
      initialized &&
      language[ hiddenLanguage ].$elements.hide();
      language[ activeLanguage ].$elements.show();

      // Restore the page’s scroll position to keep the viewport anchored to
      // the location of its topmost element.
      if ( $el && $el.length ) {
        $page.scrollTop( $el.offset().top - localOffset );
      }
      
      // Update the UI button states.
      initialized &&
      language[ hiddenLanguage ].$control.removeClass('active');
      language[ activeLanguage ].$control.addClass('active');

      // Persist the preference.
      language.selected = activeLanguage;
      if ( window.localStorage ) {
        localStorage.setItem( 'language', activeLanguage );
      }

      // Simulate a resize event, for benefit of the ToC viewport rect.
      $window.resize();
    };
  }

  // Establish sets of paired JS/CS `pre` blocks.
  javascript.$elements   = $polyglotPre.has('code.javascript');
  coffeescript.$elements = $polyglotPre.has('code.coffeescript');

  // Display all unpaired `pre` blocks.
  $('.highlight pre').not( $polyglotPre ).show();

  // Get language preference controls, or add them if not already present.
  if ( $ul.length ) {
    javascript.$control   = $( 'li.javascript', $ul );
    coffeescript.$control = $( 'li.coffeescript', $ul );
  } else {
    javascript.$control   = $item('javascript');
    coffeescript.$control = $item('coffeescript');
    $('<ul>')
      .addClass('languages')
      .append( javascript.$control, coffeescript.$control )
      .appendTo('.controls');
  }

  // Create event listeners and delegate them to the language controls.
  javascript.$control.click( makeListenerFor('javascript') );
  coffeescript.$control.click( makeListenerFor('coffeescript') );

  // Simulate a click event to initialize the UI and code blocks.
  language[ language.selected ].$control.click();
});


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
      .on( 'mouseenter touchstart', data, addIndicatedClass )
      .on( 'mouseleave touchend touchcancel', data, removeIndicatedClass )
    ;
  }
}() );


// ### ToC Viewport
//
// A rect underlies the ToC sidebar and follows the scroll position of the
// document, such that its `top` and `height` properties are updated to
// highlight the sections of the document presently visible in the window.
( function () {
  var TOC_ANCHOR_PADDING = 3;

  var $topbar, $toc, $fg, $a, $viewportRect;
  var documentHeight

  // A recyclable object used as the output of the `locate` function.
  var cachedLocationData;

  // An array of the hash fragments href’d by each `li a` in the ToC.
  var frags;

  // A key-value inversion of `frags` for quick index lookups.
  var indices;

  // A map that keys each indexed hash fragment to the `top` number property
  // of the corresponding heading element in the document body. Care must be
  // taken to update this map on each reflow (e.g. when toggling language
  // preferences).
  var positions;

  var $window = $( window );
  var $document = $( document );


  $( init );

  // #### init
  //
  // Listens for the $document ready event.
  function init () {
    var i, l;

    $toc = $('.toc');
    if ( $toc.length === 0 ) return;

    $topbar = $('.topbar');
    $fg = $( '.fg', $toc );
    $a = $( 'li a', $toc );

    cachedLocationData = {};
    frags = [];
    for ( i = 0, l = $a.length; i < l; i++ ) {
      frags[i] = $a[i].getAttribute('href');
    }
    indices = O.invert( frags );
    positions = {};

    $window
      .on( 'scroll', refresh )
      .on( 'resize', reflow )
    ;

    $viewportRect = $('<div class="viewport">').appendTo('.toc .bg');

    reflow();

    $viewportRect.show();
  }

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

    var windowHeight       = window.innerHeight || $window.height();
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

    // Locate the ToC anchor elements that should cover the top and bottom of
    // the viewport rect.
    var $topAnchor      = $( 'a[href=' + data.topId    + ']', $fg );
    var $bottomAnchor   = $( 'a[href=' + data.bottomId + ']', $fg );

    // Determine the precise vertical dimensions of the viewport rect, based
    // on the fraction of the corresponding document sections that are visible.
    var top     = $topAnchor.position().top - TOC_ANCHOR_PADDING +
                    data.topFraction *
                      ( $topAnchor.height() + 2 * TOC_ANCHOR_PADDING );
    var bottom  = $bottomAnchor.position().top - TOC_ANCHOR_PADDING +
                    data.bottomFraction *
                      ( $bottomAnchor.height() + 2 * TOC_ANCHOR_PADDING );

    // Apply the dimensions.
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
}() );


// ### Fix CoffeeScript syntax highlighting for strings
//
// The pygments module used by gh-pages appears to render CoffeeScript strings
// with a generic span class of `s` rather than `s1` or `s2` according to
// whether the string is enclosed with single- or double-quotes. This inspects
// the text node of all such elements and replaces `s` with the proper class.
$( function () {
  function search ( rx ) {
    return function () { return ~$(this).text().search( rx ); }
  }
  var $strings = $('code.coffeescript span.s');
  $strings.filter( search( /^'.*'$/ ) ).addClass('s1').removeClass('s');
  $strings.filter( search( /^".*"$/ ) ).addClass('s2').removeClass('s');
});

}( jQuery ) );