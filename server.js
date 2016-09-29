
var express                 =   require('express');
var path                    =   require('path');
var bodyParser 	   	        =   require('body-parser');
var emailTemplates          =   require('email-templates');
var mysql                   =   require('mysql');
var nodemailer              =   require('nodemailer');
var util                    =   require('util');
var passport                =   require('passport');
var TwitterStrategy         =   require('passport-twitter').Strategy
var FacebookStrategy        =   require('passport-facebook').Strategy;
var GoogleStrategy          =   require('passport-google-oauth').OAuth2Strategy;
var InstagramTokenStrategy  =   require('passport-instagram-token');
var session                 =   require('express-session');
var app                     =   express();
var templatesDir            =   path.resolve(__dirname, 'templates');

var userConnectedSocialMedia = false;
var facebookId      = '';
var facebookToken   = '';
var youtubeId       = '';
var youtubeToken    = '';
var instagremId     = '';
var instagremToken  = '';
var twitterId       = '';
var twitterToken    = '';
var interests       = '';


app.listen(8080, function () {
    console.log('Taptica-Octane Registration Service is listening on port 8080');
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({ secret: 'keyboard cat', key: 'sid'}));
app.use(passport.initialize());
app.use(passport.session());

var connection = mysql.createConnection({
    host     : '172.27.35.19',
    port     : '3306',
    user     : 'reut',
    password : 'Reut#314',
    database : 'static_v3'
});

connection.connect(function(err){
    if(!err) {
        console.log("Database is connected ... nn");
    } else {
        console.log("Error connecting database ... nn");
    }
});

var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "contact@octaneignite.com",
        pass: "Pinky2020"
    }
});

app.use(express.static(path.join(__dirname, 'client')));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/client/index.html'));
}); 

connection.query('SELECT * FROM octane_users_interests',function(err,rows){
  if(err) throw err;
//   console.log('Data received from Db:');
//   console.log(rows);
});



// connection.query('SELECT * FROM octane_users',function(err,rows){
//   if(err) throw err;
//   console.log('Data received from Db:');
//   console.log(rows);
// });


connection.query('SELECT * FROM octane_interests',function(err,rows){
  if(err) throw err;
//   console.log('Data received from Db:');
//   console.log(rows);
  interests = rows;
});

app.get('/interests', function(req, res) {
    res.send(interests);
});

app.get('/userConnected', function(req, res) {
    res.send(userConnectedSocialMedia);
});


// POST with form data
app.post('/signin',function(req, res) {
    // if(err) throw err;
    
    var user = JSON.parse(req.body.user)
    // user {"id": "", name":"","phone":"","email":"","pass":"","country":"","state":"","interests":[{"name":"","id":""}] }
    console.log('user', user);

    const now = new Date();
    const nowMilisec = (Date.parse(now) + 3600 * 3 * 1000);
    
    var octaneUser = {
                        "OctaneId": 0,
                        "InfluencerId": '',
                        "PublisherId": '',
                        "Guid": '',
                        
                        "Name": user.name,
                        "Phone": user.phone,
                        "Email": user.email,
                        "Password": user.pass,
                        "Country": user.country,
                        "State": user.state,
                        "Facebook_id": facebookId,
                        "Facebook_token": facebookToken,
                        "Twitter_id": twitterId,
                        "Twitter_token": twitterToken,
                        "Instagram_id": instagremId,
                        "Instagram_token": instagremToken,
                        "YouTube_id": youtubeId,
                        "YouTube_token": youtubeToken,
                        "Timestamp": nowMilisec
                    }

    connection.query('INSERT INTO octane_users SET ?', octaneUser , function(err, res) {

        if(err) throw err;
        else {
            console.log('Last insert to DB:');
            var email = JSON.stringify(`${user.email}`);
            
            // *** getting the octane id from the DB: *** //
            connection.query(`SELECT OctaneId FROM octane_users WHERE Email=${email}`,function(err, row) {
                if(err) throw err;
                  
                 else { 
                    console.log('Data received from Db:');

                    for (var i = 0; i < user.interests.length; i++) {
                        var octaneUsersInterests = {
                                                    "OctaneId": row[0].OctaneId,
                                                    "InterestID": user.interests[i].ID,
                                                    }

                        connection.query('INSERT INTO octane_users_interests SET ?', octaneUsersInterests , function(err,res) {

                            if(err) throw err;
                            
                            else console.log('Last insert to DB:');
                        });
                    };
                 };
            });
        };
    });
                        

    // *** sending mail to the user: *** //    
    var mailOptions = {
    to: user.email,
    subject: 'Welcome to Octane',
    attachments: [{
        filename: "signature.png",
        filePath: process.cwd() + "/signature.png",
        cid: "logo-mail"
    }],
    html: `
            <h4>Congrats! You've signed up in the Octane system!</h4>
            <h4>Below please find your login: </h4>
            <h4>Email: ${user.email}</h4>
            <h4>Password: ${user.pass}</h4>
            <h4>For any questions please contact us at : contact@octaneignite.com</h4>
            <h4>I'm are looking forward to work tougher <h4>
            <img src="cid:logo-mail" alt="">
            `
    }
    console.log(mailOptions);
    smtpTransport.sendMail(mailOptions, function (error, response) {
        if (error) {
            console.log(error);
            // res.end("error");
        } else {
            console.log("Message sent: ");
            // res.end("sent");
        };
    });

    res.send('login succefull');
});




//***PASSPORT***///

// Passport session setup.
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});


//**** TWITTER ****////
passport.use(new TwitterStrategy({
        consumerKey: 'ndsj16m3ZkEInL34UuwqMlcRD',
        consumerSecret: 'SSpyniicP4W5GVo2XbjthAUFXoALhAzPh2V58dcuH3lD6ECTDG',
        callbackURL: "http://localhost:8080/auth/twitter/callback"
    },
    function(token, tokenSecret, profile, done) {

        // console.log(token)
        userConnectedSocialMedia = true;
        twitterId = profile.id;
        twitterToken = token;
        return done(null, profile);
        

    }
));

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/twitter/callback',
    passport.authenticate('twitter', 
    { successRedirect: ('/after-auth.html'),
        failureRedirect: '/after-auth.html' }
        ));

//**** FACEBOOK ****////
passport.use(new FacebookStrategy({
    clientID: '682465275263609',
    clientSecret: '1da96959088393ffc0e245b2da3f301e',
    callbackURL: "http://localhost:8080/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
        
        userConnectedSocialMedia = true;
        facebookToken = accessToken;
        facebookId = profile.id;
        // var user = profile;
        console.log('facebookToken', facebookToken, 'facebookId', facebookId)
        // User.findOrCreate(function(err, user) {
        //     if (err) { return done(err); }
        //     done(null, user);
        // });
        return done(null, profile);
  }
));

app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { successRedirect: '/after-auth.html',
                                      failureRedirect: '/after-auth.html' }));


//**** GOOGLE ****////
passport.use(new GoogleStrategy({
    clientID: '1085017537701-hmhemvf00r14ptsjkffh63ipdv6dp3ig.apps.googleusercontent.com',
    clientSecret: 'y7Ai9D1f98wV06EUTePdRcPI',
    callbackURL: "http://localhost:8080/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
        // var user = profile;
        // console.log(user)
        userConnectedSocialMedia = true;
        youtubeId = profile.id;
        youtubeToken = accessToken;
        console.log('youtubeId', youtubeId, 'youtubeToken', youtubeToken)
        // User.findOrCreate(function(err, user) {
        //     if (err) { return done(err); }
        //     done(null, user);
        // });
        return done(null, profile);
  }
));

app.get('/auth/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/after-auth.html' }),
  function(req, res) {
    res.redirect('/after-auth.html');
  });


//**** INSTAGRAM ****////

passport.use(new InstagramTokenStrategy({
    clientID: 'ee714ddb970740a3aaab81a8fec80f10',
    clientSecret: 'd7d2b1d305f8426fab8501bac23f0aa7',
    callbackURL: "http://localhost:8080/auth/instagram/callback"
  },
  function(accessToken, refreshToken, profile, done) {
        // var user = profile;
        // console.log(user)
        userConnectedSocialMedia = true;
        instagremId = profile.id;
        instagremToken = accessToken;
        // User.findOrCreate(function(err, user) {
        //     if (err) { return done(err); }
        //     done(null, user);
        // });
        return done(null, profile);
  }
));

app.get('/auth/instagram',
  passport.authenticate('instagram-token'));

app.get('/auth/instagram/callback', 
  passport.authenticate('instagram', { failureRedirect: '/after-auth.html' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/after-auth.html');
});
//connection.end();



