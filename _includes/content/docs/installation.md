## [Installation](#installation)

<a class="download" href="/state.js"><strong>state.js</strong> (149kB)</a><a class="download" href="/state-min.js"><strong>state-min.js</strong> (8.6kB gz)</a>

* * *

The lone dependency of **State** is [**Omicron**](http://github.com/nickfargo/omicron/), a small set of object-focused utility functions useful for performing differential operations, facilitating inheritance, and other common tasks.

<a class="download" href="/omicron.js"><strong>omicron.js</strong> (18kB)</a><a class="download" href="/omicron-min.js"><strong>omicron-min.js</strong> (2.1kB gz)</a>

* * *

#### In node.js

**State** can be installed as a [**node.js**](http://nodejs.org) module via [**npm**](http://npmjs.org/):

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
<script src="omicron.js"></script>
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
