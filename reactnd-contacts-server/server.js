const express = require("express");
const { Sequelize, DataTypes, Model } = require("sequelize");
const bodyParser = require("body-parser");
const cors = require("cors");
const config = require("./config");
const path = require("path");
const contacts = require("./contacts");

const app = express();


app.use(express.static("public"));

// const corsOptions = {
//   origin: 'http://demo-app-08-env-1.eba-scwptgmm.us-east-1.elasticbeanstalk.com',
//   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//   credentials: true,  // Omogući da se kolačići šalju preko CORS zahteva (ako ih koristite)
//   optionsSuccessStatus: 204,  // Neophodno za podršku zahteva OPTIONS
// };

app.use(cors());

// const sequelize = new Sequelize(
//   'postgres://milesoda:shaban333@storefront-db.cyfsaxslc7ke.us-east-1.rds.amazonaws.com:5432/postgres',
  
// );

const sequelize = new Sequelize({
  database:'postgres',
  username:'postgres',
  password:'shaban333',
  host:'storefront-db.cyfsaxslc7ke.us-east-1.rds.amazonaws.com',
  port:5432,
  dialect:'postgres',
  dialectOptions:{
    ssl:{
      require: true,
      rejectUnauthorized: false
    }
  }
}
  
);

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
    },
    avatarURL: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    modelName: "User",
  }
);

// app.options('*', cors(corsOptions)); // Dodajte ovo iznad ostalih ruta


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/client/index.html"));
});

app.use((req, res, next) => {
  const token = req.get("Authorization");
  // const token = 'token'

  if (token) {
    req.token = token;
    next();
  } else {
    res.status(403).send({
      error:
        "Please provide an Authorization header to identify yourself (can be whatever you want)",
    });
  }
});

app.get("/contacts", async (req, res) => {
  const users = await User.findAll();
  res.send(users.map(({ dataValues }) => ({
    id: dataValues.id,
    name: dataValues.name,
    email: dataValues.email
  })));
});

app.delete("/contacts/:id", (req, res) => {
  res.send(contacts.remove(req.token, req.params.id));
});

app.post("/contacts", bodyParser.json(), (req, res) => {
  const { name, email } = req.body;

  if (name && email) {
    res.send(contacts.add(req.token, req.body));
  } else {
    res.status(403).send({
      error: "Please provide both a name and an email address",
    });
  }
});

app.listen(config.port, async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
    console.log("Server listening on port %s, Ctrl+C to stop", config.port);
    await User.sync();
    contacts.defaultData.contacts.forEach((contact) => {
      User.findOrCreate({ where: { id: contact.id }, defaults: contact });
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
});
