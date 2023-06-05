const express = require('express')
const axios = require('axios')
const ejs = require('ejs')
require('dotenv').config()

//Create the express app
const app = express()
const port = process.env.PORT || 3000

//Set the view engine to ejs
app.set('view engine', 'ejs')

//Use middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

//Use these routes
const accInc = require('./routes/accInc/accInc')
app.use('/accInc', accInc)
const eDrill = require('./routes/eDrill/eDrill')
app.use('/eDrill', eDrill)
const safeIns = require('./routes/safeIns/safeIns')
app.use('/safeIns', safeIns)
const ur = require('./routes/ur/ur')
app.use('/ur', ur)

//Display the main html page
app.get('/', (req, res) => {

    res.render('index')

})

//Start the server
app.listen(port)