class Scholar
  state @::, 'abstract'
    Matriculated: state 'initial'
      graduate: ( gpa ) ->
        @owner().gpa = gpa
        @$ -> 'Graduated'

    Graduated: state 'final'
  
    transitions: do ->
      transition = ( properties ) ->
        o = origin: 'Matriculated', target: 'Graduated'
        o[k] = v for k,v of properties
        o
  
      Summa: transition
        admit: -> @owner().gpa >= 3.9
        action: -> # swat down offers
  
      Magna: transition
        admit: -> 3.75 <= @owner().gpa < 3.9
        action: -> # choose internship
  
      Laude: transition
        admit: -> 3.50 <= @owner().gpa < 3.75
        action: -> # brag to the cat
  
      '': transition
        action: -> # blame rounding error

scholar = new Scholar
scholar.graduate 3.4999