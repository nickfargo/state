class Person
  state @::, 'abstract'
    Formal: state 'initial default'
      greet: -> "How do you do?"
    Casual:
      greet: -> "Hi!"

person = new Person
person.state()            # >>> State 'Formal'
person.greet()            # >>> "How do you do?"

person.state '-> Casual'
person.state()            # >>> State 'Casual'
person.greet()            # >>> "Hi!"