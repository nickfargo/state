class Person
  constructor: ->
    @give = ( to, what ) -> to.receive this, what; this
    @receive = ( from, what ) -> this
    @greet = -> "Hello."

    state this,
      Formal:
        greet: ( other ) -> "How do you do?"
      
      Informal:
        greet: ( acquaintance ) -> "Hi!"
    
        Familiar:
          hug: ( friend ) -> @owner().give friend, 'O'
          greet: ( friend ) -> @owner().hug friend
    
          Intimate:
            kiss: ( spouse ) -> @owner().give spouse, 'X'
            greet: ( spouse ) ->
              @superstate().call 'greet', spouse
              @owner().kiss spouse