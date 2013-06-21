class Person
  constructor: ->
    @give = ( to, what ) -> to.receive this, what; this
    @receive = ( from, what ) -> this
    @greet = -> "Hello."

    state this,
      Formal:
        greet: ( person ) -> "How do you do?"

      Informal:
        greet: ( person ) -> "Hi!"

        Familiar:
          hug: ( person ) -> @give person, 'O'
          greet: ( person ) -> @hug person

          Intimate:
            kiss: ( person ) -> @give person, 'X'
            greet: state.bind ( person ) ->
              @superstate.call 'greet', person
              @owner.kiss person