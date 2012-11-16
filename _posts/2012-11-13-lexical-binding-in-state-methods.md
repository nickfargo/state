---
layout: post
title: Lexical binding in state methods
date: "2012-11-13T19:10:34+08:00"
tags: [methods, lexical binding]

lede: Binding a [state method](/docs/#concepts--methods)’s context to its containing [`State`](/api/#state) provides invocations of that method with useful information about the state’s hierarchical position within the owner object’s [state tree](/docs/#concepts--inheritance). When the invoked method is inherited from a [**protostate**](/docs/#concepts--inheritance--protostates), however, `this` by itself lacks any expression of the protostate’s relation to the state from which the method is being invoked. To that end, we devise a means for reflecting a method’s complete state–lexical environment into the body of a method function.
---

## [One method, two masters](#one-method-two-masters)

State methods serve as [delegation targets](/docs/#concepts--methods--delegators) for the methods of a stateful owner object. Just as normal methods use `this` to reference the object they serve, state methods also require a reference to a context.

However, the arrangement of `State`s into hierarchies adds a wrinkle, because a state method needs to hold some contextual reference not just to the owner object on whose behalf the method is invoked, but also to the `State` to which the method belongs.

### [The naïve approach](#the-naive-approach)

Least-surprise might suggest that, since state methods are meant to act as stand-ins for methods of the owner, the framework ought to apply them in the context of the owner.

Doing so maintains referential equivalence of `this`, irresepective of whether a method was defined on the owner object as usual, or as a member of one of the owner’s states. The method’s containing `State` might then be extracted by calling `this.state()` — after all, for a method to become a delegation target in the first place, we may expect the owner to be occupying that method’s `State` as its current state.

{% highlight javascript %}
{% include examples/blog/2012-11-13/1.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/blog/2012-11-13/1.coffee %}
{% endhighlight %}

But this approach falls apart when it comes time for a substate to inherit the method from a superstate. While the superstate that contains the method is **active**, it is the substate that is **current**, and which will therefore be returned by `this.state()`:

{% highlight javascript %}
{% include examples/blog/2012-11-13/2.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/blog/2012-11-13/2.coffee %}
{% endhighlight %}

So with context bound to the owner, a state method has no regular means of reliably identifying the `State` to which it belongs. The `this.state()` idiom, along with the subsequent [`superstate()`](/api/state--methods--superstate) call, are effectively dynamic references, possibly changing with each transition, and so the state method body simply cannot ascertain the semantic value of either one.

### [Lexical state context](#lexical-state-context)

What a state method requires is a lexical binding to the `State` in which it is defined — a reference that never changes, regardless of which descendant state may be inheriting the method.

So, instead of having the framework apply state methods in the context of the owner, we have it bind the context to the `State` that contains the method. The direct reference to the owner object is lost, but the owner is still easily retrieved with a call to [`this.owner()`](/api/#state--methods--owner), which of course returns the same owner no matter which of the owner’s `State`s `this` references.

{% highlight javascript %}
{% include examples/blog/2012-11-13/3.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/blog/2012-11-13/3.coffee %}
{% endhighlight %}

With this approach, authors of state methods trade referential equivalence, and some convenience — `this` versus the clunkier `this.owner()` — for insight into a whole other dimension of context. A concession to be sure, but on balance a good bargain: in every case, the new idioms `this`, `this.owner()`, and `this.superstate()` always mean what we expect them to.


## [The next dimension](#the-next-dimension)

The lexical binding approach, if syntactically a bit short of ideal, works plenty well so far as it goes: state methods can access their containing `State`, or a superstate, or any other node on their owner’s state tree.

However, we must still expand the context space one dimension further, along the axis of [the protostate–epistate relation](/docs/#concepts--inheritance--protostates) that follows the prototype chain of the owner object.

### [A three²-body problem](#a-three-squared-body-problem)

Given the solution devised thus far, consider a system of prototypally related stateful objects, keeping an eye out for the impending danger posed by [`protostate()`](/api/#state--methods--protostate).

Let’s use `Object.create` to rig up the prototypes:

{% highlight javascript %}
{% include examples/blog/2012-11-13/4.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/blog/2012-11-13/4.coffee %}
{% endhighlight %}

Alternatively we could just as well have gone the route of constructors/classes:

{% highlight javascript %}
{% include examples/blog/2012-11-13/5.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/blog/2012-11-13/5.coffee %}
{% endhighlight %}

In any case, the instance `o` inherits from a prototype, which in turn inherits from another prototype. At the middle position in this three-long prototype chain, method `m` of state `A` calls up to its overridden prototypal counterpart.

The lurking caveat here is less conspicuous, but not unlike the one encountered with the naïve binding of `this` to the owner. When `this.protostate()` is called from state `A` of the middle prototype, it returns state `A` of the upper prototype, as expected. But when the same is called from the inherited state `A` of the instance `o`, the prevailing context is now one prototype-level deeper, and `this.protostate()` returns `A` of the middle prototype.

The result of this will be the user unexpectedly seeing `m` called *twice* — once from within the state tree of `o`, and again from the tree of `o`’s prototype — as `this` climbs the protostate chain, with `m` repeatedly and unwittingly calling itself until `this` finally matches the `State` in which `m` is defined.

{% highlight javascript %}
{% include examples/blog/2012-11-13/6.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/blog/2012-11-13/6.coffee %}
{% endhighlight %}

### [Super-lexical, proto-dynamic](#super-lexical-proto-dynamic)

The problem is again a question of lexical versus dynamic bindings. While the method’s context is lexically bound along the superstate axis, because state methods may also be inherited from protostates, the method’s context is and must be dynamic along the protostate axis. Accordingly, its logic has no way to know which of the calling owner’s prototypes it belongs to, and so it cannot reason precisely about the meaning of `this.protostate()`.

In fact, this time there’s even less information available: whereas superstates are containers of substates, the concept of protostates is strictly an artifact of the owner object’s prototype chain. Just as a prototype has no knowledge of the objects that inherit from it, so too does a protostate know nothing about its inheriting epistates.

Simply binding `this` to the protostate from which it is inherited is therefore not an option, as this would clobber the semantic value of `this.owner()`, which must remain dynamic along the protostate axis, just as a normal method’s context is dynamic over the prototype chain.

An acceptable solution, therefore, will have to involve a combination of the necessary lexical and dynamic bindings.


## [Method transformation](#method-transformation)

State methods depend on more lexical information than a bound `this` by itself can provide. To deal with this confined space, a number of alternatives might be easily proposed, and even more easily dismissed:

* A special context object could hold property references to the necessary dynamic and lexical references; however, a new object would have to be created for each invocation, which has the potential to become prohibitively expensive.

* The arguments array must not be invaded; far too much confusion would arise from introducing inconsistencies across method signatures and calling patterns.

* Neither can `.protostate()` simply be sworn off and its use discouraged, as it is in many cases every bit as useful an idiom as `.superstate()`.

None of these ideas adequately build state methods with the environmental support they require. What’s needed is a way to automatically generate a new function using the provided function as a base.

### [`state.method`](#state-method)

Version [next] of **State.js** adds a new module-level function `state.method`, which rewrites a provided function to include relevant lexical bindings to the method’s `State` environment.

A rewritten function necessarily abandons the scope chain of the original, so to convey the lexical environment, authors may include a `bindings` object containing any variable bindings they want to have preserved within the generated method.

`state.method( bindings, fn )` : function

* [`bindings`] : object
* [`fn`] : function

This returns a function, based on the provided `fn`, closed over any provided bindings, along with variables `autostate`, `protostate`, `superstate`, and `owner`. If `bindings` is provided but `fn` is not, then a partially applied function is returned that will later accept a `fn` to be closed over `bindings`.

The `state.method` function is generally used within the `expression` object of a call to [`state()`](/api/#module) to explicitly define a state method whenever the aforementioned set of state–lexical bindings are expected within the method body.

{% highlight javascript %}
{% include examples/blog/2012-11-13/7.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/blog/2012-11-13/7.coffee %}
{% endhighlight %}


### [Under the hood](#under-the-hood)

Internally, the provided function is wrapped inside an outer function that takes the keys of the binding object as parameters. This wrapper function is then called with the corresponding binding values as arguments, which will return the enclosed function with those free variables bound, just as they were in the original function, except in a new flattened scope just one level deep.

Similarly, the desired lexical `State` references of `autostate` and `protostate` are embedded into the method’s closure, and variables for dynamic references of `superstate` for `this.superstate()` and `owner` for `this.owner()` are embedded at the top of the method body itself.

### [Revisiting the three²-body problem](#revisiting-the-three-squared-body-problem)

The stateful prototypes example can now be rewritten to make use of `state.method`:

{% highlight javascript %}
{% include examples/blog/2012-11-13/8.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/blog/2012-11-13/8.coffee %}
{% endhighlight %}

Or again with constructors/classes:

{% highlight javascript %}
{% include examples/blog/2012-11-13/9.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/blog/2012-11-13/9.coffee %}
{% endhighlight %}

With this syntax, we finally get the `protostate` and results we expect.

{% highlight javascript %}
{% include examples/blog/2012-11-13/10.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/blog/2012-11-13/10.coffee %}
{% endhighlight %}



## [Epilogue](#epilogue)

The inherent complexity of attending to a two-dimensional inheritance space might suggest the virtues of adhering instead to patterns of composition. Pursuing this with stateful objects requires that any such object be able to export its state tree, and here the [`StateExpression`](/source/state-expression) data structure and the [`express`](/api/state--methods--express) method assert their utility.

{% highlight javascript %}
state( target, source.state('').express() );
{% endhighlight %}
{% highlight coffeescript %}
state target, source.state('').express()
{% endhighlight %}

The call to `express` outputs a deep clone of the state tree as a `StateExpression`, which can be fed right into an outer `state()` call. Methods produced by `state.method` will be regenerated in their new environment as necessary. The dynamic prototypal relationship and the memory savings that follow are lost, but so too is the complexity that may have entailed.

And a-mixin’ we go …
