// DDX Bricks Wiki - See https://developer.domo.com/docs/ddx-bricks
// for tips on getting started, linking to Domo data and debugging your app
 
//Step 1. Select your data from the link in the bottom left corner
 

//Step 2. Style your chart using the following properties 
//--------------------------------------------------
// Properties
//--------------------------------------------------

var excludeLastValue = false;
var valueHeader = '%_MONTH SALES'

var targetValue = 6100000;
var targetLineColor = '#FCCF84';
var targetName = 'Target';

//var yTitle = 'Percentile';
//var xTitle = 'Date';
//Data Column Names
var dateColumnName = 'Date';
var dataValueColumnName = 'Value';
var dateGrouping = "Month"; //"Day", "Month", "Qtr", "Year"


var valueFormat = 'Currency';      //"Currency", "Percentage", "Number"
var valDecimalPlaces = 'None'; //"None", ".0", ".00", ".000", ".0000", ".00000"
var dataLabelText = '%_VALUE';    //"%_VALUE"
var suppressMinMaxAvgLines = true;
var chartMargin = 10;             //space to leave around chart (in pixels)


//--------------------------------------------------
// For ultimate flexibility, modify the code below!
//--------------------------------------------------
 
//Available globals
var domo = window.domo;
var datasets = window.datasets;
var DomoPhoenix = window.DomoPhoenix;
var chartContainer = document.getElementById('myDiv'); //get "myDiv" from the html tab
var chart = null;

var dateAggregationColName = 'Date';
var dategrain = [dateColumnName + ' by day'];

setDateAggregationVars();

//Get the data using the newer Data API: https://www.npmjs.com/package/@domoinc/query
var datasetAlias = datasets[0];
var query = new Query();

query.select([dataValueColumnName, dateColumnName])
	.dateGrain(dateColumnName, dateGrouping)
	.orderBy(dateColumnName, 'desc')
	.limit(25);

// get the query url using the data/v1 endpoint
var queryUrl = query.query(datasetAlias); // data/v1/sales?fields=col1, col2&groupby=col1

// Use domo.get to fetch the data
domo.get(queryUrl).then(function(data){
  
  var popData = getPeriodOverPeriodData(data);
  
  var yearOverYearVal = 0;
  var monthOverMonthVal = 0;
  var vsTargetVal = 0;
  if (popData.length >= 13)
    yearOverYearVal = getPercentValue(popData[popData.length-13][dataValueColumnName], popData[popData.length-1][dataValueColumnName]);
  if (popData.length >= 2)
    monthOverMonthVal = getPercentValue(popData[popData.length-2][dataValueColumnName], popData[popData.length-1][dataValueColumnName]);
  if (targetValue && targetValue > 0)
    vsTargetVal = getPercentValue(targetValue, popData[popData.length-1][dataValueColumnName]);
   
  setPctChangeSpanContent('monthOverMonthSpan', monthOverMonthVal);
  setPctChangeSpanContent('yearOverYearSpan', yearOverYearVal);
  setPctChangeSpanContent('vsTargetSpan', vsTargetVal);
  setValueSpanContent('lastValueSpan', popData[popData.length-1][dataValueColumnName]);
  setValueHdrSpanContent(popData[popData.length - 1]);
  
  chartIt(popData);
});

function setPctChangeSpanContent(spanName, spanValue) {
  
  var span = document.getElementById(spanName);
  if (spanValue < 0)
    span.innerHTML = `<span style="color: #B81914"><b>` + spanValue.toFixed() + `%</span>`;
  else
    span.innerHTML = `<span style="color: #41A462"><b>+` + spanValue.toFixed() + `%</span>`;
}

function setValueSpanContent(spanName, spanValue) {
  
  var span = document.getElementById(spanName);
  var numDecimals = 0;
  if (valDecimalPlaces != 'None')
    numDecimals = valDecimalPlaces.length - 1;
  var formattedVal = Number(parseFloat(spanValue).toFixed(numDecimals)).toLocaleString('en', {
  	minimumFractionDigits: numDecimals
  });
  if (valueFormat == 'Currency')
		span.innerHTML = `<span><b>$` + formattedVal + `</span>`;
  else
		span.innerHTML = `<span><b>` + formattedVal + `</span>`;
}

function setValueHdrSpanContent(lastPointData) {
  
  var span = document.getElementById('lastValueHdrSpan');
  var hdrText = valueHeader;
  if (valueHeader.includes('%_MONTH')) {
    var lastMonthName = getLastMonthName(lastPointData).toUpperCase();
    hdrText = valueHeader.replace('%_MONTH', lastMonthName);
  }
  
  span.innerHTML = `<span>` + hdrText + `</span>`;
}

function getLastMonthName(lastPointData) {
  
  if (lastPointData['month'] == 'Jan')
      return 'January';
  else if (lastPointData['month'] == 'Feb')
      return 'February';
  else if (lastPointData['month'] == 'Mar')
      return 'March';
  else if (lastPointData['month'] == 'Apr')
      return 'April';
  else if (lastPointData['month'] == 'May')
      return 'May';
  else if (lastPointData['month'] == 'Jun')
      return 'June';
  else if (lastPointData['month'] == 'Jul')
      return 'July';
  else if (lastPointData['month'] == 'Aug')
      return 'August';
  else if (lastPointData['month'] == 'Sep')
      return 'September';
  else if (lastPointData['month'] == 'Oct')
      return 'October';
  else if (lastPointData['month'] == 'Nov')
      return 'November';
  else if (lastPointData['month'] == 'Feb')
      return 'December';
  return '';
}



function chartIt(data) {
  // Read more about data types and mappings here: https://domoapps.github.io/domo-phoenix/#/domo-phoenix/api
  var columns = [
    {
      type: DomoPhoenix.DATA_TYPE.STRING,
      name: "month",
      mapping: DomoPhoenix.MAPPING.ITEM
    },
    {
      type: DomoPhoenix.DATA_TYPE.DOUBLE,
      name: dataValueColumnName,
      mapping: DomoPhoenix.MAPPING.VALUE,
      format: getValueFormat()
    },
    {
      type: DomoPhoenix.DATA_TYPE.STRING,
      name: "year",
      mapping: DomoPhoenix.MAPPING.SERIES,
      format: getValueFormat()
    }
  ];

  var propertyOverrides = {
      'suppress_minmaxavg': suppressMinMaxAvgLines,
//      'datalabel_text' : dataLabelText && dataLabelText.length ? dataLabelText : undefined,
//      'title_x' : xTitle,
      'width_percentage': 100,
    	'sm_type': 'Line',
      'sm_line_style': 'Dashed',
      'sm_text': targetName,
      'sm_line_color': targetLineColor,
      'sm_scale_pos': 'Default',
     	'sm_hide_title': true,
      'hide_value_gridlines': true,
  };
  
  if (targetValue && targetValue > 0) {
    propertyOverrides['sm_value'] = targetValue;
    
    
  }
  
  const customColors = [
  	'#DDDDDD',
  	'#000000'
	];

  var domoChartType = DomoPhoenix.CHART_TYPE.CURVED_LINE;

  // Create the Phoenix Chart
  var phoenixData = {columns: columns, rows: data};
  var size = getChartSize();
  chart = new DomoPhoenix.Chart(domoChartType, phoenixData, {
        width: size.width,
        height: size.height,
    		colors: customColors,
        properties: propertyOverrides
  });

  // Append the canvas element to your div
  chartContainer.appendChild(chart.canvas);
  chartContainer.style.padding = `${chartMargin}px ${chartMargin}px 0`;

  // Render the chart when you're ready for the user to see it
  chart.render();
}

function getValueFormat(){
  var valFmt = '###,###';
  if (valDecimalPlaces.toLowerCase() != 'default' && valDecimalPlaces.toLowerCase() != 'none'){
    valFmt += valDecimalPlaces;
  }
  if (valueFormat.toLowerCase() == 'currency'){
    valFmt = '$' + valFmt;
  }
  else if (valueFormat.toLowerCase() == 'percentage'){
    valFmt += '%';    
  }
  return valFmt;
}

function getChartSize(){
  return {
    width: window.innerWidth * .6 - chartMargin * 2,
    height: window.innerHeight - chartMargin * 2,
  };
}

window.addEventListener && window.addEventListener('resize', function(){
  var size = getChartSize();
  chart && chart.resize && chart.resize(size.width, size.height);
});


function getPeriodOverPeriodData(result) {
  
  var data = [];
  var firstIndex = 0;
  if (excludeLastValue)
    firstIndex = 1;
  if (result) {
    var numRows = result.length;
    var currentYear = result[firstIndex][dateAggregationColName].substring(0, 4);
    var prevYear = '';
    for (var index = firstIndex; index < numRows; index++) {
      var year = result[index][dateAggregationColName].substring(0,4);
      var month = result[index][dateAggregationColName].substring(5);
      if (year != currentYear && year != prevYear) {
        if (prevYear != '')
          break;
        prevYear = year;
      }
      
      var dataPoint = {};
      dataPoint['month'] = month;
      dataPoint['year'] = year;
      dataPoint[dataValueColumnName] = result[index][dataValueColumnName]
      data.unshift(dataPoint);                 
    }
  }
  return data;
}
  

function setDateAggregationVars()
{
  if (dateGrouping == "Month"){
    dateAggregationColName = 'CalendarMonth';
    dategrain = [dateColumnName + ' by month'];
  }
  else if (dateGrouping == "Qtr"){
    dateAggregationColName = 'CalendarQuarter';
    dategrain = [dateColumnName + ' by quarter'];
  }
  else if (dateGrouping == "Year"){
    dateAggregationColName = 'Year';
    dategrain = [dateColumnName + ' by year'];
  }
}

function getPercentValue(prevValue, curValue) {
  
  if (prevValue != 0) {
	  var percentValue = ((curValue / prevValue) - 1) * 100.0;
  	if (curValue > prevValue && percentValue < 0)
    	percentValue *= -1;
  	if (curValue < prevValue && percentValue > 0)
    	percentValue *= -1;
  	return percentValue;
  }
  return 0.0;
}



