## [About this project](#about)

<div class="local-toc"></div>

### [Design goals](#about--design-goals)

#### [Minimal footprint](#about--design-goals--minimal-footprint)

All functionality of **State** is to be instigated through the exported `state` function. It should be able both to generate state expressions and to implement expressed states into an existing JavaScript object, depending on the arguments provided. In the latter case, the newly implemented system of states should be accessible from a single `object.state()` method on the affected object.

#### [Expressive power](#about--design-goals--expressive-power)

As much as possible, **State** should aim to look and feel like a feature of the language. The interpreted shorthand syntax, simple keyword attributes, and limited interface should allow for production code that is terse, declarative, and easy to write and understand.

#### [Opacity](#about--design-goals--opacity)

Apart from the addition of the `object.state()` method, a call to `state()` must make no other modifications to a **State**–affected object’s interface. Methods are replaced with delegators, which forward method calls to the current state. This is to be implemented *opaquely* and *non-destructively*: consumers of the object need not be aware of which states are active in the object, or even that a concept of state exists at all, and a call to `object.state('').destroy()` must restore the object to its original form.


### [Roadmap](#about--roadmap)

#### [Proposed features](#about--roadmap--proposed-features)

##### [Concurrency](#about--roadmap--proposed-features--concurrency)

Whereas an object’s state is most typically conceptualized as an exclusive-OR operation (i.e., its current state is always fixed to exactly one state), a state may instead be defined as **concurrent**, relating its substates in an “AND” composition, where occupation of the concurrent state implies simultaneous occupation of each of its immediate substates.

* Define a `Region` subclass of `State` that contains the currency-bearing aspect of the current `RootState`; then redefine `RootState` as a subclass of `Region` that contains only the association with `owner` and its supplied accessor method.

* Define currency events for `Region`:

  * `initialize :: ( initialState:State ) ->`

  * `suspend :: ( currentState:State ) ->`

  * `resume :: ( currentState:State ) ->`

  * `conclude :: ( conclusiveState:State ) ->` — Signals entrapment of a region’s currency within a particular `State` with attribute `conclusive`. Always precedes any `terminate` event.

  * `terminate :: ( finalState:State ) ->` — Signals termination of a region’s currency. If a currency is terminated imperatively, `finalState` may be any intraregional `State`; if terminated naturally, `finalState` will be an intraregional `State` with attribute `final`. (A terminal (leaf) `conclusive` state may seem implicitly `final`, but it is not; a currency in such a state, although trapped there, may be allowed to linger indefinitely before being imperatively terminated.)

* Define region attributes { `permanent` `autonomous` `volatile` }:

  * By default a region is **recurrent**; i.e. on reactivation of a concurrent superstate, a subregion that has `terminate`d will be `initialize`d with a new currency. Adding `permanent` to a region’s state expression declares that the `Region` will only ever bear one currency, and its finality will persist over the life of the `Region`.

  * By default a region can undergo transitions only while its concurrent superstate is active; if deactivated, the region’s currency is `suspend`ed in place, to be `resume`d only once the concurrent superstate becomes active again. The `autonomous` attribute allows a region to remain active and continue processing transitions in the background after its concurrent superstate is deactivated.

  * By default a region is **persistent**; it is `suspend`ed in place if deactivated prior to being `final`ized, and on subsequent activation will be `resume`d from the state that was current at the time it was deactivated. Adding the `volatile` attribute disables this persistence: once deactivated the region’s transition queue is drained and pending transitions are dropped, and on each reactivation the region is `initialize`d anew.

* The destination attributes `initial`, `conclusive`, and `final` only affect their local `Region`.

* Individual transitions are bounded within a single `Region`. A transition  arriving at a `concurrent` state constitutes a **fork** of the currency into the state’s subregions, each of which either spins up a new currency starting from its local `initial` state, or `resume`s a `suspend`ed currency (for subregions that are *recurrent* and/or *persistent*).

* An active subregion’s currency may `terminate` and **join** the currency of its concurrent superstate, either by arriving at a `final` state, or imperatively. An imperative join may be extrinsic, resulting from the superregion being transitioned away from the concurrent superstate, or intrinsic, resulting from a call to `State::join` from within the subregion, which terminates the currency and finalizes it to the current state.

* An object’s “current state” becomes the set of currencies in all active `Region`s; i.e. its **state configuration**. Representation of the state configuration as a selector string must use nested parens `()` or similar to group adjacent regions, delimited by `,`, `;`, or similar.

* An `owner`’s dispatcher methods are guaranteed to resolve only within the region defined by the root state, and may be stopped at any active `concurrent` state. Dispatch continues automatically iff the regions are **orthogonal**, which requires that methods be implemented in no more than one of the subregions. In the ambiguous, non-orthogonal case, dispatch stops descending at the concurrent state, which must contain a **spread** implementation that “weaves” the dispatch into the multiple regions, and then determines for itself how to reduce the values returned from each region into a single value to be returned to the dispatcher method. A default concurrent method implementation may be made available, which would simply dispatch to each region in a particular order and then return an array of the returned values.

* Resolutions that traverse up a superstate chain are blocked ahead of a concurrent state’s spread implementation, and must stop at the boundary of the subregion.

* Events may propagate through all subregions unrestricted, as they have no return value.

##### [History](#about--roadmap--proposed-features--history)

Any state may be directed to keep a **history** of its own internal state. Entries are recorded in the history anytime the given state is involved in a transition, or experiences a mutation of its internal content or structure. The history may be traversed in either direction, and elements replaced or pushed onto the stack at its current index. When a transition targets a **retained** state, it will consult that state’s history and redirect itself back to whichever of the state’s substates was most recently current.

#### [Optimization](#about--roadmap--optimization)

* **Further granularize the [`State::realize`](/source/state.html#state--prototype--realize) function** such that each of the internal closed objects (`data`, `methods`, etc.), and their associated per-instance methods, would be dynamically added only as needed.

* **Allow opt-in to ES5’s meta-programming features and ES6 Proxies** on supporting platforms to more deeply embed the state implementation into objects.

<div class="backcrumb">
⏎  <a class="section" href="#about">About this project</a>
</div>
