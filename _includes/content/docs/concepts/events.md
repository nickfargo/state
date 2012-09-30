### [Events](#concepts--events)

Events in **State** follow the familiar **emitter** pattern: `State` exposes methods `emit` (aliased to `trigger`) for emitting typed events, and `addEvent`/`removeEvent` (aliased to `on`/`off` and `bind`/`unbind`) for assigning listeners to a particular event type.

<div class="local-toc"></div>

#### [Existential events](#concepts--events--existential)

##### construct

After a state has been fully constructed, it emits a `construct` event. 

> [construct](/api/#state--events--construct)


##### destroy

Immediately before a state is cleared from its superstate, or before the owner object’s state implementation is destroyed in the case of a root state, it emits a `destroy` event.

> [destroy](/api/#state--events--destroy)


#### [Transitional events](#concepts--events--transitional)

During a transition’s traversal from its origin state to its target state, the transition and all affected states along the way emit certain types of events that describe the transition’s progression. A sequence of transitional events always proceeds in the order listed here.

> See also: [**The transition lifecycle**](#concepts--transitions--lifecycle)

##### depart (`State`)

The beginning of the transition consists of exactly one `depart` event that is always emitted from the origin state.

> [depart](/api/#state--events--depart)

##### enter (`Transition`)

Next the owner object’s currency is passed from the origin state to the new `Transition`, and the transition emits an `enter` event.

> [enter](/api/#transition--events--enter)

##### exit (`State`)

This is followed by the *ascending phase* of the transition, which consists of zero or more `exit` events, one each from amongst the origin state and any of its superstates that will no longer be active as a result of the transition.

> [exit](/api/#state--events--exit)

##### start (`Transition`)

When the transition reaches the top of its domain, the ascending phase ends and the *action phase* begins. The transition emits a `start` event, and its *action* function is invoked.

> [start](/api/#transition--events--start)

##### end (`Transition`)

When the transition’s action function calls [`end`](/api/#transition--methods--end), signifying the end of its action phase, the transition emits an `end` event, and the *descending phase* begins.

> [end](/api/#transition--events--end)

##### enter (`State`)

The descending phase of the transition consists of zero or more `enter` events, one for each state that will become newly active.

> [enter](/api/#state--events--enter)

##### exit (`Transition`)

After the transition has `enter`ed its target state, the descending phase ends, the transition emits an `exit` event, and the object’s currency is passed from the transition to the target state.

> [exit](/api/#transition--events--exit)

##### arrive (`State`)

Finally, an `arrive` event will occur exactly once, specifically at the target state, marking the end of the transition.

> [arrive](/api/#state--events--arrive)


#### [Mutation events](#concepts--events--mutation)

##### mutate

When a state’s contents are altered, it emits a `mutate` event containing the changes made relative to its immediately prior condition.

Listeners receive four objects as arguments: the contents of the `mutation` experienced by the state, the `delta` containing the contents displaced by the mutation, and a full expression of the state’s contents both `before` and `after` the mutation.

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

#### [Using events to express determinism](#concepts--events--expressing-determinism)

An event listener may also be expressed simply as a State name, which is interpreted as an order to transition to that State after all of an event’s callbacks have been invoked. This bit of shorthand allows for concise expression of deterministic behavior, where the occurrence of a particular event type within a particular State has a definitive, unambiguous effect on the state of the object.

{% highlight javascript %}
{% include examples/docs/events--divisible-by-three-computer.js %}
{% endhighlight %}
{% highlight coffeescript %}
{% include examples/docs/events--divisible-by-three-computer.coffee %}
{% endhighlight %}

<div class="backcrumb">
⏎  <a class="section" href="#concepts--events">Events</a>  &lt;  <a href="#concepts">Concepts</a>  &lt;  <a href="#overview">Overview</a>
</div>
