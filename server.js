var restify = require('restify');
var mongojs = require("mongojs");
 

var ip_addr = process.env.OPENSHIFT_NODEJS_IP   || '127.0.0.1';
var port    = process.env.OPENSHIFT_NODEJS_PORT || '8080';

var db_name = process.env.OPENSHIFT_APP_NAME || "raptstats";

var connection_string = '127.0.0.1:27017/' + db_name;
// if OPENSHIFT env variables are present, use the available connection info:
if(process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
  connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
  process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
  process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
  process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
  process.env.OPENSHIFT_APP_NAME;
}
 
var server = restify.createServer({
    name : "raptstats"
});
 
// configure restify plugins
server.pre(restify.pre.userAgentConnection());
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(restify.CORS());

// configure mongodb
var db = mongojs(connection_string, [db_name]);
var stats = db.collection("rapt_stats");

// implement the rest methods
function findAllStats(req, res , next){
    res.setHeader('Access-Control-Allow-Origin','*');
    stats.find().limit(20).sort({postedOn : -1} , function(err , success){
        console.log('Response success '+success);
        console.log('Response error '+err);
        if(success){
            res.send(200 , success);
            return next();
        }else{
            return next(err);
        }
 
    });
 
}
 
function findStat(req, res , next){
    res.setHeader('Access-Control-Allow-Origin','*');
    stats.findOne({_id:mongojs.ObjectId(req.params.statId)} , function(err , success){
        console.log('Response success '+success);
        console.log('Response error '+err);
        if(success){
            res.send(200 , success);
            return next();
        }
        return next(err);
    })
}
 
function createNewStat(req , res , next){
    var stat = {};
    stat.text = req.params.action.clipname;
    stat.createdOn = new Date();
 
    res.setHeader('Access-Control-Allow-Origin','*');   
 
    stats.save(stat , function(err , success){
        console.log('Response success '+success);
        console.log('Response error '+err);
        if(success){
            res.send(201 , stat);
            return next();
        }else{
            return next(err);
        }
    });
}
 
function deleteStat(req , res , next){
    res.setHeader('Access-Control-Allow-Origin','*');
    stats.remove({_id:mongojs.ObjectId(req.params.statId)} , function(err , success){
        console.log('Response success '+success);
        console.log('Response error '+err);
        if(success){
            res.send(204);
            return next();      
        } else{
            return next(err);
        }
    })
 
}

//routes
var PATH = '/stats'
server.get({path : PATH , version : '0.0.1'} , findAllStats);
server.get({path : PATH +'/:statId' , version : '0.0.1'} , findStat);
server.post({path : PATH , version: '0.0.1'} ,createNewStat);
server.del({path : PATH +'/:statId' , version: '0.0.1'} ,deleteStat);


server.listen(port ,ip_addr, function(){
    console.log('%s listening at %s ', server.name , server.url);
});