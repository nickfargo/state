class Person
  greet: -> "Hello."
  state @::
    Formal:
      greet: -> "How do you do?"
    Casual:
      greet: -> "Hi!"

person = new Person
'state' of person                  # >>> true
person.hasOwnProperty 'state'      # >>> false