## changelog



### 0.1.2 *(edge)*

* Allow raw arguments to be passed in with (or as) `options` parameter of `change`.



### 0.1.1 *(released)*

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

