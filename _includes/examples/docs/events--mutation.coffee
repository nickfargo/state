flavors = [
  'vanilla'
  'chocolate'
  'strawberry'
  'AmeriCone Dream'
]

class Kid
  state @::, 'mutable',
    data:
      favorite: 'chocolate'

    waver: state.bind ->
      @data favorite: flavors[ Math.random() * flavors.length << 0 ]
    whine: ( complaint ) ->
      console?.log complaint

    mutate: ( mutation, replaced ) ->
      @whine "I hate #{ replaced.favorite }, " +
             "I want #{ mutation.favorite }!"


jr = new Kid

# We could have added listeners this way also:
jr.state().on 'mutate', ( mutation, replaced ) -> # ...

jr.waver()  # log <<< "I hate chocolate, I want strawberry!"
jr.waver()  # log <<< "I hate strawberry, I want chocolate!"
jr.waver()  # No whining! On a whim, junior stood pat this time.
jr.waver()  # log <<< "I hate chocolate, I want AmeriCone Dream!"