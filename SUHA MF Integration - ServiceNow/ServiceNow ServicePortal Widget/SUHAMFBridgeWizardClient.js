function($rootScope,$scope,spUtil, $q,$uibModal) {
	/* widget controller */
	var c = this;
	c.table_sys_ids = {};
	c.inProgress = false;
	c.data.tables = [];
	c.defaultQuery = 'sys_idIN' + c.data.tables.join(',');
	c.addToDashboard = false;
	c.dashboardLink = "/$pa_dashboard.do?sysparm_dashboard=24c4beb6db4fba002a4cfd5e0f9619a9&sysparm_view=personalized&sysparm_source=SUHA";



	c.checkDashBoard = function(){
		c.server.get({action:"setDashboard",service:c.data.service_name}).then(function(response){
			c.dashboardSysID = response.data.dashboardSysID;

			c.dashBoardSettings(c.dashboardSysID);

		});

	}


	c.dashBoardSettings = function(sysId) {
		c.data.loadingModal = true;
		spUtil.get("suha_form_widget", {
			sys_id: sysId,
			table: 'u_suha_dashboard_config'
		}).then(function(response) {
			c.dashBoardForm = response;
			c.modalInstance = $uibModal.open({
				templateUrl: 'ModalFormWidget',
				scope: $scope,
				size: 'lg'
			});
			c.data.loadingModal = false;
		});

	};
	
	$rootScope.$on('closeModal', function(evt, parms) {
		c.modalInstance.close();
	});



	$scope.showTablePicker = function() {

		if(c.scope && c.scope.length > 0 && c.data.service_name && c.data.service_name.length > 0) {
			return true;
		}
		return false;
	}


	CustomEvent.observe('close.service', function() {
		c.login_status = 1;
	});

	c.clientJSON = null;
	c.step = 1;

	//"c.global_tables" holds the tables whose scope is global and extends all base MF Tables
	c.global_tables = "sys_scope=global^super_class=8398b7f4dbea36002a4cfd5e0f9619bd^ORsuper_class=f93a8c05db6676002a4cfd5e0f961936^ORsuper_class=2ca98441db6676002a4cfd5e0f9619ac^ORsuper_class=057bf774db6e36002a4cfd5e0f96195f^ORsuper_class=e9ea7bfcdb2e36002a4cfd5e0f961976";
	//"c.scoped_tables" holds the tables with given scope app and extends all base MF Tables
	c.scoped_tables = "sys_scope=" + c.scope + "^super_class=8398b7f4dbea36002a4cfd5e0f9619bd^ORsuper_class=f93a8c05db6676002a4cfd5e0f961936^ORsuper_class=2ca98441db6676002a4cfd5e0f9619ac^ORsuper_class=057bf774db6e36002a4cfd5e0f96195f^ORsuper_class=e9ea7bfcdb2e36002a4cfd5e0f961976";
	//type is service in group table
	c.service_list = "u_type=" + c.data.SERVICE_CONSTANT;
	//type is group in group table
	c.group_list = "u_type=" + c.data.GROUP_CONSTANT;


	c.scope = "";
	c.data.service_name = "";
	//login_status decides which part of html to display
	c.login_status = 1;
	var service_name="";
	var scope_name="";
	var tables = [];

	//document.getElementById("next").disabled = true;
	//document.getElementById("back").disabled = true;


	c.goTo = function(step){
		c.step = step;
	}

	c.nil = function(variable) {
		if(variable == null || variable == undefined)
			return true;
		if(typeof variable == "object") {
			if(Object.keys(variable).length <= 0)
				return true;
		}

		if(Array.isArray(variable) || typeof variable == "string") {
			if(variable.length <= 0)
				return true;
		}

		return false;
	};

	c.checkFieldValues = function(metric) {
		if(!metric.hasOwnProperty('isSelected') ||  metric.isSelected) { 
			if(c.nil(metric.tableSysID))
				metric.emptyFields.push('Table');
			if(metric.tableColumns && c.nil(metric.selectedColumn))
				metric.emptyFields.push('Column');
			if(!c.nil(metric.aggregation) && c.nil(metric.defaultAggregation))
				metric.emptyFields.push('Aggregation');
			if(c.nil(metric.defaultFrequency))
				metric.emptyFields.push('Frequency');
			if(c.nil(metric.name))
				metric.emptyFields.push('Metric Name');
			if(c.nil(metric.unit) || c.nil(metric.unit.value))
				metric.emptyFields.push('Unit');	
			if(metric.successStates && metric.successStates.length > 0 && c.nil(metric.selectedStates))
				metric.emptyFields.push('Success States');	
			if(metric.failureStates && metric.failureStates.length > 0 && c.nil(metric.selectedStates))
				metric.emptyFields.push('Failure States');	
			if(metric.emptyFields.length > 0)
				return true;
		}
		return false;
	}


	c.areMetricsValid = function() {
		var invalidFields = false;
		c.clientJSON.forEach(function (metric, index) {
			metric.emptyFields = [];
			invalidFields = c.checkFieldValues(metric);
		});
		c.listOfCustomMetrics.forEach(function (metric, index) {
			metric.emptyFields = [];
			invalidFields = c.checkFieldValues(metric);
		});
		return !invalidFields;
	}; 
	c.next = function(){

		if(c.step == 1){
			c.createJSON();
			c.loadedTables = c.table_sys_ids;
			c.goTo(c.step + 1);
			//	document.getElementById("back").disabled = false;

		}
		else if(c.step == 2){
			if(c.areMetricsValid()) {
				c.createIRJSON();
				c.goTo(c.step + 1);
			}



		}
		else if(c.step == 3)
			c.goTo(3);


	}

	c.back = function(){
		if(c.step == 1)
			c.goTo(1);

		else if(c.step == 2){
			c.listOfCustomMetrics = [];
			c.data.table = "u_suha_mf_config";
			c.data.query = 'u_service=' + c.data.service_name + '^u_scope=' + c.scope;
			c.data.action = "deleteRecordInTable";
			c.server.update().then(function(response){
				c.data.action = undefined;
			})

			c.goTo(c.step - 1);


		}
		else if(c.step == 3){
			c.goTo(c.step - 1);
		}

	} 


	c.signInFormEnabler = function(){
		c.login_status = 1;
	}

	c.signUpFormEnabler = function(){
		c.login_status = 0;
	}

	$scope.get_service = {
		displayValue : "",
		value : "",
		name : 'service_name'
	};

	$scope.get_scope = {
		displayValue : "",
		value : "",
		name : 'scope_name'
	};

	$scope.get_global_tables = {
		displayValue : "",
		value : "",
		name : 'global_table_names'
	};


	$scope.$on("field.change", function(evt, parms) {

		var buttonDisabled = true;

		if (parms.field.name == 'service_name'){
			c.data.service_name = parms.newValue;

		}

		if(parms.field.name == 'scope_name'){
			c.data.scope_name = parms.newValue;
			c.scope = parms.newValue;
			var query = 'super_class.nameSTARTSWITHx_snc_mf';
			if(c.scope && c.scope.length > 0)
				query += '^sys_scope='+ c.scope;
			$rootScope.$emit('update.query', {query : query});

		}

		if(parms.field.name == 'global_table_names'){
			c.data.table_sys_ids = parms.newValue;
			c.table_sys_ids = parms.newValue;
		}
		c.server.update().then(function(response) {         
			spUtil.update($scope);
		})

	});

	c.getTableDetails = function() {
		c.server.get({action:"getTableNames",inputTable:c.data.tables}).then(function(response){
			c.loadedTables = response.data.tableJSON;
		});
	};


	c.createJSON=function(){




		c.data.tables=[];
		if(c.table_sys_ids != null)
			c.data.tables = Object.keys(c.table_sys_ids);

		c.defaultQuery = 'sys_idIN' + c.data.tables.join(',');
		//console.log(c.table_sys_ids);


		//alert(tables.toString());
		c.server.get({action: "getClientMetricJSON",service_name : c.data.service_name ,scope_name : c.scope ,tables : c.data.tables}).then(function(response){
			c.clientJSON = response.data.clientJSON;
		});


	};

	c.createIRJSON = function(){

		//alert(JSON.stringify(c.clientJSON));

		c.selectedMetrics = [];

		for(var json_iter=0;json_iter<c.clientJSON.length;json_iter++)
		{
			if(c.clientJSON[json_iter].isSelected == true)
			{

				c.selectedMetrics.push(c.clientJSON[json_iter]);
			}
		}
		c.selectedMetrics = c.selectedMetrics.concat(c.listOfCustomMetrics);

		var payload = {
			action : "updateClientJSON",
			selectedMetrics:c.selectedMetrics,
			service:c.data.service_name,
			scope:c.scope
		};

		c.server.get(payload).then(function(response){
			c.data.action = undefined;
		});

		payload.action = "createIRJSON";

		c.server.get(payload).then(function(response){
			c.iRJSON = response.data.iRJSON;
			console.log(c.iRJSON);
		});


	};

	c.createSUHAComponentsFromIR = function(){


		c.inProgress = true;

		var itr=0;
		c.progress={};
		c.status = {};


		var promise = $q.all(null);
		angular.forEach(c.iRJSON, function(iRInstance){

			promise = promise.then(function(){
				document.getElementsByClassName("loading-spinner")[itr].style.display = "block";


				return c.server.get({action : "createSUHAComponentsInServer", iR : c.iRJSON[itr] , status : c.status , service :service_name , scope: scope_name }).then(function(response) {
					c.status = response.data.status;

					console.log(c.status);


					c.progress[itr] = 0;
					c.current = itr;
					/*
					if(c.status[c.iRJSON[itr].metric.name]["dataSource"]["status"]== -1 || c.status[c.iRJSON[itr].metric.name]["metricDefinition"]["status"]== -1 ||c.status[c.iRJSON[itr].metric.name]["groupMetricDefinition"]["status"]== -1)
						c.updateProgressBar(itr,"dataSource",-1);
					else if(c.status[c.iRJSON[itr].metric.name]["dataSource"]["status"]== 0 || c.status[c.iRJSON[itr].metric.name]["metricDefinition"]["status"]== 0 ||c.status[c.iRJSON[itr].metric.name]["groupMetricDefinition"]["status"]== -1)
						c.updateProgressBar(itr,"dataSource",-1);
					else
						c.updateProgressBar(itr,"dataSource",1);
						*/



					if(c.status[c.iRJSON[itr].metric.name]["groupMetricDefinition"]["status"]== -1)
						c.updateProgressBar(itr,"dataSource",-1);
					else if(c.status[c.iRJSON[itr].metric.name]["groupMetricDefinition"]["status"]== 0)
						c.updateProgressBar(itr,"dataSource",0);
					else
						c.updateProgressBar(itr,"dataSource",1);



					itr++;

				});

			});

		});

		promise.then(function(){
			c.addToDashboard = true;
			c.server.get({action : 'addContributor', groupSysID : c.data.service_name}).then(function(response){
				if(response.data.link)
					c.dashboardLink = response.data.link;
			});
		});
	};

	c.tableJSON ={};
	c.loadedTables = {};
	c.listOfCustomMetrics = [];
	var customIndicator =0;

	c.loadCustomtJSON = function(){

		c.data.action = "getClientJSONObj";
		c.server.update().then(function(response){
			c.data.action = undefined;
			c.globalClientJSON = response.globalClientJSON;
			var customJSON = c.globalClientJSON;
			customJSON.isCustom = "true";
			customJSON.tableSysID ="";
			c.listOfCustomMetrics.push(customJSON);

		});

	};

	c.deleteCustomtJSON =function(index){
		c.listOfCustomMetrics.splice(index, 1);
	};

	c.loadFields = function(metric, selectedTable){
		c.server.get({action : 'loadFields', 'name' : selectedTable.name, sys_id : selectedTable.sys_id}).then(function(response){	
			metric.table_fields = response.data.table_fields;

		});

	}




	c.updateProgressBar = function(curr,tableName,status){

		c.progress[curr] = 100;

		/*
		if(status == -1)
			document.getElementsByClassName("progress-bar bg-danger")[curr].style.width = c.progress[curr]+"%";
		else if(status ==0)
			document.getElementsByClassName("progress-bar bg-warning")[curr].style.width = c.progress[curr]+"%";
		else
			document.getElementsByClassName("progress-bar bg-success")[curr].style.width = c.progress[curr]+"%";
*/

		if(c.progress[curr] == 100){
			document.getElementsByClassName("final-status")[curr].style.display = "block";
			document.getElementsByClassName("loading-spinner")[curr].style.display = "none";
		}


	};



	c.getButtonClass= function(buttonName) {
		var state = $('#' + buttonName).prop('disabled');
		var active = !state;
		var classes = {
			'btn-primary' : active
		};
		return classes;
	};


	c.getStatusClass = function(status) {
		var classObj = {};
		if(status == 0) {
			classObj['fa-recycle'] = true;
			classObj['font-green'] = true;
		} else if (status == 1) {
			classObj['fa-check'] = true;
			classObj['font-green'] = true;
		} else {
			classObj['fa-times'] = true;
			classObj['font-red'] = true;
		}
		return classObj;

	};

	$scope.validateStep = function() {
		var buttonDisabled = true;
		if(c.step == 1) {
			if(c.data.service_name!="" && c.scope!="" &&  c.login_status != 0) {
				if(c.scope != 'global' || Object.keys(c.table_sys_ids).length > 0)
					buttonDisabled = false;	
			}
		} else if(c.step ==2)
			buttonDisabled = false;
		return buttonDisabled;
	}

	$scope.$watch("c.step", function(newValue, oldValue){
		//console.log('watched');
		if(newValue == 1){
			//console.log('sending');
			var query = 'super_class.nameSTARTSWITHx_snc_mf';
			if(c.scope && c.scope.length > 0)
				query += '^sys_scope='+ c.scope;
			$rootScope.$emit('update.query', {query : query});
			//$rootScope.$broadcast('auto.select', {tables : c.table_sys_ids});
		}
	});

	$rootScope.$on('clear.selection',function(evt, parms){
		c.table_sys_ids = {};
	});

	$rootScope.$on('update.selection',function(evt, parms){
		//	console.log(parms);
		if(parms.action == 'add') {
			for(var i = 0; i < parms.sys_ids.length ; i++ ) {
				c.table_sys_ids[parms.sys_ids[i].sys_id] = parms.sys_ids[i];
			}
		} else if (parms.action == 'delete') {
			for(var i = 0; i < parms.sys_ids.length ; i++ ) {
				delete c.table_sys_ids[parms.sys_ids[i].sys_id];
			}

		}
	});






}