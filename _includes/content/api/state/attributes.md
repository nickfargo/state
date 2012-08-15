### [Attributes](#state--attributes)

State attributes are added to a state expression by preceding the `expression` argument of a call to [`state()`](#module) with a space-delimited string argument that names the attributes to be applied.

{% highlight javascript %}
{% include examples/docs/attributes.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/attributes.coffee %}
{% endhighlight %}

> [Attributes](/docs/#concepts--attributes)


#### [mutable](#state--attributes--mutable)

By default, states are **weakly immutable** — their data, methods, guards, substates, and transitions cannot be altered once the state has been constructed. Applying the `mutable` attribute lifts the restriction of immutability, exposing instance methods such as [`mutate`](#state--methods--mutate), [`addMethod`](#state--methods--add-method), [`addSubstate`](#state--methods--add-substate), etc., which can be used to alter the contents of the state.

The `mutable` attribute is inherited from both superstates and protostates, unless any also bear the [`immutable`](#state--attributes--immutable) attribute.

{% highlight javascript %}
{% include examples/api/state/attributes--mutable.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/attributes--mutable.coffee %}
{% endhighlight %}

{% include captions/api/state/attributes--mutable.md %}

> See also: 
> [`isMutable`](#state--methods--is-mutable),
> [`mutate` (method)](#state--methods--mutate),
> [`mutate` (event)](#state--events--mutate)

> [Mutability attributes](/docs/#concepts--attributes--mutability)


#### [finite](#state--attributes--finite)

Declaring a state `finite` guarantees its hierarchical structure by hiding its `addSubstate` and `removeSubstate` methods after the state has been constructed.

The `finite` attribute is inherited from both superstates and protostates, and is imposed with higher precedence than [`mutable`](#state--attributes--mutable).

{% highlight javascript %}
{% include examples/api/state/attributes--finite.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/attributes--finite.coffee %}
{% endhighlight %}

{% include captions/api/state/attributes--finite.md %}

> See also:
> [`isFinite`](#state--methods--is-finite)

> [Mutability attributes](/docs/#concepts--attributes--mutability)


#### [immutable](#state--attributes--immutable)

Adding `immutable` makes a state **strongly immutable**, whereupon immutability is permanent and absolute: `immutable` contradicts and overrules `mutable`, and implies `finite`, irrespective of whether any of the attributes are literal or inherited.

The `immutable` attribute is inherited from both superstates and protostates, and has top precedence over [`mutable`](#state--attributes--mutable) and [`finite`](#state--attributes--finite).

An inheriting owner object may still extend the state implementation of its prototype with states that are new or extend protostates, but any of these that inherit from an `immutable` state will also bear the `immutable` attribute themselves.

{% highlight javascript %}
{% include examples/api/state/attributes--immutable.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/attributes--immutable.coffee %}
{% endhighlight %}

{% include captions/api/state/attributes--immutable.md %}

> See also:
> [`isImmutable`](#state--methods--is-immutable)

> [Mutability attributes](/docs/#concepts--attributes--mutability)


#### [abstract](#state--attributes--abstract)

A state that is `abstract` cannot itself be current. Consequently a transition that targets an abstract state will be forcibly redirected to the appropriate concrete descendant state.

The redirection target of an `abstract` state is determined by seeking its first substate marked [`default`](#state--attributes--default). If no `default` substate exists, the first substate is targeted. If the redirection target is itself `abstract`, then the process is repeated until a concrete descendant is found. If an `abstract` state has no concrete descendants, currency is directed to the deepest descendant.

The `abstract` attribute is inherited from protostates.

{% highlight javascript %}
{% include examples/api/state/attributes--abstract.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/attributes--abstract.coffee %}
{% endhighlight %}

> See also:
> [`isAbstract`](#state--methods--is-abstract)

> [Abstraction attributes](/docs/#concepts--attributes--abstraction)


#### [concrete](#state--attributes--concrete)

Including the `concrete` attribute will override the [`abstract`](#state--attributes--abstract) attribute that would otherwise have been inherited from an abstract protostate.

Any state that is not abstract is by definition concrete, even if not literally attributed as such, and will return `true` in a call to [`isConcrete`](#state--methods--is-concrete).

The `concrete` attribute is inherited from protostates.

{% highlight javascript %}
{% include examples/api/state/attributes--concrete.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/attributes--concrete.coffee %}
{% endhighlight %}

> See also:
> [`isConcrete`](#state--methods--is-concrete)

> [Abstraction attributes](/docs/#concepts--attributes--abstraction)


#### [default](#state--attributes--default)

Marking a state `default` designates it as the intended redirection target for any transition that has targeted its [`abstract`](#state--attributes--abstract) superstate.

The `default` attribute is inherited from protostates.

{% highlight javascript %}
{% include examples/api/state/attributes--default.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/attributes--default.coffee %}
{% endhighlight %}

> See also:
> [`isDefault`](#state--methods--is-default),
> [`defaultSubstate`](#state--methods--default-substate)

> [Abstraction attributes](/docs/#concepts--attributes--abstraction)
> [`State::defaultSubstate`](/source/#state--prototype--default-substate)


#### [initial](#state--attributes--initial)

Marking a state `initial` specifies which state is to be assumed immediately following the `state()` application. No transition or any `enter` or `arrive` events result from this initialization.

For an object that inherits its entire state implementation from its prototype, the inheritor’s initial state will be set to the prototype’s current state.

The `initial` attribute is inherited from protostates.

{% highlight javascript %}
{% include examples/api/state/attributes--initial.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/attributes--initial.coffee %}
{% endhighlight %}

> See also:
> [`isInitial`](#state--methods--is-initial),
> [`initialSubstate`](#state--methods--initial-substate)

> [Destination attributes](/docs/#concepts--attributes--destination)
> [`State::initialSubstate`](/source/#state--prototype--initial-substate)


#### [conclusive](#state--attributes--conclusive)

Once a `conclusive` state is entered, it cannot be exited, although transitions may still freely traverse within its substates.

The `conclusive` attribute is inherited from protostates.

{% highlight javascript %}
{% include examples/api/state/attributes--conclusive.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/attributes--conclusive.coffee %}
{% endhighlight %}

> See also:
> [`isConclusive`](#state--methods--is-conclusive)

> [Destination attributes](/docs/#concepts--attributes--destination)


#### [final](#state--attributes--final)

Once an object’s currency arrives at a `final` state, no further transitions are allowed.

A `final` state is not necessarily [`conclusive`](#state--attributes--conclusive): a transition may [enter](#state--events--enter) a `final` state on its way to a descendant, and still [exit](#state--events--exit) from it later, so long as it never [arrive](#state--events--arrive)s at the `final` state.

The `final` attribute is inherited from protostates.

{% highlight javascript %}
{% include examples/api/state/attributes--final.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/attributes--final.coffee %}
{% endhighlight %}

> See also:
> [`isFinal`](#state--methods--is-final)

> [Destination attributes](/docs/#concepts--attributes--destination)
