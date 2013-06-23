## [state()](#state-function)

###### SYNOPSIS

The **State** module is exported as a function named `state`. This can be used either to build a **state expression** that declares the content for a [`State`](#state), or to apply a state expression to an object to give the object a working state implementation.

###### SYNTAX

{% highlight javascript %}
state( owner, attributes, expression )
{% endhighlight %}

###### PARAMETERS

* [`owner`] : object
* [`attributes`] : string
* [`expression`] : ( object | `StateExpression` )

###### RETURNS

If an arbitrary `owner` object is provided, `state()` bestows `owner` with a new state implementation based on the supplied `expression` and [`attributes`](#state--attributes), and returns the owner’s initial `State`.

If no `owner` is provided, `state()` creates and returns a formal `StateExpression` based on the contents of `expression` and `attributes`.

Calling `state` with no arguments returns an empty `StateExpression`. Similarly, within an `expression`, a reference to `state` (rather than an invocation) implies the expression of an empty state as well.

###### EXAMPLE

{% highlight javascript %}
{% include examples/api/state-function.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state-function.coffee %}
{% endhighlight %}

###### SEE ALSO

> [Getting started: The `state` function](/docs/#getting-started--the-state-function)
> [`state()`](/source/#state-function)


### [state.bind](#state-function--bind)

###### SYNOPSIS

Causes a function to be contextually bound to the `State` in which it acts. This provides the means to reliably reference the **superstate** within a state method, event listener, etc.

###### SYNTAX

{% highlight javascript %}
state.bind( fn )
{% endhighlight %}

###### PARAMETERS

* `fn` : function

###### RETURNS

An object that boxes `fn`, marked with a `type` of `state-bound-function`.

###### DISCUSSION

Normally a state method or event listener will be invoked in the context of the **owner** object. However, certain patterns may require a function to have a static reference to the `State` for which it acts: for example, if a state method wishes to inherit more generic behavior from an implementation located higher in the state tree.

> Note how the expression `this.state().superstate` does not reliably reference a precise superstate: because the function may be inherited by a substate, the meaning of `this.state()` is *dynamic*.

To achieve this, the function must be wrapped in a call to `state.bind`, which boxes the function inside a special object. Thenceforth whenever **State** needs to use this function, it will be recognized as **state-bound**, and then automatically unboxed and invoked in the context of the prevailing `State`.

If a state-bound method, event listener, etc. is inherited from a **protostate**, then the prevailing `State` will be the inheriting **epistate**. To capture a reference to the precise `State` in which a function is defined, it must be wrapped with `state.fix`.

> Within a state-bound function, the owner object, while no longer referenced directly as `this`, is still reliably available as `this.owner`.

###### SEE ALSO

[`state.fix`](#state-function--fix)


### [state.fix](#state-function--fix)

###### SYNOPSIS

Causes a function to be decorated with fixed bindings to the precise `State` in which it is defined. This provides the means to reliably reference the **protostate** within a state method, event listener, etc.

###### SYNTAX

{% highlight javascript %}
state.fix( combinator )
{% endhighlight %}

###### PARAMETERS

* `combinator` : function :: ( `autostate`, [`protostate`] ) → ( `fn` : function )

###### RETURNS

An object that boxes `fn`, marked with a `type` of `state-fixed-function`.

###### DISCUSSION

For a function to reliably access either the `State` in which it is defined, or important related `State`s such as its protostate, the function must be **lexically bound** to its host `State` by enclosing it within a **decorator**, and wrapping this in a call to `state.fix`.

The decorator is provided as a `combinator` function that defines parameters `autostate` and optionally `protostate`, and returns the function `fn` that is to be fixed. Calling `fix` then boxes the decorator inside a special object. Thenceforth whenever **State** implements this function as a method, event listener, etc. for a `State`, it will recognize the object as a **state-fixed** function, upon which it will be automatically unboxed and partially applied with the host `State` as `autostate`, and its immediate protostate as `protostate`.

The fixed, enclosed `fn` is thusly bestowed with full lexical awareness of the particular `State` environment in which it exists.

###### EXAMPLE

{% highlight javascript %}
{% include examples/api/state-function--fix.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state-function--fix.coffee %}
{% endhighlight %}

> 1. The `plain` function would throw a `ReferenceError` if invoked: references to `question` and `answer` from the closure scope and `param` in the local scope are valid, but `autostate`, etc. do not exist.

> 2. The `lexical` method is the transformation of `plain` in the state–lexical environment of state `A` of `Class.prototype`. All of the state-related references from the body of `plain` are now valid.

###### SEE ALSO

[`state.bind`](#state-function--bind)



* * *
