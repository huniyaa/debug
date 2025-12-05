import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Router for all API requests
export default async function handler(req, res) {
  // Extract the path after /api/
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  console.log("REQ METHOD:", req.method, "PATH:", pathname);

  console.log("Request:", req.method, pathname);

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).json({});
  }

  try {
    console.log("PATHNAME IS", pathname);
    // ----- TEST ENDPOINT -----
    if (pathname === "/api/test") {
      return res
        .status(200)
        .json({ status: "API working", timestamp: new Date().toISOString() });
    }

    // ----- TRIPS -----
    if (pathname === "/api/trips") {
      if (req.method === "GET") {
        const trips = await prisma.trip.findMany({
          include: { cities: { include: { activities: true } } },
        });
        return res.status(200).json(trips);
      }

      //check
      // DELETE trip by ID
if (req.method === "DELETE" && pathname.startsWith("/api/trips/")) {
  // remove any trailing slash
  (console.log("INNER"));
  const tripId = pathname.replace(/^\/api\/trips\/|\/$/g, "");
  console.log("Deleting trip ID:", tripId);

  if (!tripId) return res.status(400).json({ error: "Trip ID missing" });

  try {
    await prisma.trip.delete({ where: { id: tripId } });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("DELETE trip error:", err);
    return res.status(500).json({ error: err.message });
  }
}


      if (req.method === "POST") {
        const { name, cities } = req.body;
        const trip = await prisma.trip.create({
          data: {
            name,
            cities: {
              create: cities.map((city) => ({
                name: city.name,
                transport: city.transport,
                startDate: city.startDate,
                endDate: city.endDate,
                posX: city.position?.x || 100,
                posY: city.position?.y || 300,
              })),
            },
          },
          include: { cities: { include: { activities: true } } },
        });
        return res.status(201).json(trip);
      }
    }

    // DELETE trip by ID in URL
    /**if (
      pathname.match(/^\/api\/trips\/[a-zA-Z0-9]+$/) &&
      req.method === "DELETE"
    ) {
      const tripId = pathname.split("/").pop();
      await prisma.trip.delete({ where: { id: tripId } });
      return res.status(200).json({ success: true });
    }**/
   
    // DELETE trip by ID
if (req.method === "DELETE" && pathname.startsWith("/api/trips/")) {
  // remove any trailing slash
  (console.log("OUTER"));
  const tripId = pathname.replace(/^\/api\/trips\/|\/$/g, "");
  console.log("Deleting trip ID:", tripId);

  if (!tripId) return res.status(400).json({ error: "Trip ID missing" });

  try {
    await prisma.trip.delete({ where: { id: tripId } });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("DELETE trip error:", err);
    return res.status(500).json({ error: err.message });
  }
}


    // ----- CITIES -----
    if (pathname === "/api/cities" && req.method === "POST") {
      const { tripId, name, transport, startDate, endDate, position } =
        req.body;
      const city = await prisma.city.create({
        data: {
          tripId,
          name,
          transport,
          startDate,
          endDate,
          posX: position?.x || 100,
          posY: position?.y || 300,
        },
        include: { activities: true },
      });
      return res.status(201).json(city);
    }

    // UPDATE city position by ID in URL
    if (
      pathname.match(/^\/api\/cities\/[a-zA-Z0-9]+$/) &&
      req.method === "PATCH"
    ) {
      const cityId = pathname.split("/").pop();
      const { position } = req.body;
      const city = await prisma.city.update({
        where: { id: cityId },
        data: {
          posX: position?.x,
          posY: position?.y,
        },
        include: { activities: true },
      });
      return res.status(200).json(city);
    }

    // DELETE city by ID in URL
    if (
      pathname.match(/^\/api\/cities\/[a-zA-Z0-9]+$/) &&
      req.method === "DELETE"
    ) {
      const cityId = pathname.split("/").pop();
      await prisma.city.delete({ where: { id: cityId } });
      return res.status(200).json({ success: true });
    }

    // ----- ACTIVITIES -----
    if (pathname === "/api/activities" && req.method === "POST") {
      const { cityId, name, type, color, startTime, endTime, notes, date } =
        req.body;
      const activity = await prisma.activity.create({
        data: {
          cityId,
          name,
          type: type || "other",
          color: color || "#F4D03F",
          startTime,
          endTime,
          notes: notes || "",
          date,
        },
      });
      return res.status(201).json(activity);
    }

    // UPDATE activity by ID in URL
    if (
      pathname.match(/^\/api\/activities\/[a-zA-Z0-9]+$/) &&
      req.method === "PATCH"
    ) {
      const activityId = pathname.split("/").pop();
      const { name, type, color, startTime, endTime, notes } = req.body;
      const activity = await prisma.activity.update({
        where: { id: activityId },
        data: {
          name,
          type,
          color,
          startTime,
          endTime,
          notes,
        },
      });
      return res.status(200).json(activity);
    }

    // DELETE activity by ID in URL
    if (
      pathname.match(/^\/api\/activities\/[a-zA-Z0-9]+$/) &&
      req.method === "DELETE"
    ) {
      const activityId = pathname.split("/").pop();
      await prisma.activity.delete({ where: { id: activityId } });
      return res.status(200).json({ success: true });
    }

    // If no route matched
    return res.status(404).json({ error: "Not found", pathname });
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
