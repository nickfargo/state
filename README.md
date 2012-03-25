# State.js

**State** is a micro-framework for expressing, manipulating, and recording *state* for any JavaScript object. Stateful objects can be used to model behavior, construct automata, and reason about changes undergone by the object over time.

**[Installation](#installation)** — **[Overview](#overview)** — **[Concepts](#concepts)** — **[Design Goals](#design-goals)** — **[Future Directions](#future-directions)**



<a name="installation" />
## Installation

The lone dependency of **State** is [**Zcore**](http://github.com/zvector/zcore/), a small library module that assists with object manipulation tasks such as differential operations and facilitating prototypal inheritance, and provides various other general-purpose functions.

**State** can be installed via [**npm**](http://npmjs.org/):

```
$ npm install state
```
```javascript
var state = require('state');
```

or included in the browser:

```html
<script src="zcore.js"></script>
<script src="state.js"></script>
```

which will expose the module at `window.state` (this can be reclaimed with a call to `state.noConflict();`).



<a name="overview" />
## Overview

### Four-step intro to State

1. The **State** module is exported as a function called `state`. This can be used in one of two ways: either to create a **state expression**, or to augment any JavaScript object with a state implementation:

    ```javascript
    // Returns a `StateExpression` based on the contents of `expression`.
    state( expression )

    // Creates a state implementation on `object` as defined by `expression`, and returns
    // the object’s initial `State`.
    state( object, expression )
    ```

2. The `expression` argument is an object literal that describes states, methods, and other features that will be governed by the state implementation of `object`:

    ```javascript
    var object = {
            method: function () { return "default"; }
        },
        expression = {
            State: {
                method: function () { return "stateful!"; }
            }
        };

    state( object, expression );
    ```

3. Subsequent to the call to `state`, the object’s new state implementation is exposed through an **accessor method**, also named `state`, that has been added to the object. Calling the accessor with no arguments queries the object for its **current state**, while providing a **selector** string queries the object for the specific `State` named by the selector.

    ```javascript
    object.state();
    object.state('State');
    ```

4. The current state may be changed by calling a method called `change()` (also aliased to `go()` and `be()`), to which is provided the name of the state to be targeted. Changing an object’s state allows it to exhibit different behavior:

    ```javascript
    object.state();                  // State '' (the top-level *root state*)
    object.method();                 // "default"
    object.state().change('State');  // State 'State'
    object.method();                 // "stateful!"
    object.state();                  // State 'State'
    ```

### Example

*(Hereafter all example code will be presented in both hand-rolled JavaScript and [CoffeeScript](http://coffeescript.org/) — please freely follow or ignore either according to taste.)*

```javascript
var obj = {
    greet: function () { return "Hello."; }
};

state( obj, {
    Formal: {
        greet: function () { return "How do you do?"; }
    },
    Informal: {
        greet: function () { return "Hi!"; }
    }
});

obj.greet(); // "Hello."
obj.state().change('Formal');
obj.greet(); // "How do you do?"
obj.state().change('Informal');
obj.greet(); // "Hi!"
obj.state().change('');
obj.greet(); // "Hello."
```

```coffeescript
obj = greet: -> "Hello."

state obj,
  Formal:
    greet: -> "How do you do?"
  Informal:
    greet: -> "Hi!"

obj.greet() # "Hello."
obj.state().change 'Formal'
obj.greet() # "How do you do?"
obj.state -> 'Informal' # An alternate way to instigate transitions
obj.greet() # "Hi!"
obj.state -> ''
obj.greet() # "Hello."
```

<a name="concepts" />
## Concepts

* [Expressions](#concepts--expressions) — States and their contents can be concisely expressed using a plain object literal, which, along with an optional set of attribute keywords, is passed into the `state()` function and interpreted into a formal **state expression** type.

* [Inheritance](#concepts--inheritance) — States are hierarchically nested in a tree structure: the **owner** object is given exactly one **root state**, which may contain zero or more **substates**, which may themselves contain further substates, and so on. A state inherits both from its **superstate**, with which it shares the same owner, as well as from any **protostate**, which is defined as the equivalently positioned state within a prototype of the owner object. Protostates have a higher inheriting precedence than superstates.

* [Attributes](#concepts--attributes) — A state expression may include **attributes** that can specially designate or constrain a state’s usage. For example: the `initial` attribute designates a state as the owner’s initial state, whereas the `final` attribute dictates that a state will disallow any further transitions once it has become active; an `abstract` state is one that cannot be current but may be inherited from by substates, while a `default` attribute marks such a substate as the primary redirection target for an abstract superstate, should a transition ever target the abstract state directly.

* [Data](#concepts--data) — Arbitrary **data** can be attached to each state, and inherited accordingly through protostates and superstates.

* [Methods](#concepts--methods) — Behavior is modeled by defining state **methods** that override the object’s methods *opaquely* with respect to consumers of the object, which need not be aware of the object’s current state, or even that a concept of state exists at all. State methods are invoked in the context of the state in which the method is defined, allowing for polymorphic features like invoking the overridden methods of a superstate.

* [Transitions](#concepts--transitions) — When an object is directed to change from one state to another, it does so by temporarily entering into a **transition** state. A state expression may include **transition expressions** that describe, given a specific pairing of origin and target states, a synchronous or asynchronous **action** to be performed over the duration of the transition.

* [Events](#concepts--events) — Listeners for specific **event** types can be bound to a state, which will be called in the context of the bound state as it is affected by a progressing transition (`depart`, `exit`, `enter`, `arrive`), as data bound to the state changes (`mutate`), or upon the state’s construction or destruction (`construct`, `destroy`). **State** also allows for custom typed events, which can be emitted from a particular state and propagated to listeners bound to the state itself as well as its protostates and superstates.

* [Guards](#concepts--guards) — A state may be outfitted with **guards** to govern its viability as a transition target, dependent on the outgoing state and any other conditions that may be defined. Guards are evaluated as either boolean values or predicates (boolean-valued functions).

* [History](#concepts--history) — Any state may be ordered to keep a **history** of its own internal state. Entries are recorded in the history anytime the given state is involved in a transition, or experiences a change to its `data` content. The history may be traversed in either direction, and elements replaced or pushed onto the stack at its current index. When a transition targets a **retained** state, it will consult that state’s history and redirect itself back to whichever of the state’s substates was most recently current.

<a name="concepts--expressions" />
### Expressions

A **state expression** defines the contents and structure of a `State` instance. A `StateExpression` object can be created using the exported `state()` function, and providing it a plain object map, optionally preceded by a string of whitespace-delimited attributes to be applied to the expressed state.

The contents of a state expression decompose into six categories: `data`, `methods`, `events`, `guards`, `substates`, and `transitions`. The object map supplied to the `state()` call can be categorized accordingly, or alternatively it may be pared down to a more convenient shorthand, either of which will be interpreted into a formal `StateExpression`.

To express the state implementation of the introductory example above, we could write:

```javascript
var longformExpression = state({
    methods: {
        greet: function () { return "Hello."; }
    },
    states: {
        Formal: {
            methods: {
                greet: function () { return "How do you do?"; }
            },
            events: {
                enter: function ( event ) { this.owner().wearTux(); }
            }
        },
        Informal: {
            methods: {
                greet: function () { return "Hi!"; }
            },
            events: {
                enter: function ( event ) { this.owner().wearJeans(); }
            }
        }
    }
});
```
```coffeescript
longformExpression = state
  methods:
    greet: -> "Hello."
  states:
    Formal:
      methods:
        greet: -> "How do you do?"
      events:
        enter: ( event ) -> @owner().wearTux()
    Informal:
      methods:
        greet: -> "Hi!"
      events:
        enter: ( event ) -> @owner().wearJeans()
```

Or we can cut out some of the explicit structure and allow the `StateExpression` interpreter to make some inferences about our abbreviated input:

```javascript
var shorthandExpression = state({
    greet: function () { return "Hello."; },

    Formal: {
        enter: function ( event ) { this.owner().wearTux(); },
        greet: function () { return "How do you do?"; }
    },
    Informal: {
        enter: function ( event ) { this.owner().wearJeans(); },
        greet: function () { return "Hi!"; }
    }
});
```
```coffeescript
shorthandExpression = state
  greet: -> "Hello."
  Formal:
    enter: ( event ) -> @owner().wearTux()
    greet: -> "How do you do?"
  Informal:
    enter: ( event ) -> @owner().wearJeans()
    greet: -> "Hi!"
```

Below is the internal procedure for interpreting `StateExpression` input:

1. If an entry’s value is a typed `StateExpression` or `TransitionExpression`, interpret it as such.

2. Otherwise, if an entry’s key is a category name, its value must be either `null` or an object to be interpreted in longform.

3. Otherwise, if an entry’s key matches a built-in event type, interpret the value as an event listener (or array of event listeners) to be bound to that event type.

4. Otherwise, if an entry’s key matches a guard action (i.e., `admit`, `release`), interpret the value as a guard condition (or array of guard conditions).

5. Otherwise, if an entry’s value is a function, interpret it as a method whose name is the key, or if the entry’s value is an object, interpret it as a substate whose name is the key.


<a name="concepts--inheritance" />
### Inheritance

#### Nesting states

As with classes or prototypal objects, states are modeled hierarchically, where a state may serve as a **superstate** of one or more **substates** that express ever greater specificity of their owner’s behavior and condition.

```javascript
var obj = {
    greet: function () { return "Hello."; }
};

state( obj, {
    Formal: {
        greet: function () { return "How do you do?"; }
    },
    Informal: {
        greet: function () { return "Hi!"; },

        Familiar: {
            hug: function ( other ) { /*...*/ return this; },

            greet: function ( other ) {
                this.owner().hug( other );
            },

            Intimate: {
                kiss: function ( betterHalf ) { /*...*/ return this; },

                greet: function ( betterHalf ) {
                    this.owner().hug( betterHalf ).kiss( betterHalf );
                }
            }
        }
    }
});
```

```coffeescript
obj = greet: -> "Hello."

state obj,
  Formal:
    greet: -> "How do you do?"
  
  Informal:
    greet: -> "Hi!"

    Familiar:
      hug: ( person ) -> ### ... ### this
      greet: ( person ) -> @owner().hug person

      Intimate:
        kiss: ( betterHalf ) -> ### ... ### this
        greet: ( betterHalf ) ->
          me = @owner()
          me.hug betterHalf
          me.kiss betterHalf
```

The state model is a classic tree structure, with a single **root state** as the basis for the object’s stateful implementation.

One noteworthy quality of the root state is that, while its place in the expression does not bear a name, it is not anonymous; the root state’s name is always the empty string `''`, which may be used by an object to change its state so as to exhibit its default behavior.

```javascript
obj.state().root() === obj.state('')    // true
obj.state().change('')                  // State ''
```
```coffeescript
obj.state().root() is obj.state ''      # true
obj.state -> ''                         # State ''
```

In addition to being the top-level node of the tree from which all of an object’s states inherit, the root state acts as the *default method store* for the object’s state implementation, containing methods originally defined on the object itself, for which now exist one or more stateful reimplementations elsewhere within the state tree. This capacity allows the *method delegation pattern* to work simply by always forwarding a method call on the object to the object’s current state; if no corresponding method override is defined within the current state or its superstates, **State** will as a last resort resolve the call to the original implementation held within the root state.

#### Inheriting states across prototypes

So far we’ve been creating stateful objects by applying the `state()` function directly to the object. Consider now the case of an object that inherits from a stateful prototype.

```javascript
function Host () {}
Host.prototype.greet = function () { return "Hello."; };
state( Host.prototype, {
    Formal: {
        greet: function () { return "How do you do?"; }
    },
    Informal: {
        greet: function () { return "Hi!"; }
    }
});

var host = new Host;
```

```coffeescript
class Host
  greet: -> "Hello."
  state @::,
    Formal:
      greet: -> "How do you do?"
    Informal:
      greet: -> "Hi!"

host = new Host
```

Since the instance object `host` in the code above inherits from `Host.prototype`, given what’s been covered to this point, it may be expected that instigating a transition via `host.state().change('Formal')` would take effect on `Host.prototype`, in turn affecting all other instances of `Host` as well. While it is desirable to share stateful behavior through prototypes, each instance must be able to maintain state and undergo changes to its state independently.

**State** addresses this by lazily outfitting each instance with its own state implementation when one does not exist already. This new implementation will itself be empty, but will inherit all content from the state implementation of the prototype. Most importantly, it allows the instance to experience its own state changes, without also indirectly affecting all of its fellow inheritors.

```javascript
Host.prototype.state();              // State ''
'state' in host;                     // true
host.hasOwnProperty('state');        // false
host.state();                        // State ''
host.hasOwnProperty('state');        // true
host.state().isVirtual();            // false
host.greet();                        // "Hello."
host.state().change('Informal');     // State 'Informal'
host.state().isVirtual();            // true
host.greet();                        // "Hi!"
Host.prototype.state();              // State ''
```
```coffeescript
Host::state()                        # State ''
'state' of host                      # true
host.hasOwnProperty 'state'          # false
host.state()                         # State ''
host.hasOwnProperty 'state'          # true
host.state().isVirtual()             # false
host.greet()                         # "Hello."
host.state -> 'Informal'             # State 'Informal'
host.state().isVirtual()             # true
host.greet()                         # "Hi!"
Host::state()                        # State ''
```

When an accessor method (`obj.state()`) is called, it checks the context object (`obj`) to ensure that it has its own accessor method. If it doesn’t, and is instead inheriting from a prototype, then an empty state implementation is created for the inheritor, which in turn generates a corresponding accessor method (`obj.state()`), to which the original call is then forwarded.

Even though the inheritor’s state implementation is empty, it identifies the prototype’s states as its **protostates**, from which it inherits all methods, data, events, etc. contained within. The inheritor may adopt a protostate as its current state just as it would with a state of its own, in which case a temporary **virtual state** is created within the state implementation of the inheritor, as a stand-in for the protostate.

This system of protostates and virtual states allows an object’s state implementation to benefit from the prototypal reuse patterns of JavaScript without the states themselves having to maintain any direct prototypal relationship with each other.


<a name="concepts--attributes" />
### Attributes

State expressions may include **attributes** as a string argument that precedes the object map provided to a `state()` call:

```javascript
state( obj, 'abstract', {
    Alive: state( 'default initial', {
        update: function () { /*...*/ }
    }),
    Dead: state( 'final', {
        update: function () { /*...*/ }
    })
});
```
```coffeescript
state obj, 'abstract',
  Alive: state 'default initial',
    update: -> # ...
  Dead: state 'final',
    update: -> # ...
```

**Implemented** (and *proposed*) attributes include:

* **initial** — Marking a state `initial` specifies which state is to be assumed immediately following the `state()` application. No transition or any `enter` or `arrive` events result from this initialization.

* *conclusive* — (Reserved; not presently implemented.) Once a `conclusive` state is entered, it cannot be exited, although transitions may still freely traverse within its substates.

* **final** — Once a state marked `final` is entered, no further transitions are allowed.

* **abstract** — An abstract state cannot itself be current. Consequently a transition target that points to a state marked `abstract` is redirected to one of its substates.

* **default** — Marking a state `default` designates it as the actual target for any transition that targets its abstract superstate.

* **sealed** — A state marked `sealed` cannot have substates.

* *retained* — (Reserved; not presently implemented.) A `retained` state is one that preserves its own internal state, such that, after the state has become no longer active, a subsequent transition targeting that particular state will automatically be redirected to whichever of its descendant states was most recently current.

* *history* — (Reserved; not presently implemented.) Marking a state with the `history` attribute causes its internal state to be recorded in a sequential history. Whereas a `retained` state is concerned only with the most recent internal state, a state’s history can be traversed and altered, resulting in transitions back or forward to previously or subsequently held internal states.

* *shallow* — (Reserved; not presently implemented.) Normally, states that are `retained` or that keep a `history` persist their internal state *deeply*, i.e., with a scope extending over all of the state’s descendant states. Marking a state `shallow` limits the scope of its persistence to its immediate substates only.



<a name="concepts--data" />
### Data

Arbitrary **data** can be attached to each state, and inherited accordingly through protostates and superstates. Data may be declared within an expression, and both read and written using the `data` method:

```javascript
function Chief () {
    state( this, {
        Enraged: {
            Thermonuclear: {
                data: {
                    action: 'destroy'
                }
            }
        }
    });

    this.state('Thermonuclear').data({ budget: Infinity });
}
state( Chief.prototype, {
    data: {
        budget: 1e10
    },
    Enraged: {
        data: {
            target: 'Qooqol',
            action: 'beat'
        }
    }
}

var ceo = new Chief;
ceo.state().data();               // { budget: 10000000000 }
ceo.state().be('Enraged');
ceo.state().data();               // { target: 'Qooqol', action: 'beat', budget: 10000000000 }
ceo.state().go('Thermonuclear');
ceo.state().data();               // { target: 'Qooqol', action: 'destroy', budget: Infinity }
```
```coffeescript
class Chief
  state @::,
    data:
      budget: 1e10
    Enraged:
      data:
        target: 'Qooqol'
        action: 'beat'

  constructor: ->
    state this,
      Enraged:
        Thermonuclear:
          data:
            action: 'destroy'

    @state('Thermonuclear').data budget: Infinity

ceo = new Chief
ceo.state().data()                 # { budget: 10000000000 }
ceo.state().be 'Enraged'
ceo.state().data()                 # { target: 'Qooqol', action: 'beat', budget: 10000000000 }
ceo.state().go 'Thermonuclear'
ceo.state().data()                 # { target: 'Qooqol', action: 'destroy', budget: Infinity }
```


<a name="concepts--methods" />
### Methods

When state is applied to an object, any methods already present on the object for which there exist one or more stateful implementations within the state expression will be relocated to the root state and replaced on the object with a special **delegator** method. This delegator redirects any incoming calls to the object’s current state, which will locate and invoke the proper stateful implementation of the method. Should no active states contain an implemenation for a called method, the original implementation is still guaranteed to be available on the root state.

Whereas the context of a method invocation is normally the object to which the method belongs, a state method is invoked in the context of the *state* to which it belongs, or if the method is inherited from a protostate, in the context of the local inheriting state. This lexical approach of using the state rather than the object as the method’s context allows for polymorphic idioms such as calling up to a superstate’s implementation of the method. Despite the difference in context, however, the owner object always remains available from inside the method by calling `this.owner()`.

This example of a simple `Document` class demonstrates method inheritance and polymorphism. Note the points of interest that are numbered in trailing comments and explained below:

```javascript
var fs = require('fs'),
    state = require('state');

function Document ( location, text ) {
    this.location = function () {
        return location;
    };
    this.read = function () {
        return text;
    };
    this.edit = function ( newText ) { // [1]
        text = newText;
        return this;
    };
}
state( Document.prototype, 'abstract', {
    freeze: function () { // [3]
        var result = this.call( 'save' ); // [4]
        this.change( 'Saved.Frozen' );
        return result;
    },

    Dirty: {
        save: function () {
            var transition,
                self = this.owner();

            function callback ( err ) {
                if ( err ) return transition.abort( err ).change( 'Dirty' );
                return transition.end();
            }
            
            fs.writeFile( self.location(), self.read(), callback );
            transition = this.change( 'Saved' );
            return self;
        }
    },
    Saved: state( 'initial', {
        edit: function () {
            var result = this.superstate().apply( 'edit', arguments ); // [2]
            this.change( 'Dirty' );
            return result;
        },

        Frozen: state( 'final', {
            edit: function () {},
            freeze: function () {},
        })
    }),

    transitions: {
        Writing: {
            origin: 'Dirty',
            target: 'Saved',
            action: function () {}
        }
    }
});
```
```coffeescript
fs = require 'fs'
state = require 'state'

class Document
  constructor: ( location, text ) ->
    @location = -> location
    @read = -> text
    @edit = ( newText ) -> # [1]
      text = newText
      this

  state @::, 'abstract',
    freeze: -> # [3]
      result = @call 'save' # [4]
      @change 'Saved.Frozen'
      result

    Dirty:
      save: ->
        self = @owner()
        fs.writeFile self.location(), self.read(), ( err ) ->
          if err then return transition.abort( err ).change 'Dirty'
          do transition.end
        transition = @change 'Saved'
        self
    Saved: state 'initial',
      edit: ->
        result = @superstate().apply 'edit', arguments # [2]
        @change 'Dirty'
        result

      Frozen: state 'final',
        edit: ->
        freeze: ->

    transitions:
      Writing: origin: 'Dirty', target: 'Saved', action: ->
```

1. A “privileged” method `edit` is defined inside the constructor, closing over a private variable `text` to which it requires access. Later, when state is applied to the object, this method will be moved to the root state, and a delegator will be added to the object in its place.

2. An overridden implementation of `edit`, while not closed over the constructor’s private variable `text`, is able to call up to the original implementation using `this.superstate().apply('edit')`.

3. The `freeze` method is declared on the abstract root state, callable from states `Dirty` and `Saved` (but not `Frozen`, where it is overridden with a no-op).

4. The `save` method, which only appears in the `Dirty` state, is still callable from other states, as its presence in `Dirty` causes a no-op version of the method to be automatically added to the root state. This allows `freeze` to safely call `save` despite the possiblity of being in a state (`Saved`) with no such method.


<a name="concepts--transitions" />
### Transitions

Whenever an object’s current state changes, a **transition** state is created, which temporarily assumes the role of the current state while the object is travelling from its source state to its target state.

A state expression may include any number of **transition expressions**, which define some **action** to be performed, either synchronously or asynchronously, along with definitions for `origin` and `target` states to which the transition should apply. When an object undergoes a state change, it finds the appropriate transition expression for the given origin and target, and from that creates a new `Transition` instance.

The lifecycle of a transition consists of a stepwise traversal through the state tree, from the `source` node to the `target` node, where the **domain** of the transition is represented by the state that is the least common ancestor node between `source` and `target`. At each step in the traversal, the transition instance acts as a temporary substate of the local state, such that event listeners may expect to inherit from the states in which they are declared.

The traversal sequence is decomposable into an ascending phase, an action phase, and a descending phase. During the ascending phase, the object emits a `depart` event on the `source` and an `exit` event on any state that will be rendered inactive as a consequence of the transition. The transition then reaches the top of the domain and moves into the action phase, whereupon it executes any `action` defined in its associated transition expression. Once the action has ended, the transition then proceeds with the descending phase, emitting `enter` events on any state that is rendered newly active, and concluding with an `arrival` event on its `target` state. (*See section [Transition event sequence](#concepts--events--transition-event-sequence)*.)

Should a new transition be started while a transition is already in progress, an `abort` event is emitted on the previous transition. The new transition will reference the aborted transition as its `source`, and will keep the same `origin` state as that of the aborted transition. Further redirections of pending transitions will continue to grow this `source` chain until a transition finally arrives at its `target` state.

<a name="concepts--events" />
### Events

<a name="concepts--events--state-creation-and-destruction" />
#### State creation and destruction

Once a state has been instantiated, it emits a `construct` event. Since a state is not completely constructed until its substates have themselves been constructed, the full `construct` event sequence proceeds in a bottom-up manner.

A state is properly deallocated with a call to `destroy()`, either on itself or on a superstate. This causes a `destroy` event to be emitted immediately prior to the state and its contents being cleared.

<a name="concepts--events--transition-event-sequence" />
#### Transition event sequence

As alluded to above, during a transition’s progression from its origin state to its target state, all affected states along the way emit any of four types of events that describe their relation to the transition.

* **depart** — Exactly one `depart` event is always emitted from the origin state, and marks the beginning of the transition.

* **exit** — It is followed by zero or more `exit` events, one each from amongst the origin state and any of its superstates that will no longer be active as a result of the transition.

* **enter** — Likewise, zero or more `enter` events are emitted, one for each state that will become newly active.

* **arrive** — Finally, an `arrive` event will occur exactly once, specifically at the target state, marking the end of the transition.

Given this scheme, a few noteworthy cases stand out. A “non-exiting” transition is one that only *descends* in the state tree, i.e. it progresses from a superstate to a substate of that superstate, emitting one `depart`, zero `exit` events, one or more `enter` events, and one `arrive`. Conversely, a “non-entering” transition is one that only *ascends* in the state tree, progressing from a substate to a superstate thereof, emitting one `depart`, one or more `exit` events, zero `enter` events, and one `arrive`. For a reflexive transition, which is one whose target is its origin, the event sequence consists only of one `depart` and one `arrive`, both emitted from the same state.

<a name="concepts--events--mutation" />
#### Mutation

When a state’s data or other contents change, it emits a `mutate` event containing the changes made relative to its immediately prior condition.

```javascript
var flavors = [ 'vanilla', 'chocolate', 'strawberry', 'Americone Dream' ];

function Kid () {}
state( Kid.prototype, {
    data: {
        favorite: 'chocolate'
    },
    whim: function () {
        this.data({ favorite: flavors[ Math.random() * flavors.length >>> 0 ] });
    },
    whine: function ( whine ) {
        typeof console !== 'undefined' && console.log( whine );
    },
    mutate: function ( event, edit, delta ) {
        this.owner().whine( "I hate " + delta.favorite + ", I want " + edit.favorite + "!" );
    }
});

var junior = new Kid;

// We could have added listeners this way also
junior.state().on( 'mutate', function ( event, edit, delta ) { /* ... */ });

junior.whim();  // log <<< "I hate chocolate, I want strawberry!"
junior.whim();  // log <<< "I hate strawberry, I want chocolate!"
junior.whim();  // No whining! On a whim, junior stood pat this time.
junior.whim();  // log <<< "I hate chocolate, I want Americone Dream!"
```
```coffeescript
flavors = [ 'vanilla', 'chocolate', 'strawberry', 'Americone Dream' ]

class Kid
  state @::,
    data:
      favorite: 'chocolate'
    whim: ->
      @data favorite: flavors[ Math.random() * flavors.length >>> 0 ]
    whine: ( whine ) -> console?.log whine
    mutate: ( event, edit, delta ) ->
      @owner.whine "I hate #{ delta.favorite }, I want #{ edit.favorite }!"

junior = new Kid

# We could have added listeners this way also
junior.state().on 'mutate', ( event, edit, delta ) -> # ...

do junior.whim   # log <<< "I hate chocolate, I want strawberry!"
do junior.whim   # log <<< "I hate strawberry, I want chocolate!"
do junior.whim   # No whining! On a whim, junior stood pat this time.
do junior.whim   # log <<< "I hate chocolate, I want Americone Dream!"
```

<a name="concepts--events--custom-events" />
#### Custom events

Through exposure of the `emit` method, state instances allow any type of event to be broadcast and consumed.

```javascript
function Kid () {}
state( Kid.prototype, {
    Happy: state(),
    Sad: state(),
    events: {
        gotIceCream: function ( event ) { return 'Happy'; },
        spilledIceCream: function ( event ) { return 'Sad'; }
    }
});

var junior = new Kid;
junior.state().emit('gotIceCream');
junior.state();                          // State 'Happy'
junior.state().emit('spilledIceCream');
junior.state();                          // State 'Sad'
```
```coffeescript
class Kid
  state @::,
    Happy: state()
    Sad: state()
    events:
      gotIceCream: ( event ) -> 'Happy'
      spilledIceCream: ( event ) -> 'Sad'

junior = new Kid
junior.state().emit 'gotIceCream'
junior.state()                         # State 'Happy'
junior.state().emit 'spilledIceCream'
junior.state()                         # State 'Sad'
```


<a name="concepts--guards" />
### Guards

<a name="concepts--history" />
### History



<a name="design-goals" />
## Design goals

### Minimal footprint

All functionality of **State** is instigated through the exported `state` function — depending on the arguments provided, `state()` can be used either to generate state expressions, or to implement expressed states into an existing JavaScript object. In the latter case, the newly implemented system of states is thereafter accessed from a single `object.state()` method on the affected object.

### Black-box opacity

Apart from the addition of the `object.state()` method, a call to `state()` makes no other modifications to a stateful object’s interface. Methods are replaced with delegators, which forward method calls to the current state. This is implemented *opaquely* and *non-destructively*: consumers of the object need not be aware of which states are active in the object, or even that a concept of state exists at all, and a call to `object.state().root().destroy()` will restore the object to its original condition.

### Expressive power

**State** aims to feel as much as possible like a feature of the language. Packing everything into `state()` and `object.state()` allows code to be more declarative and easier to write and understand. Whenever convenient, state expressions may be written in the shorthand format that is interpreted into a formal `StateExpression` type. A state’s composition can be precisely controlled simply by using attributes. And adopters of terse, depunctuated JavaScript dialects like CoffeeScript will only see further gains in expressiveness.



<a name="future-directions" />
## Future directions

### Concurrency

