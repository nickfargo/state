### [Methods](#state--methods)


#### [realize](#state--methods--realize)

Transforms `this` [virtual state](/docs/#concepts--inheritance--virtual-epistates) into a “real” state that can bear content of its own.

###### Syntax

{% highlight javascript %}
this.realize()
{% endhighlight %}

###### Returns

`this`

###### Examples

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

###### See also

> [Protostates and epistates](/docs/#concepts--inheritance--protostates-and-epistates)
> [Virtual epistates](/docs/#concepts--inheritance--virtual-epistates)
> [`State realize`](/source/#state--private--realize)
> [`State.prototype.realize`](/source/#state--prototype--realize)


#### [destroy](#state--methods--destroy)

Attempts to cleanly destroy `this` state and all of its descendant states.

###### Syntax

{% highlight javascript %}
this.destroy()
{% endhighlight %}

###### Returns

`true` if `this` state is successfully destroyed, or `false` otherwise.

###### Notes

A `destroy` event is issued by each state as it is destroyed.

If the root state is destroyed, the owner is given back any methods it bore prior to its state implementation.

###### See also

> [`State.prototype.destroy`](/source/#state--prototype--destroy)


#### [express](#state--methods--express)

Produces an object containing an expression of the contents of `this` state, such as would be sufficient to create a new `State` structurally identical to `this`.

###### Syntax

{% highlight javascript %}
this.express( typed )
{% endhighlight %}

###### Parameters

* [`typed = false`] : boolean

###### Returns

The generated plain-object, or equivalent `StateExpression` if `typed` is `true`.

###### Example

{% highlight javascript %}
{% include examples/api/state/methods--express.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--express.coffee %}
{% endhighlight %}

###### See also

> [Expressions](/docs/#concepts--expressions)
> [`State.prototype.express`](/source/#state--prototype--express)


#### [mutate](#state--methods--mutate)

Transactionally mutates `this` state by adding, updating, or removing items as implied by the contents of `expression`.

###### Syntax

{% highlight javascript %}
this.mutate( expression )
{% endhighlight %}

###### Parameters

* `expression` : ( `StateExpression` | object )

###### Returns

`this`

###### Notes

Property removal is indicated with a value equal to the unique `O.NIL` reference.

If the transaction causes a mutation, `this` emits a [`mutate` event](#state--events--mutate).

###### Example

{% highlight javascript %}
{% include examples/api/state/methods--mutate.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--mutate.coffee %}
{% endhighlight %}

###### See also

> [Mutation events](/docs/#concepts--events--mutation)
> [`State.prototype.mutate`](/source/#state--prototype--mutate)
> [`State::mutate`](/source/#state--prototype--mutate)


#### [derivation](#state--methods--derivation)

Describes the superstate chain of `this` as an array.

###### Syntax

{% highlight javascript %}
this.derivation( byName )
{% endhighlight %}

###### Parameters

* [`byName = false`] : boolean

###### Returns

An `Array` containing each `State` from the root state to `this` state, starting with the immediate substate from the root.

If `byName` is `true`, the returned `Array` contains the string names of each state, rather than the `State`s themselves.

###### Example

{% highlight javascript %}
{% include examples/api/state/methods--derivation.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--derivation.coffee %}
{% endhighlight %}

###### See also

> [`State::derivation`](/source/#state--prototype--derivation)


#### [path](#state--methods--path)

Describes the superstate chain of `this` as a dot-delimited string.

###### Syntax

{% highlight javascript %}
this.path()
{% endhighlight %}

###### Returns

A string that matches the absolute selector referencing `this` state.

###### Example

{% highlight javascript %}
{% include examples/api/state/methods--path.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--path.coffee %}
{% endhighlight %}

###### See also

> [`State::path`](/source/#state--prototype--path)


#### [depth](#state--methods--depth)

Quantifies the height of the superstate chain of `this`.

###### Syntax

{% highlight javascript %}
this.depth()
{% endhighlight %}

###### Returns

The number of superstates separating `this` state from its root state.

###### Example

{% highlight javascript %}
{% include examples/api/state/methods--depth.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--depth.coffee %}
{% endhighlight %}

###### See also

> [`State::depth`](/source/#state--prototype--depth)


#### [common](#state--methods--common)

Establishes the hierarchical relation between `this` and another `State`.

###### Syntax

{% highlight javascript %}
this.common( other )
{% endhighlight %}

###### Parameters

* `other` : ( `State` | string )

###### Returns

The `State` that is the nearest common ancestor of both `this` state and the provided `other` state.

###### Example

{% highlight javascript %}
{% include examples/api/state/methods--common.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--common.coffee %}
{% endhighlight %}

###### See also

> [`State::common`](/source/#state--prototype--common)


#### [is](#state--methods--is)

Asserts identity.

###### Syntax

{% highlight javascript %}
this.is( other )
{% endhighlight %}

###### Parameters

* `other` : ( `State` | string )

###### Returns

A boolean indicating whether `this` state is the provided `other` state.

###### Example

{% highlight javascript %}
{% include examples/api/state/methods--is.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--is.coffee %}
{% endhighlight %}

###### See also

> [`State::is`](/source/#state--prototype--is)


#### [isIn](#state--methods--is-in)

Asserts descendant familiarity.

###### Syntax

{% highlight javascript %}
this.isIn( other )
{% endhighlight %}

###### Parameters

* `other` : ( `State` | string )

###### Returns

A boolean indicating whether `this` state is or is a substate of the provided `other` state.

###### Example

{% highlight javascript %}
{% include examples/api/state/methods--is-in.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--is-in.coffee %}
{% endhighlight %}

###### See also

> [`State::isIn`](/source/#state--prototype--is-in)


#### [hasSubstate](#state--methods--has-substate)

Asserts ancestral familiarity.

###### Syntax

{% highlight javascript %}
this.hasSubstate( other )
{% endhighlight %}

###### Parameters

* `other` : ( `State` | string )

###### Returns

A boolean indicating whether `this` state is or is a superstate of the provided `other` state.

###### Example

{% highlight javascript %}
{% include examples/api/state/methods--has-substate.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--has-substate.coffee %}
{% endhighlight %}

###### See also

> [`State::hasSubstate`](/source/#state--prototype--has-substate)


#### [isSuperstateOf](#state--methods--is-superstate-of)

Asserts hierarchical ancestry.

###### Syntax

{% highlight javascript %}
this.isSuperstateOf( other )
{% endhighlight %}

###### Parameters

* `other` : ( `State` | string )

###### Returns

A boolean indicating whether `this` state is a superstate of the provided `other` state.

###### Example

{% highlight javascript %}
{% include examples/api/state/methods--is-superstate-of.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--is-superstate-of.coffee %}
{% endhighlight %}

###### See also

> [**superstate**](#state--superstate)

> [`State::isSuperstateOf`](/source/#state--prototype--is-superstate-of)


#### [protostate](#state--methods--protostate)

Identifies the `State` analogous to `this` owned by a prototype of the `owner`.

###### Syntax

{% highlight javascript %}
this.protostate()
{% endhighlight %}

###### Returns

The **protostate** of `this`: that `State` which both has a derivation `path` identical to the `path` of `this`, and whose `owner` is the nearest possible prototype of the `owner` of `this`.

Returns `undefined` if no protostate exists anywhere in the owner’s prototype chain.

###### Example

{% highlight javascript %}
{% include examples/api/state/methods--protostate.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--protostate.coffee %}
{% endhighlight %}

###### See also

> [Protostates](/docs/#concepts--inheritance--protostates-and-epistates)
> [`State::protostate`](/source/#state--prototype--protostate)


#### [isProtostateOf](#state--methods--is-protostate-of)

Asserts prototypal ancestry.

###### Syntax

{% highlight javascript %}
this.isProtostateOf( other )
{% endhighlight %}

###### Parameters

* `other` : ( `State` | string )

###### Returns

A boolean indicating whether `this` state is a **protostate** of the provided `other` state.

###### Example

{% highlight javascript %}
{% include examples/api/state/methods--is-protostate-of.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--is-protostate-of.coffee %}
{% endhighlight %}

###### See also

> [**protostate**](#state--protostate)

> [Protostates](/docs/#concepts--inheritance--protostates-and-epistates)
> [`State::isProtostateOf`](/source/#state--prototype--is-prototstate-of)


#### [defaultSubstate](#state--methods--default-substate)

Resolves the proper concretion for an abstract state.

###### Syntax

{% highlight javascript %}
this.defaultSubstate( via )
{% endhighlight %}

###### Parameters

* [`via = VIA_PROTO`] : number

###### Returns

The `State` that is `this` state’s first substate bearing the `default` attribute, or just the first substate if none are found.

###### Example

{% highlight javascript %}
{% include examples/api/state/methods--default-substate.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--default-substate.coffee %}
{% endhighlight %}

> 1. `Moving` is explicitly marked `default`.

> 2. Since `Moving`, which is itself abstract, has no descendant states marked `default`, its first substate `Walking` serves as its default state.

> 3. A transition targeting the root state will fall through to `Walking`, since both the root and its default state `Moving` are abstract.

###### See also

> [`State::defaultSubstate`](/source/#state--prototype--default-substate)


#### [initialSubstate](#state--methods--initial-substate)

###### Syntax

{% highlight javascript %}
this.initialSubstate()
{% endhighlight %}

###### Returns

The `State` that is `this` state’s most deeply nested state bearing the `initial` attribute, by way of its greatest `initial` descendant state.

###### See also

> [`State::initialSubstate`](/source/#state--prototype--initial-substate)


#### [query](#state--methods--query)

Matches a `selector` string with the state or states it represents in the context of `this` state.

###### Aliases

**match**

###### Syntax

{% highlight javascript %}
this.query( selector, against, descend, ascend, via )
{% endhighlight %}

###### Parameters

* `selector` : string
* [`against`] : `State`
* [`via = VIA_ALL`] : number

The `via` parameter is a bit-field integer comprised of one or more of the `TRAVERSAL_FLAGS` constants: [`VIA_SUB`, `VIA_SUPER`, `VIA_PROTO`].

By default `via` is `VIA_ALL` (`~0`), which implies each of the flags’ bits are set, and consequently that the `query` operation will be recursed over the substates, superstates, and protostates, in order, of `this`. Providing a `via` argument that zeroes any of the `VIA_SUB`, `VIA_SUPER`, or `VIA_PROTO` bits will disable recursion through the substates, superstates, or protostates, respectively, of `this`.

###### Returns

The nearest matching `State`, or if a non-specific `selector` is provided, an `Array` containing the set of matched states. If a state to be tested `against` is provided, then a boolean is returned, indicating whether `against` is the matched state itself or is included in the matching set.

###### Notes

Calling an owner object’s accessor method with a selector string invokes `query` on the owner’s current state.

###### See also

> [Getting started](/docs/#getting-started)
> [Selectors](/docs/#concepts--selectors)
> [`State::query`](/source/#state--prototype--query)


#### [$](#state--methods--dollarsign)

Convenience method that mimics the behavior of the owner’s accessor method.

###### Syntax

{% highlight javascript %}
this.$( selector )
{% endhighlight %}

###### Parameters

* `selector` : string

###### Returns

If the first argument is a transition arrow selector string, the call is aliased to [`change`](#state--methods--change). If passed a plain selector string, the call is aliased to [`query`](#state--methods--query).

###### Examples

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

###### Syntax

{% highlight javascript %}
this.current()
{% endhighlight %}

###### Returns

`State`.


#### [isCurrent](#state--methods--is-current)

Indicates whether `this` state is the owner’s current state.

###### Syntax

{% highlight javascript %}
this.isCurrent()
{% endhighlight %}

###### Returns

Boolean.


#### [isActive](#state--methods--is-active)

Indicates whether `this` state or one of its substates is the owner’s current state.

###### Syntax

{% highlight javascript %}
this.isActive()
{% endhighlight %}

###### Returns

Boolean.


#### [change](#state--methods--change)

Attempts to execute a state transition.

###### Aliases

**go**, **be**

###### Syntax

{% highlight javascript %}
this.change( target, options )
{% endhighlight %}

###### Parameters

* `target` : ( `State` | string )
* [`options`] : object

The `target` parameter may be either a `State` object within the purview of this controller, or a string that resolves to a likewise targetable `State` when evaluated from the context of the most recently current state.

The `options` parameter is an optional map that may include:

* `args` : `Array` — arguments to be passed to a transition’s `action` function.
* `success` : function — callback to be executed upon successful completion of the transition.
* `failure` : function — callback to be executed if the transition attempt is blocked by a guard.

###### Discussion

Handles asynchronous transitions, generation of appropriate events, and construction of any necessary temporary virtual states. Respects guards supplied in both the origin and `target` states.


#### [isVirtual](#state--methods--is-virtual)

Indicates whether `this` state bears the `virtual` attribute.

###### Syntax

{% highlight javascript %}
this.isVirtual()
{% endhighlight %}

###### Returns

Boolean.

###### Discussion

A **virtual state** is a lightweight inheritor of a **protostate** located higher in the owner object’s prototype chain. Notably, as virtual states are created automatically, no modifier keyword exists for the `virtual` attribute.

###### Example

{% highlight javascript %}
{% include examples/api/state/methods--is-virtual.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--is-virtual.coffee %}
{% endhighlight %}

> 1. The `mover` instance, which inherits its stateful implementation from `Mover.prototype`, does not have a real `Stationary` state of its own, so a virtual `Stationary` state is created automatically and adopted as `mover`’s initial state.

> 2. Root states are never virtualized. Even an object that inherits all statefulness from its prototypes is given a real root state.

###### See also

> [Protostates](/docs/#concepts--inheritance--protostates-and-epistates)


#### [isMutable](#state--methods--is-mutable)

Indicates whether `this` state bears the `mutable` attribute.

###### Syntax

{% highlight javascript %}
this.isMutable()
{% endhighlight %}

###### Returns

Boolean.

###### Discussion

By default, states are **weakly immutable**; i.e., once a `State` has been constructed, its declared data, methods, guards, substates, and transitions cannot be altered. By including the `mutable` attribute in the state’s expression, this restriction is lifted. Mutability is also inherited from any of a state’s superstates or protostates.

###### See also

> [`mutable`](#state--attributes--mutable)


#### [isFinite](#state--methods--is-finite)

Indicates whether `this` state bears the `finite` attribute.

###### Syntax

{% highlight javascript %}
this.isFinite()
{% endhighlight %}

###### Returns

Boolean.

###### Discussion

If a state is declared `finite`, no substates or descendant states may be added, nor may any be removed without also destroying the state itself.

###### See also

> [`finite`](#state--attributes--finite)


#### [isImmutable](#state--methods--is-immutable)

Indicates whether `this` state bears the `immutable` attribute.

###### Syntax

{% highlight javascript %}
this.isImmutable()
{% endhighlight %}

###### Returns

Boolean.

###### Discussion

A literal or inherited `immutable` attribute causes a state to become **strongly immutable**, wherein it guarantees immutability absolutely, throughout all inheriting states. The `immutable` attribute also implies `finite`, and contradicts and overrides any literal or inherited `mutable` attribute.

###### See also

> [`immutable`](#state--attributes--immutable)


#### [isAbstract](#state--methods--is-abstract)

Indicates whether `this` state is `abstract`.

###### Syntax

{% highlight javascript %}
this.isAbstract()
{% endhighlight %}

###### Returns

Boolean.

###### Discussion

An `abstract` state is used only as a source of inheritance, and cannot itself be current. A transition that directly targets an abstract state will be automatically redirected to one of its substates.

###### See also

> [`abstract`](#state--attributes--abstract)


#### [isConcrete](#state--methods--is-concrete)

Indicates whether `this` state is `concrete`.

###### Syntax

{% highlight javascript %}
this.isConcrete()
{% endhighlight %}

###### Returns

Boolean.

###### Discussion

All non-abstract states are concrete. Marking a state with the `concrete` attribute in a state expression will override any `abstract` attribute, particularly such as would otherwise be inherited from a protostate.

###### See also

> [`concrete`](#state--attributes--concrete)


#### [isDefault](#state--methods--is-default)

Indicates whether `this` state bears the `default` attribute.

###### Syntax

{% highlight javascript %}
this.isDefault()
{% endhighlight %}

###### Returns

Boolean.

###### Discussion

Marking a state `default` designates it as the specific redirection target for any transition that targets its abstract superstate.

###### See also

> [`default`](#state--attributes--default),
> [`defaultSubstate`](#state--methods--default-substate)


#### [isInitial](#state--methods--is-initial)

Indicates whether `this` state bears the `initial` attribute.

###### Syntax

{% highlight javascript %}
this.isInitial()
{% endhighlight %}

###### Returns

Boolean.

###### Discussion

Marking a state `initial` specifies which state a newly stateful object should assume.

Objects inheriting from a stateful prototype will have their initial state set to the prototype’s current state.

###### See also

> [`initial`](#state--attributes--initial),
> [`initialSubstate`](#state--methods--initial-substate)


#### [isConclusive](#state--methods--is-conclusive)

Indicates whether `this` state bears the `conclusive` attribute.

###### Syntax

{% highlight javascript %}
this.isConclusive()
{% endhighlight %}

###### Returns

Boolean.

###### Discussion

Once a state marked `conclusive` is entered, it cannot be exited, although transitions may still freely traverse within its substates.

###### See also

> [`conclusive`](#state--attributes--conclusive)


#### [isFinal](#state--methods--is-final)

Indicates whether `this` state bears the `final` attribute.

###### Syntax

{% highlight javascript %}
this.isFinal()
{% endhighlight %}

###### Returns

Boolean.

###### Discussion

Once a state marked `final` is entered, no further outbound transitions within its local region are allowed.

###### See also

> [`final`](#state--attributes--final)


#### [data (read)](#state--methods--data--read)

Reads a composite of the `data` assigned to `this` state.

###### Syntax

{% highlight javascript %}
this.data( via )
{% endhighlight %}

###### Parameters

* [`via = VIA_ALL`] : number

###### Returns

An object clone of the data attached to `this` state, including any data inherited from protostates and superstates, unless specified otherwise by zeroing the `VIA_SUPER` and `VIA_PROTO` bits of `via`.

###### See also

> [`State.prototype.data`](/source/#state--prototype--data)


#### [data (write)](#state--methods--data--write)

Adds, updates, and/or removes `data` properties on `this` state.

###### Syntax

{% highlight javascript %}
this.data( edit )
{% endhighlight %}

###### Parameters

* `edit` : object

###### Returns

`this`.

###### Notes

For any keys in `edit` whose values are set to the `O.NIL` directive, the matching properties are deleted from `this` state’s data.

If the operation results in a change to `this` state’s data, a `mutate` event is emitted.

###### See also

> [`State.prototype.data`](/source/#state--prototype--data)


#### [has](#state--methods--has)

Determines whether a `data` property with the given `key` exists on `this` state, or is inherited from a protostate or superstate.

###### Syntax

{% highlight javascript %}
this.has( key, via )
{% endhighlight %}

###### Parameters

* `key` : string
* [`via = VIA_ALL`] : number

###### Notes

Supports `long.key` lookups for deeply nested properties.

###### See also

> [`State.prototype.has`](/source/#state--prototype--has)


#### [get](#state--methods--get)

Reads a `data` item on `this` state.

###### Syntax

{% highlight javascript %}
this.get( key, via )
{% endhighlight %}

###### Parameters

* `key` : string
* [`via = VIA_ALL`] : number

###### Returns

The value of the `data` property with the given `key` on `this` state, or one inherited from the nearest protostate, or the nearest superstate.

###### Notes

Supports `long.key` lookups for deeply nested properties. Returns `undefined` if `key` cannot be resolved.

> [`State.prototype.get`](/source/#state--prototype--get)


#### [let](#state--methods--let)

Writes a `data` item on `this` state.

###### Syntax

{% highlight javascript %}
this.let( key, value )
{% endhighlight %}

###### Parameters

* `key` : string
* `value` : var

###### Returns

If successful, the assigned `value`.

###### Notes

Creates a new data property or updates an existing data property on `this` state.

Succeeds only if `this` state is `mutable`.

Supports `long.key` assignments to deeply nested properties.

###### See also

> [`State.prototype.let`](/source/#state--prototype--let)


#### [set](#state--methods--set)

Writes or updates an existing `data` item on either `this` state or a superstate.

###### Syntax

{% highlight javascript %}
this.set( key, value )
{% endhighlight %}

###### Parameters

* `key` : string
* `value` : var

###### Returns

The assigned `value`.

###### Discussion

If the property is inherited from a `mutable` superstate, then the property is updated in place, equivalent to calling `let` on that superstate. If the data property does not yet exist in the superstate chain, it is created on `this`. Properties inherited from protostates are not affected.

###### Notes

Supports `long.key` assignments to deeply nested properties.

###### See also

> [`State.prototype.set`](/source/#state--prototype--set)


#### [delete](#state--methods--delete)

Deletes an existing `data` property on `this` state.

###### Syntax

{% highlight javascript %}
this.delete( key )
{% endhighlight %}

###### Parameters

* `key` : string

###### Returns

Boolean `true` if the deletion was successful or unnecessary, or `false` otherwise, in the same manner as the native `delete` operator.

###### Notes

Supports `long.key` lookups for deeply nested properties.

###### See also

> [`State.prototype.delete`](/source/#state--prototype--delete)


#### [method](#state--methods--method)

###### Syntax

{% highlight javascript %}
this.method( methodName, via, out )
{% endhighlight %}

###### Parameters

* `methodName` : string
* [`via = VIA_ALL`] : number
* [`out`] : object

###### Returns

The function that is the method held on `this` state whose name is `methodName`.

###### Discussion

If the named method does not exist on `this` state, then it will be inherited, in order, first from protostates of `this` (if the `VIA_PROTO` bit of `via` is set), and if no such method exists there, then from superstates of `this` (if the `VIA_SUPER` bit of `via` is set).

If an `out` object is supplied, then the returned `function` is attached to `out.method`, and the `State` context to which the method will be bound when invoked with `this.apply` or `this.call` is attached to `out.context`.

###### See also

> [`State.prototype.method`](/source/#state--prototype--method)


#### [methodNames](#state--methods--method-names)

###### Syntax

{% highlight javascript %}
this.methodNames()
{% endhighlight %}

###### Returns

An `Array` of names of methods defined locally on `this` state.

###### See also

> [`State.prototype.methodNames`](/source/#state--prototype--method-names)


#### [addMethod](#state--methods--add-method)

Adds `fn` as a method named `methodName` to `this` state, which will be callable directly from the owner, but with its context bound to `this`.

###### Syntax

{% highlight javascript %}
this.addMethod( methodName, fn )
{% endhighlight %}

###### Parameters

* `methodName` : string
* `fn` : function

###### Returns

`fn`.

###### See also

> [`State.prototype.addMethod`](/source/#state--prototype--add-method)


#### [removeMethod](#state--methods--remove-method)

Dissociates the method named `methodName` from `this` state and returns its function.

###### Syntax

{% highlight javascript %}
this.removeMethod( methodName )
{% endhighlight %}

###### Parameters

* `methodName` : string

###### See also

> [`State.prototype.removeMethod`](/source/#state--prototype--remove-method)


#### [hasMethod](#state--methods--has-method)

Indicates whether `this` state possesses or inherits a method named `methodName`.

###### Syntax

{% highlight javascript %}
this.hasMethod( methodName )
{% endhighlight %}

###### Parameters

* `methodName` : string

###### Returns

Boolean.

###### See also

> [`State::hasMethod`](/source/#state--prototype--has-method)


#### [hasOwnMethod](#state--methods--has-own-method)

Indicates whether `this` state directly possesses a method named `methodName`.

###### Syntax

{% highlight javascript %}
this.hasOwnMethod( methodName )
{% endhighlight %}

###### Parameters

* `methodName` : string

###### Returns

Boolean.

###### See also

> [`State::hasOwnMethod`](/source/#state--prototype--has-own-method)


#### [apply](#state--methods--apply)

Invokes a state method, passing an array of arguments.

###### Syntax

{% highlight javascript %}
this.apply( methodName, args )
{% endhighlight %}

###### Parameters

* `methodName` : string
* [`args`] : `Array`

###### Returns

The value returned by the invocation of the named method, or `undefined` if no such method can be invoked.

###### Discussion

If the state method named by `methodName` exists locally or can be inherited via protostate or superstate, that function is applied with the provided `args` in the appropriate context, and its result is returned.

By default the context will be the [owner](#state--properties--owner). If the method was defined using [state.bind](#state-function--bind), the context will be either the precise `State` in which the method is defined, or if the method is inherited from a protostate, the corresponding epistate belonging to the inheriting owner.

If the named method does not exist and cannot be inherited, a `noSuchMethod` event is emitted and the call returns `undefined`.

###### See also

> [`State::apply`](/source/#state--prototype--apply)


#### [call](#state--methods--call)

Invokes a state method, with varidic arguments.

###### Syntax

{% highlight javascript %}
this.call( methodName, args... )
{% endhighlight %}

###### Parameters

* `methodName` : string
* [`args...`] : *individual arguments*

The variadic companion to `apply`.

###### See also

> [`State::call`](/source/#state--prototype--call)


#### [event](#state--methods--event)

###### Syntax

{% highlight javascript %}
this.event( eventType, id )
{% endhighlight %}

###### Parameters

* `eventType` : string
* [`id`] : ( string | number | function )

###### Returns

A registered event listener function, or the number of listeners registered, for a given `eventType`.

If an `id` as returned by [`addEvent`](#state--add-event) is provided, the event listener associated with that `id` is returned. If no `id` is provided, the number of event listeners registered to `eventType` is returned.

###### See also

> [`State.prototype.event`](/source/#state--prototype--event)


#### [addEvent](#state--methods--add-event)

Binds an event listener `fn` to the specified `eventType`.

###### Aliases

**on**, **bind**

###### Syntax

{% highlight javascript %}
this.addEvent( eventType, fn, context )
{% endhighlight %}

###### Parameters

* `eventType` : string
* `fn` : function
* [`context = this`] : object

###### Returns

A unique identifier for the listener.

###### See also

> [`State.prototype.addEvent`](/source/#state--prototype--add-event)


#### [removeEvent](#state--methods--remove-event)

Unbinds the event listener with the specified `id` that was supplied by `addEvent`.

###### Aliases

**off**, **unbind**

###### Syntax

{% highlight javascript %}
this.removeEvent( eventType, id )
{% endhighlight %}

###### Parameters

* `eventType` : string
* [`id`] : ( string | number | function )

###### See also

> [`State.prototype.removeEvent`](/source/#state--prototype--remove-event)


#### [emit](#state--methods--emit)

Invokes all listeners bound to the given `eventType`.

###### Aliases

**trigger**

###### Syntax

{% highlight javascript %}
this.emit( eventType, args, context, via )
{% endhighlight %}

###### Parameters

* `eventType` : string
* [`args = []`] : `Array`
* [`context = this`] : object
* [`via = VIA_ALL`] : number

Arguments for the listeners can be passed as an array to the `args` parameter.

###### Notes

Listeners are invoked in the context of `this` state, or as specified by `context`.

Listeners bound to superstates and protostates of `this` are also invoked, unless otherwise directed by zeroing the `VIA_SUPER` or `VIA_PROTO` bits of `via`.

###### See also

> [`State.prototype.emit`](/source/#state--prototype--emit)


#### [guard](#state--methods--guard)

Describes the guards in effect for `this` state.

###### Syntax

{% highlight javascript %}
this.guard( guardType )
{% endhighlight %}

###### Parameters

* `guardType` : string

###### Returns

An object containing the guard predicates and/or expressions for the specified `guardType` held on `this` state.

###### Discussion

A **guard** is a map of functions or values that will be evaluated as either a predicate or boolean expression, respectively, to provide a determination of whether the owner’s currency will be admitted into or released from the state to which the guard is applied.

Valid `guardType`s include `admit` and `release`.

###### Notes

Guards are inherited from protostates, but not from superstates.

###### See also

> [`State.prototype.guard`](/source/#state--prototype--guard)


#### [addGuard](#state--methods--add-guard)

Adds a guard to `this` state, or augments an existing guard with additional entries.

###### Syntax

{% highlight javascript %}
this.addGuard( guardType, guard )
{% endhighlight %}

###### Parameters

* `guardType` : string
* `guard` : object

###### See also

> [`State.prototype.addGuard`](/source/#state--prototype--add-guard)


#### [removeGuard](#state--methods--remove-guard)

Removes a guard from `this` state, or removes specific entries from an existing guard.

###### Syntax

{% highlight javascript %}
this.removeGuard( guardType, keys )
{% endhighlight %}

###### Parameters

* `guardType` : string
* [`keys`] : ( `Array` | string )

###### See also

> [`State.prototype.removeGuard`](/source/#state--prototype--remove-guard)


#### [substate](#state--methods--substate)

Identifies a named substate of `this`.

###### Syntax

{% highlight javascript %}
this.substate( stateName, via )
{% endhighlight %}

###### Parameters

* `stateName` : string
* [`via = VIA_PROTO`] : boolean

###### Returns

The substate of `this` state named `stateName`. If no such substate exists locally within `this`, and the `VIA_PROTO` bit of `via` is set, then the nearest identically named substate held on a protostate will be returned.

###### See also

> [`State.prototype.substate`](/source/#state--prototype--substate)


#### [substates](#state--methods--substates)

Generates a collection of substates of `this`.

###### Syntax

{% highlight javascript %}
this.substates( deep, virtual )
{% endhighlight %}

###### Parameters

* [`deep = false`] : boolean
* [`virtual = false`] : boolean

###### Returns

An `Array` of `this` state’s substates.

###### Notes

If `deep` is `true`, the returned array is a depth-first flattened list of all of this state’s descendant states.

If `virtual` is `true`, the returned array may include any active virtual states held by an owner object that is inheriting currency from a prototype.

###### See also

> [`State.prototype.substates`](/source/#state--prototype--substates)


#### [addSubstate](#state--methods--add-substate)

Creates a `State` based on the provided `stateExpression`, adds it as a substate of `this` state.

###### Syntax

{% highlight javascript %}
this.addSubstate( stateName, stateExpression )
{% endhighlight %}

###### Parameters

* `stateName` : string
* `stateExpression` : ( `StateExpression` | object | `State` )

###### Returns

The new `State`.

###### Notes

If a substate with the same `stateName` already exists, it is first destroyed and then replaced.

###### See also

> [`State.prototype.addSubstate`](/source/#state--prototype--add-substate)


#### [removeSubstate](#state--methods--remove-substate)

Removes the substate named by `stateName` from `this` state, if possible.

###### Syntax

{% highlight javascript %}
this.removeSubstate( stateName )
{% endhighlight %}

###### Parameters

* `stateName` : string

###### Returns

The removed `State`.

###### Notes

If the owner object is in the midst of a transition involving the state targeted for removal, then the removal will fail, returning `false`.

###### See also

> [`State.prototype.removeSubstate`](/source/#state--prototype--remove-substate)


#### [transition](#state--methods--transition)

###### Syntax

{% highlight javascript %}
this.transition( transitionName )
{% endhighlight %}

###### Parameters

* `transitionName` : string

###### Returns

The transition expression named by `transitionName` registered to `this` state.


#### [transitions](#state--methods--transitions)

###### Syntax

{% highlight javascript %}
this.transitions()
{% endhighlight %}

###### Returns

An object containing all of the transition expressions registered to `this` state.


#### [addTransition](#state--methods--add-transition)

Registers a transition expression to `this` state.

###### Syntax

{% highlight javascript %}
this.addTransition( transitionName, transitionExpression )
{% endhighlight %}

###### Parameters

* `transitionName` : string
* `transitionExpression` : ( `TransitionExpression` | object )


#### [removeTransition](#state--methods--remove-transition)

Removes a registered transition expression from `this` state.

###### Syntax

{% highlight javascript %}
this.removeTransition( transitionName )
{% endhighlight %}

###### Parameters

* `transitionName` : string
