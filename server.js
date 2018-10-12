//declaracion de cliente mongo db y ConnectionString
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var express = require("express");
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
var decks = {"decks":[
    { id: 1, name: 'Aggro',
      red:0,white:0,black:0,blue:0,green:0,lands:0},
    { id: 2, name: 'Azorius',
      red:0,white:0,black:0,blue:0,green:0,lands:0 },
    { id: 3, name: 'Golgari',
      red:0,white:0,black:0,blue:0,green:0,lands:0 },
    { id: 4, name: 'Mana Rampage',
      red:0,white:0,black:0,blue:0,green:0,lands:0 },
    { id: 5, name: 'Eldrazi Rampage',
      red:0,white:0,black:0,blue:0,green:0,lands:0 },
    { id: 6, name: 'Control',
      red:0,white:0,black:0,blue:0,green:0,lands:0 }
  ]};
  
//declaracion de los servicios API
app.get("/api/v1/deck/:id?", (req, res) => {
    var id = req.params.id;
    if (id===undefined)
    {
        GetDecks().then(function(results) {
            res.writeHead(200, {"Content-Type": "application/json"});
            res.write(JSON.stringify(results));
            res.end();
            })
    }
    else
    {
        GetDeck(id).then(function(results) {
            res.writeHead(200, {"Content-Type": "application/json"});
            res.write(JSON.stringify(results));
            res.end();
            })
    }
   });

app.post('/api/v1/deck', function(req, res) {
    var deck = req.body;
    insertDeck(deck);
    res.writeHead(200, {"Content-Type": "application/json"});
    res.write(JSON.stringify({status:"ok"}));
    res.end();
});

app.put("/api/v1/deck/:id", (req, res) => {
    var id = req.params.id;
    var filtered_decks = decks.decks.filter(x => x.name==id)
    console.log(filtered_decks);
    if( filtered_decks.length>0 )
    { 
        //mandar a cambiar el deck
        for(var d in decks.decks)
        {
            if(decks.decks[d].name==id)
            {
                decks.decks[d] = req.body;
            }
        }
        res.writeHead(200, {"Content-Type": "text/plain"});
        res.write("ok");
        res.end();
    }
    else
    {
        res.writeHead(404, {"Content-Type": "text/plain"});
        res.write("404 Not found");
        res.end();
    }
   });

   app.delete("/api/v1/deck/:id", (req, res) => {
    var id = req.params.id;
    var filtered_decks = decks.decks.filter(x => x.name==id)
    if( filtered_decks.length>0 )
        { 
            // decks.decks.splice(x => x.id !==id)
            decks.decks = decks.decks.filter(x => x.name!==id)
            res.writeHead(200, {"Content-Type": "text/plain"});
            res.write("ok");
            res.end();
        }
        else
        {
            res.writeHead(404, {"Content-Type": "text/plain"});
            res.write("404 Not found");
            res.end();
        }
   });

function GetDecks()
{
    return new Promise(function(resolve,reject){
    MongoClient.connect(url, function(err, db) {
        if (err) return reject('Fallo la conexion a la base de datos');
        console.log("connected to Database");
        var dbo = db.db("manaApp");
        dbo.collection("decks").find({}).toArray( function(err, result) {
            if (err) return reject('Fallo el query a la base de datos');
            resolve(result);
            console.log("query executed");
            db.close();
            console.log("conection Closed");
            })
        })
    })
}
function GetDeck(id)
{
    return new Promise(function(resolve,reject){
    MongoClient.connect(url, function(err, db) {
        if (err) return reject('Fallo la conexion a la base de datos');
        console.log("connected to Database");
        var dbo = db.db("manaApp");
        var ObjectId = require('mongodb').ObjectID;
        var query = {_id: new ObjectId(id)};
        dbo.collection("decks").find(query).toArray( function(err, result) {
            if (err) return reject('Fallo el query a la base de datos');
            resolve(result);
            console.log("query executed");
            db.close();
            console.log("conection Closed");
            })
        })
    })
}

function insertDeck(myobj)
{
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        console.log("connected to Database");
        var dbo = db.db("manaApp");
        dbo.collection("decks").insertOne(myobj, function(err, res) {
          if (err) throw err;
          console.log("1 document inserted");
          db.close();
        });
      });
}

//levantamos el servidor
function createServer(){
    app.listen(3000, () => {
    console.log("Server running on port 3000");
    });
}

//ejecuccion 
createServer();
