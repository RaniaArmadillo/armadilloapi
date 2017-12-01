
var environment;

var todo = require('debug')('arma-todo:config');
var info = require('debug')('arma:config');

if (process.env.NODE_ENV && process.env.NODE_ENV.length > 0) {
	environment = process.env.NODE_ENV;
} else {
	environment = 'production';
}

var perEnvironmentConfig = require('../config/' + environment + '/config.json');

var api = function(action, query){
  var url = "http://lab2.armadillo.fr/campus-aar-api/" + action;
  if (query){
      var queries = [];
      for(var key in query){
          if (query.hasOwnProperty(key)){
              queries.push(key + "=" + encodeURIComponent(query[key]));
          }
      }
      if (queries.length > 0){
          var joinChar = (url.indexOf('?') == -1) ? "?" : ":";
          url += joinChar + queries.join("&");
      }
  }
  return url;
};



var config = (function () {
	var Config = function() {};
  var cache;
  Config.prototype.all = function () {
    if (!cache) {
      info('[INFO] Loading "{{ env }}" configuration'.replace('{{ env }}', environment));
      todo('change arc/ahm rootIds');

      cache = {
        "sites": ["pcu"],
        "metadata": {
          pcu: {
            title: "pcu"
          }
        },
       "db": perEnvironmentConfig.db,
        "es": {
          "host": "localhost",
          
          "port": 9200
        }
      };
    }
    return cache;
  };

  //return new Config();
  return new Config();
})();


module.exports = config;
