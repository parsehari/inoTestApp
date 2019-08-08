
var storeObject = {
    DBUpdate : 0,
    CSRKey:'',
    deviceStatus:'',
    auth: 'Basic TU9CSV9DT01NOlMzY3VAcmUkMTIz',
    oDataTimeOut: 60000,   // Timeout
    loggedInUser: null,
	showSelectRouteViewScreen: true,
	selectedRoutePlanId: null,
	routePlans:null,
	routePlanDetails:null,
	selectedRoute:null,
	scannedItem:null,
	deliveryInvData:null,
	deliveryData:null,
	pickupData:null,
	pickupInvData:null,
	notInInventoryData:null,
	lastFocus:"serial",
	scannedLocations:[],
}

var IKMobileDB =  {
    
initialize: function()
{
        //alert("Initialize");
    var self = this;
        this.db = window.openDatabase("ikmobiledb", "1.0", "IK Mobile DB", 1024*1024);

    this.db.transaction(
                        function(tx) {
                        tx.executeSql("SELECT name FROM sqlite_master WHERE type='table' AND name='RoutePlan'", this.txErrorHandler,
                                        function(tx, results) {
                                            if (results.rows.length == 1)
                                            {
                                                console.log('Using existing database in local database');
                                            }
                                            else
                                            {
                                                console.log('Tables does not exist in local database');
                                                self.createProfile();
                                                self.createTable();
                                                console.log('Database Created');
                                            }
                                        });
                        });
},
    
dropTable: function() {

    this.db.transaction(
                        function(tx) {
                        tx.executeSql('DROP TABLE IF EXISTS synclog', this.txErrorHandler);
                        tx.executeSql('DROP TABLE IF EXISTS UserDetails', this.txErrorHandler);
                        tx.executeSql('DROP TABLE IF EXISTS RoutePlan', this.txErrorHandler);
                        tx.executeSql('DROP TABLE IF EXISTS RouteDetails', this.txErrorHandler);
                        tx.executeSql('DROP TABLE IF EXISTS Inventory', this.txErrorHandler);
                        tx.executeSql('DROP TABLE IF EXISTS DeliveryPickup', this.txErrorHandler);
                        tx.executeSql('DROP TABLE IF EXISTS Cylinders', this.txErrorHandler);
                        
                        console.log('Table dropped successfully from local database');
                        });
},
    
deleteData: function(callback) {
    this.db.transaction(
                        function(tx) {
                        tx.executeSql('DELETE FROM RoutePlan where flag=""', this.txErrorHandler);
                        tx.executeSql('DELETE FROM RouteDetails where flag=""', this.txErrorHandler);
                        tx.executeSql('DELETE FROM DeliveryPickup where flag is null', this.txErrorHandler);
                        tx.executeSql('DELETE FROM Inventory where flag is null', this.txErrorHandler);
                        
                        console.log('Old Data Deleted from local database');
                        callback();
                        });
},
    
getBackup: function(callback){
    
    this.db.transaction(
                        function(tx) {
                        tx.executeSql('DROP TABLE IF EXISTS RoutePlanBackup', this.txErrorHandler);
                        tx.executeSql('DROP TABLE IF EXISTS RouteDetailsBackup', this.txErrorHandler);
                        tx.executeSql('DROP TABLE IF EXISTS DeliveryPickupBackup', this.txErrorHandler);
                        tx.executeSql('Create temp table RoutePlanBackup as select * from RoutePlan where flag="" and newlyAdded is null', this.txErrorHandler);
                        tx.executeSql('Create temp table RouteDetailsBackup as select * from RouteDetails where flag="" and newlyAdded is null', this.txErrorHandler);
                        tx.executeSql('Create temp table DeliveryPickupBackup as select * from DeliveryPickup where flag is null and newlyAdded is null', this.txErrorHandler);
                        console.log('Backup created');
                        callback();
                        });
    
},
    
createProfile:function(){
    //alert("CREATE PROFILE");
    this.db.transaction(
                        function(tx) {
                        //User Details table
                        var sql = "CREATE TABLE IF NOT EXISTS UserDetails ( UserId TEXT PRIMARY KEY, Password TEXT, LastLogIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP)";
                        tx.executeSql(sql,this.txErrorHandler,function(tx,results){
                                      console.log('UserDetails Table Created');
                                      });
                        });
},
    
createTable: function() {
    //alert("Create");
    this.db.transaction(
                        function(tx) {
                        
                        // Synclog table
                        var sql = "CREATE TABLE IF NOT EXISTS synclog ( tablename TEXT PRIMARY KEY, lastsync TEXT)";
                        tx.executeSql(sql);
                        
                        // RoutePlan Table
                        var sql ="CREATE TABLE IF NOT EXISTS RoutePlan ( RoutePlanId TEXT PRIMARY KEY, RoutePlan TEXT, RouteName TEXT, UserId TEXT, Comments TEXT, OdometerStartReading TEXT, OdometerEndReading TEXT, IsCompleted TEXT, DriverName TEXT, TruckMobile TEXT, flag TEXT, newlyAdded TEXT)";
                        tx.executeSql(sql);
                        
                        // RouteDetails Table
                        var sql ="CREATE TABLE IF NOT EXISTS RouteDetails ( IndexId NUMBER, RoutePlanId TEXT, RouteId TEXT, RoutePlan_Line TEXT, Route TEXT, Location TEXT, Name TEXT, City TEXT, State TEXT, OrderNo TEXT, PlannedDeparture TEXT, PlannedArrival TEXT, Departure TEXT, Arrival TEXT, SpecialInstructions TEXT, CustomerName TEXT, CustomerSignature TEXT, flag TEXT, newlyAdded TEXT, PRIMARY KEY(RouteId, RoutePlan_Line))";
                        tx.executeSql(sql);
                        
                        // Inventory Table
                        var sql ="CREATE TABLE IF NOT EXISTS Inventory ( RoutePlanId TEXT, ItemId TEXT PRIMARY KEY, Item TEXT, Description TEXT, CommitedQuantity NUMBER, TotalQuantity NUMBER, UOM TEXT, BatchNo TEXT, SerialNo TEXT, InventoryType TEXT, OrderNo TEXT, LineNo TEXT, Hours TEXT, flag TEXT, Location TEXT)";
                        tx.executeSql(sql);
                        
                        // DeliveryPickup Table
                        var sql ="CREATE TABLE IF NOT EXISTS DeliveryPickup ( OrderNo TEXT, LineNo TEXT, ItemId TEXT, Item TEXT, Description TEXT, MaterialGrp TEXT, MaterialDesc TEXT, ExpectedQty NUMBER, ConfirmedQty NUMBER, Type TEXT, Hours TEXT, PickupComments TEXT, IsAdded TEXT, flag TEXT, newlyAdded TEXT, PRIMARY KEY(OrderNo,ItemId,Type))";
                        tx.executeSql(sql);
                        
                        // SyncDetails Table
                        var sql ="CREATE TABLE IF NOT EXISTS SyncDetails ( RoutePlanId TEXT, RouteId TEXT PRIMARY KEY, Route TEXT, OrderNo TEXT, HeaderStatusFlag TEXT, InTransferFlag TEXT, ArrDepFlag TEXT, LineStatusFlag TEXT)";
                        tx.executeSql(sql);
                        
                        // Cylinders Table
                        var sql ="CREATE TABLE IF NOT EXISTS Cylinders (ItemId TEXT PRIMARY KEY, ItemNo TEXT)";
                        tx.executeSql(sql);
                        
                        IKMobileDB.loadCylinders();
                        
                        console.log('Tables Created Successfully');
                        });
    //IKMobileDB.loadData("Mac");
},
    
loadData:function(userId,callback){

    IKMobileDB.getBackup(function(){
                         IKMobileDB.deleteData(function(){
                                               SapData.loadRoutePlan(userId,callback);
                                               });
                        });
},
    
baseDataSyncLog: function(tablename){
    //alert("BaseSynclog");
    this.db.transaction(
                        function(tx) {
                          tx.executeSql("INSERT OR REPLACE INTO synclog (tablename,lastsync) VALUES('"+tablename+"','"+currDate()+"')");
                        });
    
},
    
loadUserDetails:function(userId,pass){
    //alert("Loading User Details");
    this.db.transaction(
                        function(tx) {
                        var sql ="INSERT OR REPLACE INTO UserDetails ( UserId, Password) VALUES (?, ?)";
                        
                        var params = [userId,pass];
                        tx.executeSql(sql,params);
                        
                        console.log('UserDetails table Updated');
                        IKMobileDB.baseDataSyncLog('UserDetails');
                        });
},

loadCylinders:function(){

    this.db.transaction(
                        function(tx) {
                        var sql ="INSERT OR REPLACE INTO Cylinders (ItemId, ItemNo) VALUES (?, ?)";
                        
                        var params = ['1',"300-312"];
                        tx.executeSql(sql,params);
                        
                        var params = ['2',"300-312T"];
                        tx.executeSql(sql,params);
                        
                        var params = ['3',"300-302"];
                        tx.executeSql(sql,params);
                        
                        var params = ['4',"300-302T"];
                        tx.executeSql(sql,params);
                        
                        console.log('Cylinders table Updated');
                        });
},
txErrorHandler: function(tx) {
    //navigator.notification.alert(tx.message, function(){}, "Error")
    //navigator.notification.beep(1);
    alert("Error occured in local database");
},
    
txSuccessHandler: function(tx) {
    //alert("Success");
}
    
};

