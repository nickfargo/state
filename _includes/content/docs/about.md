## [About this project](#about)

<div class="local-toc"></div>

### [Design goals](#about--design-goals)

#### [Minimal footprint](#about--design-goals--minimal-footprint)

All functionality of **State** is to be instigated through the exported `state` function. It should be able both to generate state expressions and to implement expressed states into an existing JavaScript object, depending on the arguments provided. In the latter case, the newly implemented system of states should be accessible from a single `object.state()` method on the affected object.

#### [Expressive power](#about--design-goals--expressive-power)

As much as possible, **State** should aim to look and feel like a feature of the language. The interpreted shorthand syntax, simple keyword attributes, and limited interface should allow for production code that is declarative and easy to write and understand.

#### [Opacity](#about--design-goals--opacity)

Apart from the addition of the `object.state()` method, a call to `state()` must make no other modifications to a stateful object’s interface. Methods are replaced with delegators, which forward method calls to the current state. This is to be implemented *opaquely* and *non-destructively*: consumers of the object need not be aware of which states are active in the object, or even that a concept of state exists at all, and a call to `object.state('').destroy()` must restore the object to its original form.


### [Roadmap](#about--roadmap)

#### [Features](#about--roadmap--features)

##### [Concurrency](#about--roadmap--features--concurrency)

Whereas an object’s state is most typically conceptualized as an exclusive-OR operation (i.e., its current state is always fixed to exactly one state), a state may instead be defined as **concurrent**, relating its substates in an “AND” composition, where occupation of the concurrent state implies simultaneous occupation of each of its immediate substates.

##### [History](#about--roadmap--features--history)

Any state may be ordered to keep a **history** of its own internal state. Entries are recorded in the history anytime the given state is involved in a transition, or experiences a change to its internal content or structure. The history may be traversed in either direction, and elements replaced or pushed onto the stack at its current index. When a transition targets a **retained** state, it will consult that state’s history and redirect itself back to whichever of the state’s substates was most recently current.

#### [Optimization](#about--roadmap--optimization)

* **Further granularize the [`State realize`](/source/#state--private--realize) function** such that each of the internal closed objects (`data`, `methods`, etc.), and their associated per-instance methods, would be dynamically added only as needed.

* **Allow opt-in to ES5’s meta-programming features and Harmony Proxies** on supporting platforms to more deeply embed the state implementation into objects.

<div class="backcrumb">
⏎  <a class="section" href="#about">About this project</a>
</div>
