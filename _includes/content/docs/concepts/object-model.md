### [Object model](#concepts--object-model)

The [`State`](/api/#state) model is fundamentally hierarchical, describing a rooted tree of `State`s belonging to a unique **owner** object. Each `State`, starting with the owner’s unique **root state**, may serve as a **superstate** from which one or more **substates** inherit.

A `State` may also inherit from zero or more **parastates**, from which its contents are *composed*, in a manner similar to the concepts of dynamic mixins or multiple inheritance.

An owner’s state tree is further heritable by any prototypal inheritors of that owner, which view their prototype’s `State`s as **protostates** from which their own **epistates** inherit.

![State object model][diagram--model]

<div class="local-toc"></div>


#### [The root state](#concepts--object-model--the-root-state)

All **State**–affected **owner** objects bear a single **root state**. The root state’s `name` is uniquely identified as the empty string `''`.

{% highlight javascript %}
{% include examples/docs/object-model--the-root-state.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/object-model--the-root-state.coffee %}
{% endhighlight %}

By default the owner’s initial **current state** will be set to the root state — unless the root state is marked with the [`abstract` attribute](#concepts--attributes--abstraction), or another `State` in the tree is marked with the [`initial` attribute](#concepts--attributes--destination).

The root state also serves as a store for [methods](#concepts--methods) of the owner which are overridden by any of the owner’s `State`s. Such methods are swapped into the root state, and replaced on the owner with [**dispatchers**](#concepts--methods--dispatchers), which delegate calls received by the owner to the owner’s current state. From this it follows that the owner will exhibit its *default behavior* whenever its root state is *current*.

###### SEE ALSO

> [root](/api/#state--methods--root)
> [`RootState`](/source/root-state.html)
> [`State::root`](/source/state.html#state--prototype--root)


#### [Superstates and substates](#concepts--object-model--superstates-and-substates)

An **owner** object’s expressed behavior is *specified* by **substates**, and conversely *generalized* by **superstates**.

{% highlight javascript %}
{% include examples/docs/object-model--superstates-and-substates.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/object-model--superstates-and-substates.coffee %}
{% endhighlight %}

![Superstates and substates][diagram--model--super]

> **The superstate axis** — A stateful **owner** bears a rooted state tree. Each `State` in the tree may bear zero or more **substates**, and accordingly trace a **superstate** chain up to the unique `RootState`. Most of a `State`’s content, including methods, data, events, etc. may be inherited from superstates and extended or overridden by substates.

A notable distinction of **State** from other hierarchical state implementations is that an owner’s **currency** is not necessarily confined to “leaf” states. The owner is free both to exhibit specific behavior by transitioning to a state nested deeper in the tree, and also to exhibit more generic behavior by transitioning to a **concrete** interior superstate.

> [Abstraction](#concepts--attributes--abstraction)


#### [Parastates and composition](#concepts--object-model--parastates-and-composition)

Alongside conventional single inheritance via [superstates](#concepts--object-model--superstates-and-substates), the **State** model also provides multiple inheritance with the **parastate** relation. `State`s inherit directly from zero or more parastates, followed by exactly one superstate.

> The lone exception to this is a `RootState`, which bears neither relation.

Parastates are declared with the [`state.extend`](/api/#state-function--extend) function, which takes a string of one or more paths to `parastates`, along with optional parameters `attributes` and `expression`, and returns a `StateExpression` that can be used to produce a `State` with the named parastates.

{% highlight javascript %}
{% include examples/docs/object-model--parastates-and-composition.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/object-model--parastates-and-composition.coffee %}
{% endhighlight %}

> State `AA` inherits conventionally from superstate `A`, but not before inheriting *compositionally* from parastates `X` and `Y`.

##### Linearization, order, and monotonicity

The order in which a `State` inherits from its lineage of parastate and superstate ancestors is guaranteed to be unambiguous and monotonic. This is enforced by an implementation of the **C3 linearization algorithm** (Dylan, Perl, Python), with the **State**–specific stipulations that:

* A `State`’s “parents” are defined and ordered by its immediate parastates, in declared order, followed by its immediate superstate.

* A `RootState` by rule cannot inherit from parastates, and by definition does not inherit from a superstate.

![Parastates][diagram--model--para]

> **Parastate–superstate graph** and **linearization** — from the example code above, parastates `X` and `Y` of `State` `AA` are depicted to the left of its superstate `A`, indicating the superstate’s role as the “final parent” of a `State`. The linearization of `AA` determines the precedence, or *resolution order*, by which the `State` will inherit methods, data, and events defined in its ancestors.

Attempting to implement an expression that produces a `State` graph which does not conform to the **C3** restrictions will throw a `TypeError`.

##### Prototypal flattening

A `State` and its parastates must share a common `owner`, however, parastate declarations may include paths that resolve to `State`s belonging to a prototype of the `owner`. In such a case these “proto-parastates” are automatically *flattened* onto the `owner`’s state tree:

* Given `State` *S* with `owner` *O*, which has prototype *P*, where *P* bears a `State` *A* whose path is `'A'`, and given that *S* declares path `'A'` as a parastate relation;

* As *O* contains no `State` with path `'A'`, the **protostate** *A* belonging to *P* will be automatically [`virtualize`](/source/state.html#state--prototype--virtualize)d and [`realize`](/api/#state--methods--realize)d — effectively flattening it — into the state tree of *O* as an **epistate** *Aʹ*, with path `'A'`, such that *S* may inherit from parastate *Aʹ*.

##### Miscellanea

* The progression of a **transition** is conceptually orthogonal to the parastate relation, and traversal proceeds only over the state tree defined by the superstate–substate relations.

* Parastates provide for compositional reuse of their own or inherited **methods, data, and custom events**. Built-in events, guards, substates, transitions, and attributes are not heritable via parastate.


#### [Protostates and epistates](#concepts--object-model--protostates-and-epistates)

The relation between an object and its prototype is reflected throughout the **State** implementation of each. Inheritors of a **State**–affected prototype view its `State`s as their **protostates**; conversely, matching `State`s of an inheritor are **epistates** of their respective protostates.

This *indirect prototypal relation* defined by protostates and epistates confers many of the benefits of language-level prototypal reuse patterns to `State`s without entangling them in any direct prototypal relationships themselves.

![Protostates and epistates][diagram--model--proto]

> **The protostate axis** — A particular superstate chain (root–`A`–`AA`) is viewed here along the horizontal axis, within the prevailing context of a prototype chain (`q`–`p`–`o`) on the vertical axis. The prototypal relation between these owner objects implicitly defines **protostate chains** which link analogously-pathed `State`s, e.g. (`qA`–`pA`–`oA`) and (`pAA`–`oAA`), along a parallel vertical axis.

> In this diagram the inheriting owner `o` defines no *real states* of its own, other than the root, however it still views states `pA` and `pAA` as its protostates, and may inherit these as [virtual epistates](#concepts--object-model--virtual-epistates), indicated by the faded appearance of `oA` and `oAA`. In this manner, state content, behavior, etc. defined for `p` and `q` will also be exhibited by `o`, just as if those states had been defined directly on `o` itself.

The following example shows an object that, rather than being affected by the [`state()`](#getting-started--the-state-function) function directly, instead inherits from a prototype which already bears a state implementation.

{% highlight javascript %}
{% include examples/docs/object-model--protostates-and-epistates--1.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/object-model--protostates-and-epistates--1.coffee %}
{% endhighlight %}

> Here `person`, lacking a state implementation of its own, inherits the `state` method from its prototype. When `person.state()` is invoked, a new state implementation is automatically created for `person`, which is given its own `state` method and an empty `RootState`.

{% highlight javascript %}
{% include examples/docs/object-model--protostates-and-epistates--2.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/object-model--protostates-and-epistates--2.coffee %}
{% endhighlight %}

> Henceforth `person` will automatically inherit all content from its protostates, but will independently maintain its own currency and transitions over the inherited protostates, leaving the currency of the prototype unaffected.

{% highlight javascript %}
{% include examples/docs/object-model--protostates-and-epistates--3.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/object-model--protostates-and-epistates--3.coffee %}
{% endhighlight %}

> [protostate](/api/#state--properties--protostate)
> [getProtostate](/api/#state--methods--get-protostate)


#### [Virtual epistates](#concepts--object-model--virtual-epistates)

When an accessor method (`person.state`) is called, it first checks the context object (`person`) to ensure that it has its own accessor method. If it does not, and is instead attempting to inherit the accessor (`state`) of a prototype, then an empty state implementation is automatically created for the inheritor, which in turn generates a corresponding new accessor method (`person.state`), to which the original call is then forwarded. The new state tree of `person` will consist only of an empty root state, but this is sufficient to allow the object to inherit from any of its protostates while maintaining its own independent currency.

When an inheritor adopts a protostate as its current state, the currency is borne by a temporary, lightweight **virtual epistate** that is created in the inheritor’s state tree. Virtual states exist only so long as they are active and necessary; once the object transitions elsewhere, any virtual states consequently rendered inactive are automatically destroyed.

> [`RootState createAccessor`](/source/root-state.html#root-state--private--create-accessor)
> [`State` constructor](/source/state.html#state--constructor)
> [`State::getProtostate`](/source/state.html#state--prototype--get-protostate)



<div class="backcrumb">
⏎  <a class="section" href="#concepts--object-model">Object model</a>  &lt;  <a href="#concepts">Concepts</a>  &lt;  <a href="#overview">Overview</a>
</div>




[diagram--model]:         /img/model-4.png "State object model"
[diagram--model--super]:  /img/model-1.png "Superstates and substates"
[diagram--model--proto]:  /img/model-2.png "Protostates and epistates"
[diagram--model--para]:   /img/model-3.png "Parastates"
