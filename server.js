//declaracion de cliente mongo db y ConnectionString
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var express = require("express");
var app = express();
var bodyParser = require('body-parser');
var redis = require("redis");
var redis_client = redis.createClient();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Expose-Headers', 'Content-Length');
    res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
    if (req.method === 'OPTIONS') {
      // console.log(req);
      return res.send(200);
    } else {
      return next();
    }
  });

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
                if(results.length==0)
                {
                    res.writeHead(404, {"Content-Type": "application/json"});
                    res.write(JSON.stringify(results));
                    res.end();   
                }
                else
                {
                    res.writeHead(200, {"Content-Type": "application/json"});
                    res.write(JSON.stringify(results[0]));
                    res.end();
                }
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
        }
    })
   });

app.delete("/api/v1/deck/:id", (req, res) => {
    var id = req.params.id;
    GetDeck(id).then(function(results) {
        if( results===[] )
        { 
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
        redis_lookup(id).then(function(redis_results){
            
            if (redis_results === JSON.parse(null))
            {
                console.log("DB consulted for record");
                resolve(GetDeck_mongo(id));
            }
            else
            {
                console.log("Record consulted in redis");
                console.log(redis_results);
                resolve([redis_results]);
            }
        });
    })

}

function GetDeck_mongo(id)
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
                if(result.length==1){
                    redis_insert(id,result[0]);
                }
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
          redis_insert(res.insertedId,res.ops[0]);
          db.close();
        });
      });
}

function deleteDeck(id)
{
    return new Promise(function(resolve,reject){
        redis_delete(id)
        MongoClient.connect(url, function(err, db) {
            if (err) return reject(err.message);
            var dbo = db.db("manaApp");
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

function redis_lookup(id)
{
    return new Promise(function(resolve,reject){
        redis_client.get(id, function(error, result) {
            if (error) reject('Fallo en lectura de redis');
            else resolve(JSON.parse(result));
        });
    });
}
function redis_insert(id,object)
{
    redis_client.set(id, JSON.stringify(object), redis.print);
}

function redis_delete(id)
{
    console.log("Record from redis erased");
    redis_client.del(id);
}

//levantamos el servidor
function createServer(){
    app.listen(3000, () => {
    console.log("Server running on port 3000");
    });
}

//ejecuccion 
createServer();
