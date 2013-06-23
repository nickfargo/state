### [Methods](#transition--methods)


#### [wasAborted](#transition--methods--was-aborted)

{% highlight javascript %}
this.wasAborted()
{% endhighlight %}

Returns `false` if `this` transition has reached its `target` and completed successfully.

Returns `true` if `this` was aborted prior to reaching `target`.

Returns `undefined` if `this` has not yet been completed or aborted.


#### [start](#transition--methods--start)

{% highlight javascript %}
this.start( args... )
{% endhighlight %}

Automatically invoked as a result of a call to `State.change`.


#### [end](#transition--methods--end)

{% highlight javascript %}
this.end()
{% endhighlight %}

Used to signal the end of `this` transition’s `action`.

Upon reaching the top of its **domain**, a transition will invoke its **action** function, which is responsible for calling `end()` to signal that it is finished and ready for the transition to begin the descending phase of the traversal to `target`.

> [The transition lifecycle](/docs/#concepts--transitions--lifecycle)
