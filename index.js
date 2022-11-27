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
        const users = client.db('mobileShop').collection('users');
        const categories = client.db('mobileShop').collection('categories');
        const products = client.db('mobileShop').collection('products');
       
        const verifyAdmin = async (req, res, next)=>{
            const decodedEmail = req.decoded.email;
            const q = {
                email:decodedEmail
            }

            const user = await users.findOne(q);
            if(user?.role !=='admin'){
                return res.status(403).send({message:'forbidden access'})
            }
            next();
        }
        const verifySeller = async (req, res, next)=>{
            const decodedEmail = req.decoded.email;
            const q = {
                email:decodedEmail
            }

            const user = await users.findOne(q);
            if(user?.role !=='seller'){
                return res.status(403).send({message:'forbidden access'})
            }
            next();
        }

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
        
        app.get('/users/admin/:email', async(req, res)=>{
            const email = req.params.email;
            const query={
                email:email
            }
            const user = await users.findOne(query);
            res.send({isAdmin: user?.role==='admin'})

        })
        app.get('/users/buyer/:email', async(req, res)=>{
            const email = req.params.email;
            const query={
                email:email
            }
            const user = await users.findOne(query);
            res.send({isBuyer: user?.role==='buyer'})

        })
        app.get('/users/seller/:email', async(req, res)=>{
            const email = req.params.email;
            const query={
                email:email
            }
            const user = await users.findOne(query);
            res.send({isSeller: user?.role==='seller'})

        })
        app.get('/categories', async(req, res)=>{
            const query= {};
            const result = await categories.find({}).toArray();
            res.send(result);
        })
        app.get('/product/:id', async(req, res)=>{
            const id= req.params.id;
            const query = {_id:ObjectId(id)}
            const result = await products.findOne(query);
            res.send(result);
        })
        app.get('/category/:id', async(req, res)=>{
            const id= req.params.id;
            const q = {_id:ObjectId(id)}
            const r = await categories.findOne(q);
            const query= {
                category:r.category
            }

            const result = await products.find(query).toArray();
            const categoryName = r.category;
            res.send({result, categoryName});
        })

        app.get('/products', async(req, res)=>{
            const queryEmail = req.query.email;
            const query = {
                sellerEmail: queryEmail
            }
            const result = await products.find(query).toArray();
            res.send(result);
        })
        app.get('/allproducts', async(req, res)=>{
            const result = await products.find({}).toArray();
            res.send(result);
        })        

        app.get('/categories', async(req, res)=>{
            const categoryQ= req.query.category;
            const query={
                category: categoryQ
            }
            const result = await categories.findOne(query);
            res.json(result);

        })
        app.get('/addvertisedproducts', async(req, res)=>{
            const queryEmail = req.query.email;
            const query = {
                status:'advertised'
            }
            const result = await products.find(query).toArray();
            res.send(result);
        })
        app.get('/users', async(req, res)=>{
            const queryEmail= req.query.email;
            const query={
                email:queryEmail
            }
            const result = await users.findOne(query);
            res.send(result)
        })
        app.post('/users', async (req, res)=>{
            const data = req.body;
            console.log(data)
            const result = await users.insertOne(data);
            res.send(result);
        })

        app.post('/categories',verifyJWT, verifyAdmin, async(req, res)=>{
            const data = req.body;
            // console.log(data)
            const result = await categories.insertOne(data);
            res.send(result);

        })
        app.post('/products',verifyJWT, verifySeller, async(req, res)=>{
            const data = req.body;
            console.log(data)
            const result = await products.insertOne(data);
            res.send(result);

        })
        app.patch('/products/:id', async(req, res)=>{
            const data= req.body;
            const id = req.params.id;
            const filter = {_id: ObjectId(id)}
            const option={
                upsert: true
            }
            const updateDoc = {
                $set:data
            }
            const result = await products.updateOne(filter, updateDoc, option);
            res.send(result)

        })

        app.delete('/products/:id',verifyJWT,verifySeller, async(req,res)=>{
            
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await products.deleteOne(query);
            res.send(result)
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
    console.log(`Listening port`, port);
})