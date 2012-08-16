**State** is a framework for implementing [state-driven behavior](/docs/#concepts--methods) into arbitrary JavaScript objects.

{% highlight javascript %}
{% include examples/intro.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/intro.coffee %}
{% endhighlight %}

[States](/api/#state) have a rich [object model](/docs/#concepts--inheritance) that allows them to be [nested and heritable](/docs/#concepts--inheritance--superstates-and-substates), and they also [inherit from states held by prototypes](/docs/#concepts--inheritance--protostates) of the object to which they belong.

States [emit events](/docs/#concepts--events), are configurable with simple [attribute keywords](/docs/#concepts--attributes), and can bear [method overrides](/docs/#concepts--methods) that express [polymorphic behavior](/docs/#concepts--methods--context).

[Transitions](/api/#transition) between states can be [conditionally guarded](/docs/#concepts--guards), [synchronous or asynchronous](/docs/#concepts--transitions--lifecycle), and defined [generically across multiple states](/docs/#concepts--transitions--expressions).

### [Documentation](/docs/)

> [Installation](/docs/#installation)
> [Getting started](/docs/#getting-started)
> [Overview](/docs/#overview)
> [Concepts](/docs/#concepts)

### [API](/api/)

> [`state()`](/api/#module)
> [`State`](/api/#state)
> [`Transition`](/api/#transition)

### [Annotated source](/source/)

### [Unit tests](/tests/)

### [View on GitHub](http://github.com/nickfargo/state)
