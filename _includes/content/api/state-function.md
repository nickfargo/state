## [state()](#state-function)

The **State** module is exported as a function named `state`. This is used either **(1)** to apply a working state implementation to any **owner** object; or **(2)** to define a **state expression** that declares the content for a [`State`](#state).

###### Syntax

{% highlight javascript %}
state( owner, expression )
state( expression )

state( owner, attributes, expression )
state( attributes, expression )
state( attributes )
{% endhighlight %}

###### Parameters

* [`owner`] : object
* [`attributes`] : string
* [`expression`] : ( object | `StateExpression` )

###### Returns

If an arbitrary `owner` object is provided, `state()` bestows `owner` with a new state implementation based on the supplied `expression` and [`attributes`](#state--attributes), and returns the owner’s initial `State`.

If no `owner` is provided, `state()` creates and returns a formal `StateExpression` based on the contents of `expression` and `attributes`.

###### Example

{% highlight javascript %}
{% include examples/api/state-function.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state-function.coffee %}
{% endhighlight %}

###### Discussion

When expressing a substate within a state expression, calling `state` with a lone object literal as `expression` evaluates identically to including just the object itself. It follows then that calling `state` with no arguments expresses an empty `StateExpression`, as would an empty object literal `{}` reference; however, the ideal way to express “empty state” is simply a reference to the `state` function, which is interpreted equivalently while avoiding the extra invocation and/or allocation.

###### See also

> [Getting started: The `state` function](/docs/#getting-started--the-state-function)
> [`state()`](/source/#state-function)


#### [state.bind](#state-function--bind)

Causes a function to be contextually bound to the `State` in which it acts.

###### Syntax

{% highlight javascript %}
state.bind( fn )
{% endhighlight %}

###### Parameters

* `fn` : function

###### Description

Wrapping a state method, event listener, etc. provides the means to reliably reference the **superstate** from within that function.

###### Returns

An object that boxes `fn`, marked with a `type` of `state-bound-function`.

###### Example

{% highlight javascript %}
{% include examples/api/state-function--bind.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state-function--bind.coffee %}
{% endhighlight %}

###### Discussion

Normally a state method or event listener will be invoked in the context of the **owner** object. However, certain patterns may require a function to have a static reference to the `State` for which it acts: for example, if a state method wishes to inherit more generic behavior from an implementation located higher in the state tree.

> Note that the expression `this.state().superstate` does not provide a lexical reference to the targeted superstate. Because the function may be inherited by a substate, the meaning of `this.state()` is dependent on the identity of the inheritor, and is therefore *dynamic* along the superstate axis.

To achieve this, the function must be wrapped in a call to `state.bind`, which boxes the function inside a specially typed object. Thenceforth whenever **State** needs to use this function, it will be recognized in its boxed form as **state-bound**, and then automatically unboxed and invoked in the context of the prevailing `State`.

The owner object, meanwhile, although no longer referenced directly as `this`, is still reliably available as `this.owner`.

If a state-bound method, event listener, etc. is inherited from a **protostate**, then the prevailing `State` will be the inheriting **epistate**. To capture a reference to the precise `State` in which a function is defined, it must be wrapped with `state.fix`.

###### See also

> [`state.fix`](#state-function--fix)


#### [state.fix](#state-function--fix)

Causes a function to be decorated with fixed bindings that indicate the precise `State` in which it is defined.

###### Syntax

{% highlight javascript %}
state.fix( combinator )
{% endhighlight %}

###### Parameters

* `combinator` : function :: ( `autostate`, [`protostate`] ) → ( `fn` : function )

###### Returns

An object that boxes `fn`, marked with a `type` of `state-fixed-function`.

###### Description

Wrapping a state method, event listener, etc. in `state.fix` provides the means to reliably reference the **protostate** from within that function.

###### Example

{% highlight javascript %}
{% include examples/api/state-function--fix.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state-function--fix.coffee %}
{% endhighlight %}

###### Discussion

For a function to reliably access either the `State` in which it is defined, or important related `State`s such as its protostate, the function must be **lexically bound** to its host `State` by enclosing it within a **decorator**, and wrapping this in a call to `state.fix`.

The decorator is provided as a function that defines parameters `autostate` and optionally `protostate`, and returns the function `fn` that is to be fixed. Calling `fix` then boxes the decorator inside a specially typed object. Thenceforth whenever **State** implements this function as a method, event listener, etc. for a `State`, it will recognize the object as a **state-fixed** function, which will be automatically unboxed and partially applied with the host `State` as `autostate`, and its immediate protostate as `protostate`.

The fixed, enclosed `fn` is thusly bestowed with full lexical awareness of the particular `State` environment in which it exists.

###### See also

> [`state.bind`](#state-function--bind)


#### [state.own](#state-function--own)

Ensures that, for a given `owner`, the `State` returned by a queried `selector` is both *real* and not an inherited protostate.

###### Syntax

{% highlight javascript %}
state.own( owner, selector, expr )
{% endhighlight %}

###### Parameters

* `owner` : object
* `selector` : string
* [`expr`] : object | `StateExpression`

###### Returns

Either the new real epistate, or `null` if `selector` does not identify a `State` that is heritable by `owner`.

###### Description

Causes the inherited protostate or virtual epistate identified by `selector` to be realized, if necessary, within the state tree of `owner`. If a realization does occur, the new epistate can be augmented by the optional `expr`.

###### Example

{% highlight javascript %}
{% include examples/api/state-function--own.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state-function--own.coffee %}
{% endhighlight %}

> 1. **Unexpected:** the `enter` event listener is added to state `A` of `p`, not `o`. The incipient instance `o` inherits its entire state tree from `p`, so `o.state('A')` is equal to `p.state('A')`.

> 2. Calling `state.own(o,'A')` instead of `o.state('A')` ensures that the returned `State` is **real** (not *virtual*) and that its `owner` is `o` (not a prototype). The event listener will be held in the state tree of `o`, as expected.

###### See also

> [Protostates and epistates](/docs/#concepts--inheritance--protostates-and-epistates)
> [Virtual epistates](/docs/#concepts--inheritance--virtual-epistates)


* * *
