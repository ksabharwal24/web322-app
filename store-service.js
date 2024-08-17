const Sequelize = require('sequelize');
const { Op } = require('sequelize')
const sequelize = new Sequelize('SenecaDB','SenecaDB_owner', 'l10jrmBAzQyW', {
    host: 'ep-white-heart-a50869h8.us-east-2.aws.neon.tech',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

const Item = sequelize.define('Item', {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN,
    price: Sequelize.DOUBLE
});

const Category = sequelize.define('Category', {
    category: Sequelize.STRING
});

Item.belongsTo(Category, { foreignKey: 'category' });

function initialize(){
    return new Promise((resolve, reject) => {
        sequelize.sync()
        .then(()=>{
            console.log('Database synchronized');
            resolve();
        })
        .catch(err=>{
            console.log('Error syncing database');
            reject('Unable to sync the database');
        })
});
}

function getAllItems() {
    return Item.findAll()
        .then(data => {
            if (data.length > 0) {
                console.log('')
                return Promise.resolve(data);
            } else {
                return Promise.reject('No results returned');
            }
        })
        .catch(err => {
            console.error('Error fetching items:', err);
            return Promise.reject('Error fetching items');
        });
}


function getItemsByCategory(categoryId){
    return Item.findAll({where: {category: categoryId}})
    .then(items => {
        if(items.length > 0){
            return Promise.resolve(data); 
        }
        else{
            return Promise.reject('No results returned');        }
    })
    .catch(err => {
        console.error('Error fetching items by category:', err);
        return Promise.reject('Error fetching items by category');
    });

   
}

function getItemsByMinDate(minDateStr){
    return Item.findAll({
        where: {
            postDate: { [sequelize.gte]: new Date(minDateStr) }
        }
    })
    .then(items => {
        if (items.length > 0) {
            return items;
        } else {
            throw new Error('No results returned');
        }
    }); 
}

function getItemByID(id){
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                id: id
            }
        })
        .then(data => {
            if (data.length > 0) {
                resolve(data[0]);
            } else {
                reject('Item not found');
            }
        })
        .catch(err => {
            reject('Error retrieving item');
        });
    });
 
   
 }
 function addItem(itemData){
    return new Promise((resolve, reject) => {
        itemData.published = itemData.published ? true : false;

        for (const key in itemData) {
            if (itemData[key] === '') {
                itemData[key] = null;
            }
        }

        itemData.postDate = new Date();

        Item.create(itemData)
            .then((createdItem) => {
                resolve(createdItem);
            })
            .catch(err => {
                reject('Unable to create post');
            });
    });
}

function getPublishedItems(){
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                published: true
            }
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            reject('Error retrieving published items');
        });
    });

   
}
function getPublishedItemsByCategory(category) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                published: true,
                category: categoryId
            }
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            reject('Error retrieving published items by category');
        });
    });

}
function getCategories() {
    return Category.findAll()
        .then(data => {
            if (data && data.length > 0) {
                return data;
            } else {
                return [];           
             }
        })
        .catch(err => {
            console.error('Error retrieving categories:', err);
            return Promise.reject(err); // Return the actual error object for better debugging
        });
}

function addCategory(categoryData) {
    return new Promise((resolve, reject) => {
        for (let key in categoryData) {
            if (categoryData[key] === "") {
                categoryData[key] = null;
            }
        }
        Category.create(categoryData)
            .then((createdCategory) => {
                resolve(createdCategory);
            })
            .catch(err => {
                reject("Unable to create category.");
            });
    });
}
function deleteCategoryById(ID) {
    return new Promise((resolve, reject) => {
        Category.destroy({ where: { id: ID } })
            .then(deletedRows => {
                if (deletedRows > 0) {
                    resolve();
                } else {
                    reject("Category not found.");
                }
            })
            .catch(err => {
                reject("Unable to delete category.");
            });
    });
}


function deletePostById(ID) {
    return new Promise((resolve, reject) => {
        Item.destroy({ where: { id: ID } })
        .then(deletedRows => {
            if (deletedRows > 0) {
                resolve();
            } else {
                reject("Post not found.");
            }
        })
        .catch(err => {
            reject("Unable to delete post.");
        });
    });
}








 
module.exports = {
    initialize,
    getAllItems,
    getPublishedItems,
    getCategories,
    addItem,
    getItemsByCategory,
    getItemsByMinDate,
    getItemByID,
    getPublishedItemsByCategory,
    Item,Category,
    addCategory,
    deleteCategoryById,
    deletePostById,


};