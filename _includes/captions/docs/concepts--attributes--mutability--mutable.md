> 1. Without a `mutable` attribute, the prototype’s states are weakly immutable, so their content cannot be altered, and the attempt to call `mutate` has no effect.

> 2. Because the instance’s root state was declared `mutable`, content can be added later to that state or to any state that inherits from it.

> 3. Substates, including virtual states and any state added later, automatically inherit the `mutable` attribute assigned to their superstates.
