var SUHAComponentsCreatorV2 = Class.create();
SUHAComponentsCreatorV2.prototype = {
	initialize: function(componentDetails) {
		this.componentDetails = componentDetails;
		this.serverJSON = {};
	},
	logger : new CidLogger('SUHAComponentsCreatorV2', SUHAConsts.LOGGER.TRACE, SUHAConsts.LOGGER.SOURCE),


	_getSysID : function(tableName , queryString){
		var logPrefix = '_getSysID: ';
		var gr = new GlideRecord(tableName);
		gr.addEncodedQuery(queryString);
		gr.query();
		if (gr.next()) {
			this.logger.info(logPrefix + 'tableName : ' + tableName + 'query: ' + queryString + 'output: ' + gr.getValue('sys_id'));
			return gr.getValue('sys_id');
		}
		this.logger.info(logPrefix + 'tableName : ' + tableName + 'query ' + queryString + 'output: none');
		return null;
	},

	_getFieldBySysId : function(tableName ,field , sysId){
		var logPrefix = '_getFieldBySysId: ';
		var gr = new GlideRecord(tableName); 

		if(gr.get(sysId)) { 
			this.logger.info(logPrefix + 'tableName : ' + tableName + 'fiels: ' + field + 'sysId: ' + sysId + 'Field' + gr.getValue(field));
			return gr.getValue(field);
		}
		this.logger.info(logPrefix + 'tableName : ' + tableName + 'fiels: ' + field + 'sysId: ' + sysId + 'Field : none');

	},



	_checkExistance : function(tableName , encodedQuery){
		var logPrefix = '_checkExistance: ';

		var gr = new GlideRecord(tableName);

		gr.addEncodedQuery(encodedQuery);
		gr.query();
		if (gr.next()) {
			this.logger.info(logPrefix + ' tableName: ' + tableName + ' encodedQuery: ' + encodedQuery + 'sysId: ' +  gr.getValue('sys_id'));
			return gr.getValue('sys_id');
		}

		this.logger.info(logPrefix + ' tableName: ' + tableName + ' encodedQuery: ' + encodedQuery + 'sysId:  -1' );
		return -1;
	},

	_createComponent : function(tableName , tableRecord){

		var logPrefix = '_createComponent: ';
		this.serverJSON[tableName]=tableRecord ;

		var metricExistance;
		var componentOutput = {};
		componentOutput['sysId'] = '';
		componentOutput['status'] = '';


		if(tableName == 'u_suha_metric_definition'){
			this.logger.info(logPrefix + 'checking for existing u_suha_metric_definition component ');
			metricExistance = this._checkExistance(tableName , 'u_name=' + tableRecord['u_name']  +'^u_unit='+ tableRecord['u_unit'] +'^u_collection_mode='+ tableRecord['u_collection_mode']);
			if(metricExistance !=-1)
			{
				componentOutput['sysId'] = metricExistance;
				componentOutput['status'] = 0;
				
				this.logger.info(logPrefix + JSON.stringify(componentOutput));
				return componentOutput;
			}
		}
		else if( tableName == 'u_suha_data_source'){
			this.logger.info(logPrefix + 'checking for existing u_suha_data_source component ');
			metricExistance = this._checkExistance(tableName , 'u_name=' + tableRecord['u_name'] +'^u_conditions='+tableRecord['u_conditions']+'^u_source_table='+tableRecord['u_source_table']);
			if(metricExistance !=-1)
			{
				componentOutput['sysId'] = metricExistance;
				componentOutput['status'] = 0;
				this.logger.info(logPrefix + JSON.stringify(componentOutput));
				return componentOutput;
			}

		}
		else if(tableName == 'u_suha_data_source_aggregations'){
				
		}
		else
		{

			this.logger.info(logPrefix + 'checking for existing u_suha_data_source_aggregations component ');
			metricExistance = this._checkExistance(tableName , 'u_group='+tableRecord['u_group']+'^u_metric='+tableRecord['u_metric']);
			if(metricExistance !=-1)
			{
				componentOutput['sysId'] = metricExistance;
				componentOutput['status'] = 0;
				this.logger.info(logPrefix + JSON.stringify(componentOutput));
				return componentOutput;
			}
		}



		//this.serverJSON[tableName]=tableRecord ;

		this.logger.info(logPrefix + 'creating new component');
		var gr = new GlideRecord(tableName);
		gr.initialize(); 
		keysArray=Object.keys(tableRecord);
		keysArray.forEach(function(element) {
			gr[element]=tableRecord[element];
		});
		metricExistance =  gr.insert();
		if(metricExistance !=-1)
		{
			componentOutput['sysId'] = metricExistance;
			componentOutput['status'] = 1;
			this.logger.info(logPrefix + JSON.stringify(componentOutput));
			return componentOutput;
		}
		else{
			componentOutput['sysId'] = metricExistance;
			componentOutput['status'] = -1;
			this.logger.info(logPrefix +'error caused while creating suha component' + JSON.stringify(componentOutput));
			return componentOutput;
		}

	},





	_createDataSourceAggregation : function(dataSourceSysID){

		var getAggregate = function(choice){

			/*
			var aggregateMap = {'count':SUHAConsts.PA.AGGREGATE.COUNT , 'sum': SUHAConsts.PA.AGGREGATE.SUM , 'avg':SUHAConsts.PA.AGGREGATE.AVG , 'min':SUHAConsts.PA.AGGREGATE.MIN , 'max':SUHAConsts.PA.AGGREGATE.MAX , 'count_dictinct':SUHAConsts.PA.AGGREGATE.COUNT_DISTINCT};
			*/
			var aggregateMap = {'COUNT': 1 , 'SUM': 3 , 'AVG':6 , 'MIN': 4, 'MAX': 5 , 'COUNT DISTINCT':2};


			return aggregateMap[choice];
		};

		var dataSourceAggregationJSON = {};
		dataSourceAggregationJSON['u_data_source'] =  dataSourceSysID;


		dataSourceAggregationJSON['u_aggregation_field'] = this.componentDetails['dataSourceAggregations']['aggregation_field'];

		dataSourceAggregationJSON['u_source_table'] = this._getFieldBySysId('sys_db_object' , 'name' , this.componentDetails['dataSource']['sourceTable']);

		dataSourceAggregationJSON['u_aggregate'] = getAggregate(this.componentDetails['dataSourceAggregations']['aggregation']);
		//dataSourceAggregationJSON['group'] = this.componentDetails['dataSourceAggregations']['group'];



		return this._createComponent('u_suha_data_source_aggregations' , dataSourceAggregationJSON);



	},

	_createDataSource : function(){

		var getFrequencyLogic = function(frequency){
			var frequencyMap = {
				'Daily' : 'sys_created_onONYesterday@javascript:gs.beginningOfYesterday()@javascript:gs.endOfYesterday()',
				'on Demand' : 'sys_created_onONLast minute@javascript:gs.beginningOfLastMinute()@javascript:gs.endOfLastMinute()',
				'30 minutes':'sys_created_onONLast 30 minutes@javascript:gs.beginningOfLast30Minutes()@javascript:gs.endOfLast30Minutes()',
				'Hourly':'sys_created_onONLast hour@javascript:gs.beginningOfLastHour()@javascript:gs.endOfLastHour()',
				'Weekly':'sys_created_onONLast week@javascript:gs.beginningOfLastWeek()@javascript:gs.endOfLastWeek()',
				'5 minutes':'sys_created_onRELATIVEGE@minute@ago@5'

			};
			return frequencyMap[frequency];

		};
		var dataSourceJSON = {};
		var condition;
		dataSourceJSON['u_name'] = this._getFieldBySysId('sys_db_object' , 'label' ,this.componentDetails['dataSource']['sourceTable'])+'.'+this.componentDetails['dataSource']['frequency'];


		dataSourceJSON['u_source_table'] = this._getFieldBySysId('sys_db_object' , 'name' , this.componentDetails['dataSource']['sourceTable']);
		dataSourceJSON['u_source_type'] = SUHAConsts.DATA_SOURCE.TYPE.TABLE;

		var conditions = '';
		conditions += getFrequencyLogic(this.componentDetails['dataSource']['frequency']);
		var conditionObj = this.componentDetails['dataSource']['conditions'];
		if(conditionObj) {
			var additionalCondition = '';
			for(var column in conditionObj) {
				var colValues = conditionObj[column];
				if(Array.isArray(colValues)) {
					additionalCondition += '^' + column + 'IN' + colValues.join(',');
				} else 
					additionalCondition += '^' + column + '=' + colValues;

			}
			if(!gs.nil(additionalCondition))
				conditions += additionalCondition;
		}

		dataSourceJSON['u_conditions'] = conditions;

		var dsOutput = this._createComponent('u_suha_data_source',dataSourceJSON);

		if(dsOutput['status']  == -1)
			return dsOutput;




		this.componentDetails['dataSource']['sysID'] = dsOutput['sysId'];

		if(this.componentDetails['dataSource']['isAggregated']==true){
			var gr = new GlideRecord('u_suha_data_source');
			if (gr.get(dsOutput['sysId'])) {
				gr.u_is_aggregated = true;
				gr.update();
			}


			this._createDataSourceAggregation(dsOutput['sysId']);
		}

		return dsOutput;

		//this._createDataSourceAggregation('data_source_aggregation');
	},

	_createMetricDefinition : function(){

		var getCollectionMode = function(mode){
			var collectionMap ={'REAL_TIME':SUHAConsts.METRIC.COLLECTION_MODE.REAL_TIME , 'TIME_SERIES':SUHAConsts.METRIC.COLLECTION_MODE.TIME_SERIES};

			return collectionMap[mode];

		};

		var metricDefinitionJSON = {};
		//metricDefinitionJSON['u_name'] = this._getFieldBySysId('u_suha_group' , 'u_name' ,this.componentDetails['group']['sysID']) + '_' + this.componentDetails['metric']['name'];
		metricDefinitionJSON['u_unit'] = this._getSysID('pa_units','name='+ this.componentDetails['metric']['unit']);
		metricDefinitionJSON['u_category'] = this._getSysID('u_suha_metric_category','u_name=Other');


		var frequency = this.componentDetails['dataSource']['frequency'];

		if(frequency == 'Daily' || frequency == 'Weekly')
			metricDefinitionJSON['u_collection_mode'] = getCollectionMode('TIME_SERIES');
		else 
			metricDefinitionJSON['u_collection_mode'] = getCollectionMode('REAL_TIME');


		metricDefinitionJSON['u_name'] = this.componentDetails['metric']['name'] + '.' + this.componentDetails['metric']['unit'] + '.' + metricDefinitionJSON['u_collection_mode'];


		metricDefinitionJSON['u_direction'] = SUHAConsts.METRIC.DIRECTION.NONE;
		metricDefinitionJSON['u_description'] = this.componentDetails['metric']['name'];


		var mdOutput = this._createComponent('u_suha_metric_definition',metricDefinitionJSON);

		//this.componentDetails['metric']['sysID'] = 'metricDefinitionSysID';


		this.componentDetails['metric']['sysID'] = mdOutput['sysId'];


		return mdOutput;

	},

	_generateScript : function(){
		var script = '';
		var isAggregated = this.componentDetails['dataSource']['isAggregated'];
		var isPercent = (this.componentDetails['metric']['unit'] == '%');
		var field = this.componentDetails['groupMetric']['column'];

		script = 'result.value = 0; \n';


		if(isAggregated) {
			var aggregation = this.componentDetails['dataSourceAggregations']['aggregation'];
			script += 'if(ds.next()) {\n';
			script += "\tresult.value = parseInt(ds.getAggregate('' +  aggregation + ''";
			if(!gs.nil(field))
				script += ", '" + field + "'";
			script += '));\n';
			script += '}\n';
		} else {
			script += 'var totalCount = 0; \n';  
			var columns = this.componentDetails['additionalInfo']['values'];
			if(isPercent) {
				script += 'var conditionalCount = 0; \n';
				script += 'var columnValues = ' + JSON.stringify(columns) + ';\n';     
			} 
			script += 'while(ds.next()) {\n';
			script += '\ttotalCount++; \n';
			if(isPercent) { 
				script += '\tvar value = ds.getValue("' + field + '");\n';
				script += '\tif(columnValues.indexOf(value) > -1) { \n\t\tconditionalCount++; \n\t}\n';
				script += '}\n';
				script += 'if(totalCount > 0) \n\tresult.value = ((conditionalCount/totalCount) * 100);\n';
			} else {
				script += '}\n';
				script += 'result.value = totalCount;\n'; 
			}   

		}
		return script;
	},



	_createGroupMetricDefinition : function(){


		var getFrequency = function(freq){

			var freqConsts = {
				'Daily' : SUHAConsts.COLLECTION.FREQUENCY.DAILY,
				'5 minutes' : SUHAConsts.COLLECTION.FREQUENCY.REAL_TIME,
				'30 minutes': SUHAConsts.COLLECTION.FREQUENCY.HALF_HOURLY,
				'Hourly': SUHAConsts.COLLECTION.FREQUENCY.HOURLY,
				'on Demand': SUHAConsts.COLLECTION.FREQUENCY.ON_DEMAND,
				'Weekly': SUHAConsts.COLLECTION.FREQUENCY.WEEKLY,

			};

			return freqConsts[freq];

		};



		var groupMetricDefinitionJSON = {};

		groupMetricDefinitionJSON['u_group'] = this.componentDetails['group']['sysID'];
		groupMetricDefinitionJSON['u_metric'] = this.componentDetails['metric']['sysID'];
		groupMetricDefinitionJSON['u_data_source'] = this.componentDetails['dataSource']['sysID'];
		groupMetricDefinitionJSON['u_active'] = true;
		groupMetricDefinitionJSON['u_start_collection'] = true;



		groupMetricDefinitionJSON['u_collection_frequency'] = getFrequency(this.componentDetails['dataSource']['frequency']);





		groupMetricDefinitionJSON['u_breakdown'] = true;
		groupMetricDefinitionJSON['u_map_custom_breakdown_elements'] = false;
		groupMetricDefinitionJSON['u_source_table'] = this._getFieldBySysId('sys_db_object' ,'name' , this.componentDetails['dataSource']['sourceTable']);
		groupMetricDefinitionJSON['u_breakdown_field'] = this.componentDetails['groupMetric']['breakdown1'];
		groupMetricDefinitionJSON['u_breakdown_label'] = this.componentDetails['groupMetric']['breakdown1'];

		if(this.componentDetails['groupMetric']['breakdown2']!= null){
			groupMetricDefinitionJSON['u_need_second_breakdown'] = true;
			groupMetricDefinitionJSON['u_breakdown_field_2'] = this.componentDetails['groupMetric']['breakdown2'];
			groupMetricDefinitionJSON['u_breakdown_2_label'] = this.componentDetails['groupMetric']['breakdown2'];
		}

		groupMetricDefinitionJSON['u_short_description'] = this._getFieldBySysId('u_suha_group' , 'u_name' , this.componentDetails['group']['sysID']); 
		groupMetricDefinitionJSON['u_aggregate_breakdown'] = false;
		groupMetricDefinitionJSON['u_notify_members'] = SUHAConsts.PA.AGGREGATE.SUHA_ADMIN;
		groupMetricDefinitionJSON['u_email_notifications'] = true;


		groupMetricDefinitionJSON['u_script'] = this._generateScript();


		var gmdOutput = this._createComponent('u_suha_group_metric_definition',groupMetricDefinitionJSON);

		this.componentDetails['groupMetric']['sysID'] = gmdOutput['sysId'];

		return gmdOutput;

	},




	createDataSourceComponent : function(){
		
		var logPrefix = 'createDataSourceComponent: ';

		var output = {};

		var dataSourseStat = this._createDataSource();
		output['sysId'] = dataSourseStat['sysId'];
		output['status'] = dataSourseStat['status'];
		output['componentDetails'] = this.serverJSON['u_suha_data_source'];
		
		this.logger.info(logPrefix + JSON.stringify(output));
		
		return output;


	},

	createMetricDefinitionComponent : function(){

		var logPrefix = 'createMetricDefinitionComponent: ';

		var output = {};

		var metricDefinationStat = this._createMetricDefinition();

		output['sysId'] = metricDefinationStat['sysId'];
		output['status'] = metricDefinationStat['status'];
		output['componentDetails'] = this.serverJSON['u_suha_metric_definition'];
		this.logger.info(logPrefix + JSON.stringify(output));
		return output;


	},

	createGroupMetricDefinitionComponent : function(){	
		var logPrefix = 'createGroupMetricDefinitionComponent: ';

		var output = {};

		var groupMetricDefinationStat = this._createGroupMetricDefinition();
		output['sysId'] = groupMetricDefinationStat['sysId'];
		output['status'] = groupMetricDefinationStat['status'];
		output['componentDetails'] = this.serverJSON['u_suha_group_metric_definition'];
		output['componentDetails']['u_name'] = this._getFieldBySysId('u_suha_group' , 'u_name' ,this.componentDetails['group']['sysID']) + '_' + this.serverJSON['u_suha_metric_definition']['u_name'];
		this.logger.info(logPrefix + JSON.stringify(output));
		return output;



	},




	createSUHAComponents : function(){
		this._createDataSource();
		this._createMetricDefinition();
		this._createGroupMetricDefinition();

		//return this.serverJSON;

	},


	type: 'SUHAComponentsCreatorV2'
};