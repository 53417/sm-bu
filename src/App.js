import React, { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import './App.css'
import csv from 'csv'
import BookingService from './services/bookingService'

// Big Calendar dependencies
import { Calendar, momentLocalizer  } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment'
const localizer = momentLocalizer(moment)

const apiUrl = 'http://localhost:3001'

export const App = () => {

    // assume bookingsState is always confirmed bookings from server
    const [bookingsState, setBookingsState] = useState([])
    // proposed bookings to be updated on confirmation
    const [nonConflictingBookingsState, setNonConflictingBookingsState] = useState([])
    // bookings that will not be updated on confirmation as they conflict with existing confirmed bookings
    const [conflictingBookingsState, setConflictingBookingsState] = useState([])
    // state for Big Calender
    const [events, setEvents] = useState([])

    // convert to Big Calender specific props
    // http://jquense.github.io/react-big-calendar/examples/index.html#prop-events
    const formatToBigCalenderEvent = (bookings, eventType) => {
        const formattedBookings = []
        bookings.forEach(booking => {
            const formattedBooking = {
                start: moment(booking.time).toDate(),
                end: moment(booking.time).add(booking.duration, "milliseconds").toDate(),
                title: `${eventType}: ${booking.userId}`
            }
            formattedBookings.push(formattedBooking)
        })
        return formattedBookings
    }

    // get bookings from the server + format them for the calendar
    const getBookings = () => {
        fetch(`${apiUrl}/bookings`)
            .then(response => response.json())
            .then(data => {
                if(data.length > 0) {
                    setBookingsState(data)
                    const formatted = formatToBigCalenderEvent(data, "Confirmed")
                    setEvents(formatted)
                }
            })
    }

    useEffect(() => {
        getBookings()
    }, [])

    // reset states to BEFORE file input
    const resetBookings = () => {
        setNonConflictingBookingsState([])
        setConflictingBookingsState([])
        setEvents(formatToBigCalenderEvent(bookingsState))
    }

    // post the server with new non conflicting bookings
    const postBookings = async () => {
        if(nonConflictingBookingsState === []) {
            return alert("upload a file")
        }
        try {
            const payload = {
                method: "POST",
                body: JSON.stringify(nonConflictingBookingsState),
                headers: { "Content-Type": "application/json" }
            }
            let res = await fetch(`${apiUrl}/bookings`, payload)
            if (res.ok) {
                alert(res.statusText)
                resetBookings()
                getBookings()
            } else {
                alert(res.statusText)
            }
        } catch (err) {
            alert(err)
            return
        }
    }

    // handles files from react-dropzone
    const onDrop = acceptedFiles => {
        const reader = new FileReader();

        reader.onabort = () => alert("file reading was aborted");
        reader.onerror = () => alert("file reading failed");
        reader.onload = () => {
            // parse csv
            csv.parse(reader.result, (err, data) => {
                const newBookings = BookingService.cleanCsv(data)

                // dont mutate state
                const copyOfBookingsState =[]
                bookingsState.map(booking => copyOfBookingsState.push(booking))

                // determine which bookings are conflicting and non-conflicting
                const processedBookings = BookingService.processBookings(newBookings, copyOfBookingsState)
                setNonConflictingBookingsState(processedBookings.nonConflictingBookings)
                setConflictingBookingsState(processedBookings.conflictingBookings)

                // update events state for calendar view
                const formattedNonConflictingBookings = formatToBigCalenderEvent(processedBookings.nonConflictingBookings, "New")
                const formattedConflictingBookings = formatToBigCalenderEvent(processedBookings.conflictingBookings, "Conflicting")
                setEvents(events.concat(formattedNonConflictingBookings, formattedConflictingBookings))
            });
        };

        // read each file
        acceptedFiles.forEach(file => reader.readAsBinaryString(file));
    }

    // change background color of events based on title
    const eventStyleGetter = (event, start, end, isSelected) => {
        let backgroundColor = '#3174ad'
        if( event.title.includes('Conflicting') ) {
            backgroundColor = '#cc0000'
        } else if ( event.title.includes('New') ) {
            backgroundColor =  '#00b300'
        }
        const style = {
            backgroundColor: backgroundColor,
            borderRadius: '0px',
            opacity: 0.8,
            color: '#fff',
            border: '0px',
            display: 'block'
        };
        return {
            style: style
        };
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    return (
        <div className='App'>
            <div className="App-header" {...getRootProps()}>
                <input {...getInputProps()} />
                <p>Drag files here</p>
            </div>

            <div className='App-main'>

                <h1>BOOKINGS</h1>
                {
                    nonConflictingBookingsState.length > 0 &&
                    <div >
                        <p>Confirm new non-conflicting bookings?</p>
                        <button onClick={postBookings}>Confirm</button>
                        <button onClick={resetBookings}>Reset</button>
                    </div>
                }

                {
                    events.length > 0 &&
                    <div>
                        <Calendar
                            localizer={localizer}
                            defaultDate={new Date('2020-03-01')}
                            defaultView="week"
                            events={events}
                            style={{ height: "100vh" }}
                            eventPropGetter={(eventStyleGetter)}
                        />
                    </div>
                }
            </div>
        </div>
    )
}
