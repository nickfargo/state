# State.js

**[State][0]** is a JavaScript library for implementing **first-class states** on arbitrary **owner** objects.

`State`s are modules of **[expressed][1]** behavior, which may include **[methods][2]**, **[data][3]**, and **[events][4]**. An owner exhibits the behavior expressed by its **current state** by dispatching method calls it receives to methods defined or inherited by that `State`. Behavior of the owner is altered by executing **[transitions][5]** that carry its current state reference from one of its `State`s to another.

The **State** **[object model][6]** provides for **[hierarchical][7]**, **[compositional][8]**, and **[indirect prototypal][9]** relations between `State`s, which can facilitate a variety of patterns for reuse and modularity.

* * *

Visit **[statejs.org][]** for an introduction, with sample code, comprehensive [documentation][] including a [getting started][] guide and conceptual [overview][], [API][] reference, and [annotated source][].

### &#x1f44b;




[0]: http://statejs.org/
[1]: http://statejs.org/docs/#concepts--expressions
[2]: http://statejs.org/docs/#concepts--methods
[3]: http://statejs.org/docs/#concepts--data
[4]: http://statejs.org/docs/#concepts--events
[5]: http://statejs.org/docs/#concepts--transitions
[6]: http://statejs.org/docs/#concepts--object-model
[7]: http://statejs.org/docs/#concepts--object-model--superstates-and-substates
[8]: http://statejs.org/docs/#concepts--object-model--parastates-and-composition
[9]: http://statejs.org/docs/#concepts--object-model--protostates-and-epistates

[statejs.org]:       http://statejs.org/
[documentation]:     http://statejs.org/docs/
[getting started]:   http://statejs.org/docs/#getting-started
[overview]:          http://statejs.org/docs/#overview
[API]:               http://statejs.org/api/
[annotated source]:  http://statejs.org/source/
