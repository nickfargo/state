# State.js

**State** is a micro-framework for implementing state-driven behavior directly into any JavaScript object.

* **[Installation](#installation)**

* **[Getting started](#getting-started) —** [Introduction](#getting-started--introduction) – [Example](#getting-started--example)

* **[Overview](#overview)**

* **[Concepts](#concepts) —** [Expressions](#concepts--expressions) – [Inheritance](#concepts--inheritance) – [Selectors](#concepts--selectors) – [Attributes](#concepts--attributes) – [Data](#concepts--data) – [Methods](#concepts--methods) – [Transitions](#concepts--transitions) – [Events](#concepts--events) – [Guards](#concepts--guards) – [History](#concepts--history)

* **[About](#about) —** [Design goals](#about--design-goals) – [Future directions](#about--future-directions)



## Installation <a name="installation" href="#installation">&#x1f517;</a>

The lone dependency of **State** is a small utility library called [**Zcore**](http://github.com/zvector/zcore/).

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



## Getting started <a name="getting-started" href="#getting-started">&#x1f517;</a>

### A quick four-step introduction to State <a name="getting-started--introduction" href="#getting-started--introduction">&#x1f517;</a>

#### Step 1 — Calling the `state` function

The **State** module is exported as a function called `state`, which can be used in one of two ways:

```javascript
state( [attributes], expression )
```
* Given a single `expression` object, `state` will create and return a [**state expression**](#concepts--expressions), based on the contents of `expression` (and any keywords included in the optional [`attributes`](#concepts--attributes) string).

```javascript
state( owner, [attributes], expression )
```
* Given two object-typed arguments, `state` will augment the `owner` object with its own working implementation of state, based on the state expression described by `expression` (and `attributes`), and will return the newly stateful object’s [**initial state**](#concepts--attributes).

#### Step 2 — Building a state expression

The `expression` argument, which is usually an object literal, describes states, methods, and other features that will comprise the state implementation of `owner`:

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

#### Step 3 — Accessing an object’s state

After calling `state` to implement state into an `owner` object, this new state implementation will be exposed through an **accessor method**, also named `state`, that will be added to the object. Calling this accessor with no arguments queries the object for its **current state**.

```javascript
owner.state();                   // >>> State '' (the top-level *root state*)
```

#### Step 4 — Transitioning between states

The object’s current state may be reassigned to a different state by calling its `change()` method and providing it the name of a state to be targeted. Changing an object’s state allows it to exhibit different behavior:

```javascript
owner.state();                   // >>> State ''
owner.aMethod();                 // >>> "default"
owner.state().change('aState');  // >>> State 'aState'
owner.aMethod();                 // >>> "stateful!"
owner.state();                   // >>> State 'aState'
```

### A thoroughly polite example <a name="getting-started--example" href="#getting-started--example">&#x1f517;</a>

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

person.greet();
// >>> "Hello."
person.state().change('Formal');
person.greet();
// >>> "How do you do?"
person.state().change('Informal');
person.greet();
// >>> "Hi!"
person.state().change('');
person.greet();
// >>> "Hello."
```

```coffeescript
person = greet: -> "Hello."

state person,
  Formal:
    greet: -> "How do you do?"
  Informal:
    greet: -> "Hi!"

person.greet()
# >>> "Hello."
person.state().change 'Formal'
person.greet()
# >>> "How do you do?"
person.state -> 'Informal' # a sugary equivalent of `.state().change()`
person.greet()
# >>> "Hi!"
person.state -> ''
person.greet()
# >>> "Hello."
```

## Overview <a name="overview" href="#overview">&#x1f517;</a>

* **States** — A **state** is an instance of `State` that encapsulates all or part of an **owner** object’s condition at a given moment. The owner may adopt different behaviors at various times by transitioning from one of its states to another.

* [**Expressions**](#concepts--expressions) — The contents of states can be concisely expressed using a plain object literal, which, along with an optional set of attribute keywords, is passed into the `state()` function and interpreted into a formally typed **state expression**.

* [**Inheritance**](#concepts--inheritance) — States are hierarchically nested in a tree structure: the owner object is given exactly one **root state**, which may contain zero or more **substates**, which may themselves contain further substates, and so on. A state inherits both from its **superstate**, with which it shares the same owner, as well as from any **protostate**, which is defined as the equivalently positioned state within a prototype of the owner object. Protostates have a higher inheriting precedence than superstates.

* [**Selectors**](#concepts--selectors) — A stateful owner `object`’s accessor method at `object.state()` can be called without arguments to retrieve the object’s current state, or, if provided a **selector** string, to query for a specific `State` of the object, or a specific set of states.

* [**Attributes**](#concepts--attributes) — A state expression may include a set of **attribute** keywords (e.g.: `initial`, `conclusive`, `final`, `abstract`, etc.), which will enable certain features or impose certain constraints for the `State` that the expression is to represent.

* [**Data**](#concepts--data) — Arbitrary **data** can be attached to each state, and inherited accordingly through protostates and superstates.

* [**Methods**](#concepts--methods) — Behavior is modeled by defining state **methods** that opaquely override the object’s methods. Consumers of the object simply call its methods as usual, and need not be aware of the object’s current state, or even that a concept of state exists at all. State methods are invoked in the context of the state in which the method is defined, allowing for polymorphic features like invoking the overridden methods of a superstate.

* [**Transitions**](#concepts--transitions) — When an object is directed to change from one state to another, it does so by temporarily entering into a **transition** state. A state expression may include **transition expressions** that describe, given a specific pairing of origin and target states, a synchronous or asynchronous **action** to be performed over the duration of the transition.

* [**Events**](#concepts--events) — Listeners for specific **event** types can be bound to a state, which will be called in the context of the bound state as it is affected by a progressing transition (`depart`, `exit`, `enter`, `arrive`), as data bound to the state changes (`mutate`), or upon the state’s construction or destruction (`construct`, `destroy`). **State** also allows for custom typed events, which can be emitted from a particular state and propagated to listeners bound to the state itself as well as its protostates and superstates.

* [**Guards**](#concepts--guards) may be applied to a state to govern its viability as a transition target, dependent on the outgoing state and any other conditions that may be defined. Likewise guards may also be included in a transition expression, where they are used by an object to decide which of its transitions should be executed. Guards are evaluated as either boolean values or predicates.


## Concepts <a name="concepts" href="#concepts">&#x1f517;</a>

### Expressions <a name="concepts--expressions" href="#concepts--expressions">&#x1f517;</a>

A **state expression** defines the contents and structure of a `State` instance. A `StateExpression` object can be created using the exported `state()` function, and providing it a plain object map, optionally preceded by a string of whitespace-delimited attributes to be applied to the expressed state.

The contents of a state expression decompose into six **categories**: `data`, `methods`, `events`, `guards`, `substates`, and `transitions`. The object map supplied to the `state()` call can be categorized accordingly, or alternatively it may be pared down to a more convenient shorthand, either of which will be interpreted into a formal `StateExpression`.

#### Longform: writing state expressions the hard way <a name="concepts--expressions--longform" href="#concepts--expressions--longform">&#x1f517;</a>

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

#### Shorthand: the easy way <a name="concepts--expressions--shorthand" href="#concepts--expressions--shorthand">&#x1f517;</a>

Explicitly categorizing each element is unambiguous, but also unnecessarily verbose. To that point, `state()` also accepts a more concise expression format, which is interpreted into a `StateExpression` identical to that of the example above:

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

#### Interpreting expression input <a name="concepts--expressions--interpreting-expression-input" href="#concepts--expressions--interpreting-expression-input">&#x1f517;</a>

Expression input provided to `state()` is interpreted according to the following rules:

1. If an entry’s value is a typed `StateExpression` or `TransitionExpression`, interpret it as a substate or transition expression, respectively.

2. Otherwise, if an entry’s key is a [category](#concepts--expressions) name, its value must be either `null` or an object to be interpreted as longform.

3. Otherwise, if an entry’s key matches a [built-in event type](#concepts--events--types) or if its value is a string, then interpret the value as either an event listener function, an array of event listeners, or a [named transition target](#concepts--events--expressing-determinism) to be bound to that event type.

4. Otherwise, if an entry’s key matches a [guard action](#concepts--guards) (i.e., `admit`, `release`), interpret the value as a guard condition (or array of guard conditions).

5. Otherwise, if an entry’s value is an object, interpret it as a [substate](#concepts--inheritance--nesting-states) whose name is the entry’s key, or if the entry’s value is a function, interpret it as a [method](#concepts--methods) whose name is the entry’s key.


### Inheritance <a name="concepts--inheritance" href="#concepts--inheritance">&#x1f517;</a>

The state model is a classic tree structure: any state may serve as a **superstate** of one or more **substates**, which express further specificity of their owner’s behavior and condition.

#### The root state <a name="concepts--inheritance--the-root-state" href="#concepts--inheritance--the-root-state">&#x1f517;</a>
For every stateful object, a single **root state** is automatically generated, which is the top-level superstate of all other states. The root state’s name is always and uniquely the empty string `''`. An empty-string selector may be used by an object to change its current state to the root state, so as to exhibit the object’s default behavior.

```javascript
obj.state().root() === obj.state('')    // >>> true
obj.state().change('')                  // >>> State ''
```
```coffeescript
obj.state().root() is obj.state ''      # >>> true
obj.state -> ''                         # >>> State ''
```

The root state also acts as the *default method store* for the object’s state implementation, containing any methods originally defined on the object itself, for which now exist one or more stateful reimplementations elsewhere within the state tree. This capacity allows the *method delegation pattern* to work simply by forwarding a method call made on the object to the object’s current state, with the assurance that the call will be resolved *somewhere* in the state tree: if an override is not present on the current state, then the call is forwarded on to its superstate, and so on as necessary, until as a last resort **State** will resolve the call using the original implementation held within the root state.

#### Behavior nesting using substates <a name="concepts--inheritance--behavior-nesting-using-substates" href="#concepts--inheritance--behavior-nesting-using-substates">&#x1f517;</a>

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
                        this.superstate().call( 'greet', myBetterHalf );
                        this.owner().kiss( myBetterHalf );
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
              @superstate().call 'greet', myBetterHalf
              @owner().kiss myBetterHalf
```

#### Inheriting states across prototypes <a name="concepts--inheritance--inheriting-states-across-prototypes" href="#concepts--inheritance--inheriting-states-across-prototypes">&#x1f517;</a>

The examples so far have created stateful objects by applying the `state()` function directly to the object. Consider now the case of an object that inherits from a stateful prototype.

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

Since the `person` object in the code above inherits from `Person.prototype`, given what’s been covered to this point, it may be expected that a transition instigated using `person.state().change('Formal')` would take effect on `Person.prototype`, in turn affecting all other instances of `Person` as well. However, while sharing stateful behavior through prototypes is desirable, it is also essential that each instance be able to maintain state and undergo changes to its state independently.

**State** addresses this problem by automatically outfitting each inheriting object with its own state implementation whenever one is necessary but does not exist already. This new implementation will itself be empty, but will inherit from the state implementation of the prototype, thus allowing the object to experience its own states and transitions without also indirectly affecting all of its fellow inheritors.

```javascript
Person.prototype.state();              // >>> State ''
'state' in person;                     // >>> true
person.hasOwnProperty('state');        // >>> false
person.state();                        // >>> State ''
person.hasOwnProperty('state');        // >>> true
person.state().isVirtual();            // >>> false
person.greet();                        // >>> "Hello."
person.state().change('Informal');     // >>> State 'Informal'
person.state().isVirtual();            // >>> true
person.greet();                        // >>> "Hi!"
Person.prototype.state();              // >>> State ''
```
```coffeescript
Person::state()                        # >>> State ''
'state' of person                      # >>> true
person.hasOwnProperty 'state'          # >>> false
person.state()                         # >>> State ''
person.hasOwnProperty 'state'          # >>> true
person.state().isVirtual()             # >>> false
person.greet()                         # >>> "Hello."
person.state -> 'Informal'             # >>> State 'Informal'
person.state().isVirtual()             # >>> true
person.greet()                         # >>> "Hi!"
Person::state()                        # >>> State ''
```

When an accessor method (`person.state()`) is called, it first checks the context object (`person`) to ensure that it has its own accessor method. If it doesn’t, and is instead attempting to inherit `state` from a prototype, then an empty state implementation is created for the inheritor, which in turn generates a corresponding new accessor method (`person.state()`), to which the original call is then forwarded.

Even though the inheritor’s state implementation is empty, it inherits all the methods, data, events, etc. of the prototype’s states, which it identifies as its **protostates**. The inheritor may adopt a protostate as its current state just as it would with a state of its own, in which case a temporary **virtual state** is created within the state implementation of the inheritor, as a stand-in for the protostate. Virtual states exist only so long as they are active; once the object transitions elsewhere, any previously active virtual states are automatically destroyed.

This system of protostates and virtual states allows an object’s state implementation to benefit from the prototypal reuse patterns of JavaScript without the states themselves having to maintain any direct prototypal relationship with each other.


### Selectors <a name="concepts--selectors" href="#concepts--selectors">&#x1f517;</a>

The accessor method of a stateful object (`object.state()`) returns its current state if called with no arguments. If a **selector** string argument is provided, the accessor will query the object’s state tree for any matching states.

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
            AAA: {}
        }),
        AB: {}
    },
    B: {}
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
    AA: state 'initial',
      AAA: {}
    AB: {}
  B: {}

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


### Attributes <a name="concepts--attributes" href="#concepts--attributes">&#x1f517;</a>

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

* *mutable* — (Reserved; not presently implemented.) By default a state’s data, methods, guards, substates, and transitions cannot be altered after it has been constructed; the `mutable` attribute lifts this restriction, both for the state to which it is applied and all of its descendant states.

* **initial** — Marking a state `initial` specifies which state is to be assumed immediately following the `state()` application. No transition or any `enter` or `arrive` events result from this initialization.

* **conclusive** — Once a `conclusive` state is entered, it cannot be exited, although transitions may still freely traverse within its substates.

* **final** — Once a state marked `final` is entered, no further transitions are allowed.

* **abstract** — An abstract state cannot itself be current. Consequently a transition target that points to a state marked `abstract` is redirected to one of its substates.

* **default** — Marking a state `default` designates it as the actual target for any transition that targets its abstract superstate.

* **sealed** — A state marked `sealed` cannot have substates.

* *retained* — (Reserved; not presently implemented.) A `retained` state is one that preserves its own internal state, such that, after the state has become no longer active, a subsequent transition targeting that particular state will automatically be redirected to whichever of its descendant states was most recently current.

* *history* — (Reserved; not presently implemented.) Marking a state with the `history` attribute causes its internal state to be recorded in a sequential history. Whereas a `retained` state is concerned only with the most recent internal state, a state’s history can be traversed and altered, resulting in transitions back or forward to previously or subsequently held internal states.

* *shallow* — (Reserved; not presently implemented.) Normally, states that are `retained` or that keep a `history` persist their internal state *deeply*, i.e., with a scope extending over all of the state’s descendant states. Marking a state `shallow` limits the scope of its persistence to its immediate substates only.

* *versioned* — (Reserved; not presently implemented.) 

* *concurrent* — (Reserved; not presently implemented.) 



### Data <a name="concepts--data" href="#concepts--data">&#x1f517;</a>

Arbitrary **data** can be attached to each state, and inherited accordingly through protostates and superstates. Data may be declared within an expression, and both read and written using the `data` method:

```javascript
function Chief () {
    state( this, {
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

mobs.state().be('Enraged'); // `be` and `go` are built-in aliases of `change`
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
    state this,
      Enraged:
        Thermonuclear:
          data:
            task: 'destroy'
            budget: Infinity


mobs = new Chief
mobs.state().data()
# >>> { task: 'innovate', budget: 10000000000 }

mobs.state().be 'Enraged' # `be` and `go` are built-in aliases of `change`
mobs.state().data target: 'Moogle'
mobs.state().data()
# >>> { target: 'Moogle', task: 'compete', budget: 10000000000 }

mobs.state().go 'Thermonuclear'
mobs.state().data()
# >>> { target: 'Moogle', task: 'destroy', budget: Infinity }
```


### Methods <a name="concepts--methods" href="#concepts--methods">&#x1f517;</a>

A defining feature of **State** is the ability for an object to exhibit a variety of behaviors. A  state expresses behavior by defining **overrides** for any of its object’s methods.

#### Delegators <a name="concepts--methods--delegators" href="#concepts--methods--delegators">&#x1f517;</a>

When state is applied to an object, **State** identifies any methods already present on the object for which there exists at least one override somewhere within the state expression. These methods will be relocated to the root state, and replaced on the object with a special **delegator** method. The delegator’s job is to redirect any subsequent calls it receives to the object’s current state, from which **State** will then locate and invoke the proper stateful implementation of the method. Should no active states contain an override for the called method, then the delegation defaults to the object’s original implementation.

#### Context <a name="concepts--methods--context" href="#concepts--methods--context">&#x1f517;</a>

When an owner object’s delegated state method is called, it is invoked not in the context of its owner, but rather of the state in which it is declared, or, if the method is inherited from a protostate, in the context of the local state that inherits from that protostate. This subtle difference in policy does mean that, within a state method, the owner cannot be directly referenced by `this` as it normally would; however, it is still always accessible by calling `this.owner()`.

Of greater importance is the lexical information afforded by binding state methods to their associated state; this allows state method code to exercise useful polymorphic idioms, such as calling up to a superstate’s implementation of the method.

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

#### Example <a name="concepts--methods--example" href="#concepts--methods--example">&#x1f517;</a>

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
            this.change( 'Saved', [
                this.owner().location(), this.owner().read()
            ]); // [5]
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
                    if ( err ) return transition.abort( err ).change( 'Dirty' );
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
        @change 'Saved', [ @owner.location(), @owner().read() ] # [5]
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
          return @abort( err ).change 'Dirty' if err
          do @end
```

1. A “privileged” method `edit` is defined inside the constructor, closing over a private variable `text` to which it requires access. Later, when state is applied to the object, this method will be moved to the root state, and a delegator will be added to the object in its place.

2. An overridden implementation of `edit`, while not closed over the constructor’s private variable `text`, is able to call up to the original implementation using `this.superstate().apply('edit')`.

3. The `freeze` method is declared on the abstract root state, callable from states `Dirty` and `Saved` (but not `Frozen`, where it is overridden with a no-op).

4. The `save` method, which only appears in the `Dirty` state, is still callable from other states, as its presence in `Dirty` causes a no-op version of the method to be automatically added to the root state. This allows `freeze` to safely call `save` despite the possiblity of being in a state (`Saved`) with no such method.

5. Changing to `Saved` from `Dirty` results in the `Writing` [transition](#concepts--transitions), whose asynchronous `action` is invoked with the arguments array provided by the `change` call.


### Transitions <a name="concepts--transitions" href="#concepts--transitions">&#x1f517;</a>

Whenever an object’s current state changes, a **transition** state is created, which temporarily assumes the role of the current state while the object is travelling from its source state to its target state.

#### Transition expressions

A state expression may include any number of **transition expressions**, which define some **action** to be performed, either synchronously or asynchronously, along with selectors for the `origin` and `target` states to which the transition should apply, and guards to determine the appropriate transition to employ.

Before an object undergoes a state change, it examines the transition expressions available for the given origin and target, passing those states through any `admit` or `release` guards defined for each transition, and, from the first expression it deems as valid, creates a new `Transition` instance.

#### The transition lifecycle

A transition performs a stepwise traversal through the state tree, from the `source` node to the `target` node, where the **domain** of the transition is represented by the state that is the least common ancestor node between `source` and `target`. At each step in the traversal, the transition instance acts as a temporary substate of the local state, such that event listeners may expect to inherit from the states in which they are declared.

The traversal sequence is decomposable into an ascending phase, an action phase, and a descending phase. During the ascending phase, the object emits a `depart` event on the `source` and an `exit` event on any state that will be rendered inactive as a consequence of the transition. The transition then reaches the top of the domain and moves into the action phase, whereupon it executes any `action` defined in its associated transition expression. Once the action has ended, the transition then proceeds with the descending phase, emitting `enter` events on any state that is rendered newly active, and concluding with an `arrival` event on its `target` state. (*See [Transitional events](#concepts--events--types--transitional)*.)

Should a new transition be started while a transition is already in progress, an `abort` event is emitted on the previous transition. The new transition will reference the aborted transition as its `source`, and will keep the same `origin` state as that of the aborted transition. Further redirections of pending transitions will continue to grow this `source` chain until a transition finally arrives at its `target` state.

### Events <a name="concepts--events" href="#concepts--events">&#x1f517;</a>

Events in **State** follow a very familiar pattern: `State` exposes methods `emit` (aliased to `trigger`) for emitting typed events, and `addEvent`/`removeEvent` (aliased to `on`/`off` and `bind`/`unbind`) for assigning listeners to a particular event type.

#### Types of events <a name="concepts--events--types" href="#concepts--events--types">&#x1f517;</a>

##### Existential events <a name="concepts--events--types--existential" href="#concepts--events--types--existential">&#x1f517;</a>

Once a state has been instantiated, it emits a `construct` event. Since a state is not completely constructed until its substates have themselves been constructed, the full `construct` event sequence proceeds in a bottom-up manner.

A state is properly deallocated with a call to `destroy()`, either on itself or on a superstate. This causes a `destroy` event to be emitted immediately prior to the state and its contents being cleared.

##### Transitional events <a name="concepts--events--types--transitional" href="#concepts--events--types--transitional">&#x1f517;</a>

As alluded to above, during a transition’s progression from its origin state to its target state, all affected states along the way emit any of four types of events that describe their relation to the transition.

* **depart** — Exactly one `depart` event is always emitted from the origin state, and marks the beginning of the transition.

* **exit** — It is followed by zero or more `exit` events, one each from amongst the origin state and any of its superstates that will no longer be active as a result of the transition.

* **enter** — Likewise, zero or more `enter` events are emitted, one for each state that will become newly active.

* **arrive** — Finally, an `arrive` event will occur exactly once, specifically at the target state, marking the end of the transition.

Given this scheme, a few noteworthy cases stand out. A “non-exiting” transition is one that only *descends* in the state tree, i.e. it progresses from a superstate to a substate of that superstate, emitting one `depart`, zero `exit` events, one or more `enter` events, and one `arrive`. Conversely, a “non-entering” transition is one that only *ascends* in the state tree, progressing from a substate to a superstate thereof, emitting one `depart`, one or more `exit` events, zero `enter` events, and one `arrive`. For a reflexive transition, which is one whose target is its origin, the event sequence consists only of one `depart` and one `arrive`, both emitted from the same state.

##### Mutation <a name="concepts--events--types--mutation" href="#concepts--events--types--mutation">&#x1f517;</a>

When a state’s data or other contents change, it emits a `mutate` event containing the changes made relative to its immediately prior condition.

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
      @data favorite: flavors[ Math.random() * flavors.length << 0 ]
    whine: ( complaint ) -> console?.log complaint
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

##### Custom event types <a name="concepts--events--types--custom-event-types" href="#concepts--events--types--custom-event-types">&#x1f517;</a>

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

#### Expressing determinism <a name="concepts--events--expressing-determinism" href="#concepts--events--expressing-determinism">&#x1f517;</a>

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
    this.state().go(''); // reset
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
    state this, 'abstract',
      s0: state( 'initial default',
            '0':'s0', '1':'s1' )
      s1:   '0':'s2', '1':'s0'
      s2:   '0':'s1', '1':'s2'

  compute: ( number ) ->
    @state -> '' # reset
    @state().emit symbol for symbol in number.toString 2
    @state().is 's0'

three = new DivisibleByThreeComputer
three.compute 8              # >>> false
three.compute 78             # >>> true
three.compute 1000           # >>> false
three.compute 504030201      # >>> true
```


### Guards <a name="concepts--guards" href="#concepts--guards">&#x1f517;</a>

States and transitions can be outfitted with **guards** that dictate how they may be used.

#### State guards <a name="concepts--state-guards" href="#concepts--state-guards">&#x1f517;</a>

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
            C1a: {}
        },
        C2: {}
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
        C1a: {}
    C2: {}
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

The result is a fanciful convolution where `object` is initially constrained to a progression from state `A` to `C` or its descendant states; exiting the `C` domain is initially only possible by transitioning to `D`; from `D` it can only transition back into `C`, however on this and subsequent visits to `C`, it has the option of transitioning to either `B` or `D`, while `B` insists on directly returning the object’s state only to one of its siblings `C` or `D`.

#### Transition guards <a name="concepts--transition-guards" href="#concepts--transition-guards">&#x1f517;</a>

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
            admit: function () { return this.data().gpa >= 3.95; }
            action: function () { /* swat down offers */ }
        },
        Magna: {
            origin: 'Matriculated', target: 'Graduated',
            admit: function () {
                var gpa = this.data().gpa;
                return gpa >= 3.75 && gpa < 3.95;
            },
            action: function () { /* swat down recruiters */ }
        },
        Laude: {
            origin: 'Matriculated', target: 'Graduated',
            admit: function () {
                var gpa = this.data().gpa;
                return gpa >= 3.50 && gpa < 3.75;
            },
            action: function () { /* pad résumé, brag to the cat */ }
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
        action: -> # pad résumé, brag to the cat
  
      '': t
        action: -> # blame rounding error, grab another beer

scholar = new Scholar
scholar.graduate 3.4999
```


## API

### state( … )

### State

#### Instance methods

##### name

##### attributes

##### superstate

##### protostate

##### express

##### mutate

##### data

##### method

##### methodNames

##### addMethod

##### removeMethod

##### event

##### addEvent

##### removeEvent

##### emit

##### guard

##### addGuard

##### removeGuard

##### substate

##### substates

##### addSubstate

##### removeSubstate

##### transition

##### transitions

##### addTransition

##### removeTransition

##### destroy

#### Prototype methods

##### toString

##### owner

##### root

##### current

##### defaultSubstate

##### initialSubstate

##### protostate

##### derivation

##### depth

##### common

##### is

##### isIn

##### has

##### isSuperstateOf

##### isProtostateOf

##### apply

##### call

##### hasMethod

##### hasOwnMethod

##### change

##### changeTo

##### isCurrent

##### isActive

##### query

##### $



### StateExpression

### Transition

### TransitionExpression



## About this project <a name="about" href="#about">&#x1f517;</a>

### Design goals <a name="about--design-goals" href="#about--design-goals">&#x1f517;</a>

#### Minimal footprint

All functionality of **State** is instigated through the exported `state` function — depending on the arguments provided, `state()` can be used either to generate state expressions, or to implement expressed states into an existing JavaScript object. In the latter case, the newly implemented system of states is thereafter accessed from a single `object.state()` method on the affected object.

#### Expressive power

As much as possible, **State** aims to look and feel like a feature of the language. The interpreted shorthand syntax, simple keyword attributes, and limited interface allow for production code that is declarative and easy to write and understand. Adopters of terse, depunctuated JavaScript dialects like CoffeeScript will only see further gains in expressiveness.

#### Opacity

Apart from the addition of the `object.state()` method, a call to `state()` makes no other modifications to a stateful object’s interface. Methods are replaced with delegators, which forward method calls to the current state. This is implemented *opaquely* and *non-destructively*: consumers of the object need not be aware of which states are active in the object, or even that a concept of state exists at all, and a call to `object.state().root().destroy()` will restore the object to its original form.


### Future directions <a name="about--future-directions" href="#about--future-directions">&#x1f517;</a>

#### History <a name="about--future-directions--history" href="#about--future-directions--history">&#x1f517;</a>

Any state may be ordered to keep a **history** of its own internal state. Entries are recorded in the history anytime the given state is involved in a transition, or experiences a change to its `data` content. The history may be traversed in either direction, and elements replaced or pushed onto the stack at its current index. When a transition targets a **retained** state, it will consult that state’s history and redirect itself back to whichever of the state’s substates was most recently current.

#### Concurrency <a name="about--future-directions--concurrency" href="#about--future-directions--concurrency">&#x1f517;</a>

Whereas an object’s state is most typically conceptualized as an exclusive-OR operation (i.e., its current state is always fixed to exactly one state), a state may instead be defined as **concurrent**, relating its substates in an “AND” composition, where occupation of the concurrent state implies simultaneous occupation of each of its immediate substates.

#### Potential optimization pathways

* **Forego hidden references in favor of plain public properties** on members such as `superstate`, `controller`, etc., to simplify the code base and avoid costs of closures.

* **Further granularize the `State realize` function** such that each of the internal data, methods, etc. objects, and their associated per-instance methods, would be dynamically added only as needed.

* **Memoize protostate references** on the assumption that owner objects will never have their prototypes forcibly altered by setting `__proto__`. (Arguably desirable also to preserve inheritance and expected behavior should the state implementation of an object’s prototype ever be unexpectedly `destroy`ed.)

* **Keep a hashtable on the root state** of common `query` input strings, to avoid repeated recursive searches.
