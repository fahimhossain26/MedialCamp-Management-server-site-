const express = require('express')
const app = express();
const cors = require('cors')
require('dotenv').config()
const stripe = require("stripe")(process.env.STRIPE_SECRECT_KEY)
const port = process.env.PORT || 5000;


//midleware

const corsOptions = {
  origin: ['http://localhost:5173', 'https://assignment-12-4b1db.web.app', 'https://assignment-12-server-ruby.vercel.app'],
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions))

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

    // await client.connect();

    const campCollection = client.db("MCMS").collection("camps");
    const usersCollecction = client.db("MCMS").collection("users");
    const bookingsCollection = client.db("MCMS").collection("bookings")

    // // Verify Token Middleware
    // const verifyToken = async (req, res, next) => {
    //   const token = req.cookies?.token
    //   console.log(token)
    //   if (!token) {
    //     return res.status(401).send({ message: 'unauthorized access' })
    //   }
    //   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    //     if (err) {
    //       console.log(err)
    //       return res.status(401).send({ message: 'unauthorized access' })
    //     }
    //     req.user = decoded
    //     next()
    //   })
    // }
    // //------------------Verify Token Middleware close ---------



    // //verify admin middleware 
    // const verifyAdmin=async (req,res,next)=>{
    //   const user=req.user
    //   const query={email:user?.email}
    //   const result=await usersCollecction.findOne(query)
    //   if(!result || result?.role !=='admin') return res.status(401).send({message:'forbidden Access'})

    //     next()
    //   }



    //get all camps
    app.get('/camps', async (req, res) => {
      const result = await campCollection.find().toArray()
      res.send(result)
    })



    //save a user data in DB 
    app.put('/user', async (req, res) => {
      const user = req.body
      const query = { email: user?.email }
      //check if user already exist in Db 
      const isExist = await usersCollecction.findOne(query)
      // if(isExist) return res.send(isExist)
      if (isExist) {
        if (user.status === 'Requested') {
          const result = await usersCollecction.updateOne(query,
            {
              $set: { status: user?.status },
            })
          return res.send(result)

        }
        else {
          return res.send(isExist)
        }
      }
      //save user for first time 
      const options = { upsert: true }

      const updateDoc = {
        $set: {
          ...user,
          Timestamp: Date.now()
        }
      }
      const result = await usersCollecction.updateOne(query, updateDoc, options)
      res.send(result)
    })



    //get user info  by email   from db 
    app.get('/user/:email', async (req, res) => {
      const email = req.params.email
      const result = await usersCollecction.findOne({ email })
      res.send(result)
    })

    //get all users from Db
    app.get('/users', async (req, res) => {
      const result = await usersCollecction.find().toArray()
      res.send(result)
    })

    //update user role
    app.patch('/users/update/:email', async (req, res) => {
      const email = req.params.email
      const user = req.body
      const query = { email }
      const updateDoc = {
        $set: { ...user, Timestamp: Date.now() },
      }
      const result = await usersCollecction.updateOne(query, updateDoc)
      res.send(result)
    })

    //save a camp Data in Db 
    app.post('/camp', async (req, res) => {
      const campData = req.body
      const result = await campCollection.insertOne(campData)
      res.send(result)
    })

    //create-payment-intent
    app.post('/create-payment-intent', async (req, res) => {
      const price = req.body.price
      const priceInCent = parseFloat(price) * 100
      if (!price || priceInCent < 1) return
      //generate Client Secret 
      const { client_secret } = await stripe.paymentIntents.create({
        amount: priceInCent,
        currency: 'usd',

        automatic_payment_methods: {
          enabled: true,
        },
      })
      res.send({ clientSecret: client_secret })

    })



    //get all camps for organizer(host)
    app.get('/my-listing/:email', async (req, res) => {
      const email = req.params.email
      let query = { 'organizer.email': email }
      const result = await campCollection.find(query).toArray()
      res.send(result)
    })

    // delelte a camp 
    app.delete('/camp/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await campCollection.deleteOne(query)
      res.send(result)
    })




    // Get a single camp  data from db using _id
    app.get('/camp/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await campCollection.findOne(query)
      res.send(result)
    })


    //save a booking Data in Db 
    app.post('/booking', async (req, res) => {
      const bookingData = req.body
      // savecamp booking Info
      const result = await bookingsCollection.insertOne(bookingData)
      // //change Camp availablity status
      // const campId=bookingData?.campId
      // const query={_id:new ObjectId(campId)}
      // const updateDoc={
      //   $set:{booked:true},
      // }
      // const updatedCamp=await campCollection.updateOne(query,updateDoc)
      // console.log(updatedCamp);

      res.send(result)
    })


    //update camp data 
    app.put('/camp/update/:id', async (req, res) => {
      const id = req.params.id
      const campData = req.body
      const query = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: campData
      }
      const result = await campCollection.updateOne(query, updateDoc)
      res.send(result)
    })




    //update Camp status
    app.patch('/camp/status/:id', async (req, res) => {
      const id = req.params.id
      const status = req.body.status
      //change Camp availablity status
      const query = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: { booked: status },
      }
      const result = await campCollection.updateOne(query, updateDoc)
      res.send(result)
    })

    //get all bookings for a guest 
    app.get('/my-bookings/:email', async (req, res) => {
      const email = req.params.email
      const query = { 'participant.email': email }
      const result = await bookingsCollection.find(query).toArray()
      res.send(result)
    })

    //delete a booking 
    app.delete('/booking/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await bookingsCollection.deleteOne(query)
      res.send(result)
    })



    // Host Statistics
    app.get('/host-stat', async (req, res) => {
      const { email } = req.user
      const bookingDetails = await bookingsCollection
        .find(
          { 'organizer.email': email },
          {
            projection: {
              date: 1,
              price: 1,
            },
          }
        )
        .toArray()

      const totalCamps = await campCollection.countDocuments({
        'organizer.email': email,
      })
      const totalPrice = bookingDetails.reduce(
        (sum, booking) => sum + booking.price,
        0
      )
      const { timestamp } = await usersCollection.findOne(
        { email },
        { projection: { timestamp: 1 } }
      )

      const chartData = bookingDetails.map(booking => {
        const day = new Date(booking.date).getDate()
        const month = new Date(booking.date).getMonth() + 1
        const data = [`${day}/${month}`, booking?.price]
        return data
      })
      chartData.unshift(['Day', 'Sales'])


      console.log(chartData)

      console.log(bookingDetails)
      res.send({
        totalCamps,
        totalBookings: bookingDetails.length,
        totalPrice,
        chartData,
        hostSince: timestamp,
      })
    })




    
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('server iis running ')
})

app.listen(port, () => {
  console.log(`MCMS is runningg onn the port ${port}`);
})