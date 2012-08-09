**State** is a framework for implementing [state-driven behavior](/docs/#concepts--methods) directly into JavaScript objects.

{% highlight javascript %}
{% include examples/intro.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/intro.coffee %}
{% endhighlight %}

States have a rich [object model](/docs/#concepts--inheritance) that allows them to be [deeply nested and heritable](/docs/#concepts--inheritance--superstates-and-substates), and also to [inherit from the prototypes](/docs/#concepts--inheritance--protostates) of the object to which they belong. States [emit events](/docs/#concepts--events), they can be modified with simple [attribute keywords](/docs/#concepts--attributes), and authored to express [polymorphic behavior](/docs/#concepts--methods--context).

Transitions between states can be [conditionally guarded](/docs/#concepts--guards), [synchronous or asynchronous](/docs/#concepts--transitions--lifecycle), and defined [generically across multiple states](/docs/#concepts--transitions--expressions).

### [Documentation](/docs/)

> [Installation](/docs/#installation)
> [Getting started](/docs/#getting-started)
> [Overview](/docs/#overview)
> [Concepts](/docs/#concepts)

### [API](/api/)

> [`State`](/api/#state)
> [`Transition`](/api/#transition)

### [Annotated source](/source/)
