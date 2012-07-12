# State.js

**State** is a framework for implementing state-driven behavior directly into JavaScript objects.

```javascript
function Person () {}

state( Person.prototype, {
    Formal: state( 'initial', {
        greet: function () { return "How do you do?"; }
    }),
    Casual: {
        greet: function () { return "Hi!"; }
    }
});

var person = new Person;
person.greet();             // >>> "How do you do?"

person.state('-> Casual');
person.greet();             // >>> "Hi!"
```

<a name="contents" href="#contents" />
## Contents

* **[Installation](#installation)**
* **[Getting started](#getting-started)**
* **[Overview](#overview)**
* **[Concepts](#concepts)** 
* **[About this project](#about)**

* * *

<a name="installation" href="#installation" />
## Installation

The lone dependency of **State** is [**Omicron**](http://github.com/nickfargo/omicron/).

**State** can be installed via [**npm**](http://npmjs.org/):

```
$ npm install state
```
```javascript
var state = require('state');
```

or included in the browser:

```html
<script src="omicron.js"></script>
<script src="state.js"></script>
```

which will expose the module at `window.state` (this can be reclaimed with a call to `state.noConflict()`).




<a name="getting-started" href="#getting-started" />
## Getting started

### Step 0 — The `state` function

The **State** module is exported as a function called `state`, which can be used in either of two ways:

```javascript
state( [attributes], expression )
```
* Given a single `expression` object, `state` will create and return a [**state expression**](#concepts--expressions), based on the contents of `expression` (and any keywords included in the optional [`attributes`](#concepts--attributes) string).

```javascript
state( owner, [attributes], expression )
```
* Given two object-typed arguments, `state` will augment the `owner` object with its own working state implementation based on the provided `expression` (and `attributes`), and then return the newly stateful object’s [**initial state**](#concepts--attributes).

### Step 1 — Building a state expression

The `state` function’s `expression` argument, usually an object literal, describes the constituent states, methods, and other features that will form the state implementation of `owner`:

```javascript
var owner = {
    aMethod: function () { return "default"; }
};

state( owner, {
    aState: {
        aMethod: function () { return "stateful!"; }
    }
});
```

### Step 2 — Accessing an object’s state

After calling `state` to implement state into an `owner` object, this new state implementation will be exposed through an **accessor method**, also named `state`, that will be added to the object.

Calling this accessor with no arguments queries the object for its **current state**:

```javascript
owner.state();                   // >>> State '' (the top-level *root state*)
```

### Step 3 — Transitioning between states

The object’s current state may be reassigned to a different state by calling its `change` method and providing it the name of a state to be targeted. Transitioning between states allows an object to exhibit different behaviors:

```javascript
owner.state();                   // >>> State ''
owner.aMethod();                 // >>> "default"

owner.state().change('aState');

owner.state();                   // >>> State 'aState'
owner.aMethod();                 // >>> "stateful!"
```

In addition, a sugary alternative to calling `change()` is to prepend a **transition arrow** to the targeted state, and pass this expression into the accessor method:

```javascript
owner.state('-> aState');
```

### All together now …

With these tools we can model a simple yet thoroughly polite `person`, like that shown in the introductory example, who will behave appropriately according to the state we give it:

> **Note:** from this point forward, example code will first be presented in hand-rolled JavaScript, and then followed by a logically equivalent bit of [CoffeeScript](http://coffeescript.org/). Please freely follow or ignore either according to taste.

```javascript
var person = {
    greet: function () { return "Hello."; }
};

state( person, {
    Formal: {
        greet: function () { return "How do you do?"; }
    },
    Casual: {
        greet: function () { return "Hi!"; }
    }
});

person.greet();
// >>> "Hello."
person.state('-> Formal');
person.greet();
// >>> "How do you do?"
person.state().go('Casual'); // [1]
person.greet();
// >>> "Hi!"
person.state('->'); // [2]
person.greet();
// >>> "Hello."
```

```coffeescript
person = greet: -> "Hello."

state person,
  Formal:
    greet: -> "How do you do?"
  Casual:
    greet: -> "Hi!"

person.greet()
# >>> "Hello."
person.state.be 'Formal' # [1]
person.greet()
# >>> "How do you do?"
person.state -> 'Casual' # [3]
person.greet()
# >>> "Hi!"
person.state -> '' # [3]
person.greet()
# >>> "Hello."
```

1. The `change` method is also aliased to `go` and `be`.

2. A naked transition arrow is simply a `change` to the object’s default, or [root](#concepts--inheritance--the-root-state) state.

3. Another option is to use a function literal, which mimics the transition arrow; the function is immediately invoked and its return value is passed to the current state’s `change` method.

* * *

*Return to: [**Getting started**](#getting-started)  <  [top](#top)*

* * *




<a name="overview" href="#overview" />
## Overview

Before diving in further it may be helpful to gain a broad, high-level view of the concepts involved in **State**. To that end, the points below offer previews of the more in-depth discussions upcoming in the following section.

* **States** — Formally, a **state** is an instance of `State` that encapsulates all or part of an **owner** object’s condition at a given moment. The owner may adopt different behaviors at various times by transitioning from one of its states to another.

* [**Expressions**](#concepts--expressions) — A **state expression** describes the contents of a `State`. States may be [expressed concisely](#concepts--expressions--shorthand) with an object literal, which, along with an optional set of attribute keywords, can be passed into the `state()` function. There the provided input [is interpreted](#concepts--expressions--interpreting-expression-input) into a formal `StateExpression`, which can then be used to create a `State` instance.

* [**Inheritance**](#concepts--inheritance) — States are arranged hierarchically in a rooted tree structure: the owner object is given exactly one [**root state**](#concepts--inheritance--the-root-state), within which may be nested zero or more **substates**, which may themselves contain further substates, and so on, [thereby expressing specificity](#concepts--inheritance--behavior-nesting-using-substates) of the owner’s behavior. A state inherits from its **superstate**, with which it shares the same owner, [and also inherits from any **protostate**](#concepts--inheritance--inheriting-states-across-prototypes), defined as the equivalently positioned state within a prototype of the owner object. Protostates have a higher inheriting precedence than superstates.

* [**Selectors**](#concepts--selectors) — A stateful owner `object`’s accessor method at `object.state()` can be called without arguments to retrieve the object’s current state, or, if provided a **selector** string, to query for a specific `State` of the object, or a specific set of states.

* [**Attributes**](#concepts--attributes) — A state expression may include a set of **attribute** keywords (e.g.: `mutable`, `initial`, `conclusive`, `abstract`, etc.), which will enable certain features or impose certain constraints for the `State` that the expression is to represent.

* [**Data**](#concepts--data) — Arbitrary **data** can be attached to each state, and inherited accordingly through protostates and superstates.

* [**Methods**](#concepts--methods) — Behavior is modeled by defining state **methods** that opaquely override the object’s methods. Consumers of the object simply call its methods as usual, and need not be aware of the object’s current state, or even that a concept of state exists at all. State methods [are invoked in the context of the state](#concepts--methods--context) in which the method is defined, allowing for polymorphic features like invoking the overridden methods of a superstate.

* [**Transitions**](#concepts--transitions) — When an object is directed to change from one state to another, it does so by temporarily entering into a **transition** state. A state expression may include [**transition expressions**](#concepts--transitions--expressions) that describe, given a specific pairing of origin and target states, a synchronous or asynchronous **action** to be performed over the duration of the transition.

* [**Events**](#concepts--events) — Listeners for specific **event** types can be bound to a state, which will be called in the context of the bound state as it is affected [by a progressing transition](#concepts--events--transitional-events) (`depart`, `exit`, `enter`, `arrive`), as the state itself [changes](#concepts--events--mutation-events) (`mutate`), or upon the state’s [construction or destruction](#concepts--events--existential-events) (`construct`, `destroy`). **State** also allows for [custom typed events](#concepts--events--custom-event-types), which can be emitted from a particular state and propagated to listeners bound to the state itself as well as its protostates and superstates.

* [**Guards**](#concepts--guards) may be applied [to a state](#concepts--state-guards) to govern its viability as a transition target, dependent on the outgoing state and any other conditions that may be defined. Likewise guards may also be included [in transition expressions](#concepts--transition-guards), where they are used to select a particular transition to execute. Guards are evaluated as predicates if supplied as functions, or as boolean values otherwise.

* [**History**](#concepts--history) — A state marked with the `history` attribute will keep a **history** of its own *internal state*. This includes a record of the states within its domain that have been current or active, which, if the state or any of its descendants are also `mutable`, is interspersed with a record of the mutations the state has undergone. The history can be traversed backward and forward, causing the object to transition to a previously or subsequently held internal state.

* * *

*Return to: [**Overview**](#overview)  <  [top](#top)*

* * *




<a name="concepts" href="#concepts" />
## Concepts

* **[Expressions](#concepts--expressions)**
* **[Inheritance](#concepts--inheritance)**
* **[Selectors](#concepts--selectors)**
* **[Attributes](#concepts--attributes)**
* **[Data](#concepts--data)**
* **[Methods](#concepts--methods)**
* **[Transitions](#concepts--transitions)**
* **[Events](#concepts--events)**
* **[Guards](#concepts--guards)**
* **[History](#concepts--history)**

* * *

<a name="concepts--expressions" href="#concepts--expressions" />
### Expressions

A **state expression** defines the contents and structure of a `State` instance. A `StateExpression` object can be created using the exported `state()` function, and providing it a plain object map, optionally preceded by a string of whitespace-delimited attributes to be applied to the expressed state.

The contents of a state expression decompose into six **categories**: `data`, `methods`, `events`, `guards`, `states`, and `transitions`. The object map supplied to the `state()` call can be categorized accordingly, or alternatively it may be pared down to a more convenient shorthand, either of which will be interpreted into a formal `StateExpression`.

* * *

* **[Structured form](#concepts--expressions--structured)**
* **[Shorthand](#concepts--expressions--shorthand)**
* **[Interpreting expression input](#concepts--expressions--interpreting-expression-input)**

* * *

<a name="concepts--expressions--structured" href="#concepts--expressions--structured" />
#### Structured form

Building upon the introductory example above, we could write a state expression that consists of states, methods, and events, looking something like this:

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
                enter: function () { this.owner().wearTux(); }
            }
        },
        Informal: {
            methods: {
                greet: function () { return "Hi!"; }
            },
            events: {
                enter: function () { this.owner().wearJeans(); }
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
        enter: -> do @owner().wearTux
    Informal:
      methods:
        greet: -> "Hi!"
      events:
        enter: -> do @owner().wearJeans
```

<a name="concepts--expressions--shorthand" href="#concepts--expressions--shorthand" />
#### Shorthand

Explicitly categorizing each element is unambiguous, but also unnecessarily verbose. To that point, `state()` also accepts a more concise expression format, which, using a fixed set of rules, is interpreted into a `StateExpression` identical to that of the example above:

```javascript
var shorthandExpression = state({
    greet: function () { return "Hello."; },

    Formal: {
        enter: function () { this.owner().wearTux(); },
        greet: function () { return "How do you do?"; }
    },
    Informal: {
        enter: function () { this.owner().wearJeans(); },
        greet: function () { return "Hi!"; }
    }
});
```
```coffeescript
shorthandExpression = state
  greet: -> "Hello."
  Formal:
    enter: -> do @owner().wearTux
    greet: -> "How do you do?"
  Informal:
    enter: -> do @owner().wearJeans
    greet: -> "Hi!"
```

<a name="concepts--expressions--interpreting-expression-input" href="#concepts--expressions--interpreting-expression-input" />
#### Interpreting expression input

Expression input provided to `state()` is interpreted according to the following rules:

1. If an entry’s value is a typed `StateExpression` or `TransitionExpression`, interpret it as a substate or transition expression, respectively.

2. Otherwise, if an entry’s key is a [category](#concepts--expressions) name, its value must be either `null` or an object to be interpreted as longform.

3. Otherwise, if an entry’s key matches a [built-in event type](#concepts--events--types) or if its value is a string, then interpret the value as either an event listener function, an array of event listeners, or a [named transition target](#concepts--events--expressing-determinism) to be bound to that event type.

4. Otherwise, if an entry’s key matches a [guard action](#concepts--guards) (i.e., `admit`, `release`), interpret the value as a guard condition (or array of guard conditions).

5. Otherwise, if an entry’s value is an object, interpret it as a [substate](#concepts--inheritance--nesting-states) whose name is the entry’s key, or if the entry’s value is a function, interpret it as a [method](#concepts--methods) whose name is the entry’s key.

* * *

*Return to: [**Expressions**](#concepts--expressions)  <  [Concepts](#concepts)  <  [Overview](#overview)  <  [top](#top)*

* * *


<a name="concepts--inheritance" href="#concepts--inheritance" />
### Inheritance

The state model is a classic tree structure: any state may serve as a **superstate** of one or more **substates**, which express further specificity of their owner’s behavior and condition.

* * *

* **[The root state](#concepts--inheritance--the-root-state)**
* **[Behavior nesting using substates](#concepts--inheritance--behavior-nesting-using-substates)**
* **[Inheriting states across prototypes](#concepts--inheritance--inheriting-states-across-prototypes)**

* * *

<a name="concepts--inheritance--the-root-state" href="#concepts--inheritance--the-root-state" />
#### The root state

For every stateful object, a single **root state** is automatically generated, which is the top-level superstate of all other states. The root state’s name is always and uniquely the empty string `''`. Either an empty-string selector or naked transition arrow may be used to change an object’s current state to the root state, causing the object to exhibit the its default behavior.

```javascript
obj.state().root() === obj.state('');   // >>> true
obj.state('->');                        // >>> State ''
```
```coffeescript
obj.state().root() is obj.state ''      # >>> true
obj.state '->'                          # >>> State ''
```

The root state also acts as the *default method store* for the object’s state implementation, containing any methods originally defined on the object itself, for which now exist one or more stateful reimplementations elsewhere within the state tree. This capacity allows the *method delegation pattern* to work simply by forwarding a method call made on the object to the object’s current state, with the assurance that the call will be resolved *somewhere* in the state tree: if a method override is not present on the current state, then the call is forwarded on to its superstate, and so on as necessary, until as a last resort **State** will resolve the call using the original implementation held within the root state.

*See also:* [Delegator methods](#concepts--methods--delegators)

<a name="concepts--inheritance--behavior-nesting-using-substates" href="#concepts--inheritance--behavior-nesting-using-substates" />
#### Behavior nesting using substates

Substates help to express ever greater specificity of their owner’s behavior and condition.

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
            greet: function ( acquaintance ) { return "Hi!"; },

            Familiar: {
                hug: function ( friend ) {
                    this.owner().give( friend, 'O' );
                    return this;
                },

                greet: function ( friend ) {
                    this.owner().hug( friend );
                },

                Intimate: {
                    kiss: function ( spouse ) {
                        this.owner().give( spouse, 'X' );
                        return this;
                    },

                    greet: function ( spouse ) {
                        this.superstate().call( 'greet', spouse );
                        this.owner().kiss( spouse );
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
        greet: ( acquaintance ) -> "Hi!"
    
        Familiar:
          hug: ( friend ) -> @owner().give friend, 'O' ; this
          greet: ( friend ) -> @owner().hug friend
    
          Intimate:
            kiss: ( spouse ) -> @owner().give spouse, 'X' ; this
            greet: ( spouse ) ->
              @superstate().call 'greet', spouse
              @owner().kiss spouse
```

<a name="concepts--inheritance--inheriting-states-across-prototypes" href="#concepts--inheritance--inheriting-states-across-prototypes" />
#### Inheriting states across prototypes

Since the opening introductory code sample, the examples we’ve looked at have created stateful objects by applying the `state()` function directly to the object. Let’s consider now the case of an object that inherits from a stateful prototype.

```javascript
function Person () {}
Person.prototype.greet = function () { return "Hello."; };
state( Person.prototype, {
    Formal: {
        greet: function () { return "How do you do?"; }
    },
    Casual: {
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
    Casual:
      greet: -> "Hi!"

person = new Person
```

Since the `person` object in the code above inherits from `Person.prototype`, given what’s been covered to this point, it may be expected that a transition instigated using `person.state().change('Formal')` would actually take effect on `Person.prototype`, in turn affecting all other instances of `Person` as well. Sharing stateful behavior through prototypes is desirable, however, it is also essential that each instance be able to maintain state and undergo changes to its state independently.

To that end, **State** automatically outfits each inheriting object with its own state implementation whenever one is necessary but does not exist already. This new implementation will itself be empty, but will inherit from the state implementation of the prototype, thus allowing the object to experience its own states and transitions without also indirectly affecting all of its fellow inheritors.

```javascript
Person.prototype.state();          // >>> State ''

'state' in person;                 // >>> true
person.hasOwnProperty('state');    // >>> false
person.state();                    // >>> State ''
person.hasOwnProperty('state');    // >>> true

person.state().isVirtual();        // >>> false
person.greet();                    // >>> "Hello."
person.state('-> Casual');         // >>> State 'Casual'
person.state().isVirtual();        // >>> true
person.greet();                    // >>> "Hi!"

Person.prototype.state();          // >>> State ''
```
```coffeescript
Person::state()                    # >>> State ''

'state' of person                  # >>> true
person.hasOwnProperty 'state'      # >>> false
person.state()                     # >>> State ''
person.hasOwnProperty 'state'      # >>> true

person.state().isVirtual()         # >>> false
person.greet()                     # >>> "Hello."
person.state '-> Casual'           # >>> State 'Casual'
person.state().isVirtual()         # >>> true
person.greet()                     # >>> "Hi!"

Person::state()                    # >>> State ''
```

When an accessor method (`person.state`) is called, it first checks the context object (`person`) to ensure that it has its own accessor method. If it does not, and is instead attempting to inherit the accessor (`state`) of a prototype, then an empty state implementation is automatically created for the inheritor, which in turn generates a corresponding new accessor method (`person.state`), to which the original call is then forwarded.

Even though the inheritor’s new state implementation is empty, it inherits all the methods, data, events, etc. of the prototype’s states, which it identifies as its **protostates**. The inheritor may adopt a protostate as its current state just as it would with a state of its own. In this case a temporary **virtual state** is created within the state implementation of the inheritor, as a stand-in for the protostate. Virtual states exist only so long as they are active; once the object transitions elsewhere, any virtual states consequently rendered inactive are automatically destroyed.

This system of protostates and virtual states allows an object’s state implementation to benefit from the prototypal reuse patterns of JavaScript without the states themselves having to maintain any direct prototypal relationship with each other.

[**View source:**](http://statejs.org/source/) [`State` constructor](http://statejs.org/source/#state--constructor), [`State.prototype.protostate`](http://statejs.org/source/#state--prototype--protostate)

* * *

*Return to: [**Inheritance**](#concepts--inheritance)  <  [Concepts](#concepts)  <  [Overview](#overview)  <  [top](#top)*

* * *


<a name="concepts--selectors" href="#concepts--selectors" />
### Selectors

The accessor method of a stateful object (`object.state()`) returns its current state if called with no arguments. If a **selector** string argument is provided, the accessor will query the object’s state tree for a matching state.

**State** uses a simple selector format:

1. State names are delimited from their member substates with the dot (`.`) character.

2. A selector that begins with `.` will be evaluated *relative* to the local context, while a selector that begins with a name will be evaluated as *absolute*, i.e., relative to the root state.

3. An absolute fully-qualified name is not necessary except for disambiguation: `'A.B.C'` and `'C'` will both resolve to the deep substate named `C` provided that there is no other state named `C` located higher in the state tree.

4. Special cases: empty-string `''` references the root state; single-dot `.` references the local context state; double-dot `..` references its immediate superstate, etc.

5. Querying a selector ending in `*` returns an array of the immediate substates of that level, while `**` returns a flattened array of all descendant substates of that level.

```javascript
var o = {};
state( o, {
    A: {
        AA: state( 'initial', {
            AAA: state
        }),
        AB: state
    },
    B: state
});

o.state();            // >>> State 'AA'
o.state('');          // >>> State ''
o.state('A.AA.AAA');  // >>> State 'AAA'
o.state('.');         // >>> State 'AA'
o.state('..');        // >>> State 'A'
o.state('...');       // >>> State ''
o.state('.AAA');      // >>> State 'AAA'
o.state('..AB');      // >>> State 'AB'
o.state('...B');      // >>> State 'B'
o.state('AAA');       // >>> State 'AAA'
o.state('.*');        // >>> [ State 'AAA' ]
o.state('AAA.*');     // >>> []
o.state('*');         // >>> [ State 'A', State 'B' ]
o.state('**');        // >>> [ State 'A', State 'AA', State 'AAA', State 'AB', State 'B' ]
```
```coffeescript
o = {}
state o,
  A:
    AA: state 'initial'
      AAA: state
    AB: state
  B: state

o.state()             # >>> State 'AA'
o.state ''            # >>> State ''
o.state 'A.AA.AAA'    # >>> State 'AAA'
o.state '.'           # >>> State 'AA'
o.state '..'          # >>> State 'A'
o.state '...'         # >>> State ''
o.state '.AAA'        # >>> State 'AAA'
o.state '..AB'        # >>> State 'AB'
o.state '...B'        # >>> State 'B'
o.state 'AAA'         # >>> State 'AAA'
o.state '.*'          # >>> [ State 'AAA' ]
o.state 'AAA.*'       # >>> []
o.state '*'           # >>> [ State 'A', State 'B' ]
o.state '**'          # >>> [ State 'A', State 'AA', State 'AAA', State 'AB', State 'B' ]
```

Selectors are similarly put to use elsewhere as well: for example, a [transition](#)’s `origin` and `target` properties are evaluated as selectors, and several `State` methods, including [`change`](#), [`is`](#), [`isIn`](#), [`has`](#), [`isSuperstateOf`](#), and [`isProtostateOf`](#), accept a selector as their main argument.

[**View source:**](http://statejs.org/source/) [`State.prototype.query`](http://statejs.org/source/#state--prototype--query)

* * *

*Return to: [**Selectors**](#concepts--selectors)  <  [Concepts](#concepts)  <  [Overview](#overview)  <  [top](#top)*

* * *


<a name="concepts--attributes" href="#concepts--attributes" />
### Attributes

State expressions may include a space-delimited set of **attributes**, provided as a single string argument that precedes the object map within a `state()` call.

```javascript
state( obj, 'abstract', {
    Alive: state( 'default initial mutable', {
        update: function () { /*...*/ }
    }),
    Dead: state( 'final', {
        update: function () { /*...*/ }
    })
});
```
```coffeescript
state obj, 'abstract'
  Alive: state 'default initial mutable'
    update: -> # ...
  Dead: state 'final'
    update: -> # ...
```

* * *

* **[Mutability](#concepts--attributes--mutability)**
* **[Abstraction](#concepts--attributes--abstraction)**
* **[Reflection](#concepts--attributes--reflection)**
* **[Destination](#concepts--attributes--destination)**
* **[Temporality](#concepts--attributes--temporality)**
* **[Concurrency](#concepts--attributes--concurrency)**

* **[Implications of selected attribute combinations](#concepts--attributes--implications-of-selected-attribute-combinations)**

* * *

<a name="concepts--attributes--mutability" href="#concepts--attributes--mutability" />
#### Mutability

By default, states are **weakly immutable** — their data, methods, guards, substates, and transitions cannot be altered once the state has been constructed — a condition that can be affected at construct-time by these mutability attributes. Each attribute is implicitly inherited from any of the state’s ancestors, be they superstates or protostates. They are listed here in order of increasing precedence.

* **mutable** — Including the `mutable` attribute in the state’s expression lifts the default restriction of weak immutability, exposing `State` instance methods such as `mutate`, `addMethod`, `addSubstate`, and so on.

* **finite** — Declaring a state `finite` guarantees its hierarchical structure; descendant states may neither be added nor removed.

* *static* — (Reserved; not presently implemented.) 

* **immutable** — Adding `immutable` makes a state **strongly immutable**, whereupon immutability is enforced permanently and absolutely; `immutable` overrules and contradicts `mutable` (and implies `finite`), irrespective of whether the attributes are literal or inherited.

<a name="concepts--attributes--abstraction" href="#concepts--attributes--abstraction" />
#### Abstraction

**State** does not confine currency to “leaf” states; rather, all states — including substate-bearing interior states — are by default regarded as **concrete**, and thus may be targeted by a transition. Nevertheless, sometimes it may still be appropriate to author **abstract** states whose purpose is limited to serving as a common ancestor of descendant concrete states.

* **abstract** — A state that is `abstract` cannot itself be current. Consequently a transition target that points to an abstract state will be forcibly redirected to one of its substates.

* **concrete** — Including the `concrete` attribute will override the abstraction that would otherwise have been inherited from an `abstract` protostate.

* **default** — Marking a state `default` designates it as the intended redirection target for any transition that has targeted its abstract superstate.

<a name="concepts--attributes--reflection" href="#concepts--attributes--reflection" />
#### Reflection

* *reflective* — (Reserved; not presently implemented.) 

<a name="concepts--attributes--destination" href="#concepts--attributes--destination" />
#### Destination

Currency must often be initialized or confined to particular states, as directed by the destination attributes:

* **initial** — Marking a state `initial` specifies which state is to be assumed immediately following the `state()` application. No transition or any `enter` or `arrive` events result from this initialization.

* **conclusive** — Once a `conclusive` state is entered, it cannot be exited, although transitions may still freely traverse within its substates.

* **final** — Once a state marked `final` is entered, no further transitions are allowed.

<a name="concepts--attributes--temporality" href="#concepts--attributes--temporality" />
#### Temporality

Changes to a stateful object’s currency as a consequence of transitions, and to states themselves, can be recorded and revisited on states that bear either of the temporality attributes `history` and `retained`.

* **history** — Marking a state with the `history` attribute causes its internal state to be recorded in a sequential history. Whereas a `retained` state is concerned only with the most recent internal state, a state’s history can be traversed and altered, resulting in transitions back or forward to previously or subsequently held internal states.

* **retained** — A `retained` state is one that preserves its own internal state, such that, after the state has become no longer active, a subsequent transition targeting that particular state will be automatically redirected to whichever of its descendant states was most recently current.

* **shallow** — Normally, states that are `retained` or that keep a `history` persist their internal state *deeply*, i.e., with a scope extending over all of the state’s descendant states. Marking a state `shallow` limits the scope of its persistence to its immediate substates only.

<a name="concepts--attributes--concurrency" href="#concepts--attributes--concurrency" />
#### Concurrency

* *concurrent* — (Reserved; not presently implemented.) 

* * *

<a name="concepts--attributes--implications-of-selected-attribute-combinations" href="#concepts--attributes--implications-of-selected-attribute-combinations" />
#### Implications of selected attribute combinations

* **“finite mutable”** — A state that is, literally or by inheritance, both `finite` and `mutable` guarantees its hierarchical structure without imposing absolute immutability.

* **“immutable history”** — A `history` state that also is, literally or by inheritance, `immutable` will record and traverse its history more efficiently, since it can optimize based on the foreknowledge that its records cannot contain any local or downstream mutations that would otherwise need to be detected and interstitially applied over the course of a traversal.

* **“abstract concrete”** is an invalid contradiction. If both attributes are literally applied to a state, `concrete` takes precedence and negates `abstract`.

* * *

*Return to: [**Attributes**](#concepts--attributes)  <  [Concepts](#concepts)  <  [Overview](#overview)  <  [top](#top)*

* * *


<a name="concepts--data" href="#concepts--data" />
### Data

Arbitrary **data** can be attached to each state, and inherited accordingly through protostates and superstates. Data may be declared within an expression, and both read and written using the `data` method:

```javascript
function Chief () {
    state( this, 'mutable', {
        Enraged: {
            Thermonuclear: {
                data: {
                    task: 'destroy'
                    budget: Infinity
                }
            }
        }
    });
}
state( Chief.prototype, {
    data: {
        task: 'innovate',
        budget: 1e10
    },
    Enraged: {
        data: {
            action: 'compete'
        }
    }
}


var mobs = new Chief;
mobs.state().data();
// >>> { task: 'innovate', budget: 10000000000 }

mobs.state('-> Enraged');
mobs.state().data({ target: 'Moogle' });
mobs.state().data();
// >>> { target: 'Moogle', task: 'compete', budget: 10000000000 }

mobs.state().go('Thermonuclear');
mobs.state().data();
// >>> { target: 'Moogle', task: 'destroy', budget: Infinity }
```
```coffeescript
class Chief
  state @::,
    data:
      task: 'innovate'
      budget: 1e10
    Enraged:
      data:
        task: 'compete'

  constructor: ->
    state this, 'mutable'
      Enraged:
        Thermonuclear:
          data:
            task: 'destroy'
            budget: Infinity


mobs = new Chief
mobs.state().data()
# >>> { task: 'innovate', budget: 10000000000 }

mobs.state '-> Enraged'
mobs.state().data target: 'Moogle'
mobs.state().data()
# >>> { target: 'Moogle', task: 'compete', budget: 10000000000 }

mobs.state().go 'Thermonuclear'
mobs.state().data()
# >>> { target: 'Moogle', task: 'destroy', budget: Infinity }
```

[**View source:**](http://statejs.org/source/) [`State.privileged.data`](http://statejs.org/source/#state--privileged--data)

* * *

*Return to: [**Data**](#concepts--data)  <  [Concepts](#concepts)  <  [Overview](#overview)  <  [top](#top)*

* * *


<a name="concepts--methods" href="#concepts--methods" />
### Methods

A defining feature of **State** is the ability for an object to exhibit a variety of behaviors. A  state expresses behavior by defining **overrides** for any of its object’s methods.

* * *

* **[Delegator methods](#concepts--methods--delegators)**
* **[Method context](#concepts--methods--context)**
* **[Handling calls to nonexistent methods](#concepts--methods--nonexistent)**
* **[Example](#concepts--method--example)**

* * *

<a name="concepts--methods--delegators" href="#concepts--methods--delegators" />
#### Delegator methods

When state is applied to an object, **State** identifies any methods already present on the object for which there exists at least one override somewhere within the state expression. These methods will be relocated to the root state, and replaced on the object with a special **delegator** method. The delegator’s job is to redirect any subsequent calls it receives to the object’s current state, from which **State** will then locate and invoke the proper stateful implementation of the method. Should no active states contain an override for the called method, the delegation will default to the object’s original implementation of the method if one exists, or result in a `noSuchMethod` [**event**](#concepts--events) otherwise.

```javascript
var shoot = function () { return "pew!"; },
    raygun = { shoot: shoot };

raygun.shoot === shoot;                     // >>> true

state( raygun, {
    RapidFire: {
        shoot: function () { return "pew pew pew!"; }
    }
});

raygun.shoot === shoot;                     // >>> false
raygun.shoot.isDelegator;                   // >>> true
raygun.state('').method('shoot') === shoot  // >>> true

raygun.shoot();                             // >>> "pew!"
raygun.state('-> RapidFire');               // >>> State 'RapidFire'
raygun.shoot();                             // >>> "pew pew pew!"
```
```coffeescript
shoot = -> "pew!"
raygun = shoot: shoot

raygun.shoot is shoot                       # >>> true

state raygun,
  RapidFire:
    shoot: -> "pew pew pew!"

raygun.shoot is shoot                       # >>> false
raygun.shoot.isDelegator                    # >>> true
raygun.state('').method('shoot') is shoot   # >>> true

raygun.shoot()                              # >>> "pew!"
raygun.state '-> RapidFire'                 # >>> State 'RapidFire'
raygun.shoot()                              # >>> "pew pew pew!"
```

[**View source:**](http://statejs.org/source/) [`State createDelegator`](http://statejs.org/source/#state--private--create-delegator), [`State.privileged.addMethod`](http://statejs.org/source/#state--privileged--add-method)

<a name="concepts--methods--context" href="#concepts--methods--context" />
#### Method context

When an owner object’s delegated state method is called, it is invoked not in the context of its owner, but rather of the state in which it is declared, or, if the method is inherited from a protostate, in the context of the local state that inherits from that protostate. This subtle difference in policy does mean that, within a state method, the owner cannot be directly referenced by `this` as it normally would; however, it is still always accessible by calling `this.owner()`.

Of greater importance is the lexical information afforded by binding state methods to their associated state. This allows state method code to take advantage of polymorphic idioms, such as calling up to a superstate’s implementation of a method, as facilitated by the `apply` and `call` methods of `State`.

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

> **Note:** it may be important here to call attention to a significant difference distinguishing these methods from their familiar eponymous counterparts at `Function.prototype` — here, the first argument accepted by `apply` and `call` is a string that names a state method, rather than a context object (since, again, the resulting invocation’s context is automatically bound to that method’s associated `State`).

[**View source:**](http://statejs.org/source/) [`State.prototype.apply`](http://statejs.org/source/#state--prototype--apply), [`State.privileged.method`](http://statejs.org/source/#state--privileged--method)

<a name="concepts--methods--nonexistent" href="#concepts--methods--nonexistent" />
#### Handling calls to currently nonexistent methods

In the case of an attempt to `call` or `apply` a state method that does not exist within that state and cannot be inherited from any protostate or superstate, the invocation will fail and return `undefined`. In addition, **State** allows such a contingency to be “trapped” by emitting a generic `noSuchMethod` [**event**](#concepts--events), whose listeners take as arguments the sought `methodName` and an `Array` of the arguments provided to the failed invocation. Additionally, a more specific `noSuchMethod:<methodName>` event type is emitted as well, whose listeners take just the arguments as provided to the failed invocation.

```javascript
var log = console.log,
    owner = {},
    root;

state( owner, 'abstract', {
    foo: function () { log("I exist!"); },

    A: state( 'default', {
        bar: function () { log("So do I!"); }
    }),
    B: state
});
// >>> State 'A'

root = owner.state('');
root.on( 'noSuchMethod', function ( methodName, args ) {
    log("`owner` has no method " + methodName + " in this state!");
});
root.on( 'noSuchMethod:bar': function () {
    log("You also could have trapped a bad call to 'bar' like this.");
});

owner.foo();            // log <<< "I exist!"
owner.bar();            // log <<< "So do I!"
owner.state('-> B');    // State 'B'
owner.foo();            // log <<< "I exist!"
owner.bar();            // undefined
// log <<< "`owner` has no method 'bar' in this state!"
// log <<< "You also could have trapped a bad call to 'bar' like this."
```
```coffeescript
log = console.log
owner = {}

state owner, 'abstract'
  foo: -> log "I exist!"

  A: state 'default'
    bar: -> log "So do I!"
  B: state
# >>> State 'A'

root = owner.state ''
root.on 'noSuchMethod', ( methodName, args ) ->
  log "`owner` has no method '#{methodName}' in this state!"
root.on 'noSuchMethod:bar', ( args... ) ->
  log "You also could have trapped a bad call to 'bar' like this."

owner.foo()             # log <<< "I exist!"
owner.bar()             # log <<< "So do I!"
owner.state '-> B'      # State 'B'
owner.foo()             # log <<< "I exist!"
owner.bar()             # undefined
# log <<< "`owner` has no method 'bar' in this state!"
# log <<< "You also could have trapped a bad call to 'bar' like this."
```

[**View source:**](http://statejs.org/source/) [`State.prototype.apply`](http://statejs.org/source/#state--prototype--apply)

<a name="concepts--methods--example" href="#concepts--methods--example" />
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
        this.change('Frozen');
        return result;
    },

    Dirty: {
        save: function () {
            this.change( 'Saved', [
                this.owner().location(), this.owner().read()
            ]); // [5]
            return this.owner();
        }
    },
    Saved: state( 'initial', {
        edit: function () {
            var result = this.superstate().apply( 'edit', arguments ); // [2]
            this.change('Dirty');
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
                    if ( err ) return transition.abort( err ).change('Dirty');
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

  state @::, 'abstract'
    freeze: -> # [3]
      result = @call 'save' # [4]
      @change 'Frozen'
      result

    Dirty:
      save: ->
        @change 'Saved', [ @owner.location(), @owner().read() ] # [5]
        @owner()
    
    Saved: state 'initial'
      edit: ->
        result = @superstate().apply 'edit', arguments # [2]
        @change 'Dirty'
        result

      Frozen: state 'final'
        edit: ->
        freeze: ->

    transitions:
      Writing: origin: 'Dirty', target: 'Saved', action: ( location, text ) ->
        fs.writeFile location, text, ( err ) =>
          return @abort( err ).change 'Dirty' if err
          do @end
```

1. A “privileged” method `edit` is defined inside the constructor, closing over a private variable `text` to which it requires access. Later, when state is applied to the object, this method will be moved to the root state, and a delegator will be added to the object in its place.

2. An overridden implementation of `edit`, while not closed over the constructor’s private variable `text`, is able to call up to the original implementation using `this.superstate().apply('edit')`.

3. The `freeze` method is declared on the abstract root state, callable from states `Dirty` and `Saved` (but not `Frozen`, where it is overridden with a no-op).

4. The `save` method, which only appears in the `Dirty` state, is still callable from other states, as its presence in `Dirty` causes a no-op version of the method to be automatically added to the root state. This allows `freeze` to safely call `save` despite the possiblity of being in a state (`Saved`) with no such method.

5. Changing to `Saved` from `Dirty` results in the `Writing` [**transition**](#concepts--transitions), whose asynchronous `action` is invoked with the arguments array provided by the `change` call.

* * *

*Return to: [**Methods**](#concepts--methods)  <  [Concepts](#concepts)  <  [Overview](#overview)  <  [top](#top)*

* * *


<a name="concepts--transitions" href="#concepts--transitions" />
### Transitions

Whenever an object’s current state changes, a **transition** state is created, which temporarily assumes the role of the current state while the object is travelling from its **origin** or **source** state to its **target** state.

* * *

* **[Transition expressions](#concepts--transitions--expressions)**
* **[The transition lifecycle](#concepts--transitions--lifecycle)**
* **[Aborted transitions](#concepts--transitions--aborted)**

* * *

<a name="concepts--transitions--expressions" href="#concepts--transitions--expressions" />
#### Transition expressions

A state expression may include any number of **transition expressions**, which define some **action** to be performed, either synchronously or asynchronously, along with selectors for the `origin`/`source` and `target` states to which the transition should apply, and guards to determine the appropriate transition to employ.

Before an object undergoes a state change, it examines the transition expressions available for the given origin and target, and selects one to be enacted. To test each expression, its `origin` state is validated against its `admit` transition guards, and its `target` state is validated against its `release` transition guards. The object then instantiates a `Transition` based on the first valid transition expression it encounters, or, if no transition expression is available, a generic actionless `Transition`.

Where transition expressions should be situated in the state hierarchy is largely a matter of discretion. In determining the appropriate transition expression for a given origin–target pairing, the search proceeds, in order:

1. at the expression’s `target` state (compare to the manner in which CSS3 transitions are declared with respect to classes)
2. at the expression’s `origin` state
3. progressively up the superstate chain of `target`
4. progressively up the superstate chain of `origin`

Transitions can therefore be organized in a variety of ways, but ambiguity resolution is regular and predictable, as demonstrated with the `Zig` transition in the example below:

```javascript
// An asynchronous logger
function log ( message, callback ) { /* ... */ }

function Foo () {}
state( Foo.prototype, 'abstract', {
    Bar: state( 'default initial' ),
    Baz: state({
        transitions: {
            Zig: { action: function () {
                var transition = this;
                log( "BLEEP", function () { transition.end(); } );
            }}
        }
    }),

    transitions: {
        Zig: { origin: 'Bar', target: 'Baz', action: function () {
            var transition = this;
            log( "bleep", function () { transition.end(); } );
        }},
        Zag: { origin: 'Baz', target: 'Bar', action: function () {
            var transition = this;
            log( "blorp", function () { transition.end(); } );
        }}
    }
});

var foo = new Foo;

function zig () {
    var transition;
    foo.state();                   // State 'Bar'
    foo.state('-> Baz');           // (enacts the `Zig` transition of `Baz`)
    transition = foo.state();      // Transition 'Zig'
    transition.on( 'end', zag );
}

function zag () {
    var transition;
    foo.state();                   // State 'Baz'
    foo.state('-> Bar');           // (enacts the `Zag` transition of the root state)
    transition = foo.state();      // Transition `Zag`
    transition.on( 'end', stop );
}

function stop () {
    return "take a bow";
}

zig();
// ...
// log <<< "BLEEP"
// ...
// log <<< "blorp"
```
```coffeescript
# An asynchronous logger
log = ( message, callback ) -> # ...

class Foo
  state @::, 'abstract'
    Bar: state 'default initial'
    Baz: state
      transitions:
        Zig: action: ->
          log "BLEEP", => @end()

    transitions:
      Zig: origin: 'Bar', target: 'Baz', action: ->
        log "bleep", => @end()
      Zag: origin: 'Baz', target: 'Bar', action: ->
        log "blorp", => @end()

foo = new Foo

zig = ->
  foo.state()               # State 'Bar'
  foo.state '-> Baz'        # (enacts the `Zig` transition of `Baz`)
  transition = foo.state()  # Transition 'Zig'
  transition.on 'end', zag

zag = ->
  foo.state()               # State 'Baz'
  foo.state '-> Bar'        # (enacts the `Zag` transition of the root state)
  transition = foo.state()  # Transition 'Zag'
  transition.on 'end', stop

stop = -> "take a bow"

do zig
# ...
# log <<< "BLEEP"
# ...
# log <<< "blorp"
```

<a name="concepts--transitions--lifecycle" href="#concepts--transitions--lifecycle" />
#### The transition lifecycle

A transition performs a stepwise traversal over its **domain**, which is defined as the subtree rooted at the least common ancestor state between the transition’s `source` and `target`. At each step in the traversal, the transition instance acts as a temporary substate of the visited state, such that event listeners may expect to inherit from the states in which they are declared.

The traversal sequence is decomposable into an **ascending phase**, an **action phase**, and a **descending phase**.

1. During the ascending phase, the object emits a `depart` event on the `source`, and an `exit` event on any state that will be rendered inactive as a consequence of the transition.

2. The transition then reaches the domain root and moves into the action phase, whereupon it executes any `action` defined in its associated transition expression.

3. Once the action has ended, the transition then proceeds with the descending phase, emitting `enter` events on any state that is rendered newly active, and concluding with an `arrival` event on its `target` state.

```javascript
function Mover () {}
state( Mover.prototype, {
    Stationary: {
        Idle: state( 'initial' ),
        Alert: state
    },
    Moving: {
        Walking: state,
        Running: {
            Sprinting: state
        }
    },

    transitions: {
        Announcing: { source: '*', target: '*', action: function () {
            var name = this.superstate().name() || "the root state";
            console.log "action of transition is at " + name;
            this.end();
        }}
    },
    
    // Log the transitional events of all states
    construct: function () {
        var events, substates, i, j;
        events = 'depart exit enter arrive'.split(' ');
        substates = [this].concat( this.substates( true ) );
        for ( i in substates ) for ( j in events ) {
            ( function ( s, e ) {
                s.on( e, function () {
                    console.log this.name() + " " + e;
                });
            }( substates[i], events[j] ) );
        }
    }
});

var m = new Mover;

m.state('-> Alert');
// log <<< "depart Idle"
// log <<< "exit Idle"
// log <<< "action of transition is at Stationary"
// log <<< "enter Alert"
// log <<< "arrive Alert"

m.state('-> Sprinting');
// log <<< "depart Alert"
// log <<< "exit Alert"
// log <<< "exit Stationary"
// log <<< "action of transition is at the root state"
// log <<< "enter Moving"
// log <<< "enter Running"
// log <<< "enter Sprinting"
// log <<< "arrive Sprinting"
```
```coffeescript
class Mover
  state @::,
    Stationary:
      Idle: state 'initial'
      Alert: state
    Moving:
      Walking: state
      Running:
        Sprinting: state

    transitions:
      Announcing: source: '*', target: '*', action: ->
        name = @superstate().name() or "the root state"
        console.log "action of transition is at {name}"
        @end()

    # Log the transitional events of all states
    construct: ->
      events = 'depart exit enter arrive'.split ' '
      for s in [this].concat @substates true
        for e in events
          do ( s, e ) -> s.on e, -> console.log "#{e} #{@name()}"

m = new Mover

m.state '-> Alert'
# log <<< "depart Idle"
# log <<< "exit Idle"
# log <<< "action of transition is at Stationary"
# log <<< "enter Alert"
# log <<< "arrive Alert"

m.state '-> Sprinting'
# log <<< "depart Alert"
# log <<< "exit Alert"
# log <<< "exit Stationary"
# log <<< "action of transition is at the root state"
# log <<< "enter Moving"
# log <<< "enter Running"
# log <<< "enter Sprinting"
# log <<< "arrive Sprinting"
```

(*See [Transitional events](#concepts--events--types--transitional)*.)

<a name="concepts--transitions--aborted" href="#concepts--transitions--aborted" />
#### Aborted transitions

Should a new transition be started while a transition is already in progress, an `abort` event is emitted on the previous transition. The new transition will reference the aborted transition as its `source`, retaining by reference the same `origin` state as that of the aborted transition, and the traversal will resume, starting with a `depart` and `exit` event emitted on the aborted transition. Further redirections of the pending traversal will continue to grow this `source` chain until a transition finally arrives at its `target` state.

[**View source:**](http://statejs.org/source/) [`Transition`](http://statejs.org/source/#transition), [`TransitionExpression`](http://statejs.org/source/#transition-expression), [`StateController.privileged.change`](http://statejs.org/source/#state-controller--privileged--change)

* * *

*Return to: [**Transitions**](#concepts--transitions)  <  [Concepts](#concepts)  <  [Overview](#overview)  <  [top](#top)*

* * *


<a name="concepts--events" href="#concepts--events" />
### Events

Events in **State** follow the familiar **emitter** pattern: `State` exposes methods `emit` (aliased to `trigger`) for emitting typed events, and `addEvent`/`removeEvent` (aliased to `on`/`off` and `bind`/`unbind`) for assigning listeners to a particular event type.

* * *

* **[Existential events](#concepts--events--existential-events)**
* **[Transitional events](#concepts--events--transitional-events)**
* **[Mutation events](#concepts--events--mutation-events)**
* **[Custom event types](#concepts--events--custom-event-types)**
* **[Using events to express determinism](#concepts--events--expressing-determinism)**

* * *

<a name="concepts--events--existential" href="#concepts--events--existential-events" />
#### Existential events

* **construct** — Once a state has been instantiated, it emits a `construct` event. Since a state is not completely constructed until its substates have themselves been constructed, the full `construct` event sequence proceeds in a bottom-up manner.

* **destroy** — A state is properly deallocated with a call to `destroy()`, either on itself or on a superstate. This causes a `destroy` event to be emitted immediately prior to the state and its contents being cleared.

<a name="concepts--events--transitional" href="#concepts--events--transitional-events" />
#### Transitional events

As alluded to above, during a transition’s progression from its origin state to its target state, all affected states along the way emit any of four types of events that describe their relation to the transition.

* **depart** — Exactly one `depart` event is always emitted from the origin state, and marks the beginning of the transition.

* **exit** — It is followed by zero or more `exit` events, one each from amongst the origin state and any of its superstates that will no longer be active as a result of the transition.

* **enter** — Likewise, zero or more `enter` events are emitted, one for each state that will become newly active.

* **arrive** — Finally, an `arrive` event will occur exactly once, specifically at the target state, marking the end of the transition.

Given this scheme, a few noteworthy cases stand out. A “non-exiting” transition is one that only *descends* in the state tree, i.e. it progresses from a superstate to a substate of that superstate, emitting one `depart`, zero `exit` events, one or more `enter` events, and one `arrive`. Conversely, a “non-entering” transition is one that only *ascends* in the state tree, progressing from a substate to a superstate thereof, emitting one `depart`, one or more `exit` events, zero `enter` events, and one `arrive`. For a reflexive transition, which is one whose target is its origin, the event sequence consists only of one `depart` and one `arrive`, both emitted from the same state.

<a name="concepts--events--mutation-events" href="#concepts--events--mutation-events" />
#### Mutation events

* **mutate** — When a state’s data or other contents change, it emits a `mutate` event containing the changes made relative to its immediately prior condition.

```javascript
var flavors = [ 'vanilla', 'chocolate', 'strawberry', 'Stephen Colbert’s Americone Dream' ];

function Kid () {}
state( Kid.prototype, {
    data: {
        favorite: 'chocolate'
    },

    whim: function () {
        this.data({ favorite: flavors[ Math.random() * flavors.length << 0 ] });
    },
    whine: function ( complaint ) {
        typeof console !== 'undefined' && console.log( complaint );
    },

    mutate: function ( mutation, delta, before, after ) {
        this.owner().whine( "I hate " + delta.favorite + ", I want " + edit.favorite + "!" );
    }
});

var junior = new Kid;

// We could have added listeners this way also
junior.state().on( 'mutate', function ( expr, delta, before, after ) { /* ... */ });

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
      @data favorite: flavors[ Math.random() * flavors.length << 0 ]
    whine: ( complaint ) -> console?.log complaint

    mutate: ( mutation, delta, before, after ) ->
      @owner.whine "I hate #{ delta.favorite }, I want #{ edit.favorite }!"

junior = new Kid

# We could have added listeners this way also
junior.state().on 'mutate', ( expr, delta, before, after ) -> # ...

do junior.whim   # log <<< "I hate chocolate, I want strawberry!"
do junior.whim   # log <<< "I hate strawberry, I want chocolate!"
do junior.whim   # No whining! On a whim, junior stood pat this time.
do junior.whim   # log <<< "I hate chocolate, I want Stephen Colbert’s Americone Dream!"
```

[**View source:**](http://statejs.org/source/) [`mutation.js`](http://statejs.org/source/#state--mutation.js)

<a name="concepts--events--custom-event-types" href="#concepts--events--custom-event-types" />
#### Custom event types

Through exposure of the `emit` method, state instances allow any type of event to be broadcast and consumed.

```javascript
function Kid () {}
state( Kid.prototype, {
    Happy: state(),
    Sad: state(),
    events: {
        gotIceCream: function () { this.be('Happy'); },
        spilledIceCream: function () { this.be('Sad'); }
    }
});

var junior = new Kid;
junior.state().emit('gotIceCream');
junior.state();
// >>> State 'Happy'
junior.state().emit('spilledIceCream');
junior.state();
// >>> State 'Sad'
```
```coffeescript
class Kid
  state @::,
    Happy: state()
    Sad: state()
    events:
      gotIceCream: -> @be 'Happy'
      spilledIceCream: -> @be 'Sad'

junior = new Kid
junior.state().emit 'gotIceCream'
junior.state()
# >>> State 'Happy'
junior.state().emit 'spilledIceCream'
junior.state()
# >>> State 'Sad'
```

[**View source:**](http://statejs.org/source/) [`State.privileged.emit`](http://statejs.org/source/#state--privileged--emit)

<a name="concepts--events--expressing-determinism" href="#concepts--events--expressing-determinism" />
#### Using events to express determinism

An event listener may also be expressed simply as a State name, which is interpreted as an order to transition to that State after all of an event’s callbacks have been invoked. This bit of shorthand allows for concise expression of *deterministic* behavior, where the occurrence of a particular event type within a particular State has a definitive, unambiguous effect on the state of the object.

```javascript
function DivisibleByThreeComputer () {
    state( this, 'abstract', {
        s0: state( 'initial default',
            { '0':'s0', '1':'s1' } ),
        s1: { '0':'s2', '1':'s0' },
        s2: { '0':'s1', '1':'s2' }
    });
}
DivisibleByThreeComputer.prototype.compute = function ( number ) {
    var i, l, binary = number.toString(2);
    this.state('->'); // reset
    for ( i = 0, l = binary.length; i < l; i++ ) {
        this.state().emit( binary[i] );
    }
    return this.state().is('s0');
}

var three = new DivisibleByThreeComputer;
three.compute( 8 );          // >>> false
three.compute( 78 );         // >>> true
three.compute( 1000 );       // >>> false
three.compute( 504030201 );  // >>> true
```
```coffeescript
class DivisibleByThreeComputer
  constructor: ->
    state this, 'abstract'
      s0: state 'initial default'
          '0':'s0', '1':'s1'
      s1: '0':'s2', '1':'s0'
      s2: '0':'s1', '1':'s2'

  compute: ( number ) ->
    @state '->' # reset
    @state().emit symbol for symbol in number.toString 2
    @state().is 's0'

three = new DivisibleByThreeComputer
three.compute 8              # >>> false
three.compute 78             # >>> true
three.compute 1000           # >>> false
three.compute 504030201      # >>> true
```

* * *

*Return to: [**Events**](#concepts--events)  <  [Concepts](#concepts)  <  [Overview](#overview)  <  [top](#top)*

* * *


<a name="concepts--guards" href="#concepts--guards" />
### Guards

States and transitions can be outfitted with **guards** that dictate whether and how they may be used.

* * *

* **[State guards](#concepts--guards--state-guards)**
* **[Transition guards](#concepts--guards--transition-guards)**

* * *

<a name="concepts--state-guards" href="#concepts--state-guards" />
#### State guards

For a transition to be allowed to proceed, it must first have satisfied any guards imposed by the states that would be its endpoints: the *origin* state from which it will depart must agree to `release` the object to the intended *target* at which it will arrive, and likewise the *target* must also agree to `admit` the object from the departed origin.

```javascript
var object = {};
state( object, {
    A: state( 'initial', {
        admit: false,
        release: { D: false }
    }),
    B: {
        data: { bleep: 'bleep' },
        release: {
            'C, D': true,
            'C.**': false
        }
    },
    C: {
        data: { blorp: 'blorp' },
        admit: true,
        C1: {
            C1a: state
        },
        C2: state
    },
    D: {
        enter: function () { this.$('B').removeGuard( 'admit' ); }
        admit: function ( fromState ) { return 'blorp' in fromState.data() },
        release: function ( toState ) { return 'bleep' in toState.data() }
    }
})
```
```coffeescript
state object = {},
  A: state( 'initial',
    admit: false
    release: D: false
  )
  B:
    admit: false
    release:
      'C, D': true
      'C.**': false
    data: bleep: 'bleep'
  C:
    data: blorp: 'blorp'
    C1:
      C1a: state
    C2: state
  D:
    enter: -> @$('B').removeGuard 'admit'
    admit: ( fromState ) -> true if 'blorp' of fromState.data()
    release: ( toState ) -> true if 'bleep' of toState.data()
```

Here we observe state guards imposing the following restrictions:

* `object` initializes into state `A`, but upon leaving it may never return; we’ve also specifically disallowed direct transitions from `A` to `D`.

* State `B` disallows entry from anywhere (for now), and releases conditionally to `C` or `D` but not directly to any descendant states of `C`; we also note its data item `bleep`.

* State `C` imposes no guards, but we note its data item `blorp`.

* State `D` “unlocks” `B`; it is also guarded by checking the opposing state’s `data`, allowing admission only from states with a data item keyed `blorp`, and releasing only to states with data item `bleep`.

The result is that `object` is initially constrained to a progression from state `A` to `C` or its descendant states; exiting the `C` domain is initially only possible by transitioning to `D`; from `D` it can only transition back into `C`, however on this and subsequent visits to `C`, it has the option of transitioning to either `B` or `D`, while `B` insists on directly returning the object’s state only to one of its siblings `C` or `D`.

[**View source:**](http://statejs.org/source/) [`StateController evaluateGuard`](http://statejs.org/source/#state-controller--private--evaluate-guard), [`StateController.prototype.getTransitionExpressionFor`](http://statejs.org/source/#state-controller--prototype--get-transition-expression-for)

<a name="concepts--transition-guards" href="#concepts--transition-guards" />
#### Transition guards

Transition expressions may also include `admit` and `release` guards. Transition guards are used to decide which one transition amongst possibly several is to be executed as an object changes its state between a given `origin` and `target`.

```javascript
function Scholar () {}
state( Scholar.prototype, 'abstract', {
    Matriculated: state( 'initial', {
        graduate: function ( gpa ) {
            this.owner().gpa = gpa;
            this.change( 'Graduated' );
        }
    }),
    Graduated: state( 'final' ),

    transitions: {
        Summa: {
            origin: 'Matriculated', target: 'Graduated',
            admit: function () { return this.data().gpa >= 3.95; },
            action: function () { /* swat down offers */ }
        },
        Magna: {
            origin: 'Matriculated', target: 'Graduated',
            admit: function () {
                var gpa = this.data().gpa;
                return 3.75 <= gpa && gpa < 3.95;
            },
            action: function () { /* swat down recruiters */ }
        },
        Laude: {
            origin: 'Matriculated', target: 'Graduated',
            admit: function () {
                var gpa = this.data().gpa;
                return 3.50 <= gpa && gpa < 3.75;
            },
            action: function () { /* brag to the cat */ }
        },
        '': {
            origin: 'Matriculated', target: 'Graduated',
            action: function () { /* blame rounding error, grab another beer */ }
        }
    }
});

var scholar = new Scholar;
scholar.graduate( 3.4999 );
```
```coffeescript
class Scholar
  state @::, 'abstract'
    Matriculated: state 'initial'
      graduate: ( gpa ) ->
        @owner().gpa = gpa
        @$ -> 'Graduated'

    Graduated: state 'final'
  
    transitions: do ->
      t = ( o ) -> o[k] = v for k,v of origin: 'Matriculated', target: 'Graduated'; o
  
      Summa: t
        admit: -> @owner().gpa >= 3.95
        action: -> # swat down offers
  
      Magna: t
        admit: -> 3.75 <= @owner().gpa < 3.95
        action: -> # choose favorite internship
  
      Laude: t
        admit: -> 3.50 <= @owner().gpa < 3.75
        action: -> # brag to the cat
  
      '': t
        action: -> # blame rounding error, grab another beer

scholar = new Scholar
scholar.graduate 3.4999
```

[**View source:**](http://statejs.org/source/) [`StateController evaluateGuard`](http://statejs.org/source/#state-controller--private--evaluate-guard), [`StateController.prototype.getTransitionExpressionFor`](http://statejs.org/source/#state-controller--prototype--get-transition-expression-for)

* * *

*Return to: [**Guards**](#concepts--guards)  <  [Concepts](#concepts)  <  [Overview](#overview)  <  [top](#top)*

* * *


<a name="concepts--history" href="#concepts--history" />
### History

A state that bears the `history` attribute will keep a record of which of its internal states have been current while the state has been active, and, unless the state is `immutable`, any mutations that it or any of its descendants have undergone.

* * *

* **[Traversing a history](#concepts--history--traversing)**
* **[Deep and shallow histories](#concepts--history--deep-and-shallow-histories)**
* **[Nesting histories](#concepts--history--nesting)**
* **[Retaining internal state](#concepts--history--retaining-internal-state)**

* * *

<a name="concepts--history--traversing" href="#concepts--history--traversing" />
#### Traversing a history

Histories are a linear timeline that may be traversed backward or forward, causing the owner object to reassume previously or subsequently held states and mutations. Traversals that span one or more recorded states will cause the owner to undergo a sequence of transitions to the traversal target — or a single transition if ordered to traverse directly — provided that no such transition is disallowed by any presiding guards. For mutable states, at a more granular level traversals may also span any number of mutations recorded between adjacently recorded states.

<a name="concepts--history--deep-and-shallow-histories" href="#concepts--history--deep-and-shallow-histories" />
#### Deep and shallow histories

By default a history is **deep**, in that it records the transitions and mutations observed throughout all of its state’s descendant states. If a state bears the `shallow` attribute, it will record a **shallow** history, which observes only the activity of the state’s immediate substates and mutations to itself.

<a name="concepts--history--nesting" href="#concepts--history--nesting" />
#### Nesting histories

As any state may bear the `history` attribute, it follows that a state that records a deep history may have descendant states that themselves record a `history`. Thusly is defined the relation between a **superhistory** and **subhistory**, wherein the elements of a subhistory are **references** to specific elements of the deep superhistory, and as such the subhistory represents a localized view to the relevant subset of its superhistory.

Further, it follows that, as reference-holding subhistories may be nested to any depth, the authoritative record of any descendant history lies with its topmost deep history, identified as its **root history**. A traversal performed on a subhistory is therefore simply a specialized expression of the generalized equivalent traversal in the context of the root history, where the actual traversal operation is performed.

```javascript
```
```coffeescript
class Whatever
  state @::, 'finite history'
    A: state
    B: state 'history'
      BA: state
      BB: state
    C: state

# Create a `Whatever` and then tour through each of its states
w = new Whatever
w.state '-> A'
w.state '-> B'
w.state '-> BA'
w.state('').data message: "Hi!"
w.state '-> BB'
w.state '-> C'
w.state '->'

# Examine the histories recorded
w.state('').history()
# >>> [ '', 'A', 'B', 'B.BA', { data: { message: NIL } }, 'B.BB', 'C', '' ]
# .elements >>> { 1:'', 3:'A', 4:'B', 6:'B.BA', 8:{ data:... }, 9:'B.BB', 12:'C', 13:'' }
# .history  >>> [ 1, 3, 4, 6, 8, 9, 12, 13 ]
w.state('B').history()
# >>> [ null, 'B', 'B.BA', 'B.BB', null ]
# .elements >>> { 2:null, 5:4, 7:6, 10:9, 11:null }
# .history  >>> [ 2, 5, 7, 10, 11 ]

# Traverse back to the beginning
w.state -> -1               # >>> State 'C'
w.state().back 2            # >>> State 'BA'
w.state().data().message    # >>> undefined
w.state().go -3             # >>> State ''

# Reexamine the histories, noting the change to the mutation
w.state('').history()
# >>> [ '', 'A', 'B', 'B.BA', { data: { message: "Hi!" } }, 'B.BB', 'C', '' ]
w.state('B').history()
# >>> [ null, 'B', 'B.BA', 'B.BB', null ]

# Traverse forward to the end
w.state -> 4                # >>> State 'BB'
w.state().data().message    # >>> "Hi!"
w.state().forward 2         # >>> State ''
```

<a name="concepts--history--retaining-internal-state" href="#concepts--history--retaining-internal-state" />
#### Retaining internal state

A state bearing the `retained` attribute causes an arriving transition to be automatically redirected to whichever of that state’s descendants was most recently the current state. If the `retained` state is also marked `history`, then its retained internal state is simply the history’s currently indexed state. Otherwise, the retained state creates a `StateHistory` for itself that is limited to recalling only its most recently current state.

The next example describes a futuristic device which can function either as a toaster or as a refrigerator. No matter which mode it is in, if the device is powered `Off` and then back `On`, it will return to the state it held when it was last `On`:

```javascript
function Device () {}
state( Device.prototype, 'abstract', {
    Off: state( 'default initial' ),
    On: state
});

Z.inherit( Airpad, Device );
function Airpad () {}
state( Airpad.prototype, {
    On: state( 'abstract retained', {
        Toasting: state( 'default' ),
        Refrigerating: state
    })
});

var airpad = new Airpad;
airpad.state();                     // >>> State 'Off'

airpad.state('-> On');              // >>> State 'Toasting'
airpad.state('-> Refrigerating');   // >>> State 'Refrigerating'
airpad.state('-> Off');             // >>> State 'Off'

airpad.state('-> On');              // >>> State 'Refrigerating'
```
```coffeescript
class Device
  state @::, 'abstract'
    Off: state 'default initial'
    On: state

class Airpad extends Device
  state @::,
    On: state 'abstract retained'
      Toasting: state 'default'
      Refrigerating: state

airpad = new Airpad
airpad.state()                      # >>> State 'Off'

airpad.state '-> On'                # >>> State 'Toasting'
airpad.state '-> Refrigerating'     # >>> State 'Refrigerating'
airpad.state '-> Off'               # >>> State 'Off'

airpad.state '-> On'                # >>> State 'Refrigerating'
```

[**View source:**](http://statejs.org/source/) [`StateController.privileged.change`](http://statejs.org/source/#state-controller--privileged--change)

* * *

*Return to: [**History**](#concepts--history)  <  [Concepts](#concepts)  <  [Overview](#overview)  <  [top](#top)*

* * *



<a name="about" href="#about" />
## About this project

* **[Design goals](#about--design-goals)**
* **[Roadmap](#about--roadmap)**

* * *


<a name="about--design-goals" href="#about--design-goals" />
### Design goals

#### Minimal footprint

All functionality of **State** is to be instigated through the exported `state` function — depending on the arguments provided, `state()` can be used either to generate state expressions, or to implement expressed states into an existing JavaScript object. In the latter case, the newly implemented system of states is thereafter to be accessed from a single `object.state()` method on the affected object.

#### Expressive power

As much as possible, **State** should aim to look and feel like a feature of the language. The interpreted shorthand syntax, simple keyword attributes, and limited interface should allow for production code that is declarative and easy to write and understand. Adopters of terse, depunctuated JavaScript dialects like CoffeeScript should only see further gains in expressiveness.

#### Opacity

Apart from the addition of the `object.state()` method, a call to `state()` must make no other modifications to a stateful object’s interface. Methods are replaced with delegators, which forward method calls to the current state. This is to be implemented *opaquely* and *non-destructively*: consumers of the object need not be aware of which states are active in the object, or even that a concept of state exists at all, and a call to `object.state().root().destroy()` must restore the object to its original form.


<a name="about--roadmap" href="#about--roadmap" />
### Roadmap

<a name="about--roadmap--history" href="#about--roadmap--history" />
#### History

Any state may be ordered to keep a **history** of its own internal state. Entries are recorded in the history anytime the given state is involved in a transition, or experiences a change to its internal content or structure. The history may be traversed in either direction, and elements replaced or pushed onto the stack at its current index. When a transition targets a **retained** state, it will consult that state’s history and redirect itself back to whichever of the state’s substates was most recently current.

<a name="about--roadmap--concurrency" href="#about--roadmap--concurrency" />
#### Concurrency

Whereas an object’s state is most typically conceptualized as an exclusive-OR operation (i.e., its current state is always fixed to exactly one state), a state may instead be defined as **concurrent**, relating its substates in an “AND” composition, where occupation of the concurrent state implies simultaneous occupation of each of its immediate substates.

#### Optimization pathways under consideration

* **Forego hidden references in favor of plain public properties** on members such as `superstate`, `controller`, etc., to simplify the code base and avoid costs of closures.

* **Further granularize the `State realize` function** such that each of the internal data, methods, etc. objects, and their associated per-instance methods, would be dynamically added only as needed.

* **Keep a hashtable on the root state** of common `query` input strings, to avoid repeated recursive searches.

* **Allow opt-in to ES5’s meta-programming features and Harmony Proxies** to more deeply embed the state implementation into objects.

* * *

*Return to: [**About this project**](#about)  <  [top](#top)*

* * *

### &#x1f44b;
