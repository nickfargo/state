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

Calling `state` with no arguments returns an empty `StateExpression`. Similarly, within an `expression`, a reference to `state` (rather than an invocation) indicates the expression of an empty state.

{% highlight javascript %}
{% include examples/api/module.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/module.coffee %}
{% endhighlight %}

> [Getting started: The `state` function](/docs/#getting-started--the-state-function)
> [`state()`](/source/#module)

* * *
