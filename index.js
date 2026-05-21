const express = require('express');
const app = express();
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 8000;
const cors = require("cors");

app.use(cors());
app.use(express.json());

// const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});



// ✅ GLOBAL CACHE (IMPORTANT FOR VERCEL)
let cachedClient = global.mongoClient;

if (!cachedClient) {
  cachedClient = global.mongoClient = {
    client: null,
    promise: null,
  };
}







// let isConnected = false;

async function connectDB() {
  if (cachedClient.client) return cachedClient.client;

  if (!cachedClient.promise) {
    cachedClient.promise = client.connect();
  }

  cachedClient.client = await cachedClient.promise;
  return cachedClient.client;
}


// const asyncHandler = (fn) => (req, res, next) => {
//   Promise.resolve(fn(req, res, next)).catch(next);
// };

app.get('/', (req, res) => {
  res.send('Hello world!');
});

// async function run() {
//   await connectDB();
// // await client.connect()

//   const db = client.db("careloom");
//   const doctorCollection = db.collection("Doctors");

//   app.get("/doctors", asyncHandler(async (req, res) => {
//     const result = await doctorCollection.find().toArray();
//     res.send(result);
//   }));

//   app.get("/doctors/:doctorId", asyncHandler(async (req, res) => {
//     const query = { _id: new ObjectId(req.params.doctorId) };
//     const result = await doctorCollection.findOne(query);
//     res.send(result);
//   }));

//   // Add all future POST, PATCH, DELETE routes here the same way...
//   // app.post("/appointments", asyncHandler(async (req, res) => { ... }));
//   // app.delete("/appointments/:id", asyncHandler(async (req, res) => { ... }));
// }


// run().catch(console.error);

// error handler for alll routes



async function run() {
  const client = await connectDB();

  const db = client.db("careloom");
  const doctorCollection = db.collection("Doctors");

  app.get("/doctors", async (req, res, next) => {
    try {
      const result = await doctorCollection.find().toArray();
      res.send(result);
    } catch (err) {
      next(err);
    }
  });

  app.get("/doctors/:doctorId", async (req, res, next) => {
    try {
      const query = { _id: new ObjectId(req.params.doctorId) };
      const result = await doctorCollection.findOne(query);
      res.send(result);
    } catch (err) {
      next(err);
    }
  });
}

run().catch(console.error);



app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: err.message || "Something went wrong" });
});

// app.listen(port, () => {
//   console.log(`Server listening on port ${port}`);
// });

module.exports = app;