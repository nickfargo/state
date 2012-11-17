( function () {
	var io = {
		write: function () {}
	};

	var owner = function () {
		return this.owner();
	};

	var TextDocument = ( function() {

		function TextDocument ( url ) {
			var text;
			this.url = url;
			text = '';
			this.text = function () {
				return text;
			};
			this.edit = function ( newText ) {
				text = newText;
				return this;
			};
			this.state();
		}

		TextDocument.prototype.save = function () {
			io.write( this.url, this.text() );
			return this;
		};

		state( TextDocument.prototype, {
			test: function () {
				return console.log( this.name() );
			},
			freeze: function () {
				var result;
				result = this.owner().save();
				this.change('Saved.Frozen');
				return result;
			},
			Saved: state( 'initial', {
				edit: state.method( function ( newText ) {
					var result;
					result = superstate.call( 'edit', newText );
					this.change('Dirty');
					return result;
				}),
				save: owner,
				enter: function () {},
				exit: function () {},
				Frozen: state( 'final sealed', {
					edit: owner,
					freeze: owner,
					arrive: function () {}
				})
			}),
			Dirty: {
				save: state.method( function () {
					var result;
					result = this.superstate().call('save');
					this.change('Saved');
					return result;
				})
			}
		});

		return TextDocument;

	})();

	this.TextDocument = TextDocument;
})();

1&&
( function ( assert ) {

module( "TextDocument" );

test( "TextDocument", function () {
	var	doc1 = new TextDocument,
		doc2 = new TextDocument;

	doc1.state().go('Saved');
	doc2.state().go('Saved');
	assert.ok(
		doc1.state().is('Saved'),
		"Initial state active"
	);
	
	doc1.edit('foo');
	assert.ok(
		doc1.state().is('Dirty'),
		"Edit causes transition from 'Saved' to 'Dirty'"
	);
	
	doc1.freeze();
	assert.ok(
		doc1.state().is('Frozen'),
		"`freeze` callable from 'Dirty', causes transition to 'Saved.Frozen'"
	);
});

})( QUnit );