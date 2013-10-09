> 1. A “privileged” method `edit` is defined inside the constructor, closing over a private variable `text` to which it requires access. Later, when state is applied to the object, this method will be moved to the root state, and a [dispatcher](#concepts--methods--dispatchers) will be added to the object in its place.

> 2. The `edit` method override defined on the `Saved` state is not closed over the constructor’s private variable `text`, but it can still set the value of `text` by using `this.superstate.apply` to invoke the overridden original implementation.

> 3. The `freeze` method is declared on the abstract root state, callable from states `Dirty` and `Saved` (but not `Frozen`, where it is overridden with a no-op).

> 4. The `save` method, which only appears in the `Dirty` state, is still callable from other states, as its presence in `Dirty` causes a no-op version of the method to be automatically added to the root state. This allows `freeze` to safely call `save` despite the possiblity of being in a state (`Saved`) with no such method.

> 5. Changing to `Saved` from `Dirty` results in the `Writing` [**transition**](#concepts--transitions), whose asynchronous `action` is invoked with the arguments array provided by the call to `go`.