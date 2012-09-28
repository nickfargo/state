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

When a method call is delegated to a state method, that state method is invoked not in the context of its owner, but rather of the `State` in which it is declared, or, if the method is inherited from a protostate, in the context of the owner’s state which inherits from that protostate. Using the state as the method’s context does mean that, within a state method, while the owner is not referenced by `this` as it normally would be, it is still always accessible by calling `this.owner()`.

This lexical binding of state methods to their associated `State` allows the code to take advantage of polymorphic idioms, such as calling up to a superstate’s implementation of a method, as facilitated by the `apply` and `call` methods of `State`.

{% highlight javascript %}
{% include examples/docs/methods--context.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/methods--context.coffee %}
{% endhighlight %}

Worth noting here in regard to these `apply` and `call` methods is the significant difference distinguishing them from their more familiar `Function.prototype` counterparts: whereas for a function, the first argument accepted by `apply` and `call` is a context object, for the `State::apply` and `State::call` methods, the first argument is a string that names a method on that state to be invoked. Supplying a context object is unnecessary because, again, methods held on a `State` are automatically bound to that `State`.

> [apply](/api/#state--methods--apply)
> [call](/api/#state--methods--call)
> [method](/api/#state--methods--method)
> [`State::apply`](/source/#state--prototype--apply)
> [`State::call`](/source/#state--prototype--call)
> [`State.privileged.method`](/source/#state--privileged--method)

#### [Handling calls to currently nonexistent methods](#concepts--methods--nonexistent)

In the case of an attempt to `call` or `apply` a state method that does not exist within that state and cannot be inherited from any protostate or superstate, the invocation will fail and return `undefined`.

**State** allows such a contingency to be trapped by emitting a generic `noSuchMethod` [**event**](#concepts--events). Listeners take as arguments the sought `methodName` and an `Array` of the arguments provided to the failed invocation.

A specific `noSuchMethod:<methodName>` event is emitted as well, whose listeners take just the arguments as provided to the failed invocation.

{% highlight javascript %}
{% include examples/docs/methods--nonexistent.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/docs/methods--nonexistent.coffee %}
{% endhighlight %}

> [apply](/api/#state--methods--apply)
> [`State::apply`](/source/#state--prototype--apply)

#### [Example](#concepts--methods--example)

This example of a simple `Document` type demonstrates some of the patterns of state method inheritance. Note the points of interest numbered in the trailing comments and their explanations below:

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
