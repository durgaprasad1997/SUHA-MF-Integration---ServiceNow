var SUHAMFMetricTemplateFormatter = Class.create();
SUHAMFMetricTemplateFormatter.prototype = {
    initialize: function() {
    },
	logger : new CidLogger('SUHAMFMetricTemplateFormatter', SUHAConsts.LOGGER.TRACE, SUHAConsts.LOGGER.SOURCE),
	
	
	//globalClientJSON is the standard template a client UI renderable JSON
	globalClientJSON : {
		name : 'metricName',
		label : 'metricLabel',
		isCustom : 'false',
		tableSysID : '',
		tableName : {displayValue:'',value:''},
		tableColumns : [],
		aggregation : {
			'1':'COUNT',
			'2':'SUM',
			'3':'MIN',
			'4':'MAX',
			'5':'AVG'
		},
		category : 'Other',
		direction : SUHAConsts.METRIC.DIRECTION.NONE,
		defaultAggregation : '1',
		breakdown : true,
		nestedBreakdown : false,
		needSecondBreakdown : false,
		breakdown1 : { name : 'u_breakdown', label : 'Breakdown'},
		breakdown2 : null,
		collectionFrequency : {
			'1':'5 minutes',
			'2':'30 minutes',
			'3':'Hourly',
			'4':'Daily',
			'5':'Weekly'
		},
		isCustomBreakdown : false,
		defaultFrequency : '4',
		unit : {displayValue:'',value:''},
		onboardState : null,
		isSelected : true,
		aggregateBreakdown : false,
		baseTableName : ''

	},

	//A Clone function
	_jsonCopy : function(src) {
		return JSON.parse(JSON.stringify(src));
	},
	
	
	//creates a Metric related JSON from a standard template JSON with provided changes 
	createClientJSON : function(objInstance) {
		var logPrefix = 'createClientJSON: ';
		
		var metricsOfTable = [];
		for( var noOfMetrics = 0 ; noOfMetrics < objInstance.length ; noOfMetrics++){
			var clientJSON = this._jsonCopy(this.globalClientJSON);
			for(var instance in objInstance[noOfMetrics] ){
				clientJSON[instance]=objInstance[noOfMetrics][instance];
			}
			metricsOfTable.push(clientJSON);
			
			
		}
		this.logger.info(logPrefix +'client JSON for a given standard metric :\n' + JSON.stringify(metricsOfTable));
		return metricsOfTable;

	},

    type: 'SUHAMFMetricTemplateFormatter'
};