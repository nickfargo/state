---
layout: post
title: The privileged method store
date: "2012-11-12T19:10:34+08:00"
tags: [methods, closures, partial application]
published: false

lede: Instances of [`State`](/api/#state) store content privately, exposing it to privileged instance methods when necessary. To make these privileged methods heritable — namely for use by [`Transition`](/api/#transition) instances — `State` adheres to a pattern of partial application, where certain methods are written as factories that accept one or more private members and return a closure-wrapped function containing the method’s logic, which can then be instated as a property of a `State` (or `Transition`) instance.
---

## [The pattern](#the-pattern)

