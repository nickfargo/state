class Person
  state @::, 'abstract'
    Formal: state 'default initial'
      greet: -> "How do you do?"
    Casual: state 'final'
      greet: -> "Hi!"


person = new Person

person.greet()                    # >>> "How do you do?"

person.state '->'
person.state()                    # >>> State 'Formal'
person.greet()                    # >>> "How do you do?"

person.state '-> Casual'
person.greet()                    # >>> "Hi!"

person.state '-> Formal'
person.state()                    # >>> State 'Casual'