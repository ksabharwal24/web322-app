/*********************************************************************************
WEB322 – Assignment 06
I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part of this
assignment has been copied manually or electronically from any other source (including websites) or distributed
to other students.
Name: Kanika Sabharwal
Student ID: 120305222
Date: 16-07-2024
Vercel Web App URL: https://vercel.com/kanika-sabharwals-projects/web322-app
GitHub Repository URL: https://github.com/ksabharwal24/web322-app
********************************************************************************/

const express = require('express');
const path = require('path');
const storeService = require('./store-service');
const authData = require('./auth-service'); // Importing the auth-service module
const clientSessions = require("client-sessions");
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const exphbs = require('express-handlebars');
const handlebars = require('handlebars');

const app = express();
const HTTP_PORT = process.env.PORT || 8081;

const hbs = exphbs.create({
    extname: 'hbs',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    app: app
});

app.engine('hbs', exphbs.engine({
    extname: 'hbs',
    layoutsDir: path.join(__dirname, 'views/layouts')
}));

app.set('view engine', 'hbs');

app.use(express.urlencoded({ extended: true }));

app.use(function (req, res, next) {
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});

handlebars.registerHelper('navLink', function (url, options) {
    return '<li class="nav-item"><a' +
        (url == app.locals.activeRoute ? ' class="nav-link active"' : ' class="nav-link"') +
        ' href="' + url + '">' +
        options.fn(this) +
        '</a></li>';
});

handlebars.registerHelper('formatDate', function (dateObj) {
    let year = dateObj.getFullYear();
    let month = (dateObj.getMonth() + 1).toString();
    let day = dateObj.getDate().toString();
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2,'0')}`;
});

// Register the 'equal' helper
handlebars.registerHelper('equal', function (lvalue, rvalue, options) {
    if (arguments.length < 3)
        throw new Error("Handlebars Helper 'equal' needs 2 parameters");

    if (lvalue != rvalue) {
        return options.inverse(this);
    } else {
        return options.fn(this);
    }
});

handlebars.registerHelper('safeHTML', function (content) {
    return new handlebars.SafeString(content);
});

cloudinary.config({
    cloud_name: 'dqc9ztssj',
    api_key: '346522462335473',
    api_secret: 'E5bDRTUucfYKmgcjsms854Oijtg',
    secure: true
});
const upload = multer();

app.use(express.static('public'));

// Configure client sessions
app.use(clientSessions({
    cookieName: "session",
    secret: "web322_assignment6",
    duration: 2 * 60 * 60 * 1000, // 2 hours
    activeDuration: 1000 * 60 * 5 // 5 minutes
}));

app.use(function (req, res, next) {
    res.locals.session = req.session;
    next();
});

function ensureLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect("/login");
    } else {
        next();
    }
}

// Routes for user authentication
app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    authData.registerUser(req.body)
        .then(() => {
            res.render("register", { successMessage: "User created" });
        })
        .catch(err => {
            res.render("register", { errorMessage: err, userName: req.body.userName });
        });
});

app.post("/login", (req, res) => {
    req.body.userAgent = req.get('User-Agent');
    authData.checkUser(req.body)
        .then(user => {
            req.session.user = {
                userName: user.userName,
                email: user.email,
                loginHistory: user.loginHistory
            }
            res.redirect("/shop");
        })
        .catch(err => {
            res.render("login", { errorMessage: err, userName: req.body.userName });
        });
});

app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
    res.render("userHistory");
});

// Existing routes for items, categories, etc.
app.get("/", (req, res) => {
    res.redirect("/shop");
});

app.get("/about", (req, res) => {
    res.render("about");
});

app.get("/shop", async (req, res) => {
    let viewData = {};

    try {
        let items = [];

        if (req.query.category) {
            items = await storeService.getPublishedItemsByCategory(req.query.category);
        } else {
            items = await storeService.getPublishedItems();
        }

        items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

        let item = items[0];

        viewData.items = items;
        viewData.item = item;
    } catch (err) {
        viewData.message = "no results";
    }

    try {
        let categories = await storeService.getCategories();
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results";
    }

    res.render("shop", { data: viewData });
});

app.get("/shop/:id", async (req, res) => {
    let viewData = {};

    try {
        let items = [];

        if (req.query.category) {
            items = await storeService.getPublishedItemsByCategory(req.query.category);
        } else {
            items = await storeService.getPublishedItems();
        }

        items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
        viewData.items = items;
    } catch (err) {
        viewData.message = "no results";
    }

    try {
        viewData.item = await storeService.getItemByID(req.params.id);
    } catch (err) {
        viewData.message = "no results";
    }

    try {
        let categories = await storeService.getCategories();
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results";
    }

    res.render("shop", { data: viewData });
});

app.get("/items", ensureLogin, (req, res) => {
    storeService.getAllItems()
        .then(data => {
            if (data.length > 0) {
                res.render("Items", { items: data });
            } else {
                res.render("Items", { message: "No results found." });
            }
        })
        .catch(err => {
            res.render("Items", { message: "No items present" });
        });
});

app.get("/categories", ensureLogin, (req, res) => {
    storeService.getCategories()
        .then(data => {
            if (data.length > 0) {
                res.render("categories", { categories: data });
            } else {
                res.render("categories", { message: "No categories found." });
            }
        })
        .catch(err => {
            res.render("categories", { message: "No categories present." });
        });
});

app.get("/categories/delete/:id", ensureLogin, async (req, res) => {
    try {
        await storeService.deleteCategoryById(req.params.id);
        res.redirect("/categories");
    } catch (err) {
        res.status(500).send("Unable to Remove Category / Category not found");
    }
});

app.get("/items/delete/:id", ensureLogin, async (req, res) => {
    try {
        await storeService.deletePostById(req.params.id);
        res.redirect("/items");
    } catch (err) {
        res.status(500).send("Unable to Remove Post / Post not found");
    }
});

app.get("/items/add", ensureLogin, async (req, res) => {
    try {
        let categories = await storeService.getCategories();
        if (!categories || categories.length === 0) {
            categories = [];
        }
        res.render("addPost", { categories });
    } catch (err) {
        res.status(500).send("Error fetching categories");
    }
});

app.post("/items/add", ensureLogin, upload.single("featureImage"), async (req, res) => {
    try {
        req.body.published = (req.body.published) ? true : false;
        for (let key in req.body) {
            if (req.body[key] === "") {
                req.body[key] = null;
            }
        }

        req.body.postDate = new Date();

        const itemData = req.body;
        await storeService.addItem(itemData);
        res.redirect("/items");
    } catch (err) {
        res.status(500).send("Error adding item");
    }
});

app.get("/item/:id", (req, res) => {
    const itemId = req.params.id;
    storeService.getItemByID(itemId)
        .then(item => {
            res.json(item);
        })
        .catch(err => {
            res.status(404).json({ error: "Item not found" });
        });
});

app.get("/categories/add", ensureLogin, (req, res) => {
    res.render("addCategory");
});

app.post("/categories/add", ensureLogin, async (req, res) => {
    const categoryData = req.body;
    storeService.addCategory(categoryData)
        .then(() => {
            storeService.getCategories()
                .then(data => {
                    if (data.length > 0) {
                        res.render("categories", { categories: data });
                    } else {
                        res.render("categories", { message: "No categories found." });
                    }
                })
                .catch(err => {
                    res.render("categories", { message: "Error fetching categories." });
                });
        })
        .catch(err => {
            res.status(500).send("Unable to create category");
        });
});

app.get("/categories/delete/:id", ensureLogin, async (req, res) => {
    const categoryId = req.params.id;
    storeService.deleteCategoryById(categoryId)
        .then(() => {
            storeService.getCategories();
            res.redirect("/categories");
        })
        .catch(err => {
            res.status(500).send("Unable to Remove Category / Category not found");
        });
});

const streamUpload = (fileBuffer) => {
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

        streamifier.createReadStream(fileBuffer).pipe(stream);
    });
};

// 404 handler
app.use((req, res) => {
    res.status(404).render(path.join(__dirname + "/views/404.hbs"));
});

storeService.initialize()
    .then(authData.initialize)
    .then(() => {
        app.listen(HTTP_PORT, () => {
            console.log(`Express http server listening on ${HTTP_PORT}`);
        });
    })
    .catch(err => {
        console.error(err);
    });
