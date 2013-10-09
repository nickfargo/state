### [Events](#transition--events)

#### [enter](#transition--events--enter)

{% highlight javascript %}
function () {}
{% endhighlight %}

{% highlight coffeescript %}
->
{% endhighlight %}

Immediately after currency is transferred to the transition from the source state, the transition emits an `enter` event.

> [Transitional events](/docs/#concepts--events--transitional)


#### [start](#transition--events--start)

{% highlight javascript %}
function ( args... ) {}
{% endhighlight %}

{% highlight coffeescript %}
( args... ) ->
{% endhighlight %}

* `args...` : `var`

In the [`change`](#state--methods--change) call that instigated a transition, if the `options` argument included an `args` array, then these elements of `options.args` are passed as arguments to the transition’s [`start` method](#transition--methods--start), which relays them to listeners of the `start` event.

> [Transitional events](/docs/#concepts--events--transitional)


#### [end](#transition--events--end)

{% highlight javascript %}
function ( args... ) {}
{% endhighlight %}

{% highlight coffeescript %}
( args... ) ->
{% endhighlight %}

* `args...` : `var`

A transition’s action phase is ended by calling its [`end` method](#transition--events--end), and any arguments it receives are relayed to listeners of the transition’s `end` event.

If the transition bears no action, then arguments relayed to listeners of the transition’s [`start` event](#transition--events--start) are also relayed to listeners of the `end` event, which is emitted immediately after `start`.

> [Transitional events](/docs/#concepts--events--transitional)


#### [exit](#transition--events--exit)

{% highlight javascript %}
function () {}
{% endhighlight %}

{% highlight coffeescript %}
->
{% endhighlight %}

Just before currency is transferred from a transition to its target state, an `exit` event is emitted by the transition.

> [Transitional events](/docs/#concepts--events--transitional)
