;( function ( $ ) {

var $page = $('html, body');


// Anchored headings
$( function () {
  var rx = /^\#(.*)/;
  var $ha = $('h1, h2, h3, h4, h5').children('a[href^="#"]');
  $ha.each( function () {
    var $this = $(this);
    var id = $this.attr('href').replace( rx, "$1" );
    $this.parent().attr( 'id', id );
  });
});

// Local tables of contents
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

// Backcrumb section footers
$( function () {
  "&#x23ce;"
});

// Language preferences
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

  function $pageScrollTop () {
    return $('html').scrollTop() || $('body').scrollTop();
  }

  function $headingInView () {
    var $els = $('.span10').children(
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
    };
  }

  // Establish sets of paired JS/CS pre blocks
  javascript.$elements =
    $pre.has('code.javascript').filter( function () {
      return $(this).parent().next().has('pre > code.coffeescript').length;
    });
  coffeescript.$elements =
    $pre.has('code.coffeescript');

  // Display all unpaired pre blocks
  $pre.not( javascript.$elements ).not( coffeescript.$elements ).show();

  // Get language preference controls
  $ul = $('.controls ul.languages');
  if ( $ul.length ) {
    javascript.$control = $( 'li.javascript', $ul );
    coffeescript.$control = $( 'li.coffeescript', $ul );
  }
  // Or add them if not already present
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


// Lightsticks
( function () {
  var $li, patterns, i, l, pattern, $el, data;

  function addIndicated ( event ) {
    event.data.$el.addClass('indicated');
  }
  function removeIndicated ( event ) {
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
    pattern = patterns[i];
    $el = $li.has( pattern );
    data = { $el: $el };
    $( '.content ' + pattern + ', .topbar ul li ' + pattern )
      .on( 'mouseenter', data, addIndicated )
      .on( 'mouseleave', data, removeIndicated )
    ;
  }
}() );

}( jQuery ) );
