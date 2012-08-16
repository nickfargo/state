## [State](#state)

A `State` models a set of behaviors on behalf of an owner object. The owner may undergo **transitions** that change its **current** state from one to another, and in so doing adopt a different set of behaviors.

Distinct behaviors are modeled in each state by defining a set of method overrides, to which calls made on the owner will be redirected so long as a state remains current.

States are structured as a rooted tree, where **substates** inherit from a single **superstate**. While a substate is current, it and all of its ancestor superstates are **active**.

In addition, a state also recognizes the owner object’s prototypal inheritance, identifying an identically named and positioned state in the prototype as its **protostate**. Stateful behavior is inherited from protostates first, then from superstates.

> [**Overview**](/docs/#overview)
> [Inheritance](/docs/#concepts--inheritance)
> [`State`](/source/#state)

<div class="local-toc"></div>

{% include content/api/state/attributes.md %}
{% include content/api/state/events.md %}
{% include content/api/state/methods.md %}

* * *
