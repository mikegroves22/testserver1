const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3");
let sql;

const app = express();

app.use(express.json());
app.use(cors());

const db = new sqlite3.Database("./test.db",sqlite3.OPEN_READWRITE, (err) =>{
    if (err) return console.error(err.message);
});

//sql = "CREATE TABLE users(id INTEGER PRIMARY KEY, username, password)";
//db.run(sql);


//sql="INSERT INTO users(username,password) VALUES (?,?)";
//db.run(sql, [
//"mike","1234"],
//(err) =>{ 
//if (err) return console.error(err.message)})




app.get("/",function(req,res){
res.send("Express")

})
//--------------------------------------------------
app.post("/auth",(req,res)=>{

    const username = req.body.username
    const password = req.body.password


  sql="select * from users where username ='" + username + "' AND password ='" + password + "'";
  console.log(sql)
  db.all(sql,[],(err,rows) =>{
      if (err) return console.error(err.message);
  
        if (rows.length>0){
 //console.log("exists")
 res.send(rows)
        }
        else{
            console.log("username and/or password incorrect")
            res.send({message:"username and/or password incorrect"})
        }
        
      //rows.forEach(row=> {
         // console.log(rows.length)
      })
  })

    //})

    const port = process.env.PORT || 3001


app.listen (port, function(){
    console.log( "server working on 3001");
})

