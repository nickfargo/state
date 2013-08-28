---
layout: post
title: "Concurrent dispatch: when implementations run together"
date: "2013-08-27T15:10:00-7:00"
tags: [methods, dispatch, concurrency, regions, orthogonal]

lede: "Preliminary thoughts on the **State**-ful coexistence of classical specific-first dispatch, alongside echoes of generic-first dispatch, as befits a system of **concurrent** [`State`](/api/#state)s."
---

> This post is an exploration of a proposed addition to **State.js** that is not yet implemented.



## [Of a classic](#of-a-classic)

First, a look at the familiar most-derived-first dispatch model exhibited by a simple state tree:

{% highlight javascript %}
{% include examples/blog/2013-08-27/1.js %}
{% endhighlight %}
{% highlight coffeescript %}
{% include examples/blog/2013-08-27/1.coffee %}
{% endhighlight %}

Here `owner` is in its `A` state, whose method `m` overrides the method `m` defined in the root state. Dispatch begins from the state that is current, so we hear a `"boop!"` rather than a `"beep!"`. This pattern, operating here over a hierarchy of `State`s, is essentially identical to that found in traditional `class` models, where methods resolve to the most-derived subclass.

This is all straightforward enough for a system that’s limited to one **currency** at a time: everything takes place entirely within a single `Region` (i.e. that defined by the tree’s `RootState`), and so proceeds in the classical manner, starting from the current state and inheriting upward (via **protostates** and/or **superstates**) as necessary.



## [Together, concurrency](#together-concurrency)

However, with an active `concurrent` state `C`, the multiple `Region`s contained within will also be active, with each attending to its own independent currency. Here we see two consequences of this: **(1)** how method dispatch is confined to the boundaries of the local `Region` (in this case that of the `RootState`), and **(2)** how dispatch can be imperatively extended deeper into each subregion, effectively “spreading” the method call in whatever manner the `concurrent` state’s implementation sees fit:

{% highlight javascript %}
{% include examples/blog/2013-08-27/2.js %}
{% endhighlight %}
{% highlight coffeescript %}
{% include examples/blog/2013-08-27/2.coffee %}
{% endhighlight %}

> 1. For this method `state.bind` is used to set `this` to reference `State C` rather than the `owner`.

> 2. The root’s `m` is overridden, but still reachable via `superstate`.

> 3. As the root region by definition ends at the concurrent state, dispatch into the multiple regional substates must proceed explicitly. The `dispatch` method automatically delegates to the receiving `Region`’s current state.

> 4. The multiple results can be returned or reduced in any manner. Here strings are expected, so the reduction could be a simple `join` operation.

> 5. By definition, the substates of a `concurrent` state define `Region`s.

With this definition of the `owner`’s state, we observe:

{% highlight javascript %}
{% include examples/blog/2013-08-27/3.js %}
{% endhighlight %}
{% highlight coffeescript %}
{% include examples/blog/2013-08-27/3.coffee %}
{% endhighlight %}

In the initial configuration of this system, `owner` begins in state `A` as before, with no active concurrency, and its `m` method behaves accordingly.

Next, a transition of the `RootState` region’s currency from state `A` to state `C` activates the regions of `C` and initializes their respective currencies. Calling `owner.m()` now reaches the implementation at `C`, which distributes the dispatch to its subregions.

Finally, the `CA` region’s currency is transitioned from state `CAA` to state `CAB`, demonstrating a concurrent change in the specific behavior of `m`.


### [What to do when nobody’s home](#what-to-do-when-nobodys-home)

Now, what if an active `concurrent` state contains no implementation for a method? In this model the answer is simple, if unsatisfying: because the reach of a dispatcher is confined to the instigating `Region`, and has no specific instructions on how to distribute the dispatch into the concurrent subregions, it has no choice but to proceed back up the superstate chain in the classical manner, away from any `Region`s which may themselves have contained an implementation for the method.

It’s an understandable concession for the general case, but introducing a slightly more restrictive definition of concurrency can yield a better way.



## [Separately, orthogonality](#separately-orthogonality)

As shown thus far, a `Region`’s implementation of a method must always be dispatched from an implementation defined in its `concurrent` superstate. An alternative to this requirement is to include an `orthogonal` attribute with the `concurrent` state, which signals the dispatcher to expect that no method will be implemented in any more than one of the subordinate `Region`s, and therefore that the `Region`ed method’s output can be returned directly to the dispatcher.

{% highlight javascript %}
{% include examples/blog/2013-08-27/4.js %}
{% endhighlight %}
{% highlight coffeescript %}
{% include examples/blog/2013-08-27/4.coffee %}
{% endhighlight %}

In this case, when a method is not implemented on the `concurrent` state itself, rather than immediately bouncing off the region boundary and back up to a more generic `State`, the dispatcher will delve into each of the regions in search of the method’s unique specific implementation.

{% highlight javascript %}
{% include examples/blog/2013-08-27/5.js %}
{% endhighlight %}
{% highlight coffeescript %}
{% include examples/blog/2013-08-27/5.coffee %}
{% endhighlight %}

If it turns out that the method is indeed unique to a particular `Region`, then that implementation is invoked, and its result is returned to the dispatcher. If the method resolution is ambiguous across multiple regions, then orthogonality is violated; the method cannot be resolved (it should also result in an `ambiguousDispatch:` event), and dispatch is sent back up the superstate chain from the `concurrent` state in the usual fashion.



## [References](#references)


0. [The Impoliteness of Overriding Methods][0] — BETA-style generic-first dispatch




[0]: http://journal.stuffwithstuff.com/2012/12/19/the-impoliteness-of-overriding-methods/