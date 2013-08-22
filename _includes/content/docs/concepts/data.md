### [Data](#concepts--data)

Arbitrary **data** can be attached to a state, and inherited accordingly through protostates and superstates. Data properties are declared within a state expression under the `data` category. Properties can be read using the [`get`](/api/#state--methods--get) method. For `mutable` states, properties can be added and written to using [`let`](/api/#state--methods--let) and [`set`](/api/#state--methods--set), and removed with [`delete`](/api/#state--methods--delete). Data can also be manipulated transactionally with the [`data`](/api/#state--methods--data) method.

{% highlight javascript %}
{% include examples/docs/data.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/data.coffee %}
{% endhighlight %}

> [data](/api/#state--methods--data)
> [has](/api/#state--methods--has)
> [get](/api/#state--methods--get)
> [let](/api/#state--methods--let)
> [set](/api/#state--methods--set)
> [delete](/api/#state--methods--delete)

> [`State::data`](/source/state.html#state--prototype--data)

<div class="backcrumb">
⏎  <a class="section" href="#concepts--data">Data</a>  &lt;  <a href="#concepts">Concepts</a>  &lt;  <a href="#overview">Overview</a>
</div>
