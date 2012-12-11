---
layout: post
title: Persistent virtual states
date: "2012-12-15T12:00:00+08:00"
tags: [virtual states, protostates]
published: false

lede: ()
---

# Persistent virtual states

In **State.js**, the [`State`](/api/#state) object model reflects the prototypal model of the stateful owner object. This allows **epistates**, the states of an inheriting object, to inherit from **protostates**, the states of a prototype of the object. An object may also operate on protostates for which it contains no corresponding epistate by using **virtual states** to represent the protostates locally.

To this point in **State.js**, virtual states have been strictly ephemeral, existing only when called into action as an object’s **current** state (or as a virtual superstate of a virtual current state); once the object’s currency has transitioned elsewhere, previously active virtual states are discarded.

This system works well enough for reducing overhead and promoting reuse, but it has limitations. In particular, because virtual states are ephemeral, a [`query`](/api/#state--methods--query) performed in the context of an inheriting object’s state tree might return a `State` from that state tree, or it might return a protostate from the state tree of a prototype.

A better system will assert the invariant

```javascript
object.state( name ).owner() === object
```

for any `name` string that resolves to a `State` (or protostate) accessible by `object`, independent of whether the state is current or active for `object`. If `name` resolves to a protostate, then `object.state( name )` must return a virtual state in the state tree of `object` to inherit from the protostate.

It follows then that if virtual states are to be created on-demand, then they must also be retained, and therefore be able to assert

```javascript
object.state( name ) === object.state( name )
```

irrespective of whether `object.state( name )` resolves to a real or virtual state.


1. Extol laziness: create a virtual state only in response to first-class queries; do not create any during member lookups.

2. Store references to the created virtual states in a **vtable**-like hash held privately at the level of the root state.

3. Lookup algorithms must first scan the local `substates` hash, then the local root’s vtable hash, then protostates; automatically virtualize and store the result of protostate recursion (this will require a fourth (!) boolean param `virtualize = true` to suppress auto-virtualization during protostate recursion).


