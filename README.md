# State.js

**State** is a micro-framework for expressing, manipulating, and recording *state* for any JavaScript object. Stateful objects can be used to model behavior, construct automata, and reason about changes undergone by the object over time.

#### Installation

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

#### Quick intro

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
obj.state().change 'Informal'
obj.greet() # "Hi!"
obj.state().change ''
obj.greet() # "Hello."
```

<a id="overview" />
## Overview

* Any JavaScript object can be augmented by **State**.

* [Expressions](#concepts--expressions) — States and their contents are expressed using concise object literals, along with an optional set of attribute keywords, which together are interpreted into formal **state expressions**.

* [Inheritance](#concepts--inheritance) — States are hierarchically nested in a tree structure: the **owner** object is given exactly one *root* state, which may contain zero or more **substates**, which may themselves contain further substates, and so on. A state inherits both from its **superstate**, with which it shares the same owner, as well as from any **protostate**, which is defined as the equivalently positioned state within a prototype of the owner object. Protostates have a higher inheriting precedence than superstates.

* [Attributes](#concepts--attributes) — A state expression may include **attributes** that can specially designate or constrain a state’s usage. For example: the `initial` attribute designates a state as the owner’s initial state, whereas the `final` attribute dictates that a state will allow no further transitions once it has become active; an `abstract` state is one that cannot be current but may be inherited from by substates, while a `default` attribute marks such a substate as the primary redirection target for an abstract superstate, should a transition ever target the abstract state directly.

* [Data](#concepts--data) — Arbitrary **data** can be attached to each state, and inherited accordingly.

* [Methods](#concepts--methods) — Behavior is modeled by defining state **methods** that override the object’s methods *opaquely* with respect to consumers of the object, which need not be aware of the object’s current state, or even that a concept of state exists at all. State methods are invoked in the context of the state in which the method is defined, allowing for polymorphic features like invoking the overridden methods of a superstate.

* [Transitions](#concepts--transitions) — When an object is directed to change from one state to another, it does so by temporarily entering into a **transition** state. A state expression may include **transition expressions** that describe, given a specific pairing of origin and target states, a synchronous or asynchronous **action** to be performed over the duration of the transition.

* [Events](#concepts--events) — Listeners for specific **event** types can be bound to a state, which will be called in the context of the bound state as it is affected by a progressing transition (`depart`, `exit`, `enter`, `arrive`), as data bound to the state changes (`mutate`), or upon the state’s construction or destruction (`construct`, `destroy`). **State** also allows for custom typed events, which can be emitted from a particular state and propagated to listeners bound to the state itself as well as its protostates and superstates.

* [Guards](#concepts--guards) — A state may be outfitted with **guards** to govern its viability as a transition target, dependent on the outgoing state and any other conditions that may be defined. Guards are evaluated as either boolean values or predicates (boolean-valued functions).

* [History](#concepts--history) — Any state may be ordered to keep a **history** of its own internal state. Entries are recorded in the history anytime the given state is involved in a transition, or experiences a change to its `data` content. The history may be traversed in either direction, and elements replaced or pushed onto the stack at its current index. When a transition targets a **retained** state, it will consult that state’s history and redirect itself back to whichever of the state’s substates was most recently current.

<a id="overview--design-goals" />
### Design goals

#### Minimal incursion

All functionality of **State** is instigated through the exported `state` function — depending on the arguments provided, `state()` can be used either to generate state expressions, or to implement expressed states into an existing JavaScript object. In the latter case, the newly implemented system of states is thereafter accessed from a single `object.state()` method on the affected object.

#### Black-box opacity

Apart from the addition of the `object.state()` method, a call to `state()` makes no other modifications to a stateful object’s interface. Methods of the object that are reimplemented within the state expression are replaced on the object itself with special **delegator** functions, which will forward method calls to the appropriate state’s version of that method. This feature is implemented *opaquely* and *non-destructively*: consumers of the object need not be aware of which states are active in the object, or even that a concept of state exists at all, and a call to `object.state().destroy()` at any time will restore the object to its original condition.

#### Expressive power

**State** aims to *feel* as close as possible like a feature of the language. Packing everything into `state()` and `object.state()` makes code more declarative and easier to write and understand. Whenever convenient, state expressions may be written in a shorthand format that is interpreted into a formal `StateExpression` type. Individual state expressions can also optionally accept an argument of whitespace-delimited attribute keywords that provide further control over a state’s composition. Taken together, these features allow for JavaScript code that is powerful yet elegantly concise (and particularly so for those who prefer more depunctuated, syntactically terse dialects of JavaScript, such as CoffeeScript).

<a id="concepts" />
## Concepts

<a id="concepts--expressions" />
### Expressions

A **state expression** is the formal type used to define the contents and structure of a `State` instance. A `StateExpression` object is most easily constructed by using the exported `state()` function, and providing a plain object map, optionally preceded by a string of whitespace-delimited attributes to be applied to the expressed state.

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
                enter: function ( event ) { this.owner().wearTuxedo(); }
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
        enter: ( event ) -> @owner().wearTuxedo()
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
        enter: function ( event ) { this.owner().wearTuxedo(); },
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
    enter: ( event ) -> @owner().wearTuxedo()
    greet: -> "How do you do?"
  Informal:
    enter: ( event ) -> @owner().wearJeans()
    greet: -> "Hi!"
```

Below is the internal procedure for interpreting `StateExpression` input:

1. If an entry’s value is a typed `StateExpression` or `TransitionExpression`, it is interpreted as such.

2. Otherwise, if an entry’s key is a category name, its value must be either `null` or an object to be interpreted in longform.

3. Otherwise an entry is interpreted as an event listener (or array thereof) if its key matches a built-in event type.

4. Otherwise an entry is interpreted as a guard condition (or array thereof) if its key matches a guard action.

5. Otherwise, if its value is a function, the entry is interpreted as a method, or if its value is an object, it is interpreted as a substate.


<a id="concepts--inheritance" />
### Inheritance

#### Nesting states

In similar fashion to classes or prototypal objects, states use a nesting model to express ever greater specificity of their owner’s behavior and condition, whereby a **superstate** contains zero or more **substates**. This model yields a *tree structure*, with a single **root state** as the basis for the object’s stateful implementation.

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

One noteworthy quality is that, while its place in the expression does not bear a name, the root state is not anonymous; its name is always the empty string `''`, which may be used by an object to change its state so as to exhibit its default behavior.

```javascript
obj.state().root() === obj.state('')    // true
obj.state().change('')                  // State ''
```
```coffeescript
obj.state().root() is obj.state ''      # true
obj.state -> ''                         // State ''
```

In addition to being the top-level node of the tree from which all of an object’s states inherit, the root state acts as the *default method store* for the object’s state implementation, containing methods originally defined on the object itself, for which now exist one or more stateful reimplementations elsewhere within the state tree. This capacity allows the *method delegator pattern* to work simply by always forwarding a method call on the object to the object’s current state; if no corresponding method override is defined within the current state or its superstates, **State** will as a last resort resolve the call to the original implementation held within the root state.

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


<a id="concepts--attributes" />
### Attributes


<a id="concepts--data" />
### Data


<a id="concepts--methods" />
### Methods


<a id="concepts--transitions" />
### Transitions

Whenever an object’s current state changes, a **transition** state is created, which temporarily assumes the role of the current state while the object is travelling from its source state to its target state.

A state expression may include any number of **transition expressions**, which define some **action** to be performed, either synchronously or asynchronously, along with definitions for `origin` and `target` states to which the transition should apply. When an object undergoes a state change, it finds the appropriate transition expression for the given origin and target, and from that creates a new `Transition` instance.

The lifecycle of a transition consists of a stepwise traversal through the state tree, from the `source` node to the `target` node, where the **domain** of the transition is represented by the state that is the least common ancestor node between `source` and `target`. At each step in the traversal, the transition instance acts as a temporary substate of the local state, such that event listeners may expect to inherit from the states in which they are declared.

The traversal sequence is decomposable into an ascending phase, an action phase, and a descending phase. During the ascending phase, the object emits a `depart` event on the `source` and an `exit` event on any state that will be rendered inactive as a consequence of the transition. The transition then reaches the top of the domain and moves into the action phase, whereupon it executes any `action` defined in its associated transition expression. Once the action has ended, the transition then proceeds with the descending phase, emitting `enter` events on any state that is rendered newly active, and concluding with an `arrival` event on its `target` state.

Should a new transition be started while a transition is already in progress, an `abort` event is emitted on the previous transition. The new transition will reference the aborted transition as its `source`, and will keep the same `origin` state as that of the aborted transition. Further redirections of pending transitions will continue to grow this `source` chain until a transition finally arrives at its `target` state.

<a id="concepts--events" />
### Events

#### State creation and destruction

Once a state has been instantiated, it emits a `construct` event. Since a state is not completely constructed until its substates have themselves been constructed, the full `construct` event sequence proceeds in a bottom-up manner.

A state is properly deallocated with a call to `destroy()`, either on itself or on a superstate. This causes a `destroy` event to be emitted immediately prior to the state and its contents being cleared.

#### Transition event sequence

As alluded to above, during a transition’s progression from its origin state to its target state, all affected states along the way emit any of four types of events — `depart`, `exit`, `enter`, and `arrive` — that describe their relation to the transition. Exactly one `depart` event is always emitted from the origin state, and marks the beginning of the transition. It is followed by zero or more `exit` events, one each from amongst the origin state and any of its superstates that will no longer be active as a result of the transition. Likewise, zero or more `enter` events are emitted, one for each state that will become newly active. Finally, an `arrive` event will occur exactly once, specifically at the target state.

Given this scheme, a few noteworthy cases stand out. A “non-exiting” transition is one that only *descends* in the state tree, i.e. it progresses from a superstate to a substate of that superstate, emitting one `depart`, zero `exit`s, one or more `enter`s, and one `arrive`. Conversely, a “non-entering” transition is one that only *ascends* in the state tree, progressing from a substate to a superstate thereof, emitting one `depart`, one or more `exit`s, zero `enter`s, and one `arrive`. For a reflexive transition, which is one whose target is its origin, the event sequence consists only of one `depart` and one `arrive`, both emitted from the same state.

#### Mutation

When a state’s data or other contents change, it emits a `mutate` event containing the changes made relative to its immediately prior condition.

#### Custom events

Through exposure of the `emit` method, state instances allow any type of event to be broadcast and consumed.


<a id="concepts--guards" />
### Guards

<a id="concepts--history" />
### History
