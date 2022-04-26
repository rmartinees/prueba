const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const cool = require('cool-ascii-faces')
const axios = require('axios');

const { Pool } = require('pg');
const { type } = require('express/lib/response');
//https://node-postgres.com/features/connecting

// if on heroku
if (process.env.DATABASE_URL) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
} else {
    // if on local
    pool = new Pool({
        user: 'postgres',
        password: '',
        port: 5432,
        host: 'localhost',
        database: 'postgres'
    });
    //  pool = new Pool({
    //    user: process.env.D_user,
    //  password: process.env.D_password,
    //port: process.env.D_pport,
    // host: process.env.D_host,
    // database: process.env.D_database
}


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


.get('/list_tickers', async(req, res) => {

    const client = await pool.connect();

    let result = await client.query('SELECT crypto_name FROM cryptos  order by crypto_name');

    let ret = "";
    for (let i = 0; i < result.rows.length; i++) {
        ret = ret + "," + result.rows[i].crypto_name;
    }
    if (ret.length > 0)
        ret = ret.substring(1);
    client.release();
    res.status(200).send(ret);
})

// /get_tickers   --> returns String with  all tickers in DB
// /get_tickers?c=CRIPTO,CRIPTO,...   --> returns String with the available tickers of c in DB
//
// /get_tickers?type=   --> go search for the values in DDBB
//       /get_tickers?type=1  --> returns Json
//       /get_tickers?type=3  --> returns String with tickers and last value; returns ticker to be viewed on Screen
// Optional initval makes initval be updated if type has been selected


.get('/get_tickers', async(req, res) => {
    try {
        addqry = "";
        const client = await pool.connect();

        //if ?c=XXX,XX process selected tickers only
        if (typeof(req.query.c) != 'undefined') {
            var added = "";
            str = req.query.c.split(",");
            for (i of str) {
                added = added + ",'" + i + "'";
            }
            if (added.length > 0)
                added = added.substring(1);
            addqry = " Where crypto_name in (" + added + ")";
        }

        ttype = (typeof(req.query.type) != 'undefined' ? req.query.type : "");
        initval = typeof(req.query.initval) != 'undefined';

        // Ensure cryptos in DB, and prepare either return or next query
        let ret = "";
        let qry = "";

        let result = await client.query('SELECT crypto_name FROM cryptos ' + addqry + ' order by crypto_name');
        var json = "";

        for (let i = 0; i < result.rows.length; i++) {
            ret = ret + "," + result.rows[i].crypto_name;
            if (ttype != "")
                qry = qry + "," + result.rows[i].crypto_name;
        }

        //  if we have a qry, this means type was defined and we have to return values!
        if (qry != "") {
            const urla = "https://api.nomics.com/v1/currencies/ticker?key=1b3d278c067f697ce6aab2558326c570d4cc76fe&ids=" + qry.substring(1).toUpperCase() +
                "&interval=1d,30d&convert=EUR&per-page=100&page=1";
            json = await axios({
                    method: 'get',
                    url: urla
                })
                .then(async function(response) {

                    var ret_string = "";
                    // Query nomics for selected items. Get values and update DB as appropriate
                    json = JSON.stringify(response.data);
                    arr = JSON.parse(json);

                    arr.sort(function(a, b) {
                        if (a.id > b.id) return 1;
                        if (a.id < b.id) return -1;
                        return 0;
                    });
                    addqry = "";
                    const numero = ((nums) => {
                        num = parseFloat(nums); //Make sure it is a number. If not toPrecision fails! But now using toFixed which cnverts to string!!

                        if ((num / 1000) >= 1)
                            return num.toFixed(0);

                        var lll = parseFloat(nums).toFixed(20);
                        j = lll.indexOf('.');
                        for (k = j + 1; k < lll.length; ++k)
                            if (lll.charAt(k) != '0') break;

                        if (k == lll.length) return nums;

                        return num.toFixed(k - j + 2);
                    });

                    //const client1 = await pool.connect();
                    for (var i = 0; i < arr.length; i++) {
                        aaa = "-h";
                        console.log("**********************************");
                        console.log(typeof(arr[i]));
                        console.log(typeof(arr[i]["1d"]));
                        console.log(typeof(arr[i]["1d"].price_change_pct));

                        if (typeof(arr[i]["1d"].price_change_pct) != "undefined")
                            aaa = arr[i]["1d"].price_change_pct;

                        ret_string = ret_string + "    " + arr[i].id + "->" + numero(arr[i].price) + " (" + aaa + "%)";
                        if (initval)
                            addqry = " , initval=" + arr[i].price;

                        qqry = "update cryptos  set lastval=" + arr[i].price + addqry + " where crypto_name='" + arr[i].id + "'";
                        result = await client.query(qqry);
                    }

                    if (ttype == 1)
                        return json;

                    if (ret_string.length > 0)
                        ret_string = ret_string.substring(1);

                    return ret_string;
                })
                .catch(error => {
                    console.log("Axios RICK");
                    console.log(error);
                    return 0;
                    return Promise.reject(error.message);
                });
        }

        res.status(200).send(json);

        client.release();
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
})


// /create_ticker?c=CRIPTO
.get('/create_ticker', async(req, res) => {
    try {
        const client = await pool.connect();
        let result = await client.query("INSERT into cryptos (crypto_name, initval, lastval, lastdate ) values ('" + req.query.c + "', '', '', '')");
        result = await client.query("select  crypto_name from  cryptos Where  crypto_name='" + req.query.c + "'");
        if (result.rows.length == 1) res.status(200).send('OK');
        else res.status(200).send('KO');
        client.release();
    } catch (err) {
        console.error(err);
        res.send("Error en create ticker:>" + err + "<");
    }
})


// /delete_ticker?c=CRIPTO
.get('/delete_ticker', async(req, res) => {
    try {
        const client = await pool.connect();
        let result = await client.query("Delete from  cryptos Where crypto_name='" + req.query.c + "'");
        result = await client.query("select  crypto_name from  cryptos Where  crypto_name='" + req.query.c + "'");
        if (result.rows.length == 0) res.status(200).send('OK')
        else res.status(200).send('KO')
        client.release();
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
})

.listen(PORT, () => console.log(`Listening on ${PORT}`))