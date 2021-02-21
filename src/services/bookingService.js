const BookingService = () => {

    const cleanCsv = (data) => {
        let keys = data.shift()
        let output = [];

        // remove whitespaces from CSV
        keys.forEach((key, i) => {
            keys[i] = key.trim()
        })

        // loop through and format time to unix, duration to ms, and remove whitespace from userid
        for (let i = 0; i < data.length; i++) {
            let obj = {}
            for (let k = 0; k < keys.length; k++) {
                const iKey = keys[k]
                let iData = data[i][k]
                if( iKey === 'time') {
                    iData = new Date(data[i][k]).getTime()
                } else if(iKey === 'duration') {
                    iData = parseInt(data[i][k].replace( /^\D+/g, '')) * 60 * 1000
                } else if(iKey === 'userId') {
                    iData = data[i][k].trim()
                }
                obj[iKey] = iData
            }
            output.push(obj);
            obj = {}
        }
        return output;
    }

    // determine bookings which are conflicting and non-conflicting
    const processBookings = (newBookings, bookingsState) => {
        // dont modify state
        let existingBookings = []
        bookingsState.map(booking => existingBookings.push(booking))
        let nonConflictingBookings = []
        let conflictingBookings = []

        for(let newBookingIndex = 0; newBookingIndex < newBookings.length; newBookingIndex++) {
            const newBooking = newBookings[newBookingIndex]
            for(let existingBookingIndex = 0; existingBookingIndex < existingBookings.length; existingBookingIndex++) {
                const existingBooking = existingBookings[existingBookingIndex]
                const conflicting = checkBookingForConflict(existingBooking, newBooking)
                if(conflicting) {
                    conflictingBookings.push(newBooking);
                    break
                } else if(existingBookingIndex === existingBookings.length - 1) {
                    existingBookings.push(newBooking)
                    nonConflictingBookings.push(newBooking)
                    break
                }
            }
        }
        return {existingBookings, nonConflictingBookings, conflictingBookings}
    }

    // compares 2 bookings and returns boolean for conflicting
    const checkBookingForConflict = (existingBooking, newBooking) => {
        const existingBookingEndTime = existingBooking.time + existingBooking.duration
        const newBookingEndTime = newBooking.time + newBooking.duration
        const conflicting =
            (
                newBooking.time >= existingBooking.time &&
                newBooking.time <= existingBookingEndTime
            ) ||
            (
                newBookingEndTime.time >= existingBooking.time &&
                newBookingEndTime.time <= existingBookingEndTime
            )
        return conflicting
    };

    return {
        cleanCsv,
        processBookings
    }
}

module.exports = BookingService()