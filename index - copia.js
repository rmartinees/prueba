const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const cool = require('cool-ascii-faces')

const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

express()
    .use(express.static(path.join(__dirname, 'public')))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', (req, res) => {
        res.render('pages/index')
    })


.get('/ins', async(req, res) => {

    try {
        const client = await pool.connect();
        const jjj = await client.query("insert into tiempo values(" + req.query.t + "," + req.query.h + "," + req.query.a + "," + req.query.f + "," + req.query.d + "," + req.query.v + ")");
        res.status(200).send('OK')
        client.release();
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
})

.get('/db', async(req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM tiempo  order by f desc');
        let vientos = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"];

        if (result.rows.length) {
            result.rows[0].campo = process.env.CAMPO;
            result.rows[0].angulo = process.env.ANGULO;
        }

        for (let i = 0; i < result.rows.length; i++) {
            result.rows[i].d1 = vientos[(result.rows[i].d + parseInt(process.env.ANGULO)) % 16];
            result.rows[i].d1 = vientos[result.rows[i].d];
        }

        const results = { 'results': (result) ? result.rows : null };
        res.render('pages/db', results);
        client.release();
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
})

.get('/get_tickers', async(req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT crypto_name, initval, lastval, lastdate FROM crypto  order by crytpo_name');

        for (let i = 1; i < result.rows.length; i++)
            result.rows[0].crypto_name = result.rows[0].crypto_name | result.rows[i].crypto_name;

        const results = { 'results': (result) ? result.rows : null };
        res.render('pages/get_tickers', results);
        client.release();
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
})

.get('/create_ticker', async(req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('INSERT into crupto values ' + req.query.crypto_name + ' "", "", "")');
        res.status(200).send('OK')
        client.release();
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
})

.get('/delete_ticker', async(req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('Delete from  crypto Where crypto_name=' + req.query.crypto_name + ' ');
        res.status(200).send('OK')
        client.release();
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
})

.listen(PORT, () => console.log(`Listening on ${PORT}`))