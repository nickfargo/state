## [state()](#state-function)

{% highlight javascript %}
state( owner, attributes, expression )
{% endhighlight %}

* [`owner`] : object
* [`attributes`] : string
* [`expression`] : ( object | `StateExpression` )

The **State** module is exported as a function named `state`. This can be used either:

  0. to apply a working state implementation to any **owner** object; or

  0. to define a **state expression** that declares the content for a [`State`](#state).

If an arbitrary `owner` object is provided, `state()` bestows `owner` with a new state implementation based on the supplied `expression` and [`attributes`](#state--attributes), and returns the owner’s initial `State`.

If no `owner` is provided, `state()` creates and returns a formal `StateExpression` based on the contents of `expression` and `attributes`.

Calling `state` with no arguments returns an empty `StateExpression`. Similarly, within an `expression`, a reference to `state` (rather than an invocation) implies the expression of an empty state as well.

{% highlight javascript %}
{% include examples/api/state-function.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state-function.coffee %}
{% endhighlight %}

###### See also

> [Getting started: The `state` function](/docs/#getting-started--the-state-function)
> [`state()`](/source/#state-function)


#### [state.bind](#state-function--bind)

{% highlight javascript %}
state.bind( fn )
{% endhighlight %}

* `fn` : function

Causes a function to be contextually bound to the `State` in which it acts. This provides the means to reliably reference the **superstate** within a state method, event listener, etc.

Returns an object that boxes `fn`, marked with a `type` of `state-bound-function`.

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

{% highlight javascript %}
state.fix( combinator )
{% endhighlight %}

* `combinator` : function :: ( `autostate`, [`protostate`] ) → ( `fn` : function )

Causes a function to be decorated with fixed bindings to the precise `State` in which it is defined. This provides the means to reliably reference the **protostate** within a state method, event listener, etc.

Returns an object that boxes `fn`, marked with a `type` of `state-fixed-function`.

{% highlight javascript %}
{% include examples/api/state-function--fix.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state-function--fix.coffee %}
{% endhighlight %}

###### Discussion

For a function to reliably access either the `State` in which it is defined, or important related `State`s such as its protostate, the function must be **lexically bound** to its host `State` by enclosing it within a **decorator**, and wrapping this in a call to `state.fix`.

The decorator is provided as a `combinator` function that defines parameters `autostate` and optionally `protostate`, and returns the function `fn` that is to be fixed. Calling `fix` then boxes the decorator inside a specially typed object. Thenceforth whenever **State** implements this function as a method, event listener, etc. for a `State`, it will recognize the object as a **state-fixed** function, which will be automatically unboxed and partially applied with the host `State` as `autostate`, and its immediate protostate as `protostate`.

The fixed, enclosed `fn` is thusly bestowed with full lexical awareness of the particular `State` environment in which it exists.

###### See also

> [`state.bind`](#state-function--bind)



* * *
