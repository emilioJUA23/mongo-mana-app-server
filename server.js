//declaracion de cliente mongo db y ConnectionString
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var express = require("express");
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
  
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
    var body = req.body;
    GetDeck(id).then(function(results) {
        if( results===[] )
        { 
            // decks.decks.splice(x => x.id !==id)
            res.writeHead(404, {"Content-Type": "text/plain"});
            res.write("404 Not found");
            res.end();
        }
        else
        {
            deleteDeck(id).then(function(results)
            {
                insertDeck(body);
                res.writeHead(200, {"Content-Type": "text/plain"});
                res.write("ok");
                res.end();
            });
            res.writeHead(200, {"Content-Type": "text/plain"});
            res.write("ok");
            res.end();
        }
    })
   });

app.delete("/api/v1/deck/:id", (req, res) => {
    var id = req.params.id;
// var filtered_decks = decks.decks.filter(x => x.name==id)
    GetDeck(id).then(function(results) {
        if( results===[] )
        { 
            // decks.decks.splice(x => x.id !==id)
            res.writeHead(404, {"Content-Type": "text/plain"});
            res.write("404 Not found");
            res.end();
        }
        else
        {
            deleteDeck(id);
            res.writeHead(200, {"Content-Type": "text/plain"});
            res.write("ok");
            res.end();
        }
        })
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

function deleteDeck(id)
{
    return new Promise(function(resolve,reject){
        MongoClient.connect(url, function(err, db) {
            if (err) return reject(err.message);
            var dbo = db.db("manaApp");
            var myquery = { address: 'Mountain 21' };
            var ObjectId = require('mongodb').ObjectID;
            var query = {_id: new ObjectId(id)};
            dbo.collection("decks").deleteOne(query, function(err, obj) {
                if (err) return reject(err.message);
                console.log("1 document deleted");
                db.close();
                return resolve("ok");
            });
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
