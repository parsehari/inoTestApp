function Result() {
	//status will contain either SUCCESS or FAILURE
	this.status = null;
	//rows will contain the result
	this.rows = null;
	//errorMessage will be set only if status is FAILURE. 
	this.errorMessage = null;
};

Result.prototype.constructor = Result;
Result.SUCCESS = "SUCCESS";
Result.FAILURE = "FAILURE";

var dbQueries = {
	db: null,

	executeQuery: function (sql, params, callBackFunction) {

		IKMobileDB.db.transaction(function (tx) {
			if (params == null || params == undefined || params == "undefined" || !(params instanceof Array)) {
				params = [];
			}
			tx.executeSql(sql, params,
				function (tx, results) {
					var result = new Result();
					result.status = Result.SUCCESS;
					result.rows = results.rows;
					callBackFunction(result);
				},
				function (tx, e) {
					var result = new Result();
					result.status = Result.FAILURE;
					result.errorMessage = e.message;
					callBackFunction(result);
				});
		});
	},

	checkLogin: function (user, pass, callBackFunction) {

		// alert(user + ":" + pass);

		var sql = "select * from UserDetails where UserId = ? and Password = ?";
		var params = [user, pass];
		this.executeQuery(sql, params, function (result) {
			// alert(result.rows.length);
			switch (result.status) {
				case Result.SUCCESS:
					if (result.rows.length == 1) {
						// alert("User already Present");
						callBackFunction("True");
					} else if (result.rows.length == 0) {
						// alert("User not Present");
						callBackFunction("False");
					}
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	getRoutePlans: function (userId, callBackFunction) {
		var sql = "select R.RoutePlanId 'routePlanId', R.RoutePlan 'routePlan', R.RouteName 'routeName', R.DriverName 'driverName', R.TruckMobile 'truckMobile', R.Comments 'comments', R.newlyAdded 'newlyAdded' from RoutePlan  R where R.isCompleted != '5' and R.UserId = ?";
		// alert(userId);
		var params = [userId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					var list = [];
					for (var i = 0; i < result.rows.length; i++) {
						list.push(result.rows.item(i));
					}
					callBackFunction(list);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	getRoutePlanHeader: function (routeId, userId, callBackFunction) {

		var sql = "Select * from RoutePlan where RoutePlanId= ? and UserId=?";
		var params = [routeId, userId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					callBackFunction(result.rows.item(0));
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	getRouteDetails: function (routePlanId, callBackFunction) {
		//alert(routePlanId);
		var sql = "Select RD.RoutePlanId 'routePlanId', RD.RouteId 'routeId', RD.RoutePlan_Line 'RoutePlan_Line', RD.Route 'route', RD.Location 'location', RD.Name 'name', RD.City 'city', RD.State 'state', RD.OrderNo 'orderNumber', RD.Departure 'departure', RD.Arrival 'arrival', RD.PlannedDeparture 'plannedDeparture', RD.PlannedArrival 'plannedArrival', RD.SpecialInstructions 'specialInstructions', RD.CustomerName 'customerName', RD.CustomerSignature 'customerSignature', RD.newlyAdded 'newlyAdded' From RouteDetails RD where RD.RoutePlanId = ? order by IndexId";
		var params = [routePlanId];
		this.executeQuery(sql, params, function (result) {
			//alert(result.status+" "+result.rows.length);
			switch (result.status) {
				case Result.SUCCESS:
					var list = [];
					for (var i = 0; i < result.rows.length; i++) {
						list.push(result.rows.item(i));
					}
					callBackFunction(list);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	resetSyncDetails: function (routeId, callBackFunction) {
		var sql = "update SyncDetails set InTransferFlag = '0', ArrDepFlag = '0', LineStatusFlag = '0' where routeId = ?";
		var params = [routeId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					console.log("Sync Flag Reset");
					callBackFunction();
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});

	},

	updateArrivalDate: function (date, routeId, callBackFunction) {
		var sql = "update RouteDetails set Arrival = ?,flag='0' where routeId = ?";
		var params = [date, routeId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					//callBackFunction();
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});

		var sql1 = "Update DeliveryPickup set flag='0' where OrderNo = (Select OrderNo from RouteDetails where RouteId=?)";
		var params1 = [routeId];
		this.executeQuery(sql1, params1, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					callBackFunction();
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	updateDepartureDate: function (date, routeId, callBackFunction) {
		var sql = "update RouteDetails set Departure = ?,flag='0',newlyAdded='' where routeId = ?";
		var params = [date, routeId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					//callBackFunction();
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});

		var sql1 = "Update DeliveryPickup set newlyAdded='' where flag='0' and OrderNo = (Select OrderNo from RouteDetails where RouteId=?)";
		var params1 = [routeId];
		this.executeQuery(sql1, params1, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					callBackFunction();
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	saveOdoMeterStartReading: function (routePlanId, odometerReading, callBackFunction) {
		var sql = "update RoutePlan set OdometerStartReading = ?, IsCompleted='4', flag='0',newlyAdded='' where RoutePlanId = ?";
		var params = [odometerReading, routePlanId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					callBackFunction();
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	saveOdoMeterEndReading: function (routePlanId, odometerReading, callBackFunction) {
		var sql = "update RoutePlan set OdometerEndReading = ?, IsCompleted='5', flag='0' where RoutePlanId = ?";
		var params = [odometerReading, routePlanId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					callBackFunction();
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	//Added by Siddhu
	getItemDetails: function (orderNo, orderType, callBackFunction) {
		var sql = "select * from DeliveryPickup ID, Inventory IM where ID.ItemId = IM.ItemId and ID.OrderNo = ? and ID.Type = ?";
		var params = [orderNo, orderType];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					var list = [];
					for (var i = 0; i < result.rows.length; i++) {
						list.push(result.rows.item(i));
					}
					callBackFunction(list);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	getInventory: function (type, value, routePlanID, callBackFunction) {
		var sql = "";
		if (type == "serial") {
			sql = "select * from Inventory where SerialNo = ? and InventoryType = 'T' and RoutePlanId = ?";
		} else if (type == "batch") {
			sql = "select * from Inventory where BatchNo = ? and InventoryType = 'T' and RoutePlanId = ?";
		} else if (type == "material") {
			sql = "select * from Inventory where Item = ? and InventoryType = 'T' and RoutePlanId = ?";
		} else {
			alert("Error :: DB Queries :: getItemMaster function");
		}
		var params = [value, routePlanID];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					if (result.rows.length > 0) {
						var list = [];
						for (var i = 0; i < result.rows.length; i++) {
							list.push(result.rows.item(i));
						}
						callBackFunction(list);
					} else {
						callBackFunction(null);
					}
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	getPickupInventory: function (type, value, routePlanId, callBackFunction) {
		var sql = "";
		if (type == "serial") {
			sql = "select * from Inventory where SerialNo = ? and InventoryType = 'C' and RoutePlanId = ?";
			//sql = "select * from Inventory where SerialNo = ? and InventoryType = 'C'";
		} else {
			alert("Error :: DB Queries :: getItemMaster function");
		}
		var params = [value, routePlanId];
		//var params =[value];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					if (result.rows.length > 0) {
						var list = [];
						for (var i = 0; i < result.rows.length; i++) {
							list.push(result.rows.item(i));
						}
						callBackFunction(list);
					} else {
						callBackFunction(null);
					}
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	updateItemDetails: function (orderNo, itemId, qty, callBackFunction) {
		var sql = "update DeliveryPickup set ConfirmedQty = ? where OrderNo = ? and ItemId = ?";
		var params = [qty, orderNo, itemId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					callBackFunction();
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	saveItemDetails: function (itd, callBackFunction) {
		var sql = "INSERT INTO DeliveryPickup ( OrderNo, ItemId, Item, Description, ExpectedQty, ConfirmedQty, Type, IsAdded, flag, LineNo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, (Select max(LineNo)+10 from DeliveryPickup where OrderNo=?))";
		var params = [itd.orderNo, itd.itemId, itd.item, itd.description, '0', itd.qty, itd.type, "TRUE", "0", itd.orderNo];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					callBackFunction();
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	//Get Inventory Details    
	getInventoryDetails: function (routePlanId, callBackFunction) {
		var sql = "SELECT Item, Description, (TotalQuantity- (CASE WHEN ConfirmedQty IS NULL THEN 0 ELSE ConfirmedQty END) ) 'TotalQuantity' , (ExpectedQty-(CASE WHEN QTY IS NULL THEN 0 ELSE QTY END)) 'CommitedQty' " +
			"FROM " +
			"( " +
			"SELECT Item, Description, SUM(CommitedQuantity) 'TotalQuantity' FROM Inventory WHERE RoutePlanId = ? AND InventoryType = 'T' GROUP BY Item, Description " +
			") " +
			"LEFT JOIN " +
			"( " +
			"select Item 'Item1', Description 'Description1', SUM(ConfirmedQty) 'ConfirmedQty', SUM(ExpectedQty) 'ExpectedQty', SUM(QTY) 'QTY' " +
			"FROM " +
			"( " +
			"SELECT Item, Description, ConfirmedQty, ExpectedQty, ExpectedQty 'QTY' FROM DeliveryPickup WHERE OrderNo IN ( SELECT OrderNo FROM RouteDetails WHERE RoutePlanId = ? and OrderNo IS NOT NULL and Route != 'UHS' and ((Departure is not null AND Departure != '' and Arrival is not null AND Arrival != '') OR CustomerSignature IS NOT NULL)) AND Type != 'X' " +
			"union all " +
			"SELECT Item, Description, ConfirmedQty, 0 'ExpectedQty', 0 'QTY' FROM DeliveryPickup WHERE OrderNo IN ( SELECT OrderNo FROM RouteDetails WHERE RoutePlanId = ? and OrderNo IS NOT NULL and Route = 'UHS' and ((Departure is not null AND Departure != '' and Arrival is not null AND Arrival != '') OR CustomerSignature IS NOT NULL)) AND Type != 'X' " +
			"union all " +
			"SELECT Item, Description,ConfirmedQty,ExpectedQty, CASE WHEN ConfirmedQty>ExpectedQty THEN ExpectedQty ELSE ConfirmedQty END AS QTY FROM DeliveryPickup WHERE OrderNo NOT IN ( SELECT OrderNo FROM RouteDetails WHERE RoutePlanId = ? and OrderNo IS NOT NULL and (((Departure is not null AND Departure != '' and Arrival is not null AND Arrival != '') OR CustomerSignature IS NOT NULL) OR Route = 'UHS') UNION SELECT OrderNo FROM RouteDetails WHERE RoutePlanId != ?) AND Type != 'X' " +
			"union all " +
			"SELECT Item, Description,ConfirmedQty,0 'ExpectedQty', 0 'QTY' FROM DeliveryPickup WHERE OrderNo NOT IN ( SELECT OrderNo FROM RouteDetails WHERE RoutePlanId = ? and OrderNo IS NOT NULL and (((Departure is not null AND Departure != '' and Arrival is not null AND Arrival != '') OR CustomerSignature IS NOT NULL) OR Route != 'UHS') UNION SELECT OrderNo FROM RouteDetails WHERE RoutePlanId != ?) AND Type != 'X' " +
			") GROUP BY Item, Description " +
			") " +
			"ON Item = Item1";
		var params = [routePlanId, routePlanId, routePlanId, routePlanId, routePlanId, routePlanId, routePlanId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					var list = [];
					for (var i = 0; i < result.rows.length; i++) {
						list.push(result.rows.item(i));
					}
					callBackFunction(list);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},
	//Get Inventory Tab Details               
	getInventoryTabDetails: function (routePlanId, callBackFunction) {
		var sql = "Select * from" +
			"(SELECT SUM(CommitedQuantity) 'CommitedQuantity', Item 'Item1', Description 'Description1' FROM Inventory where InventoryType = 'T' and RoutePlanId = ? group by Item, Description)" +
			"LEFT JOIN" +
			"(SELECT SUM(ExpectedQty) 'ExpectedQty' , SUM(ConfirmedQty) 'ConfirmedQty', Item , Description FROM DeliveryPickup where Type != 'X' " +
			"and OrderNo IN (SELECT distinct OrderNo FROM RouteDetails where (OrderNo is not null and OrderNo != '') and RoutePlanId = ?) group by Item , Description)" +
			"ON Item1 = Item";
		var params = [routePlanId, routePlanId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					var list = [];
					for (var i = 0; i < result.rows.length; i++) {
						list.push(result.rows.item(i));
					}
					callBackFunction(list);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});

	},

	updatePickupDeliveryItem: function (itemID, orderNo, orderType, callBackFunction) {
		var sql = "update DeliveryPickup set ConfirmedQty = null where ItemId = ? and OrderNo = ? and Type = ?";
		var params = [itemID, orderNo, orderType];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					var returnObj = result.rows.length;
					callBackFunction(returnObj);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	getReviewDetails: function (orderNo, orderType, routePlanId, callBackFunction) {
		var sql = ""
		if (orderType == "Pickup") {
			sql = "SELECT Item, Description, SerialNo, BatchNo, Hours, TotalQuantity FROM Inventory WHERE OrderNo = ? and RoutePlanId = ? and InventoryType = 'C'" +
				"UNION ALL " +
				"Select Item1 'Item', Description1 'Description',SerialNo, BatchNo, Hours1 'Hours', ConfirmedQty from (SELECT Item 'Item1', Description 'Description1', Hours 'Hours1', Sum(ConfirmedQty) 'ConfirmedQty' FROM DeliveryPickup where Type = 'X' and OrderNo=? and Item NOT IN(SELECT distinct Item FROM Inventory WHERE OrderNo = ? and RoutePlanId = ? and InventoryType = 'C') group by Item , Description having SUM(ConfirmedQty) > 0) LEFT JOIN Inventory ON Inventory.Item = Item1 and Inventory.InventoryType = 'C' and Inventory.RoutePlanId = ?";
		} else {
			sql = "SELECT Item, Description, SerialNo, BatchNo, Hours, TotalQuantity 'Quantity' FROM Inventory WHERE OrderNo = ? and RoutePlanId = ? and InventoryType = 'T'" +
				"UNION ALL " +
				"Select Item1 'Item', Description1 'Description',SerialNo, BatchNo, Hours1 'Hours', ConfirmedQty 'Quantity' from (SELECT Item 'Item1', Description 'Description1', Hours 'Hours1', Sum(ConfirmedQty) 'ConfirmedQty' FROM DeliveryPickup where Type != 'X' and OrderNo=? and Item NOT IN(SELECT distinct Item FROM Inventory WHERE OrderNo = ? and RoutePlanId = ? and InventoryType = 'T') group by Item , Description having SUM(ConfirmedQty) > 0) LEFT JOIN Inventory ON Inventory.Item = Item1 and Inventory.InventoryType = 'T' and Inventory.RoutePlanId = ?";
		}

		var params = [orderNo, routePlanId, orderNo, orderNo, routePlanId, routePlanId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					var list = [];
					for (var i = 0; i < result.rows.length; i++) {
						list.push(result.rows.item(i));
					}
					callBackFunction(list);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	updateSignature: function (customerSignature, customerName, routePlanId, orderNo, callBackFunction) {
		var sql = "update RouteDetails set CustomerSignature = ?, CustomerName = ? where RoutePlanId = ? and OrderNo = ?";
		var params = [customerSignature, customerName, routePlanId, orderNo];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					var returnObj = result.rows.length;
					callBackFunction(returnObj);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	getOpenRoutePlansByUser: function (userId, callBackFunction) {
		var sql = "SELECT * FROM RoutePlan WHERE UserId = ?";
		var params = [userId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					var list = [];
					for (var i = 0; i < result.rows.length; i++) {
						list.push(result.rows.item(i));
					}
					callBackFunction(list);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	setRouteDetailsToDefault: function (routePlanId, callBackFunction) {
		var sql = " UPDATE RouteDetails SET Departure = '', Arrival = '', CustomerName ='', CustomerSignature = '' WHERE RoutePlanId = ?";
		var params = [routePlanId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					var list = [];
					for (var i = 0; i < result.rows.length; i++) {
						list.push(result.rows.item(i));
					}
					callBackFunction(list);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	deleteIsAddedRowsByRoutePlanId: function (routePlanId, callBackFunction) {
		var sql = "DELETE FROM DeliveryPickup WHERE IsAdded = 'TRUE' AND OrderNo IN (Select OrderNo from RouteDetails where RoutePlanId = ?)";
		var params = [routePlanId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					callBackFunction(result);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	setItemDetailsToDefault: function (routePlanId, callBackFunction) {
		var sql = " UPDATE DeliveryPickup SET ConfirmedQty = '0' WHERE OrderNo IN (Select OrderNo from RouteDetails where RoutePlanId = ?)";
		var params = [routePlanId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					callBackFunction(result);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	setRoutePlanToDefault: function (userId, callBackFunction) {
		var sql = " UPDATE RoutePlan SET OdometerStartReading = null, OdometerEndReading = null WHERE UserId = ?";
		var params = [userId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					callBackFunction(result);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	//Delete recently Scanned Data and Undo arrival
	updateConfirmedQtyToNull: function (orderNo, callBackFunction) {
		var sql = "update DeliveryPickup set ConfirmedQty = '0'  where OrderNo = ?";
		var params = [orderNo];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					callBackFunction(result);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	deleteAddedRows: function (orderNo, callBackFunction) {
		var sql = "delete from DeliveryPickup Where IsAdded = 'TRUE' and OrderNo = ?";
		var params = [orderNo];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					callBackFunction(result);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	updateArrivalToNullByRouteID: function (routeID, callBackFunction) {
		var sql = "update RouteDetails set Arrival = '' where RouteID = ?";
		var params = [routeID];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					callBackFunction(result);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	getPickupDetails: function (orderNo, callBackFunction) {
		var sql = "SELECT SUM(ExpectedQty) 'ExpectedQty' , SUM(ConfirmedQty) 'ConfirmedQty', Item, Description FROM DeliveryPickup where Type = 'X' and OrderNo=? group by Item , Description";
		var params = [orderNo];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					var list = [];
					for (var i = 0; i < result.rows.length; i++) {
						list.push(result.rows.item(i));
					}
					callBackFunction(list);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	getDeliveryDetails: function (orderNo, callBackFunction) {
		var sql = "SELECT SUM(ExpectedQty) 'ExpectedQty' , SUM(ConfirmedQty) 'ConfirmedQty', Item, Description FROM DeliveryPickup where Type != 'X' and OrderNo=? group by Item , Description";
		var params = [orderNo];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					var list = [];
					for (var i = 0; i < result.rows.length; i++) {
						list.push(result.rows.item(i));
					}
					callBackFunction(list);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	getDeliveryItem: function (orderNo, item, callBackFunction) {
		var sql = "select * from DeliveryPickup where OrderNo = ? and Item = ? and Type != 'X'";
		var params = [orderNo, item];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					if (result.rows.length > 0) {
						callBackFunction(result.rows.item(0));
					} else {
						callBackFunction(null);
					}
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	getPickupItem: function (orderNo, item, callBackFunction) {
		var sql = "select * from (select * from DeliveryPickup where Type = 'X' and OrderNo = ? and Item = ?) left join (select Sum(ExpectedQty) 'ExpectedQty1', Sum(ConfirmedQty) 'ConfirmedQty1' , Item 'Item1', OrderNo 'OrderNo1' FROM DeliveryPickup WHere Type = 'X' and OrderNo = ? and Item = ? group by Item, OrderNo) on Item = Item1 and OrderNo =OrderNo1";
		var params = [orderNo, item, orderNo, item];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					if (result.rows.length > 0) {
						callBackFunction(result.rows.item(0));
					} else {
						callBackFunction(null);
					}
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	updateConfirmedQtyForDelivery: function (confirmedQty, orderNo, item, callBackFunction) {
		var sql = "update DeliveryPickup set ConfirmedQty = ? where OrderNo = ? and Item = ? and Type != 'X'";
		var params = [confirmedQty, orderNo, item];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					callBackFunction(result);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	updateConfirmedQtyForPickup: function (confirmedQty, hours, itemId, callBackFunction) {
		var sql = "update DeliveryPickup set ConfirmedQty = ?, Hours = ? where ItemId = ? and Type = 'X'";
		var params = [confirmedQty, hours, itemId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					callBackFunction(result);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	updateTotalQtyForDelivery: function (totalQty, orderNo, itemId, lineNo, callBackFunction) {
		var sql = "update Inventory set TotalQuantity = ?, OrderNo = ?, LineNo=?, flag='0' where ItemId = ? and InventoryType = 'T'";
		var params = [totalQty, orderNo, lineNo, itemId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					callBackFunction(result);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	updateTotalQtyForPickup: function (totalQty, orderNo, hours, itemId, lineNo, callBackFunction) {
		var sql = "update Inventory set TotalQuantity = ?, OrderNo = ? , LineNo=? , Hours = ?, flag='0' where ItemId = ? and InventoryType = 'C'";
		var params = [totalQty, orderNo, lineNo, hours, itemId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					callBackFunction(result);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	insertDeliveryData: function (itd, callBackFunction) {
		var sql = "INSERT INTO DeliveryPickup ( OrderNo, ItemId, Item, Description, ExpectedQty, ConfirmedQty, Type, IsAdded, flag, LineNo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, (Select max(LineNo)+10 from DeliveryPickup where OrderNo=?))";
		var params = [itd.orderNo, itd.itemId, itd.item, itd.itemDesc, '0', itd.confirmedQty, '', "TRUE", "0", itd.orderNo];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					dbQueries.getLineNo(itd.orderNo, itd.itemId, function (lineNo) {
						callBackFunction(lineNo);
					});

					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	insertPickupData: function (itd, callBackFunction) {
		dbQueries.getPickupItem(itd.orderNo, itd.item, function (pickupItem) {
			if (pickupItem) {
				dbQueries.updateConfirmedQtyForPickup(pickupItem.ConfirmedQty1 + 1, itd.hours, pickupItem.ItemId, function () {
					callBackFunction(pickupItem.LineNo);
				});
			} else {
				var sql = "INSERT INTO DeliveryPickup ( OrderNo, ItemId, Item, ExpectedQty, ConfirmedQty, Type, IsAdded, Hours, flag, LineNo, Description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, (Select max(LineNo)+10 from DeliveryPickup where OrderNo=?), (SELECT Description FROM Inventory WHERE Item = ? LIMIT 1))";
				var params = [itd.orderNo, itd.itemId, itd.item, '0', itd.confirmedQty, 'X', "TRUE", itd.hours, "0", itd.orderNo, itd.item];
				dbQueries.executeQuery(sql, params, function (result) {
					switch (result.status) {
						case Result.SUCCESS:
							dbQueries.getLineNo(itd.orderNo, itd.itemId, function (lineNo) {
								callBackFunction(lineNo);
							});
							break;
						case Result.FAILURE:
							alert("Err :: " + result.errorMessage);
							break;
					}
				});
			}
		});
	},

	/*getMaterilaGrp: function(item, callBackFunction){
		var sql = "select MaterialGrp from DeliveryPickup where Item = ?";
		  var params =[item];
		  this.executeQuery(sql, params, function(result){
			  switch (result.status) {
			  case Result.SUCCESS:
				  if(result.rows.length > 0){
					  callBackFunction(result.rows.item(0).MaterialGrp);
				  }else{
					  dbQueries.isCylinder(item, function(result){
						  if(result == true){
							  //Cylinder
							  callBackFunction(52);
						  }else{
							  //Not cylinder
							  callBackFunction(1);
						  }
					  });
				  }
				  break;
			  case Result.FAILURE:
				  alert("Err :: "+result.errorMessage);
				  break;
			  }
		  }); 
	},*/

	getDeliveryPickupItem: function (orderNo, item, callBackFunction) {
		var sql = "select * from DeliveryPickup where OrderNo = ? and Item = ? and Type = 'X'";
		var params = [orderNo, item];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					if (result.rows.length > 0) {
						callBackFunction(result.rows.item(0));
					} else {
						callBackFunction('');
					}
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	updateSyncFlag: function (routePlanId, routeId, flag1, flag2, flag3, flag4) {
		var sql = "INSERT OR REPLACE INTO SyncDetails (RoutePlanId, RouteId, Route, OrderNo, HeaderStatusFlag, InTransferFlag, ArrDepFlag, LineStatusFlag) VALUES(?, ?, (Select Route from RouteDetails where RouteId= ?), (Select OrderNo from RouteDetails where RouteId= ?), '" + flag1 + "', '" + flag2 + "', '" + flag3 + "', '" + flag4 + "')";

		var params = [routePlanId, routeId, routeId, routeId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					console.log('Location Detail Added in SyncDetails');
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	updateFlag: function (sql) {
		//alert(sql);
		this.executeQuery(sql, [], function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					console.log('Flag Updated');
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	updateDeliveryPickupItemPickup: function (confirmedQty, itemId, callBackFunction) {
		var sql = "update DeliveryPickup set ConfirmedQty = ?, Hours = '' where ItemId = ?";
		var params = [confirmedQty, itemId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					callBackFunction(result);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});

	},

	deleteDeliveryPickupItemPickup: function (itemId, callBackFunction) {
		var sql = "delete from DeliveryPickup where ItemId = ?";
		var params = [itemId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					callBackFunction(result);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});

	},

	updateInventoryForPickup: function (routePlanId, item, qty, callBackFunction) {
		var sql = "update Inventory set TotalQuantity = ?,flag='0' where Item = ? and InventoryType = 'C' and RoutePlanId = ?";
		var params = [qty, item, routePlanId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					callBackFunction(result);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	getInventoryForPickup: function (routePlanId, item, callBackFunction) {
		var sql = "select * from Inventory where Item = ? and InventoryType = 'C' and RoutePlanId = ?";
		var params = [item, routePlanId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					if (result.rows.length > 0)
						callBackFunction(result.rows.item(0));
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	updateInventoryForPickupSerial: function (routePlanId, serialNo, qty, callBackFunction) {
		var sql = "update Inventory set TotalQuantity = ?, OrderNo = null, Hours = null, flag='0' where SerialNo = ? and InventoryType = 'C' and RoutePlanId = ?";
		var params = [qty, serialNo, routePlanId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					callBackFunction(result);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	getInventoryForPickupSerial: function (routePlanId, serialNo, callBackFunction) {
		var sql = "select * from Inventory where SerialNo = ? and InventoryType = 'C' and RoutePlanId = ?";
		var params = [serialNo, routePlanId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					if (result.rows.length > 0)
						callBackFunction(result.rows.item(0));
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	updateDeliveryPickupItemDelivery: function (confirmedQty, itemId, callBackFunction) {
		var sql = "update DeliveryPickup set ConfirmedQty = ?, Hours = '' where ItemId = ?";
		var params = [confirmedQty, itemId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					callBackFunction(result);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});

	},

	deleteDeliveryPickupItemDelivery: function (itemId, callBackFunction) {
		var sql = "delete from DeliveryPickup where ItemId = ?";
		var params = [itemId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					callBackFunction(result);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});

	},

	getInventoryForDeliverySerial: function (routePlanId, serialNo, callBackFunction) {
		var sql = "select * from Inventory where SerialNo = ? and InventoryType = 'T' and RoutePlanId = ?";
		var params = [serialNo, routePlanId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					if (result.rows.length > 0)
						callBackFunction(result.rows.item(0));
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	updateInventoryForDeliverySerial: function (routePlanId, serialNo, qty, callBackFunction) {
		var sql = "update Inventory set TotalQuantity = ?, OrderNo = null, Hours = null, flag='0' where SerialNo = ? and InventoryType = 'T' and RoutePlanId = ?";
		var params = [qty, serialNo, routePlanId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					callBackFunction(result);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	getInventoryForDelivery: function (routePlanId, item, callBackFunction) {
		var sql = "select * from Inventory where Item = ? and InventoryType = 'T' and RoutePlanId = ?";
		var params = [item, routePlanId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					if (result.rows.length > 0)
						callBackFunction(result.rows.item(0));
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	updateInventoryForDelivery: function (routePlanId, item, qty, callBackFunction) {
		var sql = "update Inventory set TotalQuantity = ?, flag='0' where Item = ? and InventoryType = 'T' and RoutePlanId = ?";
		var params = [qty, item, routePlanId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					callBackFunction(result);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	getBatchMaterialManagedRecords: function (orderNo, routePlanId, callBackFunction) {
		var sql = "Select Item1 'Item', Description1 'Description',SerialNo, BatchNo, Hours1 'Hours', ConfirmedQty from (SELECT Item 'Item1', Description 'Description1', Hours 'Hours1', ConfirmedQty  FROM DeliveryPickup where Type != 'X' and OrderNo=? and Item NOT IN(SELECT distinct Item FROM Inventory WHERE OrderNo = ? and RoutePlanId = ? and InventoryType = 'T') group by Item , Description having SUM(ConfirmedQty) > 0) LEFT JOIN Inventory ON Inventory.Item = Item1 and Inventory.InventoryType = 'T' and Inventory.RoutePlanId = ?";

		var params = [orderNo, orderNo, routePlanId, routePlanId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					var list = [];
					for (var i = 0; i < result.rows.length; i++) {
						list.push(result.rows.item(i));
					}
					callBackFunction(list);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	updateInventorySerials: function (orderNo, routePlanId, callBackFunction) {
		var sql = "update Inventory set TotalQuantity = 0, OrderNo = null, Hours = null, flag='0' where OrderNo = ? and RoutePlanId = ?";
		var params = [orderNo, routePlanId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					callBackFunction(result);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	deleteInventoryAddedRows: function (orderNo, routePlanId, callBackFunction) {
		var sql = "delete from Inventory where OrderNo = ? and RoutePlanId = ? and ItemId = SerialNo";
		var params = [orderNo, routePlanId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					callBackFunction(result);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	getPickupComments: function (orderNo, callBackFunction) {
		var sql = "Select * from DeliveryPickup where OrderNo = ? and Type = 'X'";
		var params = [orderNo];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					var list = [];
					for (var i = 0; i < result.rows.length; i++) {
						list.push(result.rows.item(i));
					}
					callBackFunction(list);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	getInTransferDataForPickup: function (routePlanId, orderNo, callBackFunction) {
		//alert(orderNo+" "+routePlanId);
		var sql = "SELECT Item, Description, SerialNo, BatchNo, Hours, TotalQuantity, LineNo, UOM FROM Inventory WHERE OrderNo = ? and RoutePlanId = ? and InventoryType = 'C'" +
			"UNION ALL " +
			"Select Item1 'Item', Description1 'Description',SerialNo, BatchNo, Hours1 'Hours', ConfirmedQty, LineNo, UOM from (SELECT Item 'Item1', Description 'Description1', Hours 'Hours1', Sum(ConfirmedQty) 'ConfirmedQty' FROM DeliveryPickup where Type = 'X' and OrderNo=? and Item NOT IN(SELECT distinct Item FROM Inventory WHERE OrderNo = ? and RoutePlanId = ? and InventoryType = 'C') group by Item , Description having SUM(ConfirmedQty) > 0) LEFT JOIN Inventory ON Inventory.Item = Item1 and Inventory.InventoryType = 'C' and Inventory.RoutePlanId = ?";

		console.log(sql);
		console.log(orderNo);
		console.log(routePlanId);


		var params = [orderNo, routePlanId, orderNo, orderNo, routePlanId, routePlanId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					var list = [];
					for (var i = 0; i < result.rows.length; i++) {
						var item = result.rows.item(i);
						item.DLPU = 'PU';
						list.push(item);
					}
					//alert("PickupList"+list);
					console.log("Pickup List: " + list);
					callBackFunction(list);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	getInTransferDataForDelivery: function (routePlanId, orderNo, callBackFunction) {

		var sql = "SELECT Item, Description, SerialNo, BatchNo, Hours, TotalQuantity, LineNo, UOM FROM Inventory WHERE OrderNo = ? and RoutePlanId = ? and InventoryType = 'T'" +
			"UNION ALL " +
			"Select Item1 'Item', Description1 'Description',SerialNo, BatchNo, Hours1 'Hours', ConfirmedQty, LineNo, UOM from (SELECT Item 'Item1', Description 'Description1', Hours 'Hours1', Sum(ConfirmedQty) 'ConfirmedQty' FROM DeliveryPickup where Type != 'X' and OrderNo=? and Item NOT IN(SELECT distinct Item FROM Inventory WHERE OrderNo = ? and RoutePlanId = ? and InventoryType = 'T') group by Item , Description having SUM(ConfirmedQty) > 0) LEFT JOIN Inventory ON Inventory.Item = Item1 and Inventory.InventoryType = 'T' and Inventory.RoutePlanId = ?";

		var params = [orderNo, routePlanId, orderNo, orderNo, routePlanId, routePlanId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					var list = [];
					for (var i = 0; i < result.rows.length; i++) {
						var item = result.rows.item(i);
						item.DLPU = 'DL';
						list.push(item);
					}
					//alert("Delivery List length"+list.length);
					console.log("Delivery List: " + list);
					callBackFunction(list);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	getInTransferData: function (routePlanId, orderNo, callBackFunction) {
		dbQueries.getInTransferDataForPickup(routePlanId, orderNo, function (pickuplist) {
			dbQueries.getInTransferDataForDelivery(routePlanId, orderNo, function (deliverylist) {
				if (!pickuplist) {
					pickuplist = [];
				}
				if (deliverylist) {
					for (var i = 0; i < deliverylist.length; i++) {
						pickuplist.push(deliverylist[i]);
					}
				}
				//alert("FinalList "+pickuplist);
				console.log(pickuplist);
				callBackFunction(pickuplist);
			});
		});
	},

	getArrDepData: function (routeId, callBackFunction) {
		var sql = "Select RP.OdometerStartReading, RP.OdometerEndReading,  RD.RoutePlanId, RD.RouteId, RD.RoutePlan_Line, RD.Route, RD.Location, RD.OrderNo, RD.Departure,RD.Arrival,RD.CustomerName,RD.CustomerSignature from RoutePlan as RP join RouteDetails as RD where RD.RouteId=? and RP.RoutePlanId=RD.RoutePlanId";
		var params = [routeId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					var list = [];
					list.push(result.rows.item(0));
					callBackFunction(list);
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	syncAppData: function (callBackFunction) {

		var sql = "Select * from SyncDetails where HeaderStatusFlag LIKE '0%' OR InTransferFlag='0' OR ArrDepFlag='0' OR LineStatusFlag LIKE '0%' order by RoutePlanId,RouteId";
		var HDFLAG, ArrDepFlag, LSFLAG, InTransferFlag;
		this.executeQuery(sql, [], function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					var count = 0;

					function updateSync(ResultObj) {
						HDFLAG = ResultObj.HeaderStatusFlag;
						ArrDepFlag = ResultObj.ArrDepFlag;
						LSFLAG = ResultObj.LineStatusFlag;
						InTFlag = ResultObj.InTransferFlag;
						// alert(HDFLAG + " " + InTFlag + " " + ArrDepFlag + " " + LSFLAG);
						dbQueries.getArrDepData(ResultObj.RouteId, function (dataObj) {
							dbQueries.updateHD(HDFLAG, dataObj, function () {
								dbQueries.updateTF(InTFlag, dataObj, ResultObj, function () {
									dbQueries.updateAD(ArrDepFlag, dataObj, function () {
										dbQueries.updateLS(LSFLAG, dataObj, function () {
											count++;
											// alert(count + " " + result.rows.length);
											if (count < result.rows.length) {
												updateSync(result.rows.item(count));
											} else {
												callBackFunction();
											}
										});
									});
								});
							});
						});
					}
					if (result.rows.length > 0) {
						updateSync(result.rows.item(count));
					} else {
						callBackFunction();
					}
					break;

				case Result.FAILURE:
					$("#popupLoaderSyncApp").popup("close");
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	updateHD: function (HDFLAG, dataArr, callBackFunction) {
		if (HDFLAG == '0' || HDFLAG == '00') {
			var statusHDFlag = (HDFLAG == '00') ? '5' : '4'; // sends the route completed code 5 if second RSC (00) is completed
			SapData.updateRoutePlanHeaderStatus(dataArr, statusHDFlag, function () {
				callBackFunction();
			});
		} else {
			callBackFunction();
		}
	},

	updateTF: function (InTFlag, dataArr, ResultObj, callBackFunction) {
		if (InTFlag == '0') {
			dbQueries.getInTransferData(dataArr[0].RoutePlanId, dataArr[0].OrderNo, function (dataObjArr) {
				console.log(dataObjArr);
				SapData.updateInTransfer(dataArr[0].CustomerName, dataArr[0].CustomerSignature, dataArr[0].RoutePlan_Line, dataArr[0].OrderNo, dataObjArr, function () {
					callBackFunction();
				});
			});
		} else {
			callBackFunction();
		}
	},

	updateAD: function (ArrDepFlag, dataArr, callBackFunction) {
		if (ArrDepFlag == '0') {
			SapData.updateArrivalDeparture(dataArr, function () {
				callBackFunction();
			});
		} else {
			callBackFunction();
		}
	},

	updateLS: function (LSFLAG, dataArr, callBackFunction) {
		if (LSFLAG == '0' || LSFLAG == '00') {
			var statusLSFlag = (LSFLAG == '00') ? '4' : '5';
			SapData.updateRoutePlanLineStatus(dataArr, statusLSFlag, function () {
				callBackFunction();
			});
		} else {
			callBackFunction();
		}
	},

	getDeliveryItemBySerial: function (serialNo, callBackFunction) {
		var sql = "select * from Inventory where SerialNo = ? and  InventoryType = 'T'";
		var params = [serialNo];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					if (result.rows.length > 0) {
						callBackFunction(result.rows.item(0));
					} else {
						callBackFunction(null);
					}
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	checkForDelete: function (routePlanId, callBackFunction) {
		// var sql = "Select * from SyncDetails where HeaderStatusFlag LIKE '0%' OR InTransferFlag='0' OR ArrDepFlag='0' OR LineStatusFlag LIKE '0%' and RoutePlanId=?";
		var sql = "Select * from SyncDetails where HeaderStatusFlag = '1' AND InTransferFlag='X' AND ArrDepFlag='1' AND LineStatusFlag = '1' AND Route = 'RSC' AND RoutePlanId=?";
		var params = [routePlanId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					// check if both RSC is completed
					if (result.rows.length == 2) {
						callBackFunction("true");
					} else {
						callBackFunction("false");
					}
					break;
				case Result.FAILURE:
					$("#popupLoaderSyncApp").popup("close");
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	deleteRoute: function (routePlanId) {
		var INSql = "delete from Inventory where RoutePlanId='" + routePlanId + "' and InventoryType='C'";
		var DLPUSql = "delete from DeliveryPickup where OrderNo IN (Select OrderNo from RouteDetails where RoutePlanId='" + routePlanId + "')";
		var RDSql = "delete from RouteDetails where RoutePlanId='" + routePlanId + "'";
		var RPSql = "delete from RoutePlan where RoutePlanId='" + routePlanId + "'";
		var SyncDetailsSql = "delete from SyncDetails where RoutePlanId='" + routePlanId + "'";
		IKMobileDB.db.transaction(
			function (tx) {
				tx.executeSql(INSql, deleteSuccess('Inventory'), deleteFail);
				tx.executeSql(DLPUSql, deleteSuccess('Delivery Pickup Items'), deleteFail);
				tx.executeSql(RDSql, deleteSuccess('Route Details'), deleteFail);
				tx.executeSql(RPSql, deleteSuccess('Route Plan'), deleteFail);
				tx.executeSql(SyncDetailsSql, syncDetailsDeleteSuccess('Sync Details'), deleteFail);
			});

		function deleteSuccess(subjectTable) {
			// will this give the enough time?
			setTimeout(function () {
				console.log(subjectTable + " for " + routePlanId + " DELETED");
			}, 500);
		}

		function syncDetailsDeleteSuccess(subjectTable) {
			console.log(subjectTable + " for " + routePlanId + " DELETED");
			//Redirect
			localStorage.removeItem(storeObject.selectedRoutePlanId + "DepDate");
			localStorage.removeItem(storeObject.selectedRoutePlanId + "Odometer");
			$("#popupLoaderSyncApp").popup("close");
			ikMobile.displaySelectRouteView();
		}

		function deleteFail(err) {
			// console.log('deleteFail, err.message: ' + err.message);
		}
	},

	// deleteRoute: function (routePlanId) {
	// 	var INSql = "delete from Inventory where RoutePlanId='" + routePlanId + "' and InventoryType='C'";
	// 	var DLPUSql = "delete from DeliveryPickup where OrderNo IN (Select OrderNo from RouteDetails where RoutePlanId='" + routePlanId + "')";
	// 	var RDSql = "delete from RouteDetails where RoutePlanId='" + routePlanId + "'";
	// 	var RPSql = "delete from RoutePlan where RoutePlanId='" + routePlanId + "'";
	// 	var SyncDetailsSql = "delete from SyncDetails where RoutePlanId='" + routePlanId + "'";
	// 	IKMobileDB.db.transaction(
	// 		function (tx) {
	// 			tx.executeSql(INSql, function () {}, function () {
	// 				console.log("Inventory for " + routePlanId + " Deleted");
	// 				tx.executeSql(DLPUSql, function () {}, function () {
	// 					console.log("Delivery Pickup Items for " + routePlanId + " Deleted");
	// 					tx.executeSql(RDSql, function () {}, function () {
	// 						console.log("Route Details for " + routePlanId + " Deleted");
	// 						tx.executeSql(RPSql, function () {}, function () {
	// 							console.log("Route Plan " + routePlanId + " Deleted");
	// 							tx.executeSql(SyncDetailsSql, function () {}, function () {
	// 								console.log("Sync Details for " + routePlanId + " Deleted");
	// 								//Redirect
	// 								localStorage.removeItem(storeObject.selectedRoutePlanId + "DepDate");
	// 								localStorage.removeItem(storeObject.selectedRoutePlanId + "Odometer");
	// 								$("#popupLoaderSyncApp").popup("close");
	// 								ikMobile.displaySelectRouteView();
	// 							});
	// 						});
	// 					});
	// 				});
	// 			});
	// 		});
	// },

	getLineNo: function (orderNo, itemId, callBackFunction) {
		var sql = "select LineNo from DeliveryPickup where OrderNo = ? and ItemId = ?";
		var params = [orderNo, itemId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					if (result.rows.length > 0) {
						callBackFunction(result.rows.item(0).LineNo);
					} else {
						callBackFunction(null);
					}
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	isCylinder: function (itemNo, callBackFunction) {
		var sql = "select * from Cylinders where ItemNo = ?";
		var params = [itemNo];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					if (result.rows.length > 0) {
						callBackFunction(true);
					} else {
						callBackFunction(false);
					}
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});

	},

	insertInventoryForPickup: function (data, callBackFunction) {
		var sql = "insert into Inventory (RoutePlanId, ItemId, Item, CommitedQuantity, TotalQuantity, BatchNo, SerialNo, InventoryType, OrderNo, LineNo, Hours, flag, Location, Description) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT Description FROM Inventory WHERE Item = ? and (Description is not null) LIMIT 1))";
		var params = [data.RoutePlanId, data.ItemId, data.Item, data.CommitedQuantity, data.TotalQuantity, data.BatchNo, data.SerialNo, data.InventoryType, data.OrderNo, data.LineNo, data.Hours, data.flag, data.Location, data.Item];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					callBackFunction();
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	deleteInventoryForPickupSerial: function (routePlanId, serialNo, callBackFunction) {
		var sql = "delete from Inventory where SerialNo = ? and InventoryType = 'C' and RoutePlanId = ?";
		var params = [serialNo, routePlanId];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					callBackFunction();
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	getLastUpdatedDate: function (callBackFunction) {
		var sql = "select lastsync from synclog where tablename = 'Inventory'";
		var params = [];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					if (result.rows.length > 0) {
						var str = result.rows.item(0).lastsync;
						var year = str.substr(0, 4);
						var month = str.substr(5, 2);
						var date = str.substr(8, 2);
						var hours = str.substr(11, 2);
						var min = str.substr(14, 2);
						var amOrPm = "";
						if (hours > 12) {
							hours = hours - 12;
							amOrPm = "PM";
						} else if (hours == 12) {
							amOrPm = "PM";
						} else {
							if (hours == 0) {
								hours = 12;
							}
							amOrPm = "AM";
						}
						callBackFunction(month + "/" + date + "/" + year + " " + hours + ":" + min + " " + amOrPm);
					} else {
						callBackFunction("-/-/- -:-");
					}
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	checkUpdate: function (orderNo, callBackFunction) {
		var sql = "Select newlyAdded from DeliveryPickup where OrderNo=? and newlyAdded='Yes'";
		var params = [orderNo];
		this.executeQuery(sql, params, function (result) {
			switch (result.status) {
				case Result.SUCCESS:
					// alert(result.rows.length);
					if (result.rows.length > 0) {
						callBackFunction("Yes");
					} else {
						callBackFunction("No");
					}
					break;
				case Result.FAILURE:
					alert("Err :: " + result.errorMessage);
					break;
			}
		});
	},

	deleteSyncDetails: function () {
		var args = arguments;
		var sql = "Delete from SyncDetails where RouteId=?";
		for (var i in args) {
			var params = [arguments[i]];
			console.log(params);
			this.executeQuery(sql, params, function (result) {

			});
		}
	}
};