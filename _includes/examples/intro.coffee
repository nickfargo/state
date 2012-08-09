class Person
  state @::, 'abstract'
    Formal: state 'initial default'
      greet: -> "How do you do?"
    Casual:
      greet: -> "Hi!"

person = new Person
person.greet()            # >>> "How do you do?"

person.state '-> Casual'
person.greet()            # >>> "Hi!"