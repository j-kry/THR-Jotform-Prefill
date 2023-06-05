const express = require('express')
const router = express.Router()
const axios = require('axios')

router.get('/', (req, res) => {
    res.send(`
        <h1>Under Construction</h1>
        <br>
        <img src="./images/construction.gif">
        `)
})

module.exports = router