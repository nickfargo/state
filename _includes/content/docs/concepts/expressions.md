### [Expressions](#concepts--expressions)

A **state expression** encapsulates the contents of a `State`. The exported `state()` function returns a `StateExpression` when provided with a plain object map, optionally preceded by a string of whitespace-delimited attributes to be applied to the expressed state.

The contents of a state expression decompose into six **categories**: `data`, `methods`, `events`, `guards`, `states`, and `transitions`. The object map supplied to the `state()` call can be structured accordingly, or alternatively it may be pared down to a more convenient shorthand, either of which will be interpreted into a formal `StateExpression`.

> [express](/api/#state--methods--express)
> [`state()`](/source/#module)
> [`StateExpression`](/source/#state-expression)

<div class="local-toc"></div>

#### [Structured state expressions](#concepts--expressions--structured)

Building upon the introductory example above, we could write a state expression that consists of states, methods, and events, looking something like this:

{% highlight javascript %}
{% include examples/docs/expressions--structured.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/expressions--structured.coffee %}
{% endhighlight %}

#### [Shorthand](#concepts--expressions--shorthand)

Explicit categorization is unambiguous, but it can be verbose, so `state()` also accepts a more concise expression format, which is interpreted into a `StateExpression` identical to that of the example above:

{% highlight javascript %}
{% include examples/docs/expressions--shorthand.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/expressions--shorthand.coffee %}
{% endhighlight %}

#### [Interpreting expression input](#concepts--expressions--interpreting-expression-input)

Expression input provided to `state()` is interpreted according to the following rules:

1. If an entry’s value is a typed `StateExpression` or `TransitionExpression`, interpret it as-is, using the entry’s key as its name, or, if the entry’s value is the exported `state` module itself, interpret it as an empty state whose name is the entry’s key.

2. Otherwise, if an entry’s key is a [category](#concepts--expressions) name, and its value is either an object or `null`, then it will be interpreted as it would in the long-form structured format.

3. Otherwise, if an entry’s key matches a [built-in event type](#concepts--events) or if its value is a string, then interpret the value as either an event listener function, an array of event listeners, or a [named transition target](#concepts--events--expressing-determinism) to be bound to that event type.

4. Otherwise, if an entry’s key matches a [guard action](#concepts--guards) (i.e., `admit`, `release`), interpret the value as a guard condition (or array of guard conditions).

5. Otherwise, if an entry’s value is an object, interpret it as a [substate](#concepts--inheritance--nesting-states) whose name is the entry’s key, or if the entry’s value is a function, interpret it as a [method](#concepts--methods) whose name is the entry’s key.

> [`StateExpression interpret`](/source/#state-expression--private--interpret)

<div class="backcrumb">
⏎  <a class="section" href="#concepts--expressions">Expressions</a>  &lt;  <a href="#concepts">Concepts</a>  &lt;  <a href="#overview">Overview</a>
</div>
