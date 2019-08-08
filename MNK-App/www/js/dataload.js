var SapData = {

    CallDataService: function (url, callback) {
        var requestreq = new XMLHttpRequest();
        requestreq.open("GET", url, true);

        console.log(url + "::" + storeObject.auth + "::" + storeObject.oDataTimeOut);
        requestreq.setRequestHeader('Authorization', storeObject.auth);
        requestreq.timeout = storeObject.oDataTimeOut;

        requestreq.onreadystatechange = function () {
            //Call a function when the state changes.
            if (requestreq.readyState == 4) {
                if (requestreq.status == 200) {
                    callback(requestreq.responseXML, true);
                } else if (requestreq.status == 501 || requestreq.status == 500 || requestreq.status == 404 || requestreq.status == 403 || requestreq.status == 400 || requestreq.status == 0) {
                    callback(requestreq.responseXML, false);
                    // 400: Bad request | 403: Forbidden | 404: Not found | 500: Server error | 501: Not implemented | 0: nothing returned
                    //SapData.NetworkError();
                }
            }
        };
        requestreq.send();
    },

    CheckLogin: function (userId, password, callback) {
        var serviceURL = oLogin + "(IPassword='" + encodeURIComponent(password) + "',IUser='" + encodeURIComponent(userId) + "')";
        SapData.CallDataService(serviceURL, function (xmlDoc, state) {
            if (state) {
                if (xmlDoc.getElementsByTagName("d:EMessage")[0].textContent == "Login Success") {
                    console.log('LOGIN SUCCESS');
                    localStorage.setItem("UserId", userId);
                    callback("Success");
                } else {
                    console.log('LOGIN FAILED');
                    localStorage.removeItem("UserId", userId);
                    callback("Failure");
                }
            } else {
                SapData.NetworkError();
            }
        });
    },

    loadRoutePlan: function (userId, callback) {
        var rId = [];
        SapData.CallDataService(oRoutePlan + "'" + userId + "'", function (xmlDoc, state) {

            if (state) {
                var x = xmlDoc.getElementsByTagName("entry");
                if (x[0].getElementsByTagName("d:MESSAGE")[0].textContent != "NO_ROUTE_ASSIGNED") {
                    IKMobileDB.db.transaction(
                        function (tx) {

                            var sql = "INSERT OR IGNORE INTO RoutePlan ( RoutePlanId, RoutePlan, UserId, IsCompleted, flag) VALUES (?, ?, ?, ?, ?)";

                            for (var i = 0; i < x.length; i++) {
                                var params = [x[i].getElementsByTagName("d:ROUTEPLAN")[0].textContent, x[i].getElementsByTagName("d:ROUTEPLAN")[0].textContent, x[i].getElementsByTagName("d:USER")[0].textContent, x[i].getElementsByTagName("d:STATUS")[0].textContent, ''];
                                tx.executeSql(sql, params);

                                rId[i] = x[i].getElementsByTagName("d:ROUTEPLAN")[0].textContent;
                            }


                            var updateSql = "Update RoutePlan set newlyAdded='Yes' where flag='' and RoutePlanId NOT IN (Select RoutePlanId from RoutePlanBackup)";
                            tx.executeSql(updateSql, [], function () {}, function () {});

                            console.log('Data Inserted into RoutePlan Table');
                            for (var r = 0; r < rId.length; r++) {
                                if (r == (rId.length - 1)) {
                                    SapData.loadRouteDetails(userId, rId[r], '1', function (rId) {
                                        SapData.loadDeliveryPickup(rId, '1', function (rId) {
                                            SapData.loadInventory(rId, '1', callback);
                                        });
                                    });
                                } else {
                                    SapData.loadRouteDetails(userId, rId[r], '0', function (rId) {
                                        SapData.loadDeliveryPickup(rId, '0', function (rId) {
                                            SapData.loadInventory(rId, '0', callback);
                                        });
                                    });
                                }
                            }
                        });
                } else {

                    $("#loginpopup").popup("close");
                    setTimeout(function () {
                        $("#popupOverlayNoRoutePlanAssigned").popup("open");
                    }, 500);
                    setTimeout(function () {
                        $("#popupOverlayNoRoutePlanAssigned").popup("close");
                    }, 2500);
                    localStorage.removeItem('UserId');
                }
            }
        });
    },

    loadRouteDetails: function (userId, rId, indexflag, callback) {

        var serviceURL = oRouteDetails + "'" + userId + "' and ROUTEPLAN eq '" + rId + "'";

        SapData.CallDataService(serviceURL, function (xmlDoc, state) {

            if (state) {
                var x = xmlDoc.getElementsByTagName("entry")[0].getElementsByTagName("entry");

                IKMobileDB.db.transaction(function (tx) {

                    var sql = "INSERT OR IGNORE INTO RouteDetails ( IndexId, RoutePlanId, RouteId, RoutePlan_Line, Route, Location, Name, City, State, OrderNo, PlannedArrival, PlannedDeparture, Arrival, Departure,flag) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                    var params = [0, rId, rId + "_0", x[0].getElementsByTagName("d:ROUTEPLAN_LINE")[0].textContent, x[0].getElementsByTagName("d:STOPDESC")[0].textContent, x[0].getElementsByTagName("d:LOCATION")[0].textContent, x[0].getElementsByTagName("d:LOCATION_DESC")[0].textContent, x[0].getElementsByTagName("d:CITY")[0].textContent, x[0].getElementsByTagName("d:REGION")[0].textContent, x[0].getElementsByTagName("d:ORDER")[0].textContent, '-', dateFormat(x[0].getElementsByTagName("d:SCHDEP")[0].textContent), '', '', ''];
                    tx.executeSql(sql, params);

                    for (var i = 1; i < x.length; i++) {
                        var params = [i, rId, rId + "_" + i, x[i].getElementsByTagName("d:ROUTEPLAN_LINE")[0].textContent, x[i].getElementsByTagName("d:STOPDESC")[0].textContent, x[i].getElementsByTagName("d:LOCATION")[0].textContent, x[i].getElementsByTagName("d:LOCATION_DESC")[0].textContent, x[i].getElementsByTagName("d:CITY")[0].textContent, x[i].getElementsByTagName("d:REGION")[0].textContent, x[i].getElementsByTagName("d:ORDER")[0].textContent, dateFormat(x[i].getElementsByTagName("d:SCHARV")[0].textContent), dateFormat(x[i].getElementsByTagName("d:SCHDEP")[0].textContent), '', '', ''];
                        tx.executeSql(sql, params);
                    }

                    var params = [x.length, rId, rId + "_" + x.length, x[0].getElementsByTagName("d:ROUTEPLAN_LINE")[0].textContent, x[0].getElementsByTagName("d:STOPDESC")[0].textContent, x[0].getElementsByTagName("d:LOCATION")[0].textContent, x[0].getElementsByTagName("d:LOCATION_DESC")[0].textContent, x[0].getElementsByTagName("d:CITY")[0].textContent, x[0].getElementsByTagName("d:REGION")[0].textContent, x[0].getElementsByTagName("d:ORDER")[0].textContent, dateFormat(x[0].getElementsByTagName("d:SCHARV")[0].textContent), '-', '', '', ''];
                    tx.executeSql(sql, params);

                    var sqlRoutePlanUpdate = "UPDATE RoutePlan set RouteName=?, Comments=?, DriverName=?, TruckMobile=? where RoutePlanId=?";
                    var comments = xmlDoc.getElementsByTagName("d:COMMENTS")[0].textContent.split("<>").join("<br>");

                    tx.executeSql(sqlRoutePlanUpdate, [xmlDoc.getElementsByTagName("d:ROUTEPLAN_TEXT")[0].textContent, comments, xmlDoc.getElementsByTagName("d:DRIVER")[0].textContent, xmlDoc.getElementsByTagName("d:TELF")[0].textContent, rId]);

                    if (indexflag == '1') {
                        var updateRouteDetailsSql = "update RouteDetails set newlyAdded='Yes' where flag='' and Location NOT IN (Select Location from RouteDetailsBackup) and RoutePlanId NOT IN (Select RoutePlanId from RoutePlan where newlyAdded='Yes')";
                        tx.executeSql(updateRouteDetailsSql, [], function () {}, function () {});

                        console.log('Data Inserted into RouteDetails Table');
                        console.log('RoutePlan Table Updated');
                        IKMobileDB.baseDataSyncLog('RoutePlan');
                        IKMobileDB.baseDataSyncLog('RouteDetails');
                    }
                    callback(rId);
                });
            } else {
                if (indexflag == '1') {
                    IKMobileDB.db.transaction(function (tx) {
                        var updateRouteDetailsSql = "update RouteDetails set newlyAdded='Yes' where flag='' and Location NOT IN (Select Location from RouteDetailsBackup) and RoutePlanId NOT IN (Select RoutePlanId from RoutePlan where newlyAdded='Yes')";
                        tx.executeSql(updateRouteDetailsSql, [], function () {}, function () {});
                    });
                    console.log('Data Inserted into RouteDetails Table');
                    console.log('RoutePlan Table Updated');
                    IKMobileDB.baseDataSyncLog('RoutePlan');
                    IKMobileDB.baseDataSyncLog('RouteDetails');
                }
                callback(rId);
            }
        });
    },

    loadDeliveryPickup: function (rId, flag, callback) {

        var serviceURL = oDeliveryPickup + "'" + rId + "'&$expand=Stopitm";
        SapData.CallDataService(serviceURL, function (xmlDoc, state) {

            if (state) {
                var w = xmlDoc.getElementsByTagName("feed")[0].getElementsByTagName("feed");
                //alert(w.length);

                var z = xmlDoc.getElementsByTagName("feed")[0];

                IKMobileDB.db.transaction(function (tx) {
                    var sql = "INSERT OR IGNORE INTO DeliveryPickup ( OrderNo, LineNo, ItemId, Item, Description, MaterialGrp, MaterialDesc, ExpectedQty, ConfirmedQty, Type, PickupComments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                    var sqlRouteDetailsUpdate = "UPDATE RouteDetails set SpecialInstructions=? where RoutePlanId=? and OrderNo=? and flag=''";

                    for (var j = 0; j < w.length; j++) {
                        var x = w[j].getElementsByTagName("entry");
                        //alert(x.length);
                        for (var i = 0; i < x.length; i++) {
                            var params = [x[i].getElementsByTagName("d:ORDER")[0].textContent, x[i].getElementsByTagName("d:ITEM_NUM")[0].textContent, x[i].getElementsByTagName("d:ORDER")[0].textContent + "_" + i, x[i].getElementsByTagName("d:MATERIAL")[0].textContent, x[i].getElementsByTagName("d:MATDESC")[0].textContent, x[i].getElementsByTagName("d:MATGROUP")[0].textContent, x[i].getElementsByTagName("d:MATGRPDES")[0].textContent, x[i].getElementsByTagName("d:QUANTITY")[0].textContent, x[i].getElementsByTagName("d:CONF_QUAN")[0].textContent, x[i].getElementsByTagName("d:FLAG")[0].textContent, x[i].getElementsByTagName("d:SERIAL")[0].textContent];
                            tx.executeSql(sql, params);
                        }

                        tx.executeSql(sqlRouteDetailsUpdate, [z.getElementsByTagName("d:DELV_TXT")[j].textContent + " " + z.getElementsByTagName("d:HDR_TXT")[j].textContent, rId, x[0].getElementsByTagName("d:ORDER")[0].textContent]);
                    }

                    var updateDeliveryPickupSql = "Update DeliveryPickup set newlyAdded='Yes' where flag is null and NOT EXISTS (select OrderNo,LineNo from DeliveryPickupBackup where DeliveryPickup.OrderNo=DeliveryPickupBackup.OrderNo and DeliveryPickup.LineNo=DeliveryPickupBackup.LineNo) and OrderNo NOT IN (Select RD.OrderNo from RouteDetails as RD join RoutePlan as RP on RD.RoutePlanId=RP.RoutePlanId where RP.newlyAdded='Yes' and RD.OrderNo!='')";
                    tx.executeSql(updateDeliveryPickupSql, [], function () {
                        var updateRouteDetailsSql = "update RouteDetails set newlyAdded='Yes' where RoutePlanId='" + rId + "' and OrderNo is not null and OrderNo IN (Select OrderNo from DeliveryPickup where newlyAdded='Yes' group by OrderNo)";
                        tx.executeSql(updateRouteDetailsSql, [], function () {}, function () {});
                    }, function () {});

                    if (flag == '1') {
                        console.log('Data Inserted into DeliveryPickup Table');
                        IKMobileDB.baseDataSyncLog('DeliveryPickup');
                    }
                    callback(rId);
                });
            } else {
                if (flag == '1') {
                    IKMobileDB.db.transaction(function (tx) {
                        var updateDeliveryPickupSql = "Update DeliveryPickup set newlyAdded='Yes' where flag is null and NOT EXISTS (select OrderNo,LineNo from DeliveryPickupBackup where DeliveryPickup.OrderNo=DeliveryPickupBackup.OrderNo and DeliveryPickup.LineNo=DeliveryPickupBackup.LineNo) and OrderNo NOT IN (Select RD.OrderNo from RouteDetails as RD join RoutePlan as RP on RD.RoutePlanId=RP.RoutePlanId where RP.newlyAdded='Yes' and RD.OrderNo!='')";
                        tx.executeSql(updateDeliveryPickupSql, [], function () {
                            var updateRouteDetailsSql = "update RouteDetails set newlyAdded='Yes' where RoutePlanId='" + rId + "' and OrderNo is not null and OrderNo IN (Select OrderNo from DeliveryPickup where newlyAdded='Yes' group by OrderNo)";
                            tx.executeSql(updateRouteDetailsSql, [], function () {}, function () {});
                        }, function () {});
                    });
                    console.log('Data Inserted into DeliveryPickup Table');
                    IKMobileDB.baseDataSyncLog('DeliveryPickup');
                }
                callback(rId);
            }
        });
    },

    loadInventory: function (rId, flag, callback) {
        var serviceURL = oInventory + "'" + rId + "'";

        SapData.CallDataService(serviceURL, function (xmlDoc, state) {
            if (state) {
                var x = xmlDoc.getElementsByTagName("entry");

                IKMobileDB.db.transaction(
                    function (tx) {
                        var sql = "INSERT OR IGNORE INTO Inventory ( RoutePlanId, ItemId, Item, Description, CommitedQuantity, TotalQuantity, UOM, BatchNo, SerialNo, InventoryType, Location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                        for (var i = 0; i < x.length; i++) {
                            var params = [x[i].getElementsByTagName("d:ROUTEPLAN")[0].textContent, x[i].getElementsByTagName("d:ROUTEPLAN")[0].textContent + "_" + i, x[i].getElementsByTagName("d:MATERIAL")[0].textContent, x[i].getElementsByTagName("d:MATDESC")[0].textContent, x[i].getElementsByTagName("d:QUANTITY")[0].textContent, x[i].getElementsByTagName("d:CONF_QUAN")[0].textContent, x[i].getElementsByTagName("d:UOM")[0].textContent, x[i].getElementsByTagName("d:BATCH_NUM")[0].textContent, x[i].getElementsByTagName("d:SERIAL")[0].textContent, x[i].getElementsByTagName("d:FLAG")[0].textContent, x[i].getElementsByTagName("d:LOCATION")[0].textContent];
                            tx.executeSql(sql, params);
                        }

                        if (flag == '1') {
                            console.log('Data Inserted into Inventory Table');
                            IKMobileDB.baseDataSyncLog('Inventory');
                            callback();
                        }
                    });
            } else {
                if (flag == '1') {
                    console.log('Data Inserted into Inventory Table');
                    IKMobileDB.baseDataSyncLog('Inventory');
                    callback();
                }
            }
        });
    },

    getCSRFToken: function (callback) {

        //alert("In CSRF Token");
        var requestCSR = new XMLHttpRequest();
        requestCSR.open("GET", oInTransfer, true);
        requestCSR.setRequestHeader('Authorization', storeObject.auth);
        requestCSR.setRequestHeader('X-CSRF-Token', 'Fetch');
        requestCSR.timeout = storeObject.oDataTimeOut;

        requestCSR.onreadystatechange = function () {
            //Call a function when the state changes.
            if (requestCSR.readyState == 4) {
                //alert(requestCSR.getResponseHeader('x-csrf-token'));
                var adata = requestCSR.getResponseHeader('x-csrf-token');
                storeObject.CSRKey = adata;

                console.log('found CSRf key :' + storeObject.CSRKey);
                callback();
            }
        };
        requestCSR.send();
    },

    updateRoutePlanHeaderStatus: function (dataObj, status, callback) {

        console.log("Started updateRoutePlanHeaderStatus");

        SapData.getCSRFToken(function () {
            var requestreq = new XMLHttpRequest();
            requestreq.open("PUT", oUpdateRoutePlan + "('" + dataObj[0].RoutePlanId + "')", true);
            //alert(storeObject.CSRKey);
            requestreq.setRequestHeader('Content-Type', 'application/atom+xml');
            requestreq.setRequestHeader('Authorization', storeObject.auth);
            requestreq.setRequestHeader('X-CSRF-Token', storeObject.CSRKey);
            requestreq.setRequestHeader('Accept', 'application/atom+xml,application/atomsvc+xml,application/xml');
            requestreq.timeout = storeObject.oDataTimeOut;

            requestreq.onreadystatechange = function () {
                //Call a function when the state changes.
                if (requestreq.readyState == 4) {
                    //alert('Header Request Status:: '+ requestreq.status);
                    if (requestreq.status == 200 || requestreq.status == 201 || requestreq.status == 204) {
                        //alert('PostHeader' + requestreq.getAllResponseHeaders());
                        //alert('Post Status'+ requestreq.status);
                        //alert('HTTP error ' + requestreq.status);
                        //xmlDoc = requestreq.responseXML;
                        console.log("Route Plan Header Status Updated");
                        dbQueries.updateFlag("Update SyncDetails set HeaderStatusFlag='1' where RouteId='" + dataObj[0].RouteId + "'");
                        callback();
                    } else {
                        //alert("Error in Network");
                        console.log("End with Error updateRoutePlanHeaderStatus");
                        SapData.UpdateError(requestreq.status + " : End with Error updateRoutePlanHeaderStatus");

                    }
                }
            };

            var returnval = '<?xml version="1.0" encoding="utf-8"?>' +
                '<atom:entry xmlns:atom ="http://www.w3.org/2005/Atom" xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata" xmlns:d="http://schemas.microsoft.com/ado/2007/08/dataservices" xml:base="' + oRoutePlanSrv + '">' +
                '<atom:content type="application/xml">' +
                '<m:properties>' +
                '<d:ROUTEPLAN>' + dataObj[0].RoutePlanId + '</d:ROUTEPLAN>' +
                '<d:ROUTEPLAN_LINE></d:ROUTEPLAN_LINE>' +
                '<d:ROUTEPLAN_STAT>' + status + '</d:ROUTEPLAN_STAT>' +
                '<d:START_ODO>' + dataObj[0].OdometerStartReading + '</d:START_ODO>' +
                '<d:END_ODO>' + (dataObj[0].OdometerEndReading ? dataObj[0].OdometerEndReading : '0') + '</d:END_ODO>' +
                '<d:HEADER>X</d:HEADER>' +
                '</m:properties>' +
                '</atom:content>' +
                '</atom:entry>';

            //console.log(returnval);
            requestreq.send(returnval);
        });
    },

    updateRoutePlanLineStatus: function (dataObj, status, callback) {

        console.log("Started updateRoutePlanLineStatus");

        SapData.getCSRFToken(function () {
            var requestreq = new XMLHttpRequest();
            requestreq.open("PUT", oUpdateRoutePlan + "('" + dataObj[0].RoutePlanId + "')", true);

            requestreq.setRequestHeader('Content-Type', 'application/atom+xml');
            requestreq.setRequestHeader('Authorization', storeObject.auth);
            requestreq.setRequestHeader('X-CSRF-Token', storeObject.CSRKey);
            requestreq.setRequestHeader('Accept', 'application/atom+xml,application/atomsvc+xml,application/xml');
            requestreq.timeout = storeObject.oDataTimeOut;

            requestreq.onreadystatechange = function () {
                //Call a function when the state changes.
                if (requestreq.readyState == 4) {
                    //alert('Line Request Status:: '+ requestreq.status);
                    if (requestreq.status == 200 || requestreq.status == 201 || requestreq.status == 204) {
                        // console.log('PostHeader' + requestreq.getAllResponseHeaders());
                        // console.log('Post Status'+ requestreq.status);
                        // console.log('HTTP error ' + requestreq.status);
                        //xmlDoc = requestreq.responseXML;
                        console.log("Route Plan Line Status Updated");
                        dbQueries.updateFlag("Update SyncDetails set LineStatusFlag='1' where RouteId='" + dataObj[0].RouteId + "'");
                        callback();
                    } else {
                        //alert("Error in Network");
                        console.log("End with Error updateRoutePlanLineStatus");
                        SapData.UpdateError(requestreq.status + " : End with Error updateRoutePlanLineStatus");
                        dbQueries.updateFlag("Update SyncDetails set LineStatusFlag='0' where RouteId='" + dataObj[0].RouteId + "'");
                    }
                }
            };
            var returnval = '<?xml version="1.0" encoding="UTF-8"?>' +
                '<atom:entry xmlns:atom="http://www.w3.org/2005/Atom" xmlns:d="http://schemas.microsoft.com/ado/2007/08/dataservices" xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata" xml:base="' + oRoutePlanSrv + '">' +
                '<atom:content type="application/xml">' +
                '<m:properties>' +
                '<d:ROUTEPLAN>' + dataObj[0].RoutePlanId + '</d:ROUTEPLAN>' +
                '<d:ROUTEPLAN_LINE>' + dataObj[0].RoutePlan_Line + '</d:ROUTEPLAN_LINE>' +
                '<d:ROUTEPLAN_STAT>' + status + '</d:ROUTEPLAN_STAT>' +
                '<d:HEADER />' +
                '</m:properties>' +
                '</atom:content>' +
                '</atom:entry>';

            //console.log(returnval);
            requestreq.send(returnval);

        });
    },

    updateArrivalDeparture: function (dataObj, callback) {

        console.log("Started updateArrivalDeparture");

        SapData.getCSRFToken(function () {
            var requestreq = new XMLHttpRequest();
            requestreq.open("PUT", oUpdateArrivalDeparture + "(ROUTEPLAN='" + dataObj[0].RoutePlanId + "',ROUTEPLAN_LINE='" + dataObj[0].RoutePlan_Line + "')", true);

            requestreq.setRequestHeader('Content-Type', 'application/atom+xml');
            requestreq.setRequestHeader('Authorization', storeObject.auth);
            requestreq.setRequestHeader('X-CSRF-Token', storeObject.CSRKey);
            requestreq.setRequestHeader('Accept', 'application/atom+xml,application/atomsvc+xml,application/xml');
            requestreq.timeout = storeObject.oDataTimeOut;

            requestreq.onreadystatechange = function () {
                //Call a function when the state changes.
                if (requestreq.readyState == 4) {
                    console.log('Arrival/Departure Request Status:: ' + requestreq.status);
                    if (requestreq.status == 200 || requestreq.status == 201 || requestreq.status == 204) {
                        // console.log('PostHeader' + requestreq.getAllResponseHeaders());
                        // console.log('Post Status'+ requestreq.status);
                        // console.log('HTTP error ' + requestreq.status);
                        xmlDoc = requestreq.responseXML;
                        // console.log(xmlDoc);
                        console.log("Arrival Departure Updated");
                        dbQueries.updateFlag("Update SyncDetails set ArrDepFlag='1' where RouteId='" + dataObj[0].RouteId + "'");
                        callback();
                    } else {
                        console.log("End with Error updateArrivalDeparture");
                        //alert("Error in Network");
                        SapData.UpdateError(requestreq.status + " : End with Error updateArrivalDeparture");
                        dbQueries.updateFlag("Update SyncDetails set ArrDepFlag='0' where RouteId='" + dataObj[0].RouteId + "'");
                    }
                }
            };

            var returnval = '<?xml version="1.0" encoding="UTF-8"?>' +
                '<atom:entry xmlns:atom="http://www.w3.org/2005/Atom" xmlns:d="http://schemas.microsoft.com/ado/2007/08/dataservices" xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata" xml:base="' + oRoutePlanSrv + '">' +
                '<atom:content type="application/atom+xml">' +
                '<m:properties>' +
                '<d:ROUTEPLAN>' + dataObj[0].RoutePlanId + '</d:ROUTEPLAN>' +
                '<d:ROUTEPLAN_LINE>' + dataObj[0].RoutePlan_Line + '</d:ROUTEPLAN_LINE>' +
                '<d:DOCUMENT_NUMB />' +
                '<d:ENTRY_NUMB></d:ENTRY_NUMB>' +
                '<d:CUSTOMER_NUMB>' + dataObj[0].Location + '</d:CUSTOMER_NUMB>' +
                '<d:UPDTD>0</d:UPDTD>' +
                '<d:ACTARVDT>' + sendDate(dataObj[0].Arrival) + '</d:ACTARVDT>' +
                '<d:ACTARVTM>' + sendTime(dataObj[0].Arrival) + '</d:ACTARVTM>' +
                '<d:ACTDEPDT>' + sendDate(dataObj[0].Departure) + '</d:ACTDEPDT>' +
                '<d:ACTDEPTM>' + sendTime(dataObj[0].Departure) + '</d:ACTDEPTM>' +
                '<d:MESSAGE />' +
                '<d:FLAG>X</d:FLAG>' +
                '</m:properties>' +
                '</atom:content>' +
                '</atom:entry>';

            //console.log(returnval);
            requestreq.send(returnval);
        });


    },

    updateInTransfer: function (customerName, customerSignature, routePlanLine, orderNo, dataObjArr, callback) {

        console.log("Start updateInTransfer");

        SapData.getCSRFToken(function () {

            var returnval = '<?xml version="1.0" encoding="utf-8"?>' +
                '<atom:entry xmlns:atom ="http://www.w3.org/2005/Atom" xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata" xmlns:d="http://schemas.microsoft.com/ado/2007/08/dataservices" xml:base="' + oRoutePlanSrv + '">' +
                '<atom:content type="application/xml">' +
                '<m:properties>' +
                '<d:PRINT_NAME>' + customerName + '</d:PRINT_NAME>' +
                '<d:SIGNATURE>' + customerSignature + '</d:SIGNATURE>' +
                '</m:properties>' +
                '</atom:content>' +
                '<atom:link rel="http://schemas.microsoft.com/ado/2007/08/dataservices/related/Intrnsfr_is" type="application/atom+xml;type=feed" title="ZMNK_MOBITOR_ROUTEPLANS_SRV.Intrnsfr_h_Intrnsfr_i">' +
                '<m:inline>' +
                '<atom:feed>';

            // start loop
            for (var i = 0; i < dataObjArr.length; i++) {

                console.log(dataObjArr[i].LineNo);

                lineNoFix = dataObjArr[i].LineNo;

                if (lineNoFix == "null") {
                    lineNoFix = "0000";
                }

                returnval += '<atom:entry>' +
                    '<atom:content type="application/xml">' +
                    '<m:properties>' +
                    '<d:DOCUMENT_NUMB>' + dataObjArr[i].DLPU + '</d:DOCUMENT_NUMB>' +
                    '<d:LINE_NUMB>' + lineNoFix + '</d:LINE_NUMB>' +
                    '<d:ENTRY_NUMB />' +
                    '<d:SERIAL_NUMB>' + (dataObjArr[i].SerialNo ? dataObjArr[i].SerialNo : '') + '</d:SERIAL_NUMB>' +
                    '<d:ITEM_NUMB>' + dataObjArr[i].Item + '</d:ITEM_NUMB>' +
                    '<d:QUANTITY>' + dataObjArr[i].TotalQuantity + '</d:QUANTITY>' +
                    '<d:UNIT>' + (dataObjArr[i].UOM ? dataObjArr[i].UOM : 'EA') + '</d:UNIT>' +
                    '<d:DIST_OR_NUMB>' + orderNo + '</d:DIST_OR_NUMB>' +
                    '<d:LOT_NUMB>' + (dataObjArr[i].BatchNo ? dataObjArr[i].BatchNo : '') + '</d:LOT_NUMB>' +
                    '<d:PROCESSED>1</d:PROCESSED>' +
                    '<d:HOURS>' + (dataObjArr[i].Hours ? dataObjArr[i].Hours : '') + '</d:HOURS>' +
                    '<d:ROUTE_NUMB>' + storeObject.selectedRoutePlanId + '</d:ROUTE_NUMB>' +
                    '<d:ROUTEPLAN_LINE>' + routePlanLine + '</d:ROUTEPLAN_LINE>' +
                    '</m:properties>' +
                    '</atom:content>' +
                    '</atom:entry>';
            }
            //end loop

            returnval += '</atom:feed>' +
                '</m:inline>' +
                '</atom:link>' +
                '</atom:entry>';

            var requestreq = new XMLHttpRequest();
            requestreq.open("POST", oInTransfer, true);
            requestreq.setRequestHeader('Access-Control-Allow-Origin', '*');
            requestreq.setRequestHeader('Content-length', returnval.length);
            requestreq.setRequestHeader('Content-Type', 'application/atom+xml');
            requestreq.setRequestHeader('Authorization', storeObject.auth);
            requestreq.setRequestHeader('X-CSRF-Token', storeObject.CSRKey);
            requestreq.setRequestHeader('Accept', 'application/atom+xml,application/atomsvc+xml,application/xml');
            requestreq.timeout = storeObject.oDataTimeOut;

            requestreq.onreadystatechange = function () {
                //Call a function when the state changes.

                console.log("Ready Status :" + requestreq.readyState);
                console.log("Request Status :" + requestreq.status);
                console.log("request URL:" + oInTransfer);
                console.log("response:" + requestreq.responseXML);

                if (requestreq.readyState == 4) {
                    if (requestreq.status == 200 || requestreq.status == 201 || requestreq.status == 204) {
                        console.log(oInTransfer);
                        console.log("InTransfer Updated");
                        dbQueries.updateFlag("Update SyncDetails set InTransferFlag='1' where OrderNo='" + orderNo + "'");
                        callback();
                    } // if end here
                    else if (requestreq.status >= 400 || requestreq.status == 0) {

                        console.log("End with Error updateInTransfer");
                        console.log("Failed Value:");
                        console.log(returnval);
                        SapData.UpdateError(requestreq.status + " : End with Error updateInTransfer");

                    } // else if end here
                } // end of if readystate
            }; // ready status change Function end


            //console.log(returnval);
            requestreq.send(returnval);
        });
    },

    NetworkError: function () {
        $("#loginpopup").popup("close");
        navigator.notification.alert("Network Down! \n Please try later", function () {}, "Error");
        //navigator.notification.beep(1);
    },


    UpdateError: function (errorMessage) {
        $("#popupLoaderSyncApp").popup("close");
        navigator.notification.alert("Unable to Sync Data!\nData will be synced as soon as we receive connection", function () {}, errorMessage);
        //navigator.notification.beep(1);
    },


    loginError: function () {
        navigator.notification.alert("Invalid Username or Password", function () {}, "Login Error");
        navigator.notification.beep(1);

        $("#loginpopup").bind("popupafterclose", function () {
            //alert("Login error");
            $("#loginpopup").unbind("popupafterclose");
            $("#popupDialogEmptyLogin").popup("open");
            $("#loginErrorMsg").html("Invalid Username or Password!");
        });
        $("#loginpopup").popup("close");
    }

};