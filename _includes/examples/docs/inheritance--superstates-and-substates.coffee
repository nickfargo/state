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
          hug: ( person ) -> @owner().give person, 'O'
          greet: ( person ) -> @owner().hug person
    
          Intimate:
            kiss: ( person ) -> @owner().give person, 'X'
            greet: ( person ) ->
              @superstate().call 'greet', person
              @owner().kiss person