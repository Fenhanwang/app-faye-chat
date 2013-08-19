


var express = require('express'),
    crypto = require('crypto'),
    Faye = require('faye'),
    bayeux = new Faye.NodeAdapter({mount: '/faye'}),
    http = require('http'),
    request = require('request'),
    q = require('q'),
    app = express();


// Config Stuff
app.set('port', '3334');
app.enable("jsonp callback");
app.use(express.bodyParser());
app.use(express.compress());
app.use(express.static(__dirname + '/public'));



/* Crypto */

function encodeCipher(channel) {
    var cipher = crypto.createCipher('aes192', 'secureserver'),
        msg = [];

    msg.push(cipher.update(channel, 'binary', 'hex'));

    msg.push(cipher.final('hex'));

    return msg.join('');
}

function decodeCipher(message) {

    var decipher = crypto.createDecipher('aes192', 'secureserver'),
        msg = [];

    msg.push(decipher.update(message, 'hex', 'binary'));

    msg.push(decipher.final('binary'));

    return msg.join('');

}




/* Faye */
// --------------------------------------------


AuthenticChannel = {
    incoming: function(message, callback) {
        if(message.channel === '/meta/subscribe') {
            console.log(message.subscription);

            var channelSplit = message.subscription.split('/'),
                authenticChannel = channelSplit[1];


            if (decodeCipher(authenticChannel).substring(0,3) !== 'app') {
                console.log('Invalid App Channel');
                message.error = 'Invalid App Channel';
            }
            else {
                console.log('Valid App Channel!')

            }

        }

        callback(message);
    }
};
bayeux.addExtension(AuthenticChannel);





app.post('/faye', function(req, res) {
    bayeux.getClient().publish('/channel', { text: req.body.message });
    console.log('broadcast message:' + req.body.message);
    res.send(200);
});



app.get('/getAppChannel', function(req, res) {

    var params = {
        DSPLocation: req.query.dsplocation,
        appkey: req.query.appkey,
        creds: {
            email: req.query.email,
            password: req.query.password
        }

    };

    testDFLogin(params).then(function(result) {

        if(result != 201) {
            console.log('Authentication Required')
        }
        else {
            res.jsonp(encodeCipher('app' + params.DSPLocation + params.appkey));
        }

    });
});



function testDFLogin(params) {

    var defer = q.defer();

    request({
        method: 'POST',
        uri: params.DSPLocation + '/rest/user/session',
        headers: {
            'X-DreamFactory-Session-Token': '',
            'X-DreamFactory-Application-Name': params.appkey
        },
        json: params.creds

    },  function(err, res, body) {

            defer.resolve(201);

    });

    return defer.promise;

}



var server = http.createServer(app);
bayeux.attach(server);
server.listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});


