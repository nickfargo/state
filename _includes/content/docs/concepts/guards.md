### [Guards](#concepts--guards)

States and transitions can be outfitted with **guards** that dictate whether and how they may be used.

<div class="local-toc"></div>

#### [State guards](#concepts--guards--state-guards)

For a transition to be allowed to proceed, it must first have satisfied any guards imposed by the states that would be its endpoints: the *origin* state from which it will depart must agree to `release` the object’s currency to the intended *target* state at which it will arrive, and likewise the target must also agree to `admit` the object’s currency from the departed origin.

{% highlight javascript %}
{% include examples/docs/guards--state-guards.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/guards--state-guards.coffee %}
{% endhighlight %}

Here we observe state guards imposing the following restrictions:

* `object` initializes into state `A`, but upon leaving it may never return; we’ve also specifically disallowed direct transitions from `A` to `D`.

* State `B` disallows entry from anywhere (for now), and releases conditionally to `C` or `D` but not directly to any descendant states of `C`; we also note its data item `bleep`.

* State `C` imposes no guards, but we note its data item `blorp`.

* State `D` “unlocks” `B`; it is also guarded by checking the opposing state’s `data`, allowing admission only from states with a data item keyed `blorp`, and releasing only to states with data item `bleep`.

The result is that `object` is initially constrained to a progression from state `A` to `C` or its descendant states; exiting the `C` domain is initially only possible by transitioning to `D`; from `D` it can only transition back into `C`, however on this and subsequent visits to `C`, it has the option of transitioning to either `B` or `D`, while `B` insists on directly returning the object’s state only to one of its siblings `C` or `D`.

> [`RootState evaluateGuard`](/source/root-state.html#root-state--private--evaluate-guard)
> [`RootState::getTransitionExpressionFor`](/source/root-state.html#root-state--prototype--get-transition-expression-for)

#### [Transition guards](#concepts--guards--transition-guards)

Transition expressions may also include `admit` and `release` guards. Transition guards are used to decide which one transition amongst possibly several is to be executed as an object changes its state between a given `origin` and `target`.

{% highlight javascript %}
{% include examples/docs/guards--transition-guards.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/guards--transition-guards.coffee %}
{% endhighlight %}

> [`RootState evaluateGuard`](/source/root-state.html#root-state--private--evaluate-guard)
> [`RootState::getTransitionExpressionFor`](/source/root-state.html#root-state--prototype--get-transition-expression-for)

<div class="backcrumb">
⏎  <a class="section" href="#concepts--guards">Guards</a>  &lt;  <a href="#concepts">Concepts</a>  &lt;  <a href="#overview">Overview</a>
</div>
