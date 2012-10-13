state = require 'state'

person = {}
state person,
  Formal:
    greet: -> "How do you do?"
  Casual:
    greet: -> "Hi!"


person.hasOwnProperty 'state'     # >>> true

person.state '-> Formal'
person.state()                    # >>> State 'Formal'
person.greet()                    # >>> "How do you do?"

person.state '-> Casual'
person.state()                    # >>> State 'Casual'
person.greet()                    # >>> "Hi!"