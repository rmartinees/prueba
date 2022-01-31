const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const cool=require('cool-ascii-faces')

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
	  res.render('pages/index')})
  .get('/cool', (req, res) => res.send(cool()))
  .get('/times', (req, res) => res.send(showTimes()))


.get('/ins', async (req, res) => {
	
    try { 
      const client = await pool.connect();
	  const jjj = await client.query("insert into tiempo values(" + req.query.temp + "," + req.query.dirviento + "," + req.query.veloviento + "," + req.query.maxviento + "," + "to_timestamp("   + Date.now() /1000.0 + "))");
	  res.status(200).send('OK')
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })



.get('/db', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM tiempo');
	  //console.log("HOLA :"+result.rows[0].dirviento);
	  //console.log(result.rows[0].dirviento-process.env.TIMES);  // Aqui corrijo viento y traduzco a nuevo valor visible N, NE , S , SE etc
	  let vientos = [ "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"  ];
	  //result.rows[0].dirviento=vientos[result.rows[0].dirviento]
	  //result.rows().map(function() {
       // this.dirviento=vientos[this.dirviento];
	   //});
	   
	 	   
	   
	  for (let i = 0; i < result.rows.length; i++) {
		result.rows[i].dirviento=vientos[result.rows[i].dirviento];
 	  }
	 if (result.rows[0])
      result.rows[0].campo=process.env.CAMPO;
     else {
		 
		 var result.rows = new Array();
		 result.push(new Object());
		 let result.rows[0].campo=process.env.CAMPO;
	 }
      const results = { 'results': (result) ? result.rows : null};
	  console.log("MAMAMAMAM");
	  console.log(results);
      res.render('pages/db', results );
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })

  .listen(PORT, () => console.log(`Listening on ${ PORT }`))


showTimes = () => {
  let result = '';
  const times = process.env.TIMES || 5;
  for (i = 0; i < times; i++) {
    result += i + ' ';
  }
  return result;
}

/*

  var listOfObjects = [];
var a = ["car", "bike", "scooter"];
a.forEach(function(entry) {
    var singleObj = {}
    singleObj['type'] = 'vehicle';
    singleObj['value'] = entry;
    listOfObjects.push(singleObj);
});

console.log(listOfObjects);
	   
*/

