## [state()](#state-function)

The **State** module is exported as a function named `state`. This is used either **(1)** to apply a working state implementation to any **owner** object; or **(2)** to define a **state expression** that declares the content for a [`State`](#state).

###### SYNTAX 1

{% highlight javascript %}
state( owner, attributes, expression )
state( owner, expression )
{% endhighlight %}

###### SYNTAX 2

{% highlight javascript %}
state( attributes, expression )
state( expression )
state( attributes )
{% endhighlight %}

###### PARAMETERS

* `owner`*<sub>opt</sub>* : object
* `attributes`*<sub>opt</sub>* : string
* `expression`*<sub>opt</sub>* : ( object | `StateExpression` )

###### RETURNS

1. If an arbitrary `owner` object is provided, `state()` bestows `owner` with a new state implementation based on the supplied `expression` and [`attributes`](#state--attributes), and returns the owner’s initial `State`.

2. If no `owner` is provided, `state()` creates and returns a formal `StateExpression` based on the contents of `expression` and `attributes`.

###### EXAMPLE

{% highlight javascript %}
{% include examples/api/state-function.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state-function.coffee %}
{% endhighlight %}

###### DISCUSSION

When expressing a substate within a state expression, calling `state` with a lone object literal as `expression` evaluates identically to including just the object itself. It follows then that calling `state` with no arguments expresses an empty `StateExpression`, as would an empty object literal `{}` reference; however, the ideal way to express “empty state” is simply a reference to the `state` function, which is interpreted equivalently while avoiding the extra invocation and/or allocation.

###### SEE ALSO

> [Getting started: The `state` function](/docs/#getting-started--the-state-function)
> [`state()`](/source/state-function.html)



### [Utility functions](#state-function--utility-functions)


#### [bind](#state-function--bind)

Causes a function to be contextually bound to the `State` in which it acts, providing the means to reliably reference the **superstate** from within that function.

###### SYNTAX

{% highlight javascript %}
state.bind( fn )
{% endhighlight %}

###### PARAMETERS

* `fn` : function

###### RETURNS

An object that boxes `fn`, marked with a `type` of `state-bound-function`.

###### EXAMPLE

{% highlight javascript %}
{% include examples/api/state-function--bind.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state-function--bind.coffee %}
{% endhighlight %}

###### DISCUSSION

Normally a state method or event listener will be invoked in the context of the **owner** object. However, certain patterns may require a function to have a static reference to the `State` for which it acts: for example, if a state method wishes to inherit more generic behavior from an implementation located higher in the state tree.

> Note that the expression `this.state().superstate` does not provide a lexical reference to the targeted superstate. Because the function may be inherited by a substate, the meaning of `this.state()` is dependent on the identity of the inheritor, and is therefore *dynamic* along the superstate axis.

To achieve this, the function must be wrapped in a call to `state.bind`, which boxes the function inside a specially typed object. Thenceforth whenever **State** needs to use this function, it will be recognized in its boxed form as **state-bound**, and then automatically unboxed and invoked in the context of the prevailing `State`.

The owner object, meanwhile, although no longer referenced directly as `this`, is still reliably available as `this.owner`.

If a state-bound method, event listener, etc. is inherited from a **protostate**, then the prevailing `State` will be the inheriting **epistate**. To capture a reference to the precise `State` in which a function is defined, it must be wrapped with `state.fix`.

###### SEE ALSO

> [Method context](/docs/#concepts--methods--context)
> [`state.fix`](#state-function--fix)


#### [fix](#state-function--fix)

Causes a function to be decorated with fixed bindings that indicate the precise `State` in which the function is defined. This provides a reliable means to reference the lexical **protostate** relative to that function’s definition.

###### SYNTAX

{% highlight javascript %}
state.fix( fn )
{% endhighlight %}

###### PARAMETERS

* `fn` : ( `autostate`, `protostate`*<sub>opt</sub>* ) → function

###### RETURNS

An object that boxes the decorated function returned by `fn`, marked with a `type` of `state-fixed-function`.

###### EXAMPLE

{% highlight javascript %}
{% include examples/api/state-function--fix.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state-function--fix.coffee %}
{% endhighlight %}

###### DISCUSSION

For a function to reliably access either the `State` in which it is defined, or important related `State`s such as its protostate, the function must be **lexically bound** to its host `State` by enclosing it within a **decorator**, and wrapping this in a call to `state.fix`.

The decorator is provided as a function that defines parameters `autostate` and optionally `protostate`, and returns the function `fn` that is to be fixed. Calling `fix` then boxes the decorator inside a specially typed object. Thenceforth whenever **State** implements this function as a method, event listener, etc. for a `State`, it will recognize the object as a **state-fixed** function, which will be automatically unboxed and partially applied with the host `State` as `autostate`, and its immediate protostate as `protostate`.

The fixed, enclosed `fn` is thusly bestowed with full lexical awareness of the particular `State` environment in which it exists.

###### SEE ALSO

> [Lexical bindings](/docs/#concepts--methods--lexical-bindings)
> [`state.bind`](#state-function--bind)


#### [own](#state-function--own)

Ensures that, for a given `owner`, the `State` returned by a queried `selector` is both *real* and not an inherited protostate.

###### SYNTAX

{% highlight javascript %}
state.own( owner, selector )
state.own( owner, selector, expr )
{% endhighlight %}

###### PARAMETERS

* `owner` : object
* `selector` : string
* `expr`*<sub>opt</sub>* : ( object | `StateExpression` )

###### RETURNS

Either the new real epistate, or `null` if `selector` does not identify a `State` that is heritable by `owner`.

###### DESCRIPTION

Causes the inherited protostate or virtual epistate identified by `selector` to be realized, if necessary, within the state tree of `owner`. If a realization does occur, the new epistate can be augmented by the optional `expr`.

###### EXAMPLE

{% highlight javascript %}
{% include examples/api/state-function--own.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state-function--own.coffee %}
{% endhighlight %}

> 1. **Unexpected:** the `enter` event listener is added to state `A` of `p`, not `o`. The incipient instance `o` inherits its entire state tree from `p`, so `o.state('A')` is equal to `p.state('A')`.

> 2. Calling `state.own(o,'A')` instead of `o.state('A')` ensures that the returned `State` is **real** (not *virtual*) and that its `owner` is `o` (not a prototype). The event listener will be held in the state tree of `o`, as expected.

###### SEE ALSO

> [Protostates and epistates](/docs/#concepts--object-model--protostates-and-epistates)
> [Virtual epistates](/docs/#concepts--object-model--virtual-epistates)


#### [extend](#state-function--extend)

Defines a **state expression** that declares one or more paths to **parastates** from which the expressed `State` will inherit.

###### SYNTAX

{% highlight javascript %}
state.extend( parastates )
state.extend( parastates, expression )
state.extend( parastates, attributes )
state.extend( parastates, attributes, expression )
{% endhighlight %}

###### PARAMETERS

* `parastates` : string — Comma separated list of selector paths to parastates.
* `attributes`*<sub>opt</sub>* : string
* `expression`*<sub>opt</sub>* : ( object | `StateExpression` )

###### RETURNS

A `StateExpression` with a corresponding `parastates` property.

###### EXAMPLE

{% highlight javascript %}
{% include examples/api/state-function--extend.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state-function--extend.coffee %}
{% endhighlight %}

###### SEE ALSO

> [Parastates and composition](/docs/#concepts--object-model--parastates-and-composition)


* * *
