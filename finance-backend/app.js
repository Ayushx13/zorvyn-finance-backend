import express from 'express';

const app = express();


app.get('/api' , (req,res) =>{
    res.json({
        message: "Hello From Finance Backend API",
        status: "running",
        timestamp: new Date().toISOString()
    })
});




// 404 handler
app.all('/{*any}', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!!`, 404));
});

export {app};