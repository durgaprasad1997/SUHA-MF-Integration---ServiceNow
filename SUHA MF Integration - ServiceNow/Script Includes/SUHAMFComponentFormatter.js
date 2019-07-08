var SUHAMFComponentFormatter = Class.create();
SUHAMFComponentFormatter.prototype = {
	initialize: function() {
	},

	logger : new CidLogger('SUHAMFComponentFormatter', SUHAConsts.LOGGER.TRACE, SUHAConsts.LOGGER.SOURCE),


	//globalServerJSON is the standard template for creating SUHA components
	globalServerJSON :  {
		dsAggregation : {
			aggregation : 'COUNT',
			group : false,
			aggregation_field : ''
		},
		ds: {
			sourceTable: '',
			frequency : 'Daily',
			isAggregated: 'true'
		},
		metric: {
			name: 'duration',
			unit: '#'
		},
		group: {
			sysID: ''
		},
		gm: {
			breakdown : true,
			isCustomBreakdown : false,
			needSecondBreakdown : false,
			nestedBreakdown : false,
			breakdown1: { name :'u_breakdown', label : 'Breakdown'},
			breakdown2: null
		}
	},

	//A Clone function
	_jsonCopy : function(src) {
		return JSON.parse(JSON.stringify(src));
	},


	//creates a Metric related JSON from a standard template JSON with provided changes 
	createServerJSON : function(scope, service, objInstance) {
		
		var logPrefix = 'createServerJSON :';

		var iRList = [];
		for( var noOfMetrics = 0 ; noOfMetrics < objInstance.length ; noOfMetrics++){

			var iRObj = this._jsonCopy(this.globalServerJSON);
			var metric = objInstance[noOfMetrics];

			if( !gs.nil(metric.defaultAggregation))  {
				iRObj.ds.isAggregated =  true;
				iRObj.dsAggregation.aggregation = metric.aggregation[metric.defaultAggregation];
				iRObj.dsAggregation.aggregation_field = metric.selectedColumn;
				iRObj.dsAggregation.group = false;
			} else 
				iRObj.ds.isAggregated = false;
			

			iRObj.ds.sourceTable = metric.tableSysID ;
			iRObj.ds.frequency =  metric.collectionFrequency[metric.defaultFrequency];
			
			//iRObj['dataSource']['isAggregated'] =  true;
			iRObj.metric.name = metric.name;
			iRObj.metric.unit = metric.unit.value;
			iRObj.metric.direction = metric.direction;
			iRObj.metric.category = metric.category;


			iRObj.group.sysID = service;

			var selectedColumn = metric.selectedColumn;
			var selectedStates = metric.selectedStates;
			if(selectedColumn &&  selectedStates) {
				iRObj.additionalInfo = {};
				iRObj.additionalInfo.field = selectedColumn;
				iRObj.additionalInfo.values = selectedStates;
				
			}
			
			iRObj.gm.breakdown1 = metric.breakdown1;
			iRObj.gm.breakdown2 = metric.breakdown2;
			iRObj.gm.column = selectedColumn;	
			iRObj.gm.needSecondBreakdown = metric.needSecondBreakdown;
			iRObj.gm.nestedBreakdown = metric.nestedBreakdown;
			iRObj.gm.isCustomBreakdown = metric.isCustomBreakdown;

			iRList.push(iRObj);
		}
		
		return iRList;

	},

	type: 'SUHAMFComponentFormatter'
};