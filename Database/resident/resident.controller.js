/*********************************************************
 *  This file is used to serve as the backend of the User Interface, theses are the controllers to connect to our
 *  MongoDB atlas that we use to hold resident information. 
 * 
 *  We were helped by this article to help us understand REST API and interacting with MongoDB:
 *      https://bezkoder.com/node-express-mongodb-crud-rest-api/
 **********************************************************/

const Resident = require('./resident.model');

//Create a new resident
exports.create = (req, res) => {
    let resident = new Resident({
        r_id: req.body.r_id,
        name: req.body.name,
        age: req.body.age,
        dob: req.body.dob,
        location: req.body.location,
        image: req.body.image || "No image",
        condition: req.body.condition,
        response: req.body.response || "No responses"
    });

    resident.save()
    .then(data => {
        res.send(data);
    }).catch(err => {
        res.status(500).send({
            message: err.message
        });
    });
};

/*
//Retrieving all residents 
exports.findAll = (req, res) => {
    Resident.find()
    .then(resident => {
        res.send(resident);
    })
    .catch(err => {
        res.status(500).send({
            message: err.message
        });
    });
};
*/

exports.findByName = (req,res) => {
    var name = req.param('name'); 
    Resident.find({name: name})
        .then(resident => res.json(resident))
        .catch(err => res.status(404).json({success: false}))
};
         
/*
//Retrieving a single resident
exports.findById = (req, res) => {
    Resident.findById(req.params.id)
    .then(resident => { //resident is a success block, single resident gets returned inside success block "resident"
        if(resident)
            res.send(resident);
            console.log("Resident retreived");
            

        return res.status(404).send({
            message: err.message
        });
    })
    .catch(err => {
        if(err.kind === 'ObjectId'){
            return res.status(404).send({
                message: err.message
            });
        }
        return res.status(500).send({
            message: err.message
        });
    });
};

exports.update = (req, res) => {
    if(!req.body){
        return res.status(400).send({
            message: err.message
        });
    }

    Resident.findByIdAndChange(req.params.r_id, {
        r_id: req.body.r_id,
        name: req.body.name,
        age: req.body.age,
        dob: req.body.dob,
        location: req.body.location,
        image: req.body.image || "No image",
        condition: req.body.condition,
        response: req.body.response || "No responses"
    }, {new: true})
    .then(resident => {
        if(resident)
            res.send(resident);
        
        return res.status(404).send({
            message: "Resident not found with id " + r_id
        });
    })
    .catch(err => {
        if(err.kind === 'ObjectId'){
            return res.status(404).send({
                message: "Product not found with id " + req.params.productId
            });
        }
        return res.status(500).send({
            message: err.message
        });
    });
};

exports.delete = (req, res) => {
    Resident.findByIdAndDelete(req.params.r_id)
    .then(resident => {
        if(resident)
            res.send({
                message: "Resident is deleted successfully!"
            });

        return res.status(404).send({
            message: err.message
        }); 
    })
    .catch(err => {
        if(err.kind === 'ObjectId'){
            return res.status(404).send({
                message: err.message
            });
        }
        return res.status(500).send({
            message: "Could not delete resident with id " + r_id
        });
    });
};
*/