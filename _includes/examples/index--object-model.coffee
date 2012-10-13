class Person
  state @::
    Formal:
      greet: -> "How do you do?"
    Casual:
      greet: -> "Hi!"


person = new Person
person.hasOwnProperty 'state'     # >>> false

person.state '-> Formal'
person.state()                    # >>> State 'Formal'
person.greet()                    # >>> "How do you do?"