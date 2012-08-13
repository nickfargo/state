### [Events](#state--events)

#### [construct](#state--events--construct)

{% highlight javascript %}
function ( expression ) {}
{% endhighlight %}

{% highlight coffeescript %}
( expression ) ->
{% endhighlight %}

* `expression` : ( `StateExpression` | object )

Immediately after a `State` instance has been fully constructed, it emits a `construct` event.

Listeners receive the `expression` object from which the state was constructed.

Since construction is not complete until the state’s substates have themselves been constructed, the full `construct` event sequence of a state tree proceeds bottom-up.

{% highlight javascript %}
{% include examples/api/state/events--construct.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/events--construct.coffee %}
{% endhighlight %}


#### [destroy](#state--events--destroy)

{% highlight javascript %}
function () {}
{% endhighlight %}

{% highlight coffeescript %}
() ->
{% endhighlight %}

A state is properly deallocated with a call to the [`destroy` method](#state--methods--destroy) of either itself or a superstate. The `destroy` event is emitted immediately prior to the state and its contents being cleared.

Listeners of `destroy` are called with no arguments.


#### [depart](#state--events--depart)

{% highlight javascript %}
function ( transition ) {}
{% endhighlight %}

{% highlight coffeescript %}
( transition ) ->
{% endhighlight %}

* `transition` : `Transition`

At the beginning of a transition, exactly one `depart` event is always emitted by the state from which the transition originates.

Listeners receive a reference to the involved `transition`.

> [Transitional events](/docs/#concepts--events--transitional)


#### [exit](#state--events--exit)

{% highlight javascript %}
function ( transition ) {}
{% endhighlight %}

{% highlight coffeescript %}
( transition ) ->
{% endhighlight %}

* `transition` : `Transition`

During the *ascending phase* of a transition, an `exit` event is emitted by the origin state and any of its superstates that will no longer be active as a result of the transition.

Listeners receive a reference to the involved `transition`.

> [Transitional events](/docs/#concepts--events--transitional)


#### [enter](#state--events--enter)

{% highlight javascript %}
function ( transition ) {}
{% endhighlight %}

{% highlight coffeescript %}
( transition ) ->
{% endhighlight %}

* `transition` : `Transition`

During the *descending phase* of a transition, an `enter` event is emitted by each state that will become newly active, including the target state.

Listeners receive a reference to the involved `transition`.

> [Transitional events](/docs/#concepts--events--transitional)


#### [arrive](#state--events--arrive)

{% highlight javascript %}
function ( transition ) {}
{% endhighlight %}

{% highlight coffeescript %}
( transition ) ->
{% endhighlight %}

* `transition` : `Transition`

At the end of a transition, exactly one `arrive` event is always emitted by the transition’s target state.

Listeners receive a reference to the involved `transition`.

> [Transitional events](/docs/#concepts--events--transitional)


#### [mutate](#state--events--mutate)

{% highlight javascript %}
function ( mutation, delta, before, after ) {}
{% endhighlight %}

{% highlight coffeescript %}
( mutation, delta, before, after ) ->
{% endhighlight %}

* `mutation` : object
* `delta` : object
* `before` : object
* `after` : object

When a state’s contents are altered, it emits a `mutate` event containing the changes made relative to its immediately prior condition.

Listeners receive the contents of the `mutation` experienced by the state, the `delta` containing the contents displaced by the mutation, and a full expression of the state’s contents both `before` and `after` the mutation.


#### [noSuchMethod](#state--events--no-such-method)

{% highlight javascript %}
function ( methodName, args ) {}
{% endhighlight %}

{% highlight coffeescript %}
( methodName, args ) ->
{% endhighlight %}

* `methodName` : string
* `args` : `Array`

When a method is called on an object for which no implementation exists given its current state, a `noSuchMethod` event is emitted.

Listeners receive the `methodName` of the method that was called, and an `args` array of the arguments that were passed to the call.
