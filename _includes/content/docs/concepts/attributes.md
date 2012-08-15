### [Attributes](#concepts--attributes)

State expressions may include a space-delimited set of **attributes**, provided as a single string argument that precedes the object map within a `state()` call.

{% highlight javascript %}
{% include examples/docs/attributes.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/attributes.coffee %}
{% endhighlight %}

> [Attributes](/api/#state--attributes)
> [`state/attributes`](/source/#state--attributes.js)
> [`State.privileged.attributes`](/source/#state--privileged--attributes)

<div class="local-toc"></div>

#### [Mutability attributes](#concepts--attributes--mutability)

By default, states are **weakly immutable** — their data, methods, guards, substates, and transitions cannot be altered once the state has been constructed — a condition that can be affected at construct-time by the mutability attributes `mutable`, `finite`, and `immutable`.

Each attribute is implicitly inherited from any of the state’s ancestors, be they superstates or protostates. They are listed in order of increasing precedence.

> [mutable](/api/#state--attributes--mutable)
> [finite](/api/#state--attributes--finite)
> [immutable](/api/#state--attributes--immutable)


#### [Abstraction attributes](#concepts--attributes--abstraction)

**State** does not confine currency to “leaf” states. All states, including substate-bearing interior states, are by default regarded as **concrete**, and thus may be targeted by a transition. Nevertheless, sometimes it may still be appropriate to author **abstract** states whose purpose is limited to serving as a common ancestor from which concrete descendant states will inherit. The abstraction attributes `abstract`, `concrete`, and `default` allow an implementor to control these restrictions.

Transitions that target an `abstract` state are redirected to its `default` substate. If no substate is marked `default`, the transition is redirected to the abstract state’s first substate. If the redirection target is itself `abstract`, the redirection recurses until a concrete descendant is found.

Each of the abstraction attributes is inherited from protostates, but not from superstates. States may override an inherited `abstract` attribute by applying the `concrete` attribute.

> [abstract](/api/#state--attributes--abstract)
> [concrete](/api/#state--attributes--concrete)
> [default](/api/#state--attributes--default)


#### [Destination attributes](#concepts--attributes--destination)

An object’s currency must often be initialized or confined to particular states, as directed by the destination attributes `initial`, `conclusive`, and `final`.

Each of the destination attributes are inherited from protostates, but not from superstates.

> [initial](/api/#state--attributes--initial)
> [conclusive](/api/#state--attributes--conclusive)
> [final](/api/#state--attributes--final)


#### [Idioms of certain attribute combinations](#concepts--attributes--idioms)

* **“finite mutable”** — A state that is, literally or by inheritance, both `finite` and `mutable` guarantees its hierarchical structure without imposing absolute immutability.

* **“abstract concrete”** is an invalid contradiction. If both attributes are literally applied to a state, `concrete` takes precedence and negates `abstract`.

<div class="backcrumb">
⏎  <a class="section" href="#concepts--attributes">Attributes</a>  &lt;  <a href="#concepts">Concepts</a>  &lt;  <a href="#overview">Overview</a>
</div>
