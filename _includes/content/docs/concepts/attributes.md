### [Attributes](#concepts--attributes)

State expressions may include a space-delimited set of **attributes**, provided as a single string argument that precedes the object map within a `state()` call.

{% highlight javascript %}
{% include examples/docs/attributes.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/attributes.coffee %}
{% endhighlight %}

> [Attributes](/api/#state--methods--section--attributes)
> [`state/attributes`](/source/#state--attributes.js)
> [`State.privileged.attributes`](/source/#state--privileged--attributes)

<div class="local-toc"></div>

#### [Mutability attributes](#concepts--attributes--mutability)

By default, states are **weakly immutable** — their data, methods, guards, substates, and transitions cannot be altered once the state has been constructed — a condition that can be affected at construct-time by these mutability attributes. Each attribute is implicitly inherited from any of the state’s ancestors, be they superstates or protostates. They are listed here in order of increasing precedence.

##### [mutable](#concepts--attributes--mutability--mutable)

Including the `mutable` attribute in a weakly immutable state’s expression lifts the restriction of immutability. This exposes `State` instance methods such as `mutate`, `addMethod`, `addSubstate`, etc., which can be used to alter the contents of the state.

{% highlight javascript %}
{% include examples/docs/attributes--mutable.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/attributes--mutable.coffee %}
{% endhighlight %}

{% include captions/docs/concepts--attributes--mutability--mutable.md %}

> [isMutable](/api/#state--methods--is-mutable)
> [mutate (method)](/api/#state--methods--mutate)


##### [finite](#concepts--attributes--mutability--finite)

Declaring a state `finite` guarantees its hierarchical structure, such that descendant states may be neither added nor removed.

{% highlight javascript %}
{% include examples/docs/attributes--finite.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/attributes--finite.coffee %}
{% endhighlight %}

{% include captions/docs/concepts--attributes--mutability--finite.md %}

> [isFinite](/api/#state--methods--is-finite)


##### [immutable](#concepts--attributes--mutability--immutable)

Adding `immutable` makes a state **strongly immutable**, whereupon immutability is permanent and absolute: `immutable` contradicts and overrules `mutable`, and implies `finite`, irrespective of whether the attributes are literal or inherited.

An inheriting owner object may still extend its prototype’s state implementation with states that are new or extend protostates, but any of these that inherit from an `immutable` state will also bear the `immutable` attribute themselves.

{% highlight javascript %}
{% include examples/docs/attributes--immutable.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/attributes--immutable.coffee %}
{% endhighlight %}

{% include captions/docs/concepts--attributes--mutability--immutable.md %}

> [isImmutable](/api/#state--methods--is-immutable)


#### [Abstraction attributes](#concepts--attributes--abstraction)

**State** does not confine currency to “leaf” states. All states, including substate-bearing interior states, are by default regarded as **concrete**, and thus may be targeted by a transition.

Nevertheless, sometimes it may still be appropriate to author **abstract** states whose purpose is limited to serving as a common ancestor from which concrete descendant states will inherit. These attributes allow an implementor to control these restrictions.

##### [abstract](#concepts--attributes--abstraction--abstract)

A state that is `abstract` cannot itself be current. Consequently a transition that targets an abstract state will be forcibly redirected to the appropriate concrete descendant state.

{% highlight javascript %}
{% include examples/docs/attributes--abstract.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/attributes--abstract.coffee %}
{% endhighlight %}

> [isAbstract](/api/#state--methods--is-abstract)

##### [concrete](#concepts--attributes--abstraction--concrete)

Including the `concrete` attribute will override the `abstract` attribute that would otherwise have been inherited from an abstract protostate.

{% highlight javascript %}
{% include examples/docs/attributes--concrete.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/attributes--concrete.coffee %}
{% endhighlight %}

> [isConcrete](/api/#state--methods--is-concrete)

##### [default](#concepts--attributes--abstraction--default)

Marking a state `default` designates it as the intended redirection target for any transition that has targeted its abstract superstate.

{% highlight javascript %}
{% include examples/docs/attributes--default.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/attributes--default.coffee %}
{% endhighlight %}

> [isDefault](/api/#state--methods--is-default)
> [defaultSubstate](/api/#state--methods--default-substate)
> [`State::defaultSubstate`](/source/#state--prototype--default-substate)

#### [Destination attributes](#concepts--attributes--destination)

An object’s currency must often be initialized or confined to particular states, as directed by the destination attributes:

##### [initial](#concepts--attributes--destination--initial)

Marking a state `initial` specifies which state is to be assumed immediately following the `state()` application. No transition or any `enter` or `arrive` events result from this initialization.

For an object that inherits its entire state implementation from its prototype, the inheritor’s initial state will be set to the prototype’s current state.

{% highlight javascript %}
{% include examples/docs/attributes--initial.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/attributes--initial.coffee %}
{% endhighlight %}

> [isInitial](/api/#state--methods--is-initial)
> [initialSubstate](/api/#state--methods--initial-substate)
> [`State::initialSubstate`](/source/#state--prototype--initial-substate)

##### [conclusive](#concepts--attributes--destination--conclusive)

Once a `conclusive` state is entered, it cannot be exited, although transitions may still freely traverse within its substates.

{% highlight javascript %}
{% include examples/docs/attributes--conclusive.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/attributes--conclusive.coffee %}
{% endhighlight %}

> [isConclusive](/api/#state--methods--is-conclusive)

##### [final](#concepts--attributes--destination--final)

Once a state marked `final` is entered, no further transitions are allowed. 

{% highlight javascript %}
{% include examples/docs/attributes--final.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/attributes--final.coffee %}
{% endhighlight %}

> [isFinal](/api/#state--methods--is-final)

#### [Idioms of certain attribute combinations](#concepts--attributes--idioms)

* **“finite mutable”** — A state that is, literally or by inheritance, both `finite` and `mutable` guarantees its hierarchical structure without imposing absolute immutability.

* **“abstract concrete”** is an invalid contradiction. If both attributes are literally applied to a state, `concrete` takes precedence and negates `abstract`.

<div class="backcrumb">
⏎  <a class="section" href="#concepts--attributes">Attributes</a>  &lt;  <a href="#concepts">Concepts</a>  &lt;  <a href="#overview">Overview</a>
</div>
