### [Methods](#state--methods)

#### [name](#state--methods--name)

{% highlight javascript %}
this.name()
{% endhighlight %}

Returns the string name of `this` state.

{% highlight javascript %}
{% include examples/api/state/methods--name.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--name.coffee %}
{% endhighlight %}

> [`State` constructor](/source/#state--constructor)

See also: [**path**](#state--path)


#### [express](#state--methods--express)

{% highlight javascript %}
this.express( typed )
{% endhighlight %}

* [`typed = false`] : boolean

Returns an object containing an expression of the contents of `this` state, such as would be sufficient to create a new `State` structurally identical to `this`. If `typed` is `true`, a formal `StateExpression` object is returned.

{% highlight javascript %}
{% include examples/api/state/methods--express.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--express.coffee %}
{% endhighlight %}

> [Expressions](/docs/#concepts--expressions)
> [`State.privileged.express`](/source/#state--privileged--express)


#### [mutate](#state--methods--mutate)

{% highlight javascript %}
this.mutate( expression )
{% endhighlight %}

* `expression` : ( `StateExpression` | object )

Transactionally mutates `this` state by adding, updating, or removing items as implied by the contents of `expression`. If the transaction causes a mutation, `this` emits a `mutate` event.

Returns `this`.

{% highlight javascript %}
{% include examples/api/state/methods--mutate.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--mutate.coffee %}
{% endhighlight %}

> [The `mutate` event](/docs/#concepts--events--mutation)
> [`State.privileged.mutate`](/source/#state--privileged--mutate)


#### [realize](#state--methods--realize)

{% highlight javascript %}
this.realize()
{% endhighlight %}

If `this` state is `virtual` — i.e., a lightweight `State` whose content is entirely inherited — then calling `realize` transforms `this` into a “real” state that can bear content of its own. If `this` is already real then calling `realize` has no effect.

Returns `this`.

{% highlight javascript %}
{% include examples/api/state/methods--realize--1.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--realize--1.coffee %}
{% endhighlight %}

If `this` is both `virtual` and `mutable`, then calling any of its `add...` methods necessarily uses `realize` to transform into a real state before content is added.

{% highlight javascript %}
{% include examples/api/state/methods--realize--2.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--realize--2.coffee %}
{% endhighlight %}

> [Protostates](/docs/#concepts--inheritance--protostates)
> [`State realize`](/source/#state--private--realize)
> [`State.privileged.realize`](/source/#state--privileged--realize)


#### [destroy](#state--methods--destroy)

{% highlight javascript %}
this.destroy()
{% endhighlight %}

Attempts to cleanly destroy `this` state and all of its descendant states. A `destroy` event is issued by each state as it is destroyed.

If the root state is destroyed, the owner is given back any methods it bore prior to its state implementation.

> [`State.privileged.destroy`](/source/#state--privileged--destroy)



* * *

The **model methods** in this section are used to inspect the `State` object model.

> [Inheritance](/docs/#concepts--inheritance)
> [`state/model.js`](/source/#state--model.js)


#### [owner](#state--methods--owner)

{% highlight javascript %}
this.owner()
{% endhighlight %}

Returns the object that is `this` state’s owner.

{% highlight javascript %}
{% include examples/api/state/methods--owner.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--owner.coffee %}
{% endhighlight %}

> [`State::owner`](/source/#state--prototype--owner)


#### [root](#state--methods--root)

{% highlight javascript %}
this.root()
{% endhighlight %}

Returns the `State` that is `this` state’s root state, i.e., the top-level superstate of `this` state.

{% highlight javascript %}
{% include examples/api/state/methods--root.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--root.coffee %}
{% endhighlight %}

> [The root state](/docs/#concepts--inheritance--the-root-state)
> [`State::root`](/source/#state--prototype--root)


#### [superstate](#state--methods--superstate)

{% highlight javascript %}
this.superstate()
{% endhighlight %}

Returns the `State` that is `this` state’s superstate.

{% highlight javascript %}
{% include examples/api/state/methods--superstate.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--superstate.coffee %}
{% endhighlight %}

> [Superstates and substates](/docs/#concepts--inheritance--superstates-and-substates)
> [`State::superstate`](/source/#state--prototype--superstate)


#### [derivation](#state--methods--derivation)

{% highlight javascript %}
this.derivation( byName )
{% endhighlight %}

* [`byName = false`] : boolean

Returns an `Array` containing each `State` from the root state to `this` state, starting with the immediate substate from the root.

If `byName` is `true`, the returned `Array` contains the string names of each state, rather than the `State`s themselves.

{% highlight javascript %}
{% include examples/api/state/methods--derivation.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--derivation.coffee %}
{% endhighlight %}

> [`State::derivation`](/source/#state--prototype--derivation)


#### [path](#state--methods--path)

{% highlight javascript %}
this.path()
{% endhighlight %}

Returns a string that is the absolute selector referencing `this` state.

{% highlight javascript %}
{% include examples/api/state/methods--path.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--path.coffee %}
{% endhighlight %}

> [`State::path`](/source/#state--prototype--path)


#### [depth](#state--methods--depth)

{% highlight javascript %}
this.depth()
{% endhighlight %}

Returns the number of superstates separating `this` state from its root state.

{% highlight javascript %}
{% include examples/api/state/methods--depth.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--depth.coffee %}
{% endhighlight %}

> [`State::depth`](/source/#state--prototype--depth)


#### [common](#state--methods--common)

{% highlight javascript %}
this.common( other )
{% endhighlight %}

* `other` : ( `State` | string )

Returns the `State` that is the nearest common ancestor of both `this` state and the provided `other` state.

{% highlight javascript %}
{% include examples/api/state/methods--common.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--common.coffee %}
{% endhighlight %}

> [`State::common`](/source/#state--prototype--common)


#### [is](#state--methods--is)

{% highlight javascript %}
this.is( other )
{% endhighlight %}

* `other` : ( `State` | string )

Returns a boolean indicating whether `this` state is the provided `other` state.

{% highlight javascript %}
{% include examples/api/state/methods--is.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--is.coffee %}
{% endhighlight %}

> [`State::is`](/source/#state--prototype--is)


#### [isIn](#state--methods--is-in)

{% highlight javascript %}
this.isIn( other )
{% endhighlight %}

* `other` : ( `State` | string )

Returns a boolean indicating whether `this` state is or is a substate of the provided `other` state.

{% highlight javascript %}
{% include examples/api/state/methods--is-in.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--is-in.coffee %}
{% endhighlight %}

> [`State::isIn`](/source/#state--prototype--is-in)


#### [has](#state--methods--has)

{% highlight javascript %}
this.has( other )
{% endhighlight %}

* `other` : ( `State` | string )

Returns a boolean indicating whether `this` state is or is a superstate of the provided `other` state.

{% highlight javascript %}
{% include examples/api/state/methods--has.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--has.coffee %}
{% endhighlight %}

> [`State::has`](/source/#state--prototype--has)


#### [isSuperstateOf](#state--methods--is-superstate-of)

{% highlight javascript %}
this.isSuperstateOf( other )
{% endhighlight %}

* `other` : ( `State` | string )

Returns a boolean indicating whether `this` state is a superstate of the provided `other` state.

{% highlight javascript %}
{% include examples/api/state/methods--is-superstate-of.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--is-superstate-of.coffee %}
{% endhighlight %}

> [`State::isSuperstateOf`](/source/#state--prototype--is-superstate-of)

See also: [**superstate**](#state--superstate)


#### [protostate](#state--methods--protostate)

{% highlight javascript %}
this.protostate()
{% endhighlight %}

Returns a `State` that is `this` state’s **protostate**: the state analogous to `this` within the state tree of the nearest prototype of `this.owner()`.

Returns `undefined` if no protostate exists anywhere in the owner’s prototype chain.

{% highlight javascript %}
{% include examples/api/state/methods--protostate.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--protostate.coffee %}
{% endhighlight %}


> [Protostates](/docs/#concepts--inheritance--protostates)
> [`State::protostate`](/source/#state--prototype--protostate)


#### [isProtostateOf](#state--methods--is-protostate-of)

{% highlight javascript %}
this.isProtostateOf( other )
{% endhighlight %}

* `other` : ( `State` | string )

Returns a boolean indicating whether `this` state is a **protostate** of the provided `other` state.

{% highlight javascript %}
{% include examples/api/state/methods--is-protostate-of.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--is-protostate-of.coffee %}
{% endhighlight %}

> [Protostates](/docs/#concepts--inheritance--protostates)
> [`State::isProtostateOf`](/source/#state--prototype--is-prototstate-of)

See also: [**protostate**](#state--protostate)


#### [defaultSubstate](#state--methods--default-substate)

{% highlight javascript %}
this.defaultSubstate( viaProto )
{% endhighlight %}

* [`viaProto = true`] : boolean

Returns the `State` that is `this` state’s first substate bearing the `default` attribute, or just the first substate if none are found.

{% highlight javascript %}
{% include examples/api/state/methods--default-substate.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--default-substate.coffee %}
{% endhighlight %}

> 1. `Moving` is explicitly marked `default`.

> 2. Since `Moving`, which is itself abstract, has no descendant states marked `default`, its first substate `Walking` serves as its default state.

> 3. A transition targeting the root state will fall through to `Walking`, since both the root and its default state `Moving` are abstract.

> [`State::defaultSubstate`](/source/#state--prototype--default-substate)


#### [initialSubstate](#state--methods--initial-substate)

{% highlight javascript %}
this.initialSubstate()
{% endhighlight %}

Returns the `State` that is `this` state’s most deeply nested state bearing the `initial` attribute, by way of its greatest `initial` descendant state.

> [`State::initialSubstate`](/source/#state--prototype--initial-substate)



* * *

The **currency methods** in this section determine or decide which of an owner object’s `State`s are presently **current** or **active**, and thus will influence the behavior exhibited by the owner.

> [`state/currency.js`](/source/#state--currency.js)


#### [current](#state--methods--current)

{% highlight javascript %}
this.current()
{% endhighlight %}

Returns the current `State` of `this` state’s owner.


#### [isCurrent](#state--methods--is-current)

{% highlight javascript %}
this.isCurrent()
{% endhighlight %}

Returns a boolean indicating whether `this` state is the owner’s current state.


#### [isActive](#state--methods--is-active)

{% highlight javascript %}
this.isActive()
{% endhighlight %}

Returns a boolean indicating whether `this` state or one of its substates is the owner’s current state.


#### [change](#state--methods--change)

Aliases: **go**, **be**

{% highlight javascript %}
this.change( target, options )
{% endhighlight %}

* `target` : ( `State` | string )
* [`options`] : object

Attempts to execute a state transition. Handles asynchronous transitions, generation of appropriate events, and construction of any necessary temporary virtual states. Respects guards supplied in both the origin and `target` states.

The `target` parameter may be either a `State` object within the purview of this controller, or a string that resolves to a likewise targetable `State` when evaluated from the context of the most recently current state.

The `options` parameter is an optional map that may include:

* `args` : `Array` — arguments to be passed to a transition’s `action` function.
* `success` : function — callback to be executed upon successful completion of the transition.
* `failure` : function — callback to be executed if the transition attempt is blocked by a guard.



* * *

The `query` method is used, either directly or via an owner object’s accessor method, to inspect and traverse the owner’s state graph.

> [`state/query.js`](/source/#state--query.js)


#### [query](#state--methods--query)

Alias: **match**

{% highlight javascript %}
this.query( selector, against, descend, ascend, viaProto )
{% endhighlight %}

* `selector` : string
* [`against`] : `State`
* [`descend = true`] : boolean
* [`ascend = true`] : boolean
* [`viaProto = true`] : boolean

Matches a `selector` string with the state or states it represents in the context of `this` state. If no match exists in `this` context, the selector is reevaluated in the context of all its substates and descendant states, and if necessary in the context of its superstates and all of their descendants, until all possible locations in the state tree have been exhausted.

Returns the matched `State`, or an `Array` containing the set of matched states. If a state to be tested `against` is provided, then a boolean is returned, indicating whether `against` is the matched state itself or is included in the matching set.

Setting `descend` to `false` disables recursion through the substates of `this`, and likewise setting `ascend` to `false` disables the subsequent recursion through its superstates.

Calling an owner object’s accessor method with a selector string invokes `query` on the owner’s current state.


> [Getting started](/docs/#getting-started)
> [Selectors](/docs/#concepts--selectors)
> [`State::query`](/source/#state--prototype--query)


#### [$](#state--methods--dollarsign)

{% highlight javascript %}
this.$( selector )
{% endhighlight %}

* `selector` : string

Convenience method that mimics the behavior of the owner’s accessor method: if the first argument is a transition arrow selector string, the call is aliased to `change`; or if passed a plain selector string, the call is aliased to `query`.

{% highlight javascript %}
this.$('-> Awake')
{% endhighlight %}

Aliases to [`change`](#state--change), instigating a transition to the `Awake` state.

{% highlight javascript %}
this.$('Awake')
{% endhighlight %}

Aliases to [`query`](#state--query), returning the `State` named `'Awake'`.



* * *

The **attribute methods** in this section are predicates that inspect the attributes of a `State`.

> [Attributes](/docs/#concepts--attributes)
> [`state/attributes.js`](/source/#state--attributes.js)


#### [isVirtual](#state--methods--is-virtual)

{% highlight javascript %}
this.isVirtual()
{% endhighlight %}

Returns a boolean indicating whether `this` state bears the `virtual` attribute.

A **virtual state** is a lightweight inheritor of a **protostate** located higher in the owner object’s prototype chain. Notably, as virtual states are created automatically, no modifier keyword exists for the `virtual` attribute.

{% highlight javascript %}
{% include examples/api/state/methods--is-virtual.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--is-virtual.coffee %}
{% endhighlight %}

> 1. The `mover` instance, which inherits its stateful implementation from `Mover.prototype`, does not have a real `Stationary` state of its own, so a virtual `Stationary` state is created automatically and adopted as `mover`’s initial state.

> 2. Root states are never virtualized. Even an object that inherits all statefulness from its prototypes is given a real root state.

> [Protostates](/docs/#concepts--inheritance--protostates)


#### [isMutable](#state--methods--is-mutable)

{% highlight javascript %}
this.isMutable()
{% endhighlight %}

Returns a boolean indicating whether `this` state bears the `mutable` attribute.

By default, states are **weakly immutable**; i.e., once a `State` has been constructed, its declared data, methods, guards, substates, and transitions cannot be altered. By including the `mutable` attribute in the state’s expression, this restriction is lifted. Mutability is also inherited from any of a state’s superstates or protostates.

> [`mutable` attribute](/docs/#concepts--attributes--mutability--mutable)


#### [isFinite](#state--methods--is-finite)

{% highlight javascript %}
this.isFinite()
{% endhighlight %}

Returns a boolean indicating whether `this` state bears the `finite` attribute.

If a state is declared `finite`, no substates or descendant states may be added, nor may any be removed without also destroying the state itself.

> [`finite` attribute](/docs/#concepts--attributes--mutability--finite)


#### [isImmutable](#state--methods--is-immutable)

{% highlight javascript %}
this.isImmutable()
{% endhighlight %}

Returns a boolean indicating whether `this` state bears the `immutable` attribute.

A literal or inherited `immutable` attribute causes a state to become **strongly immutable**, wherein it guarantees immutability absolutely, throughout all inheriting states. The `immutable` attribute also implies `finite`, and contradicts and overrides any literal or inherited `mutable` attribute.

> [`immutable` attribute](/docs/#concepts--attributes--mutability--immutable)


#### [isInitial](#state--methods--is-initial)

{% highlight javascript %}
this.isInitial()
{% endhighlight %}

Returns a boolean indicating whether `this` state bears the `initial` attribute.

Marking a state `initial` specifies which state a newly stateful object should assume.

Objects inheriting from a stateful prototype will have their initial state set to the prototype’s current state.

> [`initial` attribute](/docs/#concepts--attributes--destination--initial)


#### [isConclusive](#state--methods--is-conclusive)

{% highlight javascript %}
this.isConclusive()
{% endhighlight %}

Returns a boolean indicating whether `this` state bears the `conclusive` attribute.

Once a state marked `conclusive` is entered, it cannot be exited, although transitions may still freely traverse within its substates.

> [`conclusive` attribute](/docs/#concepts--attributes--destination--conclusive)


#### [isFinal](#state--methods--is-final)

{% highlight javascript %}
this.isFinal()
{% endhighlight %}

Returns a boolean indicating whether `this` state bears the `final` attribute.

Once a state marked `final` is entered, no further outbound transitions within its local region are allowed.

> [`final` attribute](/docs/#concepts--attributes--destination--final)


#### [isAbstract](#state--methods--is-abstract)

{% highlight javascript %}
this.isAbstract()
{% endhighlight %}

Returns a boolean indicating whether `this` state is `abstract`.

An `abstract` state is used only as a source of inheritance, and cannot itself be current. A transition that directly targets an abstract state will be automatically redirected to one of its substates.

> [`abstract` attribute](/docs/#concepts--attributes--abstraction--abstract)


#### [isConcrete](#state--methods--is-concrete)

{% highlight javascript %}
this.isConcrete()
{% endhighlight %}

Returns a boolean indicating whether `this` state is `concrete`.

All non-abstract states are concrete. Marking a state with the `concrete` attribute in a state expression will override any `abstract` attribute, particularly such as would otherwise be inherited from a protostate.

> [`concrete` attribute](/docs/#concepts--attributes--abstraction--concrete)


#### [isDefault](#state--methods--is-default)

{% highlight javascript %}
this.isDefault()
{% endhighlight %}

Returns a boolean indicating whether `this` state bears the `default` attribute.

Marking a state `default` designates it as the specific redirection target for any transition that targets its abstract superstate.

See also: [**defaultSubstate**](#state--methods--default-substate)

> [`default` attribute](/docs/#concepts--attributes--abstraction--default)


* * *

> [Data](/docs/#concepts--data)
> [`state/data.js`](/source/#state--data.js)


#### [data](#state--methods--data)

{% highlight javascript %}
this.data( viaSuper, viaProto )
{% endhighlight %}

* [`viaSuper = true`] : boolean
* [`viaProto = true`] : boolean

Returns an object clone of the data attached to `this` state, including any data inherited from protostates and superstates, unless specified otherwise by the inheritance flags `viaSuper` and `viaProto`.

{% highlight javascript %}
this.data( edit )
{% endhighlight %}

* `edit` : object

Adds, updates, and/or removes data on `this` state, and returns `this`.

For any keys in `edit` whose values are set to the `O.NIL` directive, the matching properties are deleted from `this` state’s data.

If the operation results in a change to `this` state’s data, a `mutate` event is emitted.


> [`State.privileged.data`](/source/#state--privileged--data)


* * *

The methods in this section deal with adding, removing, inspecting, and the application of **state methods**.

> [Methods](/docs/#concepts--methods)
> [`state/methods.js`](/source/#state--methods.js)


#### [method](#state--methods--method)

{% highlight javascript %}
this.method( methodName, viaSuper, viaProto, out )
{% endhighlight %}

* `methodName` : string
* [`viaSuper = true`] : boolean
* [`viaProto = true`] : boolean
* [`out`] : object

Returns the function that is the method held on `this` state whose name is `methodName`.

If the named method does not exist on `this` state, then it will be inherited, in order, first from protostates of `this` (unless `viaProto` is `false`), and if no such method exists there, then from superstates of `this` (unless `viaSuper` is `false`).

If an `out` object is supplied, then the returned `function` is attached to `out.method`, and the `State` context to which the method will be bound when invoked with `this.apply` or `this.call` is attached to `out.context`.

> [`State.privileged.method`](/source/#state--privileged--method)


#### [methodNames](#state--methods--method-names)

{% highlight javascript %}
this.methodNames()
{% endhighlight %}

Returns an `Array` of names of methods defined locally on `this` state.

> [`State.privileged.methodNames`](/source/#state--privileged--method-names)


#### [addMethod](#state--methods--add-method)

{% highlight javascript %}
this.addMethod( methodName, fn )
{% endhighlight %}

* `methodName` : string
* `fn` : function

Adds `fn` as a method named `methodName` to `this` state, which will be callable directly from the owner, but with its context bound to `this`.

Returns `fn`.

> [`State.privileged.addMethod`](/source/#state--privileged--add-method)


#### [removeMethod](#state--methods--remove-method)

{% highlight javascript %}
this.removeMethod( methodName )
{% endhighlight %}

* `methodName` : string

Dissociates the method named `methodName` from `this` state and returns its function.

> [`State.privileged.removeMethod`](/source/#state--privileged--remove-method)


#### [hasMethod](#state--methods--has-method)

{% highlight javascript %}
this.hasMethod( methodName )
{% endhighlight %}

* `methodName` : string

Returns a boolean indicating whether `this` state possesses or inherits a method named `methodName`.

> [`State::hasMethod`](/source/#state--prototype--has-method)


#### [hasOwnMethod](#state--methods--has-own-method)

{% highlight javascript %}
this.hasOwnMethod( methodName )
{% endhighlight %}

* `methodName` : string

Returns a boolean indicating whether `this` state directly possesses a method named `methodName`.

> [`State::hasOwnMethod`](/source/#state--prototype--has-own-method)


#### [apply](#state--methods--apply)

{% highlight javascript %}
this.apply( methodName, args )
{% endhighlight %}

* `methodName` : string
* [`args`] : `Array`

Finds the state method named by `methodName`, applies it with the provided `args` in the appropriate context, and returns its result.

If the method was originally defined in the owner, the context will be the owner. Otherwise, the context will either be the precise `State` in which the method is defined, or if the method resides in a protostate, the corresponding `State` belonging to the inheriting owner.

If the named method does not exist locally and cannot be inherited, a `noSuchMethod` event is emitted and the call returns `undefined`.

> [`State::apply`](/source/#state--prototype--apply)


#### [call](#state--methods--call)

{% highlight javascript %}
this.call( methodName, args... )
{% endhighlight %}

* `methodName` : string
* [`args...`] : *individual arguments*

The variadic companion to `apply`.

> [`State::call`](/source/#state--prototype--call)



* * *

The **event methods** in this section implement a typical **event emitter** pattern.

Built-in event types are listed and described in the [Events](/docs/#concepts--events) section of the documentation.

> [`state/events.js`](/source/#state--events.js)


#### [event](#state--methods--event)

{% highlight javascript %}
this.event( eventType, id )
{% endhighlight %}

* `eventType` : string
* [`id`] : ( string | number | function )

Returns a registered event listener, or the number of listeners registered, for a given `eventType`.

If an `id` as returned by [`addEvent`](#state--add-event) is provided, the event listener associated with that `id` is returned. If no `id` is provided, the number of event listeners registered to `eventType` is returned.

> [`State.privileged.event`](/source/#state--privileged--event)


#### [addEvent](#state--methods--add-event)

Aliases: **on**, **bind**

{% highlight javascript %}
this.addEvent( eventType, fn, context )
{% endhighlight %}

* `eventType` : string
* `fn` : function
* [`context = this`] : object

Binds an event listener `fn` to the specified `eventType` and returns a unique identifier for the listener.

> [`State.privileged.addEvent`](/source/#state--privileged--add-event)


#### [removeEvent](#state--methods--remove-event)

Aliases: **off**, **unbind**

{% highlight javascript %}
this.removeEvent( eventType, id )
{% endhighlight %}

* `eventType` : string
* [`id`] : ( string | number | function )

Unbinds the event listener with the specified `id` that was supplied by `addEvent`.

> [`State.privileged.removeEvent`](/source/#state--privileged--remove-event)


#### [emit](#state--methods--emit)

Aliases: **trigger**

{% highlight javascript %}
this.emit( eventType, args, context, viaSuper, viaProto )
{% endhighlight %}

* `eventType` : string
* [`args = []`] : `Array`
* [`context = this`] : object
* [`viaSuper = true`] : boolean
* [`viaProto = true`] : boolean

Invokes all listeners bound to the given `eventType`.

Arguments for the listeners can be passed as an array to the `args` parameter.

Listeners are invoked in the context of `this` state, or as specified by `context`.

Listeners bound to superstates and protostates of `this` are also invoked, unless otherwise directed by setting `viaSuper` or `viaProto` to `false`.

> [`State.privileged.emit`](/source/#state--privileged--emit)



* * *

> [Guards](/docs/#concepts--guards)
> [`state/guards.js`](/source/#state--guards.js)


#### [guard](#state--methods--guard)

{% highlight javascript %}
this.guard( guardType )
{% endhighlight %}

* `guardType` : string

Returns a guard entity for `this` state.

A **guard** is a map of values or functions that will be evaluated as either a boolean or predicate, respectively, to provide a determination of whether the owner’s currency will be admitted into or released from the state to which the guard is applied.

Valid `guardType`s include `admit` and `release`.

Guards are inherited from protostates, but not from superstates.

> [`State.privileged.guard`](/source/#state--privileged--guard)


#### [addGuard](#state--methods--add-guard)

{% highlight javascript %}
this.addGuard( guardType, guard )
{% endhighlight %}

* `guardType` : string
* `guard` : object

Adds a guard to `this` state, or augments an existing guard with additional entries.

> [`State.privileged.addGuard`](/source/#state--privileged--add-guard)


#### [removeGuard](#state--methods--remove-guard)

{% highlight javascript %}
this.removeGuard( guardType, keys )
{% endhighlight %}

* `guardType` : string
* [`keys`] : ( `Array` | string )

Removes a guard from `this` state, or removes specific entries from an existing guard.

> [`State.privileged.removeGuard`](/source/#state--privileged--remove-guard)



* * *

> [Superstates and substates](/docs/#concepts--inheritance--superstates-and-substates)
> [`state/model.js`](/source/#state--model.js)


#### [substate](#state--methods--substate)

{% highlight javascript %}
this.substate( stateName, viaProto )
{% endhighlight %}

* `stateName` : string
* [`viaProto = true`] : boolean

Returns the substate of `this` state named `stateName`. If no such substate exists locally within `this`, and `viaProto` is `true`, then the nearest identically named substate held on a protostate will be returned.

> [`State.privileged.substate`](/source/#state--privileged--substate)


#### [substates](#state--methods--substates)

{% highlight javascript %}
this.substates( deep, virtual )
{% endhighlight %}

* [`deep = false`] : boolean
* [`virtual = false`] : boolean

Returns an `Array` of `this` state’s substates.

If `deep` is `true`, the returned array is a depth-first flattened list of all of this state’s descendant states.

If `virtual` is `true`, the returned array may include any active virtual states held by an owner object that is inheriting currency from a prototype.

> [`State.privileged.substates`](/source/#state--privileged--substates)


#### [addSubstate](#state--methods--add-substate)

{% highlight javascript %}
this.addSubstate( stateName, stateExpression )
{% endhighlight %}

* `stateName` : string
* `stateExpression` : ( `StateExpression` | object | `State` )

Creates a `State` based on the provided `stateExpression`, adds it as a substate of `this` state, and returns the new `State`.

If a substate with the same `stateName` already exists, it is first destroyed and then replaced.

> [`State.privileged.addSubstate`](/source/#state--privileged--add-substate)


#### [removeSubstate](#state--methods--remove-substate)

{% highlight javascript %}
this.removeSubstate( stateName )
{% endhighlight %}

* `stateName` : string

Removes the substate named by `stateName` from `this` state, if possible, and returns the removed `State`.

If the owner object is in the midst of a transition involving the state targeted for removal, then the removal will fail, returning `false`.

> [`State.privileged.removeSubstate`](/source/#state--privileged--remove-substate)


* * *


#### [transition](#state--methods--transition)

{% highlight javascript %}
this.transition( transitionName )
{% endhighlight %}

* `transitionName` : string

Returns the transition expression named by `transitionName` registered to `this` state.


#### [transitions](#state--methods--transitions)

{% highlight javascript %}
this.transitions()
{% endhighlight %}

Returns an object containing all of the transition expressions registered to `this` state.


#### [addTransition](#state--methods--add-transition)

{% highlight javascript %}
this.addTransition( transitionName, transitionExpression )
{% endhighlight %}

* `transitionName` : string
* `transitionExpression` : ( `TransitionExpression` | object )

Registers a transition expression to `this` state.


#### [removeTransition](#state--methods--remove-transition)

(Not implemented.)
