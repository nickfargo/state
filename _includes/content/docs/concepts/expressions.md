### [Expressions](#concepts--expressions)

`State` instances are defined declaratively using the **state expression** data structure.

A formal `StateExpression` is created by calling the [`state()`](#getting-started--the-state-function) function with no `owner` argument, providing it only a plain object map for its `expression` argument, optionally preceded by a string of whitespace-delimited `attributes` to be encoded into the returned `StateExpression`.

Internally, the contents of a state expression are shaped according to a set of **categories**: `data`, `methods`, `events`, `guards`, `states` (substates), and `transitions`, along with the encoded `attributes`. The object map supplied to the `state()` call can be structured according to these categories, or it may be pared down to a more convenient shorthand, which, by making certain type inferences, the `state()` call will interpret into a formal `StateExpression`.

> [express](/api/#state--methods--express)
> [`state()`](/source/state-function.html)
> [`StateExpression`](/source/state-expression.html)

<div class="local-toc"></div>

#### [Structured state expressions](#concepts--expressions--structured)

Building upon the introductory example, we could write a state expression that consists of explicitly categorized members (substates, methods, events, etc.), looking something like this:

{% highlight javascript %}
{% include examples/docs/expressions--structured.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/expressions--structured.coffee %}
{% endhighlight %}

#### [Shorthand](#concepts--expressions--shorthand)

Explicitly categorizing the defined members is unambiguous, but it can be verbose, so `state()` also accepts a more concise expression format, which is interpreted into a `StateExpression` that is materially identical to the result of the example above:

{% highlight javascript %}
{% include examples/docs/expressions--shorthand.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/expressions--shorthand.coffee %}
{% endhighlight %}

In this example, the `state()` invocation interpreted the input by:

* recognizing the absence of any items whose keys are category names, and instead inferring that object literals `Formal` and `Casual` describe *states*.

* identifying `enter` as a built-in *event type*, and thus treating the associated function values as listeners for `enter` events that will be emitted by the containing state.

* inferring that functions keyed `greet`, which is not a built-in event type, were to be treated as a *method* of the containing state.

Explicit definition can also be mixed freely with shorthand in the same expression input, so as to resolve ambiguities in certain edge cases (for example, to create a state named `data`, or a method named `enter`).

#### [Interpreting expression input](#concepts--expressions--interpreting-expression-input)

Expression input provided to `state()` is interpreted according to the following type inference rules:

1. If an entry’s value is a typed `StateExpression` or `TransitionExpression`, interpret it as-is, using the entry’s key as its name, or, if the entry’s value is the exported `state` function itself, interpret it as an empty state whose name is the entry’s key.

2. Otherwise, if an entry’s key is a [category](#concepts--expressions) name, and its value is either an object or `null`, then it will be interpreted as it would in the long-form structured format.

3. Otherwise, if an entry’s key matches a [built-in event type](#concepts--events) or if its value is a string, then interpret the value as either an event listener function, an array of event listeners, or a [named transition target](#concepts--events--expressing-determinism) to be bound to that event type.

4. Otherwise, if an entry’s key matches a [guard action](#concepts--guards) (i.e., `admit`, `release`), interpret the value as a guard condition (or array of guard conditions).

5. Otherwise, if an entry’s value is an object, interpret it as a [substate](#concepts--object-model--nesting-states) whose name is the entry’s key, or if the entry’s value is a function, interpret it as a [method](#concepts--methods) whose name is the entry’s key.

> [`StateExpression interpret`](/source/state-expression.html#state-expression--private--interpret)

<div class="backcrumb">
⏎  <a class="section" href="#concepts--expressions">Expressions</a>  &lt;  <a href="#concepts">Concepts</a>  &lt;  <a href="#overview">Overview</a>
</div>
