class Person
  state @::,
    Formal:
      greet: -> "How do you do?"
      Highbrow:
        greet: -> "Enchanté."
    Casual:
      greet: -> "Hi!"


person = new Person
friend = new Person

person.hasOwnProperty 'state'     # >>> false

person.state '-> Highbrow'
friend.state '-> Casual'

person.greet()                    # >>> "Enchanté."
friend.greet()                    # >>> "Hi!"