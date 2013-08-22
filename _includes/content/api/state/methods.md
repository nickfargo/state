### [Methods](#state--methods)


#### [realize](#state--methods--realize)

Transforms `this` [virtual state](/docs/#concepts--inheritance--virtual-epistates) into a “real” state that can bear content of its own.

###### SYNTAX

{% highlight javascript %}
this.realize()
{% endhighlight %}

###### RETURNS

`this`

###### EXAMPLES

If `this` is already real instead of virtual, then calling `realize` has no effect.

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

###### SEE ALSO

> [Protostates and epistates](/docs/#concepts--inheritance--protostates-and-epistates)
> [Virtual epistates](/docs/#concepts--inheritance--virtual-epistates)
> [`State realize`](/source/state.html#state--private--realize)
> [`State::realize`](/source/state.html#state--prototype--realize)


#### [destroy](#state--methods--destroy)

Attempts to cleanly destroy `this` state and all of its descendant states.

###### SYNTAX

{% highlight javascript %}
this.destroy()
{% endhighlight %}

###### RETURNS

`true` if `this` state is successfully destroyed, or `false` otherwise.

###### NOTES

A `destroy` event is issued by each state as it is destroyed.

If the root state is destroyed, the owner is given back any methods it bore prior to its state implementation.

###### SEE ALSO

> [`State::destroy`](/source/state.html#state--prototype--destroy)


#### [express](#state--methods--express)

Produces an object containing an expression of the contents of `this` state, such as would be sufficient to create a new `State` structurally identical to `this`.

###### SYNTAX

{% highlight javascript %}
this.express( typed )
{% endhighlight %}

###### PARAMETERS

* [`typed = false`] : boolean

###### RETURNS

The generated plain-object, or equivalent `StateExpression` if `typed` is `true`.

###### EXAMPLE

{% highlight javascript %}
{% include examples/api/state/methods--express.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--express.coffee %}
{% endhighlight %}

###### SEE ALSO

> [Expressions](/docs/#concepts--expressions)
> [`State::express`](/source/state.html#state--prototype--express)


#### [mutate](#state--methods--mutate)

Transactionally mutates `this` state by adding, updating, or removing items as implied by the contents of `expression`.

###### SYNTAX

{% highlight javascript %}
this.mutate( expression )
{% endhighlight %}

###### PARAMETERS

* `expression` : ( `StateExpression` | object )

###### RETURNS

`this`

###### NOTES

Property removal is indicated with a value equal to the unique `O.NIL` reference.

If the transaction causes a mutation, `this` emits a [`mutate` event](#state--events--mutate).

###### EXAMPLE

{% highlight javascript %}
{% include examples/api/state/methods--mutate.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--mutate.coffee %}
{% endhighlight %}

###### SEE ALSO

> [Mutation events](/docs/#concepts--events--mutation)
> [`State::mutate`](/source/state.html#state--prototype--mutate)


#### [derivation](#state--methods--derivation)

Describes the superstate chain of `this` as an array.

###### SYNTAX

{% highlight javascript %}
this.derivation( byName )
{% endhighlight %}

###### PARAMETERS

* [`byName = false`] : boolean

###### RETURNS

An `Array` containing each `State` from the root state to `this` state, starting with the immediate substate from the root.

If `byName` is `true`, the returned `Array` contains the string names of each state, rather than the `State`s themselves.

###### EXAMPLE

{% highlight javascript %}
{% include examples/api/state/methods--derivation.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--derivation.coffee %}
{% endhighlight %}

###### SEE ALSO

> [`State::derivation`](/source/state.html#state--prototype--derivation)


#### [path](#state--methods--path)

Describes the superstate chain of `this` as a dot-delimited string.

###### SYNTAX

{% highlight javascript %}
this.path()
{% endhighlight %}

###### RETURNS

A string that matches the absolute selector referencing `this` state.

###### EXAMPLE

{% highlight javascript %}
{% include examples/api/state/methods--path.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--path.coffee %}
{% endhighlight %}

###### SEE ALSO

> [`State::path`](/source/state.html#state--prototype--path)


#### [depth](#state--methods--depth)

Quantifies the height of the superstate chain of `this`.

###### SYNTAX

{% highlight javascript %}
this.depth()
{% endhighlight %}

###### RETURNS

The number of superstates separating `this` state from its root state.

###### EXAMPLE

{% highlight javascript %}
{% include examples/api/state/methods--depth.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--depth.coffee %}
{% endhighlight %}

###### SEE ALSO

> [`State::depth`](/source/state.html#state--prototype--depth)


#### [common](#state--methods--common)

Establishes the hierarchical relation between `this` and another `State`.

###### SYNTAX

{% highlight javascript %}
this.common( other )
{% endhighlight %}

###### PARAMETERS

* `other` : ( `State` | string )

###### RETURNS

The `State` that is the nearest common ancestor of both `this` state and the provided `other` state.

###### EXAMPLE

{% highlight javascript %}
{% include examples/api/state/methods--common.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--common.coffee %}
{% endhighlight %}

###### SEE ALSO

> [`State::common`](/source/state.html#state--prototype--common)


#### [substate](#state--methods--substate)

Identifies a named substate of `this`.

###### SYNTAX

{% highlight javascript %}
this.substate( stateName, via )
{% endhighlight %}

###### PARAMETERS

* `stateName` : string
* [`via = VIA_PROTO`] : boolean

###### RETURNS

The substate of `this` state named `stateName`. If no such substate exists locally within `this`, and the `VIA_PROTO` bit of `via` is set, then the nearest identically named substate held on a protostate will be returned.

###### SEE ALSO

> [`State::substate`](/source/state.html#state--prototype--substate)


#### [substates](#state--methods--substates)

Generates a collection of substates of `this`.

###### SYNTAX

{% highlight javascript %}
this.substates( deep, virtual )
{% endhighlight %}

###### PARAMETERS

* [`deep = false`] : boolean
* [`virtual = false`] : boolean

###### RETURNS

An `Array` of `this` state’s substates.

###### NOTES

If `deep` is `true`, the returned array is a depth-first flattened list of all of this state’s descendant states.

If `virtual` is `true`, the returned array may include any active virtual states held by an owner object that is inheriting currency from a prototype.

###### SEE ALSO

> [`State::substates`](/source/state.html#state--prototype--substates)


#### [addSubstate](#state--methods--add-substate)

Creates a `State` based on the provided `stateExpression`, adds it as a substate of `this` state.

###### SYNTAX

{% highlight javascript %}
this.addSubstate( stateName, stateExpression )
{% endhighlight %}

###### PARAMETERS

* `stateName` : string
* `stateExpression` : ( `StateExpression` | object | `State` )

###### RETURNS

The new `State`.

###### NOTES

If a substate with the same `stateName` already exists, it is first destroyed and then replaced.

###### SEE ALSO

> [`State::addSubstate`](/source/state.html#state--prototype--add-substate)


#### [removeSubstate](#state--methods--remove-substate)

Removes the substate named by `stateName` from `this` state, if possible.

###### SYNTAX

{% highlight javascript %}
this.removeSubstate( stateName )
{% endhighlight %}

###### PARAMETERS

* `stateName` : string

###### RETURNS

The removed `State`.

###### NOTES

If the owner object is in the midst of a transition involving the state targeted for removal, then the removal will fail, returning `false`.

###### SEE ALSO

> [`State::removeSubstate`](/source/state.html#state--prototype--remove-substate)


#### [is](#state--methods--is)

Asserts identity.

###### SYNTAX

{% highlight javascript %}
this.is( other )
{% endhighlight %}

###### PARAMETERS

* `other` : ( `State` | string )

###### RETURNS

A boolean indicating whether `this` state is the provided `other` state.

###### EXAMPLE

{% highlight javascript %}
{% include examples/api/state/methods--is.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--is.coffee %}
{% endhighlight %}

###### SEE ALSO

> [`State::is`](/source/state.html#state--prototype--is)


#### [isIn](#state--methods--is-in)

Asserts descendant familiarity.

###### SYNTAX

{% highlight javascript %}
this.isIn( other )
{% endhighlight %}

###### PARAMETERS

* `other` : ( `State` | string )

###### RETURNS

A boolean indicating whether `this` state is or is a substate of the provided `other` state.

###### EXAMPLE

{% highlight javascript %}
{% include examples/api/state/methods--is-in.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--is-in.coffee %}
{% endhighlight %}

###### SEE ALSO

> [`State::isIn`](/source/state.html#state--prototype--is-in)


#### [hasSubstate](#state--methods--has-substate)

Asserts ancestral familiarity.

###### SYNTAX

{% highlight javascript %}
this.hasSubstate( other )
{% endhighlight %}

###### PARAMETERS

* `other` : ( `State` | string )

###### RETURNS

A boolean indicating whether `this` state is or is a superstate of the provided `other` state.

###### EXAMPLE

{% highlight javascript %}
{% include examples/api/state/methods--has-substate.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--has-substate.coffee %}
{% endhighlight %}

###### SEE ALSO

> [`State::hasSubstate`](/source/state.html#state--prototype--has-substate)


#### [isSuperstateOf](#state--methods--is-superstate-of)

Asserts hierarchical ancestry.

###### SYNTAX

{% highlight javascript %}
this.isSuperstateOf( other )
{% endhighlight %}

###### PARAMETERS

* `other` : ( `State` | string )

###### RETURNS

A boolean indicating whether `this` state is a superstate of the provided `other` state.

###### EXAMPLE

{% highlight javascript %}
{% include examples/api/state/methods--is-superstate-of.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--is-superstate-of.coffee %}
{% endhighlight %}

###### SEE ALSO

> [**superstate**](#state--superstate)

> [`State::isSuperstateOf`](/source/state.html#state--prototype--is-superstate-of)


#### [defaultSubstate](#state--methods--default-substate)

Resolves the proper concretion for an abstract state.

###### SYNTAX

{% highlight javascript %}
this.defaultSubstate( via )
{% endhighlight %}

###### PARAMETERS

* [`via = VIA_PROTO`] : number

###### RETURNS

The `State` that is `this` state’s first substate bearing the `default` attribute, or just the first substate if none are found.

###### EXAMPLE

{% highlight javascript %}
{% include examples/api/state/methods--default-substate.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--default-substate.coffee %}
{% endhighlight %}

> 1. `Moving` is explicitly marked `default`.

> 2. Since `Moving`, which is itself abstract, has no descendant states marked `default`, its first substate `Walking` serves as its default state.

> 3. A transition targeting the root state will fall through to `Walking`, since both the root and its default state `Moving` are abstract.

###### SEE ALSO

> [`State::defaultSubstate`](/source/state.html#state--prototype--default-substate)


#### [initialSubstate](#state--methods--initial-substate)

###### SYNTAX

{% highlight javascript %}
this.initialSubstate()
{% endhighlight %}

###### RETURNS

The `State` that is `this` state’s most deeply nested state bearing the `initial` attribute, by way of its greatest `initial` descendant state.

###### SEE ALSO

> [`State::initialSubstate`](/source/state.html#state--prototype--initial-substate)


#### [getProtostate](#state--methods--get-protostate)

Performs the lookup to identify the `State` analogous to `this` that is owned by a prototype of the `owner`.

###### SYNTAX

{% highlight javascript %}
this.getProtostate()
{% endhighlight %}

###### RETURNS

The **protostate** of `this`: that `State` which both has a derivation `path` identical to the `path` of `this`, and whose `owner` is the nearest possible prototype of the `owner` of `this`.

Returns `undefined` if no protostate exists anywhere in the owner’s prototype chain.

###### EXAMPLE

{% highlight javascript %}
{% include examples/api/state/methods--get-protostate.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--get-protostate.coffee %}
{% endhighlight %}

###### SEE ALSO

> [Protostates](/docs/#concepts--inheritance--protostates-and-epistates)
> [`State::getProtostate`](/source/state.html#state--prototype--get-protostate)


#### [isProtostateOf](#state--methods--is-protostate-of)

Asserts prototypal ancestry of an `other` `State` relative to `this`; i.e., whether an `other` `State` has an identical `path` to `this` and the `owner` of `other` is a prototype of the `owner` of `this`.

###### SYNTAX

{% highlight javascript %}
this.isProtostateOf( other )
{% endhighlight %}

###### PARAMETERS

* `other` : ( `State` | string )

###### RETURNS

A boolean indicating whether `this` state is a **protostate** of the provided `other` state.

###### EXAMPLE

{% highlight javascript %}
{% include examples/api/state/methods--is-protostate-of.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--is-protostate-of.coffee %}
{% endhighlight %}

###### SEE ALSO

> [**protostate**](#state--properties--protostate)

> [Protostates](/docs/#concepts--inheritance--protostates-and-epistates)
> [`State::isProtostateOf`](/source/state.html#state--prototype--is-prototstate-of)


#### [query](#state--methods--query)

Matches a `selector` string with the state or states it represents in the context of `this` state.

###### SYNTAX

{% highlight javascript %}
this.query( selector, against, descend, ascend, via )
{% endhighlight %}

###### PARAMETERS

* `selector` : string
* [`against`] : `State`
* [`via = VIA_ALL`] : number

The `via` parameter is a bit-field integer comprised of one or more of the `TRAVERSAL_FLAGS` constants: [`VIA_SUB`, `VIA_SUPER`, `VIA_PROTO`].

By default `via` is `VIA_ALL` (`~0`), which implies each of the flags’ bits are set, and consequently that the `query` operation will be recursed over the substates, superstates, and protostates, in order, of `this`. Providing a `via` argument that zeroes any of the `VIA_SUB`, `VIA_SUPER`, or `VIA_PROTO` bits will disable recursion through the substates, superstates, or protostates, respectively, of `this`.

###### RETURNS

The nearest matching `State`, or if a non-specific `selector` is provided, an `Array` containing the set of matched states. If a state to be tested `against` is provided, then a boolean is returned, indicating whether `against` is the matched state itself or is included in the matching set.

###### NOTES

Calling an owner object’s accessor method with a selector string invokes `query` on the owner’s current state.

###### SEE ALSO

> [Getting started](/docs/#getting-started)
> [Selectors](/docs/#concepts--selectors)
> [`State::query`](/source/state.html#state--prototype--query)


#### [$](#state--methods--dollarsign)

Convenience method that mimics the behavior of the owner’s accessor method.

###### SYNTAX

{% highlight javascript %}
this.$( selector )
{% endhighlight %}

###### PARAMETERS

* `selector` : string

###### RETURNS

If the first argument is a transition arrow selector string, the call is aliased to [`change`](#state--methods--change). If passed a plain selector string, the call is aliased to [`query`](#state--methods--query).

###### EXAMPLES

{% highlight javascript %}
this.$('-> Awake')
{% endhighlight %}
{% highlight coffeescript %}
@$ '-> Awake'
{% endhighlight %}

Aliases to [`change`](#state--methods--change), instigating a transition to the `Awake` state.

{% highlight javascript %}
this.$('Awake')
{% endhighlight %}
{% highlight coffeescript %}
@$ 'Awake'
{% endhighlight %}

Aliases to [`query`](#state--methods--query), returning the `State` named `'Awake'`.


#### [current](#state--methods--current)

Returns the current `State` of `this` state’s owner.

###### SYNTAX

{% highlight javascript %}
this.current()
{% endhighlight %}

###### RETURNS

`State`.


#### [isCurrent](#state--methods--is-current)

Indicates whether `this` state is the owner’s current state.

###### SYNTAX

{% highlight javascript %}
this.isCurrent()
{% endhighlight %}

###### RETURNS

Boolean.


#### [isActive](#state--methods--is-active)

Indicates whether `this` state or one of its substates is the owner’s current state.

###### SYNTAX

{% highlight javascript %}
this.isActive()
{% endhighlight %}

###### RETURNS

Boolean.


#### [change](#state--methods--change)

Attempts to execute a state transition.

###### ALIASES

**go**, **be**

###### SYNTAX

{% highlight javascript %}
this.change( target, options )
{% endhighlight %}

###### PARAMETERS

* `target` : ( `State` | string )
* [`options`] : object

The `target` parameter may be either a `State` object within the purview of this controller, or a string that resolves to a likewise targetable `State` when evaluated from the context of the most recently current state.

The `options` parameter is an optional map that may include:

* `args` : `Array` — arguments to be passed to a transition’s `action` function.
* `success` : function — callback to be executed upon successful completion of the transition.
* `failure` : function — callback to be executed if the transition attempt is blocked by a guard.

###### DISCUSSION

Handles asynchronous transitions, generation of appropriate events, and construction of any necessary temporary virtual states. Respects guards supplied in both the origin and `target` states.


#### [isVirtual](#state--methods--is-virtual)

Indicates whether `this` state bears the `virtual` attribute.

###### SYNTAX

{% highlight javascript %}
this.isVirtual()
{% endhighlight %}

###### RETURNS

Boolean.

###### DISCUSSION

A **virtual state** is a lightweight inheritor of a **protostate** located higher in the owner object’s prototype chain. Notably, as virtual states are created automatically, no modifier keyword exists for the `virtual` attribute.

###### EXAMPLE

{% highlight javascript %}
{% include examples/api/state/methods--is-virtual.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--is-virtual.coffee %}
{% endhighlight %}

> 1. The `mover` instance, which inherits its stateful implementation from `Mover.prototype`, does not have a real `Stationary` state of its own, so a virtual `Stationary` state is created automatically and adopted as `mover`’s initial state.

> 2. Root states are never virtualized. Even an object that inherits all statefulness from its prototypes is given a real root state.

###### SEE ALSO

> [Protostates](/docs/#concepts--inheritance--protostates-and-epistates)


#### [isMutable](#state--methods--is-mutable)

Indicates whether `this` state bears the `mutable` attribute.

###### SYNTAX

{% highlight javascript %}
this.isMutable()
{% endhighlight %}

###### RETURNS

Boolean.

###### DISCUSSION

By default, states are **weakly immutable**; i.e., once a `State` has been constructed, its declared data, methods, guards, substates, and transitions cannot be altered. By including the `mutable` attribute in the state’s expression, this restriction is lifted. Mutability is also inherited from any of a state’s superstates or protostates.

###### SEE ALSO

> [`mutable`](#state--attributes--mutable)


#### [isFinite](#state--methods--is-finite)

Indicates whether `this` state bears the `finite` attribute.

###### SYNTAX

{% highlight javascript %}
this.isFinite()
{% endhighlight %}

###### RETURNS

Boolean.

###### DISCUSSION

If a state is declared `finite`, no substates or descendant states may be added, nor may any be removed without also destroying the state itself.

###### SEE ALSO

> [`finite`](#state--attributes--finite)


#### [isImmutable](#state--methods--is-immutable)

Indicates whether `this` state bears the `immutable` attribute.

###### SYNTAX

{% highlight javascript %}
this.isImmutable()
{% endhighlight %}

###### RETURNS

Boolean.

###### DISCUSSION

A literal or inherited `immutable` attribute causes a state to become **strongly immutable**, wherein it guarantees immutability absolutely, throughout all inheriting states. The `immutable` attribute also implies `finite`, and contradicts and overrides any literal or inherited `mutable` attribute.

###### SEE ALSO

> [`immutable`](#state--attributes--immutable)


#### [isAbstract](#state--methods--is-abstract)

Indicates whether `this` state is `abstract`.

###### SYNTAX

{% highlight javascript %}
this.isAbstract()
{% endhighlight %}

###### RETURNS

Boolean.

###### DISCUSSION

An `abstract` state is used only as a source of inheritance, and cannot itself be current. A transition that directly targets an abstract state will be automatically redirected to one of its substates.

###### SEE ALSO

> [`abstract`](#state--attributes--abstract)


#### [isConcrete](#state--methods--is-concrete)

Indicates whether `this` state is `concrete`.

###### SYNTAX

{% highlight javascript %}
this.isConcrete()
{% endhighlight %}

###### RETURNS

Boolean.

###### DISCUSSION

All non-abstract states are concrete. Marking a state with the `concrete` attribute in a state expression will override any `abstract` attribute, particularly such as would otherwise be inherited from a protostate.

###### SEE ALSO

> [`concrete`](#state--attributes--concrete)


#### [isDefault](#state--methods--is-default)

Indicates whether `this` state bears the `default` attribute.

###### SYNTAX

{% highlight javascript %}
this.isDefault()
{% endhighlight %}

###### RETURNS

Boolean.

###### DISCUSSION

Marking a state `default` designates it as the specific redirection target for any transition that targets its abstract superstate.

###### SEE ALSO

> [`default`](#state--attributes--default),
> [`defaultSubstate`](#state--methods--default-substate)


#### [isInitial](#state--methods--is-initial)

Indicates whether `this` state bears the `initial` attribute.

###### SYNTAX

{% highlight javascript %}
this.isInitial()
{% endhighlight %}

###### RETURNS

Boolean.

###### DISCUSSION

Marking a state `initial` specifies which state a newly stateful object should assume.

Objects inheriting from a stateful prototype will have their initial state set to the prototype’s current state.

###### SEE ALSO

> [`initial`](#state--attributes--initial),
> [`initialSubstate`](#state--methods--initial-substate)


#### [isConclusive](#state--methods--is-conclusive)

Indicates whether `this` state bears the `conclusive` attribute.

###### SYNTAX

{% highlight javascript %}
this.isConclusive()
{% endhighlight %}

###### RETURNS

Boolean.

###### DISCUSSION

Once a state marked `conclusive` is entered, it cannot be exited, although transitions may still freely traverse within its substates.

###### SEE ALSO

> [`conclusive`](#state--attributes--conclusive)


#### [isFinal](#state--methods--is-final)

Indicates whether `this` state bears the `final` attribute.

###### SYNTAX

{% highlight javascript %}
this.isFinal()
{% endhighlight %}

###### RETURNS

Boolean.

###### DISCUSSION

Once a state marked `final` is entered, no further outbound transitions within its local region are allowed.

###### SEE ALSO

> [`final`](#state--attributes--final)


#### [data (read)](#state--methods--data--read)

Reads a composite of the `data` assigned to `this` state.

###### SYNTAX

{% highlight javascript %}
this.data( via )
{% endhighlight %}

###### PARAMETERS

* [`via = VIA_ALL`] : number

###### RETURNS

An object clone of the data attached to `this` state, including any data inherited from protostates and superstates, unless specified otherwise by zeroing the `VIA_SUPER` and `VIA_PROTO` bits of `via`.

###### SEE ALSO

> [`State::data`](/source/state.html#state--prototype--data)


#### [data (write)](#state--methods--data--write)

Adds, updates, and/or removes `data` properties on `this` state.

###### SYNTAX

{% highlight javascript %}
this.data( edit )
{% endhighlight %}

###### PARAMETERS

* `edit` : object

###### RETURNS

`this`.

###### NOTES

For any keys in `edit` whose values are set to the `O.NIL` directive, the matching properties are deleted from `this` state’s data.

If the operation results in a change to `this` state’s data, a `mutate` event is emitted.

###### SEE ALSO

> [`State::data`](/source/state.html#state--prototype--data)


#### [has](#state--methods--has)

Determines whether a `data` property with the given `key` exists on `this` state, or is inherited from a protostate or superstate.

###### SYNTAX

{% highlight javascript %}
this.has( key, via )
{% endhighlight %}

###### PARAMETERS

* `key` : string
* [`via = VIA_ALL`] : number

###### NOTES

Supports `long.key` lookups for deeply nested properties.

###### SEE ALSO

> [`State::has`](/source/state.html#state--prototype--has)


#### [get](#state--methods--get)

Reads a `data` item on `this` state.

###### SYNTAX

{% highlight javascript %}
this.get( key, via )
{% endhighlight %}

###### PARAMETERS

* `key` : string
* [`via = VIA_ALL`] : number

###### RETURNS

The value of the `data` property with the given `key` on `this` state, or one inherited from the nearest protostate, or the nearest superstate.

###### NOTES

Supports `long.key` lookups for deeply nested properties. Returns `undefined` if `key` cannot be resolved.

> [`State::get`](/source/state.html#state--prototype--get)


#### [let](#state--methods--let)

Writes a `data` item on `this` state.

###### SYNTAX

{% highlight javascript %}
this.let( key, value )
{% endhighlight %}

###### PARAMETERS

* `key` : string
* `value` : var

###### RETURNS

If successful, the assigned `value`.

###### NOTES

Creates a new data property or updates an existing data property on `this` state.

Succeeds only if `this` state is `mutable`.

Supports `long.key` assignments to deeply nested properties.

###### SEE ALSO

> [`State::let`](/source/state.html#state--prototype--let)


#### [set](#state--methods--set)

Writes or updates an existing `data` item on either `this` state or a superstate.

###### SYNTAX

{% highlight javascript %}
this.set( key, value )
{% endhighlight %}

###### PARAMETERS

* `key` : string
* `value` : var

###### RETURNS

The assigned `value`.

###### DISCUSSION

If the property is inherited from a `mutable` superstate, then the property is updated in place, equivalent to calling `let` on that superstate. If the data property does not yet exist in the superstate chain, it is created on `this`. Properties inherited from protostates are not affected.

###### NOTES

Supports `long.key` assignments to deeply nested properties.

###### SEE ALSO

> [`State::set`](/source/state.html#state--prototype--set)


#### [delete](#state--methods--delete)

Deletes an existing `data` property on `this` state.

###### SYNTAX

{% highlight javascript %}
this.delete( key )
{% endhighlight %}

###### PARAMETERS

* `key` : string

###### RETURNS

Boolean `true` if the deletion was successful or unnecessary, or `false` otherwise, in the same manner as the native `delete` operator.

###### NOTES

Supports `long.key` lookups for deeply nested properties.

###### SEE ALSO

> [`State::delete`](/source/state.html#state--prototype--delete)


#### [method](#state--methods--method)

###### SYNTAX

{% highlight javascript %}
this.method( methodName, via, out )
{% endhighlight %}

###### PARAMETERS

* `methodName` : string
* [`via = VIA_ALL`] : number
* [`out`] : object

###### RETURNS

The function that is the method held on `this` state whose name is `methodName`.

###### DISCUSSION

If the named method does not exist on `this` state, then it will be inherited, in order, first from protostates of `this` (if the `VIA_PROTO` bit of `via` is set), and if no such method exists there, then from superstates of `this` (if the `VIA_SUPER` bit of `via` is set).

If an `out` object is supplied, then the returned `function` is attached to `out.method`, and the `State` context to which the method will be bound when invoked with `this.apply` or `this.call` is attached to `out.context`.

###### SEE ALSO

> [`State::method`](/source/state.html#state--prototype--method)


#### [methodNames](#state--methods--method-names)

###### SYNTAX

{% highlight javascript %}
this.methodNames()
{% endhighlight %}

###### RETURNS

An `Array` of names of methods defined locally on `this` state.

###### SEE ALSO

> [`State::methodNames`](/source/state.html#state--prototype--method-names)


#### [addMethod](#state--methods--add-method)

Adds `fn` as a method named `methodName` to `this` state, which will be callable directly from the owner, but with its context bound to `this`.

###### SYNTAX

{% highlight javascript %}
this.addMethod( methodName, fn )
{% endhighlight %}

###### PARAMETERS

* `methodName` : string
* `fn` : function

###### RETURNS

`fn`.

###### SEE ALSO

> [`State::addMethod`](/source/state.html#state--prototype--add-method)


#### [removeMethod](#state--methods--remove-method)

Dissociates the method named `methodName` from `this` state and returns its function.

###### SYNTAX

{% highlight javascript %}
this.removeMethod( methodName )
{% endhighlight %}

###### PARAMETERS

* `methodName` : string

###### SEE ALSO

> [`State::removeMethod`](/source/state.html#state--prototype--remove-method)


#### [hasMethod](#state--methods--has-method)

Indicates whether `this` state possesses or inherits a method named `methodName`.

###### SYNTAX

{% highlight javascript %}
this.hasMethod( methodName )
{% endhighlight %}

###### PARAMETERS

* `methodName` : string

###### RETURNS

Boolean.

###### SEE ALSO

> [`State::hasMethod`](/source/state.html#state--prototype--has-method)


#### [hasOwnMethod](#state--methods--has-own-method)

Indicates whether `this` state directly possesses a method named `methodName`.

###### SYNTAX

{% highlight javascript %}
this.hasOwnMethod( methodName )
{% endhighlight %}

###### PARAMETERS

* `methodName` : string

###### RETURNS

Boolean.

###### SEE ALSO

> [`State::hasOwnMethod`](/source/state.html#state--prototype--has-own-method)


#### [apply](#state--methods--apply)

Invokes a state method, passing an array of arguments.

###### SYNTAX

{% highlight javascript %}
this.apply( methodName, args )
{% endhighlight %}

###### PARAMETERS

* `methodName` : string
* [`args`] : `Array`

###### RETURNS

The value returned by the invocation of the named method, or `undefined` if no such method can be invoked.

###### DISCUSSION

If the state method named by `methodName` exists locally or can be inherited via protostate or superstate, that function is applied with the provided `args` in the appropriate context, and its result is returned.

By default the context will be the [owner](#state--properties--owner). If the method was defined using [state.bind](#state-function--bind), the context will be either the precise `State` in which the method is defined, or if the method is inherited from a protostate, the corresponding epistate belonging to the inheriting owner.

If the named method does not exist and cannot be inherited, a `noSuchMethod` event is emitted and the call returns `undefined`.

###### SEE ALSO

> [`State::apply`](/source/state.html#state--prototype--apply)


#### [call](#state--methods--call)

The variadic companion to `apply`, where a state method is invoked with individually provided arguments.

###### SYNTAX

{% highlight javascript %}
this.call( methodName, args... )
{% endhighlight %}

###### PARAMETERS

* `methodName` : string
* [`args...`] : *individual arguments*

###### SEE ALSO

> [`State::call`](/source/state.html#state--prototype--call)


#### [event](#state--methods--event)

###### SYNTAX

{% highlight javascript %}
this.event( eventType, id )
{% endhighlight %}

###### PARAMETERS

* `eventType` : string
* [`id`] : ( string | number | function )

###### RETURNS

A registered event listener function, or the number of listeners registered, for a given `eventType`.

If an `id` as returned by [`addEvent`](#state--add-event) is provided, the event listener associated with that `id` is returned. If no `id` is provided, the number of event listeners registered to `eventType` is returned.

###### SEE ALSO

> [`State::event`](/source/state.html#state--prototype--event)


#### [addEvent](#state--methods--add-event)

Binds an event listener `fn` to the specified `eventType`.

###### ALIASES

**on**, **bind**

###### SYNTAX

{% highlight javascript %}
this.addEvent( eventType, fn, context )
{% endhighlight %}

###### PARAMETERS

* `eventType` : string
* `fn` : function
* [`context = this`] : object

###### RETURNS

A unique identifier for the listener.

###### SEE ALSO

> [`State::addEvent`](/source/state.html#state--prototype--add-event)


#### [removeEvent](#state--methods--remove-event)

Unbinds the event listener with the specified `id` that was supplied by `addEvent`.

###### ALIASES

**off**, **unbind**

###### SYNTAX

{% highlight javascript %}
this.removeEvent( eventType, id )
{% endhighlight %}

###### PARAMETERS

* `eventType` : string
* [`id`] : ( string | number | function )

###### SEE ALSO

> [`State::removeEvent`](/source/state.html#state--prototype--remove-event)


#### [emit](#state--methods--emit)

Invokes all listeners bound to the given `eventType`.

###### ALIASES

**trigger**

###### SYNTAX

{% highlight javascript %}
this.emit( eventType, args, context, via )
{% endhighlight %}

###### PARAMETERS

* `eventType` : string
* [`args = []`] : `Array`
* [`context = this`] : object
* [`via = VIA_ALL`] : number

Arguments for the listeners can be passed as an array to the `args` parameter.

###### NOTES

Listeners are invoked in the context of `this` state, or as specified by `context`.

Listeners bound to superstates and protostates of `this` are also invoked, unless otherwise directed by zeroing the `VIA_SUPER` or `VIA_PROTO` bits of `via`.

###### SEE ALSO

> [`State::emit`](/source/state.html#state--prototype--emit)


#### [guard](#state--methods--guard)

Describes the guards in effect for `this` state.

###### SYNTAX

{% highlight javascript %}
this.guard( guardType )
{% endhighlight %}

###### PARAMETERS

* `guardType` : string

###### RETURNS

An object containing the guard predicates and/or expressions for the specified `guardType` held on `this` state.

###### DISCUSSION

A **guard** is a map of functions or values that will be evaluated as either a predicate or boolean expression, respectively, to provide a determination of whether the owner’s currency will be admitted into or released from the state to which the guard is applied.

Valid `guardType`s include `admit` and `release`.

###### NOTES

Guards are inherited from protostates, but not from superstates.

###### SEE ALSO

> [`State::guard`](/source/state.html#state--prototype--guard)


#### [addGuard](#state--methods--add-guard)

Adds a guard to `this` state, or augments an existing guard with additional entries.

###### SYNTAX

{% highlight javascript %}
this.addGuard( guardType, guard )
{% endhighlight %}

###### PARAMETERS

* `guardType` : string
* `guard` : object

###### SEE ALSO

> [`State::addGuard`](/source/state.html#state--prototype--add-guard)


#### [removeGuard](#state--methods--remove-guard)

Removes a guard from `this` state, or removes specific entries from an existing guard.

###### SYNTAX

{% highlight javascript %}
this.removeGuard( guardType, keys )
{% endhighlight %}

###### PARAMETERS

* `guardType` : string
* [`keys`] : ( `Array` | string )

###### SEE ALSO

> [`State::removeGuard`](/source/state.html#state--prototype--remove-guard)


#### [transition](#state--methods--transition)

###### SYNTAX

{% highlight javascript %}
this.transition( transitionName )
{% endhighlight %}

###### PARAMETERS

* `transitionName` : string

###### RETURNS

The transition expression named by `transitionName` registered to `this` state.


#### [transitions](#state--methods--transitions)

###### SYNTAX

{% highlight javascript %}
this.transitions()
{% endhighlight %}

###### RETURNS

An object containing all of the transition expressions registered to `this` state.


#### [addTransition](#state--methods--add-transition)

Registers a transition expression to `this` state.

###### SYNTAX

{% highlight javascript %}
this.addTransition( transitionName, transitionExpression )
{% endhighlight %}

###### PARAMETERS

* `transitionName` : string
* `transitionExpression` : ( `TransitionExpression` | object )


#### [removeTransition](#state--methods--remove-transition)

Removes a registered transition expression from `this` state.

###### SYNTAX

{% highlight javascript %}
this.removeTransition( transitionName )
{% endhighlight %}

###### PARAMETERS

* `transitionName` : string
