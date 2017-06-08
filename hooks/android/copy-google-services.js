module.exports = function (context) {

  var fs = require('fs'),
      path = require('path');

  function logMe(what) {
    console.error(what);
  }

  logMe("Running hook to copy any available google-services.json file to Android");

  function fileExists(path) {
    try  {
      return fs.statSync(path).isFile();
    } catch (e) {
      logMe("fileExists error: " + e);
      return false;
    }
  }

  function directoryExists(path) {
    try  {
      return fs.statSync(path).isDirectory();
    } catch (e) {
      logMe("directoryExists error: " + e);
      return false;
    }
  }

  var androidPlatform = path.join(context.opts.projectRoot, 'platforms/android/');
  var androidFolder = fs.existsSync(androidPlatform) ? androidPlatform : context.opts.projectRoot;

  if (directoryExists(androidFolder)) {
    var paths = ["google-services.json", path.join(androidFolder, "assets/www/google-services.json")];

    for (var i = 0; i < paths.length; i++) {
      if (fileExists(paths[i])) {
        // logMe("Found this file to write to Android: " + paths[i]);
        try {
          var contents = fs.readFileSync(paths[i]).toString();
          fs.writeFileSync(path.join(androidFolder, "google-services.json"), contents);

          var json = JSON.parse(contents);
          var strings = fs.readFileSync(path.join(androidFolder, "res/values/strings.xml")).toString();

          // strip non-default value
          strings = strings.replace(new RegExp('<string name="google_app_id">[^<]+?</string>', "i"), '<string name="google_app_id">' + json.client[0].client_info.mobilesdk_app_id + '</string>');

          // strip non-default value
          strings = strings.replace(new RegExp('<string name="google_api_key">[^<]+?</string>', "i"), '<string name="google_api_key">' + json.client[0].api_key[0].current_key + '</string>');
          
          // strip off duplicate google_app_id and google_api_key entries
          strings = strings.replace(new RegExp('<string name="google_app_id">@[^<]+?</string>', "ig"), '');
          strings = strings.replace(new RegExp('<string name="google_api_key">@[^<]+?</string>', "ig"), '');
          
          // strip empty lines
          strings = strings.replace(new RegExp('(\r\n|\n|\r)[ \t]*(\r\n|\n|\r)', "gm"), '$1');

          fs.writeFileSync(path.join(androidFolder, "res/values/strings.xml"), strings);
        } catch(err) {
          logMe(err);
        }

        break;
      }
    }
  }
};
