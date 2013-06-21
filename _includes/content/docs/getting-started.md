## [Getting started](#getting-started)

<div class="local-toc" data-pattern="^Step \d+ . (.*)" data-replace="$1"></div>

#### [Step 0 — The `state` function](#getting-started--the-state-function)

The **State** module is exported as a function named [`state`](/api/#module), which can be used for either of two purposes:

##### Implementing state into an object

{% highlight javascript %}
state( owner, [attributes], expression )
{% endhighlight %}

{% highlight coffeescript %}
state( owner, [attributes], expression )
{% endhighlight %}

Given two object-typed arguments `owner` and `expression`, calling `state` will augment `owner` with its own working state implementation based on the contents of `expression` (and any keywords included in the optional [`attributes`](#concepts--attributes) string). The newly stateful `owner`’s [**initial state**](#concepts--attributes--destination) is returned.

##### Expressing a state’s content

{% highlight javascript %}
state( [attributes], expression )
{% endhighlight %}

{% highlight coffeescript %}
state( [attributes], expression )
{% endhighlight %}

Given a single `expression` object (and optional `attributes`), calling `state` will create and return a [**state expression**](#concepts--expressions) that describes the intended content of a state. This usage of `state` is most often employed within the `expression` argument of an outer `state` call, to define constituent [**substates**](#concepts--inheritance--superstates-and-substates).


#### [Step 1 — Building a state expression](#getting-started--building-a-state-expression)

The `state` function’s `expression` argument, usually an object literal, describes the constituent states, methods, and other features that will form the state implementation of its owner:

{% highlight javascript %}
var person = {
    greet: function () { return "Hello."; }
};

state( person, {
    Formal: {
        greet: function () { return "How do you do?"; }
    },
    Casual: {
        greet: function () { return "Hi!"; }
    }
});
{% endhighlight %}

{% highlight coffeescript %}
person =
  greet: -> "Hello."

state person,
  Formal:
    greet: -> "How do you do?"
  Casual:
    greet: -> "Hi!"
{% endhighlight %}

Here, `person` is the owner, `greet` is its method, and `Formal` and `Casual` are states, inside each of which is a stateful method that will override `person.greet`.


#### [Step 2 — Accessing an object’s state](#getting-started--accessing-an-objects-state)

After calling `state` to implement state into `person`, the new state implementation will be exposed through a special **accessor method** at `person.state`.

Calling the accessor method with no arguments queries the object for its **current state**:

{% highlight javascript %}
person.state();  // >>> State ''
{% endhighlight %}

{% highlight coffeescript %}
person.state()  # >>> State ''
{% endhighlight %}

In this case the current state of `person` is its top-level [**root state**](#concepts--inheritance--the-root-state), whose name is always the empty string `''`. While `person` is in this state it will exhibit its default behavior:

{% highlight javascript %}
person.greet();  // >>> "Hello."
{% endhighlight %}

{% highlight coffeescript %}
person.greet()  # >>> "Hello."
{% endhighlight %}


#### [Step 3 — Transitioning between states](#getting-started--transitioning-between-states)

The object’s current state may be reassigned to a different state by calling its [`change`](/api/#state--prototype--change) method and providing it the name of a state to be targeted. Transitioning between states allows an object to exhibit different behaviors:

{% highlight javascript %}
person.state().change('Formal');
person.state();                   // >>> State 'Formal'
person.greet();                   // >>> "How do you do?"
{% endhighlight %}

{% highlight coffeescript %}
person.state().change 'Formal'
person.state()                  # >>> State 'Formal'
person.greet()                  # >>> "How do you do?"
{% endhighlight %}

A sugary alternative to `change()` is to prepend a **transition arrow** to the targeted state’s name, and pass this string into the accessor method:

{% highlight javascript %}
person.state('-> Casual');
person.state();                   // State 'Casual'
person.greet();                   // >>> "Hi!"

person.state('->');                                           // [1]
person.state();                   // State ''
person.greet();                   // >>> "Hello."
{% endhighlight %}

{% highlight coffeescript %}
person.state '-> Casual'
person.state()                  # >>> State 'Casual'
person.greet()                  # >>> "Hi!"

person.state '->'                                             # [1]
person.state()                  # >>> State ''
person.greet()                  # >>> "Hello."
{% endhighlight %}

> 1. A naked transition arrow implies a transition that targets the root state (`''`).

<div class="backcrumb">
⏎  <a class="section" href="#getting-started">Getting started</a>
</div>

* * *
