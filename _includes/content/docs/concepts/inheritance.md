### [Inheritance](#concepts--inheritance)

The [`State`](/api/#state) object model is a rooted tree, where each `State` may serve as the **superstate** of one or more **substates**, each of which expresses further specificity of their common owner object’s behavior and condition.

An owner object’s state tree is further heritable by any prototypal inheritors of that object, which view their prototype’s states as **protostates** from which their own **epistates** inherit.

<div class="local-toc"></div>

#### [The root state](#concepts--inheritance--the-root-state)

All stateful objects bear a single **root state**, which is the top-level superstate of all other states. The root state’s `name` is always and uniquely the empty string `''`. Either an empty-string selector or naked transition arrow may be used to change an object’s current state to the root state, causing the object to exhibit its default behavior.

{% highlight javascript %}
{% include examples/docs/inheritance--the-root-state.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/inheritance--the-root-state.coffee %}
{% endhighlight %}

The root state also acts as the *default method store* for the object’s state implementation, containing any methods originally defined on the object itself for which now exist one or more stateful reimplementations elsewhere within the state tree.

> See also: [**Dispatcher methods**](#concepts--methods--dispatchers)

> [root](/api/#state--methods--root)
> [`State::root`](/source/#state--prototype--root)

#### [Superstates and substates](#concepts--inheritance--superstates-and-substates)

An owner object’s expressed behavior is *specified* by substates, and conversely *generalized* by superstates. Currency is not necessarily confined to “leaf” states: an object is free to both exhibit specific behavior by transitioning to a state nested deep within the tree, and to exhibit more generic behavior by transitioning to a [concrete](#concepts--attributes--abstraction) interior superstate.

![Superstates and substates][diagram--model-1]

> **The superstate axis** — A stateful **owner** bears a rooted state tree. Each `State` in the tree may bear zero or more **substates**, and accordingly trace a **superstate** chain up to the unique `RootState`. Any state content, including methods, events, etc. may be inherited from superstates and extended or overridden by substates.

{% highlight javascript %}
{% include examples/docs/inheritance--superstates-and-substates.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/inheritance--superstates-and-substates.coffee %}
{% endhighlight %}

#### [Protostates and epistates](#concepts--inheritance--protostates)

**State** also recognizes the relationship between an owner object and its prototype. When a state implementation exists on a prototype, it is completely extended to that prototype’s inheritors, each of which views the inherited **protostates** as if they were its own.

![Protostates and epistates][diagram--model-2]

> **The protostate axis** — Expanding on the previous diagram, we can examine a particular superstate chain (root–`A`–`AA`), viewed here along the horizontal axis, within the prevailing context of a prototype chain (`q`–`p`–`o`). The prototypal relation between these owner objects implicitly defines **protostate chains** which link analogously-pathed `State`s, e.g. (`qA`–`pA`–`oA`) and (`pAA`–`oAA`), along the vertical axis.

> In this diagram the inheriting owner `o` defines no *real states* of its own, other than the root, however it still views states `A` and `AA` of `p` as its protostates, which it inherits as **virtual epistates**. In this manner, state content, behavior, etc. defined for `p` and `q` will also be exhibited by `o`, just as if those states had been defined directly on `o` itself.

The examples given to this point have implemented state on an object by applying the [`state()`](#getting-started--the-state-function) function directly to the object. The next example will consider the case of an object that instead inherits from a prototype which already bears a state implementation.

{% highlight javascript %}
{% include examples/docs/inheritance--protostates--1.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/inheritance--protostates--1.coffee %}
{% endhighlight %}

Here `person`, lacking a state implementation of its own, inherits the `state` method from its prototype. When `person.state()` is invoked, a new state implementation is automatically created for `person`, which is given its own `state` method and an empty `RootState`.

{% highlight javascript %}
{% include examples/docs/inheritance--protostates--2.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/inheritance--protostates--2.coffee %}
{% endhighlight %}

Henceforth `person` will automatically inherit all content from its protostates, but will independently maintain its own currency and transitions over the inherited protostates, leaving the currency of the prototype unaffected.

{% highlight javascript %}
{% include examples/docs/inheritance--protostates--3.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/inheritance--protostates--3.coffee %}
{% endhighlight %}

##### [Under the hood](#concepts--inheritance--protostates--under-the-hood)

When an accessor method (`person.state`) is called, it first checks the context object (`person`) to ensure that it has its own accessor method. If it does not, and is instead attempting to inherit the accessor (`state`) of a prototype, then an empty state implementation is automatically created for the inheritor, which in turn generates a corresponding new accessor method (`person.state`), to which the original call is then forwarded. The new state tree of `person` will consist only of an empty root state, but this is sufficient to allow the object to inherit from any of its protostates while maintaining its own independent currency.

When an inheritor adopts a protostate as its current state, the currency is borne by a temporary, lightweight **virtual epistate** that is created in the inheritor’s state tree. Virtual states exist only so long as they are active and necessary; once the object transitions elsewhere, any virtual states consequently rendered inactive are automatically destroyed.

This system of protostates, epistates, and virtual states confers the benefits of language-level prototypal reuse patterns to an object’s `State`s, but without entangling them in any extraneous prototypal relationships themselves.

> [`createAccessor`](/source/#state-controller--private--create-accessor)

> [protostate](/api/#state--methods--protostate)
> [isProtostateOf](/api/#state--methods--is-protostate-of)
> [`State` constructor](/source/#state--constructor)
> [`State::protostate`](/source/#state--prototype--protostate)

<div class="backcrumb">
⏎  <a class="section" href="#concepts--inheritance">Inheritance</a>  &lt;  <a href="#concepts">Concepts</a>  &lt;  <a href="#overview">Overview</a>
</div>




[diagram--model-1]: /img/model-1.png "Superstates and substates"
[diagram--model-2]: /img/model-2.png "Protostates and epistates"
