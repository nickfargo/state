**State** is a framework for implementing [state-driven behavior](/docs/#concepts--methods) directly into JavaScript objects.

{% highlight javascript %}
{% include examples/intro.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/intro.coffee %}
{% endhighlight %}

[States](/api/#state) have a rich [object model](/docs/#concepts--inheritance) that allows them both to be [deeply nested and heritable](/docs/#concepts--inheritance--superstates-and-substates), and to [inherit from states held by prototypes](/docs/#concepts--inheritance--protostates) of the object to which they belong. States [emit events](/docs/#concepts--events), are configurable with simple [attribute keywords](/docs/#concepts--attributes), and can be authored to express [polymorphic behavior](/docs/#concepts--methods--context).

[Transitions](/api/#transition) between states can be [conditionally guarded](/docs/#concepts--guards), [synchronous or asynchronous](/docs/#concepts--transitions--lifecycle), and defined [generically across multiple states](/docs/#concepts--transitions--expressions).

### [Documentation](/docs/)

> [Installation](/docs/#installation)
> [Getting started](/docs/#getting-started)
> [Overview](/docs/#overview)
> [Concepts](/docs/#concepts)

### [API](/api/)

> [`State`](/api/#state)
> [`Transition`](/api/#transition)

### [Annotated source](/source/)
