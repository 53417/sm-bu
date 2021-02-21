const express = require('express')
const cors = require('cors')
const fs = require('fs')
const bodyParser = require('body-parser')
const BookingService = require('../src/services/bookingService')

const app = express()
app.use(cors()) // so that app can access
app.use(bodyParser.json());

// mock db
let bookings = []

// seed db
bookings = JSON.parse(fs.readFileSync('./server/bookings.json')).map(
    (bookingRecord) => ({
        time: Date.parse(bookingRecord.time),
        duration: bookingRecord.duration * 60 * 1000, // mins into ms
        userId: bookingRecord.user_id,
    }),
)

app.get('/bookings', (_, res) => {
    res.json(bookings)
})

app.post('/bookings', (req, res, next) => {
    const newBookings = req.body;
    if(newBookings.length === 0) {
        res.status(400).json({status: "400", message: "No bookings provided"})
    }
    const copyOfBookings =[]
    bookings.map(booking => {copyOfBookings.push(booking)})
    const processedBookings = BookingService.processBookings(newBookings, copyOfBookings)
    if(processedBookings.nonConflictingBookings.length === 0) {
        res.status(400).json({status: "400", message: "All bookings conflicting"})
    }
    bookings = bookings.concat(processedBookings.nonConflictingBookings)
    res.status(200).json({status: "200", message: "New bookings added"})
})

app.listen(3001)
