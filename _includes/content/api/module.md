## [state()](#module)

The **State** module is exported as a function named `state`. This can be used either to build a **state expression** that declares the content for a [`State`](#state), or to apply a state expression to an object to give the object a working state implementation.

{% highlight javascript %}
state( owner, attributes, expression )
{% endhighlight %}

* [`owner`] : object
* [`attributes`] : string
* [`expression`] : ( object | `StateExpression` )

If an arbitrary `owner` object is provided, `state()` bestows `owner` with a new state implementation based on the supplied `expression` and [`attributes`](#state--attributes), and returns the owner’s initial `State`.

If no `owner` is provided, `state()` creates and returns a formal `StateExpression` based on the contents of `expression` and `attributes`.

Calling `state` with no arguments returns an empty `StateExpression`. Similarly, within an `expression`, a reference to `state` (rather than an invocation) implies the expression of an empty state as well.

{% highlight javascript %}
{% include examples/api/module.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/module.coffee %}
{% endhighlight %}

> [Getting started: The `state` function](/docs/#getting-started--the-state-function)
> [`state()`](/source/#module)


### [state.method](#module--method)

Facilitates the declaration of a **lexical state method**, a function bound to the lexical environment of a particular `State`. This is generally used to populate the `methods` category of a [state expression](/docs/#concepts--expressions).

{% highlight javascript %}
state.method( bindings, fn )
{% endhighlight %}

* [`bindings`] : object
* [`fn`] : function

Returns a factory function that will be called internally during the construction of a `State` instance. The method it produces is a transformation of the provided `fn`, closed over any provided `bindings`, along with additional bindings for a set of special variables:

* `autostate` : The precise `State` that contains the method. If the method is inherited via protostate, then `autostate` is a protostate of `this`; otherwise, `autostate === this`.
* `protostate` : The protostate of `autostate`.
* `superstate` : The superstate of `this`.
* `owner` : The owner of `this`.

If no `fn` is provided, then a function partially applied with `bindings` is returned, which accepts a `fn` and returns the factory.



{% highlight javascript %}
{% include examples/api/module--method.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/module--method.coffee %}
{% endhighlight %}

> 1. The `plain` function would throw a `ReferenceError` if invoked: references to `question` and `answer` from the closure scope and `param` in the local scope are valid, but `autostate`, etc. do not exist.

> 2. The `lexical` method is the transformation of `plain` in the state–lexical environment of state `A` of `Class.prototype`. All of the state-related references from the body of `plain` are now valid.

> [`state.method`](/source/#module--method)

* * *
