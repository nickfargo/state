# State.js

**[State][0]** is a library for implementing a system of **[hierarchical states][1]** directly into objects **[and inherently across prototypes][2]**.

An object’s behavior is exhibited via its **[methods][3]**, which may be overridden by its `State`s. This allows a **State** implementation to impose minimally on the object’s interface while remaining transparent to consumers.

Changes to an object’s behavior are facilitated by **[evented][4]** state **[transitions][5]**.

State content, including methods, events, substates, and transitions, is **[expressed in a format][6]** that is terse and declarative, encouraging composition, reuse, and ease of reasoning.

* * *

Visit **[statejs.org][]** for an introduction, complete [documentation][] including a [getting started][] guide and conceptual [overview][], along with the [API][], [annotated source][], and [tests][].

### &#x1f44b;




[0]: http://statejs.org/
[1]: http://statejs.org/docs/#concepts--inheritance--superstates-and-substates
[2]: http://statejs.org/docs/#concepts--inheritance--protostates
[3]: http://statejs.org/docs/#concepts--methods
[4]: http://statejs.org/docs/#concepts--events
[5]: http://statejs.org/docs/#concepts--transitions
[6]: http://statejs.org/docs/#concepts--expressions

[statejs.org]:       http://statejs.org/
[documentation]:     http://statejs.org/docs/
[getting started]:   http://statejs.org/docs/#getting-started
[overview]:          http://statejs.org/docs/#overview
[API]:               http://statejs.org/api/
[annotated source]:  http://statejs.org/source/
[tests]:             http://statejs.org/tests/
