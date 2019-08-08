// QA
var mkdBase = "https://ikaw08v765.mkpg.mkglobal.net:44310";
// PROD
// var mkdBase = "https://ikaw09v767.mkpg.mkglobal.net:44320";
 
// Services
var oLoginSrv = mkdBase + "/sap/opu/odata/sap/ZMNK_APP_PROJ_SRV_SRV/";
var oRoutePlanSrv = mkdBase + "/sap/opu/odata/sap/ZMNK_MOBITOR_ROUTEPLANS_SRV/";
 
var oLogin = oLoginSrv + "ET_USER_LOGINSet";
var oRoutePlan = oRoutePlanSrv + "Routeplans?$filter=USER eq ";
var oRouteDetails = oRoutePlanSrv + "Routehdrs?$expand=Routeitm&$filter=USER eq ";
var oDeliveryPickup = oRoutePlanSrv + "Stophdrs?$filter=ROUTEPLAN eq ";
var oInventory = oRoutePlanSrv + "Inventorys?$filter=ROUTEPLAN eq ";
var oUpdateRoutePlan = oRoutePlanSrv + "Routeplanstats";
var oUpdateArrivalDeparture = oRoutePlanSrv + "Arvdeps";
var oInTransfer = oRoutePlanSrv + "Intrnsfr_hs";
