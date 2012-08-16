### [Methods](#concepts--methods)

A defining feature of **State** is the ability for an object to exhibit a variety of behaviors. A state expresses a particular behavior by defining **overrides** for any of its object’s methods.

> [Methods](/api/#state--methods--section--methods)

<div class="local-toc"></div>

#### [Delegator methods](#concepts--methods--delegators)

When state is applied to an object, **State** identifies any methods already present on the object for which there exists at least one override somewhere within the state expression. These methods will be relocated to the root state, and replaced on the object with a special **delegator** method. The delegator’s job is to redirect any subsequent calls it receives to the object’s current state, from which **State** will then locate and invoke the proper stateful implementation of the method. Should no active states contain an override for the invoked method, the delegation will default to the object’s original implementation of the method if one exists, or result in a `noSuchMethod` [**event**](#concepts--events) otherwise.

{% highlight javascript %}
{% include examples/docs/methods--delegators.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/methods--delegators.coffee %}
{% endhighlight %}

> [`State createDelegator`](/source/#state--private--create-delegator)
> [`State.privileged.addMethod`](/source/#state--privileged--add-method)

#### [Method context](#concepts--methods--context)

When a method call is delegated to a state method, that state method is invoked not in the context of its owner, but rather of the state in which it is declared, or, if the method is inherited from a protostate, in the context of the local state that inherits from that protostate. This does mean that, within a state method, the owner is not referenced by `this` as it normally would be; however, it is still always accessible by calling `this.owner()`.

The lexical information afforded by binding state methods to their associated state allows state method code to take advantage of polymorphic idioms, such as calling up to a superstate’s implementation of a method, as facilitated by the `apply` and `call` methods of `State`.

{% highlight javascript %}
{% include examples/docs/methods--context.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/methods--context.coffee %}
{% endhighlight %}

> **Note** — it may be important here to call attention to a significant difference distinguishing these methods from their eponymous counterparts at `Function.prototype`: in `State`, the first argument accepted by `apply` and `call` is a string that names a state method, rather than a context object (since, again, the resulting invocation’s context is automatically bound to that method’s associated `State`).

> [apply](/api/#state--methods--apply)
> [method](/api/#state--methods--method)
> [`State::apply`](/source/#state--prototype--apply)
> [`State.privileged.method`](/source/#state--privileged--method)

#### [Handling calls to currently nonexistent methods](#concepts--methods--nonexistent)

In the case of an attempt to `call` or `apply` a state method that does not exist within that state and cannot be inherited from any protostate or superstate, the invocation will fail and return `undefined`.

**State** allows such a contingency to be “trapped” by emitting a generic `noSuchMethod` [**event**](#concepts--events), whose listeners take as arguments the sought `methodName` and an `Array` of the arguments provided to the failed invocation.

Additionally, a specific `noSuchMethod:<methodName>` event type is emitted as well, whose listeners take just the arguments as provided to the failed invocation.

{% highlight javascript %}
{% include examples/docs/methods--nonexistent.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/methods--nonexistent.coffee %}
{% endhighlight %}

> [apply](/api/#state--methods--apply)
> [`State::apply`](/source/#state--prototype--apply)

#### [Example](#concepts--methods--example)

This example of a simple `Document` type demonstrates state method inheritance and polymorphism. Note the points of interest that are numbered in the trailing comments and explained below:

{% highlight javascript %}
{% include examples/docs/methods--example.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/methods--example.coffee %}
{% endhighlight %}

{% include captions/docs/methods--example.md %}

<div class="backcrumb">
⏎  <a class="section" href="#concepts--methods">Methods</a>  &lt;  <a href="#concepts">Concepts</a>  &lt;  <a href="#overview">Overview</a>
</div>
