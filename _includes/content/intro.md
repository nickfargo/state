**State.js** outfits JavaScript objects with a specific behavior model, powered by a [hierarchical](/docs/#concepts--inheritance--superstates-and-substates) and [prototypal](/docs/#concepts--inheritance--protostates) graph of [states](/docs/#concepts--states).

{% highlight javascript %}
{% include examples/index--intro.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--intro.coffee %}
{% endhighlight %}


[`State` instances](/api/#state) define behavior for an **owner** object. They have a distinct [object model](/docs/#concepts--inheritance), which allows them both to be [hierarchically nested](/docs/#concepts--inheritance--superstates-and-substates), and to [inherit from `State`s held by prototypes](/docs/#concepts--inheritance--protostates) of their owner.

{% highlight javascript %}
{% include examples/index--object-model.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--object-model.coffee %}
{% endhighlight %}


[Attributes](/docs/#concepts--attributes) concisely empower or constrain certain aspects of a [`State`](/api/#state), such as [mutability](/docs/#concepts--attributes--mutability), [abstraction](/docs/#concepts--attributes--abstraction), and [destination](/docs/#concepts--attributes--destination).

{% highlight javascript %}
{% include examples/index--attributes.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--attributes.coffee %}
{% endhighlight %}


[State methods](/docs/#concepts--methods) express or override behavior of the owner object. Methods are [contextually bound](/docs/#concepts--methods--context) to the [`State`](/api/#state) in which they are defined, and may optionally be decorated with [additional bindings](/docs/#concepts--methods--lexical-bindings) that describe the method’s complete [state–lexical environment](/blog/lexical-binding-in-state-methods).

{% highlight javascript %}
{% include examples/index--methods.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--methods.coffee %}
{% endhighlight %}


[Events](/docs/#concepts--events) relate the [progress of a transition](/docs/#concepts--events--transitional), and signal the [construction, destruction](/docs/#concepts--events--existential), or [mutation](/docs/#concepts--events--mutation) of a [`State`](/api/#state). They can also be emitted for any [custom event type](/docs/#concepts--events--custom).

{% highlight javascript %}
{% include examples/index--events.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--events.coffee %}
{% endhighlight %}


[`State`](/api/#state) instances are [immutable by default](/docs/#concepts--attributes--mutability), but may optionally be configured as [mutable](/api/#state--attributes--mutable), allowing modular pieces of behavior to be implemented dynamically into a state.

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


### [Articles](/blog/)

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
