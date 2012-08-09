person.state().isVirtual()         # >>> false
person.greet()                     # >>> "Hello."
person.state '-> Casual'           # >>> State 'Casual'
person.state().isVirtual()         # >>> true
person.greet()                     # >>> "Hi!"

Person::state()                    # >>> State ''