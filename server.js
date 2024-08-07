const express = require('express');
const cors = require('cors');
const {Client} = require('pg');
require('dotenv').config();


var bodyParser = require('body-parser');
const { sendEmail } = require('./nodemailer_gmail');

const {PASSWORD, USER, DATABASE, PORT, HOST} = process.env;

const config = {
    host: HOST,
    port: PORT,
    database: DATABASE,
    user: USER,
    password: PASSWORD,
}
console.log(config);
const client = new Client(config)//instantiere
let p_connect = client.connect();

p_connect.then(() => {
    //incepe serverul web

    const PORT = 8000;
    const app = express();//instantiere

    app.use(cors());
    app.use(express.static('images'));
    app.use(bodyParser.json());



    app.post('/test', (req, res) => {
        // console.log(req.body)
        let mesaj = req.body.mesaj
        // console.log('asta e mesajul', mesaj)
        res.send(mesaj)       
    })
    //
    app.post('/emailsValidation', (req, res) => { 
        // console.log(req.body) 
        let queryUsers = `insert into users (prenume, email, password) select '${req.body.prenume}', '${req.body.email}', '${req.body.password}'`;
        client.query(queryUsers).catch((error) => {
            error.statusCode = 500;
            res.send();
        })
        let queryEmailsValidation = `insert into emailsValidation (validationKey, email) select '${req.body.validationKey}', '${req.body.email}'`
        client.query(queryEmailsValidation).then(r => {
            if (r.rowCount == 1) {
                let continut = `<h1>Pentru validarea contului, da click aici: </h1><a href = 'http://localhost:3000/welcome?valKey=${req.body.validationKey}'><button style = 'width: 100px; height: 30px; margin-top: 20px'>Click aici</button></a>`
                //se cheama functia
                let subject = 'Validare email'
                sendEmail(req.body.email, subject, continut)
            }
            // console.log(r)
        })
        res.send()
    })

    //primeste cheia de validare / returneaza emailul
    app.post('/keyValidation', (req, res) => {
        // console.log(req.body)
        let verificareCheie = `select users.email, users.password from emailsvalidation
        join users on emailsvalidation.email = users.email where validationkey = '${req.body.valKey}'`
        client.query(verificareCheie).then(r => {
            
            // console.log(r.rows[0])
            let obiectEmail = {email: r.rows[0]?.email, password: r.rows[0]?.password}
            res.send(obiectEmail)
        
        })
    })

    app.post('/inserareUID', (req, res) => {
        // console.log(req.body)
        let queryUID = `update users set uid = '${req.body.uid}', password = null where email = '${req.body.email}'`
        client.query(queryUID)
        res.send()
    })


    app.post('/register', (req, res) => {
        // console.log(req.body)
        // req.body.uid = 'sQiHPzxgwVcK9LcZ01Csk0Q2YlQ2'
        let verificareEmail = `select 1 from users where uid = '${req.body.uid}' or email = '${req.body.email}'`
        client.query(verificareEmail).then((r) => {
            if (r.rowCount == 0) {
                let inserareDate = `insert into users (uid, email, prenume) select '${req.body.uid}', '${req.body.email}', '${req.body.displayName}'`
                client.query(inserareDate).then(r => {
                    // console.log(r)
                    if (r.rowCount == 1) res.send('Inregistrare reusita')
                })
            }
            else {
                res.statusCode = 409;
                res.send("Contul deja exista.")
            }})
        
        .catch((error) => {
            // console.log(error)
            if (error.code == '23505') {
                res.statusCode = 400
                res.send("Email-ul deja exista")
            }
            else {
                res.statusCode = 500;
                res.send()
            }
        })
    })


    app.post('/login', (req, res) => {
        console.log('asta e uid-ul logatului', req.body.uid)

        let daPrenume = `select prenume from users where uid = '${req.body.uid}'`
        client.query(daPrenume).then(r => {
            // console.log(r.rows[0].prenume)
            res.send(r.rows[0].prenume)
        })

        
    })


    app.post('/conversatie', (req, res) => {
        // console.log(req.body)
        let conversatieNoua = `insert into conversatii (idconversatie, uid) select '${req.body.idConversatie}',  '${req.body.uid}'`
        client.query(conversatieNoua).then(r => {
            // console.log(r)
            if (r.rowCount == 1) res.send('ok')
        })
        
    })

    
    app.post('/mesaje', (req, res) => {
        // console.log(req.body)
        let mesajNou = `insert into mesaje (idConversatie, textmesaj, exp) select '${req.body.idConversatie}', '${req.body.text}', '${req.body.exp}'`
        client.query(mesajNou)
        let ultimulMesaj = `update conversatii set mesajfinal = '${req.body.text.substring(0, 20)}...' where idConversatie = '${req.body.idConversatie}'`
        client.query(ultimulMesaj)
        res.send()
    })

    app.get('/istoricConversatii', (req, res) => {
        // console.log(req.query)
        let arrIstoricConversatii = `select idconversatie, mesajfinal, favorite
        from conversatii 
        where uid = '${req.query.uid}'
        order by data desc limit 15`
        client.query(arrIstoricConversatii).then(r => {
            // console.log(r)
            res.json(r.rows)
        })
        
    })

    app.get('/mesaje', (req, res) => {
        // console.log(req.query)
        let toateMesajele = `select textmesaj as text, exp, data
        from mesaje
        where idconversatie = '${req.query.idconversatie}' 
        order by data`
        client.query(toateMesajele).then(r => {
            console.log('Mesajele sunt:', r)
            let obiectMesajeSiTitlu = {};
            obiectMesajeSiTitlu.mesaje = r.rows;
            let queryTitlu =   `select titlu from conversatii where idconversatie = '${req.query.idconversatie}'`
            client.query(queryTitlu).then(r => {
                console.log(r);
                obiectMesajeSiTitlu.titlu = r.rows[0]?.titlu;
                res.json(obiectMesajeSiTitlu)
            })
            // console.log('Asta e: ', r.rows)
            
        })
        
    })

    app.delete('/conversatie/:idConversatie', (req, res) => {
        // console.log(req.params)
        let stergereMesaje =  `delete from mesaje where idconversatie = $1`
        let values = [req.params.idConversatie]
        let stergereConversatie = `delete from conversatii where idconversatie = $1`
        // console.log({stergereMesaje})
        client.query(stergereMesaje, values).then(() => client.query(stergereConversatie, values)).then(() => {
            res.statusCode = 204
            res.send()
        })
        .catch((error) => {
            // console.log(error)
            res.statusCode = 400
            res.send()
            
        })

    })
    app.post('/partajarelink', (req, res) => {
        console.log(req.body)
        let queryIdConversatie = `insert into linkpartajat (idconversatie) select $1`
        let values = [req.body.idc];
        client.query (queryIdConversatie, values).then((r) => {
            console.log(r.rowCount);
            if (r.rowCount == 1) res.send();
            else {
                res.statusCode = 400;
                res.send();
            };
        })
        .catch((error) => {
            console.log(error);
            if (error.code == '23505') res.statusCode = 200;
            else res.statusCode = 400;
            res.send();
        })
        
    });

    app.get('/verificareLink', (req, res) => {
        // console.log('IDConv', req.query)
        let queryVerificareLink =  `select data from linkpartajat where idconversatie = '${req.query.idc}'`
        client.query(queryVerificareLink).then((r) => {
            console.log('DATA:', r)
            if (r.rowCount == 0) res.statusCode = 400
                  
            else res.statusCode = 200;
            res.send();
        })
        
    })

    app.put('/inserareTitluConv', (req, res) => {
        console.log(req.body)
        let queryTitlu =   `update conversatii set titlu = '${req.body.titlu}' where idconversatie = '${req.body.idconversatie}'`
        client.query(queryTitlu).then(r => {
            if (r.rowCount == 0) {
                res.statusCode = 400
                res.send()
            }
            else res.send()
            
        })
                        
    })

    app.put('/favorite', (req, res) => {
        console.log('FAV', req.body)
        let queryFavorite = `update conversatii set favorite = '${req.body.fav}' where idconversatie = '${req.body.idc}'`
        client.query(queryFavorite)
        .then((r) => {
            if (r.rowCount == 0) {
                res.statusCode == 400;
                res.send();
            }
            else res.send()

        })
        
    })

   


    app.listen(PORT, () => {
        console.log('Server listening on port ' + PORT)
})
})