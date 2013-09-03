;( function ( $ ) {

var profile = {};
var timeElapsed = ( function () {
  var lastTime;
  var timeSource = window.performance || Date;
  if ( typeof timeSource.now !== 'function' ) {
    timeSource.now = function () { return ( new Date ).getTime(); };
  }
  function timeElapsed () {
    var t = lastTime;
    lastTime = timeSource.now();
    return lastTime - t;
  }
  timeElapsed();
  return timeElapsed;
}() );


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
  $('.toc, .content .body, #source .text')
    .on( 'click', 'a[href^="#"]', scroll );

  profile["autoscroll"] = timeElapsed();
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

  profile["anchored headings"] = timeElapsed();
});


// ### ToC autogen
//
// If a `.toc` element exists but contains no markup for a table of contents,
// then generate one whose structure is based on the sequential ordering of
// heading elements within `.content .body`. Like a parser, this function
// takes as input a stream of heading elements, and outputs a tree of `ul`s
// and `li`s with matching text and anchors.
$( function () {
  var i, l, stack, level, nextLevel;
  var $el, $lookahead, $ul, $li, $a;
  var rx = /^h/i;

  var $fg = $('.toc .fg');
  if ( $fg.children().length ) return;

  var $h = $('.content .body').find('h1, h2, h3, h4, h5');
  l = $h.length;
  if ( !l ) return;

  stack = [];

  // Starting the loop with `i = -1` does a preliminary lookahead to initialize
  // the `$ul`, `level` and `nextLevel` variables.
  i = -1;

  while ( i < l ) {

    // Advance the cursor. On the first iteration `$el` will be `undefined`.
    $el = $lookahead;
    $lookahead = $h.eq( i += 1 );

    // Create an `li` that maps to the heading element. This is skipped on the
    // first lookahead-only iteration.
    if ( $el ) {
      $a = $('<a>')
        .attr( 'href', "#" + ( $el.attr('id') || '' ) )
        .html( $( 'a', $el ).html() || $el.text() );
      $li = $('<li>')
      $li.append( $a )
      $li.appendTo( stack[ stack.length - 1 ] );
    }

    // Extract the nesting levels based on the heading elements’ numbering.
    level = nextLevel || 0;
    nextLevel = $lookahead.length ?
      +$lookahead.prop('tagName').replace( rx, '' ) : 0;

    // Use the first element’s level as a baseline.
    level || ( level = nextLevel - 1 );

    // If the heading level increases, add a new `ul` inside the trailing `li`.
    while ( nextLevel > level ) {
      ( $ul = $('<ul>') ).appendTo( $li );
      ( $li = $('<li>') ).appendTo( $ul );
      stack.push( $ul );
      level += 1;
    }

    // Or, if the heading level decreases, then close the prevailing `ul`. If
    // the root `ul` at the base of the stack is reached prematurely, wrap it
    // in another `ul`.
    while ( nextLevel < level ) {
      $ul = stack.pop() || $('<ul>').append( $('<li>').append( $ul ) );
      level -= 1;
    }
  }

  $fg.append( $ul );

  profile["ToC autogen"] = timeElapsed();
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

  profile["local ToC"] = timeElapsed();
});


// ### Backcrumb section footers
//
// (Not yet implemented; presently included manually in content markdown).
$( function () {
  "&#x23ce;"
});


// ### Chrome-element toggling on touch devices
//
$( function () {
  var chrome;

  // Delegate touch events. Upon a complete stationary touch, invoke `toggle`
  // on the stateful `chrome` object.
  ( function () {
    var touchPending;

    $('body > .container').on({
      touchstart: function ( event ) {
        if ( event.target.href ) return;
        touchPending = true;
      },
      touchmove: function ( event ) {
        if ( !touchPending ) return;
        touchPending = false;
      },
      touchend: function ( event ) {
        if ( !touchPending ) return;
        event.preventDefault();
        touchPending = false;
        chrome.toggle();
      }
    });

    // Touches on the ToC should not propagate to the container.
    $('body > .container > .toc')
      .on( 'touchstart touchmove touchend', function ( event ) {
        event.stopPropagation();
      });
  }() );

  chrome = ( function () {
    var $body = $('body');

    function action () {
      var transition = this;
      function end () { transition.end(); }
      transition.set( 'handle', setTimeout( end, transition.get('delay') ) );
    }

    function abort () {
      clearTimeout( this.get('handle') );
    }

    var chrome = {};
    state( chrome, 'abstract', {
      data: { delay: 400 },

      Visible: state( 'initial default', {
        enter: function () {
          $body.removeClass('chrome-revealing')
               .addClass('chrome-visible');
        },
        toggle: function () {
          this.state('-> Hidden');
        }
      }),

      Hidden: state({
        enter: function () {
          $body.removeClass('chrome-hiding')
               .addClass('chrome-hidden');
        },
        toggle: function () {
          this.state('-> Visible');
        }
      }),

      transitions: {
        Revealing: {
          target: 'Visible', action: action, abort: abort,
          enter: function () {
            $body.removeClass('chrome-hidden chrome-hiding')
                 .addClass('chrome-revealing');
          },
          toggle: function () {
            this.state('-> Hidden');
          }
        },
        Hiding: {
          target: 'Hidden', action: action, abort: abort,
          enter: function () {
            $body.removeClass('chrome-visible chrome-revealing')
                 .addClass('chrome-hiding');
          },
          toggle: function () {
            this.state('-> Visible');
          }
        }
      }
    });

    return chrome;
  }() );

  profile["chrome toggle on touch"] = timeElapsed();
});

// ### Navigation buttons
//
$( function () {
  if ( !navigator.standalone ) return;

  var $ul = $('<ul class="navigation">');

  0&&
  ( function () {
    var $li = $('<li class="back">');
    $('<a href="javascript:void(0)">')
      .on( 'click', function ( event ) {
        event.preventDefault();
        window.history.back();
      })
      .appendTo( $li );
    $li.appendTo( $ul );
  }() );

  0&&
  ( function () {
    var $li = $('<li class="forward">');
    $('<a href="javascript:void(0)">')
      .on( 'click', function ( event ) {
        event.preventDefault();
        window.history.forward();
      })
      .appendTo( $li );
    $li.appendTo( $ul );
  }() );

  ( function () {
    var $li = $('<li class="reload">');
    $('<a href="javascript:void(0)">')
      .on( 'click', function ( event ) {
        event.preventDefault();
        window.location.reload( true );
      })
      .appendTo( $li );
    $li.appendTo( $ul );
  }() );

  $ul.appendTo('.controls');

  profile["navigation buttons"] = timeElapsed();
})


// ### Switches
//
$( function () {
  var $ul = $('<ul class="switches">');

  ( function () {
    var $toc = $('.toc');
    if ( !$toc.length ) return;

    ( function ( $li ) {
      var handle;

      function hide () { $toc.addClass('hidden'); }

      $('<a href="javascript:void(0)">')
        .on( 'click', function ( event ) {
          event.preventDefault();

          if ( $toc.hasClass('toggled-hidden') ) {
            $toc.removeClass('hidden');
          } else {
            handle && clearTimeout( handle );
            handle = setTimeout( hide, 400 );
          }
          $toc.toggleClass('toggled-hidden');

          event.stopPropagation();
        })
        .appendTo( $li );

      return $li;

    }( $('<li class="toggle-toc active">') ) )
      .appendTo( $ul );
  }() );

  $ul.appendTo('.controls');

  profile["switch buttons"] = timeElapsed();
});


// ### Polyglot
//
// Assumes contiguous `.highlight` code blocks to be linguistically analagous,
// and groups their contents into a single common `div.highlight` container.
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

  // Display all unpaired `pre` blocks.
  $('.highlight pre').not('.polyglot pre').show();

  profile["polyglot"] = timeElapsed();
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

  var languages = [ 'javascript', 'coffeescript' ];
  var cardinality = languages.length;
  var i, name;

  var language = {
    selected     : window.localStorage && localStorage.getItem('language')
                     || languages[0],
    javascript   : { $elements: null, $control: null },
    coffeescript : { $elements: null, $control: null }
  };


  function $pageScrollTop () {
    return $('html').scrollTop() || $('body').scrollTop();
  }

  function $topElementInView () {
    var $els = $('.content .body').children(
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
    return $('<li class="' + className + ' inactive">')
      .append( $('<a href="javascript:void(0)">') );
  }

  function makeListenerFor ( activeLanguage ) {
    var initialized = false;

    return function ( event ) {
      var hiddenLanguage, $el, localOffset;

      event.preventDefault();
      event.stopPropagation();

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
      language[ hiddenLanguage ].$elements
        .hide();

      language[ activeLanguage ].$elements
        .show();

      // Restore the page’s scroll position to keep the viewport anchored to
      // the location of its topmost element.
      if ( $el && $el.length ) {
        $page.scrollTop( $el.offset().top - localOffset );
      }

      // Update the UI button states.
      initialized &&
      language[ hiddenLanguage ].$control
        .addClass('inactive')
        .removeClass('active');

      language[ activeLanguage ].$control
        .addClass('active')
        .removeClass('inactive');

      // Persist the preference.
      language.selected = activeLanguage;
      if ( window.localStorage ) {
        localStorage.setItem( 'language', activeLanguage );
      }

      // Simulate a resize event, for benefit of the ToC viewport rect.
      $window.resize();
    };
  }

  // Define each language’s set of polyglottal `pre` elements.
  for ( i = 0; i < cardinality; i++ ) {
    name = languages[i];
    language[ name ].$elements = $polyglotPre.has( 'code.' + name );
  }

  // Get references to the language-preference controls. If they are not
  // already present, then add them.
  if ( $ul.length ) {
    for ( i = 0; i < cardinality; i++ ) {
      name = languages[i];
      language[ name ].$control = $( 'li.' + name, $ul );
    }
  } else {
    $ul = $('<ul class="languages">');
    for ( i = 0; i < cardinality; i++ ) {
      name = languages[i];
      $ul.append( language[ name ].$control = $item( name ) );
    }
    $ul.appendTo('.controls');
  }

  // Create event listeners and delegate them to the language controls.
  for ( i = 0; i < cardinality; i++ ) {
    name = languages[i];
    language[ name ].$control.on( 'click', makeListenerFor( name ) );
  }

  // Simulate a `click` event to initialize the UI and code blocks.
  language[ language.selected ].$control.click();

  profile["language preferences"] = timeElapsed();
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
    'a[href^="/blog"]',
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

  profile["lightsticks"] = timeElapsed();
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

  // A reusable object that holds the output of the `locate` function.
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
    if ( $fg.children().length === 0 ) return;

    $a = $( 'li a', $toc );
    if ( $a.length < 2 ) return;

    cachedLocationData = {};
    frags = [];
    for ( i = 0, l = $a.length; i < l; i++ ) {
      frags[i] = $a[i].getAttribute('href');
    }
    indices = O.invert( frags );
    positions = {};

    $window
      .on( 'scroll', refresh )
      .on( 'load resize orientationchange', reflow )
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
    var l                   = $a.length;

    var $topAnchor          = $a.filter( 'a[href=' + data.topId    + ']' );
    var $bottomAnchor       = $a.filter( 'a[href=' + data.bottomId + ']' );

    var topIndex            = $a.index( $topAnchor );
    var bottomIndex         = $a.index( $bottomAnchor );

    var $preTop             = topIndex    > 0      && $a.eq( topIndex - 1 );
    var $postTop            = topIndex    < l - 1  && $a.eq( topIndex + 1 );
    var $preBottom          = bottomIndex > 0      && $a.eq( bottomIndex - 1 );
    var $postBottom         = bottomIndex < l - 1  && $a.eq( bottomIndex + 1 );

    var topAnchorTop        = $topAnchor.position().top;
    var topAnchorHeight     = $topAnchor.height();
    var bottomAnchorTop     = $bottomAnchor.position().top;
    var bottomAnchorHeight  = $bottomAnchor.height();

    var topPaddingTop = $preTop ?
      0.5 * ( topAnchorTop - ( $preTop.position().top + $preTop.height() ) ) :
      TOC_ANCHOR_PADDING;
    var topPaddingBottom = $postTop ?
      0.5 * ( $postTop.position().top - ( topAnchorTop + topAnchorHeight ) ) :
      TOC_ANCHOR_PADDING;
    var bottomPaddingTop = $preBottom ?
      0.5 * ( bottomAnchorTop -
        ( $preBottom.position().top + $preBottom.height() ) ) :
      TOC_ANCHOR_PADDING;
    var bottomPaddingBottom = $postBottom ?
      0.5 * ( $postBottom.position().top -
        ( bottomAnchorTop + bottomAnchorHeight ) ) :
      TOC_ANCHOR_PADDING;

    // Determine the precise vertical dimensions of the viewport rect, based
    // on the fraction of the corresponding document sections that are visible.
    var top     = topAnchorTop - topPaddingTop +
                    data.topFraction * ( topAnchorHeight + topPaddingTop +
                      topPaddingBottom );
    var bottom  = bottomAnchorTop - bottomPaddingTop +
                    data.bottomFraction * ( bottomAnchorHeight +
                      bottomPaddingTop + bottomPaddingBottom );

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

  profile["ToC viewport"] = timeElapsed();
}() );


// ### Source file-picker menu
//
$( function () {
  var $bodySource = $('body.source');
  if ( !$bodySource.length ) return;
  var $sourceTitle = $( '.source-title', $bodySource );
  var $sourceMenu = $( '.source-menu', $bodySource );

  $(document).on( 'click', function () {
    $sourceMenu.hide();
  });
  $sourceMenu.on( 'click', function ( event ) {
    if ( !navigator.standalone ) event.stopPropagation();
  });
  $sourceTitle.on( 'click', function ( event ) {
    $sourceMenu.toggle();
    if ( !navigator.standalone ) event.stopPropagation();
  });

  profile["source file menu"] = timeElapsed();
});


// ### Corrections and enhancements to pygments classifications
//
$( function () {

  // The pygments module used by gh-pages appears to render CoffeeScript
  // strings with a generic span class of `s`, rather than `s1` or `s2`
  // according to whether the string is enclosed with single- or double-quotes.
  $('code.coffeescript span.s').each( function () {
    var $this = $(this);
    $this.addClass( /^'.*'$/.test( $this.text() ) ? 's1' : 's2' );
  });
  profile["pygments: coffee `s1`/`s2`"] = timeElapsed();

  var $pre = $('.highlight pre');
  if ( !$pre.length ) return;

  // The pygments corrections are largely cosmetic, and can be expensive on low
  // powered devices when rendering very large pages, so use a profile of the
  // `$pre` query as a heuristic to determine whether or not to proceed.
  profile["pygments: initial query"] = timeElapsed();
  if ( profile["pygments: initial query"] > 2.0 ) return;

  // classify param-less arrows as functions.
  $( 'span.o:contains("->"), span.o:contains("=>")', $pre )
    .addClass('nf');
  profile["pygments: arrows to `nf`"] = timeElapsed();

  // Split trailing assignment operator from `nv|vi`.
  $pre = $('.highlight pre');
  $( 'span.nv, span.vi, span.vf', $pre ).each( function () {
    var $this = $(this);
    var match = /(.*?)(\s*)([=:])(\s*)$/.exec( $this.text() );
    if ( match ) {
      $this
        .text( match[1] )
        .after( match[2] + '<span class="o">' + match[3] + '</span>' + match[4] );
    }
  });
  profile["pygments: split asn op"] = timeElapsed();

  // Trim trailing whitespace from identifiers.
  $( 'span.nf, span.vi, span.vf', $pre ).each( function () {
    var $this = $(this);
    var match = /(.*?)(\s*)$/.exec( $this.text() );
    if ( match ) $this.text( match[1] ).after( match[2] );
  });
  profile["pygments: trim whitespace"] = timeElapsed();

  // Classify `this` and @-sigil expressions as instance variables.
  $( 'span.k:contains("this")', $pre )
    .addClass('vi').removeClass('k');
  $( 'span.err:contains("@")', $pre )
    .addClass('vi').removeClass('err');
  $( 'span.nx', $pre ).filter( function () {
    return /^@/.test( $(this).text() );
  })
    .addClass('vi').removeClass('nx');
  profile["pygments: this/@ as ivar"] = timeElapsed();

  // Classify Coffee-specific keywords correctly.
  $( 'span.nx', $pre )
    .filter( function () {
      return /^(do|loop|when|unless|until)$/.test( $(this).text() );
    })
    .add( $( 'span.k:contains("for")', $pre ).next('span.nx:contains("own")') )
    .addClass('k').removeClass('nx');
  profile["pygments: coffee keywords"] = timeElapsed();

  // Classify word operators correctly.
  ( function () {
    var rx = /^(new|typeof|void|delete|of|in|instanceof|yield)$/;
    $( 'span.k', $pre ).each( function () {
      var $this = $(this);
      if ( rx.test( $this.text() ) ) {
        $this.addClass('o').removeClass('k');
      }
    });
  }() );
  profile["pygments: word operators"] = timeElapsed();

  // Split punctuators into distinct `span`s.
  $( 'span.p', $pre ).each( function () {
    var $this = $(this);
    var text = $this.text();
    if ( text.length < 2 ) return;
    var chars = text.split('');
    var i = 0, l = chars.length, html = '';
    while ( i < l ) {
      html += '<span class="p">' + chars[i] + '</span>';
      i++;
    }
    $this.replaceWith( html );
  });
  profile["pygments: split punctuators"] = timeElapsed();

  // Classify member-access tokens as operators instead of punctuators.
  ( function () {
    var stack = [];

    $( 'span.p', $pre ).each( function () {
      var $this = $(this);
      var text = $this.text();
      var isMemberOperator;

      if ( text === '[' ) {
        isMemberOperator = this.previousSibling.nodeType !== 3 &&
          /[@$\)\]\}\w\?]$/.test( $this.prev().text() );
        stack.push( isMemberOperator );
      } else if ( text === ']' ) {
        isMemberOperator = stack.pop();
      } else return;

      if ( isMemberOperator ) {
        $this.addClass('o').removeClass('p');
      }
    });
  }() );
  profile["pygments: member square brackets"] = timeElapsed();

  // Classify paired punctuators.
  $( 'span.p', $pre ).each( function () {
    var $this = $(this);
    if ( /^[\[\]]$/.test( $this.text() ) ) $this.addClass('sb');
    if ( /^[\{\}]$/.test( $this.text() ) ) $this.addClass('cb');
  });
  profile["pygments: paired punctuators"] = timeElapsed();

  // Break apart coffeescript productions:
  ( function () {
    var $$ = $('body.source .highlight pre, .highlight pre code.coffeescript');

    // arrow function signatures
    ( function () {
      var $fns = $( 'span.nf', $$ );
      var text, el, i, match, html, part;
      var rx = /\(\)|\[\]|\{\}|[(){}\[\]@,]|[$_A-Za-z][$\w]*|[\-=]>\s*|\S+|\s+/g;
      var allWhitespace = /^\s+$/;
      var punctuation = /^[,]$/;
      for ( i = 0; i < $fns.length; i++ ) {
        el = $fns[i];
        text = el.textContent;
        html = '';
        while ( ( match = rx.exec( text ) ) !== null ) {
          part = match[0];
          if ( allWhitespace.test( part ) ) {
            html += part;
          } else if ( punctuation.test( part ) ) {
            html += '<span class="p">' + part + '</span>';
          } else {
            html += '<span>' + part + '</span>';
          }
        }
        el.innerHTML = html;
      }
    }() );
    profile["parse arrow signatures"] = timeElapsed();

    // @-sigils
    ( function () {
      var $ivars = $( 'span.vi', $$ );
      var rx = /^(@)(.+)/;
      var i, el, match;
      for ( i = 0; i < $ivars.length; i++ ) {
        el = $ivars[i];
        match = rx.exec( el.textContent );
        if ( match != null ) {
          el.innerHTML = '<span>@</span><span>' + match[2] + '</span>';
        }
      }
    }() );
    profile["parse @-sigils"] = timeElapsed();

    // property assignments
    ( function () {
      var lexer = /(?:[$_A-Za-z][$\w]*|[\.:]|\s+|[\+\-\*\/%&\|\^]?=)/g;
      var rxTable = {
        'nx'    : /^[$_A-Za-z][$\w]*$/,
        'o mem' : /^\.$/,
        'p'     : /^:$/,
        ''      : /^\s+$/,
        'o asn' : /^[\+\-\*\/%&\|\^]?=$/
      };
      var $nv = $( 'span.nv', $$ );
      var i, el, text, tokens, match, length, tags, j, token, key, seq, html, tag;

      for ( i = 0; i < $nv.length; i++ ) {
        el = $nv[i];
        text = el.textContent;

        // lex out the tokens (including contiguous whitespace blocks)
        tokens = [];
        while ( match = lexer.exec( text ) ) tokens.push( match[0] );
        length = tokens.length;
        if ( length < 2 ) continue;

        // do preliminary class-tagging of tokens
        tags = [];
        for ( j = 0; j < length; j++ ) {
          token = tokens[j];
          for ( key in rxTable ) if ( rxTable[ key ].test( token ) ) {
            tags.push( key );
            break;
          }
        }

        // reclassify identifier tokens
        for ( j = 0; j < length; j++ ) {
          // create a tag sequence of [lookbehind, tag, lookahead]
          seq = ( j > 0 ? tags[ j - 1 ] : '' ) + ',' +
                ( tag = tags[j] ) + ',' +
                ( j < length - 1 ? tags[ j + 1 ] : '' );
          if ( /^,nx,$/.test( seq ) ) {
            tags[j] = 'nv';
          } else if ( /^o mem,nx,/.test( seq ) ) {
            tags[j] = 'np';
          }
        }

        // compile html string from tokens and tagged class attributes
        html = '';
        for ( j = 0; j < length; j++ ) {
          tag = tags[j];
          if ( tag ) {
            html += '<span class="' + tag + '">' + tokens[j] + '</span>';
          } else {
            html += tokens[j];
          }
        }
        if ( html ) $(el).replaceWith( $(html) );
      }
    }() );
    profile["property assignments"] = timeElapsed();

  }() );


  // classify operators by precedence
  ( function () {
    var table = {
      'mem' : /^[\.\[\]]$/,
      'new' : /^new$/,
      'inv' : /^[()]$/,
      'inc' : /^(\+\+|\-\-)$/,
      'una' : /^(\?|\!+|not|\~|\+|\-|typeof|delete)$/,
      'ar1' : /^(\*|\/|%)$/,
      'ar2' : /^[+-]$/,
      'bws' : /^(<<|>>>?)$/,
      'rel' : /^(<|<=|>|>=|of|in|instanceof)$/,
      'equ' : /^(is|isnt|!==?|===?)$/,
      'bwa' : /^\&$/,
      'bwx' : /^\^$/,
      'bwo' : /^\|$/,
      'lga' : /^(&&|and)$/,
      'lgo' : /^(\|\||or)$/,
      'exi' : /^\?$/,
      'asn' : /^([\?\+\-\*\/%&\^\|]?=|<<=|>>>?=|::?)$/,
      'cma' : /^,$/,
      'fna' : /^[\-=]>$/
    };
    var $$ = $('body.source .highlight pre, .highlight pre code');
    $( 'span.o', $$ ).each( function () {
      var key, regex;
      var $this = $(this);
      var text = $this.text();
      var previousElement, previous, next;
      var ws = /\s+/;
      for ( key in table ) if ( ( regex = table[key] ).test( text ) ) {
        if ( key === 'una' ) {
          previous = this.previousSibling;
          next = this.nextSibling;
          previousElement = this.previousElementSibling;

          // distinguish unary +/- from arithmetic +/-
          if ( table.ar2.test() && next.nodeType === 3 ) {
            key = 'ar2';
          }

          // distinguish unary postfix existential ? from infix ?
          if ( text === '?' && previous.nodeType === 3 &&
              ws.test( previous.textContent ) ) {
            key = 'exi';
          }
        }
        $this.addClass(key);
        break;
      }
    });
  }() );
  profile["pygments: operator precedence"] = timeElapsed();


  // classify identifier or key (`nv`) preceding function (`nf`) as `vf`
  $( '.highlight pre span.nf' )
    .prev('span.o.asn')
    .prev('span.nv, span.np')
    .addClass('vf').removeClass('nv np');
  profile["pygments: function names"] = timeElapsed();


  console.log( profile );
});


// Hide ToC initially (applicable only when body width < 960)
$( function () {
  $('.toc').addClass('toggled-hidden hidden');
});


// Token highlighting
$( function () {
  timeElapsed();
  var $spans = $('.highlight pre span');
  profile["query spans"] = timeElapsed();

  var $tokens = ( function () {
    var excluded = /\b(s2|si|sr|c|c1|cm|cp|cs|p|nf)\b/;
    var i, value, out = [];
    for ( i = 0; i < $spans.length; i++ ) {
      value = $spans[i];
      if ( !excluded.test( value.className ) ) out.push( value );
    }
    return $(out);
  }() );
  profile["query tokens"] = timeElapsed();

  var $container = $('body > .container');
  var $locator = $('<canvas class="token-locator">').appendTo( $container );
  var locatorCanvas = $locator[0];
  var locatorCanvasContext = locatorCanvas.getContext('2d');

  var INDICATOR_WIDTH = 8.0;
  var INDICATOR_HEIGHT = 5.0;
  var INDICATOR_HALF_HEIGHT = INDICATOR_HEIGHT / 2.0;

  var $selection;
  var rxThis       = /^(?:@|this)$/;
  var rxPrototype  = /^(?:::|prototype)$/;
  var rxLNot       = /^(?:\!|not)$/;
  var rxLAnd       = /^(?:&&|and)$/;
  var rxLOr        = /^(?:\|\||or)$/;
  var rxEq         = /^(?:===|is)$/;
  var rxNEq        = /^(?:\!==|isnt)$/;
  var rxCurly      = /^[{}]$/;
  var rxSquare     = /^[\[\]]$/;
  var rxParen      = /^[()]$/;

  function updateTokenLocator () {

    // Resize to window
    var canvasWidth = locatorCanvas.width = INDICATOR_WIDTH;
    var canvasHeight = locatorCanvas.height = window.innerHeight;

    if ( $selection == null ) {
      $locator.removeClass('visible');
      return;
    }

    var containerHeight = $container.height();
    var c = locatorCanvasContext;
    var i, y;

    c.fillStyle = 'rgba( 255, 238, 0, 0.707 )';
    c.strokeStyle = 'rgba( 0, 0, 0, 0.1 )';
    c.clearRect( 0, 0, canvasWidth, canvasHeight );

    for ( i = 0; i < $selection.length; i++ ) {
      y = $( $selection[i] ).offset().top;
      if ( !y ) continue;
      y = canvasHeight * y / containerHeight - INDICATOR_HALF_HEIGHT;
      c.fillRect( 0, y, INDICATOR_WIDTH, INDICATOR_HEIGHT );
      c.strokeRect( 0.5, y, INDICATOR_WIDTH, INDICATOR_HEIGHT - 1 );
    }

    $locator.addClass('visible');
  }

  function changeSelection ( event ) {
    var selectedText = $(this).text();
    if ( $selection != null ) $selection.removeClass('sought');

    $selection = $tokens.filter( function () {
      var $this = $(this);
      var tokenText = $this.text();

      if (
        tokenText === selectedText ||
        rxThis.test( tokenText ) && rxThis.test( selectedText ) ||
        rxPrototype.test( tokenText ) && rxPrototype.test( selectedText )
      ) return true;

      if (
        rxCurly.test( tokenText ) && rxCurly.test( selectedText ) ||
        rxSquare.test( tokenText ) && rxSquare.test( selectedText ) ||
        rxParen.test( tokenText ) && rxParen.test( selectedText )
      ) return true;

      if ( $this.hasClass('o') ) return (
        rxLNot.test( tokenText ) && rxLNot.test( selectedText ) ||
        rxLAnd.test( tokenText ) && rxLAnd.test( selectedText ) ||
         rxLOr.test( tokenText ) &&  rxLOr.test( selectedText ) ||
          rxEq.test( tokenText ) &&   rxEq.test( selectedText ) ||
         rxNEq.test( tokenText ) &&  rxNEq.test( selectedText )
      );

      return false;
    });

    $selection.addClass('sought');
    updateTokenLocator();
    event.stopPropagation();
  }

  function clearSelection ( event ) {
    if ( $selection != null ) {
      $selection.removeClass('sought');
      $selection = null;
    }
    $locator.removeClass('visible');
  }

  $tokens.on( 'click', changeSelection );
  $(document).on( 'click', clearSelection );
  $(window).on( 'resize', updateTokenLocator );
});


}( jQuery ) );
