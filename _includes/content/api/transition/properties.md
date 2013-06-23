### [Properties](#transition--properties)


#### [owner](#transition--properties--owner)

{% highlight javascript %}
this.owner
{% endhighlight %}

References the `State` to which `this` transition is currently attached during its traversal from `origin` through `domain` toward `target`.


#### [root](#transition--properties--root)

{% highlight javascript %}
this.root
{% endhighlight %}

References the `State` to which `this` transition is currently attached during its traversal from `origin` to `target`.


#### [superstate](#transition--properties--superstate)

{% highlight javascript %}
this.superstate
{% endhighlight %}

References the `State` to which `this` transition is currently attached during its traversal from `origin` through `domain` toward `target`.


#### [origin](#transition--properties--origin)

{% highlight javascript %}
this.origin
{% endhighlight %}

References the `owner`’s most recently current `State` that is not itself a `Transition` — i.e., the state from which `this` transition originally emerged.


#### [source](#transition--properties--source)

{% highlight javascript %}
this.source
{% endhighlight %}

References the `State` or `Transition` that was current immediately prior to `this` transition.


#### [target](#transition--properties--target)

{% highlight javascript %}
this.target
{% endhighlight %}

References the intended destination `State` for `this` transition.
