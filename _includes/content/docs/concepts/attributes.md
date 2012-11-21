### [Attributes](#concepts--attributes)

State expressions may include a space-delimited set of **attributes**, provided as a single string argument that precedes the object map within a `state()` call.

{% highlight javascript %}
{% include examples/docs/attributes.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/attributes.coffee %}
{% endhighlight %}

An expression’s attributes modify any `State` instance constructed from the expression, so as to enable certain features or impose useful constraints on the state.

> [Attributes](/api/#state--attributes)
> [`state/attributes`](/source/#state--attributes.js)
> [`State.privileged.attributes`](/source/#state--privileged--attributes)

<div class="local-toc"></div>

#### [Mutability attributes](#concepts--attributes--mutability)

> [mutable](/api/#state--attributes--mutable)
> [finite](/api/#state--attributes--finite)
> [immutable](/api/#state--attributes--immutable)

By default, states are **weakly immutable** — their data, methods, guards, substates, and transitions cannot be altered once the state has been constructed — a condition that can be affected at construct-time by the mutability attributes `mutable`, `finite`, and `immutable`, listed here in order of increasing precedence.

Declaring a state `mutable` allows it and any states that inherit from it to be modified after it is constructed. This can be partially restricted by declaring `finite`, which disallows addition or removal of substates. Mutability can be ultimately restricted by declaring a state `immutable`, which disallows modification absolutely, for all inheritors.

Each of the mutability attributes is implicitly inherited from any of the state’s ancestors, be they superstates or protostates.


#### [Abstraction attributes](#concepts--attributes--abstraction)

> [abstract](/api/#state--attributes--abstract)
> [concrete](/api/#state--attributes--concrete)
> [default](/api/#state--attributes--default)

**State** does not confine currency to “leaf” states. All states, including substate-bearing interior states, are **concrete** by default, and thus may be targeted by a transition. Nevertheless, sometimes it may still be appropriate to author **abstract** states whose purpose is limited to serving as a common ancestor from which concrete descendant states will inherit. The abstraction attributes `abstract`, `concrete`, and `default` control these restrictions.

Transitions that target an `abstract` state are redirected to its `default` substate. If no substate is marked `default`, the transition is redirected to the abstract state’s first substate. If the redirection target is itself `abstract`, the redirection recurses until a concrete descendant is found.

Each of the abstraction attributes is inherited from protostates, but not from superstates. States may override an `abstract` attribute by applying the `concrete` attribute.


#### [Destination attributes](#concepts--attributes--destination)

> [initial](/api/#state--attributes--initial)
> [conclusive](/api/#state--attributes--conclusive)
> [final](/api/#state--attributes--final)

An object’s currency must often be initialized or confined to particular states, as directed by the destination attributes `initial`, `conclusive`, and `final`.

The `conclusive` attribute traps an object’s currency; once a conclusive state is entered, it cannot be exited, though transitions that take place entirely within the conclusive state may proceed. Similarly, once an object arrives at a `final` state, no further transitions are allowed.

Each of the destination attributes are inherited from protostates, but not from superstates.



<div class="backcrumb">
⏎  <a class="section" href="#concepts--attributes">Attributes</a>  &lt;  <a href="#concepts">Concepts</a>  &lt;  <a href="#overview">Overview</a>
</div>
