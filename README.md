# State.js

**State** is a micro-framework for expressing, manipulating, and recording *state* for any JavaScript object. Stateful objects can be used to model behavior, construct deterministic automata, and reason about changes undergone by an object over time.

```javascript
var obj = {
    greet: function () { return "Hi!"; }
};

state( obj, {
    Formal: {
        greet: function () { return "Welcome"; }
    },
    Informal: {
        greet: function () { return "Howdy"; }
    }
});

obj.greet(); // "Hi!"
obj.state().change('Formal');
obj.greet(); // "Welcome"
obj.state().change('Informal');
obj.greet(); // "Howdy"
obj.state().change('');
obj.greet(); // "Hi!"
```

```coffeescript
obj =
  greet: -> "Hi!"

state obj
  Formal:
    greet: -> "Welcome"
  Informal:
    greet: -> "Howdy"

obj.greet() # "Hi!"
obj.state().change 'Formal'
obj.greet() # "Welcome"
obj.state().change 'Informal'
obj.greet() # "Howdy"
obj.state().change ''
obj.greet() # "Hi!"
```

## Introduction

### Feature set

...

### Design goals

#### Minimal incursion

All functionality of **State** is instigated through the exported `state` function — depending on the arguments provided, `state()` can be used either to generate state expressions, or to implement expressed states into an existing JavaScript object. In the latter case, the newly implemented system of states is thereafter accessed from a single `object.state()` method on the affected object.

#### Opaque transformation

Apart from the addition of the `object.state()` method, a call to `state()` makes no other modifications to a stateful object’s interface. Methods of the object that are reimplemented within the state expression are replaced on the object itself with special **delegator** functions, which will forward method calls to the appropriate state’s version of that method. This feature is implemented *opaquely* and *non-destructively* — consumers of the object need not be aware of which states are active in the object, or that a concept of state even exists at all, and a call to `object.state().destroy()` at any time will restore the object to its original condition.

#### Approximate a language extension

**State** aims to *feel* as much as possible like a feature of the language. Packing everything into `state()` and `object.state()` makes **State** code more declarative and easier to write and understand. Whenever convenient, state expressions may be written in a shorthand format that is logically interpreted and rewritten on-the-fly to a formal `StateExpression` type. Individual state expressions can also optionally accept an argument of whitespace-delimited keywords that provide further control over a state’s composition. Taken together, these features allow for JavaScript code that is powerful yet elegantly concise (and particularly so for those who prefer to work in the depunctuated syntactical style of CoffeeScript).

## Concepts

### Inheritance

#### Nesting states

...

#### Inheriting states across prototypes

Consider the case of an object that inherits from a stateful prototype.

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

Now even though the inheritor’s state implementation is empty, it identifies the prototype’s states as its **protostates**, from which it inherits all methods, data, events, etc. contained within. The inheritor may adopt a protostate as its current state just as it would with a state of its own, in which case a temporary **virtual state** is created within the state implementation of the inheritor as a stand-in for the protostate. 

This system of protostates and virtual states allows an object’s state implementation to benefit from the prototypal reuse patterns of JavaScript without having to maintain any formal prototypal relationship between themselves.


