---
layout: post
title: Lexical binding in state methods
date: "2012-11-13T19:10:34+08:00"
tags: [methods, lexical binding]

lede: Binding a [state method](/docs/#concepts--methods)’s context to its containing [`State`](/api/#state) provides invocations of that method with useful information about the state’s hierarchical position within the owner object’s [state tree](/docs/#concepts--inheritance). When the invoked method is inherited from a [**protostate**](/docs/#concepts--inheritance--protostates), however, `this` by itself lacks any expression of the protostate’s relation to the state from which the method is being invoked. To that end, we devise a means for reflecting a method’s complete state–lexical environment into the body of a method function.
---

## [Serving two masters](#serving-two-masters)

States can hold methods, which can serve as [delegation targets](/docs/#concepts--methods--delegators) for the methods of a stateful owner object. Just as normal methods use `this` to reference the object they serve, state methods also require a reference to a context.

However, a wrinkle is added by the arrangement of `State`s into hierarchies and across prototypes. A state method must serve both its containing `State` as well as the owner, and so it needs to hold multiple contextual references — something that cannot be facilitated directly by `this` alone.

### [The naïve approach](#the-naive-approach)

Least-surprise might suggest that, since state methods are meant to act as stand-ins for methods of the owner, they ought to be applied accordingly, in the context of the owner.

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

This is the approach employed by **State.js**. Referential equivalence, and some convenience — `this` versus the clunkier `this.owner()` — is traded for insight into a whole other dimension of context. A concession to be sure, but on balance a good bargain: in every case, the new idioms `this`, `this.owner()`, and `this.superstate()` always mean what we expect them to.


## [The next dimension](#the-next-dimension)

The lexical binding approach, if syntactically a bit short of ideal, works plenty well so far as it goes — state methods can access their containing `State`, or a superstate, or any other node on their owner’s state tree.

However, we must still expand the context space one dimension further, along the axis of [the protostate–epistate relation](/docs/#concepts--inheritance--protostates) that follows the prototype chain of the owner object.

### [A three²-body problem](#a-three-squared-body-problem)

Given the solution devised thus far, consider a set of prototypally related stateful objects, keeping an eye out for the impending danger posed by [`protostate()`](/api/#state--methods--protostate).

{% highlight javascript %}
{% include examples/blog/2012-11-13/4.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/blog/2012-11-13/4.coffee %}
{% endhighlight %}

Instance `o` inherits from its prototype `p`, which in turn inherits from `q`, while method `m` of `p.state('A')` makes a call up to its overridden counterpart at `q.state('A')`, its protostate.

The peril here is less conspicuous, but not unlike that encountered previously. When `this.protostate()` is called from `m` of `p.state('A')`, it returns `q.state('A')`, as expected. But when `o.state('A')` inherits and invokes that very same method `m`, the prevailing context is now one prototype level deeper, and the expression `this.protostate()` returns state `A` of `p`, rather than the expected `A` of `q`.

The result of this pattern will be the user unexpectedly seeing `m` called multiple times — once from within the state tree of `o`, and again from the tree of `p` — as `this` climbs the protostate chain, with `m` repeatedly and unwittingly calling itself until its `this` finally matches the precise `State` in which `m` is defined.

{% highlight javascript %}
{% include examples/blog/2012-11-13/5.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/blog/2012-11-13/5.coffee %}
{% endhighlight %}

### [`this` — super-lexical, proto-dynamic](#this-super-lexical-proto-dynamic)

The lingering problem is again a question of lexical versus dynamic bindings. While a state method’s context is **lexically bound along the superstate axis**, because methods may also be inherited from protostates, its context is, and must be, **dynamically bound along the protostate axis**.

> This relationship can be expressed as an invariant: given object `o` with prototypes `p`, `q`, etc., whenever a state method is called on behalf of `o`, it must assert that `this.owner() === o`. That is, its `this` will always reference a `State` in the state tree of `o` — regardless of whether the method is defined in a `State` of `o`, or is inherited from a `State` of `p`, `q`, or any other prototype of `o`.

The consequence of this invariance is that a state method has no way to determine from its `this` context alone which of the calling owner’s prototypes the method belongs to. It also follows, then, that it is impossible to have precise lexical knowledge about the value of the expression `this.protostate()`.

An acceptable solution, therefore, will have to involve a combination of relevant lexical and dynamic bindings.


## [Method transformation](#method-transformation)

State methods depend on more lexical information than a bound `this` by itself can provide. To deal with this confined space, a number of alternatives might be easily proposed, but just as easily dismissed:

* A special context object could hold property references to the necessary dynamic and lexical references; however, a new object would have to be created for each invocation, which has the potential to become prohibitively expensive.

* Lexically binding `this` to the precise `State` in which the method is defined would give precise meaning to `this.protostate()`; but this would violate the invariance of `this.owner()` referring to the calling object.

* The arguments array must not be invaded; far too much confusion would arise from introducing inconsistencies across method signatures and calling patterns.

* Neither can protostates simply be sworn off and their use discouraged, as they are in many cases every bit as useful a relation as superstates.

None of these address the issue of adequately equipping state methods with the lexical support they require. What’s needed is a way to automatically generate a new function, using the provided function as a base, that closes over the method’s static environment.

### [Lexical state methods](#lexical-state-methods)

Version **0.0.7** of **State.js** adds a module-level function called [`state.method`](/api/#module--method), which facilitates the creation of **lexical state methods** by transforming a provided function into one that includes relevant lexical bindings to the `State` objects that define the method’s environment.

It’s important to note that a rewritten function necessarily abandons the scope chain of its original, so to reproduce the scoping environment, authors may include a `bindings` object containing any variable bindings they want preserved for use within the generated method.

#### [The method factory](#the-method-factory)

`state.method( bindings, fn )` : function

* [`bindings`] : object
* [`fn`] : function

Calling `state.method` creates and returns a **factory**, a higher-order function which produces a lexical state method that is the transformation of `fn` appropriated to the `State` in which the method is defined. The generated method is closed over any provided `bindings`, and includes additional bindings for the special variables `autostate`, `protostate`, `superstate`, and `owner`.

If no `fn` is provided, then a function partially applied with `bindings` is returned, which will later accept a `fn` and return the lexical state method factory as described above.

The factory may be passed around at will, but it can only be called internally by **State.js**. This occurs either during the construction of a `State` instance when the lexical environment is first created, or as methods are added to an existing mutable `State`.

#### [`state.method` in action](#state-method-in-action)

The `state.method` function is generally used within the `expression` object of a call to [`state()`](/api/#module) to explicitly define a state method whenever the aforementioned set of state–lexical bindings are expected within the method body.

{% highlight javascript %}
{% include examples/blog/2012-11-13/6.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/blog/2012-11-13/6.coffee %}
{% endhighlight %}


### [Revisiting the “three²-body problem”](#revisiting-the-three-squared-body-problem)

Now that we have `state.method` we can rewrite the stateful prototypes example:

{% highlight javascript %}
{% include examples/blog/2012-11-13/8.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/blog/2012-11-13/8.coffee %}
{% endhighlight %}

With this syntax, we finally get the `protostate` and results we expect.

{% highlight javascript %}
{% include examples/blog/2012-11-13/9.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/blog/2012-11-13/9.coffee %}
{% endhighlight %}

### [Under the hood](#under-the-hood)

Internally, the provided function is wrapped inside an outer function that takes the keys of the binding object as parameters. This wrapper function is then called with the corresponding binding values as arguments, which will return the enclosed function with those free variables bound, just as they were in the original function, except in a new flattened scope just one level deep.

Similarly, the desired lexical `State` references of `autostate` and `protostate` are embedded into the method’s closure, and variables for dynamic references of `superstate` for `this.superstate()` and `owner` for `this.owner()` are embedded at the top of the method body itself.

> [View source: `state.method`](/source/#module--method)


## [Epilogue](#epilogue)

### [And then there was composition](#and-then-there-was-composition)

For some, the extra layer of complexity that arises from a two-dimensional inheritance space may be enough to suggest or reinforce the virtues of adhering to patterns of composition rather than inheritance.

Exercising composition with stateful objects requires that any such object be able to cleanly export its state tree, so that it can be “mixed-in” to another object. Here the [`StateExpression`](/source/#state-expression) data structure and the [`express`](/api/#state--methods--express) method assert their utility.

{% highlight javascript %}
state( target, source.state('').express() );
{% endhighlight %}
{% highlight coffeescript %}
state target, source.state('').express()
{% endhighlight %}

An existing [mutable state](/docs/#concepts--attributes--mutability) can also be targeted, by calling its [`mutate`](/api/#state--methods--mutate) method:

{% highlight javascript %}
target.state('').mutate( source.state('').express() );
{% endhighlight %}
{% highlight coffeescript %}
target.state('').mutate source.state('').express()
{% endhighlight %}

The call to `express` from the root state outputs a deep clone of the entire tree as a `StateExpression`, which can be fed right into [`state()`](/api/#module) or `mutate()`. Methods produced by `state.method` will be regenerated in their new environment as necessary. Lost are the dynamic prototypal relationship and the memory savings that follow, but, depending on your point view, so too may be some of the complexity and rigidity that such a model might have entailed.
