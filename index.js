const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// middleware

app.use(
  cors({
    origin: [
      // "http://localhost:5173",
      "https://blog-website-366b7.web.app",
      "https://blog-website-366b7.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// created middleware
const logger = async (req, res, next) => {
  console.log(req.method, req.url);
  next();
};

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  // console.log('token in the middleware', token);
  if (!token) {
    return res.status(401).send({ message: "unauthorized access *" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1gnzeig.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const blogCollection = client.db("blogDB").collection("blogs");
    const wishCollection = client.db("wishDB").collection("wishes");
    const commentCollection = client.db("commentDB").collection("comments");

    // jwt token api
    app.post("/jwt", logger, async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });

    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("logging out", user);
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

    // creating new posts
    app.post("/blogs", logger, async (req, res) => {
      const blog = req.body;
      console.log(blog);
      const result = await blogCollection.insertOne(blog);
      res.send(result);
    });

    // getting a single blog
    app.get("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogCollection.findOne(query);
      res.send(result);
    });

    app.get("/blog/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogCollection.findOne(query);
      res.send(result);
    });

    // updating a single blog post
    app.put("/blogs/:id", logger, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const updateBlog = req.body;
      console.log(updateBlog);
      const updateDoc = {
        $set: {
          title: updateBlog.title,
          image: updateBlog.image,
          category: updateBlog.category,
          short_description: updateBlog.short_description,
          long_description: updateBlog.long_description,
          time: updateBlog.time,
        },
      };
      const result = await blogCollection.updateOne(filter, updateDoc, option);
      res.send(result);
    });

    // reading blog post from database and filter according to category and search according to title
    app.get("/blogs", async (req, res) => {
      let query = {};

      const { category, title } = req.query;

      if (category) {
        query.category = category;
      }
      if (title) {
        query.title = title;
      }

      const cursor = blogCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // creating wishlist for blog posts
    app.post("/blogs/wish", async (req, res) => {
      const wish = req.body;
      console.log("wish-list", wish);
      const result = await wishCollection.insertOne(wish);
      res.send(result);
    });

    // loading user specific wishlist
    app.get("/wish", logger, verifyToken, async (req, res) => {
      console.log("token owner info", req.user);
      if (req.user.email !== req.query.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await wishCollection.find(query).toArray();

      res.send(result);
    });

    // getting comments and render in detail blog page
    app.get("/comments/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await commentCollection.findOne(query);
      res.send(result);
    });

    app.get("/comment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { blogId: id };
      const result = await commentCollection.find(query).toArray();
      res.send(result);
    });

    // posting comments in comment database
    app.post("/comments", async (req, res) => {
      const comment = req.body;
      console.log(comment);
      const result = await commentCollection.insertOne(comment);
      res.send(result);
    });

    // delete item from wishlist
    app.delete("/wish/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await wishCollection.deleteOne(query);
      res.send(result);
    });

    //  posting detail blog in detail collection
    app.post("/details", async (req, res) => {
      const blog = req.body;
      console.log(blog);
      const result = await detailsCollection.insertOne(blog);
      res.send(result);
    });

    // loading category specific blog
    app.get("/blogs", async (req, res) => {
      let query = {};

      const category = req.query?.category;

      if (category) {
        query = { category: req.query.category };
      }
      const result = await blogCollection.find(query).toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send(" blog website server is running");
});

app.listen(port, () => {
  console.log(`Blog website server is running on port ${port} `);
});
