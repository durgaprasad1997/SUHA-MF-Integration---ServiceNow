var SUHAMFMetricTemplateHelper = Class.create();
SUHAMFMetricTemplateHelper.prototype = {
    initialize: function(tablesSysIds , service , scope) {
		this.tablesSysIds = tablesSysIds;
		this.service = service;
		this.scope = scope;
	},
	
	logger : new CidLogger('SUHAMFMetricTemplateHelper', SUHAConsts.LOGGER.TRACE, SUHAConsts.LOGGER.SOURCE),
	
	//BASE_TABLES are global constants which stores sysID's of MF base tables
	BASE_TABLES : {
		key : 'b04fc2c3db52fa402a4cfd5e0f961900', //  x_snc_mf_base_key
		usage : '2ca98441db6676002a4cfd5e0f9619ac', // x_snc_mf_base_usage
		performance : 'f93a8c05db6676002a4cfd5e0f961936', //  x_snc_base_performance
		execution : '057bf774db6e36002a4cfd5e0f96195f', // x_snc_mf_base_execution
		failure : 'e9ea7bfcdb2e36002a4cfd5e0f961976', // x_snc_mf_base_failure
		base : '8398b7f4dbea36002a4cfd5e0f9619bd', // x_snc_snc_mf_base_metric
	},


	//global object to store all the client renderable UI
	metricJSON : [],
	
	getUniqueValuesByField : function(table, field) {
		var values = [];
		var gr = new GlideAggregate(table);
		gr.addAggregate('COUNT');
		gr.groupBy(field);
		gr.query();
		while (gr.next()) {
			var value = gr.getValue(field);
			if(!gs.nil(value))
				values.push(value);
		}
		return values;
	},
	
	getValidRowCount : function(table, query, field) {
		var count = 0;
		var ga = new GlideAggregate(table);
		if(!gs.nil(query))
			ga.addEncodedQuery(query);
		ga.addNotNullQuery(field);
		ga.addAggregate('COUNT');
		ga.query();
		if(ga.next())
			count = parseInt(ga.getAggregate('COUNT'));
		return count;
	},

	//metrics related to performance tables
	_performanceMetrics : function(tableSysID){	
		var tableDetails = this._getTableDetailsBySysID(tableSysID);
		var unitDetails = this._getUnitDetails('Milliseconds');
		var clientJSON = new SUHAMFMetricTemplateFormatter();
		var obj = [{
			'name' : 'Duration',
			'label' : 'Duration',
			'tableSysID' : tableSysID,
			'tableName' : tableDetails.name,
			'aggregation' : {
				'2' : 'SUM'
			},
			'category' : 'Latency',
			'defaultAggregation' : '2',
			'direction' : SUHAConsts.METRIC.DIRECTION.MINIMIZE,
			'table' : {value : tableDetails.name, displayValue : tableDetails.label},
			'tableColumns' : [{label : 'Duration', name : 'u_duration'}],
			'unit' : { value : 'Milliseconds', displayValue : 'Milliseconds'},
		}];
		return clientJSON.createClientJSON(obj);
	},
	
	//metrics related to failure tables
	_failureMetrics : function(tableSysID){
		var tableDetails = this._getTableDetailsBySysID(tableSysID);
		var rowCount = this.getValidRowCount(tableDetails.name, null, 'u_error_type');
		var breakdown2 = {
			name : 'u_error_type', 
			label : 'Error Type'
		};
		var clientJSON = new SUHAMFMetricTemplateFormatter();
		var obj = [{
			'name' : 'Failure Count',
			'label' : 'Failure Count',

			'tableSysID' : tableSysID,
			'tableName' : tableDetails.name,
			'table' : {value : tableDetails.name, displayValue : tableDetails.label},
			'tableColumns' : null,
			'aggregation' : {
				'1' : 'COUNT'
			},
			'defaultAggregation' : '1',
			'category' : 'Errors',
			'direction' : SUHAConsts.METRIC.DIRECTION.MINIMIZE,
			'unit' : { value : '#', displayValue : '#'},
			'needSecondBreakdown' : (rowCount > 0),
			'nestedBreakdown' : (rowCount > 0),
			'breakdown2' : rowCount > 0 ? breakdown2 : null,
		}];
		return clientJSON.createClientJSON(obj);
	},

	//metrics related to usage tables
	_usageMetrics : function(tableSysID){
		var tableDetails = this._getTableDetailsBySysID(tableSysID);
		var clientJSON = new SUHAMFMetricTemplateFormatter();
		var obj =  [{
			'name' : 'Usage',
			'label' : 'Usage',
			'tableSysID' : tableSysID,
			'tableName' : tableDetails.name,
			'table' : {value : tableDetails.name, displayValue : tableDetails.label},
			'tableColumns' : null,
			'aggregation' : {
				'1' : 'COUNT'
			},
			'defaultAggregation' : '1',
			'category' : 'Saturation',
			'unit' : { value : '#', displayValue : '#'},
		}];
		return clientJSON.createClientJSON(obj);
	},

	//metrics related to execution tables
	_executionMetrics : function(tableSysID){
		var tableDetails = this._getTableDetailsBySysID(tableSysID);
		var executionStates = this.getUniqueValuesByField(tableDetails.name, 'u_status');
		var clientJSON = new SUHAMFMetricTemplateFormatter();
		var obj = [
			{
				'name' : 'Execution Count',
				'label' : 'Execution Count',
				'tableSysID' : tableSysID,
				'tableName' : tableDetails.name,
				'table' : {value : tableDetails.name, displayValue : tableDetails.label},
				'tableColumns' : null,
				'aggregation' : {
					'1' : 'COUNT'
				},
				'defaultAggregation' : '1',
				'category' : 'Traffic / Load',
				'unit' : { value : '#', displayValue : '#'},

			},
			{
				'name' : 'Success',
				'label' : 'Success',
				'tableSysID' : tableSysID,
				'tableName' : tableDetails.name,
				'table' : {value : tableDetails.name, displayValue : tableDetails.label},
				'tableColumns' : [{label : 'Status', name : 'u_status'}],
				'aggregation' : null,
				'defaultAggregation' : null,
				'successStates' : executionStates,
				'category' : 'Availability',
				'direction' : SUHAConsts.METRIC.DIRECTION.MAXIMIZE,
				'unit' : { value : '%', displayValue : '%'},
			},
			{
				'name' : 'Failure',
				'label' : 'Failure',
				'tableSysID' : tableSysID,
				'tableName' : tableDetails.name,
				'table' : {value : tableDetails.name, displayValue : tableDetails.label},
				'tableColumns' : [{label : 'Status', name : 'u_status'}],
				'aggregation' : null,
				'defaultAggregation' : null,
				'failureStates' : executionStates,
				'category' : 'Availability',
				'direction' : SUHAConsts.METRIC.DIRECTION.MINIMIZE,
				'unit' : { value : '%', displayValue : '%'},
			}];
		return clientJSON.createClientJSON(obj);
	},


	//gets the parent table sysID on given table id
	_getParentSysID : function(tableID){

		var logPrefix ='_getParentSysID: ';
		var gr = new GlideRecord('sys_db_object');
		gr.addEncodedQuery('sys_id='+ tableID);
		gr.query();
		if(gr.next()){
			this.logger.info(logPrefix + 'table SysId: ' + tableID + 'parent: ' + gr.getValue('super_class'));
			return gr.getValue('super_class');
		}
		this.logger.info(logPrefix + 'no parent in sys_db_object with table sysId '+tableID);

	},
	
	//gets the name of the table given it's Sys ID
	_getTableDetailsBySysID : function(tableID){
		var logPrefix ='_getTableDetailsBySysID: ';
		var gr = new GlideRecord('sys_db_object');	
		if(gr.get(tableID)){
			this.logger.info(logPrefix + 'table SysId : '+ tableID+' Name : '+ gr.getValue('name') +'Label : '+ gr.getValue('label'));
			return {name : gr.getValue('name'), label : gr.getValue('label')};
		}
		this.logger.info(logPrefix + 'no record in sys_db_object with table SysID '+tableID);
		
	},



	//utility function to add array of JSON into global metricJSON object
	addIntoJSONBucket : function(item){
		for(var itr in item){
			this.metricJSON.push(item[itr]);
		}
	},


	//callable function to load all the standard metrics
	loadStandardMetricDetails : function(){
		var logPrefix = 'loadStandardMetricDetails: ';
		//baseTablesMapper is a map to relate sysId with their respective metrics
		
		var baseTablesMapper = {};
		var tableSysID;

		baseTablesMapper[this.BASE_TABLES.performance] = this._performanceMetrics.bind(this);
		baseTablesMapper[this.BASE_TABLES.execution] = this._executionMetrics.bind(this);
		baseTablesMapper[this.BASE_TABLES.usage] = this._usageMetrics.bind(this);
		baseTablesMapper[this.BASE_TABLES.failure] = this._failureMetrics.bind(this);
		var iteratorObj;

		for(iteratorObj = 0; iteratorObj < this.tablesSysIds.length ; iteratorObj++)
		{
			tableSysID = this.tablesSysIds[iteratorObj];
			var parentTableSysID = this._getParentSysID(tableSysID);
			var json = baseTablesMapper[parentTableSysID](tableSysID);
			this.addIntoJSONBucket(json);
		}
		var finalJSON = this.metricJSON;
		this.logger.info(logPrefix + 'Standard metrics Client JSON \n' + JSON.stringify(finalJSON));
		return finalJSON;
	},

    type: 'SUHAMFMetricTemplateHelper'
};