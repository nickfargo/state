## [Installation](#installation)

<a class="download" target="_blank" href="/state.js"><strong>state.js</strong> {{ site.packages.state.version }} <span class="weak">({{ site.packages.state.size }})</span></a><a class="download" target="_blank" href="/state-min.js"><strong>{{ site.packages.state.size_gz }}</strong> min/gz</a>


#### In Node.js

**State** can be installed as a [**Node.js**](http://nodejs.org) module via [**npm**](http://npmjs.org/):

{% highlight bash %}
$ npm install state
{% endhighlight %}

{% highlight javascript %}
var state = require('state');
{% endhighlight %}

{% highlight coffeescript %}
state = require 'state'
{% endhighlight %}


#### In the browser

**State** can be included using your favorite package manager, or directly:

{% highlight html %}
<script src="state.js"></script>
{% endhighlight %}

which will expose the module at `window.state`. You may wish to avoid the global reference and instead hold **State** within a closure by calling `noConflict`:

{% highlight javascript %}
( function () {
    var state = window.state.noConflict();
    // ...
}() );
{% endhighlight %}

{% highlight coffeescript %}
state = window.state.noConflict()
# ...
{% endhighlight %}

<div class="backcrumb">
⏎  <a class="section" href="#installation">Installation</a>
</div>

* * *
