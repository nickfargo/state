### [Properties](#state--properties)


#### [name](#state--properties--name)

The string name of `this` state. For the unique case of a `RootState`, this value will be the empty string `''`.

###### SYNTAX

{% highlight javascript %}
this.name
{% endhighlight %}

###### EXAMPLE

{% highlight javascript %}
{% include examples/api/state/properties--name.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/properties--name.coffee %}
{% endhighlight %}

###### SEE ALSO

> [**path**](#state--methods--path)

> [`State` constructor](/source/state.html#state--constructor)


#### [owner](#state--properties--owner)

References the object that is the **owner** of `this` state.

###### SYNTAX

{% highlight javascript %}
this.owner
{% endhighlight %}

###### EXAMPLE

{% highlight javascript %}
{% include examples/api/state/properties--owner.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/properties--owner.coffee %}
{% endhighlight %}

###### SEE ALSO

> [`State` constructor](/source/state.html#state--constructor)


#### [root](#state--properties--root)

References the `RootState` of the state tree to which `this` state belongs.

###### SYNTAX

{% highlight javascript %}
this.root
{% endhighlight %}

###### EXAMPLE

{% highlight javascript %}
{% include examples/api/state/properties--root.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/properties--root.coffee %}
{% endhighlight %}

###### SEE ALSO

> [The root state](/docs/#concepts--object-model--the-root-state)
> [`State` constructor](/source/state.html#state--constructor)


#### [superstate](#state--properties--superstate)

References the `State` that is `this` state’s immediate superstate.

###### SYNTAX

{% highlight javascript %}
this.superstate
{% endhighlight %}

###### EXAMPLE

{% highlight javascript %}
{% include examples/api/state/properties--superstate.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/properties--superstate.coffee %}
{% endhighlight %}

###### SEE ALSO

> [Superstates and substates](/docs/#concepts--object-model--superstates-and-substates)
> [`State` constructor](/source/state.html#state--constructor)


#### [protostate](#state--properties--protostate)

References the `State` that is `this` state’s immediate protostate.

###### SYNTAX

{% highlight javascript %}
this.protostate
{% endhighlight %}

###### EXAMPLE

{% highlight javascript %}
{% include examples/api/state/properties--protostate.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/properties--protostate.coffee %}
{% endhighlight %}

###### SEE ALSO

> [Protostates and epistates](/docs/#concepts--object-model--protostates-and-epistates)
> [`State` constructor](/source/state.html#state--constructor)
