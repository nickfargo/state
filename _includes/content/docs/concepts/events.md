### [Events](#concepts--events)

Events in **State** follow the familiar **emitter** pattern: `State` exposes methods `emit` (aliased to `trigger`) for emitting typed events, and `addEvent`/`removeEvent` (aliased to `on`/`off` and `bind`/`unbind`) for assigning listeners to a particular event type.

<div class="local-toc"></div>

#### [Existential events](#concepts--events--existential)

> [construct](/api/#state--events--construct)
> [destroy](/api/#state--events--destroy)

Immediately after a state has been fully constructed, it emits a `construct` event. Likewise, immediately before a state is cleared from its superstate, or before the owner object’s state implementation is destroyed in the case of a root state, it emits a `destroy` event.



#### [Transitional events](#concepts--events--transitional)

> `State` :
> [depart](/api/#state--events--depart)
> [exit](/api/#state--events--exit)
> [enter](/api/#state--events--enter)
> [arrive](/api/#state--events--arrive)

> `Transition` :
> [enter](/api/#transition--events--enter)
> [start](/api/#transition--events--start)
> [end](/api/#transition--events--end)
> [exit](/api/#transition--events--exit)

During a transition’s traversal from its origin state to its target state, the transition and all affected states along the way emit a sequence of events describing the transition’s progression.


##### Event sequence

`State` : [**depart**](/api/#state--events--depart) — The beginning of the transition consists of exactly one `depart` event that is always emitted from the origin state.

`Transition` : [**enter**](/api/#transition--events--enter) — Next the owner object’s currency is passed from the origin state to the new `Transition`, and the transition emits an `enter` event.

`State` : [**exit**](/api/#state--events--exit) — This is followed by the *ascending phase* of the transition, which consists of zero or more `exit` events, one each from amongst the origin state and any of its superstates that will no longer be active as a result of the transition.

`Transition` : [**start**](/api/#transition--events--start) — When the transition reaches the top of its domain, the ascending phase ends and the *action phase* begins. The transition emits a `start` event, and its *action* function is invoked.

`Transition` : [**end**](/api/#transition--events--end) — When the transition’s [`end`](/api/#transition--methods--end) method is called, it emits an `end` event, and the *descending phase* begins.

`State` : [**enter**](/api/#state--events--enter) — The descending phase of the transition consists of zero or more `enter` events, one for each state that will become newly active.

`Transition` : [**exit**](/api/#transition--events--exit) — After the transition has `enter`ed its target state, the descending phase ends, the transition emits an `exit` event, and the object’s currency is passed from the transition to the target state.

`State` : [**arrive**](/api/#state--events--arrive) — Finally, an `arrive` event will occur exactly once, specifically at the target state, marking the end of the transition.


###### See also

[**The transition lifecycle**](#concepts--transitions--lifecycle)



#### [Mutation events](#concepts--events--mutation)

> [mutate](/api/#state--events--mutate)

When a state’s contents are altered, it emits a `mutate` event containing the changes made relative to its immediately prior condition.

Listeners receive four objects as arguments: the contents of the `mutation` experienced by the state, a `delta` object containing the contents displaced by the mutation, and a full expression of the state’s contents both `before` and `after` the mutation.

{% highlight javascript %}
{% include examples/docs/events--mutation.js %}
{% endhighlight %}
{% highlight coffeescript %}
{% include examples/docs/events--mutation.coffee %}
{% endhighlight %}

> [`state/mutation.js`](/source/#state--mutation.js)

#### [Custom event types](#concepts--events--custom)

A state’s `emit` method allows any type of event to be broadcast and consumed.

{% highlight javascript %}
{% include examples/docs/events--custom.js %}
{% endhighlight %}
{% highlight coffeescript %}
{% include examples/docs/events--custom.coffee %}
{% endhighlight %}

> [`State.privileged.emit`](/source/#state--privileged--emit)

#### [Using events to express simple determinism](#concepts--events--expressing-determinism)

An event listener may also be expressed as just a state selector, which is interpreted as an order to transition to the indicated state after all of an event’s callbacks have been invoked. This bit of shorthand allows for concise expression of deterministic behavior, where the occurrence of a particular event type within a particular state has a definitive, unambiguous effect on the object’s currency.

{% highlight javascript %}
{% include examples/docs/events--divisible-by-three-computer.js %}
{% endhighlight %}
{% highlight coffeescript %}
{% include examples/docs/events--divisible-by-three-computer.coffee %}
{% endhighlight %}

<div class="backcrumb">
⏎  <a class="section" href="#concepts--events">Events</a>  &lt;  <a href="#concepts">Concepts</a>  &lt;  <a href="#overview">Overview</a>
</div>
