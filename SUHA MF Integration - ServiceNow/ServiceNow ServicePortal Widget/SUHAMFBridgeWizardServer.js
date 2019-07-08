(function() {
	/* populate the 'data' object */
	/* e.g., data.table = $sp.getValue('table'); */
	

	//SUHAConsts for service
	data.SERVICE_CONSTANT = SUHAConsts.GROUP.TYPE.SERVICE;
	//SUHAConsts for groups
	data.GROUP_CONSTANT = SUHAConsts.GROUP.TYPE.GROUP;

	
	var getTableNameBySYSID = function(id){
		var gr = new GlideRecord('sys_db_object');
		gr.addQuery('sys_id',id);
		gr.query();

		if(gr.next())
			return gr.getValue("name") ;


	}
	
	var getParentTableName = function(sysID) {
		var gr = new GlideRecord('sys_db_object');
		

		if(gr.get(sysID)) {
			if(!gs.nil(gr.super_class))
				return gr.super_class.name;
		}
			
	}

	var deleteRecord = function(table,encodedQuery){
		var rec = new GlideRecord(table);
		rec.addEncodedQuery(encodedQuery);
		rec.query();
		if (rec.next())  
			rec.deleteRecord();

	}
	
	var getRecordField = function(table,encodedQuery,field){
		var gr = new GlideRecord(table);
		gr.addEncodedQuery(encodedQuery);
		gr.query();

		if(gr.next()) { 
			return gr.getValue(field);
		}
		return null;
	}

	var addInConfigTable = function(service,scope,clientJSON){

		var record = getRecordField("u_suha_mf_config","u_service="+service+"^u_scope="+scope,"u_client_json");

		if(record == null){
			var gr = new GlideRecord('u_suha_mf_config');
			gr.initialize();
			gr.u_service = service;
			gr.u_scope = scope;
			gr.u_client_json = clientJSON;

			return gr.insert();
		}
		else{
			updateSUHAMFConfigTable("u_service="+service+"^u_scope="+scope ,"u_client_json" , clientJSON  );
		}
	}

	var updateSUHAMFConfigTable = function(encodedQuery , field , value){

		var gr = new GlideRecord('u_suha_mf_config');
		gr.addEncodedQuery(encodedQuery);
		gr.query();
		if(gr.next()){
			gr.setValue(field,value) ;
			gr.update();
		}
	}
	
	var updateClientJSONAfterOnboarding = function(service,scope,status,iRJSON){
		var newClientJSON = JSON.parse(getRecordField("u_suha_mf_config","u_service="+service+"^u_scope="+scope,"u_client_json"));

		for(itr=0 ; itr<iRJSON.length ; itr++){

			newClientJSON[itr]["onboardState"] = "complete";


		}
		//gs.addInfoMessage(JSON.stringify(newClientJSON));
		updateSUHAMFConfigTable("u_service=" + service + "^u_scope=" + scope , "u_client_json" , JSON.stringify(newClientJSON));

	}
	
	var getSysID = function(tableName , queryString){
		
		var gr = new GlideRecord(tableName);
		gr.addEncodedQuery(queryString);
		gr.query();
		if (gr.next()) {
			
			return gr.getValue('sys_id');
		}	
		return null;
	}



	if(input){
		
		if(input.action == "setDashboard"){
			var sysID = getSysID('u_suha_dashboard_config' , 'u_group='+input.service + '^u_dashboard=b4dda928db8bbe40672976821f961979');
			
			if(gs.nil(sysID)){
				var dashboardGR = new GlideRecord("u_suha_dashboard_config");
				dashboardGR.initialize(); 
				dashboardGR.u_group = input.service;
				dashboardGR.u_dashboard = "b4dda928db8bbe40672976821f961979";
				data.dashboardSysID =  dashboardGR.insert(); 
			}
		
			data.dashboardSysID = sysID;


		}

		if(input.action == "updateClientJSON"){
			updateSUHAMFConfigTable("u_service=" + input.service + "^u_scope=" + input.scope , "u_client_json" , JSON.stringify(input.selectedMetrics));

		}



		if(input.action == "getScopedTables"){

			var gr = new GlideRecord('sys_db_object');
			gr.addEncodedQuery(input.scoped_tables);
			gr.query();
			data.tables = [];

			while(gr.next()){
				data.tables.push(gr.getValue("sys_id"));
				//gs.addInfoMessage(gr.sys_id);

			}

		}

		if(input.action == "getClientMetricJSON"){
			try {
			var obj = new SUHAMFMetricTemplateHelper(input.tables,input.service_name,input.scope_name);
			var result = obj.loadStandardMetricDetails();
			var clientJSON = JSON.stringify(result);
			//gs.addInfoMessage(clientJSON);
			data.clientJSON = result;

			addInConfigTable(input.service_name,input.scope_name,clientJSON);
			} catch(e) {
				gs.addErrorMessage(' Error : ' + e);
			}

		}



		if(input.action == "createIRJSON"){

			var iRJSONObj = new SUHAMFComponentFormatter();

			var iRJSON = iRJSONObj.createServerJSON(input.scope,input.service,input.selectedMetrics);



			updateSUHAMFConfigTable("u_service=" + input.service + "^u_scope=" + input.scope , "u_ir_json" , JSON.stringify(iRJSON) );

			data.iRJSON = iRJSON;



		}




		if(input.action == "createSUHAComponentsInServer"){
			input.status[input.iR.metric.name]={};
			var componentCreator = new SUHAComponentsCreator(input.iR);
			try {
				input.status[input.iR.metric.name]["dataSource"] =  componentCreator.createDS();
				if(input.status[input.iR.metric.name]["dataSource"]["status"] != SUHAMFConsts.STATE.FAILED)
					input.status[input.iR.metric.name]["dataSource"]["link"]= "/u_suha_data_source.do?sys_id=" + input.status[input.iR.metric.name]["dataSource"]["sysID"];
			} catch(e) {
				gs.addErrorMessage('Error Occured while creating :  DS| ' + e)
			}
			try {
				input.status[input.iR.metric.name]["metricDefinition"] = componentCreator.createMetric();
				if(input.status[input.iR.metric.name]["metricDefinition"]["status"] != SUHAMFConsts.STATE.FAILED)
					input.status[input.iR.metric.name]["metricDefinition"]["link"] = "/u_suha_metric_definition.do?sys_id=" +input.status[input.iR.metric.name]["metricDefinition"]["sysID"];
			} catch(e) {
				gs.addErrorMessage('Error Occured while creating : Metric | ' + e)
			}

			try {
				input.status[input.iR.metric.name]["groupMetricDefinition"] =  componentCreator.createGM();
				if(input.status[input.iR.metric.name]["groupMetricDefinition"]["status"] != SUHAMFConsts.STATE.FAILED)
					input.status[input.iR.metric.name]["groupMetricDefinition"]["link"] = "/u_suha_group_metric_definition.do?sys_id=" + input.status[input.iR.metric.name]["groupMetricDefinition"]["sysID"];

			} catch(e) {
				gs.addErrorMessage('Error Occured while creating : GM | ' + e)
			}
			data.status = input.status;
			updateClientJSONAfterOnboarding(input.service,input.scope,input.status,input.iR);
			

		}



		if(input.action == "deleteRecordInTable"){
			deleteRecord(input.table,input.query);
		}



		if(input.action == "loadFields"){
			var table_fields=[];
			var tableSysID = input.sys_id;
			var parentTableName = getParentTableName(tableSysID);
			var nameQuery = 'name=' + input.name;
			if(!gs.nil(parentTableName))
				nameQuery += ' ^ORname=' + parentTableName;
			var fields = new GlideRecord('sys_dictionary');
			fields.addEncodedQuery('elementSTARTSWITHu_^ORelementSTARTSWITHx_');
			fields.addEncodedQuery(nameQuery);
			fields.query();
			while(fields.next())
			{
				table_fields.push(fields.element.toString());
			}
			data.table_fields = table_fields;

		}

		if(input.action == "getTableNames"){
			var tableJSON={};

			for(var i=0;i<input.inputTable.length;i++)
			{

				tableJSON[input.inputTable[i]] = getTableNameBySYSID(input.inputTable[i]);

			}

			data.tableJSON = tableJSON;
		}

		if(input.action == "getClientJSONObj"){
			var clientJSONObj = new SUHAMFMetricTemplateFormatter();
			data.globalClientJSON = clientJSONObj.globalClientJSON;
		}
		
		if(input.action == "addContributor") {
			var userID = gs.getUserID();
			if(!gs.nil(input.groupSysID)) {
				SUHAUtil.addGroupMember(input.groupSysID, userID);	
				var groupGR = new GlideRecord(SUHAConsts.TABLE.GROUP);
				if(groupGR.get(input.groupSysID))
					data.link = SUHADashboardHelper.getGroupDashboardLink(groupGR);
			}
		}

	}
	else {
		var breadcrumbWidgetParams = {
			table: 'sys_db_object',
			filter: 'super_class.nameSTARTSWITHx_snc_mf',
			//view : 'decision_answer',
			enable_filter: true,
			show_breadcrumbs: true,
			fields : 'label,name',
			window_size : 5000,
			hide_footer : true


		};
		data.filterBreadcrumbs = $sp.getWidget('suha_mf_data_table', breadcrumbWidgetParams);
	}


	//end of server script
})();