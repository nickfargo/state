### [Selectors](#concepts--selectors)

If called with no arguments, the accessor method of a stateful object (`object.state`) returns the object’s current state. If a **selector** string argument is provided, the accessor will query the object’s state tree and return a matching `State`.

**State** uses a simple selector format:

1. State names are delimited from their member substates with the dot (`.`) character.

2. A selector that begins with `.` will be evaluated *relative* to the local context, while a selector that begins with a name will be evaluated as *absolute*, i.e., relative to the root state.

3. A fully-qualified name is not necessary except for disambiguation: `'A.B.C'` and `'C'` will both resolve to the deep substate named `C` provided that there is no other state named `C` located higher in the state tree.

4. Special cases: empty-string `''` references the root state; single-dot `.` references the local context state; double-dot `..` references its immediate superstate, etc.

5. Querying a selector ending in `*` returns an array of the immediate substates of that level, while `**` returns a flattened array of all descendant substates of that level.

{% highlight javascript %}
{% include examples/docs/selectors.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/selectors.coffee %}
{% endhighlight %}

Selectors are similarly put to use elsewhere as well: for example, a [transition](#concepts--transitions)’s `origin` and `target` properties are evaluated as selectors, and several `State` methods, including `change`, `is`, `isIn`, `has`, `isSuperstateOf`, and `isProtostateOf`, accept a selector as their main argument.

> [query](/api/#state--methods--query)
> [$](/api/#state--methods--dollarsign)
> [`State::query`](/source/#state--prototype--query)

> [change](/api/#state--methods--change)
> [is](/api/#state--methods--is)
> [isIn](/api/#state--methods--is)
> [has](/api/#state--methods--is-in)
> [isSuperstateOf](/api/#state--methods--is-superstate-of)
> [isProtostateOf](/api/#state--methods--is-protostate-of)

<div class="backcrumb">
⏎  <a class="section" href="#concepts--selectors">Selectors</a>  &lt;  <a href="#concepts">Concepts</a>  &lt;  <a href="#overview">Overview</a>
</div>
