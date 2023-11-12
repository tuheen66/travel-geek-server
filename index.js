const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middleware

app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1gnzeig.mongodb.net/?retryWrites=true&w=majority`;

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
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const blogCollection = client.db("blogDB").collection('blogs')
        const wishCollection = client.db("wishDB").collection('wishes')
        const commentCollection = client.db("commentDB").collection('comments')

        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log(user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: false,
                    sameSite: 'none'
                })
                .send({ success: true })
        })

        app.post('/blogs', async (req, res) => {
            const blog = req.body;
            console.log(blog);
            const result = await blogCollection.insertOne(blog);
            res.send(result)
        })

        app.get('/blogs', async (req, res) => {
            const cursor = blogCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })


        app.post('/blogs/wish', async (req, res) => {
            const wish = req.body;
            console.log('wish-list', wish);
            const result = await wishCollection.insertOne(wish);
            res.send(result)
        })



        // loading user specific wishlist
        app.get('/wish', async (req, res) => {

            let query = {}

            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await wishCollection.find(query).toArray();

            res.send(result)
        })


        app.delete('/wish/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await wishCollection.deleteOne(query);
            res.send(result)
        })

        //  posting detail blog in detail collection

        app.post('/details', async (req, res) => {
            const blog = req.body;
            console.log(blog);
            const result = await detailsCollection.insertOne(blog);
            res.send(result)

        })

        // posting comments in comment database

        app.post('/comments', async (req, res) => {
            const comment = req.body;
            console.log(comment)
            const result = await commentCollection.insertOne(comment)

        })

         // getting comments and render in detail blog page

         app.get('/comments', async (req, res) => {
            const cursor = commentCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

       

        // loading category specific blog

        app.get('/blogs', async (req, res) => {
            let query = {}

            const category = req.query?.category;

            if (category) {
                query = { category: req.query.category }
            }
            const result = await blogCollection.find(query).toArray()
            res.send(result)







            // let sortObj = {}

            // const sortField = req.query.sortField;
            // const sortOrder = req.query.sortOrder;


            // if (sortField && sortOrder) {
            //     sortObj[sortField] = sortField
            // }

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









app.get('/', (req, res) => {
    res.send(' blog website server is running')
})

app.listen(port, () => {
    console.log(`Blog website server is running on port ${port} `);
})