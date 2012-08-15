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

> [mutable](/docs/#concepts--attributes--mutability--mutable)


#### [finite](#state--attributes--finite)

Declaring a state `finite` guarantees its hierarchical structure by hiding its `addSubstate` and `removeSubstate` methods after the state has been constructed.

The `finite` attribute is inherited from both superstates and protostates, and is imposed with higher precedence than [`mutable`](#state--attributes--mutable).

> [finite](/docs/#concepts--attributes--mutability--finite)


#### [immutable](#state--attributes--immutable)

Adding `immutable` makes a state **strongly immutable**, whereupon immutability is permanent and absolute: `immutable` contradicts and overrules `mutable`, and implies `finite`, irrespective of whether any of the attributes are literal or inherited.

The `immutable` attribute is inherited from both superstates and protostates, and has top precedence over [`mutable`](#state--attributes--mutable) and [`finite`](#state--attributes--finite).

An inheriting owner object may still extend the state implementation of its prototype with states that are new or extend protostates, but any of these that inherit from an `immutable` state will also bear the `immutable` attribute themselves.

> [immutable](/docs/#concepts--attributes--mutability--immutable)


#### [abstract](#state--attributes--abstract)

A state that is `abstract` cannot itself be current. Consequently a transition that targets an abstract state will be forcibly redirected to the appropriate concrete descendant state.

The redirection target of an `abstract` state is determined by seeking its first substate marked [`default`](#state--attributes--default). If no `default` substate exists, the first substate is targeted. If the redirection target is itself `abstract`, then the process is repeated until a concrete descendant is found. If an `abstract` state has no concrete descendants, currency is directed to the deepest descendant.

The `abstract` attribute is inherited from protostates.

> [abstract](/docs/#concepts--attributes--abstraction--abstract)


#### [concrete](#state--attributes--concrete)

Including the `concrete` attribute will override the [`abstract`](#state--attributes--abstract) attribute that would otherwise have been inherited from an abstract protostate.

Any state that is not abstract is by definition concrete, even if not literally attributed as such, and will return `true` in a call to [`isConcrete`](#state--methods--is-concrete).

The `concrete` attribute is inherited from protostates.

> [concrete](/docs/#concepts--attributes--abstraction--concrete)


#### [default](#state--attributes--default)

Marking a state `default` designates it as the intended redirection target for any transition that has targeted its [`abstract`](#state--attributes--abstract) superstate.

The `default` attribute is inherited from protostates.

> [default](/docs/#concepts--attributes--abstraction--default)


#### [initial](#state--attributes--initial)

Marking a state `initial` specifies which state is to be assumed immediately following the `state()` application. No transition or any `enter` or `arrive` events result from this initialization.

For an object that inherits its entire state implementation from its prototype, the inheritor’s initial state will be set to the prototype’s current state.

The `initial` attribute is inherited from protostates.

> [initial](/docs/#concepts--attributes--destination--initial)


#### [conclusive](#state--attributes--conclusive)

Once a `conclusive` state is entered, it cannot be exited, although transitions may still freely traverse within its substates.

The `conclusive` attribute is inherited from protostates.

> [conclusive](/docs/#concepts--attributes--destination--conclusive)


#### [final](#state--attributes--final)

Once an object’s currency arrives at a `final` state, no further transitions are allowed.

A `final` state is not necessarily [`conclusive`](#state--attributes--conclusive): a transition may [enter](#state--events--enter) a `final` state on its way to a descendant, and still [exit](#state--events--exit) from it later, so long as it never [arrive](#state--events--arrive)s at the `final` state.

The `final` attribute is inherited from protostates.

> [final](/docs/#concepts--attributes--destination--final)
