### [Properties](#state--properties)


#### [name](#state--properties--name)

{% highlight javascript %}
this.name
{% endhighlight %}

The string name of `this` state.

{% highlight javascript %}
{% include examples/api/state/properties--name.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/properties--name.coffee %}
{% endhighlight %}

> See also:
> [**path**](#state--methods--path)

> [`State` constructor](/source/#state--constructor)


#### [owner](#state--properties--owner)

{% highlight javascript %}
this.owner
{% endhighlight %}

References the object that is the **owner** of `this` state.

{% highlight javascript %}
{% include examples/api/state/properties--owner.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/properties--owner.coffee %}
{% endhighlight %}

> [`State::owner`](/source/#state--prototype--owner)


#### [root](#state--properties--root)

{% highlight javascript %}
this.root
{% endhighlight %}

References the `RootState` of the state tree to which `this` state belongs.

{% highlight javascript %}
{% include examples/api/state/properties--root.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/properties--root.coffee %}
{% endhighlight %}

> [The root state](/docs/#concepts--inheritance--the-root-state)
> [`State::root`](/source/#state--prototype--root)


#### [superstate](#state--properties--superstate)

{% highlight javascript %}
this.superstate
{% endhighlight %}

References the `State` that is `this` state’s immediate superstate.

{% highlight javascript %}
{% include examples/api/state/properties--superstate.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/properties--superstate.coffee %}
{% endhighlight %}

> [Superstates and substates](/docs/#concepts--inheritance--superstates-and-substates)
> [`State::superstate`](/source/#state--prototype--superstate)
