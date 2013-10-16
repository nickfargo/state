## [Overview](#overview)

The points listed here summarize the discussions that follow in the [**Concepts**](#concepts) section.

* [**States**](#concepts--states) — A **state** acts on behalf of an **owner** object to describe the owner’s behavior at a given moment. The owner is able to express and alter its various behaviors by occupying and transitioning between its states.

* [**Object model**](#concepts--object-model) — `State`s may inherit and be composed from other `State`s. The hierarchical [**superstate–substate**](#concepts--object-model--superstates-and-substates) relation defines a **state tree** rooted from the owner’s unique [**root state**](#concepts--object-model--the-root-state). The compositional [**parastate**](#concepts--object-model--parastates-and-composition) relation further provides linearized multiple inheritance over the owner’s state tree. `State`s also observe indirect prototypal inheritance via the [**protostate–epistate**](#concepts--object-model--protostates-and-epistates) relation implied by **State** implementations on any prototype of the owner.

* [**Expressions**](#concepts--expressions) — A **state expression** describes the contents of a state. States may be [expressed concisely](#concepts--expressions--shorthand) with an object literal, which, along with an optional set of attribute keywords, can be passed into the [`state()`](#getting-started--the-state-fuunction) function. There the provided input [is interpreted](#concepts--expressions--interpreting-expression-input) into a formal [`StateExpression`](/source/state-expression.html), which can then be used to create [`State`](/api/#state) instances.

* [**Selectors**](#concepts--selectors) — An `owner`’s accessor method `owner.state()` can be called without arguments to retrieve the object’s **current state**, or, if provided a **selector** string, to [`query`](/source/state.html#state--prototype--query) for a specific `State` or a specific set of `State`s.

* [**Attributes**](#concepts--attributes) — A state expression may include a set of **attribute** keywords (e.g.: `mutable`, `initial`, `conclusive`, `abstract`, etc.), which will enable features or impose constraints for the `State` that the expression is to represent.

* [**Data**](#concepts--data) — Arbitrary **data** can be attached to each `State`, and will be inherited accordingly through protostates, parastates, and superstates.

* [**Methods**](#concepts--methods) — Behavior is modeled by defining **state methods** that override the owner’s methods. Method calls on the owner are [**dispatched**](#concepts--methods--dispatchers) automatically to the proper implementation, given the owner’s current state. Consumers of the owner can therefore call its methods as usual, agnostic to what its current state is, or even to the existence of any formal concept of “state”.

* [**Transitions**](#concepts--transitions) — When an object is directed to change from one state to another, it does so by temporarily entering into a **transition** state. A state expression may include [**transition expressions**](#concepts--transitions--expressions) that describe, given a specific pairing of origin and target states, a synchronous or asynchronous **action** to be performed over the duration of the transition.

* [**Events**](#concepts--events) — A `State` accepts listeners for specific **event** types, which will be called as the `State` is affected [by a progressing transition](#concepts--events--transitional), as the `State` itself [experiences changes to its content](#concepts--events--mutation), or upon the `State`’s [construction or destruction](#concepts--events--existential). **State** also allows for the definition of [custom typed events](#concepts--events--custom), which can be emitted from a particular state and propagated to listeners bound to the state itself as well as its protostates and superstates.

* [**Guards**](#concepts--guards) may be applied [to a state](#concepts--state-guards) to govern its viability as a transition target, dependent on the outgoing state and any other conditions that may be defined. Likewise guards may also be included [in transition expressions](#concepts--transition-guards), where they are used to select a particular transition to execute. Guards are evaluated as predicates if supplied as functions, or as static boolean values otherwise.

<div class="backcrumb">
⏎  <a class="section" href="#overview">Overview</a>
</div>

* * *
