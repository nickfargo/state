# State.js

**State** is a micro-framework for expressing, manipulating, and recording the *state* of any JavaScript object. Stateful objects can be used to model behavior, construct deterministic automata, and reason about changes undergone by the object over time.

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
obj =
  greet: -> "Hello"

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

* [Inheritance](#concepts--inheritance) — States are hierarchically nested in a tree structure: the **owner** object is given exactly one *root* state, which may contain zero or more **substates**, which may themselves contain further substates, and so on. A state inherits both from its **superstate**, with which it shares the same owner, as well as from any **protostate**, which is an equivalently positioned state defined on a prototype of the owner object. Protostates have a higher inheriting precedence than superstates.

* [Data](#concepts--data) — Arbitrary **data** can be attached to each state, and inherited accordingly.

* [Methods](#concepts--methods) — Behavior is modeled by defining state **methods** that override the object’s methods *opaquely* with respect to consumers of the object, which need not be aware of the object’s current state, or even that a concept of state exists at all. State methods are invoked in the context of the state in which the method is defined, allowing for polymorphic features like invoking the overridden methods of a superstate.

* [Transitions](#concepts--transitions) — When an object is directed to change from one state to another, it does so by temporarily entering into a **transition** state. A state expression may include **transition expressions** that describe, given a specific pairing of origin and target states, a synchronous or asynchronous **action** to be performed over the duration of the transition.

* [Events](#concepts--events) — Listeners for specific **event** types can be bound to a state, which will be called in the context of the bound state as that state is so affected by a progressing transition (`depart`, `exit`, `enter`, `arrive`), as data bound to the state changes (`mutate`), or upon the state’s construction or destruction (`construct`, `destroy`). **State** also allows for custom typed events, which can be emitted from a particular state and propagated to listeners bound to the state itself as well as its protostates and superstates.

* [Guards](#concepts--guards) — A state may be outfitted with **guards** to govern their viability as transition targets, dependent on the outgoing state and any other conditions that may be defined. Guards are evaluated as either boolean values or predicates (boolean-valued functions).

* [History](#concepts--history) — Any state may be ordered to keep a **history** of its own internal state. Entries are recorded in the history anytime the given state is involved in a transition, or experiences a change to its `data` content. The history may be traversed in either direction, and elements replaced or pushed onto the stack at its current index. When a transition targets a **retained** superstate, it will use its history to redirect the transition back to whichever of its substates was most recently current.

<a id="overview--design-goals" />
### Design goals

#### Minimal incursion

All functionality of **State** is instigated through the exported `state` function — depending on the arguments provided, `state()` can be used either to generate state expressions, or to implement expressed states into an existing JavaScript object. In the latter case, the newly implemented system of states is thereafter accessed from a single `object.state()` method on the affected object.

#### Black-box opacity

Apart from the addition of the `object.state()` method, a call to `state()` makes no other modifications to a stateful object’s interface. Methods of the object that are reimplemented within the state expression are replaced on the object itself with special **delegator** functions, which will forward method calls to the appropriate state’s version of that method. This feature is implemented *opaquely* and *non-destructively*: consumers of the object need not be aware of which states are active in the object, or even that a concept of state exists at all, and a call to `object.state().destroy()` at any time will restore the object to its original condition.

#### Expressive power

**State** aims to *feel* as close as possible like a feature of the language. Packing everything into `state()` and `object.state()` makes code more declarative and easier to write and understand. Whenever convenient, state expressions may be written in a shorthand format that is logically interpreted and rewritten on-the-fly to a formal `StateExpression` type. Individual state expressions can also optionally accept an argument of whitespace-delimited keywords that provide further control over a state’s composition. Taken together, these features allow for JavaScript code that is powerful yet elegantly concise (and particularly so for those who prefer to work in the depunctuated syntactical style of CoffeeScript).

<a id="concepts" />
## Concepts

<a id="concepts--inheritance" />
### Inheritance

#### Nesting states

...

```javascript
function Engine () {
    var UPDATE_INTERVAL = 16,
        ,
        lastUpdateTime,
        intervalId,

        playerList = [],
        pendingPlayerList = [];

    function update () {
        var now = ( new Date ).getTime(),
            deltaTime = now - lastUpdateTime;

        deltaTime > 1.0 && this.state.owner().update( deltaTime );

        lastUpdateTime = now;
    }

    this.addPlayer = function () {
        var player = new Player;
        playerList.push( player );
        return player;
    };

    state( this, 'abstract', {
        Idle: state( 'initial', {
            addPlayer: function () {
                var player = new Player;
                pendingPlayerList.push( player );
                return player;
            }
        }),
        Engaged: state( 'default', {
            methods: {
                start: function () {
                    lastUpdateTime = ( new Date ).getTime();
                    intervalId = setInterval( update, UPDATE_INTERVAL );
                },
                stop: function ( event ) {
                    clearInterval( intervalId );
                    lastUpdateTime = undefined;
                }
            },
            events: {
                enter: function ( event ) {
                    playerList.concat( pendingPlayerList );
                    pendingPlayerList.length = 0;

                    self.start();
                },
                exit: function ( event ) {
                    self.stop();
                }
            },
            states: {
                Suspended: {
                    events: {
                        enter: function ( event ) {
                            self.stop();
                            UPDATE_INTERVAL = 1000;
                            self.start();
                        },
                        exit: function ( event )
                    }
                }
            }
        })
    });
}
function Player () {
    this.location = { x:0, y:0 };
    this.velocity = { x:1, y:0 };

    this.update = function ( deltaTime ) {
        this.location = {
            x: this.location.x + deltaTime * this.velocity.x,
            y: this.location.y + deltaTime * this.velocity.y
        };
    };
    this.render = function ( deltaTime ) {};

    state( this, 'abstract', {
        Stationary: state( 'default', {
            update: function () {}
        }),
        Moving: {
            Walking: {
                update: function ( dt ) {
                    var o = this.owner(),
                        s = o.surface;
                        n = s.normal();

                }
            },
            Falling: {
                update: function ( dt ) {
                    var o = this.owner();
                    o.velocity = {
                        x: o.velocity.x + dt * gravity.x,
                        y: o.velocity.y + dt * gravity.y
                    };
                    this.superstate().call( 'update', dt );
                }
            }
        }
    });
}

var engine = {
    update: function () {
        player.update( deltaTime );
    }
};
( function () {
    var lastUpdateTime;
    setInterval( function () {

    }, 16 );
}() )
setInterval( update, 16 );
```

```coffeescript

```

#### Inheriting states across prototypes

So far we’ve been creating stateful objects by applying the `state()` function directly to the object. Consider now the case of an object that inherits from a stateful prototype.

```javascript
function Class () {}
state( Class.prototype, {
    Sleepy: state( 'initial', {
        poke: function () { return "yawn"; }
    }),
    Dopey: {
        poke: function () { return "derp"; }
    }
});
```

```coffeescript
class Class
  state @::
    Sleepy: state 'initial'
      poke: -> "yawn"
    Dopey:
      poke: -> "derp"
```

```javascript
var obj = new Class;

Class.prototype.state();      // State 'Sleepy'
'state' in obj;               // true
obj.hasOwnProperty('state');  // false
obj.state();                  // State 'Sleepy'
obj.poke();                   // "yawn"
obj.hasOwnProperty('state');  // true
obj.state().isVirtual();      // true
obj.state().change('Dopey');  // State 'Dopey'
obj.poke();                   // "derp"
Class.prototype.state();      // State 'Sleepy'
```

```coffeescript
obj = new Class

Class::state()                # State 'Sleepy'
'state' of obj                # true
obj.hasOwnProperty 'state'    # false
obj.state()                   # State 'Sleepy'
obj.poke()                    # "yawn"
obj.hasOwnProperty 'state'    # true
obj.state().isVirtual()       # true
obj.state -> 'Dopey'          # State 'Dopey'
obj.poke()                    # derp
Class::state()                # State 'Sleepy'
```


When an accessor method (`obj.state()`) is called, it checks the context object (`obj`) to ensure that it has its own accessor method. If it doesn’t, and is instead inheriting from a prototype, then an empty state implementation is created for the inheritor, which in turn generates a corresponding accessor method (`obj.state()`), to which the original call is then forwarded.

Even though the inheritor’s state implementation is empty, it identifies the prototype’s states as its **protostates**, from which it inherits all methods, data, events, etc. contained within. The inheritor may adopt a protostate as its current state just as it would with a state of its own, in which case a temporary **virtual state** is created within the state implementation of the inheritor, as a stand-in for the protostate. 

This system of protostates and virtual states allows an object’s state implementation to benefit from the prototypal reuse patterns of JavaScript without having to maintain any formal prototypal relationship between themselves.


<a id="concepts--transitions" />
### Transitions

Whenever an object’s current state changes, a **transition** is created, which both temporarily assumes the role of the current state as the object traverses from one state to another.

A state expression may include any number of **transition expressions**, which define some **action** to be performed, either synchronously or asynchronously, along with definitions for `origin` and `target` states to which the transition should apply. When an object undergoes a state change, it finds the appropriate transition expression for the given origin and target, and from that creates a new transition.

In a non-deterministic environment, it may be desirable to abort a pending transition and redirect the object to a new target state. When that happens, an `abort` event is emitted on that transition, and a new transition is created, with a reference to the aborted transition as its `source`, and the same `origin` state as that of the aborted transition. Further redirections of pending transitions will continue to grow this `source` chain until a transition finally arrives at its `target` state.

<a id="concepts--events" />
### Events

#### Transitional event sequence

As a transition proceeds from its origin state to its target state, all affected states along the way emit any of four types of events that describe their relation to the transition: `depart`, `exit`, `enter`, and `arrive`. A “departure” from the origin state marks the beginning of the transition. It is followed by an “exit” from the origin state and any of its superstates that will no longer be active as a result of the transition. Likewise, an “entry” occurs for states that will become newly active. Finally an “arrival” will occur exactly once, specifically at the destination state.

<a id="concepts--guards" />
### Guards

<a id="concepts--history" />
### History
