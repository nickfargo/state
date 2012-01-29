( function () {
	var io = {
		write: function () {}
	};

	var owner = function () {
		return this.owner();
	};

	var TextDocument = (function() {

		function TextDocument(url) {
			var text;
			this.url = url;
			text = '';
			this.text = function() {
				return text;
			};
			this.edit = function(newText) {
				text = newText;
				return this;
			};
			this.state();
		}

		TextDocument.prototype.save = function() {
			io.write(this.url, this.text());
			return this;
		};

		state(TextDocument.prototype, {
			test: function() {
				return console.log(this.name());
			},
			freeze: function() {
				var result;
				result = this.owner().save();
				this.change('Saved.Frozen');
				return result;
			},
			Saved: state('initial', {
				edit: function(newText) {
					var result;
					result = this.superstate().call('edit', newText);
					this.change('Dirty');
					return result;
				},
				save: owner,
				enter: function(event) {},
				exit: function(event) {},
				Frozen: state('final sealed', {
					edit: owner,
					freeze: owner,
					arrive: function(event) {}
				})
			}),
			Dirty: {
				save: function() {
					var result;
					result = this.superstate().call('save');
					this.change('Saved');
					return result;
				}
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
	
	doc1.state().go('Saved'); doc2.state().go('Saved');
	assert.strictEqual( doc1.state(), doc1.state('Saved'), "Initial state active" );
	doc1.edit('foo');
	assert.strictEqual( doc1.state(), doc1.state('Dirty'), "Edit causes transition from 'Saved' to 'Dirty'" );
	doc1.freeze();
	assert.strictEqual( doc1.state(), doc1.state('Saved.Frozen'), "`freeze` callable from 'Dirty', causes transition to 'Saved.Frozen'" );
});

})( QUnit );