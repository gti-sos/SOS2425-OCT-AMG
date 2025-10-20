import { request, response } from "express";
import { datos_AMG } from "./datos-AMG.js"
import dataStore from "nedb"
const BASE_API = "/api/v2/missing-people-stats";
let db = new dataStore();

let initialData= datos_AMG;

db.insert(initialData, (err) => {
    if (err) {
        return res.status(500).send("Error al insertar los datos,");
    }
});

function loadBackendAMG(app){

    app.get(BASE_API + "/docs",(req,res) => {
        res.redirect("https://documenter.getpostman.com/view/33043526/2sB2cUBP8d");
    });

    app.get(BASE_API + "/loadInitialData", (req,res) =>{

        //Paginación
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.offset) || 0;

        db.find({}).skip(offset).limit(limit).exec((err,stats)=>{
            if(err){
                res.sendStatus(500, "Internal Server Error");
            }else{
                if(stats.length < 1){
                    db.insert(initialData);
                    res.sendStatus(201, "Data Created");
                }else{
                    res.send(JSON.stringify(stats.map((s) => {
                        delete s._id;
                        return s;
                    })));
                }
            }
                
        });
    
    });

    //1 GET
    app.get(BASE_API + "/", (req,res) =>{
        // Paginacion
        const limit = parseInt(req.query.limit);
        const offset = parseInt(req.query.offset) || 0;

        let object_params = ["year","province","missing_men","missing_women","missing_unknown","total_population"];

        const consulta = {};

        for (let key in req.query) {
            if (key != "limit" && key != "offset") {
                if (!object_params.includes(key)) {
                    return res.sendStatus(400).json({ error: `El campos '${key}' no es válido` });
                }
                consulta[key] = isNaN(req.query[key]) ? new RegExp(req.query[key], 'i') : parseFloat(req.query[key]);
            }
        }

        db.find(consulta).skip(offset).limit(limit).exec((err, stats) => {
            if (err) {
                res.sendStatus(500, "Internal Server Error");
            } else {
                res.send(JSON.stringify(stats.map((s) => {
                    delete s._id;
                    return s;
                })));
            }
        });
    });

    // 1 POST
    app.post(BASE_API + "/", (req, res) => {
        let stat = req.body;
        let object_params = ["year","province","missing_men","missing_women","missing_unknown","total_population"];
        
        const queryParams = Object.keys(stat);
        const missingFields = object_params.filter(field => !queryParams.includes(field));
        
        if (missingFields.length > 0) {
            return res.status(400).send("Missing fields: " + missingFields.join(", "));
        } else if (queryParams.length !== 6) {
            return res.status(400).send("Incorrect fields size");
        } else {
            db.find({}, (err, stats) => {
                if (err) {
                    res.sendStatus(500, "Internal Error");
                } else {
                    if (stats.some(s => s.province === stat.province && s.year === stat.year)) {
                        res.sendStatus(409, "Conflict");
                    } else {
                        db.insert(stat);
                        res.status(201).json(stat);
                    }
                }
            })
        }

    });

    // 1 PUT
    app.put(BASE_API + "/", (req, res) => {
        //No está permitido hacer un put de todos los recursos => tabla azul
        res.sendStatus(405, "Method not Allowed");
    });

    // 1 DELETE
    app.delete(BASE_API + "/", (req, res) => {
        db.remove({}, { multi: true }, function (err, numRemoved) {
            if (err) {
                res.sendStatus(500, "Internal Server Error");
            } else {
                res.sendStatus(200, "OK");
            }
        });
    });

    // 2 POST
    app.post(BASE_API + "/:province", (req, res) => {
        //No está permitido hacer un post de un recurso concreto
        res.sendStatus(405, "Method not Allowed");
    });

    // 2 GET
    app.get(BASE_API + "/:province", (req, res) => {
        
        const province = req.params.province;
        db.find({}, (err, stats) => {
            if (err) {
                res.sendStatus(500, "Internal Server Error");
            } else {
                const statsData = stats.map((s) => {
                    delete s._id;
                    return s;
                });
                const provinceData = statsData.filter(s => s.province === province);
                if (provinceData.length > 0) {
                    res.send(JSON.stringify(provinceData));
                } else {
                    res.sendStatus(404, "Not found");
                }
            }
        })
    });

    // 2 PUT
    app.put(BASE_API + "/:province", (req, res) => {
        //actualizar un recurso en concreto
        let body = req.body;
        let object_params = ["year","province","missing_men","missing_women","missing_unknown","total_population"];
        
        const queryParams = Object.keys(body);
        const missingFields = object_params.filter(field => !queryParams.includes(field));
        
        if (missingFields.length > 0) {
            return res.sendStatus(400), "Missing fields: " + missingFields.join(", ");
        } else if (queryParams.length !== 6) {
            return res.sendStatus(400, "Incorrect fields size");
        } else if(req.params.province != body.province){
            return res.sendStatus(400);
        }else {
            db.update({ "province": req.params.province }, { $set: body }, (err, numUpdated) => {
                if (err) {
                    res.sendStatus(500, "Internal Server Error");
                } else {
                    if (numUpdated === 0) {
                        res.sendStatus(404, "Not Found");
                    } else {
                        res.sendStatus(200, "OK");
                    }
                }
            });
        }
    });

    //2 DELETE
    app.delete(BASE_API + "/:province", (req, res) => {
        //Borrar un recurso en concreto, comprobando si existe
        const province = req.params.province;
        db.remove({ "province": province }, {}, (err, numRemoved) => {
            if (err) {
                res.sendStatus(500, "Internal Server Error");
            } else {
                if (numRemoved >= 1) {
                    res.sendStatus(200, "Deleted");
                } else {
                    res.sendStatus(404, "Not Found");
                }
            }
        });
    });

    //GET por dos campos
    app.get(BASE_API + "/:province/:year", (req, res) => {

        const province = req.params.province;
        db.find({}, (err, stats) => {
            if (err) {
                res.sendStatus(500, "Internal Server Error");
            } else {
                const statsData = stats.map((s) => {
                    delete s._id;
                    return s;
                });
                const provinceData = statsData.filter(s => s.province === province && s.year === parseInt(req.params.year));
                if (provinceData.length > 0) {
                    res.send(JSON.stringify(provinceData[0]));
                } else {
                    res.sendStatus(404, "Not found");
                }
            }
        })
    });

    // 3 PUT
    app.put(BASE_API + "/:province/:year", (req, res) => {
        //actualizar un recurso en concreto
        let body = req.body;
        let object_params = ["year","province","missing_men","missing_women","missing_unknown","total_population"];
        
        const queryParams = Object.keys(body);
        const missingFields = object_params.filter(field => !queryParams.includes(field));
        
        if (missingFields.length > 0) {
            return res.status(400).send("Missing fields: " + missingFields.join(", "));
        } else if (queryParams.length !== 6) {
            return res.status(400).send("Incorrect fields size");
        } else if (body.year === parseInt(req.params.year) && body.province === req.params.province) {
            db.update({ "province": req.params.province }, { "year": req.params.year }, { $set: body }, (err, numUpdated) => {
                if (err) {
                    res.sendStatus(500, "Internal Server Error");
                } else {
                    if (numUpdated === 0) {
                        res.sendStatus(404, "Not Found");
                    } else {
                        res.sendStatus(200, "OK");
                    }
                }
            });
        }
        else {
            res.sendStatus(400, "Bad Request");
        }
    });

    // 3 DELETE
    app.delete(BASE_API + "/:province/:year", (req, res) => {

        const province = req.params.province;
        const year = parseInt(req.params.year);
        db.remove({"year": year, "province": province}, {}, (err, numRemoved) => {
            if (err) {
                res.sendStatus(500, "Internal Server Error");
            } else {
                if (numRemoved >= 1) {
                    res.sendStatus(200, "Deleted");
                } else {
                    res.sendStatus(404, "Not Found");
                }
            }
        });
    });
};

export {loadBackendAMG};