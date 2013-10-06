# State.js

**[State][0]** is a JavaScript library for implementing **first-class states** on arbitrary **owner** objects.

`State`s are modules of [expressed][1] behavior. **State** causes an owner to exhibit the behavior expressed by the owner’s **current state**, automatically dispatching method calls received by the owner to [method][2] implementations defined or inherited by the current state. Behavior of the owner is altered by executing **[transitions][3]** that carry its current state reference from one of its `State` to another.

The **State** **[object model][4]** provides for **[hierarchical][5]**, **[compositional][6]**, and **[indirect prototypal][7]** relations between `State`s. These can be used separately or together to facilitate a variety of reuse and modularity patterns.

* * *

Visit **[statejs.org][]** for a complete introduction, example code, comprehensive [documentation][] including a [getting started][] guide and conceptual [overview][], [API][] reference, and [annotated source][].

### &#x1f44b;




[0]: http://statejs.org/
[1]: http://statejs.org/docs/#concepts--expressions
[2]: http://statejs.org/docs/#concepts--methods
[3]: http://statejs.org/docs/#concepts--transitions
[4]: http://statejs.org/docs/#concepts--object-model
[5]: http://statejs.org/docs/#concepts--object-model--superstates-and-substates
[6]: http://statejs.org/docs/#concepts--object-model--parastates-and-composition
[7]: http://statejs.org/docs/#concepts--object-model--protostates-and-epistates

[statejs.org]:       http://statejs.org/
[documentation]:     http://statejs.org/docs/
[getting started]:   http://statejs.org/docs/#getting-started
[overview]:          http://statejs.org/docs/#overview
[API]:               http://statejs.org/api/
[annotated source]:  http://statejs.org/source/
