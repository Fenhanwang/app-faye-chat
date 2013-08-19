(function () {
    var DSPLocation = "http://localhost:8080",
        PubSubLocation = "http://localhost:3334",
        AppKey = "chat",
        DSPToken = "";
    DF = {};
    function Resource(path) {
        this.baseURL = DSPLocation + "/rest";
        this.path = path;
        this.appKey = AppKey;
    }

    function User() {
        Resource.call(this, "/user/");
    }

    function Session() {
        Resource.call(this, "/user/session/");
        this.login = function (credentialsJSON, success, error) {
            this.method = "POST";
            this.success = success;
            this.error = error;
            this.url = DSPLocation + "/rest" + this.path;
            this.postObject = credentialsJSON;
            this.sysHandler = function (data) {
                DSPToken = data.session_id;
            };
            DF.makeRequest(this);

        };

        this.isLoggedIn = function(success, error) {
            this.method = "GET";
            this.success = success;
            this.error = error;
            this.url = DSPLocation + "/rest" + this.path;
            DF.makeRequest(this);
        };

        this.logout = function (success, error) {
            this.method = "DELETE";
            this.success = success;
            this.error = error;
            this.url = DSPLocation + "/rest" + this.path;
            DF.makeRequest(this);
        };
    }

    function DB() {
        Resource.call(this, "/db/");
        this.getRecords = function (table, paramsObj, success, error) {
            this.method = "GET";
            this.params = paramsObj;
            //SAMPLE paramsObj : {include_schema: true, limit:100}
            this.url = DSPLocation + "/rest" + this.path + table;
            this.success = success;
            this.error = error;
            DF.makeRequest(this);
        };
        this.getRecord = function (table, id, paramsObj, success, error) {
            this.method = "GET";
            this.params = paramsObj;
            //SAMPLE paramsObj : {include_schema: true, limit:100}
            this.url = DSPLocation + "/rest" + this.path + table + "/" + id;
            this.success = success;
            this.error = error;
            DF.makeRequest(this);
        };
        this.createRecords = function (table, newRecord, paramsObj, success, error) {
            this.method = "POST";
            this.params = paramsObj;
            //SAMPLE paramsObj : {include_schema: true, limit:100}
            this.url = DSPLocation + "/rest" + this.path + table;
            this.success = success;
            this.error = error;
            this.postObject = newRecord;
            DF.makeRequest(this);
        };
        this.updateRecords = function (table, newRecord, paramsObj, success, error) {
            this.method = "PUT";
            this.params = paramsObj;
            //SAMPLE paramsObj : {include_schema: true, limit:100}
            this.url = DSPLocation + "/rest" + this.path + table;
            this.success = success;
            this.error = error;
            this.postObject = newRecord;
            DF.makeRequest(this);
        };
        this.deleteRecord = function (table, id, paramsObj, success, error) {
            this.method = "DELETE";
            //SAMPLE paramsObj : {include_schema: true, limit:100}
            this.url = DSPLocation + "/rest" + this.path + table + "/" + id;
            this.success = success;
            this.error = error;
            DF.makeRequest(this);
        };
    }

    function App() {
        Resource.call(this, "/app/");
        this.createApp = function (params, success, error) {
            this.method = "POST";
            this.params = params;
            this.url = DSPLocation + "/rest" + this.path;
            this.success = success;
            this.error = error;
            DF.makeRequest(this);
        };
    }

    function PubSub() {
        Resource.call(this, '/pubsub/');
        this.pubsub = PubSubLocation + '/faye';
        this.client = null;

        this.init = function(){
            if (!this.client){
                this.client = new Faye.Client(this.pubsub);
                return this.client;
            }
        };



        this.publish = function(params, success, error) {
            this.method = "POST";
            this.params = params;
            this.url = DSPLocation + "/rest" + this.path;
            this.success = success;
            this.error = error;
            DF.makeRequest(this);
        };



        this.privatePublish = function(channel, message){
            this.client.publish('/' + channel, message);

            return false;
        };



        this.subscribe = function(channel, callback) {
            this.client.subscribe('/' + channel, function(message) {
                callback(message);
            });
        };
    }

    DF.User = new User();
    DF.User.Session = new Session();
    DF.DB = new DB();
    DF.App = new App();
    DF.PubSub = new PubSub();


    DF.makeRequest = function (config) {
        var params = config.params ? "?" + $.param(config.params) : '';
        $.ajax({
            url: config.url + params,
            method: config.method,
            dataType: 'json',
            data: config.postObject,
            beforeSend: function (xhr) {

                xhr.setRequestHeader("X-DreamFactory-Session-Token", DSPToken);

                xhr.setRequestHeader("X-DreamFactory-Application-Name", AppKey);
            },
            crossDomain: true,
            success: function (data) {
                config.sysHandler ? config.sysHandler(data) : null;
                config.success ? config.success(data) : null;

            },
            error: function (response) {
                config.error ? config.error(arguments) : null;
            }
        });
    }
}());

