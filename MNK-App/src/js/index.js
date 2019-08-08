document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {

	console.log("API Auth:" + storeObject.auth);
	// Clear UserId from localStorage
	$.mobile.hashListeningEnabled = true;
	$.mobile.pushStateEnabled = false;

	// // Hardcoded values for DEV purpose
	// $('#userId').attr('value', 'BALTACAY');
	// $('#pass').attr('value', '2002ATAMpas!!');

	localStorage.removeItem("UserId");

	// Initialize db and create Tables
	IKMobileDB.initialize();

	// Event Handlers
	document.addEventListener("resume", onResume, false);
	document.addEventListener("pause", onPause, false);
	document.addEventListener("online", onDeviceOnline, false);
	document.addEventListener("offline", onDeviceOffline, false);

	//This Event Fire when Keybord Show
	Keyboard.onshow = function () {
		$('#item-serial-no').off("change");
		$('#item-serial-no').on('keypress', function (e) {
			if (e.which == 13 || e.keyCode == 13) {
				console.log("keypress :: item-serial-no");
				ikMobile.serialNoTextHandler();
			}
		});

		$('#item-material-no').off("change");
		$('#item-material-no').on('keypress', function (e) {
			if (e.which == 13 || e.keyCode == 13) {
				console.log("keypress :: item-material-no");
				ikMobile.materialNoTextHandler();
			}
		});

		$('#item-batch-no').off("change");
		$('#item-batch-no').on('keypress', function (e) {
			if (e.which == 13 || e.keyCode == 13) {
				console.log("keypress :: item-batch-no");
				ikMobile.batchNoTextHandler();
			}
		});

	};

	// This Event Fire when keyboard hide
	Keyboard.onhide = function () {
		$('#item-serial-no').off("keypress");
		$('#item-serial-no').on('change', function () {
			console.log("change :: item-serial-no");
			ikMobile.serialNoTextHandler();
		});

		$('#item-material-no').off("keypress");
		$('#item-material-no').on('change', function () {
			console.log("change :: item-material-no");
			ikMobile.materialNoTextHandler();
		});

		$('#item-batch-no').off("keypress");
		$('#item-batch-no').on('change', function () {
			console.log("change :: item-batch-no");
			ikMobile.batchNoTextHandler();
		});
	};

	// Test Code
	// uploadLogFile("cdvfile://localhost/persistent/console.log")
	// End test code here
} // onDeviceReady End Here

function onDeviceOnline() {
	// alert("Device Online");
	console.log("Device Online");
	storeObject.deviceStatus = 'Online';
	if (localStorage.getItem("UserId") != null) {
		//alert("Sync data with SAP");
		syncApp();
	}
}

function onDeviceOffline() {
	//alert("Device Offline");
	console.log("Device Offline");
	storeObject.deviceStatus = 'Offline';
}

function onResume() {
	setTimeout(function () {
		console.log('App Resumed');
		console.log('Connection Type:' + navigator.network.connection.type);

		if (navigator.network.connection.type == Connection.NONE || storeObject.deviceStatus == 'Offline') {
			navigator.notification.alert("Unable to refresh data", function () {}, "Network Down");
			navigator.notification.beep(1);
		} else {
			if (navigator.network.connection.type == Connection.WIFI || navigator.network.connection.type == Connection.CELL_4G) {
				// Fetch new data from oData Services
				if (localStorage.getItem("UserId") == null) {
					console.log('User not logged in');
				} else {
					// Loader
					// $("#sync-text").html("Refreshing...");
					$("#popupLoaderSyncApp").popup().popup("open");

					IKMobileDB.loadData(localStorage.getItem("UserId"), function () {
						// Update Last Sync Date
						ikMobile.showLastUpdatedDate();

						var activePage = $.mobile.activePage[0].id;

						if (activePage == 'select-route-view') {
							//console.log("1 "+activePage);
							ikMobile.displaySelectRouteView();
						} else if (activePage == 'route-plan-overview-view') {
							//console.log("2 "+activePage);
							ikMobile.displayRoutePlanOverview();
							$("#menu-panel-overview").panel("close");
						} else if (activePage == 'details-view') {
							//console.log("3 "+activePage);
							ikMobile.displayRoutePlanDetailView();
							$("#menu-panel-details").panel("close");
							// ikMobile.displayRoutePlanOverview();
						}
						$("#popupLoaderSyncApp").popup().popup("close");
					});
				}
			} else {
				// alert('Connection not good for Sync!');
				console.log('Connection not good for Sync!');
			}
		}
	}, 1000);
}

function onPause() {
	console.log('App moved to background');
}

//File System

function ErrorMessage(errorHeader, errorMessage) {
	navigator.notification.alert(errorMessage, function () {}, errorHeader);
	navigator.notification.beep(1);
}

function b64EncodeUnicode(str) {
	return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
		return String.fromCharCode('0x' + p1);
	}));
}



function toArray(list) {
	return Array.prototype.slice.call(list || [], 0);
}

function sendConsoleLog() {
	IKMobileLogFile.getDBFileName();
}


function syncApp() {
	// Loader
	// $("#sync-text").html("Syncing...");
	$("#popupLoaderSyncApp").popup().popup("open");
	if (navigator.network.connection.type == Connection.NONE || storeObject.deviceStatus == 'Offline') {
		$("#popupLoaderSyncApp").popup("close");
		navigator.notification.alert("Unable to sync data", function () {}, "Network Down");
		//navigator.notification.beep(1);
	} else {
		// Sync App Data with SAP
		dbQueries.syncAppData(function () {
			if (navigator.network.connection.type == Connection.NONE) {
				//Using Old Data
				console.log("No Network Connection! Using Existing Data");
			} else {
				// Load new Data
				IKMobileDB.loadData(localStorage.getItem("UserId"), function () {
					ikMobile.showLastUpdatedDate();
					var activePage = $.mobile.activePage[0].id;
					if (activePage == 'select-route-view') {
						ikMobile.displaySelectRouteView();
					} else if (activePage == 'route-plan-overview-view') {
						ikMobile.displayRoutePlanOverview();
					} else if (activePage == 'details-view') {
						// $( "#menu-panel-details" ).panel( "close" );
						ikMobile.displayRoutePlanDetailView();
						// ikMobile.displayRoutePlanOverview();
					}
					$("#popupLoaderSyncApp").popup().popup("close");
				});
			}
		});
	}
}

function syncRoute(callBackFunction) {
	if (navigator.network.connection.type == Connection.NONE) {
		navigator.notification.alert("Unable to sync data", function () {}, "Network is down here");
		//navigator.notification.beep(1);
	} else {
		dbQueries.syncAppData(function () {
			ikMobile.showLastUpdatedDate();
			callBackFunction();
		});
	}
}


function dateFormat(dt) {
	var year = dt.substring(0, 4);
	var mm = dt.substring(4, 6);
	var date = dt.substring(6, 8);

	var hrs = dt.substring(8, 10);
	var min = dt.substring(10, 12);
	var ampm = "AM";

	if (hrs >= 12) {
		ampm = "PM";
		if (hrs != 12) {
			hrs = "0" + (hrs - 12);
		}
	} else if (hrs == 0) {
		hrs = 12;
	}

	return mm + "/" + date + "/" + year + " " + hrs + ":" + min + " " + ampm;
}

function currDate() {
	var dt = new Date();
	var year = dt.getFullYear();
	var mm = parseInt(dt.getMonth()) + 1;
	var date = dt.getDate();
	var hrs = parseInt(dt.getHours());
	var min = parseInt(dt.getMinutes());
	var sec = parseInt(dt.getSeconds());

	return year + "-" + (('' + mm).length < 2 ? '0' : '') + mm + "-" + (('' + date).length < 2 ? '0' : '') + date + " " + (('' + hrs).length < 2 ? '0' : '') + hrs + ":" + (('' + min).length < 2 ? '0' : '') + min + ":" + (('' + sec).length < 2 ? '0' : '') + sec;
}

function sendDate(dt) {
	var date = dt.substring(0, 10);
	return date;
}

function sendTime(tm) {
	if (tm == null || tm == '') {
		return '';
	} else {
		var hrs = tm.substring(11, 13);
		var min = tm.substring(14, 16);
		var ampm = tm.substring(17, 19);
		if (ampm == "PM") {
			if (hrs != 12)
				hrs = parseInt(hrs) + 12;
		} else {
			if (hrs == 12)
				hrs = "00";
		}
		return hrs + ":" + min + ":00";
	}
}

var orderTypeSelected = 'Delivery';
var fromScreen = "details";
var sigCapture = null;
var detailsViewReadOnly = false;
var defaultSignature = "";

$(function () {

	//Need to remove this statement - DEV purpose
	//onDeviceReady();
	//SapData.loadRoutePlan('');

	$("#popupLoaderSyncApp").enhanceWithin().popup();
	$("#loginpopup").enhanceWithin().popup();

	//Activate signIn-btn and attach click event
	$('#userId, #pass').on('input', function (e) {
		if ($('#userId').val.length && $('#pass').val().length) {
			$("#signIn-btn").addClass('active-btn');
		} else {
			$("#signIn-btn").removeClass('active-btn');
		}
	});

	$("#signIn-btn").on("click", ikMobile.loginHandler);


	$("#login-popup-close-btn").on("click", function () {
		$("#popupDialogEmptyLogin").popup('close');
	});
	$("#mainmenuSignOut").on("click", function () {
		localStorage.removeItem('UserId');
		// make sure input fields are empty
		$('#userId').val('');
		$('#pass').val('');
		//alert("localstorage clear");
	});

	$("#mainmenuSignOutOne").on("click", function () {
		localStorage.removeItem('UserId');
		// make sure input fields are empty
		$('#userId').val('');
		$('#pass').val('');
		//alert("localstorage clear");
	});

	//Attach change event for select-route drop-down
	$("#select-route").on("change", ikMobile.routeChangeHandler);

	// hamburger menu button action
	$('a.menu-btn').on('click', function (e) {
		$(this).toggleClass('close-btn');
	});

	$('.sign-out-link, .exit-page, #sign-out-btn').on('click', function (e) {
		$('a.menu-btn').removeClass('close-btn');
		$("#signIn-btn").removeClass('active-btn');
	});

	//Attach click event for back-btn button in screen Route plan overview 
	$("#route-plan-overview-view .back-btn").on("click", function (event) {
		if (storeObject.showSelectRouteViewScreen == false) {
			event.preventDefault();
		} else {
			ikMobile.displaySelectRouteView();
		}
	});

	$("#departureConfirmBtn").on("click", function () {
		var selectedRoute = storeObject.selectedRoute;
		// alert(selectedRoute);
		if (selectedRoute.orderNumber) {
			if (!(selectedRoute.customerSignature && selectedRoute.customerName)) {
				$("#popupDialogDep").popup("close");
				$("#popupOverlayPleaseSubmitData").popup("open");
				setTimeout(function () {
					$("#popupOverlayPleaseSubmitData").popup("close");
				}, 2000);
				return;
			}
		}
		var routeId = storeObject.selectedRoute.routeId;
		var routePlanId = storeObject.selectedRoutePlanId;
		var dateString = ikMobile.getDateString();
		if (storeObject.selectedRoute.route == "Layover End") {
			dbQueries.updateFlag("Update SyncDetails set ArrDepFlag='0',LineStatusFlag='0' where RouteId='" + (storeObject.selectedRoute.ls_routeId) + "'");
		}
		dbQueries.updateFlag("Update SyncDetails set ArrDepFlag='0',LineStatusFlag='0' where RouteId='" + routeId + "'");
		dbQueries.updateDepartureDate(dateString, routeId, function () {

			// Sync Location with SAP
			syncRoute(function () {});
			syncApp(); //TESTI

			//Select the next route
			storeObject.selectedRoute = null;
			ikMobile.displayRoutePlanOverview();
		});
	});

	$("#arrivalConfirmBtn").on("click", function () {
		var routeId = storeObject.selectedRoute.routeId;
		var routePlanId = storeObject.selectedRoutePlanId;
		var dateString = ikMobile.getDateString();
		if (storeObject.selectedRoute.route == "Layover End") {
			routeId = storeObject.selectedRoute.ls_routeId;
		}
		dbQueries.updateArrivalDate(dateString, routeId, function () {
			// Add Location to SyncDetails Table
			dbQueries.updateSyncFlag(routePlanId, routeId, 'X', '', '', '');
			if (storeObject.selectedRoute.route == "Layover End") {
				dbQueries.updateSyncFlag(routePlanId, storeObject.selectedRoute.routeId, 'X', '', '', '');
			}
			var selectedRoute = storeObject.selectedRoute;
			if (selectedRoute.orderNumber) {
				ikMobile.displayRoutePlanDetailView();
				$.mobile.changePage("#details-view");
			} else {
				ikMobile.displayRoutePlanOverview();
			}
		});
	});

	$("#departureEnterBtn").on("click", function () {
		var routeId = storeObject.selectedRoute.routeId;
		var odoMeterReading = $("#txtOdoMeter").val();
		if (odoMeterReading && odoMeterReading.trim()) {
			//odoMeterReading = odoMeterReading.trim();
			if (/^[0-9]*$/.test(odoMeterReading) == false) {
				$("#txtOdoMeter-error").html("Please enter valid number");
				$("#txtOdoMeter-error").show();
				return;
			} else {
				if (localStorage.getItem(storeObject.selectedRoutePlanId + "Odometer") == null) {
					localStorage.setItem(storeObject.selectedRoutePlanId + "Odometer", odoMeterReading);
					$("#txtOdoMeter-error").hide();
				} else {
					if (parseInt(localStorage.getItem(storeObject.selectedRoutePlanId + "Odometer")) < parseInt(odoMeterReading)) {
						$("#txtOdoMeter-error").hide();
					} else {
						$("#txtOdoMeter-error").html("End Odometer Reading should be more than Start Odometer Reading.");
						$("#txtOdoMeter-error").show();
						return;
					}
				}
			}
		} else {
			$("#txtOdoMeter-error").html("Please enter Odometer Reading");
			$("#txtOdoMeter-error").show();
			return;
		}
		var firstRSC = storeObject.routePlanDetails[0];
		var routePlanId = storeObject.selectedRoutePlanId;
		var dateString = ikMobile.getDateString();
		if (firstRSC.routeId == routeId) {
			//Save in OdometerStartReading and save departure date
			dbQueries.updateDepartureDate(dateString, routeId, function () {
				localStorage.setItem(routePlanId + "DepDate", dateString);
				// Add Location to SyncDetails Table
				dbQueries.updateSyncFlag(routePlanId, routeId, '0', 'X', '0', '00');
				dbQueries.updateFlag("Update Inventory set flag='0' where InventoryType='T'");
				dbQueries.saveOdoMeterStartReading(routePlanId, odoMeterReading, function () {

					// Sync Location with SAP
					syncRoute(function () {});
					syncApp();
					storeObject.selectedRoute = null;
					ikMobile.displayRoutePlanOverview();
				});
			});
		} else {
			//Save in OdometerEndReading and save arrival date
			dbQueries.updateDepartureDate(localStorage.getItem(routePlanId + "DepDate"), routeId, function () {});
			dbQueries.updateArrivalDate(dateString, routeId, function () {

				// Add Location to SyncDetails Table
				dbQueries.updateSyncFlag(routePlanId, routeId, '00', 'X', '0', '0');



				dbQueries.saveOdoMeterEndReading(routePlanId, odoMeterReading, function () {

					$("#popupDialogOdo").bind("popupafterclose", function () {
						$("#popupDialogOdo").unbind("popupafterclose");
						// $("#sync-text").html("Sending...");
						// AFTER FINAL ODO: LOADER
						$("#popupLoaderSyncApp").popup().popup("open"); // THIS SHOULD BE CLOSED LATER ON
					});

					$("#popupDialogOdo").popup("close");
					// Sync Location with SAP


					syncRoute(function () {
						dbQueries.checkForDelete(routePlanId, function (status) {
							if (status == "true") {
								dbQueries.deleteRoute(routePlanId);
								ikMobile.showLastUpdatedDate();

							} else if (status == "false") {
								ikMobile.displayRoutePlanOverview();
								SapData.UpdateError();
							}
						});

					});
					syncApp();
				});
			});
		}
	});

	$("#unCompConfirmBtn").on("click", function () {
		$("#popupDialogUnComp").bind("popupafterclose", function () {
			$("#popupDialogUnComp").unbind("popupafterclose");
			$("#popupDialogOdo").popup("open");
		});

		$("#popupDialogUnComp").popup("close");
	});

	$("#details-view .back-btn").on("click", function () {
		ikMobile.displayRoutePlanOverview();
	});


	$("#popupDialogArv").bind("popupbeforeposition", function () {
		var selectedRoute = storeObject.selectedRoute;
		// alert(selectedRoute);
		if (selectedRoute.name) {
			$("#arrival-info-header").html("Confirm Arrival At");
			$("#arrival-info-location").html(selectedRoute.name);
		} else {
			$("#arrival-info-header").html("Confirm Arrival");
			$("#arrival-info-location").html(" ");
		}
		if (selectedRoute.orderNumber) {
			$("#popupDialogArv").removeClass("popupDialogArv-small");
			$("#popupDialogArv").addClass("popupDialogArv-big");
		} else {
			$("#popupDialogArv").removeClass("popupDialogArv-big");
			$("#popupDialogArv").addClass("popupDialogArv-small");
		}
	});

	$("#txtOdoMeter").bind("focus", function () {
		$("#txtOdoMeter-error").hide();
	});

	$("#popupDialogOdo").bind("popupbeforeposition", function () {
		$("#txtOdoMeter").val('');
		$("#txtOdoMeter-error").hide();
	});

	$("#popupDialogOdo").bind("popupafteropen", function () {
		$("#txtOdoMeter").focus();
	});

	$("#submitBtn").on("click", function () {
		var customerName = $("#customer-name").val().trim().replace(/[^a-z]/gi, '');
		var customerSignature = sigCapture.toString();
		if (!customerName || customerSignature == defaultSignature) {
			$("#popupOverlayCustomerSign").popup("open");
			setTimeout(function () {
				$("#popupOverlayCustomerSign").popup("close");
			}, 2000);
			return;
		}
		ikMobile.routePlanReviewSubmit();
	});

	$("#reviewBtn").on("click", function () {
		$('.signature-message').addClass('visible');
		ikMobile.displayRoutePlanReview();
	});

	$("#edit-btn").on("click", function () {
		$("#edit-btn").hide();
		$("#edit-done-btn").show();
		ikMobile.displayRoutePlanReviewDelivaryDetails(false);
		ikMobile.displayRoutePlanReviewPickupDetails(false);
	});

	$("#edit-done-btn").on("click", function () {
		$("#edit-done-btn").hide();
		$("#edit-btn").show();
		$("#popupDeliveryPickupEditDone").popup().popup("open");
		ikMobile.displayRoutePlanReview();
	});

	//-----------------------------------------------------------------------------------------------------------------
	//Added by Sumit
	$("#scan-title").html(orderTypeSelected);

	$('#item-quantity').keypress(function (e) {
		if ((e.which == 13 || e.keyCode == 13) && $("#item-quantity").val() != "") {
			//ikMobile.updateRoutePlanDetails();
			if (isNaN($("#item-quantity").val()) == true || $("#item-quantity").val().trim() == "") {
				$("#popupOverlayEnterValidNumber").popup("open");
				setTimeout(function () {
					$("#popupOverlayEnterValidNumber").popup("close");
					setTimeout(function () {
						$("#item-quantity").val('');
						$("#item-quantity").focus();
					}, 100);
				}, 2000);
				return;
			}
			if (parseInt($("#item-quantity").val()) <= 0) {
				$("#popupOverlayQtyGreaterThanZero").popup("open");
				setTimeout(function () {
					$("#popupOverlayQtyGreaterThanZero").popup("close");
					setTimeout(function () {
						$("#item-quantity").val('');
						$("#item-quantity").focus();
					}, 100);
				}, 2000);
				return;
			}
			if (orderTypeSelected == "Delivery") {
				ikMobile.validateMaterialBatchNo(storeObject.deliveryInvData);
			}
		}
	});

	$("#ine-btn-delivery").on("click", function () {
		//ikMobile.saveRoutePlanDetails();
		ikMobile.updateDelivery();
	});

	$("#ine-btn-pickup").on("click", function () {
		//ikMobile.saveRoutePlanDetails();
		ikMobile.updatePickup();
	});

	$("#item-hours-div, #item-hours-header").hide();
	storeObject.lastFocus = "serial";
	ikMobile.setFocus();

	//For Display Pickup Tab
	$("#pickup-tab").on("click", function () {
		//update view
		orderTypeSelected = "Pickup";
		if (!detailsViewReadOnly) {
			$("#item-hours").textinput('disable');
			$("#item-hours-div, #item-hours-header, #scan-panel").show();
			$("#details-view").addClass('with-scan-panel');
			$("#scan-title").html(orderTypeSelected);
			$("#item-quantity-div, #item-quantity-header").hide();
			$('#item-serial-no, #item-quantity, #item-hours, #item-material-no, #item-batch-no').val("");

			$("#item-serial-no").focus();
			storeObject.lastFocus = "serial";
		}
	});

	//For Display Delivery Tab
	$("#delivery-tab").on("click", function () {
		//update view
		orderTypeSelected = "Delivery";
		if (!detailsViewReadOnly) {
			$("#item-quantity").show();
			$("#item-quantity").textinput('disable');
			$("#item-quantity-div, #item-quantity-header, #scan-panel").show();
			$("#details-view").addClass('with-scan-panel');
			$("#scan-title").html(orderTypeSelected);
			$("#item-hours-div, #item-hours-header").hide();
			$('#item-serial-no, #item-quantity, #item-material-no, #item-batch-no').val("");
			$("#item-serial-no").focus();
			storeObject.lastFocus = "serial";
		}
	});

	$("#review-view").on("pageshow", function () {
		if (sigCapture == null) {
			sigCapture = new SignatureCapture("signature");
			defaultSignature = sigCapture.toString();
		}
	});

	$('#clear-sign').on("click", function () {
		sigCapture.clear();
	});

	$('#menu-panel-overview').find('div.menu-items').on('click', function () {
		$('.menu-item-active').removeClass('menu-item-active');
		$(this).addClass('menu-item-active');
	});

	$('#menu-panel-details').find('div.menu-items').on('click', function () {
		$('.menu-item-active').removeClass('menu-item-active');
		$(this).addClass('menu-item-active');
	});

	// // tabs
	// $('#details-tabs').tabs("option", "active", 0);

	$('#item-hours').keypress(function (e) {
		if ((e.which == 13 || e.keyCode == 13)) {
			if ($("#item-hours").val().trim() == "") {
				$("#popupOverlayEnterHours").popup("open");
				setTimeout(function () {
					$("#popupOverlayEnterHours").popup("close");
					setTimeout(function () {
						$("#item-hours").val('');
						$("#item-hours").focus();
					}, 100);
				}, 2000);
				return;
			}
			/*if(isNaN($("#item-hours").val()) == true){
	    		$("#popupOverlayEnterValidNumber").popup("open");
	        	setTimeout(function(){
		             $("#popupOverlayEnterValidNumber").popup("close");
		             setTimeout(function(){
		            	 $("#item-hours").val('');
			             $("#item-hours").focus();
		             },100);
		        },2000);
	    		return;
	    	}*/
			var locationCode = storeObject.selectedRoute.location;
			var routePlanId = storeObject.selectedRoutePlanId;
			if (!storeObject.notInInventoryData) {
				if (storeObject.pickupInvData.Location == locationCode && storeObject.pickupInvData.RoutePlanId == routePlanId) {
					ikMobile.validatePickupSerialNo(storeObject.pickupInvData);
				} else {
					var found = false;
					for (var i = 0; i < storeObject.scannedLocations.length; i++) {
						var scannedLocation = storeObject.scannedLocations[i];
						if (scannedLocation.Item == storeObject.pickupInvData.Item && scannedLocation.Location == storeObject.pickupInvData.Location && scannedLocation.OrderNo == storeObject.selectedRoute.orderNumber) {
							found = true;
							break;
						}
					}
					if (found == true) {
						ikMobile.validatePickupSerialNo(storeObject.pickupInvData, 'notAtLocation');
					} else {
						$("#popupDialogINE4-msg").html("Item Not Present In Customer Inventory For The Selected Location " + locationCode + "<br>Add Anyway?");
						$("#popupDialogINE4").removeClass("popupDialogINE4-Small");
						$("#popupDialogINE4").addClass("popupDialogINE3-Big");
						$("#popupDialogINE4").popup("open");
						$('#ine-btn-pickup4').unbind('click');
						$('#ine-btn-pickup4').bind('click', function () {
							$("#popupDialogINE4").bind("popupafterclose", function () {
								$("#popupDialogINE4").unbind("popupafterclose");
								ikMobile.validatePickupSerialNo(storeObject.pickupInvData, 'notAtLocation');
							});
							$("#popupDialogINE4").popup("close");
							storeObject.scannedLocations.push({
								'Item': storeObject.pickupInvData.Item,
								'Location': storeObject.pickupInvData.Location,
								'OrderNo': storeObject.selectedRoute.orderNumber
							});
						});
					}
				}
			} else {
				/*$("#popupDialogINE4-msg").html("Item Not Expected. <br>Add Anyway?");
	    		$("#popupDialogINE4").removeClass("popupDialogINE3-Big");
    			$("#popupDialogINE4").addClass("popupDialogINE4-Small");
	    		$("#popupDialogINE4").popup("open");
	    		$('#ine-btn-pickup4').unbind('click');
	    		$('#ine-btn-pickup4').bind('click',function(){
	    			$("#popupDialogINE4").popup("close");
	    			ikMobile.saveNotExpectedPickupItem();
	    		});*/

				$("#popupDialogINE4").popup("close");
				ikMobile.saveNotExpectedPickupItem();
			}
		}
	});


	// $('body').click(function (e) {
	// 	if ($(e.target).attr('class') == "menu-items menu-item-active") {
	// 		return;
	// 	} else {
	// 		$('.menu-item-active').removeClass('menu-item-active');
	// 	}
	// });

	$('#pu-scroll-indicator, #del-scroll-indicator, #overview-scroll-indicator, #inventory-scroll-indicator, #inv-view-scroll-indicator').hide();
	$('#details-delivery-table, #details-pickup-table, #route-overview-table, #inventory-table-details, #details-inventory-table').on('scroll', chk_scroll);

	//-----------------------------------------------------------------------------------------------------------------

	//Added by Anubhav

	//For display Inventory
	$("#inventoryBtn").on("click", function () {
		//update view
		ikMobile.displayInventory();
	});

	//For Done Button In Display Inventory Screen
	$("#inventoryDoneBtn, #inventoryDoneExitBtn").on("click", function () {
		//show overview page
		ikMobile.displayRoutePlanOverview();
		// $.mobile.changePage("#route-plan-overview-view");
	});

	//For Display Inventory Tab
	$("#inventory-tab").on("click", function () {
		//update view
		orderTypeSelected = "Inventory";
		ikMobile.displayInventoryTab();
		$("#details-view").removeClass('with-scan-panel');

	});

	$("#mainmenuSignOut").on("click", function () {
		$("#popupDialogSgnOut-overview").popup().popup("open");
	});

	$("#mainmenuSignOutOne").on("click", function () {
		$("#popupDialogSgnOut").popup().popup("open");
	});

	$("#review-submitconfirmation-RoutePlanReview").on("click", function () {
		ikMobile.displayRoutePlanOverview();
	});

	//Added by Siddhu
	//Finish Existing Route Plans
	$("#unsub-btnFinishExistingRoutePlans").on("click", function () {
		$("#popupDialogUnsub").popup("close");
		ikMobile.finishExistingRoutePlan();
	});

	//Delete Data Undo Arrival
	$("#unsub-btnDeleteDataUndoArrival").on("click", function () {
		$("#popupDialogUnsub").bind("popupafterclose", function () {
			$("#popupDialogUnsub").unbind("popupafterclose");
			$("#popupDialogUnsubConfirm").popup("open");
		});
		$("#popupDialogUnsub").popup("close");
	});

	//Save Route Plan
	$("#unsubConfirm-btnSaveRoutePlan").on("click", function () {
		syncRoute(function () {});
		syncApp();
		$("#popupDialogUnsubConfirm").popup("close");
		ikMobile.finishExistingRoutePlan();
	});

	// Deletes existing data & undoes arrival
	$("#unsubConfirm-btnDeleteData").on("click", function () {
		ikMobile.navigate(function () {
			var orderNo;
			var routeId;
			var customerSig;
			var selectedRoute;
			var routePlanDetails = storeObject.routePlanDetails;
			for (var i = 1; i < routePlanDetails.length - 1; i++) {
				if (routePlanDetails[i].arrival && !routePlanDetails[i].departure) {
					orderNo = routePlanDetails[i].orderNumber;
					routeId = routePlanDetails[i].routeId;
					customerSig = routePlanDetails[i].customerSignature;
					selectedRoute = routePlanDetails[i];
					break;
				}
			}

			if (!selectedRoute) {
				$("#popupDialogUnsubConfirm").popup("close");
				ikMobile.displayRoutePlanOverview();
				$('a.menu-btn').removeClass('close-btn');
				return;
			}

			if (!customerSig) {
				ikMobile.deleteRecentlyScannedData(selectedRoute, orderNo, function () {
					// alert("608 :: Delete Data Task Completed succesfully.");
					$("#popupDialogUnsubConfirm").bind("popupafterclose", function () {
						$("#popupDialogUnsubConfirm").unbind("popupafterclose");
						$("#popupOverlayDataDeleted").popup().popup("open");
						setTimeout(function () {
							$("#popupOverlayDataDeleted").popup("close");
							ikMobile.displayRoutePlanOverview();
							$('a.menu-btn').removeClass('close-btn');
							storeObject.scannedLocations = [];
						}, 2000);
					});
					$("#popupDialogUnsubConfirm").popup("close");
				});
			} else {
				$("#popupDialogUnsubConfirm").bind("popupafterclose", function () {
					$("#popupDialogUnsubConfirm").unbind("popupafterclose");
					$("#popupOverlayCannotDeleteData").popup().popup("open");
					setTimeout(function () {
						$("#popupOverlayCannotDeleteData").popup("close");
						ikMobile.displayRoutePlanOverview();
						$('a.menu-btn').removeClass('close-btn');
					}, 2000);
				});
				$("#popupDialogUnsubConfirm").popup("close");
			}
		});
	});
	//
	//End by Siddhu

	//For Confirm Delete Popup
	$("#confirmDelete").on("click", function () {
		$("#popupDialogExit").popup("close");
		$("#popupDialogExitConf").popup("open");
	});

	//For Deletion After Confirmation
	$("#confirmedDelete , #confirmedDelete-overview").on("click", function () {
		var orderNo;
		var routeId;
		var customerSig;
		var selectedRoute;
		if (storeObject.selectedRoute && ($(':mobile-pagecontainer').pagecontainer('getActivePage')[0].id == "details-view")) {
			orderNo = storeObject.selectedRoute.orderNumber;
			routeId = storeObject.selectedRoute.routeId;
			customerSig = storeObject.selectedRoute.customerSignature;
			selectedRoute = storeObject.selectedRoute;
		} else {
			var routePlanDetails = storeObject.routePlanDetails;
			for (var i = 1; i < routePlanDetails.length - 1; i++) {
				if (routePlanDetails[i].arrival && !routePlanDetails[i].departure) {
					orderNo = routePlanDetails[i].orderNumber;
					routeId = routePlanDetails[i].routeId;
					customerSig = routePlanDetails[i].customerSignature;
					selectedRoute = routePlanDetails[i];
					break;
				}
			}
		}
		if (!customerSig) {
			ikMobile.deleteRecentlyScannedData(selectedRoute, orderNo, function () {
				//       		alert("643 :: Delete Data Task Completed succesfully.");
				$("#popupDialogExitConf, #popupDialogExitConf-overview").bind("popupafterclose", function () {
					$("#popupDialogExitConf, #popupDialogExitConf-overview").unbind("popupafterclose");
					$("#popupOverlayDataDeleted").popup().popup("open");
					setTimeout(function () {
						$("#popupOverlayDataDeleted").popup("close");
						ikMobile.displayRoutePlanOverview();
						storeObject.scannedLocations = [];
					}, 2000);
				});
				$("#popupDialogExitConf-overview").popup("close");
				$("#popupDialogExitConf").popup().popup("close");
			});
		} else {
			$("#popupDialogExitConf, #popupDialogExitConf-overview").bind("popupafterclose", function () {
				$("#popupDialogExitConf, #popupDialogExitConf-overview").unbind("popupafterclose");
				$("#popupOverlayCannotDeleteData").popup().popup("open");
				setTimeout(function () {
					$("#popupOverlayCannotDeleteData").popup("close");
					ikMobile.displayRoutePlanOverview();
				}, 2000);
			});
			$("#popupDialogExitConf-overview").popup("close");
			$("#popupDialogExitConf").popup("close");
		}

	});

	//For Save button
	$("#save-btn").on("click", function () {
		syncApp();
		ikMobile.displayRoutePlanOverview();
	});

	$("#menu-panel-select-route, #menu-panel-detail-select-route").on("click", function (event) {

		var firstRSC = storeObject.routePlanDetails[0];
		var lastRSC = storeObject.routePlanDetails[storeObject.routePlanDetails.length - 1];

		//First RSC
		if (firstRSC.departure && !lastRSC.arrival) {
			$(this).removeClass('menu-item-active');
			event.preventDefault();
			event.stopImmediatePropagation();
			event.stopPropagation();
			return;
		}

		if (storeObject.routePlans && storeObject.routePlans.length == 1) {
			$(this).removeClass('menu-item-active');

		} else {
			ikMobile.displaySelectRouteView();
		}
	});

	$("#single-route-alert-btn").on("click", function () {
		ikMobile.displaySelectRouteView();
	});

	$("#sync-app-overview").on("click", function () {
		syncApp();
	});

	$("#send-console-log").on("click", function () {
		sendConsoleLog();
	});

	$("#delete-console-log").on("click", function () {
		IKMobileLogFile.clearLogFile();

	});


	$("#sync-app-details").on("click", function () {
		syncApp();
	});

	$("#ine-cancel-btn , #ine-cancel-btn , #ine3-cancel-btn , #ine4-cancel-btn").on("click", function () {
		if (orderTypeSelected == "Delivery") {
			ikMobile.clearScanDataForDelivery();
		} else {
			ikMobile.clearScanDataForPickup();
		}
	});

	$("#reset-form-overview").on("click", function () {
		$("#popupDialogExitConf-overview").popup().popup("open");
	});

	$("#reset-form-details").on("click", function () {
		$("#popupDialogExitConf").popup().popup("open");
	});

	$("#review-view .back-btn, #scan-new-item, #cancelBtn").on("click", function () {
		if (fromScreen == "overview") {
			ikMobile.displayRoutePlanOverview();
		} else {
			ikMobile.displayRoutePlanDetailView();
			$('a.menu-btn').removeClass('close-btn');
			$.mobile.changePage("#details-view");
		}
	});

	$("#item-serial-no").on("click", function () {
		storeObject.lastFocus = "serial";
	});
	$("#item-batch-no").on("click", function () {
		storeObject.lastFocus = "batch";
	});
	$("#item-material-no").on("click", function () {
		storeObject.lastFocus = "material";
	});

	$("#enterbatch-yes").on("click", ikMobile.enterBatchNumberYesBtnHandler);
	$("#enterbatch-no").on("click", ikMobile.enterBatchNumberNoBtnHandler);

});



var ikMobile = {

	loginHandler: function () {
		var user = $('#userId').val().toUpperCase();
		var pass = $('#pass').val();
		var noCredentials = "Username/Password Can't be Empty!";
		var credentialsNotFound = "Username and/or Password not found. Please try again.";

		//Validate user, if user is valid, then call displaySelectRouteView() function
		if (!user || !pass) {
			$("#loginErrorMsg").html(noCredentials);
			$("#popupDialogEmptyLogin").popup("open");
			$("#popupLoaderSyncApp").popup().popup("open");
			return;
		} else {
			dbQueries.checkLogin(user, pass, function (status) {
				$("#loginpopup").popup("open");

				if (status == "True") {
					storeObject.loggedInUser = {
						userId: user
					};
					localStorage.setItem("UserId", user);
					//ikMobile.navigate();
					if (navigator.network.connection.type == Connection.NONE) {
						ikMobile.navigate();
					} else {
						IKMobileDB.loadData(user, function () {
							ikMobile.navigate();
						});
					}
				} else if (status == "False") {
					SapData.CheckLogin(user, pass, function (status) {
						if (status == "Success") {
							storeObject.loggedInUser = {
								userId: user
							};
							IKMobileDB.loadUserDetails(user, pass);

							SapData.loadRoutePlan(user, function () {
								ikMobile.navigate();
							});
						} else if (status == "Failure") {
							$("#loginErrorMsg").html(credentialsNotFound);
							$("#popupDialogEmptyLogin").popup("open");
							//empty user name and password input boxes
							$('#userId').val('');
							$('#pass').val('');
							//deactivate signin button
							$("#signIn-btn").removeClass('active-btn');
						}
					});
					$("#loginpopup").popup("close");
				}
			});
		}
	},

	navigate: function (callback) {
		ikMobile.showLastUpdatedDate();
		var userId = storeObject.loggedInUser.userId;
		dbQueries.getRoutePlans(userId, function (list) {
			storeObject.routePlans = list;
			var counter = 0;
			var found = false;

			function getRouteDetails(routePlanId) {
				dbQueries.getRouteDetails(routePlanId, function (routeList) {
					routeList = ikMobile.mergeLayoverRows(routeList);
					if (routeList && routeList.length > 2) {
						var firstRSC = routeList[0];
						var lastRSC = routeList[routeList.length - 1];
						if (firstRSC.departure && !lastRSC.arrival) {
							found = true;
							storeObject.selectedRoutePlanId = routePlanId;

							if (!callback) {
								$("#loginpopup").bind("popupafterclose", function () {
									$("#loginpopup").unbind("popupafterclose");
									$("#popupDialogUnsub").popup("open");
								});

								$("#loginpopup").popup("close");

							} // callback if end
							else {
								storeObject.routePlanDetails = routeList;
								callback();
							} // call back else end
							return;
						} // if firstRSC.departure && !lastRSC.arrival
						else {
							counter++;
							if (counter < list.length) {
								getRouteDetails(list[counter].routePlanId);
							} // if counter < list.length
							else {
								ikMobile.displaySelectRouteView();
							} // else counter < list.length
						} // else firstRSC.departure && !lastRSC.arrival
					} // if end here (routeList && routeList.length > 2)
				}); // function close dbQueries.getRouteDetails
			} // function end here getRouteDetails
			if (list && list.length > 0) {
				getRouteDetails(list[0].routePlanId);
			} // if end here (list && list.length > 0)
		}); // function here dbQueries.getRoutePlans
	},

	finishExistingRoutePlan: function () {
		ikMobile.displayRoutePlanOverview();
	},

	//This function routeChangeHandler will be called on the change of select-route drop-down value in screen select-route-view
	routeChangeHandler: function () {
		var selectedRoutePlanId = $("#select-route").val();
		storeObject.selectedRoutePlanId = selectedRoutePlanId;
		ikMobile.displayRoutePlanOverview();
	},

	//This function will be used to display drop values in the screen select-route-view 
	displaySelectRouteView: function () {
		var userId = storeObject.loggedInUser.userId;
		dbQueries.getRoutePlans(userId, function (list) {
			if (list == null || list.length == 0) {
				storeObject.showSelectRouteViewScreen = false;
				storeObject.routePlans = [];
				//alert("No Route plans are assigned to you.");
				$("#popupOverlayNoRoutePlanAssigned").popup("open");
				setTimeout(function () {
					$("#popupOverlayNoRoutePlanAssigned").popup("close");
				}, 2000);
				$.mobile.changePage("#login-view");
				return;
			} else if (list.length == 1) {
				storeObject.showSelectRouteViewScreen = false;
				storeObject.selectedRoutePlanId = list[0].routePlanId;
				storeObject.routePlans = list;
				var selectElement = $("#select-route");
				selectElement.empty();
				selectElement.append("<option value='" + list[0].routePlanId + "' class=options>" + list[0].routePlan + "</option>");
				//Redirect to Display Route Plan Overview as user is having only one route
				ikMobile.displayRoutePlanOverview();
			} else {
				//Show select-route-view screen with routes data
				storeObject.showSelectRouteViewScreen = true;
				storeObject.routePlans = list;
				var selectElement = $("#select-route");
				selectElement.empty();
				var htmlString = "<option disabled selected style=display:none;>Select a Route</option>";
				for (var i = 0; i < list.length; i++) {
					htmlString += "<option value='" + list[i].routePlanId + "' class=options>" + list[i].routePlan + "</option>";
				}
				selectElement.html(htmlString).selectmenu().selectmenu('refresh', true);
				$.mobile.changePage("#select-route-view");
			}
		});
	},

	//Display route plan overview
	displayRoutePlanOverview: function () {
		fromScreen = "overview";
		var selectedRoutePlanId = storeObject.selectedRoutePlanId;
		//alert("selectedRoutePlanId is "+selectedRoutePlanId);
		this.displayRoutePlanHeader();
		//SapData.loadRouteDetails('',selectedRoutePlanId,function(){
		// alert("done in callback");
		dbQueries.getRouteDetails(selectedRoutePlanId, function (list) {
			list = ikMobile.mergeLayoverRows(list);
			storeObject.routePlanDetails = list;
			ikMobile.displayRoutePlanList(list);
			if (storeObject.selectedRoute != null) {
				storeObject.selectedRoute = ikMobile.getRoute(storeObject.selectedRoute.routeId);
			}
			ikMobile.updateDepatureArrivalStatus();
			ikMobile.updateRoutePlanOverviewStyles();
			$.mobile.changePage("#route-plan-overview-view");
		});
	},

	displayRoutePlanHeader: function () {
		var selectedRoutePlanId = storeObject.selectedRoutePlanId;
		var loggedInUser = storeObject.loggedInUser.userId;

		dbQueries.getRoutePlanHeader(selectedRoutePlanId, loggedInUser, function (selectedRoutePlan) {
			$("#route-plan-name").html("Route " + selectedRoutePlan.RoutePlan + " Overview");
			$("#route-info-route-name").html(selectedRoutePlan.RouteName);
			$("#route-info-driver-name").html(selectedRoutePlan.DriverName);
			$("#route-info-truck-mobile").html(selectedRoutePlan.TruckMobile);
			$("#route-info-route-number").html(selectedRoutePlan.RoutePlan);
			$("#route-info-comments").html(selectedRoutePlan.Comments);
		});
	},

	displayRoutePlanList: function (list) {
		var routeOverViewTable = $("#route-overview-table");
		routeOverViewTable.empty();
		for (var i = 0; i < list.length; i++) {
			var item = list[i];
			if (i == 0) {
				var firstRSC = item;
				var lastRSC = list[list.length - 1];
				//First RSC
				if ((firstRSC.departure && !lastRSC.arrival) || storeObject.routePlans.length == 1) {
					$("#route-plan-overview-view .back-btn").hide();
					$("#route-overview-table").addClass('taller');
					$("#link-menu-panel-select-route, #link-menu-panel-detail-select-route").addClass("select-route-disable");
					$("#link-menu-panel-select-route, #link-menu-panel-detail-select-route").removeClass("select-route-enable");
					$("#menu-panel-select-route, #menu-panel-detail-select-route").addClass("select-route-disable-link");
				} else {
					$("#route-plan-overview-view .back-btn").show();
					$("#route-overview-table").removeClass('taller');
					$("#link-menu-panel-select-route, #link-menu-panel-detail-select-route").removeClass("select-route-disable");
					$("#link-menu-panel-select-route, #link-menu-panel-detail-select-route").addClass("select-route-enable");
					$("#menu-panel-select-route, #menu-panel-detail-select-route").removeClass("select-route-disable-link");
				}
			}
			var li = $("<li/>");
			$(li).addClass("ui-li-static ui-body-inherit ui-li-has-thumb ui-first-child route-plan-overview-li");
			$(li).bind("click", item, ikMobile.routeSelectedHandler);
			$(li).bind("swipeleft", item, ikMobile.routeSelectedDBLHandler);
			$(li).bind("swiperight", item, ikMobile.resendRouteInfo);
			$(li).attr("id", "route-plan-overview-" + item.routeId);

			var img = $("<span class='status-icon'><img class='route-plan-overview-img' src='./img/blank.png'/></span>");
			$(li).append($(img));

			var cityState = item.city ? item.city + ", " : item.city;
			cityState = cityState + item.state;
			var span = $("<span class='route-plan-overview-route'>" + item.route + "</span>" +
				"<span class='route-plan-overview-location'>" + (item.location ? item.location : '-') + "</span>" +
				"<span class='route-plan-overview-route-name'>" + (item.name ? item.name : '-') + "</span>" +
				"<span class='route-plan-overview-city'>" + (cityState ? cityState : '-') + "</span>" +
				"<span class='route-plan-overview-order'>" + (item.orderNumber ? item.orderNumber : '-') + "</span>" +
				"<span class='route-plan-overview-arrival'>" + (item.arrival ? item.arrival : item.plannedArrival) + "</span>" +
				"<span class='route-plan-overview-departure'>" + (item.departure ? item.departure : item.plannedDeparture) + "</span>" +
				"<span>&nbsp;</span>"
			);
			$(li).append($(span));
			routeOverViewTable.append($(li));
		}
		routeOverViewTable.listview().listview("refresh");
		if (list.length > 3) {
			$('#overview-scroll-indicator').show();
		} else {
			$('#overview-scroll-indicator').hide();
		}
	},

	routeSelectedHandler: function (event) {
		var selectedRoute = event.data;
		storeObject.selectedRoute = selectedRoute;
		ikMobile.updateRoutePlanOverviewStyles();
		ikMobile.updateDepatureArrivalStatus();
	},

	resendRouteInfo: function (event) {
		var selectedRoute = event.data;
		console.log(selectedRoute);
		if (selectedRoute.arrival != '') {
			dbQueries.resetSyncDetails(selectedRoute.routeId, function () {
				syncApp();
				console.log("resync done");
			});
		}

	},

	routeSelectedDBLHandler: function (event) {
		var selectedRoute = event.data;
		storeObject.selectedRoute = selectedRoute;
		ikMobile.updateRoutePlanOverviewStyles();
		ikMobile.updateDepatureArrivalStatus();
		if (selectedRoute.orderNumber) {
			if (selectedRoute.arrival && selectedRoute.departure) {
				ikMobile.displayRoutePlanReview();
				$.mobile.changePage("#review-view");
				$('.signature-message').removeClass('visible');
			} else if (selectedRoute.arrival && !selectedRoute.departure) {
				if (selectedRoute.customerSignature) {
					ikMobile.displayRoutePlanReview();
					$.mobile.changePage("#review-view");
					$('.signature-message').removeClass('visible');
				} else {
					ikMobile.displayRoutePlanDetailView();
					$.mobile.changePage("#details-view");
				}
			} else if (!selectedRoute.arrival && !selectedRoute.departure) {
				ikMobile.displayRoutePlanDetailView(true);
				$.mobile.changePage("#details-view");
			}
		}
	},

	updateDepatureArrivalStatus: function () {
		var selectedRoute = storeObject.selectedRoute;
		if (selectedRoute == null) {
			ikMobile.enableDeparture(false);
			ikMobile.enableArrival(false);
			return;
		}
		var routePlanDetails = storeObject.routePlanDetails;
		var len = routePlanDetails.length;
		var firstRSC = routePlanDetails[0];
		var lastRSC = routePlanDetails[len - 1];
		if (lastRSC.arrival != '') {
			ikMobile.enableDeparture(false);
			ikMobile.enableArrival(false);
			return;
		}

		if (firstRSC.departure == '') {
			if (firstRSC.routeId == selectedRoute.routeId) {
				//Enable Departure button and disable Arrival button
				ikMobile.enableDeparture(true);
				ikMobile.enableArrival(false);
			} else {
				//Disable Departure and Arrival buttons
				ikMobile.enableDeparture(false);
				ikMobile.enableArrival(false);
			}
		} else {
			if (firstRSC.routeId == selectedRoute.routeId) {
				//Disable Departure and Arrival buttons
				ikMobile.enableDeparture(false);
				ikMobile.enableArrival(false);
			} else {
				if (selectedRoute.arrival != '' && selectedRoute.departure == '') {
					//Enable Departure button and disable Arrival button
					ikMobile.enableDeparture(true);
					ikMobile.enableArrival(false);
				} else if (selectedRoute.arrival != '' && selectedRoute.departure != '') {
					//Disble Departure button and disable Arrival button
					ikMobile.enableDeparture(false);
					ikMobile.enableArrival(false);
				} else if (selectedRoute.arrival == '') {
					if (getStatusOfArrival() == true) {
						//disable Departure button and disable Arrival button
						ikMobile.enableDeparture(false);
						ikMobile.enableArrival(false);
					} else {
						//disable Departure button and enable Arrival button
						ikMobile.enableDeparture(false);
						ikMobile.enableArrival(true);
					}
				}
			}
		}

		function getStatusOfArrival() {
			var status = false;
			for (var i = 1; i < len - 1; i++) {
				if (routePlanDetails[i].arrival != '' && routePlanDetails[i].departure == '') {
					status = true;
					return status;
				}
			}
			return status;
		}
	},

	getRoutePlan: function (routePlanId) {
		var routePlans = storeObject.routePlans;
		for (var i = 0; i < routePlans.length; i++) {
			if (routePlanId == routePlans[i].routePlanId) {
				return routePlans[i];
			}
		}
	},

	enableArrival: function (value) {
		if (value == true) {

			$("#arrivalBtn").addClass('active-btn');

			if (storeObject.selectedRoute.route == "RSC") {
				var found = false;
				var list = storeObject.routePlanDetails;
				for (var i = 1; i < list.length - 1; i++) {
					if (list[i].arrival == '' && list[i].departure == '') {
						found = true;
						break;
					}
				}
				if (found == true) {
					$("#arrivalBtn").attr("href", "#popupDialogUnComp");
				} else {
					$("#arrivalBtn").attr("href", "#popupDialogOdo");
				}
			} else {
				$("#arrivalBtn").attr("href", "#popupDialogArv");
			}

		} else {
			$("#arrivalBtn").removeClass('active-btn');
			$("#arrivalBtn").removeAttr("href");
		}
	},

	enableDeparture: function (value) {
		if (value == true) {
			$("#departureBtn").css("background", "#6DC069").addClass('active-btn');
			if (storeObject.selectedRoute.route == "RSC") {
				$("#departureBtn").attr("href", "#popupDialogOdo");
			} else {
				$("#departureBtn").attr("href", "#popupDialogDep");
			}

		} else {
			$("#departureBtn").css("background", "#cfcfd0").removeClass('active-btn');
			$("#departureBtn").removeAttr("href");
		}
	},

	getDateString: function () {
		var date = new Date();
		var hours = date.getHours();
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
		var strDate = date.getDate() > 9 ? date.getDate() : "0" + date.getDate();
		var strMonth = (date.getMonth() + 1) > 9 ? (date.getMonth() + 1) : "0" + (date.getMonth() + 1);
		var strHours = hours > 9 ? hours : "0" + hours;
		var strMinutes = date.getMinutes() > 9 ? date.getMinutes() : "0" + date.getMinutes();

		var dateString = strMonth + "/" + strDate + "/" + date.getFullYear() + " " + strHours + ":" + strMinutes + " " + amOrPm;
		return dateString;
	},

	getRoute: function (routeId) {
		var list = storeObject.routePlanDetails;
		for (var i = 0; i < list.length; i++) {
			if (list[i].routeId == routeId) {
				return list[i];
			}
		}
		return null;
	},

	updateRoutePlanOverviewStyles: function () {
		if ($("#menu-panel-overview").hasClass("ui-panel-open") == true) {
			$('a.menu-btn').addClass('close-btn');
		} else {
			$('a.menu-btn').removeClass('close-btn');
		}
		var routeId = storeObject.selectedRoute ? storeObject.selectedRoute.routeId : '';
		var routePlanDetails = storeObject.routePlanDetails;
		// $("#route-overview-table").find("li").removeClass('completed');
		// $( "#route-overview-table" ).find( "li" ).css( "background-color", "white" );
		for (var i = 0; i < routePlanDetails.length; i++) {
			var routePlan = routePlanDetails[i];
			// alert(routePlan.route); alert(routePlan.departure); alert(routePlan.arrival);
			var htmlRouteId = "#route-plan-overview-" + routePlan.routeId;

			if ((routePlan.routeId != routeId) && (routePlan.departure == '' && routePlan.arrival == '')) {
				$(htmlRouteId).css("background-color", "white");
				$(htmlRouteId).find("img").attr("src", "./img/blank.png");
			}

			if (routePlan.route == 'RSC') {
				if (routePlan.departure != '' || routePlan.arrival != '') {
					$(htmlRouteId).addClass('completed');
					$(htmlRouteId).find("img").attr("src", "./img/ICON_check.png");
				} else if (routePlan.departure === '' || routePlan.arrival === '') {
					$(htmlRouteId).removeClass('completed');
					$(htmlRouteId).find("img").attr("src", "./img/blank.png");
				}
			} else if (routePlan.departure != '' && routePlan.arrival != '') {
				$(htmlRouteId).addClass('completed');
				$(htmlRouteId).find("img").attr("src", "./img/ICON_check.png");
			} else if (routePlan.departure == '' && routePlan.arrival != '') {
				$(htmlRouteId).css("background-color", "rgb(215,213,234)"); // next stop
				$(htmlRouteId).find("img").attr("src", "./img/blank.png");
			}

			if ((routePlan.routeId == routeId) && (routePlan.departure == '')) {
				$(htmlRouteId).css("background-color", "rgb(228,242,209)"); // green - current stop
				$(htmlRouteId).find("img").attr("src", "./img/ICON_arrow.png");
			}



			if (ikMobile.getRoutePlan(storeObject.selectedRoutePlanId).newlyAdded != "Yes") {
				if (routePlan.newlyAdded == "Yes") {
					$(htmlRouteId).find("img").attr("src", "./img/ICON_alert.png");
				}
			}
		}
		ikMobile.highlightNextRoute(routePlanDetails);
		$("#route-overview-table").listview().listview("refresh");
	},

	highlightNextRoute: function (routePlanDetails) {
		if (routePlanDetails && routePlanDetails.length > 0) {
			//Check for First RSC
			var firstRSC = routePlanDetails[0];
			var selectedRouteId = storeObject.selectedRoute ? storeObject.selectedRoute.routeId : '';
			if (firstRSC.departure == '' && firstRSC.arrival == '') {
				var htmlRouteId = "#route-plan-overview-" + firstRSC.routeId;
				if (selectedRouteId == firstRSC.routeId) {
					$(htmlRouteId).css("background-color", "rgb(228,242,209)"); // green - current stop
					// $(htmlRouteId).addClass('active-stop');
					$(htmlRouteId).find("img").attr("src", "./img/ICON_arrow.png");
				} else {
					$(htmlRouteId).css("background-color", "rgb(215,213,234)"); //should be blue next stop
					// $(htmlRouteId).addClass('next-stop');
				}
				return;
			}

			//Check for any open route
			for (var i = 0; i < routePlanDetails.length; i++) {
				if (routePlanDetails[i].departure == '' && routePlanDetails[i].arrival != '') {
					return;
				}
			}

			//Identify next route
			var arrivalDateArr = [];
			var arrivalDateArrDup = [];
			for (var i = 0; i < routePlanDetails.length; i++) {
				var arrivalDate = sendDate(routePlanDetails[i].arrival) + " " + sendTime(routePlanDetails[i].arrival);
				arrivalDateArr.push(arrivalDate.trim());
				arrivalDateArrDup.push(arrivalDate.trim());
			}
			arrivalDateArr.sort();
			var lastUpdated = arrivalDateArr[arrivalDateArr.length - 1];
			var index = arrivalDateArrDup.indexOf(lastUpdated);
			if (routePlanDetails[index].departure != '') {
				var identifiedNextRoute = false;
				var newIndex = index;
				while (!identifiedNextRoute) {
					newIndex = newIndex + 1;
					if (newIndex < routePlanDetails.length) {
						var nextRoute = routePlanDetails[newIndex];
						if (nextRoute.departure == '' && nextRoute.arrival == '') {
							identifiedNextRoute = true;
							var htmlRouteId = "#route-plan-overview-" + nextRoute.routeId;
							if (selectedRouteId == nextRoute.routeId) {
								$(htmlRouteId).css("background-color", "rgb(228,242,209)"); //green
								// $(htmlRouteId).addClass('active-stop');
							} else {
								$(htmlRouteId).css("background-color", "rgb(215,213,234)"); //should be blue next stop
								// $(htmlRouteId).addClass('next-stop');
							}
							break;
						}
					} else {
						identifiedNextRoute = true;
						break;
					}
				}
			}
		}
	},

	//Added By Siddhu
	//Display Route Plan Review
	displayRoutePlanReview: function () {
		this.reviewButtonsShowHide();
		this.displayRoutePlanReviewHeader();
		this.displayRoutePlanReviewPickupDetails(true);
		this.displayRoutePlanReviewDelivaryDetails(true);
	},

	displayRoutePlanReviewHeader: function () {
		var selectedRoutePlanId = storeObject.selectedRoutePlanId;
		var selectedRoutePlan = this.getRoutePlan(selectedRoutePlanId);
		var loggedInUser = storeObject.loggedInUser;
		var selectedRoute = storeObject.selectedRoute;
		var currentDate = this.getCurrentDate();

		$("#review-view .header-text").html(selectedRoutePlanId + " Order Review");

		$("#route-plan-review-date").html(currentDate);
		$("#route-plan-review-route-name").html(selectedRoutePlan.routeName);
		$("#route-plan-review-driver-name").html(selectedRoutePlan.driverName);
		$("#route-plan-review-location").html(selectedRoute.location);
		$("#route-plan-review-name").html(selectedRoute.name);
		$("#route-plan-review-order-no").html(selectedRoute.orderNumber);
		$("#customer-name").val(selectedRoute.customerName ? selectedRoute.customerName : '');
	},

	displayRoutePlanReviewPickupDetails: function (value) {
		var orderNo = storeObject.selectedRoute.orderNumber;
		var orderType = "Pickup";
		var routePlanId = storeObject.selectedRoutePlanId;
		dbQueries.getReviewDetails(orderNo, orderType, routePlanId, function (list) {
			var selectElement = $("#pickup-review-table");
			selectElement.empty();

			for (var i = 0; i < list.length; i++) {
				//Update view here
				$('#pickup-review-table').append('<li class="review-line"><span class="delete-index-' + i + '"></span>' +
					'<span class="item">' + list[i].Item + '</span>' +
					'<span class="description">' + (list[i].Description ? list[i].Description : '') + '</span>' +
					'<span class="batch">' + (list[i].BatchNo ? list[i].BatchNo : '') + '</span>' +
					'<span class="serial">' + (list[i].SerialNo ? list[i].SerialNo : '') + '</span>' +
					'<span class="hours">' + list[i].Hours + '</span><span>&nbsp;</span>' +
					'</li>');

				var imgSpan = $("#pickup-review-table li .delete-index-" + i);
				if (value == false) {
					$(imgSpan).append("<img src=./img/ICON_delete.png  class='delete-icon'/>");
					var routePlanId = storeObject.selectedRoutePlanId;
					var itemDetail = {
						orderNo: orderNo,
						detail: list[i],
						routePlanId: routePlanId
					};
					$(imgSpan).bind("click", itemDetail, ikMobile.deletePickupItemHandler);
				} else {
					$(imgSpan).append("&nbsp;");
				}

				$('#pickup-review-table').trigger("create");
				$('#pickup-review-table').listview("refresh");
				$('#pickup-review-table').slideDown("fast");
			}

			/* Removing this section. Tables will be in full view in review page */
			// if (list.length > 5) {
			// 	$('#details-pickup-table').removeClass('review-list').addClass('review-list-overfolow');
			// }
			// else {
			// 	$('#details-pickup-table').removeClass('review-list-overfolow').addClass('review-list');
			// }
		});
	},

	deletePickupItemHandler: function (event) {
		$("#ItemDeleteConfirmBtn").unbind("click");
		$("#ItemDeleteConfirmBtn").bind("click", event.data, ikMobile.deletePickupItem);
		$("#popupItemDeleteConfirmation").popup().popup("open");
	},

	deletePickupItem: function (event) {
		var orderNo = event.data.orderNo;
		var routePlanId = event.data.routePlanId;
		var itemDetail = event.data.detail;
		var item = itemDetail.Item;
		var orderType = "Pickup";
		var serialNo = itemDetail.SerialNo;
		dbQueries.getPickupItem(orderNo, item, function (pickupItem) {
			var confirmedQty = pickupItem.ConfirmedQty1;
			var updatedQty;
			var qtyToDecreaseInInv = 0;
			var itemId = pickupItem.ItemId;
			if (pickupItem.IsAdded == 'TRUE') {
				if (confirmedQty > 1) {
					if (serialNo) {
						updatedQty = confirmedQty - 1;
						qtyToDecreaseInInv = 1;
						//update
						updateItem(updatedQty, itemId);
					} else {
						//delete
						qtyToDecreaseInInv = confirmedQty;
						deleteItem(itemId);
					}
				} else {
					//delete
					qtyToDecreaseInInv = 1;
					deleteItem(itemId);
				}
			} else {
				if (serialNo) {
					qtyToDecreaseInInv = 1;
					updatedQty = confirmedQty - 1;
				} else {
					qtyToDecreaseInInv = confirmedQty;
					updatedQty = 0;
				}
				//update
				updateItem(updatedQty, itemId);
			}

			function updateItem(qty, itemId) {
				dbQueries.updateDeliveryPickupItemPickup(qty, itemId, function () {
					updateInventory(routePlanId, item, qtyToDecreaseInInv);
				});
			}

			function deleteItem(itemId) {
				dbQueries.deleteDeliveryPickupItemPickup(itemId, function () {
					updateInventory(routePlanId, item, qtyToDecreaseInInv);
				});
			}

			function updateInventory(routePlanId, item, qty) {
				if (serialNo) {
					dbQueries.getInventoryForPickupSerial(routePlanId, serialNo, function (data) {
						if (data.ItemId == data.SerialNo) {
							// Delete this Inv Item
							dbQueries.deleteInventoryForPickupSerial(routePlanId, serialNo, function () {
								$("#popupItemDeleteConfirmation").popup("close");
								ikMobile.displayRoutePlanReviewPickupDetails(false);
							});
						} else {
							var totalQuantity = data.TotalQuantity;
							qty = totalQuantity - qty;
							dbQueries.updateInventoryForPickupSerial(routePlanId, serialNo, qty, function () {
								$("#popupItemDeleteConfirmation").popup("close");
								ikMobile.displayRoutePlanReviewPickupDetails(false);
							});
						}
					});
				} else {
					dbQueries.getInventoryForPickup(routePlanId, item, function (data) {
						var totalQuantity = data.TotalQuantity;
						qty = totalQuantity - qty;
						dbQueries.updateInventoryForPickup(routePlanId, item, qty, function () {
							$("#popupItemDeleteConfirmation").popup("close");
							ikMobile.displayRoutePlanReviewPickupDetails(false);
						});
					});
				}

			}
		});

		/*dbQueries.updatePickupDeliveryItem(itemId,orderNo,orderType,function(result){
			$("#popupItemDeleteConfirmation").popup("close"); 
			ikMobile.displayRoutePlanReviewPickupDetails(false);
		});*/
	},

	displayRoutePlanReviewDelivaryDetails: function (value) {
		var orderNo = storeObject.selectedRoute.orderNumber;
		var orderType = "Delivery";
		var routePlanId = storeObject.selectedRoutePlanId;
		dbQueries.getReviewDetails(orderNo, orderType, routePlanId, function (list) {
			var selectElement = $("#delivery-review-table");
			selectElement.empty();
			for (var i = 0; i < list.length; i++) {
				//Update view here
				selectElement.append('<li class="review-line"><span class="delete-index-' + i + '"></span>' +
					'<span class="item">' + list[i].Item + '</span>' +
					'<span class="description">' + (list[i].Description ? list[i].Description : '') + '</span>' +
					'<span class="batch">' + list[i].BatchNo + '</span>' +
					'<span class="serial">' + list[i].SerialNo + '</span>' +
					'<span class="hours">' + list[i].Quantity + '</span><span>&nbsp;</span>' +
					'</li>');

				var imgSpan = $("#delivery-review-table li .delete-index-" + i);
				if (value == false) {
					$(imgSpan).append("<img src=./img/ICON_delete.png class='delete-icon'/>");
					var routePlanId = storeObject.selectedRoutePlanId;
					var itemDetail = {
						orderNo: orderNo,
						detail: list[i],
						routePlanId: routePlanId
					};
					$(imgSpan).bind("click", itemDetail, ikMobile.deleteDeliverItemHandler);
				} else {
					$(imgSpan).append("&nbsp;");
				}

				$('#delivery-review-table').trigger("create");
				$('#delivery-review-table').listview("refresh");
				$('#delivery-review-table').slideDown("fast");
			}
			if (list.length > 3) {
				$('#details-delivery-table').removeClass('review-list').addClass('review-list-overfolow');
			}
			else {
				$('#details-delivery-table').removeClass('review-list-overfolow').addClass('review-list');
			}
		});
	},

	deleteDeliverItemHandler: function (event) {
		$("#ItemDeleteConfirmBtn").unbind("click");
		$("#ItemDeleteConfirmBtn").bind("click", event.data, ikMobile.deleteDeliverItem);
		$("#popupItemDeleteConfirmation").popup().popup("open");
	},

	deleteDeliverItem: function (event) {
		var orderNo = event.data.orderNo;
		var routePlanId = event.data.routePlanId;
		var itemDetail = event.data.detail;
		var item = itemDetail.Item;
		var orderType = "Delivery";
		var serialNo = itemDetail.SerialNo;
		dbQueries.getDeliveryItem(orderNo, item, function (deliveryItem) {
			var confirmedQty = deliveryItem.ConfirmedQty;
			var updatedQty;
			var qtyToDecreaseInInv = 0;
			var itemId = deliveryItem.ItemId;
			if (itemId == item) {
				deleteItem(itemId);
			} else if (deliveryItem.IsAdded == 'TRUE') {
				if (serialNo) {
					if (confirmedQty > 1) {
						updatedQty = confirmedQty - 1;
						qtyToDecreaseInInv = 1;
						//update
						updateItem(updatedQty, itemId);
					} else {
						//delete
						qtyToDecreaseInInv = 1;
						deleteItem(itemId);
					}
				} else {
					//delete
					qtyToDecreaseInInv = confirmedQty;
					deleteItem(itemId);
				}

			} else {
				if (serialNo) {
					qtyToDecreaseInInv = 1;
					updatedQty = confirmedQty - 1;
				} else {
					qtyToDecreaseInInv = confirmedQty;
					updatedQty = 0;
				}
				//update
				updateItem(updatedQty, itemId);
			}

			function updateItem(qty, itemId) {
				dbQueries.updateDeliveryPickupItemDelivery(qty, itemId, function () {
					updateInventory(routePlanId, item, qtyToDecreaseInInv);

				});
			}

			function deleteItem(itemId) {
				dbQueries.deleteDeliveryPickupItemDelivery(itemId, function () {
					updateInventory(routePlanId, item, qtyToDecreaseInInv);
				});
			}

			function updateInventory(routePlanId, item, qty) {
				if (serialNo) {
					dbQueries.getInventoryForDeliverySerial(routePlanId, serialNo, function (data) {
						var totalQuantity = data.TotalQuantity;
						qty = totalQuantity - qty;
						dbQueries.updateInventoryForDeliverySerial(routePlanId, serialNo, qty, function () {
							$("#popupItemDeleteConfirmation").popup("close");
							ikMobile.displayRoutePlanReviewDelivaryDetails(false);
						});
					});
				} else {
					dbQueries.getInventoryForDelivery(routePlanId, item, function (data) {
						var totalQuantity = data.TotalQuantity;
						qty = totalQuantity - qty;
						dbQueries.updateInventoryForDelivery(routePlanId, item, qty, function () {
							$("#popupItemDeleteConfirmation").popup("close");
							ikMobile.displayRoutePlanReviewDelivaryDetails(false);
						});
					});
				}

			}
		});
		/*dbQueries.updatePickupDeliveryItem(itemId,orderNo,orderType,function(result){
			$("#popupItemDeleteConfirmation").popup("close");	 
			ikMobile.displayRoutePlanReviewDelivaryDetails(false);
		});*/
	},

	routePlanReviewSubmit: function () {
		var customerSignature = sigCapture.toString();
		var customerName = $("#customer-name").val().replace(/[^a-z]/gi, '');
		var routePlanId = storeObject.selectedRoutePlanId;
		var orderNo = storeObject.selectedRoute.orderNumber;
		var selectedRoutePlan = this.getRoutePlan(routePlanId);
		var routeId = storeObject.selectedRoute.routeId;
		var routeplanline = storeObject.selectedRoute.RoutePlan_Line;

		// Add Location to SyncDetails Table
		dbQueries.updateSyncFlag(routePlanId, routeId, 'X', '0', '', '');
		dbQueries.updateSignature(customerSignature, customerName, routePlanId, orderNo, function (result) {

			storeObject.scannedLocations = [];

			// Sync Location with SAP
			syncRoute(function () {});
			syncApp();

			$.mobile.changePage("#review-view-submit-confirmation");
			$("#route-plan-review-confirmation-header-text").html(storeObject.selectedRoute.name + " Delivery/Pickup Summary Successfully Submitted!");
		});
	},

	getCurrentDate: function () {
		var date = new Date();

		var month = new Array(12);
		month[0] = "January";
		month[1] = "February";
		month[2] = "March";
		month[3] = "April";
		month[4] = "May";
		month[5] = "June";
		month[6] = "July";
		month[7] = "August";
		month[8] = "September";
		month[9] = "October";
		month[10] = "November";
		month[11] = "December";

		var dateString = month[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
		return dateString;
	},
	//End by Siddhu

	//Code added by Sumit
	//Details view - display details for Delivery, Pickup and Header
	displayRoutePlanDetailView: function (readOnly) {
		fromScreen = "details";
		detailsViewReadOnly = readOnly;
		ikMobile.displayRoutePlanDetailHeader();
		ikMobile.displayRoutePlanDetailPickup();
		ikMobile.displayRoutePlanDetailDelivary();
		ikMobile.displayInventoryTab();
		try {
			if (orderTypeSelected == "Delivery") {
				ikMobile.clearScanDataForDelivery();
			} else {
				ikMobile.clearScanDataForPickup();
			}
		} catch (e) {
			// Will get error if the page is not loaded and try to access text inputs
		}
		if (readOnly) {
			ikMobile.disableScanPanel();
		} else {
			ikMobile.enableScanPanel();
		}
		if ($("#menu-panel-details").hasClass("ui-panel-open") == true) {
			$('a.menu-btn').addClass('close-btn');
			// alert("OPEN");
		} else {
			// alert("CLOSED");
			$('a.menu-btn').removeClass('close-btn');
		}
	},

	//display route plan header details here
	displayRoutePlanDetailHeader: function () {
		var selectedRoutePlanId = storeObject.selectedRoutePlanId;
		var selectedRoutePlan = this.getRoutePlan(selectedRoutePlanId);
		var loggedInUser = storeObject.loggedInUser;
		var selectedRoute = storeObject.selectedRoute;
		$("#route-plan-detail-location").html(selectedRoute.location);
		$("#route-plan-detail-name").html(selectedRoute.name);
		$("#route-plan-detail-orderno").html(selectedRoute.orderNumber);
		$("#details-comments").html(selectedRoute.specialInstructions);
		$("#details-view .back-link-label").html("Back to route " + selectedRoutePlanId + " overview");
	},

	//display route plan pickup details here
	displayRoutePlanDetailPickup: function () {
		var orderNo = storeObject.selectedRoute.orderNumber;
		dbQueries.getPickupDetails(orderNo, function (list) {
			dbQueries.getPickupComments(orderNo, function (commentslist) {
				function getComments(item) {
					if (commentslist) {
						var finalComment = "";
						var commentStr = "";
						for (var i = 0; i < commentslist.length; i++) {
							if (commentslist[i].Item == item) {
								if (commentslist[i].PickupComments) {
									commentStr += "<li>Serial # " + commentslist[i].PickupComments + "</li>";
								}
							}
						}
						if (commentStr != "") {
							commentStr = commentStr.substring(0, commentStr.length - 2);
							finalComment = "<div class='instruction'>Please pick-up the following serial numbers. Listed items MUST be picked</div><div class='instruction'>before leaving location:</span> <ul class='comment-list'>" + commentStr + "</ul>";
						}
						return finalComment;
					}
					return "";
				}

				$('#details-pickup-table').empty();
				var details_item_collapsible;
				var details_desc_collapsible;
				var details_expQty_collapsible;
				var details_cnfQty_collapsible;
				var details_item;
				var details_desc;
				var details_expQty;
				var details_cnfQty;
				if (detailsViewReadOnly) {
					details_item_collapsible = 'details-item-collapsible';
					details_desc_collapsible = 'details-desc-collapsible-ext';
					details_expQty_collapsible = 'details-expQty-collapsible-ext';
					details_cnfQty_collapsible = 'details-cnfQty-collapsible-ext';
					details_item = 'details-inv-item';
					details_desc = 'details-inv-desc';
					details_expQty = 'details-inv-expQty';
					details_cnfQty = 'details-inv-cnfQty';
				} else {
					details_item_collapsible = 'details-item-collapsible';
					details_desc_collapsible = 'details-desc-collapsible';
					details_expQty_collapsible = 'details-expQty-collapsible';
					details_cnfQty_collapsible = 'details-cnfQty-collapsible';
					details_item = 'details-item';
					details_desc = 'details-desc';
					details_expQty = 'details-expQty';
					details_cnfQty = 'details-cnfQty';
				}
				for (var i = 0; i < list.length; i++) {
					//Update pickup listview here
					var id = "order-detail-pick-" + list[i].Item;
					var comment = getComments(list[i].Item);
					if (comment != null && comment != "") {
						$('#details-pickup-table').append('<li data-role="collapsible" id=' + id +
							'><h6><span class="ui-nodisc-icon"></span>' +
							'<span class=' + details_item_collapsible + '>' + list[i].Item + '</span>' +
							'<span class=' + details_desc_collapsible + '>' + (list[i].Description ? list[i].Description : '') + '</span>' +
							'<span class=' + details_expQty_collapsible + '>' + list[i].ExpectedQty + '</span>' +
							'<span class=' + details_cnfQty_collapsible + '>' + list[i].ConfirmedQty + '</span><span>&nbsp;</span>' +
							'</h6>' + comment + '</li>');
					} else {
						$('#details-pickup-table').append('<li id=' + id +
							'><span>&nbsp;</span><span class=' + details_item + '>' + list[i].Item + '</span>' +
							'<span class=' + details_desc + '>' + (list[i].Description ? list[i].Description : '') + '</span>' +
							'<span class=' + details_expQty + '>' + list[i].ExpectedQty + '</span>' +
							'<span class=' + details_cnfQty + '>' + list[i].ConfirmedQty + '</span>' +
							'<span>&nbsp;</span></li>');
					}
					$('#details-pickup-table').trigger("create");
					$('#details-pickup-table').listview("refresh");
					$('#details-pickup-table').slideDown("fast");
				}

				if (list.length > 2) {
					$('#pu-scroll-indicator').show();
				} else {
					$('#pu-scroll-indicator').hide();
				}
			});

		});
	},


	//display route plan delivery details here
	displayRoutePlanDetailDelivary: function () {

		var orderNo = storeObject.selectedRoute.orderNumber;

		dbQueries.getDeliveryDetails(orderNo, function (list) {
			$('#details-delivery-table').empty();
			var details_item;
			var details_desc;
			var details_expQty;
			var details_cnfQty;
			if (detailsViewReadOnly) {
				details_item = 'details-inv-item';
				details_desc = 'details-inv-desc';
				details_expQty = 'details-inv-expQty';
				details_cnfQty = 'details-inv-cnfQty';
			} else {
				details_item = 'details-item';
				details_desc = 'details-desc';
				details_expQty = 'details-expQty';
				details_cnfQty = 'details-cnfQty';
			}
			for (var i = 0; i < list.length; i++) {
				//Update delivery listview here
				var id = "order-detail-del-" + list[i].Item;
				$('#details-delivery-table').append('<li id="' + id + '" data-material="' + list[i].Item + //added data-material to sync the inventory tab availability check
					'"><span>&nbsp;</span><span class=' + details_item + '>' + list[i].Item + '</span>' +
					'<span class=' + details_desc + '>' + (list[i].Description ? list[i].Description : '') + '</span>' +
					'<span class=' + details_expQty + '>' + list[i].ExpectedQty + '</span>' +
					'<span class=' + details_cnfQty + '>' + list[i].ConfirmedQty + '</span>' +
					'<span class="delivery" data-delivery="' + (list[i].ExpectedQty - list[i].ConfirmedQty) + '">&nbsp;</span>' + // if expected quantity more than confirmed must deliver, else depends on item availability
					'</li>');
				$('#details-delivery-table').trigger("create");
				$('#details-delivery-table').listview("refresh");
				$('#details-delivery-table').slideDown("fast");
				// $('#details-delivery-table li:nth-child(even)').addClass('alternate');
			}
			if (list.length > 2) {
				$('#del-scroll-indicator').show();
			} else {
				$('#del-scroll-indicator').hide();
			}
		});
	},

	//display scanned item details here
	displayScanItemDetails: function (type, value) {
		var routePlanId = storeObject.selectedRoutePlanId;
		storeObject.deliveryInvData = null;
		dbQueries.getInventory(type, value, routePlanId, function (inventoryDetails) {
			if (inventoryDetails != null && inventoryDetails.length > 0) {
				//Populate material number, batch number and enable quantity
				var detail = inventoryDetails[0];

				$("#item-serial-no , #item-material-no, #item-batch-no , #item-quantity").val("");
				if (type == "serial") {
					$("#item-serial-no").val(detail.SerialNo);
					$("#item-material-no").val(detail.Item);
					$("#item-batch-no").val(detail.BatchNo);
					$("#item-quantity").textinput().textinput("disable");
					$("#item-hours-header , #item-hours-div").hide();
					ikMobile.validateSerialNo(detail);
				} else if (type == "batch") {
					if (inventoryDetails.length == 1) {
						$("#item-material-no").val(detail.Item);
						$("#item-batch-no").val(detail.BatchNo);
						$("#item-quantity").textinput().textinput("enable");
						$("#item-quantity").focus();
						$("#item-hours-header , #item-hours-div").hide();
						storeObject.deliveryInvData = detail;
					}
				} else if (type == "material") {
					if (inventoryDetails.length == 1) {
						$("#item-material-no").val(detail.Item);
						$("#item-batch-no").val(detail.BatchNo);
						$("#item-quantity").textinput().textinput("enable");
						$("#item-quantity").focus();
						$("#item-hours-header , #item-hours-div").hide();
						storeObject.deliveryInvData = detail;
					}
				}
			} else {
				$("#popupOverlayNoDataFound").popup("open");
				setTimeout(function () {
					$("#popupOverlayNoDataFound").popup("close");
					ikMobile.clearScanDataForDelivery();
				}, 2000);
			}
		});
	},

	validateSerialNo: function (item) {

		if (item.OrderNo != null) {
			//alert("This Item is already delivered");
			$("#popupOverlayItemDelivered").popup("open");
			setTimeout(function () {
				$("#popupOverlayItemDelivered").popup("close");
				ikMobile.clearScanDataForDelivery();
			}, 2000);
		} else {
			var invItemId = item.ItemId;
			var itemName = item.Item;
			var orderNo = storeObject.selectedRoute.orderNumber;
			var totalQuantity = parseInt(item.TotalQuantity);
			var commitedQuantity = parseInt(item.CommitedQuantity);
			var newTotalQuantity = totalQuantity + 1;

			if (commitedQuantity >= newTotalQuantity) {
				dbQueries.getDeliveryItem(orderNo, itemName, function (deliveryData) {
					//layer to prevent reserved items from delivery
					dbQueries.getInventoryDetails(storeObject.selectedRoute.routePlanId, function (list) {
						for (var i = 0; i < list.length; i++) {

							if (list[i].Item === item.Item) {

								var newConfirmedQty;
								if (!deliveryData) {
									storeObject.deliveryData = {
										operation: 'insert',
										item: item,
										newTotalQuantity: newTotalQuantity,
										newConfirmedQty: 1,
										invItemId: invItemId,
										invUpdatedOrderNo: orderNo
									};
									if (list[i].TotalQuantity - list[i].CommitedQty > 0) {
										// if so, check if they really want to deliver
										$("#popupDialogINE2").popup("open");
									} else {
										// else remind driver that remaining items are reserved for other orders
										$("#popupOverlayItemReserved").popup("open");
										setTimeout(function () {
											$("#popupOverlayItemReserved").popup("close");
											ikMobile.clearScanDataForDelivery();
										}, 3000);
									}
								} else {
									newConfirmedQty = parseInt(deliveryData.ConfirmedQty) + 1;
									if (newConfirmedQty > deliveryData.ExpectedQty) {
										storeObject.deliveryData = {
											operation: 'update',
											item: deliveryData,
											newTotalQuantity: newTotalQuantity,
											newConfirmedQty: newConfirmedQty,
											invItemId: invItemId,
											invUpdatedOrderNo: orderNo
										};
										// before this one check if the amount is delivarable
										// we are at the more than expected delivery zone
										// check if there are more items than committed items 
										if (list[i].TotalQuantity - list[i].CommitedQty > 0) {
											// if so, check if they really want to deliver
											$("#popupDialogINE2").popup("open");
										} else {
											// else remind driver that remaining items are reserved for other orders
											$("#popupOverlayItemReserved").popup("open");
											setTimeout(function () {
												$("#popupOverlayItemReserved").popup("close");
												ikMobile.clearScanDataForDelivery();
											}, 3000);
										}

									} else {
										storeObject.deliveryData = {
											operation: 'update',
											item: deliveryData,
											newTotalQuantity: newTotalQuantity,
											newConfirmedQty: newConfirmedQty,
											invItemId: invItemId,
											invUpdatedOrderNo: orderNo
										};
										ikMobile.updateDelivery();
									}
								}

							}
						}
					});

				});
			} else {
				//	alert("Item not in Inventory");
				$("#popupOverlayItemNotInInventory").popup("open");
				setTimeout(function () {
					$("#popupOverlayItemNotInInventory").popup("close");
					ikMobile.clearScanDataForDelivery();
				}, 2000);
			}

		}
	},

	validateMaterialBatchNo: function (item) {
		if (item) {
			var invItemId = item.ItemId;
			var itemName = item.Item;
			var orderNo = storeObject.selectedRoute.orderNumber;
			var totalQuantity = parseInt(item.TotalQuantity);
			var commitedQuantity = parseInt(item.CommitedQuantity);
			var qty = parseInt($('#item-quantity').val());
			var newTotalQuantity = totalQuantity + qty;
			if (commitedQuantity >= newTotalQuantity) {
				dbQueries.getDeliveryItem(orderNo, itemName, function (deliveryData) {

					//layer to prevent reserved items from delivery
					dbQueries.getInventoryDetails(storeObject.selectedRoute.routePlanId, function (list) {
						for (var i = 0; i < list.length; i++) {

							if (list[i].Item === item.Item) {

								var newConfirmedQty;
								if (!deliveryData) {
									storeObject.deliveryData = {
										operation: 'insert',
										item: item,
										newTotalQuantity: newTotalQuantity,
										newConfirmedQty: qty,
										invItemId: invItemId,
										invUpdatedOrderNo: ''
									};
									if (list[i].TotalQuantity - list[i].CommitedQty >= qty) {
										// if so, check if they really want to delivery
										$("#popupDialogINE2").popup("open");
									} else {
										// else remind driver that remaining items are reserved for other orders
										$("#popupOverlayItemReserved").popup("open");
										setTimeout(function () {
											$("#popupOverlayItemReserved").popup("close");
											ikMobile.clearScanDataForDelivery();
										}, 3000);
									}
								} else {

									newConfirmedQty = parseInt(deliveryData.ConfirmedQty) + qty;
									// if (newConfirmedQty > deliveryData.ExpectedQty) {

									// newConfirmedQty = parseInt(deliveryData.ConfirmedQty) + qty;
									if (deliveryData.ExpectedQty >= deliveryData.ConfirmedQty && deliveryData.ExpectedQty < newConfirmedQty) {
										storeObject.deliveryData = {
											operation: 'update',
											item: deliveryData,
											newTotalQuantity: newTotalQuantity,
											newConfirmedQty: newConfirmedQty,
											invItemId: invItemId,
											invUpdatedOrderNo: ''
										};
										// before this one check if the amount is delivarable
										// we are at the more than expected delivery zone
										// check if there are more items than committed items 
										if (list[i].TotalQuantity - list[i].CommitedQty >= qty) {
											// if so, check if they really want to delivery
											$("#popupDialogINE2").popup("open");
										} else {
											// else remind driver that remaining items are reserved for other orders
											$("#popupOverlayItemReserved").popup("open");
											setTimeout(function () {
												$("#popupOverlayItemReserved").popup("close");
												ikMobile.clearScanDataForDelivery();
											}, 3000);
										}
									} else {
										storeObject.deliveryData = {
											operation: 'update',
											item: deliveryData,
											newTotalQuantity: newTotalQuantity,
											newConfirmedQty: newConfirmedQty,
											invItemId: invItemId,
											invUpdatedOrderNo: ''
										};
										ikMobile.updateDelivery();
									}
								}
							}
						}
					});


				});
			} else {
				$("#popupOverlayItemCheckQty").popup("open");
				setTimeout(function () {
					$("#popupOverlayItemCheckQty").popup("close");
					setTimeout(function () {
						$("#item-quantity").val('');
						$("#item-quantity").focus();
					}, 100);
				}, 2000);
			}
		}
	},

	updateDelivery: function () {
		var deliveryData = storeObject.deliveryData;
		if (deliveryData) {
			var operation = deliveryData.operation;
			var confirmedQty = deliveryData.newConfirmedQty;
			var orderNo = storeObject.selectedRoute.orderNumber;
			var itemName = deliveryData.item.Item;
			var totalQty = deliveryData.newTotalQuantity;
			var invItemId = deliveryData.invItemId;
			var itemDesc = deliveryData.item.Description;
			var lineNo = deliveryData.item.LineNo;
			//alert("DEL: "+lineNo);
			var invUpdatedOrderNo = deliveryData.invUpdatedOrderNo;
			storeObject.deliveryInvData = null;
			storeObject.deliveryData = null;
			if (operation == "insert") {
				var data = {
					orderNo: orderNo,
					itemId: invItemId,
					item: itemName,
					itemDesc: itemDesc,
					confirmedQty: confirmedQty
				};
				dbQueries.insertDeliveryData(data, function (updatedLineNo) {
					//alert("DU :: "+updatedLineNo);
					dbQueries.updateTotalQtyForDelivery(totalQty, invUpdatedOrderNo, invItemId, updatedLineNo, function () {
						//									alert("Item added successfully");
						/*$("#popupOverlayItemAdded").popup("open");
						setTimeout(function(){
							 $("#popupOverlayItemAdded").popup("close");
							 ikMobile.displayRoutePlanDetailDelivary();
							 ikMobile.clearScanDataForDelivery();
						},1000);*/

						ikMobile.displayRoutePlanDetailDelivary();
						ikMobile.clearScanDataForDelivery();

					});
				});
			} else if (operation == "update") {

				dbQueries.updateConfirmedQtyForDelivery(confirmedQty, orderNo, itemName, function () {
					dbQueries.updateTotalQtyForDelivery(totalQty, invUpdatedOrderNo, invItemId, lineNo, function () {
						//									alert("Item added successfully");
						/*$("#popupOverlayItemAdded").popup("open");
						setTimeout(function(){
							 $("#popupOverlayItemAdded").popup("close");
						 ikMobile.displayRoutePlanDetailDelivary();
						 ikMobile.clearScanDataForDelivery();
						},1000);*/

						ikMobile.displayRoutePlanDetailDelivary();
						ikMobile.clearScanDataForDelivery();

					});
				});
			}
			$("#popupDialogINE2").popup("close");
		}
	},

	clearScanDataForDelivery: function () {
		storeObject.deliveryInvData = null;
		storeObject.deliveryData = null;
		$("#item-quantity").textinput('disable');
		$("#item-hours-div, #item-hours-header").hide();
		$('#item-serial-no, #item-quantity, #item-material-no, #item-batch-no').val("");

		ikMobile.setFocus();
	},

	displayPickupScanItemDetails: function (type, value) {
		storeObject.notInInventoryData = null;
		var routePlanId = storeObject.selectedRoutePlanId;
		var locationCode = storeObject.selectedRoute.location;
		dbQueries.getPickupInventory(type, value, routePlanId, function (inventoryDetails) {
			if (inventoryDetails != null && inventoryDetails.length > 0) {
				//Populate material number, batch number and enable quantity
				var detail = inventoryDetails[0];
				if (detail.OrderNo) {
					$("#popupOverlayItemPickedUp").popup("open");
					setTimeout(function () {
						$("#popupOverlayItemPickedUp").popup("close");
						ikMobile.clearScanDataForPickup();
					}, 2000);
				} else {
					dbQueries.isCylinder(inventoryDetails[0].Item, function (isCylinder) {
						$("#item-serial-no , #item-material-no, #item-batch-no , #item-quantity, #item-hours").val("");
						if (type == "serial") {
							$("#item-serial-no").val(detail.SerialNo);
							$("#item-material-no").val(detail.Item);
							$("#item-batch-no").val(detail.BatchNo);
							$("#item-qty-header , #item-quantity").hide();
							storeObject.pickupInvData = detail;
							var locationCode = storeObject.selectedRoute.location;
							if (isCylinder) {
								$("#item-hours").textinput().textinput("enable");
								$("#item-hours").focus();
							} else {
								$("#item-hours").textinput().textinput("disable");
								//alert("Loc code :: "+locationCode + " Loc :: " + inventoryDetails[0].Location);
								if (inventoryDetails[0].Location == locationCode && inventoryDetails[0].RoutePlanId == routePlanId) {
									ikMobile.validatePickupSerialNo(storeObject.pickupInvData);
								} else {
									var found = false;
									for (var i = 0; i < storeObject.scannedLocations.length; i++) {
										var scannedLocation = storeObject.scannedLocations[i];
										if (scannedLocation.Item == inventoryDetails[0].Item && scannedLocation.Location == inventoryDetails[0].Location && scannedLocation.OrderNo == storeObject.selectedRoute.orderNumber) {
											found = true;
											break;
										}
									}
									if (found == true) {
										ikMobile.validatePickupSerialNo(storeObject.pickupInvData);
									} else {
										$("#popupDialogINE3-msg").html("Item Not Present In Customer Inventory For The Selected Location " + locationCode + "<br>Add Anyway?");
										$("#popupDialogINE3").removeClass("popupDialogINE3-Small");
										$("#popupDialogINE3").addClass("popupDialogINE3-Big");
										$("#ine-btn-pickup3").unbind("click");
										$("#ine-btn-pickup3").bind("click", function () {
											$("#popupDialogINE3").popup("close");
											ikMobile.validatePickupSerialNo(storeObject.pickupInvData);
										});
										$("#popupDialogINE3").popup("open");
										storeObject.scannedLocations.push({
											'Item': inventoryDetails[0].Item,
											'Location': inventoryDetails[0].Location,
											'OrderNo': storeObject.selectedRoute.orderNumber
										});
									}
								}
							}
						}
					});
				}
			} else {
				var serialNo = $("#item-serial-no").val().toUpperCase();
				//Check whether user scans delivery item 
				dbQueries.getDeliveryItemBySerial(serialNo, function (deliveryItem) {
					if (deliveryItem) {
						//									alert("Please scan items which were part of pick up.");
						$("#popupOverlayWrongItemScan").popup("open");
						setTimeout(function () {
							$("#popupOverlayWrongItemScan").popup("close");
							ikMobile.clearScanDataForPickup();
						}, 2000);

					} else {
						//Item not in customer inventory
						var orderNo = storeObject.selectedRoute.orderNumber;
						dbQueries.getDeliveryPickupItem(orderNo, serialNo, function (data) {
							if (!data) {
								storeObject.notInInventoryData = {
									serialNo: serialNo
								};
								var locationCode = storeObject.selectedRoute.location;
								//$("#popupDialogINE3-msg").html("Item not present in Customer inventory for the selected location "+ locationCode + "<br>Proceed Anyway?");
								$("#popupDialogINE3-msg").html("Item Not Present In Customer Inventory<br>Proceed Anyway?");
								$("#popupDialogINE3").removeClass("popupDialogINE3-Big");
								$("#popupDialogINE3").addClass("popupDialogINE3-Small");
								$("#ine-btn-pickup3").unbind("click");
								$("#ine-btn-pickup3").bind("click", function () {
									$("#popupDialogINE3").popup("close");
									// Please enter material number
									$("#popupOverlayEnterMaterial").popup("open");
									setTimeout(function () {
										$("#popupOverlayEnterMaterial").popup("close");
										setTimeout(function () {
											$("#item-material-no").focus();
										}, 100);
									}, 2000);
								});
								$("#popupDialogINE3").popup("open");

							} else {
								//alert("This Item is already picked up");
								$("#popupOverlayItemPickedUp").popup("open");
								setTimeout(function () {
									$("#popupOverlayItemPickedUp").popup("close");
									ikMobile.clearScanDataForPickup();
								}, 2000);
							}
						});
					}
				});
			}

		});
	},

	validatePickupSerialNo: function (item, addType) {
		if (item.OrderNo != null) {
			//alert("This Item is already picked up");
			$("#popupOverlayItemPickedUp").popup("open");
			setTimeout(function () {
				$("#popupOverlayItemPickedUp").popup("close");
				ikMobile.clearScanDataForPickup();
			}, 2000);
		} else {
			var invItemId = item.ItemId;
			var itemName = item.Item;
			var orderNo = storeObject.selectedRoute.orderNumber;
			var totalQuantity = parseInt(item.TotalQuantity);
			var commitedQuantity = parseInt(item.CommitedQuantity);
			var newTotalQuantity = totalQuantity + 1;
			var serialNo = item.serialNo;
			dbQueries.getPickupItem(orderNo, itemName, function (pickupItem) {
				if (!pickupItem) {
					storeObject.pickupData = {
						operation: 'insert',
						item: item,
						newTotalQuantity: newTotalQuantity,
						newConfirmedQty: 1,
						invItemId: invItemId
					};
					$("#popupDialogINE").popup("open");
					/*if(addType){
						ikMobile.updatePickup();
					}else{
						$("#popupDialogINE").popup("open");
					}*/
				} else {
					var itemId = pickupItem.ItemId;
					newConfirmedQty = parseInt(pickupItem.ConfirmedQty1) + 1;
					/*if(newConfirmedQty == pickupItem.ExpectedQty1 + 1){
						storeObject.pickupData = {operation:'update', item: pickupItem, newTotalQuantity: newTotalQuantity, newConfirmedQty: newConfirmedQty, invItemId: invItemId};
						$("#popupDialogINE").popup("open");
					}else{*/
					storeObject.pickupData = {
						operation: 'update',
						item: pickupItem,
						newTotalQuantity: newTotalQuantity,
						newConfirmedQty: newConfirmedQty,
						invItemId: invItemId
					};
					ikMobile.updatePickup();
					//}
				}
			});
		}
	},

	updatePickup: function () {
		var pickupData = storeObject.pickupData;
		if (pickupData) {
			var operation = pickupData.operation;
			var confirmedQty = pickupData.newConfirmedQty;
			var orderNo = storeObject.selectedRoute.orderNumber;
			var itemName = pickupData.item.Item;
			var totalQty = pickupData.newTotalQuantity;
			var invItemId = pickupData.invItemId;
			var itemDesc = pickupData.item.Description;
			var itemId = pickupData.item.ItemId;
			var lineNo = pickupData.item.LineNo;
			//alert("PU: "+lineNo);
			var hours = $("#item-hours").val();
			storeObject.pickupData = null;
			storeObject.pickupInvData = null;
			if (operation == "insert") {
				var data = {
					orderNo: orderNo,
					itemId: invItemId,
					item: itemName,
					itemDesc: itemDesc,
					confirmedQty: confirmedQty,
					hours: hours
				};
				dbQueries.insertPickupData(data, function (updateLineNo) {
					dbQueries.updateTotalQtyForPickup(totalQty, orderNo, hours, invItemId, updateLineNo, function () {
						ikMobile.clearScanDataForPickup();
						ikMobile.displayRoutePlanDetailPickup();

					});
				});
			} else if (operation == "update") {
				dbQueries.updateConfirmedQtyForPickup(confirmedQty, hours, itemId, function () {
					dbQueries.updateTotalQtyForPickup(totalQty, orderNo, hours, invItemId, lineNo, function () {
						ikMobile.clearScanDataForPickup();
						ikMobile.displayRoutePlanDetailPickup();

					});
				});
			}

			$("#popupDialogINE").popup("close");
		}
	},

	clearScanDataForPickup: function () {
		storeObject.pickupData = null;
		storeObject.pickupInvData = null;
		storeObject.notInInventoryData = null;
		$("#item-hours").textinput('disable');
		$("#item-quantity-div, #item-quantity-header").hide();
		$('#item-serial-no, #item-hours, #item-material-no, #item-batch-no').val("");

		ikMobile.setFocus();
	},

	//update the delivery details for the scanned item here
	updateRoutePlanDetails: function () {
		var orderNo = storeObject.selectedRoute.orderNumber;
		// console.log(orderNo);
		var itemId = storeObject.scannedItem.ItemId;
		// console.log(itemId);
		var availableQty = storeObject.scannedItem.Quantity;
		// console.log(availableQty);
		var askedQty = $("#item-quantity").val();
		// console.log(askedQty);
		if (orderTypeSelected == 'Delivery') {
			var htmlItemId = "order-detail-del-" + itemId;
			// console.log('htmlItemId');
		} else {
			var htmlItemId = "order-detail-pick-" + itemId;
			// console.log('htmlItemId');
		}
		if ($("#" + htmlItemId).length > 0) {
			//alert(storeObject.scannedItem.Item + " : " + htmlItemId + " avl: " + availableQty + " asked: " + askedQty);
			if (orderTypeSelected == 'Delivery') {
				if (availableQty >= askedQty) {
					dbQueries.updateItemDetails(orderNo, itemId, askedQty, function () {
						ikMobile.displayRoutePlanDetailDelivary();
					});
				} else {
					$("#popupDialogCannot").popup("open");
				}
			} else {
				dbQueries.updateItemDetails(orderNo, itemId, askedQty, function () {
					ikMobile.displayRoutePlanDetailPickup();
				});
			}
		} else {
			if (orderTypeSelected == 'Delivery') {
				$("#popupDialogINE2").popup("open");
			} else {
				$("#popupDialogINE").popup("open");
			}
		}
	},


	//insert the newly scanned item (not expected) and save the item
	saveRoutePlanDetails: function () {
		$("#popupDialogINE2").popup("close");
		$("#popupDialogINE").popup("close");
		var orderNo = storeObject.selectedRoute.orderNumber;
		var itemId = storeObject.scannedItem.ItemId;
		var item = storeObject.scannedItem.Item;
		var description = storeObject.scannedItem.Description;
		var availableQty = storeObject.scannedItem.Quantity;
		var askedQty = $("#item-quantity").val();
		var itemDetail = {
			orderNo: orderNo,
			itemId: itemId,
			item: item,
			qty: askedQty,
			description: description,
			type: orderTypeSelected
		};
		if (orderTypeSelected == 'Delivery') {
			if (availableQty >= askedQty) {
				dbQueries.saveItemDetails(itemDetail, function () {
					ikMobile.displayRoutePlanDetailDelivary();
				});
			} else {
				$("#popupDialogCannot").popup("open");
			}
		} else {
			dbQueries.saveItemDetails(itemDetail, function () {
				ikMobile.displayRoutePlanDetailPickup();
			});
		}
	},

	//Display Inventory
	displayInventory: function () {
		$("#inventory-table-details").empty();
		var routePlanId = storeObject.selectedRoutePlanId;
		$("#inventory-page-view .header-text").html("Route " + routePlanId + " Inventory");
		dbQueries.getInventoryDetails(routePlanId, function (list) {
			for (var i = 0; i < list.length; i++) {
				$('#inventory-table-details').append('<li>' +
					'<span>&nbsp;</span>' +
					'<span class="item">' + list[i].Item + '</span>' +
					'<span class="description">' + list[i].Description + '</span>' +
					'<span class="committed">' + ((list[i].CommitedQty) ? list[i].CommitedQty : 0) + '</span>' +
					'<span class="total">' + ((list[i].TotalQuantity) ? list[i].TotalQuantity : 0) + '</span>' +
					'<span>&nbsp;</span>' +
					'</li>');
				$('#inventory-table-details').trigger("create");
				$('#inventory-table-details').listview("refresh");
				$('#inventory-table-details').slideDown("fast");
				// $('#inventory-table-details li:nth-child(even)').addClass('alternate');
			}
			if (list.length > 7) {
				$('#inv-view-scroll-indicator').show();
			}
			// else if (list.length === 0) {
			// 	$('#inventory-table-details').append('<li class="review-line no-items-message">&nbsp;</li>');
			// } 
			else {
				$('#inv-view-scroll-indicator').hide();
			}
		});
		$.mobile.changePage("#inventory-page-view");
	},

	//Display Inventory Tab
	displayInventoryTab: function () {
		if (orderTypeSelected == "Pickup" || orderTypeSelected == "Delivery") {
			$("#scan-panel").show();
		} else {
			$("#scan-panel").hide();
		}
		$("#details-inventory-table").empty();
		var routePlanId = storeObject.selectedRoutePlanId;
		dbQueries.getInventoryDetails(routePlanId, function (list) {
			for (var i = 0; i < list.length; i++) {
				$('#details-inventory-table').append('<li data-material="' + list[i].Item + '">' +
					'<span>&nbsp;</span>' +
					'<span id="inv-item" class="item">' + list[i].Item + '</span>' +
					'<span id="inv-desc" class="description">' + list[i].Description + '</span>' +
					'<span id="inv-expQty" class="committed" data-committed="' + list[i].CommitedQty + '">' + ((list[i].CommitedQty) ? list[i].CommitedQty : 0) + '</span>' +
					'<span id="inv-cnfQty" class="total" data-total="' + list[i].TotalQuantity + '">' + ((list[i].TotalQuantity) ? list[i].TotalQuantity : 0) + '</span>' +
					'<span>&nbsp;</span></li>');
				$('#details-inventory-table').trigger("create");
				$('#details-inventory-table').listview("refresh");
				$('#details-inventory-table').slideDown("fast");
				// $('#details-inventory-table li:nth-child(even)').addClass('alternate');
			}
			if (list.length > 2) {
				$('#inventory-scroll-indicator').show();
			} else {
				$('#inventory-scroll-indicator').hide();
			}
		});
		$.mobile.changePage("#inventory-tab-view");
	},

	reviewButtonsShowHide: function () {
		var customerSignature = storeObject.selectedRoute.customerSignature;
		var arrival = storeObject.selectedRoute.arrival;
		var departure = storeObject.selectedRoute.departure;
		if (customerSignature || (arrival && departure)) {
			$("#cancelBtn").hide();
			$("#submitBtn").hide();
			$("#edit-btn").hide();
			$("#edit-done-btn").hide();
			//$("#customer-name").textinput().textinput("disable");
			$("#customer-name").attr("readonly", true);
			ikMobile.generateSignatureImg(customerSignature);
		} else {
			$("#cancelBtn").show();
			$("#submitBtn").show();
			$("#edit-btn").show();
			$("#edit-done-btn").hide();
			$("#customer-name").textinput().textinput("enable");
			$("#customer-name").attr("readonly", false);
			if (sigCapture) {
				sigCapture.clear();
			}
			$('#sign-input, #clear-sign').show();
			$('#signed-img').hide();
			$("#customer-name").val('');
		}
	},

	setTablesDataToDefault: function (routePlanId, userId) {
		dbQueries.setRouteDetailsToDefault(routePlanId, function (result) {
			dbQueries.deleteIsAddedRowsByRoutePlanId(routePlanId, function (result) {
				dbQueries.setItemDetailsToDefault(routePlanId, function (result) {
					dbQueries.setRoutePlanToDefault(userId, function (result) {

						$("#popupOverlayDataDeleted").popup().popup("open");
						setTimeout(function () {
							$("#popupOverlayDataDeleted").popup("close");
						}, 2000);
					});
				});
			});
		});
	},

	generateSignatureImg: function (signString) {
		var signImg = document.getElementById("sign-img");
		if (signString) {
			signImg.src = "data:image/jpeg;base64," + signString;
		}
		$('#sign-input, #clear-sign').hide();
		$('#signed-img').show();
	},

	//Delete recently Scanned Data
	deleteRecentlyScannedData: function (routeData, orderNo, callBackFunction) {
		var routeId;
		if (!routeData) {
			$("#popupDialogExitConf-overview").popup().popup("close");
			return;
		}
		if (routeData.route == "Layover End") {
			routeId = routeData.ls_routeId;
			dbQueries.deleteSyncDetails(routeData.ls_routeId, routeData.routeId);
		} else {
			routeId = routeData.routeId;
			dbQueries.deleteSyncDetails(routeData.routeId);
		}
		if (!orderNo) {
			dbQueries.updateArrivalToNullByRouteID(routeId, function () {
				callBackFunction();
			});
			return;
		}

		var routePlanId = storeObject.selectedRoutePlanId;

		dbQueries.getBatchMaterialManagedRecords(orderNo, routePlanId, function (dataList) {
			if (dataList && dataList.length > 0) {
				var counter = 0;

				function updateInv(dataList, orderNo, routePlanId) {
					var itemDetail = dataList[counter];
					var item = itemDetail.Item;
					dbQueries.getInventoryForDelivery(routePlanId, item, function (data) {
						var totalQuantity = data.TotalQuantity;
						qty = totalQuantity - itemDetail.ConfirmedQty;

						dbQueries.updateInventoryForDelivery(routePlanId, item, qty, function () {
							counter++;
							if (counter == dataList.length) {
								deleteData(orderNo, routePlanId, routeId);
							} else {
								updateInv(dataList, orderNo, routePlanId);
							}
						});
					});
				}
				updateInv(dataList, orderNo, routePlanId);
			} else {
				deleteData(orderNo, routePlanId, routeId);
			}

			function deleteData(orderNo, routePlanId, routeId) {
				dbQueries.deleteInventoryAddedRows(orderNo, routePlanId, function () {
					dbQueries.deleteAddedRows(orderNo, function () {
						dbQueries.updateConfirmedQtyToNull(orderNo, function () {
							dbQueries.updateInventorySerials(orderNo, routePlanId, function () {
								dbQueries.updateArrivalToNullByRouteID(routeId, function () {
									callBackFunction();
								});
							});
						});
					});
				});
			}

		});

	},

	setFocus: function () {
		setTimeout(function () {
			var lastFocus = storeObject.lastFocus;
			//alert(lastFocus);
			if (lastFocus == 'material') {
				//$('#detials-tabs').focus();
				$("#item-material-no").focus();
			} else if (lastFocus == 'batch') {
				//$('#detials-tabs').focus();
				$("#item-batch-no").focus();
			} else {
				//$('#detials-tabs').focus();
				$("#item-serial-no").focus();
			}
		}, 500);
	},

	serialNoTextHandler: function () {
		var serialNo = $('#item-serial-no').val().toUpperCase();
		if (!serialNo) {
			return;
		}
		if (orderTypeSelected == "Pickup") {
			ikMobile.displayPickupScanItemDetails('serial', serialNo);
		} else {
			ikMobile.displayScanItemDetails('serial', serialNo);
		}
	},

	materialNoTextHandler: function () {
		var materialNo = $('#item-material-no').val().toUpperCase();
		if (!materialNo) {
			return;
		}
		if (orderTypeSelected == "Pickup") {
			if (storeObject.notInInventoryData) {
				dbQueries.isCylinder(materialNo, function (value) {
					if (value == true) {
						//This is cylinder, enter hours
						$("#item-hours").textinput().textinput("enable");
						//Here batch number is optional, but focus is set to the field
						$("#item-batch-no").focus();
					} else {
						//This is device, do you want to enter batch number
						$("#item-hours").textinput().textinput("disable").val("");
						$("#popupDialogEnterBatch").popup("open");
					}
				});
			} else {
				$("#popupOverlayItemScanSerial").popup("open");
				setTimeout(function () {
					$("#popupOverlayItemScanSerial").popup("close");
					ikMobile.clearScanDataForPickup();
				}, 2000);
			}
		} else {
			ikMobile.displayScanItemDetails('material', materialNo);
		}
	},

	batchNoTextHandler: function () {
		var batchNo = $('#item-batch-no').val().toUpperCase();
		if (!batchNo) {
			return;
		}
		if (orderTypeSelected == "Pickup") {
			if (storeObject.notInInventoryData) {
				//Save data
				var arr = $("#item-hours").not(":disabled");
				if (arr) {
					if (arr.length == 0) {
						//hours is disabled
						ikMobile.saveNotExpectedPickupItem();
					} else {
						//hours is enabled
						$("#item-hours").focus();
					}
				} else {
					ikMobile.saveNotExpectedPickupItem();
				}
			} else {
				$("#popupOverlayItemScanSerial").popup("open");
				setTimeout(function () {
					$("#popupOverlayItemScanSerial").popup("close");
					ikMobile.clearScanDataForPickup();
				}, 2000);
			}
		} else {
			ikMobile.displayScanItemDetails('batch', batchNo);
		}
	},

	enterBatchNumberYesBtnHandler: function (e) {
		//Close popup
		$("#popupDialogEnterBatch").popup("close");
		$("#item-batch-no").focus();

	},

	enterBatchNumberNoBtnHandler: function (e) {
		//Save Data
		$("#popupDialogEnterBatch").popup("close");
		ikMobile.saveNotExpectedPickupItem();
	},

	saveNotExpectedPickupItem: function () {
		var serialNo = storeObject.notInInventoryData.serialNo;
		var orderNo = storeObject.selectedRoute.orderNumber;
		var materialNo = $("#item-material-no").val().toUpperCase();
		var batchNo = $("#item-batch-no").val().toUpperCase();
		var hours = $('#item-hours').val();
		var data = {
			orderNo: orderNo,
			itemId: serialNo,
			item: materialNo,
			itemDesc: '',
			confirmedQty: 1,
			hours: hours,
			batchNo: batchNo
		};
		dbQueries.insertPickupData(data, function (updatedLineNo) {
			var invData = new Object();
			invData.RoutePlanId = storeObject.selectedRoutePlanId;
			invData.ItemId = serialNo;
			invData.Item = materialNo;
			invData.CommitedQuantity = 0;
			invData.TotalQuantity = 1;
			invData.BatchNo = batchNo;
			invData.SerialNo = serialNo;
			invData.InventoryType = 'C';
			invData.OrderNo = storeObject.selectedRoute.orderNumber;
			invData.Hours = hours;
			invData.LineNo = updatedLineNo;
			invData.flag = '0';
			invData.Location = storeObject.selectedRoute.location;

			dbQueries.insertInventoryForPickup(invData, function () {
				/*$("#popupOverlayItemAdded").popup("open");
				setTimeout(function(){
					 $("#popupOverlayItemAdded").popup("close");
					 ikMobile.clearScanDataForPickup();
					 ikMobile.displayRoutePlanDetailPickup();
				},1000);*/

				ikMobile.clearScanDataForPickup();
				ikMobile.displayRoutePlanDetailPickup();
			});

		});
	},

	showLastUpdatedDate: function () {
		dbQueries.getLastUpdatedDate(function (value) {
			$(".lastUpdate").html("<span class='update-label'>Last Updated</span><span class='update-time'>" + value + "</span>");
		});
	},
	disableScanPanel: function () {
		$("#scan-panel").hide();
		$("#reviewBtn").hide();
		$(".details-view .menu-btn").hide();
		$("#details-view").removeClass('with-scan-panel');
		$("#exitBtn").off("click");
		$("#exitBtn").removeAttr("href");
		$("#exitBtn").on("click", function () {
			ikMobile.displayRoutePlanOverview();
		});
	},

	enableScanPanel: function () {
		if (orderTypeSelected == "Inventory") {
			$("#scan-panel").hide();
			$("#details-view").removeClass('with-scan-panel');
		} else {
			$('#details-view').addClass('with-scan-panel');
			$("#scan-panel").show();
			// $('.arrow-wrap').css('left', '50%');
			if (orderTypeSelected == "Delivery") {
				try {
					$("#item-quantity").show();
					$("#item-quantity").textinput('disable');
					$("#item-quantity-div, #item-quantity-header, #scan-panel").show();
					$("#scan-title").html(orderTypeSelected);
					$("#item-hours-div, #item-hours-header").hide();
					$('#item-serial-no, #item-quantity, #item-material-no, #item-batch-no').val("");
					$("#item-serial-no").focus();
					storeObject.lastFocus = "serial";
				} catch (e) {
					//Don't do any thing
				}

			} else {
				try {
					$("#item-hours").textinput('disable');
					$("#item-hours-div, #item-hours-header, #scan-panel").show();
					$("#scan-title").html(orderTypeSelected);
					$("#item-quantity-div, #item-quantity-header").hide();
					$('#item-serial-no, #item-quantity, #item-hours, #item-material-no, #item-batch-no').val("");
					$("#item-serial-no").focus();
					storeObject.lastFocus = "serial";
				} catch (e) {
					//Don't do anything
				}
			}
		}
		$("#exitBtn").show();
		$("#reviewBtn").show();
		$(".details-view .menu-btn").show();
		$("#exitBtn").off("click");
		$("#exitBtn").attr("href", "#popupDialogExit");
	},

	mergeLayoverRows: function (list) {
		for (var i = 0; i < list.length; i++) {
			var item = list[i];
			if (item.route == "Layover End") {
				var deletedRoute = list[i - 1];
				if (deletedRoute) {
					var newItem = new Object();
					for (var pro in item) {
						if (pro == "plannedArrival") {
							newItem[pro] = deletedRoute.plannedArrival;
						} else if (pro == "arrival") {
							newItem[pro] = deletedRoute.arrival;
						} else {
							newItem[pro] = item[pro];
						}
					}
					newItem.ls_routeId = deletedRoute.routeId;
					newItem.ls_itemNo = deletedRoute.RoutePlan_Line;
					list[i] = newItem;
				}
				list.splice(i - 1, 1);
			}
		}
		return list;
	}

};

function chk_scroll(e) {
	var elem = $(e.currentTarget);
	if (elem[0].scrollHeight - elem.scrollTop() <= elem.outerHeight()) { //list is scrolled to bottom
		if (e.currentTarget.id == "details-delivery-table") {
			$('#del-scroll-indicator').css('-webkit-transform', 'rotate(180deg)');
		} else if (e.currentTarget.id == "details-pickup-table") {
			$('#pu-scroll-indicator').css('-webkit-transform', 'rotate(180deg)');
		} else if (e.currentTarget.id == "details-inventory-table") {
			$('#inventory-scroll-indicator').css('-webkit-transform', 'rotate(180deg)');
		} else if (e.currentTarget.id == "route-overview-table") {
			$('#overview-scroll-indicator').css('-webkit-transform', 'rotate(180deg)');
		} else if (e.currentTarget.id == "inventory-table-details") {
			$('#inv-view-scroll-indicator').css('-webkit-transform', 'rotate(180deg)');
		}
	} else { //list is scrolled somewhere in the list view or at the top (not at the bottom)
		if (e.currentTarget.id == "details-delivery-table") {
			$('#del-scroll-indicator').css('-webkit-transform', 'rotate(0deg)');
		} else if (e.currentTarget.id == "details-pickup-table") {
			$('#pu-scroll-indicator').css('-webkit-transform', 'rotate(0deg)');
		} else if (e.currentTarget.id == "details-inventory-table") {
			$('#inventory-scroll-indicator').css('-webkit-transform', 'rotate(0deg)');
		} else if (e.currentTarget.id == "route-overview-table") {
			$('#overview-scroll-indicator').css('-webkit-transform', 'rotate(0deg)');
		} else if (e.currentTarget.id == "inventory-table-details") {
			$('#inv-view-scroll-indicator').css('-webkit-transform', 'rotate(0deg)');
		}

	}
}

/* See if input field has value */
function hasValue(elem) {
	return $(elem).filter(function () {
		return $(this).val();
	}).length > 0;
}