app-faye-chat
=============

Skype like chat application using faye, AngularJS, and the DSP.


##Contents

The only folders to be concerned with are /app and /fayeServer.  The rest are for testing and are irrelevant as there are no test yet.


##Setup

Open /app/js/services.js and change the 'Locations' service to use the appropriate names and locations for your DSP, storage service, and 
faye location.

    service('Locations',[function() {
        return {
            DSPLocation: url for your DSP,
            FayeLocation: url for faye server :3334,
            DBServiceName: name of storage service
        }
    }]).
    
The url for faye cannot contain 'http' or 'https' as it will determine it's own protocol.  So just set it to '//your faye url'.  Faye is currently configured to run on port 3334
however, if you wish to change the port simply open the script located at /fayeServer/server.js and change the port number there.
    
    //Config Stuff
    app.set('port', your port number here);

The last configuration setting that needs to be changed is in /app/lib/dreamfactory/dreamfactory.js.  Change the DSP location to your dsp.

      var DSPLocation = your DSP location,
          PubSubLocation = "http://localhost:3334",
          AppKey = "chat",
          DSPToken = "";
          
Note: Don't worry about the PubSubLocation.  We don't use that for this application.


##Storage Service

We use MongoDB to store the chat sessions but you don't have to.  The DreamFactory REST API will allow you to store the data in any database without changing the code.  So fire up 
the database of your choice.  Create a DSP service to interact with that database and set the DBServiceName in /app/js/services.js to your recently created service name.


### A few notes

People using the chat program must be registered users of the DSP with access to the service that stores messages.
          
