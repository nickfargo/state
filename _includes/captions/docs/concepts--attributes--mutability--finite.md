> 1. The `mover` instance may define new states of its own, but its states will also inherit the `finite` attribute from `Mover.prototype`.

> 2. Even though `mover`’s `Running` state is declared `mutable`, it is subject to the restrictions of its inherited `finite` attribute, since `finite` is more powerful than `mutable`. Therefore an attempt to add a substate later will fail.