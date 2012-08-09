> 1. The `mover` instance was declared `mutable`, but its prototype is `immutable`, so applying `mutable` on the inheriting root state here is superfluous: `mutable` is negated and `immutable` is inherited.

> 2. The call to `state` does allow `mover` to extend its prototype’s `immutable` state, although the new `Stationary` state will also inherit `immutable`.

> 3. Attempts to alter the state’s contents after it has been constructed will have no effect.