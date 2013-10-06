## changelog



### *edge — (tentative 0.2.0)*

* **(breaking)** — Renamed `State::protostate` method to `getProtostate`, changed it to a pure “getter” (with no memoization side-effects), and renamed the pseudo-private `this._protostate` to simply `this.protostate`. This achieves API consistency with the related property `this.superstate`.

* Added `State::descendants` method as a cleaner alternative to calling `substates` with a `true` argument for the `deep` parameter.

* **(breaking)** — Changed order of parameters for `State::substates` from `( deep, virtual )` to `( virtual, deep )`; public usage of the `deep` parameter is deprecated in favor of `State::descendants`.

* Renamed `StateContent` to `StateMetaobject`.

* **(breaking)** — Prioritized explicit category-named properties in a `StateExpression` ahead of nominative-type checking for properties with values of type `StateExpression` or `TransitionExpression`. E.g., `state({ data: state() })` will no longer be a valid way to express a substate named `data`.

* Added category synonyms to state expressions, making e.g. `states` an alias for the `substates` category.

* Added **C3**–linearized **parastates** (compositional “`State` mixins”) to the object model. Monotonic ordering of parastates and superstates is computed by the new `State::linearize` method.

* Added `state.extend` function to facilitate parastate declarations.



### 0.1.2 *(released)*

* Allow raw arguments to be passed in with (or as) `options` parameter of `change`.



### 0.1.1

* Added `state.own` function to facilitate protostate inheritance and enforced realization of virtual epistates.

* Fixed `realize` method to properly devirtualize `this`.

* Constructors with stateful prototypes may now add an instance reference to the prototype’s accessor — for example, `this.state = this.constructor.prototype.state;` — to accommodate JS engine optimization schemes such as Shapes (SpiderMonkey), hidden classes (V8), etc.



### 0.1.0

> History begins here; entries are notable changes relative to any 0.0.x.

* Merged the role of `StateController` and the root `State` into a single class `RootState`.

* Adopted CommonJS/Node–style module system with bundling by browserify, replacing prior strategy of shared enclosing scope and flat concatenation.

* Moved meta properties and export-level static functions to a separate module `export-static`.


#### `state` (exported function)

* Replaced `state.method` function with new `state.bind` and `state.fix` wrapper functions; adapted the `StateExpression` interpreter and `State::addMethod` to recognize and unpack the boxed function objects.


#### `State`

* Abandoned expensive, faux-secure “privileged” instance methods, and moved all methods to the prototype.

* Moved private content to a `StateContent` object held at the `_` property.

* Nullary methods `name`, `owner`, `root`, `superstate`, `attributes` are now direct properties.

* Promoted private function `virtualize` to a method.

* Repurposed `initialize` and `realize` to give them a more intuitive stack order from the constructor.

* Added internal attribute bits `INCIPIENT`, `ATOMIC`, `DESTROYED` to replace extra boolean properties.

* Replaced “boolean-trap” parameters on querying methods with a single `via` param that takes a bit field defined by `TRAVERSAL_FLAGS`, including members `VIA_SUB`, `VIA_SUPER`, `VIA_PROTO`.

* Changed terminology of “delegator” methods to “dispatchers”.

* Added provisional, disabled-by-default internal dispatch table implementation. (When enabled, preliminary perf tests have shown ~2x improvement against shallow naïve tree lookups. To be viable this still requires implementation of invalidation callbacks for the case of dynamic/mutable protostates.)

