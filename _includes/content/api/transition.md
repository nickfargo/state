## [Transition](#transition)

A `Transition` is a transient `State` temporarily adopted as the owner object’s current state as it changes from one of its proper `State`s to another.

A transition acts within the **domain** of the least common ancestor between its **origin** and **target** states. During this time it behaves as if it were a substate of that domain state, inheriting method calls and propagating events in the familiar fashion.

> [Transitions](/docs/#concepts--transitions)

<div class="local-toc"></div>

{% include content/api/transition/events.md %}
{% include content/api/transition/methods.md %}
