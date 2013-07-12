### [Events](#state--events)

#### [construct](#state--events--construct)

###### Syntax

{% highlight javascript %}
function ( expression ) {}
{% endhighlight %}

{% highlight coffeescript %}
( expression ) ->
{% endhighlight %}

###### Parameters

* `expression` : ( `StateExpression` | object )

###### Description

Immediately after a `State` instance has been fully constructed, it emits a `construct` event.

Listeners receive the `expression` object from which the state was constructed.

Since construction is not complete until the state’s substates have themselves been constructed, the full `construct` event sequence of a state tree proceeds bottom-up.

###### Example

{% highlight javascript %}
{% include examples/api/state/events--construct.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/events--construct.coffee %}
{% endhighlight %}

###### See also

> [Existential events](/docs/#concepts--events--existential)


#### [destroy](#state--events--destroy)

###### Syntax

{% highlight javascript %}
function () {}
{% endhighlight %}

{% highlight coffeescript %}
() ->
{% endhighlight %}

###### Description

A state is properly deallocated with a call to the [`destroy` method](#state--methods--destroy) of either itself or a superstate. The `destroy` event is emitted immediately prior to the state and its contents being cleared.

Listeners of `destroy` are called with no arguments.

###### See also

> [Existential events](/docs/#concepts--events--existential)


#### [depart](#state--events--depart)

###### Syntax

{% highlight javascript %}
function ( transition ) {}
{% endhighlight %}

{% highlight coffeescript %}
( transition ) ->
{% endhighlight %}

###### Parameters

* `transition` : `Transition`

###### Description

At the beginning of a transition, exactly one `depart` event is always emitted by the state from which the transition originates.

Listeners receive a reference to the involved `transition`.

###### See also

> [Transitional events](/docs/#concepts--events--transitional)


#### [exit](#state--events--exit)

###### Syntax

{% highlight javascript %}
function ( transition ) {}
{% endhighlight %}

{% highlight coffeescript %}
( transition ) ->
{% endhighlight %}

###### Parameters

* `transition` : `Transition`

###### Description

During the *ascending phase* of a transition, an `exit` event is emitted by the origin state and any of its superstates that will no longer be active as a result of the transition.

Listeners receive a reference to the involved `transition`.

###### See also

> [Transitional events](/docs/#concepts--events--transitional)


#### [enter](#state--events--enter)

###### Syntax

{% highlight javascript %}
function ( transition ) {}
{% endhighlight %}

{% highlight coffeescript %}
( transition ) ->
{% endhighlight %}

###### Parameters

* `transition` : `Transition`

###### Description

During the *descending phase* of a transition, an `enter` event is emitted by each state that will become newly active, including the target state.

Listeners receive a reference to the involved `transition`.

###### See also

> [Transitional events](/docs/#concepts--events--transitional)


#### [arrive](#state--events--arrive)

###### Syntax

{% highlight javascript %}
function ( transition ) {}
{% endhighlight %}

{% highlight coffeescript %}
( transition ) ->
{% endhighlight %}

###### Parameters

* `transition` : `Transition`

###### Description

At the end of a transition, exactly one `arrive` event is always emitted by the transition’s target state.

Listeners receive a reference to the involved `transition`.

###### See also

> [Transitional events](/docs/#concepts--events--transitional)


#### [mutate](#state--events--mutate)

###### Syntax

{% highlight javascript %}
function ( mutation, residue, before, after ) {}
{% endhighlight %}

{% highlight coffeescript %}
( mutation, residue, before, after ) ->
{% endhighlight %}

###### Parameters

* `mutation` : object
* `residue` : object
* `before` : object
* `after` : object

###### Description

When a state’s contents are altered, it emits a `mutate` event containing the changes made relative to its immediately prior condition.

Listeners receive the contents of the `mutation` experienced by the state, the `residue` containing the contents displaced by the mutation, and a full expression of the state’s contents both `before` and `after` the mutation.

###### See also

> [`State.privileged.mutate` (method)](/source/#state--privileged--mutate)


#### [noSuchMethod](#state--events--no-such-method)

###### Syntax

{% highlight javascript %}
function ( methodName, args ) {}
{% endhighlight %}

{% highlight coffeescript %}
( methodName, args ) ->
{% endhighlight %}

###### Parameters

* `methodName` : string
* `args` : `Array`

###### Description

When a method is called on an object for which no implementation exists given its current state, a `noSuchMethod` event is emitted.

Listeners receive the `methodName` of the method that was called, and an `args` array of the arguments that were passed to the call.

###### See also

> [`State::apply`](/source/#state--prototype--apply)


#### [noSuchMethod:name](#state--events--no-such-method-name)

###### Syntax

{% highlight javascript %}
function ( arg0, arg1, ... ) {}
{% endhighlight %}

{% highlight coffeescript %}
( args... ) ->
{% endhighlight %}

###### Parameters

* `argN` : `var`

###### Description

A generic [`noSuchMethod`](#state--events--no-such-method) event is immediately followed by the emission of a specific `noSuchMethod:name` event, where `name` specifies the method that was called.

Listeners receive the arguments as they were passed to the call.

###### See also

> [`State::apply`](/source/#state--prototype--apply)
