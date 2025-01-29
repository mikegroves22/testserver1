const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3");
const bcrypt = require('bcryptjs')
const session = require("express-session")
const sqlite = require("better-sqlite3");
const SqliteStore = require("better-sqlite3-session-store")(session)
const sessiondb = new sqlite("sessions.db",
  //  { verbose: console.log }
  );

let sql;

const isAuth = (req,res,next)=>{ //was async after =
  if(req.session.isAuth){
     console.log("is authorized")
  next()
  }else{
    next()
    console.log("not authorized. will redirect back to login")
    // res.redirect('/') 
  }

}

const app = express();
app.use(express.json());
app.use(cors({credentials:true, origin: 'http://localhost:5173'}));

const corsOptionsDev = {
  origin: 'http://localhost:5173', // SPECIFIC origin!
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'], // Only allow Content-Type
  credentials: true // Now it's allowed
};

app.use(
  session({
    store: new SqliteStore({
      client: sessiondb, 
      expired: {
        clear: true,
        intervalMs: 5000 * 2//ms   7 * 24 * 60 * 60 * 1000  // 7 days  or 900000ms = 15min
      }
    }),
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    cookie: {
      // sameSite: 'Lax', //was commented out
      secure: false, // was false
      maxAge: 604800000,
      httpOnly: true, //was false
      originalMaxAge: 604800000,
      // path: '/'
    }
    
  })
)

const db = new sqlite3.Database("./test.db",sqlite3.OPEN_READWRITE, (err) =>{
    if (err) return console.error(err.message);
});

//-----------------------------------------RESISTER

app.post("/register",async(req,res)=>{

  const emailSignup =req.body.emailSignup
  const passwordSignup = req.body.passwordSignup
  const companyName = req.body.companyName

    sql='SELECT useremail,usercompanyid FROM users where useremail = ? OR usercompanyname = ?'
    db.all(sql,[emailSignup,companyName],async (err,rows) =>{

  if(rows.length > 0){

    res.send({
        desc:"Email and / or Company Name already Exists!",
        status: 403
    })
  }else{

    const hashedPassword = await bcrypt.hash(passwordSignup, 12)

    // insert into companys and return company id

  sql='INSERT INTO companies(companyname,companyexpiry,companysubscription) VALUES(?,?,?) RETURNING companyid'
  db.all(sql,[companyName,"2025-01-01",'Admin'],async (err,rows) =>{

     const companyId = rows[0].companyid
    console.log("company added into companies")

      sql='INSERT INTO users(useremail,userpassword,usercompanyid, useraccess,usercreatedate,userexpiry,usercompanyname) VALUES(?,?,?,?,?,?,?)'
        db.all(sql,[emailSignup, hashedPassword,companyId,2,"25-01-01","25-01-01", companyName],async(err,rows)=>{
          console.log("company added into users")

        })
  })

    res.send({
      desc: "Registration successfull!",
      status: 200
    })

  }
    })
  })

//-------------------------------------AUTH

app.post('/auth',async(req,res)=>{

  const useremail = req.body.emailLogin
    const userpassword = req.body.passwordLogin 

  //  console.log(req.session.id) 
  
      sql='SELECT userid,useremail,userpassword,usercompanyid,useraccess FROM users where useremail = ?'
     db.all(sql,[useremail],async(err,rows)=>{
 
      if(rows.length > 0){
        const isMatch = await bcrypt.compare(userpassword,rows[0].userpassword) 
    
        if(isMatch){

          // console.log(rows[0].userid)
          // console.log(rows[0].usercompanyid)
          // console.log(rows[0].useraccess)

  
       req.session.isAuth = true;
       req.session.userid = rows[0].userid
       req.session.usercompanyid = rows[0].usercompanyid
       req.session.useraccess = rows[0].useraccess

       console.log("here")
      //  console.log(req)
  
        res.send({
          desc:"success",
          status: 200
        })  
      }
      }else{  
    
        res.send({
          desc:"email or password incorrect!",
          status: 403
        })
      }
     }) 
    })

//-----------------------------------------ERPNAV
app.post("/erpnav",(req,res)=>{

 console.log("useraccess = " + req.session.useraccess)
// console.log(req.session)
//modules
sql=`SELECT DISTINCT modulename, m.moduleid FROM umsm
        join modules m on umsm.moduleid = m.moduleid
        where umsm.useraccessid = ?`;
db.all(sql,[req.session.useraccess],(err,modules) =>{
  if (err) return console.error(err.message);


//good for submodules
  sql=`SELECT * FROM umsm
        join modules m on umsm.moduleid = m.moduleid
        join submodules sm on umsm.submoduleid = sm.submoduleid
        where umsm.useraccessid = ?`;
  db.all(sql,[req.session.useraccess],(err,submodules) =>{
      if (err) return console.error(err.message);
    
       if (submodules.length>0){
           res.send(
            {modules:modules,
              submodules:submodules
           })
       }
       else if(submodules.length ===0){
           res.send([])
       }
       else{
          res.send({
            desc:"Nav Links Sent",
            status: 403
          })
       }
     })
    })
})

//----------------------------------------SELECTALL

app.post("/selectall",(req,res)=>{

    const tablename = req.body.tablename

  sql="SELECT * FROM " + tablename;
  db.all(sql,[],(err,rows) =>{
      if (err) return console.error(err.message);
    
        if (rows.length>0){
            res.send(rows)
        }
        else if(rows.length ===0){
            res.send([])
        }
        else{
            res.send({message:"cant find table name"})
        }
      })
  })

    //--------------------------------------------------

app.post("/headersandcolumns",(req,res)=>{

  const tablename = req.body.tablename

sql="SELECT * FROM headersandcolumns where tablename=?";
db.all(sql,[tablename],(err,rows) =>{

    if (err) return console.error(err.message);
  
      if (rows.length>0){
          res.send(rows)
      }
      else if(rows.length ===0){
          res.send([])
      }
      else{
          res.send({message:"cant find tablename"})
      }
    })
})

  //--------------------------------------------------

app.post("/tabs",(req,res)=>{

  const moduleid = req.body.moduleid

sql="SELECT * FROM modulesvstabs where moduleid=?";
db.all(sql,[moduleid],(err,rows) =>{

    if (err) return console.error(err.message);
  
      if (rows.length>0){
          res.send(rows)
      }
      else if(rows.length ===0){
          res.send([])
      }
      else{
          res.send({message:"cant find moduleid"})
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

 app.post("/headersandcolumns/add",(req,res)=>{

  const values = req.body.values

  sql="INSERT INTO headersandcolumns(tablename,path,name,hidden) VALUES (?,?,?,?)";
db.all(sql,values[1],values[2],values[3],values[4],(err,rows) =>{
    
  if (err) {
  switch (err.errno) {
    case 19:
      res.send({message: "headersandcolumns already exists."})
      break;
  
    default:
      res.send({message: "Different Error"})
      console.log(err.errno)
      break;
  }
}else{

  res.send({message: "headersandcolumns Added"})
}
    })
})

  //--------------------------------------------------

app.post("/headersandcolumns/update",(req,res)=>{

  const values = req.body.values

  sql="UPDATE headersandcolumns set tablename=?,path=?,name=?,hidden=?where headersandcolumnid=?";
db.all(sql,[values[1],values[2],values[3],values[4],values[0]],(err,rows) =>{
    if (err) return console.error(err.message);
      if (rows.length>0){
          res.send(rows)
      }
      else{
          res.send({message:"need to check"})
      }
    })
})

  //--------------------------------------------------

  app.post("/headersandcolumns/delete",(req,res)=>{

    const values = req.body.values
  
    sql="DELETE FROM headersandcolumns WHERE headersandcolumnid = ?";
  db.all(sql,[values[0]],(err,rows) =>{
      if (err) return console.error(err.message);
        if (rows.length>0){
            res.send(rows)
        }
        else{
            res.send({message:"need to check"})
        }
      })
  })

  //--------------------------------------------------

app.post("/products/add",(req,res)=>{

  const values = req.body.values

  sql="INSERT INTO products(productcode,productname,productgroup) VALUES (?,?,?)";
db.all(sql,values,(err,rows) =>{
    
  if (err) {
  switch (err.errno) {
    case 19:
      res.send({message: "Product already exists."})
      break;
  
    default:
      res.send({message: "Different Error"})
      console.log(err.errno)
      break;
  }
}else{

  res.send({message: "Product Added"})
}
    })
})

  //--------------------------------------------------

app.post("/products/update",(req,res)=>{

  const values = req.body.values

  sql="UPDATE products set productcode=?,productname=?,productgroup=? where productid=?";
db.all(sql,[values[1],values[2],values[3],values[0]],(err,rows) =>{
    if (err) return console.error(err.message);
      if (rows.length>0){
          res.send(rows)
      }
      else{
          res.send({message:"need to check"})
      }
    })
})

  //--------------------------------------------------

  app.post("/products/delete",(req,res)=>{

    const values = req.body.values
  
    sql="DELETE FROM products WHERE productid = ?";
  db.all(sql,[values[0]],(err,rows) =>{
      if (err) return console.error(err.message);
        if (rows.length>0){
            res.send(rows)
        }
        else{
            res.send({message:"need to check"})
        }
      })
  })

   //--------------------------------------------------

app.post("/productgroups/add",(req,res)=>{

  const values = req.body.values

  sql="INSERT INTO productgroups(productgroupid,productgroupname) VALUES (?,?)";
db.all(sql,values,(err,rows) =>{
    
  if (err) {
  switch (err.errno) {
    case 19:
      res.send({message: "Product Group already exists."})
      break;
  
    default:
      res.send({message: "Different Error"})
      console.log(err.errno)
      break;
  }
}else{

  res.send({message: "Product Group Added"})
}
    })
})

  //--------------------------------------------------

app.post("/productgroups/update",(req,res)=>{

  const values = req.body.values

  sql="UPDATE productgroups set productgroupname=? where productgroupid=?";
db.all(sql,[values[1],values[0]],(err,rows) =>{
    if (err) return console.error(err.message);
      if (rows.length>0){
          res.send(rows)
      }
      else{
          res.send({message:"need to check"})
      }
    })
})

  //--------------------------------------------------

  app.post("/productgroups/delete",(req,res)=>{

    const values = req.body.values
  
    sql="DELETE FROM productgroups WHERE productgroupid = ?";
  db.all(sql,[values[0]],(err,rows) =>{
      if (err) return console.error(err.message);
        if (rows.length>0){
            res.send(rows)
        }
        else{
            res.send({message:"need to check"})
        }
      })
  })

    //--------------------------------------------------

app.post("/warehouses/add",(req,res)=>{

  const values = req.body.values

  sql="INSERT INTO warehouses(warehousename) VALUES (?)";
db.all(sql,values,(err,rows) =>{
    
  if (err) {
  switch (err.errno) {
    case 19:
      res.send({message: "Warehouse already exists."})
      break;
  
    default:
      res.send({message: "Different Error"})
      console.log(err.errno)
      break;
  }
}else{

  res.send({message: "Warehouse Added"})
}
    })
})

  //--------------------------------------------------

app.post("/warehouses/update",(req,res)=>{

  const values = req.body.values

  sql="UPDATE warehouses set warehousename=? where warehouseid=?";
db.all(sql,[values[1],values[0]],(err,rows) =>{
    if (err) return console.error(err.message);
      if (rows.length>0){
          res.send(rows)
      }
      else{
          res.send({message:"need to check"})
      }
    })
})

  //--------------------------------------------------

  app.post("/warehouses/delete",(req,res)=>{

    const values = req.body.values
  
    sql="DELETE FROM warehouses WHERE warehouseid = ?";
  db.all(sql,[values[0]],(err,rows) =>{
      if (err) return console.error(err.message);
        if (rows.length>0){
            res.send(rows)
        }
        else{
            res.send({message:"need to check"})
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

   // If registration is successful:
  //  res.cookie('yourCookieName', 'yourCookieValue', {
  //    Domain: 'localhost', // Optional in development, omit if possible
  //   Path: '/', // Usually /
  //   Secure: false, // false in development, true in production
  //   HttpOnly: true, // Always true for security
  //   SameSite: 'Lax', // Or Strict, depending on your needs
  //   MaxAge: 3600000 // 1 hour in milliseconds
  // });

  // // res.set('Set-Cookie', 'test=testttt; sameSite=None ;secure=true')

//-------------------------------------------------  

    const port = process.env.PORT || 3001


app.listen (port, function(){
    console.log( "testserver working on 3001");
})

