### [Events](#state--events)

#### [construct](#state--events--construct)

###### SYNTAX

{% highlight javascript %}
function ( expression ) {}
{% endhighlight %}

{% highlight coffeescript %}
( expression ) ->
{% endhighlight %}

###### PARAMETERS

* `expression` : ( `StateExpression` | object )

###### DESCRIPTION

Immediately after a `State` instance has been fully constructed, it emits a `construct` event.

Listeners receive the `expression` object from which the state was constructed.

Since construction is not complete until the state’s substates have themselves been constructed, the full `construct` event sequence of a state tree proceeds bottom-up.

###### EXAMPLE

{% highlight javascript %}
{% include examples/api/state/events--construct.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/events--construct.coffee %}
{% endhighlight %}

###### SEE ALSO

> [Existential events](/docs/#concepts--events--existential)


#### [destroy](#state--events--destroy)

###### SYNTAX

{% highlight javascript %}
function () {}
{% endhighlight %}

{% highlight coffeescript %}
->
{% endhighlight %}

###### DESCRIPTION

A state is properly deallocated with a call to the [`destroy` method](#state--methods--destroy) of either itself or a superstate. The `destroy` event is emitted immediately prior to the state and its contents being cleared.

Listeners of `destroy` are called with no arguments.

###### SEE ALSO

> [Existential events](/docs/#concepts--events--existential)


#### [depart](#state--events--depart)

###### SYNTAX

{% highlight javascript %}
function ( transition ) {}
{% endhighlight %}

{% highlight coffeescript %}
( transition ) ->
{% endhighlight %}

###### PARAMETERS

* `transition` : `Transition`

###### DESCRIPTION

At the beginning of a transition, exactly one `depart` event is always emitted by the state from which the transition originates.

Listeners receive a reference to the involved `transition`.

###### SEE ALSO

> [Transitional events](/docs/#concepts--events--transitional)


#### [exit](#state--events--exit)

###### SYNTAX

{% highlight javascript %}
function ( transition ) {}
{% endhighlight %}

{% highlight coffeescript %}
( transition ) ->
{% endhighlight %}

###### PARAMETERS

* `transition` : `Transition`

###### DESCRIPTION

During the *ascending phase* of a transition, an `exit` event is emitted by the origin state and any of its superstates that will no longer be active as a result of the transition.

Listeners receive a reference to the involved `transition`.

###### SEE ALSO

> [Transitional events](/docs/#concepts--events--transitional)


#### [enter](#state--events--enter)

###### SYNTAX

{% highlight javascript %}
function ( transition ) {}
{% endhighlight %}

{% highlight coffeescript %}
( transition ) ->
{% endhighlight %}

###### PARAMETERS

* `transition` : `Transition`

###### DESCRIPTION

During the *descending phase* of a transition, an `enter` event is emitted by each state that will become newly active, including the target state.

Listeners receive a reference to the involved `transition`.

###### SEE ALSO

> [Transitional events](/docs/#concepts--events--transitional)


#### [arrive](#state--events--arrive)

###### SYNTAX

{% highlight javascript %}
function ( transition ) {}
{% endhighlight %}

{% highlight coffeescript %}
( transition ) ->
{% endhighlight %}

###### PARAMETERS

* `transition` : `Transition`

###### DESCRIPTION

At the end of a transition, exactly one `arrive` event is always emitted by the transition’s target state.

Listeners receive a reference to the involved `transition`.

###### SEE ALSO

> [Transitional events](/docs/#concepts--events--transitional)


#### [mutate](#state--events--mutate)

###### SYNTAX

{% highlight javascript %}
function ( mutation, residue, before, after ) {}
{% endhighlight %}

{% highlight coffeescript %}
( mutation, residue, before, after ) ->
{% endhighlight %}

###### PARAMETERS

* `mutation` : object
* `residue` : object
* `before` : object
* `after` : object

###### DESCRIPTION

When a state’s contents are altered, it emits a `mutate` event containing the changes made relative to its immediately prior condition.

Listeners receive the contents of the `mutation` experienced by the state, the `residue` containing the contents displaced by the mutation, and a full expression of the state’s contents both `before` and `after` the mutation.

###### SEE ALSO

> [`mutate` (method)](#state--methods--mutate)

> [`State::mutate`](/source/state.html#state--prototype--mutate)


#### [noSuchMethod](#state--events--no-such-method)

###### SYNTAX

{% highlight javascript %}
function ( methodName, args ) {}
{% endhighlight %}

{% highlight coffeescript %}
( methodName, args ) ->
{% endhighlight %}

###### PARAMETERS

* `methodName` : string
* `args` : `Array`

###### DESCRIPTION

When a method is called on an object for which no implementation exists given its current state, a `noSuchMethod` event is emitted.

Listeners receive the `methodName` of the method that was called, and an `args` array of the arguments that were passed to the call.

###### SEE ALSO

> [`State::apply`](/source/state.html#state--prototype--apply)


#### [noSuchMethod:name](#state--events--no-such-method-name)

###### SYNTAX

{% highlight javascript %}
function ( arg0, arg1, ... ) {}
{% endhighlight %}

{% highlight coffeescript %}
( args... ) ->
{% endhighlight %}

###### PARAMETERS

* `args...` : `var`

###### DESCRIPTION

A generic [`noSuchMethod`](#state--events--no-such-method) event is immediately followed by the emission of a specific `noSuchMethod:name` event, where `name` specifies the method that was called.

Listeners receive the arguments as they were passed to the call.

###### SEE ALSO

> [`State::apply`](/source/state.html#state--prototype--apply)
