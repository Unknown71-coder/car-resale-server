const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
require("dotenv").config();
const jwt = require("jsonwebtoken");
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("simple node serve running");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.fhm17oo.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("unauthorized access");
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}
async function run() {
  try {
    const ProductCatagories = client.db("Product").collection("Catagories");
    const usersCollection = client.db("Product").collection("users");
    const CatagoryData = client.db("Product").collection("Catagory");
    const bookingsCollection = client.db("Product").collection("bookings");
    const productsCollection = client.db("Product").collection("myproducts");

    const verifyAdmin = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);

      if (user?.role !== "admin") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };
    const verifySeller = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);

      if (user?.role !== "seller") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };
    const verifyBuyer = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);

      if (user?.role !== "buyer") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    app.get("/catagories", async (req, res) => {
      const query = {};
      const cursor = ProductCatagories.find(query);
      const catagories = await cursor.toArray();
      res.send(catagories);
    });

    app.get("/catagory/:CatagoryName", async (req, res) => {
      const CatagoryName = req.params.CatagoryName;
      const query = { CatagoryName: CatagoryName };
      const cursor = await CatagoryData.find(query);
      const catData = await cursor.toArray();
      res.send(catData);
    });

    app.get("/bookings", async (req, res) => {
      const email = req.query.email;
      const query = { userEmail: email };
      const bookings = await bookingsCollection.find(query).toArray();
      res.send(bookings);
    });

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const query = {
        name: booking.userName,
        email: booking.userEmail,
        item: booking.itemName,
        resaleprice: booking.price,
        number: booking.number,
        destinaton: booking.location,
      };

      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });

    app.post("/myproducts", async (req, res) => {
      const myproducts = req.body;
      const query = {
        name: myproducts.productName,
        resalePrice: myproducts.resalePrice,
        itemCondition: myproducts.itemCondition,
        mobileNumber: myproducts.mobileNumber,
        location: myproducts.location,
        yearPurchase: myproducts.yearPurchase,
        originalPrice: myproducts.originalPrice,
        description: myproducts.description,
      };

      const result = await productsCollection.insertOne(myproducts);
      res.send(result);
    });
    app.get("/myproducts", async (req, res) => {
      const email = req.query.email;
      const query = { userEmail: email };
      const products = await productsCollection.find(query).toArray();
      res.send(products);
    });

    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === "admin" });
    });

    app.get("/users/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isSeller: user?.role === "seller" });
    }); 
    app.get("/users/buyer/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isBuyer: user?.role === "buyer" });
    }); 

    app.get("/users", async (req, res) => {
      const query = {};
      const users = await usersCollection.find(query).toArray();
      res.send(users);
    });
    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user);
      const result  = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.put("/users/admin/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedAdmin = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updatedAdmin,
        options
      );
      res.send(result);
    });
    app.put("/users/seller/:id",verifyJWT, verifySeller, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedSeller= {
        $set: {
          role: "seller",
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updatedSeller,
        options
      );
      res.send(result);
    });
    app.put("/users/buyer/:id",verifyJWT, verifyBuyer, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedSeller= {
        $set: {
          role: "buyer",
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updatedSeller,
        options
      );
      res.send(result);
    });
  } finally {
  }
}
run().catch((err) => console.error(err));

app.listen(port, () => {
  console.log(`simple node server running on port ${port}`);
});