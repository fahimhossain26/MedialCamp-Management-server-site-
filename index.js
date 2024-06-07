const express=require('express')
const app= express();
const cors=require('cors')
require('dotenv').config()
const port=process.env.PORT ||5000;

//midleware

const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5000'],
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
// app.use(cors());
app.use(express.json());




const { MongoClient, ServerApiVersion, ObjectId, Timestamp } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bjcm9nm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
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

    const campCollection = client.db("MCMS").collection("camps");
    const usersCollecction=client.db("MCMS").collection("users");

    //get all camps
    app.get('/camps',async (req,res)=>{
      const result = await campCollection.find().toArray()
      res.send(result)
    })

    //save a user data in DB 
    app.put('/user',async (req,res)=>{
      const user=req.body
//check if user already exist in Db 
const isExist= await usersCollecction.findOne({email: user?.email})
if(isExist) return res.send(isExist)

      const options={upsert:true}
      const query={email:user?.email}
      const updateDoc ={
        $set:{
          ...user,
          Timestamp:Date.now()
        }
      }
      const result  = await usersCollecction.updateOne(query,updateDoc,options)
    res.send(result)
    })


    //save a camp Data in Db 
    app.post('/camp',async (req,res)=>{
      const campData=req.body 
      const result=campCollection.insertOne(campData)
      res.send(result)
    })

    //get all camps for organizer(host)
    app.get('/my-listing/:email',async (req,res)=>{
      const email=req.params.email
  let query={'organizer.email':email}
      const result = await campCollection.find(query).toArray()
      res.send(result)
    })

    // delelte a camp 
    app.delete('/camp/:id',async(req,res)=>{
      const id=req.params.id
      const query={_id: new ObjectId(id)}
      const result=await campCollection.deleteOne(query)
      res.send(result)
    })




        // Get a single camp  data from db using _id
        app.get('/camp/:id', async (req, res) => {
          const id = req.params.id
          const query = { _id: new ObjectId(id) }
          const result = await campCollection.findOne(query)
          res.send(result)
        })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/',(req,res)=>{
    res.send('server iis running ')
})

app.listen(port,()=>{
    console.log(`MCMS is runningg onn the port ${port}`);
})