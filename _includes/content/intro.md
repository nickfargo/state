**State** is a framework for implementing [prototypal](/docs/#concepts--inheritance--protostates) and [hierarchical](/docs/#concepts--inheritance--superstates-and-substates) state–driven [behavior](/docs/#concepts--methods) into any JavaScript object.

{% highlight javascript %}
{% include examples/index--intro.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--intro.coffee %}
{% endhighlight %}


[States](/api/#state) have an [inheritance model](/docs/#concepts--inheritance) that allows them both to be [hierarchically nested](/docs/#concepts--inheritance--superstates-and-substates), and to [inherit from states held by their owner’s prototypes](/docs/#concepts--inheritance--protostates).

{% highlight javascript %}
{% include examples/index--object-model.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--object-model.coffee %}
{% endhighlight %}


[Attributes](/docs/#concepts--attributes) can constrain and empower states in useful ways.

{% highlight javascript %}
{% include examples/index--attributes.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--attributes.coffee %}
{% endhighlight %}


[Method overrides](/docs/#concepts--methods) express behavior on behalf of a state’s owner object. State methods are [lexically bound to the state](/docs/#concepts--methods--context) in which they are defined.

{% highlight javascript %}
{% include examples/index--methods.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--methods.coffee %}
{% endhighlight %}


[Events](/docs/#concepts--events) relate the [progress of a transition](/docs/#concepts--events--transitional), and signal the [construction, destruction](/docs/#concepts--events--existential), or [mutation](/docs/#concepts--events--mutation) of a [`State`](/api/#state) instance. They can also be emitted for any [custom event type](/docs/#concepts--events--custom).

{% highlight javascript %}
{% include examples/index--events.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--events.coffee %}
{% endhighlight %}


Instances of [`State`](/api/#state) are [immutable by default](/docs/#concepts--attributes--mutability), but may optionally be configured as [mutable](/api/#state--attributes--mutable), allowing modular pieces of behavior to be implemented dynamically into a state.

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
