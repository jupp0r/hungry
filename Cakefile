{exec} = require 'child_process'
task 'build', 'Build project', ->
  exec 'coffee --compile .', (err, stdout, stderr) ->
    throw err if err
    console.log stdout + stderr