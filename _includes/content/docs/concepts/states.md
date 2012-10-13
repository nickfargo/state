### [States](#concepts--states)

Formally, a **state** is an instance of [`State`](/api/#state) that encapsulates all or part of an **owner** object’s condition at a given moment. A stateful owner is able to adopt a distinct set of behaviors for itself by occupying a particular state as its **current state**, during which some of its methods will exhibit the behaviors described by that state.

A stateful owner usually bears multiple states, and as such it is able to alter its behavior in a definitive manner by instigating a **transition**, which moves the owner’s **currency** from its previously current state to whichever state is targeted by the transition.

<div class="backcrumb">
⏎  <a class="section" href="#concepts--states">States</a>  &lt;  <a href="#concepts">Concepts</a>  &lt;  <a href="#overview">Overview</a>
</div>
