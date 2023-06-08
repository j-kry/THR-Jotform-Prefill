const express = require('express')
const router = express.Router()
const axios = require('axios')
require('dotenv').config()

//Functions

//If entered idNum is <= 5 (Thresholds employee id) then use the first url
//otherwise the UKG emp number is being used and the second url is used then
const getUkgInfo = (idNum) => {

    const payload = {
        method: 'GET',
        url: idNum.length <= 5 ? process.env.EMPDETAILSURL + idNum : process.env.USERPROFURL + idNum,
        headers: {
            'Authorization': process.env.UKGKEY,
            'US-Customer-Api-Key': process.env.UKGCUSTKEY
        }
    }

    const response = axios(payload)
    return response

}

const setText = (idNum, notifyObj, supObj, firstPersonFullName) => {

    if (idNum.substring(0, 1) === '0')
        idNum = idNum.substring(1)
    if (notifyObj.email.substring(0, 1) === '0')
        notifyObj.email = notifyObj.email.substring(1)
    if (supObj.email.substring(0, 1) === '0')
        supObj.email = supObj.email.substring(1)

    return {

        empInfoText: `${firstPersonFullName} - ${idNum}`,
        notifInfoText: `${notifyObj.name} at ${notifyObj.email}`,
        approveInfoText: `${supObj.name} at ${supObj.email}`

    }

}

async function checkFirstJobTitle(idNum) {

    let directorFound = false

    let firstPerson = await getUkgInfo(idNum)
    firstPerson = firstPerson.data[0]

    const firstJobTitle = firstPerson.jobDescription.toLowerCase()
    const firstEmpNum = firstPerson.employeeID
    const firstSupEmpNum = firstPerson.supervisorID

    //Attack on Titan: The Final Season Part 3 Cour 2
    let firstPerson2 = await getUkgInfo(firstEmpNum)
    firstPerson2 = firstPerson2.data[0]

    let supervisorDetails = await (getUkgInfo(firstSupEmpNum))
    supervisorDetails = supervisorDetails.data[0]
    const supervisorJobTitle = supervisorDetails.roleName
    let supervisorID = supervisorDetails.email.substring(0, supervisorDetails.email.indexOf("@"))
    if (supervisorID.length < 5) {
        supervisorID = '0' + supervisorID
    }

    const firstPersonFullName = firstPerson2.firstName + ' ' + firstPerson2.lastName
    const supervisorFullName = supervisorDetails.firstName + ' ' + supervisorDetails.lastName
    const supervisorEmail = supervisorDetails.email

    //Who is being notfied of the form
    let notifyObj = {
        name: '',
        email: ''
    }
    //Supervisor approves the form
    let supObj = {
        name: '',
        email: ''
    }

    //If chief level then only notify Virginia
    if (firstJobTitle.includes('chief')) {

        notifyObj.email = '12552@thresholds.org'
        notifyObj.name = 'Virginia Rossi'
        supObj.email = '12552@thresholds.org'
        supObj.name = 'Virginia Rossi'
        text = setText(idNum, notifyObj, supObj, firstPersonFullName)

        directorFound = true
    }
    //VP level then it can go to supervisor for approval but only notify themselves
    else if (firstJobTitle.includes('president')) {

        notifyObj.email = firstPerson.employeeNumber + '@thresholds.org'
        notifyObj.name = firstPersonFullName
        supObj.email = supervisorEmail
        supObj.name = supervisorFullName
        text = setText(idNum, notifyObj, supObj, firstPersonFullName)

        directorFound = true
    }
    //Director level notify themselves but go to supervisor for approval
    else if (firstJobTitle.includes('director')) {

        notifyObj.name = firstPersonFullName
        notifyObj.email = firstPerson.employeeNumber + '@thresholds.org'
        supObj.name = supervisorFullName
        supObj.email = supervisorEmail
        text = setText(idNum, notifyObj, supObj, firstPersonFullName)

    }
    //Same as above
    else if (supervisorJobTitle.includes('director')) {

        notifyObj.name = supervisorFullName
        notifyObj.email = supervisorEmail
        supObj.name = notifyObj.name
        supObj.email = notifyObj.email
        text = setText(idNum, notifyObj, supObj, firstPersonFullName)
        directorFound = true

    }

    //If nobody on the first round of checks matches then go up one level until a match is found
    else {
        notifyObj = await checkSubsequentJobTitles(supervisorID, notifyObj)
        supObj.name = supervisorFullName
        supObj.email = supervisorEmail
        text = setText(idNum, notifyObj, supObj, firstPersonFullName)
    }

    //Make sure email does not have preceeding 0 for employee id
    if (notifyObj.email.substring(0, 1) === '0') {
        notifyObj.email = notifyObj.email.substring(1)
    }
    if (supObj.email.substring(0, 1) === '0') {
        supObj.email = supObj.email.substring(1)
    }

    //Return an object that includes both the notification and supervisor as well as the employees name who entered their id
    return {
        employee: {
            name: firstPersonFullName,
            text: text
        },
        notify: notifyObj,
        supervisor: supObj
    }

}

async function checkSubsequentJobTitles(idNum, notifyObj) {

    let directorFound = false

    while (!directorFound) {

        let firstPerson = await getUkgInfo(idNum)
        firstPerson = firstPerson.data[0]

        const firstJobTitle = firstPerson.jobDescription.toLowerCase()
        const firstEmpNum = firstPerson.employeeID
        const firstSupEmpNum = firstPerson.supervisorID

        //Attack on Titan: The Final Season Part 3 Cour 2
        let firstPerson2 = await getUkgInfo(firstEmpNum)
        firstPerson2 = firstPerson2.data[0]

        let supervisorDetails = await (getUkgInfo(firstSupEmpNum))
        supervisorDetails = supervisorDetails.data[0]
        let supervisorID = supervisorDetails.email.substring(0, supervisorDetails.email.indexOf("@"))
        if (supervisorID.length < 5) {
            supervisorID = '0' + supervisorID
        }

        const firstPersonFullName = firstPerson2.firstName + ' ' + firstPerson2.lastName

        if (firstJobTitle.includes('director') || firstJobTitle.includes('president') || firstJobTitle.includes('chief')) {

            notifyObj.name = firstPersonFullName
            notifyObj.email = firstPerson.employeeNumber + '@thresholds.org'
            directorFound = true

        }
        else {
            idNum = supervisorID
        }

    }

    return notifyObj

}

router.get('/', (req, res) => {
    res.render('accInc')
})

router.post('/submit', async (req, res) => {
    //res.locals.text = req.body.empId

    //res.locals.text = 'you need to set this up still'
    let empId = req.body.empId
    if (empId.length < 5) {
        empId = '0' + empId
    }
    try {
        //res.locals.text = await useProm(empId, res.locals.text)
        let info = await checkFirstJobTitle(empId)
        res.locals.empName = info.employee.text.empInfoText
        res.locals.notif = info.employee.text.notifInfoText
        res.locals.sup = info.employee.text.approveInfoText
        let notifEmail = encodeURIComponent(info.notify.email)
        let supEmail = encodeURIComponent(info.supervisor.email)
        //res.locals.jotformURL = `https://thresholds.jotform.com/231174858715968?notificationEmail=${notifEmail}&supervisorEmail=${supEmail}`
        res.locals.jotformURL = `https://thresholds.tfaforms.net/4?tfa_1=${supEmail}&tfa_3=${notifEmail}`
        res.render('accInc-submit')
    }
    catch (err) {
        console.log(err)
        res.send(
            `<h1>Invalid Employee ID (${empId}) or could not contact UKG.</h1>
                <br>
                <h1>Please go back and try again.</h1>
                <br>
                <p>${err}</p>`
        )
    }

    //res.send(`Your employee ID is ${req.body.empId}`)

})

module.exports = router