## [`state()`](#module)

{% highlight javascript %}
{% include examples/api/module.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/module.coffee %}
{% endhighlight %}

The `state` **module** is exported as a function. This is used either:

1. To create and return a formal [`StateExpression`](#state-expression), or

2. To bestow an arbitrary `owner` object with a new implementation of state based on the supplied `expression`, and return the owner’s initial [`State`](#state).

> [Getting started: The `state` function](/docs/#getting-started--the-state-function)