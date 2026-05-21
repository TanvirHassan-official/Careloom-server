const express = require('express');
const app = express();
require("dotenv").config();
const port = process.env.PORT || 8000;
const cors = require("cors");

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectDB() {
  if (client.topology?.isConnected()) return;
  await client.connect();
  console.log("Connected to MongoDB");
}

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.get('/', (req, res) => {
  res.send('Careloom server is running!');
});

async function run() {
  await connectDB();

  const db = client.db("careloom");
  const doctorCollection = db.collection("Doctors");
  const appointmentCollection = db.collection("Appointments");

  // ─────────────────────────────────────────
  // DOCTOR ROUTES
  // ─────────────────────────────────────────

  // GET /doctors — get all doctors
  // supports: ?search=name  ?specialty=Cardiologist  ?sort=rating
  app.get("/doctors", asyncHandler(async (req, res) => {
    const { search, specialty, sort } = req.query;

    const query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (specialty) {
      query.specialty = { $regex: specialty, $options: "i" };
    }

    let cursor = doctorCollection.find(query);

    if (sort === "rating") {
      cursor = cursor.sort({ rating: -1 });
    } else if (sort === "fee_asc") {
      cursor = cursor.sort({ fee: 1 });
    } else if (sort === "fee_desc") {
      cursor = cursor.sort({ fee: -1 });
    }

    const result = await cursor.toArray();
    res.send(result);
  }));

  // GET /doctors/top-rated — top 3 doctors by rating (for home page)
  app.get("/doctors/top-rated", asyncHandler(async (req, res) => {
    const result = await doctorCollection
      .find()
      .sort({ rating: -1 })
      .limit(3)
      .toArray();
    res.send(result);
  }));

  // GET /doctors/specialties — unique list of all specialties (for filter dropdown)
  app.get("/doctors/specialties", asyncHandler(async (req, res) => {
    const specialties = await doctorCollection.distinct("specialty");
    res.send(specialties);
  }));

  // GET /doctors/category/:specialty — all doctors in a specialty
  app.get("/doctors/category/:specialty", asyncHandler(async (req, res) => {
    const query = {
      specialty: { $regex: req.params.specialty, $options: "i" }
    };
    const result = await doctorCollection.find(query).toArray();
    res.send(result);
  }));

  // GET /doctors/:id — single doctor details
  app.get("/doctors/:id", asyncHandler(async (req, res) => {
    const query = { _id: new ObjectId(req.params.id) };
    const result = await doctorCollection.findOne(query);
    if (!result) return res.status(404).send({ message: "Doctor not found" });
    res.send(result);
  }));

  // ─────────────────────────────────────────
  // APPOINTMENT ROUTES
  // ─────────────────────────────────────────

  // POST /appointments — book a new appointment
  app.post("/appointments", asyncHandler(async (req, res) => {
    const appointment = req.body;

    if (!appointment.userEmail || !appointment.doctorName || !appointment.appointmentDate) {
      return res.status(400).send({ message: "Missing required fields" });
    }

    const newAppointment = {
      ...appointment,
      bookedAt: new Date(),
    };

    const result = await appointmentCollection.insertOne(newAppointment);
    res.status(201).send(result);
  }));

  // GET /appointments?email=user@email.com — get bookings for logged-in user
  app.get("/appointments", asyncHandler(async (req, res) => {
    const { email } = req.query;

    if (!email) {
      return res.status(400).send({ message: "Email query param is required" });
    }

    const result = await appointmentCollection
      .find({ userEmail: email })
      .sort({ bookedAt: -1 })
      .toArray();

    res.send(result);
  }));

  // GET /appointments/:id — single appointment (for pre-filling update form)
  app.get("/appointments/:id", asyncHandler(async (req, res) => {
    const query = { _id: new ObjectId(req.params.id) };
    const result = await appointmentCollection.findOne(query);
    if (!result) return res.status(404).send({ message: "Appointment not found" });
    res.send(result);
  }));

  // PATCH /appointments/:id — update an appointment
  app.patch("/appointments/:id", asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // prevent overwriting protected fields
    delete updates._id;
    delete updates.userEmail;
    delete updates.doctorName;
    delete updates.bookedAt;

    const result = await appointmentCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Appointment not found" });
    }

    res.send(result);
  }));

  // DELETE /appointments/:id — delete an appointment
  app.delete("/appointments/:id", asyncHandler(async (req, res) => {
    const query = { _id: new ObjectId(req.params.id) };
    const result = await appointmentCollection.deleteOne(query);

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "Appointment not found" });
    }

    res.send(result);
  }));
}

run().catch(console.error);

// global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: err.message || "Something went wrong" });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
