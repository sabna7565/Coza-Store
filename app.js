let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let bodyParser = require('body-parser');
let userRouter = require('./routes/user');
let adminRouter = require('./routes/admin');
const { engine: hbs } = require('express-handlebars')
let app = express();
let fileUpload = require('express-fileUpload')
let db = require('./config/connection')
let session = require('express-session')
// const MongoDBStore = require("connect-mongodb-session")(session);

const Swal = require('sweetalert2');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs({ extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layout/', partialsDir: __dirname + '/views/partials/',
helpers:{
  inc: function(value, opt){
    return parseInt(value)+1;
  }
}
}))



app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: "Key", cookie: { maxAge: 600000000 }}))

db.connect((err) => {
  if (err) console.log("connection Error" + err);
  else console.log("Database connected to port 27017");
})
app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('404');
});

module.exports = app;
