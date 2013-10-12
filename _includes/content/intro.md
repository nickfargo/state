**State.js** is a JavaScript library for implementing **first-class states** on arbitrary **owner** objects.

{% highlight javascript %}
{% include examples/index--intro--0.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--intro--0.coffee %}
{% endhighlight %}

> The exported `state` function will be used here in two ways: **(1)** to *define* behavior in formal structures called **state expressions**; and **(2)** to *implement* a composite state expression on an `owner`, producing a tree of [`State`](#states-and-currency)s that belong to the owner.

{% highlight javascript %}
{% include examples/index--intro--1.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--intro--1.coffee %}
{% endhighlight %}

> The *implementing* form has two effects: **(1)** the owner is given a new `state` method, which closes over the owner’s new state tree and serves as the **accessor** to its `State`s; and **(2)** for any method defined at least once in the state tree, a corresponding **dispatcher** method is created and added to the owner.

{% highlight javascript %}
{% include examples/index--intro--2.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--intro--2.coffee %}
{% endhighlight %}


### [States and currency](#states-and-currency)

[`State`](/api/#state) objects are heritable, composable modules of behavior, to be exhibited interchangeably over time by their **owner** object. `State`s may define [method](#methods) overrides, arbitrary [data](/docs/#concepts--data), [event](#events) listeners, [guards](/docs/#concepts--guards), [substates](/docs/#concepts--object-model--superstates-and-substates), and [transition expressions](/docs/#concepts--transitions).

{% highlight javascript %}
{% include examples/index--states--0.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--states--0.coffee %}
{% endhighlight %}

![States][diagram--states]

Exactly one `State` is designated as the owner’s **current state**, whose own and inherited behavior is exhibited by the owner.

{% highlight javascript %}
{% include examples/index--states--1.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--states--1.coffee %}
{% endhighlight %}

The owner may alter its behavior by undergoing **transitions**, which carry the current state reference, or **currency**, to a different `State`.

{% highlight javascript %}
{% include examples/index--states--2.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--states--2.coffee %}
{% endhighlight %}


### [Object model](#object-model)

A [`State`](/api/#state) and its contents may be [inherited and composed](/docs/#concepts--object-model) from other `State`s.

![State object model][diagram--object-model]

Among `State`s that share a common **owner**, the **State** object model provides both hierarchical single-inheritance from [superstates](/docs/#concepts--object-model--superstates-and-substates), and compositional multiple-inheritance with [parastates](/docs/#concepts--object-model--parastates-and-composition). Indirect prototypal inheritance is also provided implicitly via [protostates](/docs/#concepts--object-model--protostates-and-epistates).

{% highlight javascript %}
{% include examples/index--object-model--0.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--object-model--0.coffee %}
{% endhighlight %}

> A **state tree** is implemented on the prototype of a constructor. Here, the **root state** is the **superstate** of its **substates** `Casual` and `Formal`.

{% highlight javascript %}
{% include examples/index--object-model--1.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--object-model--1.coffee %}
{% endhighlight %}

> Instances of a **State**–affected prototype such as this commonly do not bear a tree of `State`s themselves, but will inherit the prototype’s `State`s as the instances’ **protostates**.

{% highlight javascript %}
{% include examples/index--object-model--2.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--object-model--2.coffee %}
{% endhighlight %}

> Unless specified otherwise, an owner’s initial **current state** will be the root state. The root state defines the owner’s most generic behavior, and as such also subsumes the owner’s default method implementations.

{% highlight javascript %}
{% include examples/index--object-model--3.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--object-model--3.coffee %}
{% endhighlight %}

> Even though its `State`s are defined on the prototype, each instance independently executes transitions that may target these inherited protostates.

{% highlight javascript %}
{% include examples/index--object-model--4.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--object-model--4.coffee %}
{% endhighlight %}

> Method calls received by the owner are dispatched to implementations defined on (or inherited by) its current state.

{% highlight javascript %}
{% include examples/index--object-model--5.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--object-model--5.coffee %}
{% endhighlight %}


### [Attributes](#attributes)

[Attributes](/docs/#concepts--attributes) are a set of keyword strings that may precede the body of a state expression. These concisely empower or constrain certain aspects of a [`State`](/api/#state), such as [abstraction](/docs/#concepts--attributes--abstraction), [destination](/docs/#concepts--attributes--destination), and [mutability](/docs/#concepts--attributes--mutability).

{% highlight javascript %}
{% include examples/index--attributes.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--attributes.coffee %}
{% endhighlight %}


### [Methods](#methods)

[State methods](/docs/#concepts--methods) express or override behavior of the **owner**. Method calls received by the owner are dispatched to its **current state**’s own or inherited implementation of the corresponding method.

By default, state methods are invoked in the context of the owner, just like normal methods. To provide insight into its place in the owner’s state tree, a method definition can instead be [contextually bound](/docs/#concepts--methods--context) to the [`State`](/api/#state) in which the method acts. (If the method is inherited from a protostate, this context will be the inheriting epistate.)

{% highlight javascript %}
{% include examples/index--methods.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--methods.coffee %}
{% endhighlight %}

A state method can also be wrapped in a decorator that [fixes the method](/docs/#concepts--methods--lexical-bindings) with bindings to the precise `State` where it is defined, invariant across the protostate–epistate relation.


### [Events](#events)

**State** provides built-in [events](/docs/#concepts--events) that relate the [progress of a transition](/docs/#concepts--events--transitional) as it traverses the state hierarchy, and that signal the [construction, destruction](/docs/#concepts--events--existential), or [mutation](/docs/#concepts--events--mutation) of a [`State`](/api/#state). Events can also be emitted for any [custom event type](/docs/#concepts--events--custom).

{% highlight javascript %}
{% include examples/index--events.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--events.coffee %}
{% endhighlight %}


### [Mutability](#mutability)

[`State`](/api/#state) instances are nominally [immutable by default](/docs/#concepts--attributes--mutability). This restriction forces any changes in the owner’s **State**-based behavior to be expressed in terms of **transitions** between `State`s.

Alternatively, a `State` may be explicitly expressed as [mutable](/api/#state--attributes--mutable), such that modular pieces of behavior may be inserted and implemented dynamically into a live `State`, thereby allowing changes in behavior to be exhibited via **mutations** as well.

> A plain object is sufficient to define a loose expression of behavior.

{% highlight javascript %}
{% include examples/index--mutability--0.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--mutability--0.coffee %}
{% endhighlight %}

> This factory produces a boxed function that will instill an enclosed `behavior` into a receiving `State`.

{% highlight javascript %}
{% include examples/index--mutability--1.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--mutability--1.coffee %}
{% endhighlight %}

> A `traveler` assimilates into the local culture by overwriting its previously defined behavior with the appropriately chosen new behavior. (Recall `Actor` defined above.)

{% highlight javascript %}
{% include examples/index--mutability--2.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--mutability--2.coffee %}
{% endhighlight %}


### [Transitions](#Transitions)

A [`Transition`](/api/#transition) instance is an ephemeral type of [`State`](/api/#state) that is automatically created and occupied as an owner’s **current state** while it is in the process of moving between `State`s.

[Transitions](/docs/#concepts--transitions) are defined by **transition expressions**, which are an optional component of a state expression. A transition may be defined [generically across multiple states](/docs/#concepts--transitions--expressions), is defined as either [synchronous or asynchronous](/docs/#concepts--transitions--lifecycle), and can be [conditionally guarded](/docs/#concepts--guards).

{% highlight javascript %}
{% include examples/index--transitions.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/index--transitions.coffee %}
{% endhighlight %}


* * *

## Further reading


### [Articles](/blog/)

### [Documentation](/docs/)

> [Installation](/docs/#installation)
> [Getting started](/docs/#getting-started)
> [Overview](/docs/#overview)
> [Concepts](/docs/#concepts)

### [API reference](/api/)

> [`state()`](/api/#state-function)
> [`State`](/api/#state)
> [`Transition`](/api/#transition)

### [Annotated source](/source/)

### [View on GitHub](http://github.com/nickfargo/state)




[diagram--states]: /img/model-5.png "States"
[diagram--object-model]: /img/model-4-75pct.png "State object model"
