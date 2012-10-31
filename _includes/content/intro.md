**State** is a framework for implementing [prototypal](/docs/#concepts--inheritance--protostates) and [hierarchical](/docs/#concepts--inheritance--superstates-and-substates) state–driven [behavior](/docs/#concepts--methods) into any JavaScript object.

{% highlight javascript %}
{% include examples/index--intro.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--intro.coffee %}
{% endhighlight %}


[States](/api/#state) have an [inheritance model](/docs/#concepts--inheritance) that allows them to be [hierarchically nested](/docs/#concepts--inheritance--superstates-and-substates), and to [inherit from states held by prototypes](/docs/#concepts--inheritance--protostates) of the object to which they belong.

{% highlight javascript %}
{% include examples/index--object-model.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--object-model.coffee %}
{% endhighlight %}


States are configurable with simple [attribute keywords](/docs/#concepts--attributes), and they express behavior on behalf of their owner object with [method overrides](/docs/#concepts--methods) that are [lexically bound to the state](/docs/#concepts--methods--context) in which the method is defined.

{% highlight javascript %}
{% include examples/index--attributes-methods.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--attributes-methods.coffee %}
{% endhighlight %}


[Events](/docs/#concepts--events) relate the [progress of a transition](/docs/#concepts--events--transitional), and signal the [construction, destruction](/docs/#concepts--events--existential), or [mutation](/docs/#concepts--events--mutation) of a [`State`](/api/#state) instance. They can also be emitted for any [custom event type](/docs/#concepts--events--custom).

{% highlight javascript %}
{% include examples/index--events.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--events.coffee %}
{% endhighlight %}


Instances of [`State`](/api/#state) are [immutable by default](/docs/#concepts--attributes--mutability), but may optionally be configured as [mutable](/api/#state--attributes--mutable), allowing predefined behaviors to be altered later.

{% highlight javascript %}
{% include examples/index--mutability.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--mutability.coffee %}
{% endhighlight %}


[Transitions](/api/#transition) between states can be [conditionally guarded](/docs/#concepts--guards), defined [generically across multiple states](/docs/#concepts--transitions--expressions), and either [synchronous or asynchronous](/docs/#concepts--transitions--lifecycle).

{% highlight javascript %}
{% include examples/index--transitions.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--transitions.coffee %}
{% endhighlight %}


* * *


### [Documentation](/docs/)

> [Installation](/docs/#installation)
> [Getting started](/docs/#getting-started)
> [Overview](/docs/#overview)
> [Concepts](/docs/#concepts)

### [API reference](/api/)

> [`state()`](/api/#module)
> [`State`](/api/#state)
> [`Transition`](/api/#transition)

### [Annotated source](/source/)

### [Unit tests](/tests/)

### [View on GitHub](http://github.com/nickfargo/state)
