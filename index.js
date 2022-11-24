const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// middlewire 
app.use(cors());
app.use(express.json());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xvker.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyJWT =(req, res, next)=>{
    const authHeader = req.headers.authorization;

    if(!authHeader){
        return res.status(401).send('unathorized access');
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
        if(err){
            res.status(403).send({message:'forbidden access'})
        }
        req.decoded = decoded;
        next();
    })
}
async function run(){
    try{
        console.log('Connected Succesfully');
      
        // const verifyAdmin = async (req, res, next)=>{
        //     const decodedEmail = req.decoded.email;
        //     const q = {
        //         email:decodedEmail
        //     }

        //     const user = await users.findOne(q);
        //     if(user?.role !=='admin'){
        //         return res.status(403).send({message:'forbidden access'})
        //     }
        //     next();
        // }
        app.get('/jwt', async(req, res)=>{
            const email = req.query.email;
            const query={
                email:email
            }
            const user = await users.findOne(query)
            // console.log(user);
            if(user){
                const token = jwt.sign({email}, process.env.ACCESS_TOKEN,{expiresIn: '1h'})
                return res.send({accessToken:token})
            }
            else{
                return res.status(403).send({accessToken:''})
            }
           
        })

   
     
    }finally{
        // await client.close();
    }
}

run().catch(console.dir);
app.get('/', (req, res)=>{
    res.send('Welcome to Mobile Shop');
})

app.listen(port, ()=>{
    console.log(`Listening to port`, port);
})