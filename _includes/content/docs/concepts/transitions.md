### [Transitions](#concepts--transitions)

Whenever an object’s current state changes, a **transition** state is created, which temporarily assumes the role of the current state while the object is travelling from its **origin** or **source** state to its **target** state.

<div class="local-toc"></div>

#### [Transition expressions](#concepts--transitions--expressions)

A state expression may include any number of **transition expressions**, which define some **action** to be performed, either synchronously or asynchronously, along with selectors for the `origin`/`source` and `target` states to which the transition should apply, and guards to determine the appropriate transition to employ.

Before an object undergoes a state change, it examines the transition expressions available for the given origin and target, and selects one to be enacted. To test each expression, its `origin` state is validated against its `admit` transition guards, and its `target` state is validated against its `release` transition guards. The object then instantiates a `Transition` based on the first valid transition expression it encounters, or, if no transition expression is available, a generic actionless `Transition`.

Where transition expressions should be situated in the state hierarchy is largely a matter of discretion. In determining the appropriate transition expression for a given origin–target pairing, the search proceeds, in order:

1. at the expression’s `target` state (compare to the manner in which CSS3 transitions are declared with respect to classes)
2. at the expression’s `origin` state
3. progressively up the superstate chain of `target`
4. progressively up the superstate chain of `origin`

Transitions can therefore be organized in a variety of ways, but ambiguity resolution is regular and predictable, as demonstrated with the `Zig` transition in the example below:

{% highlight javascript %}
{% include examples/docs/transitions--expressions.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/transitions--expressions.coffee %}
{% endhighlight %}

#### [The transition lifecycle](#concepts--transitions--lifecycle)

A transition performs a stepwise traversal over its **domain**, which is defined as the subtree rooted at the least common ancestor state between the transition’s `source` and `target`. At each step in the traversal, the transition instance acts as a temporary substate of the visited state.

The traversal sequence decomposes into an **ascending phase**, an **action phase**, and a **descending phase**.

1. During the ascending phase, the object emits a `depart` event on the `source`, and an `exit` event on any state that will be rendered inactive as a consequence of the transition.

2. The transition then reaches the domain root and moves into the action phase, whereupon it executes any `action` function defined in its associated transition expression. If an `action` does exist, then the transition remains in the action phase until its `end` method is called.

3. Once the transition has `end`ed, it then proceeds with the descending phase, emitting `enter` events on any state that is rendered newly active, and concluding with an `arrive` event on its `target` state.

{% highlight javascript %}
{% include examples/docs/transitions--lifecycle.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/transitions--lifecycle.coffee %}
{% endhighlight %}

###### See also

[**Transitional events**](#concepts--events--transitional)

#### [Aborted transitions](#concepts--transitions--aborted)

If a new transition is started while a transition is already in progress, an `abort` event is emitted on the previous transition. The new transition will reference the aborted transition as its `source`, retaining by reference the same `origin` state as that of the aborted transition, and the traversal will resume, starting with a `depart` and `exit` event emitted on the aborted transition. Further redirections of the pending traversal will continue to grow this `source` chain until a transition finally arrives at its `target` state.

###### See also

> [`Transition`](/source/transition.html)
> [`TransitionExpression`](/source/transition-expression.html)
> [`RootState::change`](/source/root-state.html#root-state--prototype--change)

<div class="backcrumb">
⏎  <a class="section" href="#concepts--transitions">Transitions</a>  &lt;  <a href="#concepts">Concepts</a>  &lt;  <a href="#overview">Overview</a>
</div>
