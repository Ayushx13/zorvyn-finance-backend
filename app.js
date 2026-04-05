import express from 'express';

const app = express();


app.get('/api' , (req,res) =>{
    res.json({
        message: "Hello From Finance Backend API",
        status: "running",
        timestamp: new Date().toISOString()
    })
});


export {app};