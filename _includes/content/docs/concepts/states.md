### [States](#concepts--states)

A **state** is an instance of [`State`](/api/#state), which encapsulates all or part of an **owner** object’s condition at a given moment. An owner occupies a particular `State` as its **current state**, during which some of its methods will exhibit the behaviors described by that state.

An owner object usually bears multiple states, and alters its behavior by instigating a **transition**, which moves the owner’s **currency** from the previously current state to the transition’s target state.

<div class="backcrumb">
⏎  <a class="section" href="#concepts--states">States</a>  &lt;  <a href="#concepts">Concepts</a>  &lt;  <a href="#overview">Overview</a>
</div>
