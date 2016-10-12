module.exports = function (context) {

  var fs = require('fs'),
      path = require('path'),
      util = require('util'),
      xcode = context.requireCordovaModule('cordova-lib/node_modules/xcode'),
      plist = context.requireCordovaModule('cordova-lib/node_modules/plist');

  function logMe(what) {
    console.error(what);
  }

  logMe("Running hook to copy any available GoogleService-Info.plist file to iOS");

  var getValue = function(config, name) {
      var value = config.match(new RegExp('<' + name + '>(.*?)</' + name + '>', "i"));
      if(value && value[1]) {
          return value[1];
      } else {
          return null;
      }
  };

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

  function addResourceToXcodeProject(resourceName, projName, projFolder, iosFolder) {
    var projectPath = path.join(projFolder, 'project.pbxproj');
    var pbxProject;
    if (context.opts.cordova.project) {
      pbxProject = context.opts.cordova.project.parseProjectFile(context.opts.projectRoot).xcode;
    } else {
      pbxProject = xcode.project(projectPath);
      pbxProject.parseSync();
    }

    pbxProject.addResourceFile(resourceName);

    fs.writeFileSync(projectPath, pbxProject.writeSync());
  }

  var iosPlatform = path.join(context.opts.projectRoot, 'platforms/ios/');
  var iosFolder = fs.existsSync(iosPlatform) ? iosPlatform : context.opts.projectRoot;

  var data = fs.readdirSync(iosFolder);
  var projFolder;
  var projName;
  if (data && data.length) {
    data.forEach(function (folder) {
      if (folder.match(/\.xcodeproj$/)) {
        projFolder = path.join(iosFolder, folder);
        projName = path.basename(folder, '.xcodeproj');
      }
    });
  }
  if (!projFolder || !projName) {
    throw new Error("Could not find an .xcodeproj folder in: " + iosFolder);
  }

  if (directoryExists(iosFolder)) {
    var paths = ["GoogleService-Info.plist", path.join(iosFolder, "www", "GoogleService-Info.plist")];

    for (var i = 0; i < paths.length; i++) {
      if (fileExists(paths[i])) {
        try {
          var contents = fs.readFileSync(paths[i]).toString();
          // logMe("Found this file to write to iOS: " + paths[i]);
          var destFolder = path.join(iosFolder, projName, "Resources");
          if (!fs.existsSync(destFolder)) {
            fs.mkdirSync(destFolder);
          }
          fs.writeFileSync(destFolder + "/GoogleService-Info.plist", contents);
          addResourceToXcodeProject("GoogleService-Info.plist", projName, projFolder, iosFolder);
        } catch (err2) {
          logMe(err2);
        }
        break;
      }
    }
  }
};