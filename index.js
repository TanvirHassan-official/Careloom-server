const express = require('express');
const app = express();
require("dotenv").config();
const port = process.env.PORT || 8000;
const cors = require("cors");
app.use(cors());
app.get('/', (req, res) => {
  res.send('Hello world!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = process.env.MONGO_URI;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    await client.connect();
    
    const db = client.db("careloom");
    const doctorCollection = db.collection("Doctors");
    
    //All doctor
    app.get("/doctors", async (req, res)=>{
        const cursor = doctorCollection.find();
        const result = await cursor.toArray();

        res.send(result);
    })

    // SIngle doctor
    app.get("/doctors/:doctorId", async (req, res)=>{
        const doctorId = req.params.doctorId;
        const query = { _id: new ObjectId(doctorId)};
        
        const result = await doctorCollection.findOne(query);

        res.send(result);
    })




    //await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
