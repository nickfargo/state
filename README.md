# State.js

**[State][0]** is a JavaScript library for implementing **[first-class states][1]** on arbitrary **owner** objects.

A `State` is a module of behavior — **[expressed][2]** as definitions of **[methods][3]**, **[data][4]**, and/or **[events][5]** — that can be exhibited by its owner. The **State** **[object model][6]** provides for **[hierarchical][7]**, **[compositional][8]**, and **[indirect prototypal][9]** relations between `State`s, facilitating a variety of patterns for reuse and modularity.

An owner object exhibits the behavior expressed by its **current state** — method calls the owner receives are automatically dispatched to methods defined or inherited by that `State`. Behavior of the owner is altered by executing **[transitions][10]** that carry its current state reference from one of its `State`s to another.

* * *

Visit **[statejs.org][]** for an introduction, with sample code, comprehensive [documentation][] including a [getting started][] guide and conceptual [overview][], [API][] reference, and [annotated source][].

### &#x1f44b;




[0]: http://statejs.org/
[1]: http://statejs.org/docs/#concepts--states
[2]: http://statejs.org/docs/#concepts--expressions
[3]: http://statejs.org/docs/#concepts--methods
[4]: http://statejs.org/docs/#concepts--data
[5]: http://statejs.org/docs/#concepts--events
[6]: http://statejs.org/docs/#concepts--object-model
[7]: http://statejs.org/docs/#concepts--object-model--superstates-and-substates
[8]: http://statejs.org/docs/#concepts--object-model--parastates-and-composition
[9]: http://statejs.org/docs/#concepts--object-model--protostates-and-epistates
[10]: http://statejs.org/docs/#concepts--transitions

[statejs.org]:       http://statejs.org/
[documentation]:     http://statejs.org/docs/
[getting started]:   http://statejs.org/docs/#getting-started
[overview]:          http://statejs.org/docs/#overview
[API]:               http://statejs.org/api/
[annotated source]:  http://statejs.org/source/
