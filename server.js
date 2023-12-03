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
            res.send(rows)
        }
        else{
            res.send({message:"username and/or password incorrect"})
        }
      })
  })

//--------------------------------------------------

app.post("/selectall",(req,res)=>{

    const tablename = req.body.tablename

  sql="SELECT * FROM " + tablename;
  db.all(sql,[],(err,rows) =>{
      if (err) return console.error(err.message);
        if (rows.length>0){
            res.send(rows)
        }
        else{
            res.send({message:"cant find table name"})
        }
      })
  })

  //--------------------------------------------------

app.post("/deleterow",(req,res)=>{

    const tablename = req.body.tablename
    const col = req.body.col
    const code = req.body.code

  sql="DELETE FROM " + tablename + " where " + col + " = " + "'" + code + "'";
  db.all(sql,[],(err,rows) =>{
      if (err) return console.error(err.message);
        if (rows.length>0){
            res.send(rows)
        }
        else{
            res.send({message:"problem with delete"})
        }
      })
  })

  //--------------------------------------------------

app.post("/tablecols",(req,res)=>{

    const tablename = req.body.tablename
    const tabletype = req.body.tabletype

  sql="SELECT * FROM tablesandcols where tablename ='" + tablename + "' AND tabletype='" + tabletype + "' order by seq asc";
  db.all(sql,[],(err,rows) =>{
      if (err) return console.error(err.message);
        if (rows.length>0){
            res.send(rows)
        }
        else{
            res.send({message:"hmm somethings not correct"})
        }
      })
  })

//--------------------------------------------------

app.post("/tables",(req,res)=>{

    const username = req.body.username
    const password = req.body.password

  sql="SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name";
  db.all(sql,[],(err,rows) =>{
      if (err) return console.error(err.message);
        if (rows.length>0){
            res.send(rows)
        }
        else{
            res.send({message:"username and/or password incorrect"})
        }
      })
  })

  //--------------------------------------------------

app.post("/tables/create",(req,res)=>{

    const tablename = req.body.tablename
    const firstcolumn = req.body.firstcolumn
    const secondcolumn = req.body.secondcolumn


 sql = "CREATE TABLE " + tablename + "(" + tablename + "id " + "INTEGER PRIMARY KEY, " + firstcolumn + "," + secondcolumn + ")"
 console.log(sql)
db.run(sql);
//   db.all(sql,[],(err,rows) =>{
//       if (err) return console.error(err.message);
//         if (rows.length>0){
//             res.send(rows)
//         }
//         else{
//             res.send({message:"username and/or password incorrect"})
//         }
//       })
  })

//--------------------------------------------------

app.post("/tables/selectall",(req,res)=>{

    const username = req.body.username
    const password = req.body.password

  sql="SELECT * FROM tables";
  db.all(sql,[],(err,rows) =>{
      if (err) return console.error(err.message);
        if (rows.length>0){
            res.send(rows)
        }
        else{
            res.send({message:"username and/or password incorrect"})
        }
      })
  })

//--------------------------------------------------

app.post("/users/add",(req,res)=>{

    const soid1 = req.body.soid1
    const soid2 = req.body.soid2
    const soid3 = req.body.soid3
    const soid4 = req.body.soid4
    const soid5 = req.body.soid5

    sql="INSERT INTO users(usercode,username,password,groups,status) VALUES (?,?,?,?,?)";
  db.all(sql,[soid1,soid2,soid3,soid4,soid5],(err,rows) =>{
      if (err) return console.error(err.message);
        if (rows.length>0){
            res.send(rows)
        }
        else{
            res.send({message:"need to check"})
        }
      })
  })

  //sql="INSERT INTO users(username,password) VALUES (?,?)";
//db.run(sql, [
//"mike","1234"],
//(err) =>{ 
//if (err) return console.error(err.message)})
 
//-------------------------------------------------

app.post('/users/update', (req,res) => {
     
    var soid1 = req.body.soid1;
    var soid2 = req.body.soid2;
    var soid3 = req.body.soid3;
    var soid4 = req.body.soid4;
    var soid5 = req.body.soid5;
         
    sql = "UPDATE users SET usercode = " + "'" + soid1 + "'" + "," + "username =" + "'" + soid2 + "'" + "," + "password =" + "'" + soid3 + "'" + "," + "groups = " + "'" + soid4 + "'"+ "," + "status = " + "'" + soid5 + "'" +" WHERE usercode ="+ "'" + soid1 + "'";
    db.all(sql,[],(err,rows) =>{
        if (err) return console.error(err.message);
          if (rows.length>0){
              res.send(rows)
          }
          else{
              res.send({message:"update users need checking"})
          }
        })
  
  });

//-------------------------------------------------  

    const port = process.env.PORT || 3001


app.listen (port, function(){
    console.log( "server working on 3001");
})

