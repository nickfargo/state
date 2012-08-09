class Scholar
  state @::, 'abstract'
    Matriculated: state 'initial'
      graduate: ( gpa ) ->
        @owner().gpa = gpa
        @$ -> 'Graduated'

    Graduated: state 'final'
  
    transitions: do ->
      t = ( p ) ->
        o = origin: 'Matriculated', target: 'Graduated'
        o[k] = v for k,v of p
        o
  
      Summa: t
        admit: -> @owner().gpa >= 3.9
        action: -> # swat down offers
  
      Magna: t
        admit: -> 3.75 <= @owner().gpa < 3.9
        action: -> # choose favorite internship
  
      Laude: t
        admit: -> 3.50 <= @owner().gpa < 3.75
        action: -> # brag to the cat
  
      '': t
        action: -> # blame rounding error

scholar = new Scholar
scholar.graduate 3.4999