/*********************************************************************************

WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Muskan Muskan
Student ID: 155634223
Date: 02-06-2024
Vercel Web App URL: https://vercel.com/muskan-muskans-projects/web322-app
GitHub Repository URL: https://github.com/mmuskan14/web322-app
********************************************************************************/ 

const express = require('express');
const path = require('path');
const storeService = require('./store-service')
const app = express();
const HTTP_PORT = process.env.PORT || 8080;
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const { deserialize } = require('v8');


cloudinary.config({
    cloud_name: 'dj3qro7iu',
    api_key:'484925714225629',
    api_secret:'YrATg0EqN5iJKBRJJZtVTeFNYKA',
    secure:true

});
const upload = multer();

app.use(express.static('public'));

app.get('/',(req,res)=>{
    res.redirect('/about');

});
app.get('/about',(req,res)=>{
    res.sendFile(path.join(__dirname,'views','about.html'));
});
app.get('/shop',(req,res)=>{
    storeService.getPublishedItems()
    .then(publishedItems => {
        const formattedOutput = JSON.stringify(publishedItems, null, 2); 
        res.header('Content-Type', 'application/json');
        res.send(formattedOutput);
    })
    .catch(err => res.json({ message: err }));
});
app.get('/items',(req,res)=>{
    const category = parseInt(req.query.category);
    const minDate = req.query.minDate;
    if(!isNaN(category)){
        storeService.getItemsByCategory(category)
        .then(filteredItems=>{
            const formattedOutput = JSON.stringify(filteredItems,null,2);
            res.header('Content-Type','application/json');
            res.send(formattedOutput);
        })
        .catch(err =>{
            console.error('Error filtering items by category: ${err.message}');
            res.status(500).json({message: err});
        });
    }
    else if (minDate){
        storeService.getItemsByMinDate(minDate)
        .then(filteredItems=>{
            const formattedOutput = JSON.stringify(filteredItems,null,2);
            res.header('Content-Type','application/json');
            res.send(formattedOutput);
        })
        .catch(err =>{
            console.error('Error filtering items by category: ${err.message}');
            res.status(500).json({message: err});
        });

    }
    else{
        storeService.getAllItems()
        .then(allItems => 
            {const formattedOutput = JSON.stringify(allItems, null, 2); 
        res.header('Content-Type', 'application/json');
        res.send(formattedOutput);
    })
        .catch(err=>{
            console.error(`Error in /shop route: ${err.message}`);
            res.json({ message: err });
        });
}
   
    
});
app.get('/categories',(req,res)=>{
    storeService.getCategories()
    .then(allCategories => {
        const formattedOutput = JSON.stringify(allCategories, null, 2); 
        res.header('Content-Type', 'application/json');
        res.send(formattedOutput);
    })
    .catch(err => res.json({ message: err }));
    
});

app.get('/items/add',(req,res)=>{
    res.sendFile(path.join(__dirname,'views','addItem.html'));
})


storeService.initialize()
    .then(()=>{
        app.listen(HTTP_PORT,()=>{
            console.log('Express http server listening on ${HTTP_PORT}');
        })
    })
    .catch(err =>{
        console.error(err);
    });
app.post('/items/add',upload.single("featureImage"),(req,res)=>
{
    if(req.file)
    {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
    
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };
         async function upload(req) {
            let result = await streamUpload(req);
            console.log(result);
            return result;
           
        }
    
        upload(req).then((uploaded)=>{
            processItem(uploaded.url);
        });
    }else{
        processItem("");
    }

    function processItem(imageUrl)
    {
        req.body.featureImage = imageUrl;
       
        storeService.addItem(req.body)
            .then((addedItem)=>{ 
                res.redirect('/items');
            })
            .catch((err) => {
                console.error(`Error adding item: ${err}`);
                res.status(500).send('Internal Server Error');
            
        });
    
    } 
});
app.get('/item/:id',(req,res)=>{
    const itemId =req.params.id;
    storeService.getItemByID(itemId)
    .then(item=>{ 
        console.log(item); 
        res.json(item);
        
    })
    .catch(err=>{
        console.error(err);
        res.status(404).json({error: 'Item not found'});
    });
});


app.use((req,res)=>{
    res.status(404).send('404 Page Not Found');
})
