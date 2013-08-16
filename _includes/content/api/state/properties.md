### [Properties](#state--properties)


#### [name](#state--properties--name)

The string name of `this` state.

###### Syntax

{% highlight javascript %}
this.name
{% endhighlight %}

###### Example

{% highlight javascript %}
{% include examples/api/state/properties--name.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/properties--name.coffee %}
{% endhighlight %}

###### See also

> [**path**](#state--methods--path)

> [`State` constructor](/source/state.html#state--constructor)


#### [owner](#state--properties--owner)

References the object that is the **owner** of `this` state.

###### Syntax

{% highlight javascript %}
this.owner
{% endhighlight %}

###### Example

{% highlight javascript %}
{% include examples/api/state/properties--owner.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/properties--owner.coffee %}
{% endhighlight %}

###### See also

> [`State` constructor](/source/state.html#state--constructor)


#### [root](#state--properties--root)

References the `RootState` of the state tree to which `this` state belongs.

###### Syntax

{% highlight javascript %}
this.root
{% endhighlight %}

###### Example

{% highlight javascript %}
{% include examples/api/state/properties--root.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/properties--root.coffee %}
{% endhighlight %}

###### See also

> [The root state](/docs/#concepts--inheritance--the-root-state)
> [`State` constructor](/source/state.html#state--constructor)


#### [superstate](#state--properties--superstate)

References the `State` that is `this` state’s immediate superstate.

###### Syntax

{% highlight javascript %}
this.superstate
{% endhighlight %}

###### Example

{% highlight javascript %}
{% include examples/api/state/properties--superstate.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/properties--superstate.coffee %}
{% endhighlight %}

###### See also

> [Superstates and substates](/docs/#concepts--inheritance--superstates-and-substates)
> [`State` constructor](/source/state.html#state--constructor)


#### [protostate](#state--properties--protostate)

References the `State` that is `this` state’s immediate protostate.

###### Syntax

{% highlight javascript %}
this.protostate
{% endhighlight %}

###### Example

{% highlight javascript %}
{% include examples/api/state/properties--protostate.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/properties--protostate.coffee %}
{% endhighlight %}

###### See also

> [Protostates and epistates](/docs/#concepts--inheritance--protostates-and-epistates)
> [`State` constructor](/source/state.html#state--constructor)
