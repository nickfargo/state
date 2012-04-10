# State.js

**State** is a micro-framework for implementing state directly into any JavaScript object. Objects that are made stateful can be used to model behavior, construct automata, and reason about changes undergone by the object over time.

* **[Installation](#installation)**

* **[Overview](#overview) —** [Intro](#overview--a-quick-four-step-introduction-to-state) – [Example](#overview--a-thoroughly-polite-example)

* **[Concepts](#concepts) —** [Expressions](#concepts--expressions) – [Inheritance](#concepts--inheritance) – [Attributes](#concepts--attributes) – [Data](#concepts--data) – [Methods](#concepts--methods) – [Transitions](#concepts--transitions) – [Events](#concepts--events) – [Guards](#concepts--guards) – [History](#concepts--history)

* **[About](#about) —** [Design goals](#about--design-goals) – [Future directions](#about--future-directions)



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

which will expose the module at `window.state` (this can be reclaimed with a call to `state.noConflict()`).



<a name="overview" />
## Overview

<a name="overview--a-quick-four-step-introduction-to-state" />
### A quick four-step introduction to State

#### Step 1 — The declaration

The **State** module is exported as a function called `state`, which can be used in one of two ways:

```javascript
state( [attributes], expression )
```
* Given a single `expression` object, `state` will create and return a [**state expression**](#concepts--expressions), based on the contents of `expression` (and any keywords included in the optional [`attributes`](#concepts--attributes) string).

```javascript
state( owner, [attributes], expression )
```
* Given two object-typed arguments, `state` will augment the `owner` object with its own working implementation of state, based on the state expression described by `expression` (and `attributes`), and will return the newly stateful object’s [**initial state**](#concepts--attributes).

#### Step 2 — The expression

The `expression` argument is an object literal that describes states, methods, and other features that will be governed by the state implementation of `owner`:

```javascript
var owner, expression;

owner = {
    aMethod: function () { return "default"; }
};
expression = {
    aState: {
        aMethod: function () { return "stateful!"; }
    }
};

state( owner, expression );
```

#### Step 3 — The accessor

After calling `state` to implement state into an `owner` object, this new state implementation will be exposed through an **accessor method**, also named `state`, that will be added to the object. Calling this accessor with no arguments queries the object for its **current state**.

```javascript
owner.state();                   // State '' (the top-level *root state*)
```

#### Step 4 — The transition

The object’s current state may be reassigned to a different state by calling its `change()` method and providing it the name of a state to be targeted. Changing an object’s state allows it to exhibit different behavior:

```javascript
owner.state();                   // State ''
owner.aMethod();                 // "default"
owner.state().change('aState');  // State 'aState'
owner.aMethod();                 // "stateful!"
owner.state();                   // State 'aState'
```

<a name="overview--a-thoroughly-polite-example" />
### A thoroughly polite example

Putting this together, we can create a model of a simple yet genteel `person`, who will behave appropriately according to the state we give it:

*(Note: all example code hereafter will be presented first in hand-rolled JavaScript, followed by [CoffeeScript](http://coffeescript.org/) — please freely follow or ignore either according to taste.)*

```javascript
var person = {
    greet: function () { return "Hello."; }
};

state( person, {
    Formal: {
        greet: function () { return "How do you do?"; }
    },
    Informal: {
        greet: function () { return "Hi!"; }
    }
});

person.greet();                     // "Hello."
person.state().change('Formal');
person.greet();                     // "How do you do?"
person.state().change('Informal');
person.greet();                     // "Hi!"
person.state().change('');
person.greet();                     // "Hello."
```

```coffeescript
person = greet: -> "Hello."

state person,
  Formal:
    greet: -> "How do you do?"
  Informal:
    greet: -> "Hi!"

person.greet()                      # "Hello."
person.state().change 'Formal'
person.greet()                      # "How do you do?"

# `state` also accepts an alternative functional syntax, which is equivalent to `state().change()`.
person.state -> 'Informal'
person.greet()                      # "Hi!"
person.state -> ''
person.greet()                      # "Hello."
```

<a name="concepts" />
## Concepts

* [**Expressions**](#concepts--expressions) — States and their contents can be concisely expressed using a plain object literal, which, along with an optional set of attribute keywords, is passed into the `state()` function and interpreted into a formal **state expression** type.

* [**Inheritance**](#concepts--inheritance) — States are hierarchically nested in a tree structure: the **owner** object is given exactly one **root state**, which may contain zero or more **substates**, which may themselves contain further substates, and so on. A state inherits both from its **superstate**, with which it shares the same owner, as well as from any **protostate**, which is defined as the equivalently positioned state within a prototype of the owner object. Protostates have a higher inheriting precedence than superstates.

* [**Selectors**](#concepts--selectors) — A stateful object exposes an accessor method as `object.state()`, which is called without arguments to retrieve the object’s current state, or if provided a **selector** string, to retrieve a specific `State` of the object, or set of states.

* [**Attributes**](#concepts--attributes) — A state expression may include **attributes** that can specially designate or constrain a state’s usage. For example: the `initial` attribute designates a state as the owner’s initial state, whereas the `final` attribute dictates that a state will disallow any further transitions once it has become active; an `abstract` state is one that cannot be current but may be inherited from by substates, while a `default` attribute marks such a substate as the primary redirection target for an abstract superstate, should a transition ever target the abstract state directly.

* [**Data**](#concepts--data) — Arbitrary **data** can be attached to each state, and inherited accordingly through protostates and superstates.

* [**Methods**](#concepts--methods) — Behavior is modeled by defining state **methods** that override the object’s methods *opaquely* with respect to consumers of the object, which need not be aware of the object’s current state, or even that a concept of state exists at all. State methods are invoked in the context of the state in which the method is defined, allowing for polymorphic features like invoking the overridden methods of a superstate.

* [**Transitions**](#concepts--transitions) — When an object is directed to change from one state to another, it does so by temporarily entering into a **transition** state. A state expression may include **transition expressions** that describe, given a specific pairing of origin and target states, a synchronous or asynchronous **action** to be performed over the duration of the transition.

* [**Events**](#concepts--events) — Listeners for specific **event** types can be bound to a state, which will be called in the context of the bound state as it is affected by a progressing transition (`depart`, `exit`, `enter`, `arrive`), as data bound to the state changes (`mutate`), or upon the state’s construction or destruction (`construct`, `destroy`). **State** also allows for custom typed events, which can be emitted from a particular state and propagated to listeners bound to the state itself as well as its protostates and superstates.

* [**Guards**](#concepts--guards) — A state may be outfitted with **guards** to govern its viability as a transition target, dependent on the outgoing state and any other conditions that may be defined. Guards are evaluated as either boolean values or predicates (boolean-valued functions).

<a name="concepts--expressions" />
### Expressions

A **state expression** defines the contents and structure of a `State` instance. A `StateExpression` object can be created using the exported `state()` function, and providing it a plain object map, optionally preceded by a string of whitespace-delimited attributes to be applied to the expressed state.

The contents of a state expression decompose into six **categories**: `data`, `methods`, `events`, `guards`, `substates`, and `transitions`. The object map supplied to the `state()` call can be categorized accordingly, or alternatively it may be pared down to a more convenient shorthand, either of which will be interpreted into a formal `StateExpression`.

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
        enter: ( event ) -> do @owner().wearTux
    Informal:
      methods:
        greet: -> "Hi!"
      events:
        enter: ( event ) -> do @owner().wearJeans
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
    enter: ( event ) -> do @owner().wearTux
    greet: -> "How do you do?"
  Informal:
    enter: ( event ) -> do @owner().wearJeans
    greet: -> "Hi!"
```

#### Interpreting expression input

Below is the procedure used to interpret an object as a `StateExpression`:

1. If an entry’s value is a typed `StateExpression` or `TransitionExpression`, interpret it as a substate or transition expression, respectively.

2. Otherwise, if an entry’s key is a [category](#concepts--expressions) name, its value must be either `null` or an object to be interpreted as longform.

3. Otherwise, if an entry’s key matches a [built-in event type](#concepts--events--types), interpret the value as either an event listener function, an array of event listeners, or a [named transition target](#concepts--events--expressing-determinism) to be bound to that event type.

4. Otherwise, if an entry’s key matches a [guard action](#concepts--guards) (i.e., `admit`, `release`), interpret the value as a guard condition (or array of guard conditions).

5. Otherwise, if an entry’s value is a function, interpret it as a [method](#concepts--methods) whose name is the entry’s key, or if the entry’s value is an object, interpret it as a [substate](#concepts--inheritance--nesting-states) whose name is the entry’s key.


<a name="concepts--inheritance" />
### Inheritance

<a name="concepts--inheritance--nesting-states" />
#### Nesting states

As with classes or prototypal objects, states are modeled hierarchically, where a state may serve as a **superstate** of one or more **substates** that express ever greater specificity of their owner’s behavior and condition.

```javascript
function Person () {
    this.give = function ( to, what ) {
        to.receive( this, what );
        return this;
    };
    this.receive = function ( from, what ) { return this; };
    
    this.greet = function () { return "Hello."; };
    
    state( this, {
        Formal: {
            greet: function ( other ) { return "How do you do?"; }
        },
        Informal: {
            greet: function ( friend ) { return "Hi!"; },

            Familiar: {
                hug: function ( relative ) {
                    this.owner().give( relative, 'O' );
                    return this;
                },

                greet: function ( relative ) {
                    this.owner().hug( relative );
                },

                Intimate: {
                    kiss: function ( myBetterHalf ) {
                        this.owner().give( myBetterHalf, 'X' );
                        return this;
                    },

                    greet: function ( myBetterHalf ) {
                        this.owner().hug( myBetterHalf ).kiss( myBetterHalf );
                    }
                }
            }
        }
    });
}
```
```coffeescript
class Person
  constructor: ->
    @give = ( to, what ) -> to.receive this, what; this
    @receive = ( from, what ) -> this
    @greet = -> "Hello."

    state this,
      Formal:
        greet: ( other ) -> "How do you do?"
      
      Informal:
        greet: ( friend ) -> "Hi!"
    
        Familiar:
          hug: ( relative ) -> @owner().give relative, 'O' ; this
          greet: ( relative ) -> @owner().hug relative
    
          Intimate:
            kiss: ( myBetterHalf ) -> @owner().give myBetterHalf, 'X' ; this
            greet: ( myBetterHalf ) ->
              I = @owner()
              I.hug myBetterHalf
              I.kiss myBetterHalf
```

<a name="concepts--inheritance--nesting-states--the-root-state" />
##### The root state

An object’s state model is a classic tree structure, with a single **root state** as its basis, from which all of the object’s states inherit.

A noteworthy quality of the root state is that, while its place in the expression does not bear a name, it is not anonymous; the root state’s name is always the empty string `''`, which may be used by an object to change its state so as to exhibit its default behavior.

```javascript
obj.state().root() === obj.state('')    // true
obj.state().change('')                  // State ''
```
```coffeescript
obj.state().root() is obj.state ''      # true
obj.state -> ''                         # State ''
```

The root state also acts as the *default method store* for the object’s state implementation, containing methods originally defined on the object itself, for which now exist one or more stateful reimplementations elsewhere within the state tree. This capacity allows the *method delegation pattern* to work simply by always forwarding a method call on the object to the object’s current state; if no corresponding method override is defined for the current state, or for any of its superstates, then as a last resort **State** will resolve the call to the original implementation held within the root state.

<a name="concepts--inheritance--inheriting-states-across-prototypes" />
#### Inheriting states across prototypes

So far we’ve been creating stateful objects by applying the `state()` function directly to the object. Consider now the case of an object that inherits from a stateful prototype.

```javascript
function Person () {}
Person.prototype.greet = function () { return "Hello."; };
state( Person.prototype, {
    Formal: {
        greet: function () { return "How do you do?"; }
    },
    Informal: {
        greet: function () { return "Hi!"; }
    }
});

var person = new Person;
```

```coffeescript
class Person
  greet: -> "Hello."
  state @::,
    Formal:
      greet: -> "How do you do?"
    Informal:
      greet: -> "Hi!"

person = new Person
```

Since the instance object `person` in the code above inherits from `Person.prototype`, given what’s been covered to this point, it may be expected that instigating a transition via `person.state().change('Formal')` would take effect on `Person.prototype`, in turn affecting all other instances of `Person` as well. While sharing stateful behavior through prototypes is desirable, it’s also essential that each instance be able to maintain state and undergo changes to its state independently.

**State** addresses this problem by automatically outfitting each object instance with its own state implementation whenever one is necessary but does not exist already. This new implementation will itself be empty, but will inherit from the state implementation of the prototype, as shown below. This separation allows the instance to experience its own states and transitions, without also indirectly affecting all of its fellow inheritors.

```javascript
Person.prototype.state();              // State ''
'state' in person;                     // true
person.hasOwnProperty('state');        // false
person.state();                        // State ''
person.hasOwnProperty('state');        // true
person.state().isVirtual();            // false
person.greet();                        // "Hello."
person.state().change('Informal');     // State 'Informal'
person.state().isVirtual();            // true
person.greet();                        // "Hi!"
Person.prototype.state();              // State ''
```
```coffeescript
Person::state()                        # State ''
'state' of person                      # true
person.hasOwnProperty 'state'          # false
person.state()                         # State ''
person.hasOwnProperty 'state'          # true
person.state().isVirtual()             # false
person.greet()                         # "Hello."
person.state -> 'Informal'             # State 'Informal'
person.state().isVirtual()             # true
person.greet()                         # "Hi!"
Person::state()                        # State ''
```

When an accessor method (`person.state()`) is called, it checks the context object (`person`) to ensure that it has its own accessor method. If it doesn’t, and is instead attempting to inherit `state` from a prototype, then an empty state implementation is created for the inheritor, which in turn generates a corresponding new accessor method (`person.state()`), to which the original call is then forwarded.

Even though the inheritor’s state implementation is empty, it identifies the prototype’s states as its **protostates**, from which it inherits all methods, data, events, etc. contained within. The inheritor may adopt a protostate as its current state just as it would with a state of its own, in which case a temporary **virtual state** is created within the state implementation of the inheritor, as a stand-in for the protostate.

This system of protostates and virtual states allows an object’s state implementation to benefit from the prototypal reuse patterns of JavaScript without the states themselves having to maintain any direct prototypal relationship with each other.


<a name="concepts--selectors" />
### Selectors

The accessor method of a stateful object (`object.state()`) returns its current state if called with no arguments. If a **selector** string argument is provided, the accessor will query the object’s state tree for any matching states.

**State** uses a simple selector format:

1. Substate names are delimited with the dot (`.`) character.

2. A selector that begins with `.` will be evaluated *relative* to the local context, while a selector that begins with a name will be evaluated as *absolute*, i.e., relative to the root state.

3. An absolute fully-qualified name is not necessary except for disambiguation: `'A.B.C'` and `'C'` will both resolve to the deep substate named `C` provided that there is no other state named `C` located higher in the state tree.

4. Special cases: empty-string `''` references the root state; single-dot `.` references the local context state; double-dot `..` references its immediate superstate, etc.

5. Querying a selector ending in `*` returns an array of the immediate substates of that level, while `**` returns a flattened array of all descendant substates of that level.

```javascript
var o = {};
state( o, {
    A: {
        AA: state('initial', {
            AAA: {}
        }),
        AB: {}
    },
    B: {}
});

o.state();            // State 'AA'
o.state('');          // State ''
o.state('A.AA.AAA');  // State 'AAA'
o.state('.');         // State 'A'
o.state('..');        // State ''
o.state('.AB');       // State 'AB'
o.state('..B');       // State 'B'
o.state('AAA');       // State 'AAA'
o.state('.*');        // [ State 'AAA' ]
o.state('AAA.*');     // []
o.state('*');         // [ State 'A', State 'B' ]
o.state('**');        // [ State 'A', State 'AA', State 'AAA', State 'AB', State 'B' ]
```
```coffeescript
o = {}
state o,
  A:
    AA: state 'initial',
      AAA: {}
    AB: {}
  B: {}

o.state()             # State 'AA'
o.state ''            # State ''
o.state 'A.AA.AAA'    # State 'AAA'
o.state '.'           # State 'A'
o.state '..'          # State ''
o.state '.AB'         # State 'AB'
o.state '..B'         # State 'B'
o.state 'AAA'         # State 'AAA'
o.state '.*'          # [ State 'AAA' ]
o.state 'AAA.*'       # []
o.state '*'           # [ State 'A', State 'B' ]
o.state '**'          # [ State 'A', State 'AA', State 'AAA', State 'AB', State 'B' ]
```

Selectors are similarly put to use elsewhere as well: for example, a [transition](#)’s `origin` and `target` properties are evaluated as selectors, and several `State` methods, including [`change`](#), [`is`](#), [`isIn`](#), [`isSuperstateOf`](#), and [`isProtostateOf`](#), accept a selector as their main argument.


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

* *versioned* — (Reserved; not presently implemented.) 

* *concurrent* — (Reserved; not presently implemented.) 



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
            target: 'Kookle',
            action: 'beat'
        }
    }
}

var ceo = new Chief;
ceo.state().data();               // { budget: 10000000000 }
ceo.state().be('Enraged');        // (`be` is a built-in alias of `change`)
ceo.state().data();               // { target: 'Kookle', action: 'beat', budget: 10000000000 }
ceo.state().go('Thermonuclear');  // (`go` is also an alias of `change`)
ceo.state().data();               // { target: 'Kookle', action: 'destroy', budget: Infinity }
```
```coffeescript
class Chief
  state @::,
    data:
      budget: 1e10
    Enraged:
      data:
        target: 'Kookle'
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
ceo.state().be 'Enraged'           # (`be` is a built-in alias of `change`)
ceo.state().data()                 # { target: 'Kookle', action: 'beat', budget: 10000000000 }
ceo.state().go 'Thermonuclear'     # (`go` is also an alias of `change`)
ceo.state().data()                 # { target: 'Kookle', action: 'destroy', budget: Infinity }
```


<a name="concepts--methods" />
### Methods

A defining feature of **State** is the ability to have an object exhibit a variety of behaviors. A  state expresses behavior by defining **overrides** for any of its object’s methods.

<a name="concepts--methods--delegators" />
#### Delegators

When state is applied to an object, **State** identifies any methods already present on the object for which there exists at least one override somewhere within the state expression. These methods will be relocated to the root state, and replaced on the object with a special **delegator** method. The delegator’s job is to redirect any subsequent calls it receives to the object’s current state, from which **State** will then locate and invoke the proper stateful implementation of the method. Should no active states contain an override for the called method, then the delegation defaults to the object’s original implementation.

<a name="concepts--methods--context" />
#### Context

When an owner object’s delegated state method is called, it is invoked not in the context of its owner, but rather of the state in which it is declared, or, if the method is inherited from a protostate, in the context of the local state that inherits from that protostate. This subtle difference in policy does mean that, within a state method, the owner cannot be directly referenced by `this` as it normally would; however, it is still always accessible by calling `this.owner()`.

Of greater importance is the lexical information afforded by binding state methods to their associated state. This allows state method code to exercise useful polymorphic idioms, such as calling up to a superstate’s implementation of the method.

```javascript
state( owner, {
    A: {
        bang: function ( arg1, arg2 ) { /* ... */ }
        B: {
            bang: function () { return this.superstate().apply( 'bang', arguments ); }
        }
    }
});
```
```coffeescript
state owner,
  A:
    bang: ( arg1, arg2 ) -> # ...
    B:
      bang: -> @superstate().apply 'bang', arguments
```

<a name="concepts--methods--example" />
#### Example

This example of a simple `Document` class demonstrates state method inheritance and polymorphism. Note the points of interest that are numbered in trailing comments and explained below:

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
        this.change( 'Frozen' );
        return result;
    },

    Dirty: {
        save: function () {
            this.change( 'Saved', { arguments: [
                this.owner().location(), this.owner().read()
            ] }); // [5]
            return this.owner();
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
            action: function ( location, text ) {
                var transition = this;
                return fs.writeFile( location, text, function ( err ) {
                    if ( err ) return transition.abort( err ).go( 'Dirty' );
                    transition.end();
                });
            }
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
      @change 'Frozen'
      result

    Dirty:
      save: ->
        @go 'Saved', arguments: [ @owner.location(), @owner().read() ] # [5]
        @owner()
    
    Saved: state 'initial',
      edit: ->
        result = @superstate().apply 'edit', arguments # [2]
        @change 'Dirty'
        result

      Frozen: state 'final',
        edit: ->
        freeze: ->

    transitions:
      Writing: origin: 'Dirty', target: 'Saved', action: ( location, text ) ->
        fs.writeFile location, text, ( err ) =>
          return @abort( err ).go 'Dirty' if err
          do @end
```

1. A “privileged” method `edit` is defined inside the constructor, closing over a private variable `text` to which it requires access. Later, when state is applied to the object, this method will be moved to the root state, and a delegator will be added to the object in its place.

2. An overridden implementation of `edit`, while not closed over the constructor’s private variable `text`, is able to call up to the original implementation using `this.superstate().apply('edit')`.

3. The `freeze` method is declared on the abstract root state, callable from states `Dirty` and `Saved` (but not `Frozen`, where it is overridden with a no-op).

4. The `save` method, which only appears in the `Dirty` state, is still callable from other states, as its presence in `Dirty` causes a no-op version of the method to be automatically added to the root state. This allows `freeze` to safely call `save` despite the possiblity of being in a state (`Saved`) with no such method.

5. Changing to `Saved` from `Dirty` results in the `Writing` [transition](#concepts--transitions), whose asynchronous `action` is invoked with the arguments provided by the `change` call.


<a name="concepts--transitions" />
### Transitions

Whenever an object’s current state changes, a **transition** state is created, which temporarily assumes the role of the current state while the object is travelling from its source state to its target state.

A state expression may include any number of **transition expressions**, which define some **action** to be performed, either synchronously or asynchronously, along with definitions for `origin` and `target` states to which the transition should apply. When an object undergoes a state change, it finds the appropriate transition expression for the given origin and target, and from that creates a new `Transition` instance.

The lifecycle of a transition consists of a stepwise traversal through the state tree, from the `source` node to the `target` node, where the **domain** of the transition is represented by the state that is the least common ancestor node between `source` and `target`. At each step in the traversal, the transition instance acts as a temporary substate of the local state, such that event listeners may expect to inherit from the states in which they are declared.

The traversal sequence is decomposable into an ascending phase, an action phase, and a descending phase. During the ascending phase, the object emits a `depart` event on the `source` and an `exit` event on any state that will be rendered inactive as a consequence of the transition. The transition then reaches the top of the domain and moves into the action phase, whereupon it executes any `action` defined in its associated transition expression. Once the action has ended, the transition then proceeds with the descending phase, emitting `enter` events on any state that is rendered newly active, and concluding with an `arrival` event on its `target` state. (*See section on [transitional events](#concepts--events--types--transitional)*.)

Should a new transition be started while a transition is already in progress, an `abort` event is emitted on the previous transition. The new transition will reference the aborted transition as its `source`, and will keep the same `origin` state as that of the aborted transition. Further redirections of pending transitions will continue to grow this `source` chain until a transition finally arrives at its `target` state.

<a name="concepts--events" />
### Events

Events in **State** follow a very familiar pattern: `State` exposes methods `emit` (aliased to `trigger`) for emitting typed events, and `addEvent`/`removeEvent` (aliased to `on`/`off` and `bind`/`unbind`) for assigning listeners to a particular event type.

<a name="concepts--events--types" />
#### Types of events

<a name="concepts--events--types--existential" />
##### Existential events

Once a state has been instantiated, it emits a `construct` event. Since a state is not completely constructed until its substates have themselves been constructed, the full `construct` event sequence proceeds in a bottom-up manner.

A state is properly deallocated with a call to `destroy()`, either on itself or on a superstate. This causes a `destroy` event to be emitted immediately prior to the state and its contents being cleared.

<a name="concepts--events--types--transitional" />
##### Transitional events

As alluded to above, during a transition’s progression from its origin state to its target state, all affected states along the way emit any of four types of events that describe their relation to the transition.

* **depart** — Exactly one `depart` event is always emitted from the origin state, and marks the beginning of the transition.

* **exit** — It is followed by zero or more `exit` events, one each from amongst the origin state and any of its superstates that will no longer be active as a result of the transition.

* **enter** — Likewise, zero or more `enter` events are emitted, one for each state that will become newly active.

* **arrive** — Finally, an `arrive` event will occur exactly once, specifically at the target state, marking the end of the transition.

Given this scheme, a few noteworthy cases stand out. A “non-exiting” transition is one that only *descends* in the state tree, i.e. it progresses from a superstate to a substate of that superstate, emitting one `depart`, zero `exit` events, one or more `enter` events, and one `arrive`. Conversely, a “non-entering” transition is one that only *ascends* in the state tree, progressing from a substate to a superstate thereof, emitting one `depart`, one or more `exit` events, zero `enter` events, and one `arrive`. For a reflexive transition, which is one whose target is its origin, the event sequence consists only of one `depart` and one `arrive`, both emitted from the same state.

<a name="concepts--events--types--mutation" />
##### Mutation

When a state’s data or other contents change, it emits a `mutate` event containing the changes made relative to its immediately prior condition.

```javascript
var flavors = [ 'vanilla', 'chocolate', 'strawberry', 'Stephen Colbert’s Americone Dream' ];

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
junior.whim();  // log <<< "I hate chocolate, I want Stephen Colbert’s Americone Dream!"
```
```coffeescript
flavors = [ 'vanilla', 'chocolate', 'strawberry', 'Stephen Colbert’s Americone Dream' ]

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
do junior.whim   # log <<< "I hate chocolate, I want Stephen Colbert’s Americone Dream!"
```

<a name="concepts--events--types--custom-event-types" />
##### Custom event types

Through exposure of the `emit` method, state instances allow any type of event to be broadcast and consumed.

```javascript
function Kid () {}
state( Kid.prototype, {
    Happy: state(),
    Sad: state(),
    events: {
        gotIceCream: function ( event ) { this.be('Happy'); },
        spilledIceCream: function ( event ) { this.be('Sad'); }
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
      gotIceCream: ( event ) -> @be 'Happy'
      spilledIceCream: ( event ) -> @be 'Sad'

junior = new Kid
junior.state().emit 'gotIceCream'
junior.state()                         # State 'Happy'
junior.state().emit 'spilledIceCream'
junior.state()                         # State 'Sad'
```

<a name="concepts--events--expressing-determinism" />
#### Expressing determinism

An event listener may also be expressed simply as a State name, which is interpreted as an order to transition to that State after all of an event’s callbacks have been invoked. This bit of shorthand allows for concise expression of *deterministic* behavior, where the occurrence of a particular event type within a particular State has a definitive, unambiguous effect on the state of the object.

```javascript
function IsDivisibleByThreeComputer () {
    state( this, 'abstract', {
        s0: state( 'initial default',
            { events: { '0':'s0', '1':'s1' } } ),
        s1: { events: { '0':'s2', '1':'s0' } },
        s2: { events: { '0':'s1', '1':'s2' } }
    });
}
IsDivisibleByThreeComputer.prototype.compute = function ( number ) {
    var i, l, binary = number.toString(2);
    this.state().go('s0');
    for ( i = 0, l = binary.length; i < l; i++ ) {
        this.state().emit( binary[i] );
    }
    return this.state().is('s0');
}

var three = new IsDivisibleByThreeComputer;
three.compute( 8 );          // false
three.compute( 78 );         // true
three.compute( 1000 );       // false
three.compute( 504030201 );  // true
```
```coffeescript
class IsDivisibleByThreeComputer
  constructor: ->
    state this, 'abstract',
      s0: state( 'initial default',
          events: '0':'s0', '1':'s1' )
      s1: events: '0':'s2', '1':'s0'
      s2: events: '0':'s1', '1':'s2'

  compute: ( number ) ->
    @state -> 's0'
    @state().emit symbol for symbol in number.toString 2
    @state().is 's0'

three = new IsDivisibleByThreeComputer
three.compute 8              # false
three.compute 78             # true
three.compute 1000           # false
three.compute 504030201      # true
```


<a name="concepts--guards" />
### Guards



<a name="about" />
## About this project

<a name="about--design-goals" />
### Design goals

#### Minimal footprint

All functionality of **State** is instigated through the exported `state` function — depending on the arguments provided, `state()` can be used either to generate state expressions, or to implement expressed states into an existing JavaScript object. In the latter case, the newly implemented system of states is thereafter accessed from a single `object.state()` method on the affected object.

#### Expressive power

As much as possible, **State** aims to look and feel like a feature of the language. The interpreted shorthand syntax, simple keyword attributes, and limited interface allow for production code that is declarative and easy to write and understand. Adopters of terse, depunctuated JavaScript dialects like CoffeeScript will only see further gains in expressiveness.

#### Black-box opacity

Apart from the addition of the `object.state()` method, a call to `state()` makes no other modifications to a stateful object’s interface. Methods are replaced with delegators, which forward method calls to the current state. This is implemented *opaquely* and *non-destructively*: consumers of the object need not be aware of which states are active in the object, or even that a concept of state exists at all, and a call to `object.state().root().destroy()` will restore the object to its original form.


<a name="about--future-directions" />
### Future directions

<a name="about--future-directions--history" />
#### History

Any state may be ordered to keep a **history** of its own internal state. Entries are recorded in the history anytime the given state is involved in a transition, or experiences a change to its `data` content. The history may be traversed in either direction, and elements replaced or pushed onto the stack at its current index. When a transition targets a **retained** state, it will consult that state’s history and redirect itself back to whichever of the state’s substates was most recently current.

<a name="about--future-directions--concurrency" />
#### Concurrency

Whereas an object’s state is most typically conceptualized as an exclusive-OR operation (i.e., its current state is always fixed to exactly one state), a state may instead be defined as **concurrent**, relating its substates in an “AND” composition, where occupation of the concurrent state implies simultaneous occupation of each of its immediate substates.
