// Below we will use the Express Router to define a series of API endpoints.
// Express will listen for API requests and respond accordingly
import express from 'express'
const router = express.Router()

// Prisma lets NodeJS communicate with MongoDB
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ status: 'API is working', timestamp: new Date().toISOString() })
})

// ----- TRIPS -----

// Get all trips
router.get('/trips', async (req, res) => {
    try {
        const trips = await prisma.trip.findMany({
            include: {
                cities: {
                    include: {
                        activities: true
                    }
                }
            }
        })
        res.send(trips)
    } catch (err) {
        console.error('GET /trips error:', err)
        res.status(500).send({ error: 'Failed to fetch trips', details: err.message })
    }
})

// Create a new trip
router.post('/trips', async (req, res) => {
    try {
        const { name, cities } = req.body
        const trip = await prisma.trip.create({
            data: {
                name,
                cities: {
                    create: cities.map(city => ({
                        name: city.name,
                        transport: city.transport,
                        startDate: city.startDate,
                        endDate: city.endDate,
                        posX: city.position?.x || 100,
                        posY: city.position?.y || 300
                    }))
                }
            },
            include: {
                cities: {
                    include: {
                        activities: true
                    }
                }
            }
        })
        res.status(201).send(trip)
    } catch (err) {
        console.error('POST /trips error:', err)
        res.status(500).send({ error: 'Failed to create trip', details: err.message })
    }
})
console.log("before delete")
// Delete a trip
router.delete('/trips/:id', async (req, res) => {
    console.log("inside delete")
    try {
        await prisma.trip.delete({
            where: { id: req.params.id }
        })
        res.send({ success: true })
    } catch (err) {
        console.error('DELETE /trips error:', err)
        res.status(500).send({ error: 'Failed to delete trip', details: err.message })
    }
})

// ----- CITIES -----

// Add a city to a trip
router.post('/cities', async (req, res) => {
    try {
        const { tripId, name, transport, startDate, endDate, position } = req.body
        const city = await prisma.city.create({
            data: {
                name,
                transport,
                startDate,
                endDate,
                posX: position?.x || 100,
                posY: position?.y || 300,
                tripId
            },
            include: {
                activities: true
            }
        })
        res.status(201).send(city)
    } catch (err) {
        console.error('POST /cities error:', err)
        res.status(500).send({ error: 'Failed to create city', details: err.message })
    }
})

// Update city position
router.patch('/cities/:id', async (req, res) => {
    try {
        const { position } = req.body
        const city = await prisma.city.update({
            where: { id: req.params.id },
            data: {
                posX: position?.x || undefined,
                posY: position?.y || undefined
            },
            include: {
                activities: true
            }
        })
        res.send(city)
    } catch (err) {
        console.error('PATCH /cities error:', err)
        res.status(500).send({ error: 'Failed to update city', details: err.message })
    }
})
console.log("before delete city")
// Delete a city
router.delete('/cities/:id', async (req, res) => {
    try {
        console.log("inside delete city")
        await prisma.city.delete({
            where: { id: req.params.id }
        })
        res.send({ success: true })
    } catch (err) {
        console.error('DELETE /cities error:', err)
        res.status(500).send({ error: 'Failed to delete city', details: err.message })
    }
})

// ----- ACTIVITIES -----

// Add an activity to a city
router.post('/activities', async (req, res) => {
    try {
        const { cityId, name, type, color, startTime, endTime, notes, date } = req.body
        const activity = await prisma.activity.create({
            data: {
                name,
                type,
                color,
                startTime,
                endTime,
                notes,
                date,
                cityId
            }
        })
        res.status(201).send(activity)
    } catch (err) {
        console.error('POST /activities error:', err)
        res.status(500).send({ error: 'Failed to create activity', details: err.message })
    }
})

// Update an activity
router.patch('/activities/:id', async (req, res) => {
    try {
        const { name, type, color, startTime, endTime, notes } = req.body
        const activity = await prisma.activity.update({
            where: { id: req.params.id },
            data: {
                name,
                type,
                color,
                startTime,
                endTime,
                notes
            }
        })
        res.send(activity)
    } catch (err) {
        console.error('PATCH /activities error:', err)
        res.status(500).send({ error: 'Failed to update activity', details: err.message })
    }
})

// Delete an activity
router.delete('/activities/:id', async (req, res) => {
    try {
        await prisma.activity.delete({
            where: { id: req.params.id }
        })
        res.send({ success: true })
    } catch (err) {
        console.error('DELETE /activities error:', err)
        res.status(500).send({ error: 'Failed to delete activity', details: err.message })
    }
})

// export the api routes for use elsewhere in our app
export default router;

