### [States](#concepts--states)

Instances of [`State`](/api/#state) encapsulate the condition and behavior of an **owner** object at a given moment.

A `State` is comprised of collections of [methods](#concepts--methods), [events](#concepts--events), [guards](#concepts--guards), [substates](#concepts--superstates-and-substates), [transition expressions](#concepts--transitions), and arbitrary simple [data](#concepts--data).

An owner usually bears multiple `State`s, and occupies one of these as its **current state**, during which the owner’s methods will exhibit any behaviors described by that state. Differential behavior is then expressed by instigating a **transition**, which moves the owner’s **currency** from the previously current state to the transition’s target state.

<div class="backcrumb">
⏎  <a class="section" href="#concepts--states">States</a>  &lt;  <a href="#concepts">Concepts</a>  &lt;  <a href="#overview">Overview</a>
</div>
