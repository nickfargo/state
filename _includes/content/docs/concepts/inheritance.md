### [Inheritance](#concepts--inheritance)

The [`State`](/api/#state) object model is a classic rooted tree structure. Any state may serve as a **superstate** of one or more **substates**, each of which expresses further specificity of their common owner object’s behavior and condition.

An owner object’s state tree is further heritable by any prototypal inheritors of that object, which view their prototype’s states as **protostates**, from which their own states, as **epistates**, may inherit.

<div class="local-toc"></div>

#### [The root state](#concepts--inheritance--the-root-state)

For every stateful object, a single **root state** is automatically generated, which is the top-level superstate of all other states. The root state’s name is always and uniquely the empty string `''`. Either an empty-string selector or naked transition arrow may be used to change an object’s current state to the root state, causing the object to exhibit its default behavior.

{% highlight javascript %}
{% include examples/docs/inheritance--the-root-state.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/inheritance--the-root-state.coffee %}
{% endhighlight %}

The root state also acts as the *default method store* for the object’s state implementation, containing any methods originally defined on the object itself, for which now exist one or more stateful reimplementations elsewhere within the state tree.

This is the basis for **State**’s *method delegation* pattern, wherein a method call made on the object is automatically forwarded to the object’s current state, with the assurance that the call will be resolved somewhere in the state tree. If a method override is not present on the current state, then the call is forwarded on to its superstate, and so on as necessary, until as a last resort **State** will resolve the call using the object’s original implementation of the method, held within the root state.

> See also: [**Delegator methods**](#concepts--methods--delegators)

> [root](/api/#state--methods--root)
> [`State::root`](/source/#state--prototype--root)

#### [Superstates and substates: nesting specific behavior](#concepts--inheritance--superstates-and-substates)

Substates help to express ever greater specificity of their owner’s behavior and condition. An object may exhibit a specific condition by transitioning to a state nested deep within the tree, and it is also free to express itself more generically by transitioning to a concrete interior state.

{% highlight javascript %}
{% include examples/docs/inheritance--superstates-and-substates.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/inheritance--superstates-and-substates.coffee %}
{% endhighlight %}

#### [Protostates: inheriting states across prototypes](#concepts--inheritance--protostates)

All of the examples given to this point have created stateful objects by applying the [`state()`](#getting-started--the-state-function) function directly to the object. Consider now the case of an object that inherits from a stateful prototype.

{% highlight javascript %}
{% include examples/docs/inheritance--protostates--1.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/inheritance--protostates--1.coffee %}
{% endhighlight %}

At this point `person` inherits the `state` method from its prototype, as it lacks a state implementation of its own. However, calling `person.state()` automatically creates a new state implementation for `person`.

{% highlight javascript %}
{% include examples/docs/inheritance--protostates--2.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/inheritance--protostates--2.coffee %}
{% endhighlight %}

Now, `person` will automatically inherit all content from the states of its prototype, which it identifies as its **protostates**. It will maintain its own currency and transitions over the inherited protostates, leaving the currency of the prototype unaffected.

{% highlight javascript %}
{% include examples/docs/inheritance--protostates--3.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/inheritance--protostates--3.coffee %}
{% endhighlight %}

##### [Under the hood](#concepts--inheritance--protostates--under-the-hood)

When an accessor method (`person.state`) is called, it first checks the context object (`person`) to ensure that it has its own accessor method. If it does not, and is instead attempting to inherit the accessor (`state`) of a prototype, then an empty state implementation is automatically created for the inheritor, which in turn generates a corresponding new accessor method (`person.state`), to which the original call is then forwarded. The new state tree of `person` will consist only of an empty root state, but this is sufficient to allow the object to inherit from any of its protostates.

The inheritor may adopt a protostate as its current state just as it would with a state of its own. When that happens, a temporary, lightweight **virtual state** is created within the state implementation of the inheritor, acting as a stand-in for the protostate. Virtual states exist only so long as they are active; once the object transitions elsewhere, any virtual states consequently rendered inactive are automatically destroyed.

This system of protostates and virtual states allows an object’s state implementation to benefit from the prototypal reuse patterns of JavaScript without entangling the constituent `State` instances themselves in any direct prototypal relationships with each other.

> [`createAccessor`](/source/#state-controller--private--create-accessor)

> [protostate](/api/#state--methods--protostate)
> [isProtostateOf](/api/#state--methods--is-protostate-of)
> [`State` constructor](/source/#state--constructor)
> [`State::protostate`](/source/#state--prototype--protostate)

<div class="backcrumb">
⏎  <a class="section" href="#concepts--inheritance">Inheritance</a>  &lt;  <a href="#concepts">Concepts</a>  &lt;  <a href="#overview">Overview</a>
</div>
