var IKMobileLogFile =  {
    logFilesAttachment : [],
    errorHandler: function (e) {
        var msg = '';
        switch (e.code) {
            case FileError.QUOTA_EXCEEDED_ERR:
                msg = 'QUOTA_EXCEEDED_ERR';
                break;
            case FileError.NOT_FOUND_ERR:
                msg = 'NOT_FOUND_ERR';
                    IKMobileLogFile.errorAlert("File not found!");
                break;
            case FileError.SECURITY_ERR:
                msg = 'SECURITY_ERR';
                break;
            case FileError.INVALID_MODIFICATION_ERR:
                msg = 'INVALID_MODIFICATION_ERR';
                break;
            case FileError.INVALID_STATE_ERR:
                msg = 'INVALID_STATE_ERR';
                break;
            default:
                msg = 'Unknown Error';
                IKMobileLogFile.errorAlert(msg);
                break;
        };
        console.log('Error: ' + msg);
    },// end of errorHandler function
    clearLogFile: function(){
        window.requestFileSystem(3, 0,
            function(fs) {
             fs.root.getFile('console.log', {create: false}, function(fileEntry) {
                 // Create a FileWriter object for our FileEntry (log.txt).
                 fileEntry.createWriter(function(fileWriter) {
                    fileWriter.onwriteend = function(e) {
                        console.log('Write completed.');
                        ErrorMessage("Delete Console File","Console Log has been removed!");
                        console.log('File removed.');
                    };
                    
                    fileWriter.onerror = function(e) {
                        console.log('Write failed: ' + e.toString());
                    };
                    
                    // Create a new Blob and write it to log.txt.
                    var blob = new Blob(['New Log'], {type: 'text/plain'});
                    
                    fileWriter.write(blob);
                                        
                }, IKMobileLogFile.errorHandler); //file entry create writer end here
            }, IKMobileLogFile.errorHandler);//fs.root function here
          }// FS IF End Here
        );// Window.RequestFileSystem Function End Here
   
    },// end of clearLogFile
    getConsoleLogFile: function(){
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
         function(fs) {
        console.log("we got file system access");
         fs.root.getFile('console.log', {}, function(fileEntry) {
                         console.log("we got console file");
                         fileEntry.file(
                            function(file) {
                                console.log("reading console file into binary");
                                var reader = new FileReader();
                                reader.onloadend = function(e) {
                                    IKMobileLogFile.logFilesAttachment.push(e.target.result.replace('data:*/*;base64,','base64:console.log//'));
                                        //console.log(e.target.result.replace('data:*/*;base64,','base64:console.log//'));
                                    IKMobileLogFile.sendLog(IKMobileLogFile.logFilesAttachment);
                                };
                                reader.readAsDataURL(file);
                            }, IKMobileLogFile.errorHandler);
                         }, IKMobileLogFile.errorHandler);//fs.root function here
         }// FS IF End Here
         );// Window.RequestFileSystem Function End Here
    },//end of getConsoleLogFile
    getDBFile: function(dbFileName){
        window.requestFileSystem(3, 1,
                                 function(fs) {
                                 fs.root.getFile(dbFileName, {},
                                                 function(fileEntry) {
                                                 fileEntry.file(
                                                                function(file) {
                                                                var reader = new FileReader();
                                                                reader.onloadend = function(e) {
                                                                //IKMobileLogFile.logFilesAttachment = [];
                                                                IKMobileLogFile.logFilesAttachment.push(e.target.result.replace('data:*/*;base64,','base64:' + dbFileName + '//'));
                                                                IKMobileLogFile.getConsoleLogFile();

                                                                };
                                                                reader.readAsDataURL(file);
                                                                }, IKMobileLogFile.errorHandler);
                                                 }, IKMobileLogFile.errorHandler);//fs.root function here
                                 }// FS IF End Here
                                 );// Window.RequestFileSystem Function End Here
    },//end of getDBFile
    getDBFileName:function(){
            var addFileEntry = function(entry)
            {
                var dirReader = entry.createReader();
                dirReader.readEntries(
                    function (entries) {
                       var fileStr = "";
                       var i;
                       
                       for (i = 0; i < entries.length; i++) {
                        if (entries[i].isDirectory === true ) {
                          // Recursive -- call back into this subdirectory
                                      if(entries[i].name !="Caches" && entries[i].name !="Cloud" && entries[i].name !="Cookies" && entries[i].name !="NoCloud" && entries[i].name !="Preferences" ){
                                      console.log(entries[i]);
                          addFileEntry(entries[i]);
                                      }
                        }
                        else
                        {
                            if (entries[i].fullPath.indexOf("/Library/WebKit/LocalStorage/file__0/") != -1
                                && entries[i].fullPath.substr(entries[i].fullPath.length - 3)== ".db")
                           //&& entries[i].fullPath.indexOf(".db") != -1)
                            {
                                fileStr = (entries[i]); // << replace with something useful
                                IKMobileLogFile.getDBFile("/WebKit/LocalStorage/file__0/" + fileStr.name);
                                console.log(fileStr.name);
                            }          
                        }
                      }// for loop end here
                                        },
                       function (error) {
                        console.log("readEntries error: " + error.code + error.error);
                       }
                );// dirReader end here
            };
         window.resolveLocalFileSystemURL(cordova.file.applicationStorageDirectory, addFileEntry , this.errorHandler); // end of window.resolveLocalFileSystemURL
        
    },//end of getDBFileName
    sendLog:function(logFiles){
        
        cordova.plugins.email.isAvailable(
              function (isAvailable) {
                  if (isAvailable)
                  {
                    cordova.plugins.email.open(
                    {
                     subject: storeObject.loggedInUser.userId + ' : ' + storeObject.selectedRoutePlanId + ' - iKmobile Console.Log & IKMobile.db file',
                     attachments: logFiles,
                     body:    'Please find log & DB file attached along with emil below:'
                                             
                    },function(sent){
                        console.log('email ' + (sent ? 'sent' : 'cancelled'));
                    },this);
                  }
                  else{
                    IKMobileLogFile.errorAlert('Email Account not setup!');
                  
                  }
              }
        );
        
    },//end of SendLog message
    errorAlert:function(errorMessage){
        navigator.notification.alert(errorMessage, function(){}, "Error Message");
        //navigator.notification.beep(1);
    }
}
