## [state()](#module)

The **State** module is exported as a function named `state`.

{% highlight javascript %}
state( owner, attributes, expression )
{% endhighlight %}

* [`owner`] : object
* [`attributes`] : string
* `expression` : ( object | `StateExpression` )

If an arbitrary `owner` object is provided, calling `state()` bestows `owner` with a new state implementation based on the supplied `expression` and `attributes`, and returns the owner’s initial [`State`](#state).

If no `owner` is provided, calling `state()` creates and returns a formal [`StateExpression`](#state-expression) based on the contents of `expression` and `attributes`.

Within an `expression`, a reference to `state`, rather than an invocation, indicates the presence of an empty state.

{% highlight javascript %}
{% include examples/api/module.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/module.coffee %}
{% endhighlight %}

> [Getting started: The `state` function](/docs/#getting-started--the-state-function)
> [`state()`](/source/#module)

* * *
