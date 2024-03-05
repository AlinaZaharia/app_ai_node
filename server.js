const express = require('express');
const cors = require('cors');
const {Client} = require('pg');

var bodyParser = require('body-parser');

const {REACT_APP_PASSWORD, REACT_APP_USER, REACT_APP_DATABASE, REACT_APP_PORT, REACT_APP_HOST} = process.env;

const config = {
    host: REACT_APP_HOST,
    port: REACT_APP_PORT,
    database: REACT_APP_DATABASE,
    user: REACT_APP_USER,
    password: REACT_APP_PASSWORD,
}

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
        console.log(req.body)
        let mesaj = req.body.mesaj
        console.log('asta e mesajul', mesaj)
        res.send(mesaj)       
    })


    app.post('/register', (req, res) => {
        console.log(req.body)
        // req.body.uid = 'sQiHPzxgwVcK9LcZ01Csk0Q2YlQ2'
        let inserareDate = `insert into users (uid, email, prenume) select '${req.body.uid}', '${req.body.email}', '${req.body.prenume}'`
        client.query(inserareDate).then(r => {
            console.log(r)
            if (r.rowCount == 1) res.send('Inregistrare reusita')
        })
        .catch((error) => {
            console.log(error)
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
            console.log(r.rows[0].prenume)
            res.send(r.rows[0].prenume)
        })

        
    })


    app.listen(PORT, () => {
        console.log('Server listening on port ' + PORT)
})
})