/* 
 * JS for WBW No Bases using Mapbox 
 *
 * some available marker images:
 *
 * https://worldbeyondwar.org/wp-content/uploads/2020/09/war96.png
 * https://worldbeyondwar.org/wp-content/uploads/2020/09/nuclear96.png
 * https://worldbeyondwar.org/wp-content/uploads/2020/09/bomb96.png
 * https://worldbeyondwar.org/wp-content/uploads/2020/09/water-pollution96.png
 * https://worldbeyondwar.org/wp-content/uploads/2020/09/air-pollution96.png
 * https://worldbeyondwar.org/wp-content/uploads/2020/09/air96.png
 * https://worldbeyondwar.org/wp-content/uploads/2020/09/army96.png
 * https://worldbeyondwar.org/wp-content/uploads/2020/09/WBW-globe-50.png
 * https://worldbeyondwar.org/wp-content/uploads/2020/09/wbw-mapbox-darkblue-pin.png
 * https://worldbeyondwar.org/wp-content/uploads/2020/09/wbw-mapbox-brightorange-pin.png
 * https://worldbeyondwar.org/wp-content/uploads/2020/09/wbw-death-pin.png
 * https://worldbeyondwar.org/wp-content/uploads/2020/09/wbw-megaphone-pin.png
 */

// get query string parameters or use defaults

var urlParams = new URLSearchParams(window.location.search);

let thisZoom = 12;
let thisPitch = 0;
let thisBearing = 0;
let selectCountry = "";

if (urlParams.has('pitch')) {
  thisPitch = urlParams.get('pitch');
} 
if (urlParams.has('bearing')) {
  thisBearing = urlParams.get('bearing');
} 
if (urlParams.has('country')) {
  selectCountry = urlParams.get('country');
} 

// json data sources

const markersUrl = 'https://worldbeyondwar.org/wp-content/themes/hello-elementor-child/js/wbw-bases-data.json';
const countriesUrl = 'https://worldbeyondwar.org/wp-content/themes/hello-elementor-child/js/wbw-bases-countries-data.json';

// access token and global map

mapboxgl.accessToken = 'pk.eyJ1IjoibWFyY2VsaW90c3RlaW4iLCJhIjoiY2tqaXBhbHV5MWd3NTJ4bXN1bjJ5OW9hcSJ9.vJlT4dFRbI5IJ94naPA-0Q';

var wbwMap;

// lookup data for countries

let personnelByCountry = [];
let landByCountry = [];
let governmentTypeByCountry = [];

// list of countries 

let allCountries = [];

// complete data set

var wbwBaseMarkers =
{
   "type": "FeatureCollection",
   "features": []
}

// current selection is a subset of complete data set

var wbwSelectedMarkers =
{
   "type": "FeatureCollection",
   "features": []
}

// add satellite at this zoom or above level 

let satelliteZoom = 5;
let rasterLayerActive = "map";

// global variables for map, dashboard, markers and current selection

let numCountries = 0;
let numMarkers = 0;
let numInvalidMarkers = 0;
let numSelectedMarkers = 0;
let series = new Array;
let keylist = new Array;
let mi = 0;
let seriesInitialized = false;
let currentSelectionType = 'all';
let currentSelectionVal = 'all';

// globals for current marker

let thisLng = 0;
let thisLat = 0;
let thisCountryName = '';
let thisBaseName = '';
let thisBaseKey = '';

// panel blocks for dashboard

let dashHeaderBlock = '<div id="wbw-bases-dash-header">Learn About US Military Bases <img src="https://worldbeyondwar.org/wp-content/uploads/2020/09/wbw-logo-small-black-trans.png" /></div>' + 'Navigate map and click on markers to learn about each military base. Refine your selection with optional controls.';

let dashQueryBlock = '<div id="wbw-bases-dash-query-block"></div>';
	
let dashSelectionBlock = '<div id="wbw-bases-dash-selection-block"></div>';

let dashResultsBlock = '<div id="wbw-bases-dash-results-block"></div>';

let dashMapControlBlock = '<div id="wbw-bases-dash-map-control-block"></div>';

// HTML fragments for dashboard

let dashQueryHTML = '<button id="button-country" class="whitebutton" onclick="switchSelectionPanel(\'country\')">Country</button>' +
	            '<button id="button-governmenttype" class="whitebutton" onclick="switchSelectionPanel(\'governmenttype\')">Government Type</button>' +
	            '<button id="button-openingdate" class="whitebutton" onclick="switchSelectionPanel(\'openingdate\')">Opening Date</button>' +
	            '<button id="button-personnel" class="whitebutton" onclick="switchSelectionPanel(\'personnel\')">Personnel</button>' +
	            '<button id="button-land" class="whitebutton" onclick="switchSelectionPanel(\'land\')">Total Land</button>';

let dashCurrentQueryHTML = 'Showing all bases';

let dashResultsNextHTML = '<button class="whitebutton" onclick="visitBaseFromSeries()">Visit Next Result &raquo;</button> </div>';

let dashSelectionCountryHTML = '<select id="querycountry" onchange="runQueryCountry()">' +
	                       '<option value="none">Select</option>';

let dashSelectionPersonnelHTML = '<select id="querypersonnel" onchange="runQueryPersonnel()">' +
	                         '<option value="none">Select</option>' +
                                 '<option value="small">Less than 100</option>' +
                                 '<option value="large">100 or more</option>' +
                                 '<option value="unknown">Unknown</option>' +
	                         '</select>';

let dashSelectionLandHTML = '<select id="queryland" onchange="runQueryLand()">' +
	                    '<option value="none">Select</option>' +
                            '<option value="small">Less than 1000 acres</option>' +
                            '<option value="medium">1000 to 9999 acres</option>' +
                            '<option value="large">10000 or more acres</option>' +
                            '<option value="unknown">Unknown</option>' +
	                    '</select>';

let dashSelectionOpeningDateHTML = '<select id="queryopeningdate" onchange="runQueryOpeningDate()">' +
	                           '<option value="none">Select</option>' +
                                   '<option value="1940s">Before 1950</option>' +
                                   '<option value="1950s">1950 to 1959</option>' +
                                   '<option value="1960s">1960 to 1969</option>' +
                                   '<option value="1970s">1970 to 1979</option>' +
                                   '<option value="1980s">1980 to 1989</option>' +
                                   '<option value="1990s">1990 to 1999</option>' +
                                   '<option value="2000s">2000 to 2009</option>' +
                                   '<option value="2010s">2010 to 2019</option>' +
                                   '<option value="2020s">2020 and after</option>' +
                                   '<option value="">Unknown</option>' +
	                           '</select>';

let dashSelectionGovernmentTypeHTML = '<select id="querygovernmenttype" onchange="runQueryGovernmentType()">' +
	                              '<option value="none">Select</option>' +
	                              '<option value="Full Democracy">Full democracy</option>' +
                                      '<option value="Flawed Democracy">Flawed democracy</option>' +
                                      '<option value="Authoritarian">Authoritarian</option>' +
                                      '<option value="Hybrid Regime">Hybrid regime</option>' +
                                      '<option value="US Colony">US colony</option>' +
                                      '<option value="British Colony">British colony</option>' +
                                      '<option value="Dutch Colony">Dutch colony</option>' +
                                      '<option value="Danish Colony">Danish colony</option>' +
	                              '</select>';

let dashMapControlHTML = '<table width="100%" id="wbw-bases-dash-map-control"><tr><td width="60%" style="text-align:left"><button class="whitebutton" onclick="switchRaster(\'map\')">Map</button> <button class="whitebutton" onclick="switchRaster(\'satellite\')">Satellite</button></td><td width="40%" style="text-align:right"><button class="whitebutton" onclick="resetAll()">Reset Selections</a></td></tr></table>';

//let dashSelectionRegionHTML = '<button onclick="flyAnywhere(24,-14 )">Africa</button> <button onclick="flyAnywhere(108,14)">Asia</button> <button onclick="flyAnywhere(133,-25)">Australia</button> <button onclick="flyAnywhere(25,34)">Europe</button> <button onclick="flyAnywhere(-98,45)">North America</button> <button onclick="flyAnywhere(-63,-30)">South America</button>';

// map layer functions

function addSatellite() {
  if (rasterLayerActive!="satellite") {
    wbwMap.addLayer({
      id: 'satellite',
      source: {"type": "raster",  "url": "mapbox://mapbox.satellite", "tileSize": 256},
      type: "raster"
    });
 
    wbwMap.addLayer({
      'id': 'sky',
      'type': 'sky',
      'paint': {
        'sky-type': 'atmosphere',
        'sky-atmosphere-sun': [0.0, 0.0],
        'sky-atmosphere-sun-intensity': 15
      }
    });
    rasterLayerActive="satellite";
  }
}

function removeSatellite() {
  if (rasterLayerActive=="satellite") {
    wbwMap.removeLayer('sky');
    wbwMap.removeLayer('satellite');
    wbwMap.removeSource('satellite');
    rasterLayerActive="map";
  }
}

function switchRaster(switchTo) {
  if (switchTo=="satellite") {
    addSatellite();
  } else if (switchTo=="map") {
    removeSatellite();
  }
}

// process dashboard selection by running query and/or displaying secondary selection panel 

function switchSelectionPanel(switchTo) {

  // remove previous selection from dashboard
	
  if (currentSelectionType=='country') {
    jQuery("#button-country").removeClass('whitebutton-active');
    jQuery("#button-country").addClass('whitebutton');
  } else if (currentSelectionType=='personnel') {
    jQuery("#button-personnel").removeClass('whitebutton-active');
    jQuery("#button-personnel").addClass('whitebutton');
  } else if (currentSelectionType=='land') {
    jQuery("#button-land").removeClass('whitebutton-active');
    jQuery("#button-land").addClass('whitebutton');
  } else if (currentSelectionType=='openingdate') {
    jQuery("#button-openingdate").removeClass('whitebutton-active');
    jQuery("#button-openingdate").addClass('whitebutton');
  } else if (currentSelectionType=='governmenttype') {
    jQuery("#button-governmenttype").removeClass('whitebutton-active');
    jQuery("#button-governmenttype").addClass('whitebutton');
  } else if (currentSelectionType=='region') {
    jQuery("#button-region").removeClass('whitebutton-active');
    jQuery("#button-region").addClass('whitebutton');
  }

  // activate new selection in dashboard

  if (switchTo=='country') {
    jQuery("#wbw-bases-dash-selection-block").html(dashSelectionCountryHTML);
    jQuery("#button-country").removeClass('whitebutton');
    jQuery("#button-country").addClass('whitebutton-active');
    currentSelectionType = 'country';
  } else if (switchTo=='personnel') {
    jQuery("#wbw-bases-dash-selection-block").html(dashSelectionPersonnelHTML);
    jQuery("#button-personnel").removeClass('whitebutton');
    jQuery("#button-personnel").addClass('whitebutton-active');
    currentSelectionType = 'personnel';
  } else if (switchTo=='land') {
    jQuery("#wbw-bases-dash-selection-block").html(dashSelectionLandHTML);
    jQuery("#button-land").removeClass('whitebutton');
    jQuery("#button-land").addClass('whitebutton-active');
    currentSelectionType = 'land';
  } else if (switchTo=='openingdate') {
    jQuery("#wbw-bases-dash-selection-block").html(dashSelectionOpeningDateHTML);
    jQuery("#button-openingdate").removeClass('whitebutton');
    jQuery("#button-openingdate").addClass('whitebutton-active');
    currentSelectionType = 'openingdate';
  } else if (switchTo=='governmenttype') {
    jQuery("#wbw-bases-dash-selection-block").html(dashSelectionGovernmentTypeHTML);
    jQuery("#button-governmenttype").removeClass('whitebutton');
    jQuery("#button-ogovernmentype").addClass('whitebutton-active');
    currentSelectionType = 'governmenttype';
  }
  
  // if this selection doesn't depend on a secondary selection, run query
	
  if (currentSelectionType=='all') {
    runQuery('all','all');
  }

  // display current query and next button in results block
	
  updateDashboardResults();

}

// load up current marker

function loadCurrentMarker() {
  thisLng = wbwSelectedMarkers.features[mi].geometry.coordinates[0];
  thisLat = wbwSelectedMarkers.features[mi].geometry.coordinates[1];
  thisCountryName = wbwSelectedMarkers.features[mi].properties.country;
  thisBaseName = wbwSelectedMarkers.features[mi].properties.baseName;
  thisBaseKey = wbwSelectedMarkers.features[mi].properties.baseKey;
  thisDescrip = wbwSelectedMarkers.features[mi].properties.descrip;
  thisPersonnel = personnelByCountry[thisCountryName];    
  thisLand = landByCountry[thisCountryName];    
  thisGovernmentType = governmentTypeByCountry[thisCountryName];    
}

// reset to initial dashboard screen and fly to europe

function resetAll() {
  thisBaseName = '';
  thisCountryName = '';
  jQuery('.mapboxgl-popup').remove();
	console.log("resetAll: remove all popups");
  removeSatellite();
  drawDashboard();
  flyAnywhere(25,34); // europe
}

// move to a specific position in series

function moveInSeries(moveTo) {
  if ((moveTo>=0) && (moveTo<numSelectedMarkers)) {
    mi = moveTo;
    loadCurrentMarker();
  } else {
    console.log("moveInSeries: invalid move to " + moveTo);
  }
}

// move to next position in series
// if we reach the end of series, loop back to first position

function nextInSeries() {
  if (numSelectedMarkers>0) {
    mi++;
    if (mi>=numSelectedMarkers) {
      mi = 0;
    }
    loadCurrentMarker();
  }
}

// move with visual fly effect without changing current marker

function flyAnywhere(newLng,newLat) {
  wbwMap.flyTo({
    center: [ newLng, newLat ], 
    zoom: 2,
    pitch: thisPitch,
    duration: 6000,
    bearing: thisBearing, 
    essential: true
  });
}

// draw initial dashboard 

function drawDashboard() {
  dashboardHTML = dashHeaderBlock +
	          dashQueryBlock +
                  dashSelectionBlock +
	          dashResultsBlock +
	          dashMapControlBlock;
  jQuery("#wbw-wide-map-dashboard").html(dashboardHTML);
  jQuery("#wbw-bases-dash-query-block").html(dashQueryHTML);
  jQuery("#wbw-bases-dash-selection-block").html('');
  jQuery("#wbw-bases-dash-map-control-block").html(dashMapControlHTML);
  updateDashboardResults();
}

// update dashboard results block

function updateDashboardResults() {
  jQuery("#wbw-bases-dash-results-block").html("<b>" + dashCurrentQueryHTML + "</b><br />" + dashResultsNextHTML);
}

// check valid coordinates

function validateMarker(lng,lat,country,key) {
  if (key.length<=0) {
    console.log("missing key for marker");
    return false;
  }
  if (country.length<=0) {
    console.log("missing country for marker");
    return false;
  }
  if (isNaN(lng) || (isNaN(lat))) {
    //console.log("missing coordinates: " + country + " " + key + " " + lng + " " + lat);
    return false;
  }
  try {
    let testLngLat = new mapboxgl.LngLat(lng,lat);
  } catch (e) {
    console.log("invalid coordinates: " + country + " " + key + " " + lng + " " + lat);
    console.log(e);
    return false;
  }
  return true;
}

// top level validation check including error message

function verifyCoordinates() {

  let validMarker = true;

  if (!validateMarker(thisLng,thisLat,thisCountryName,thisBaseKey)) {
    validMarker = false;
  } else if ((thisLng==0) && (thisLat==0)) {
    console.log("illegal coordinates for " + thisBaseKey + " mi=" + mi + " " + thisCountryName + " " + thisBaseKey + " " + thisLng + " " + thisLat);
    validMarker = false;
  }
  return(validMarker);
}

// create popup for marker and display info on panel

function createPopup(e) {
  console.log("in createPopup !!!!!!");
  const coordinates = e.features[0].geometry.coordinates.slice();

  // get marker data from clicked feature
		  
  const baseName = e.features[0].properties.baseName;
  const countryName = e.features[0].properties.country;
  const baseKey = e.features[0].properties.baseKey;

  let displayOpeningDate = '';
  let displayGovernmentType = '';
  let displayPersonnelEst = '';
  let displayTotalLand =  '';
  let militaryConstructionFunding =  '';
  let displayProtests =  '';
  let displayEnvironmentalDamage =  '';
  let displayCrime =  '';
  let displayOtherIssues =  '';
  let displaySources =  '';
  let displayActivities =  '';
  let displayArticles =  '';

  if (e.features[0].properties.openingDate) {
    displayOpeningDate = "Opening Date: " + e.features[0].properties.openingDate + "<br />";
  }
  if (e.features[0].properties.militaryConstructionFunding) {
    displayMilitaryConstructionFunding = "Military Construction Funding: " + e.features[0].properties.militaryConstructionFunding + "<br />";
  }
  if (e.features[0].properties.protests) {
    displayProtests = "Protests: " + e.features[0].properties.protests + "<br />";
  }
  if (e.features[0].properties.environmentalDamage) {
    displayEnvironmentalDamage = "Environmental Damage: " + e.features[0].properties.environmentalDamage + "<br />";
  }
  if (e.features[0].properties.crime) {
    displayCrime = "Crime: " + e.features[0].properties.crime + "<br />";
  }
  if (e.features[0].properties.otherIssues) {
    displayOtherIssues = "Other Issues: " + e.features[0].properties.otherIssues + "<br />"; 
  }
  if (e.features[0].properties.sources) {
    displaySources = "<br />Sources: " + e.features[0].properties.sources + "<br />";
  }
  if (e.features[0].properties.activities) {
    displayActivities = "Activities: " + e.features[0].properties.activities + "<br />";
  }
  displayGovernmentType = "Government Type: " + governmentTypeByCountry[countryName] + "<br />";
  displayPersonnelEst = "Personnel (estimated) in " + countryName + ": " + personnelByCountry[countryName] + "<br />";
  displayTotalLandEst = "Total Land (estimated) in " + countryName + ": " + landByCountry[countryName] + "<br />";
  displayArticles = 'Articles about ' + baseName + ' or other bases in ' + countryName + ':<br />';

  let baseInfo = '<div id="wbw-bases-dash-info-name">' + baseName + ' (' + countryName + ')</div>' + displayPersonnelEst + displayTotalLandEst + displayGovernmentType + displayOpeningDate + militaryConstructionFunding + displayProtests + displayEnvironmentalDamage + displayCrime + displayOtherIssues + displaySources + displayActivities + displayArticles;

  const thisBasePopupHTML = baseInfo;

  // deal with multiple copies at similar coordinates
		  
  while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
  }

  // create popup
		  
  const thisPopup = new mapboxgl.Popup()
                                .setLngLat(coordinates)
	                        .setMaxWidth("400px")
                                .setHTML(thisBasePopupHTML)
                                .addTo(wbwMap);
	console.log("createPopup: creating new popup for " + baseName);

  visitBaseFromMarker(baseKey);
}

//
// add markers to series for display, ignoring invalid entries
//
// mi is a marker index for the current selection
// keylist is a hash of base keys for the current selection mapped to marker indices
//


function createMarkerSeries(seriesType,seriesVal) {
  mi = 0;
  listHTML = "";

  // reset previous selection 
	
  if (seriesInitialized) {
    numSelectedMarkers = 0;
    wbwSelectedMarkers.features.length = 0;
  }
	  
  wbwBaseMarkers.features.forEach(function(marker) {
    let baseKey = marker.properties.baseKey;
    let baseName = marker.properties.baseName;
    let countryName = marker.properties.country;
    let coordinates = marker.geometry.coordinates;
    let lng = marker.geometry.coordinates[0];
    let lat = marker.geometry.coordinates[1];
    let openingDate = parseInt(marker.properties.openingDate);

    // collect list of unique countries and country buttons

    if (!allCountries.includes(countryName)) {
      allCountries.push(countryName);
      dashSelectionCountryHTML += '<option value="' + countryName + '">' + countryName + '</option>';
    } 
	  
    // does marker belong in current series?
	
    let include = false;
    if (seriesType=='country') {
      if (countryName==seriesVal) {
        include = true;
      }
    } else if (seriesType=='personnel') {
      let personnelEst = personnelByCountry[countryName];

      if (typeof personnelEst === 'number') {
	// valid data found for personnel
        if (seriesVal=="Less than 100") {
	  if (personnelEst < 100) {
	    include = true;
	  } 
	} else if (seriesVal=="100 or more") {
	  if (personnelEst > 100) {
	    include = true;
	  } 
	}
      } else {
	// no valid data for personnel
        if (seriesVal=="unknown") {
          include = true;
	}
      }
    } else if (seriesType=='land') {
      let landEst = parseInt(landByCountry[countryName]);
	    
      if (typeof landEst === 'number') {
	// valid data found for land
	if (seriesVal=="10000 or more acres") {
	  if (landEst > 10000) {
	    include = true;
	  } 
	} else if (seriesVal=="1000 to 9999 acres") {
	  if (landEst > 1000) {
	    include = true;
	  } 
	} else if (seriesVal=="Less than 1000 acres") {
	  if (landEst < 1000) {
	    include = true;
	  } 
	}
      } else {
	// no valid data for land
        if (seriesVal=="unknown") {
          include = true;
	}
      }
    } else if (seriesType=='openingdate') {
      if (openingDate) {
        if (typeof openingDate === 'number') {
  	  // valid data found for date
  	  if (seriesVal=="2020 and after") {
	    if (openingDate >= 2020) {
	      include = true;
	    } 
	  } else if (seriesVal=="2010 to 2019") {
	    if (openingDate >= 2010) {
	      include = true;
	    } 
	  } else if (seriesVal=="2000 to 2009") {
	    if (openingDate >= 2000) {
	      include = true;
	    } 
	  } else if (seriesVal=="1990 to 1999") {
	    if (openingDate >= 1990) {
	      include = true;
	    } 
	  } else if (seriesVal=="1980 to 1989") {
	    if (openingDate >= 1980)  {
	      include = true;
	    } 
	  } else if (seriesVal=="1970 to 1979") {
	    if (openingDate >= 1970) {
	      include = true;
	    } 
	  } else if (seriesVal=="1960 to 1969") {
	    if (openingDate >= 1960) {
	      include = true;
	    } 
  	  } else if (seriesVal=="1950 to 1959") {
  	    if (openingDate >= 1950) {
	      include = true;
	    } 
	  } else if (seriesVal=="Before 1950") {
	    if (openingDate < 1950) {
	      include = true;
	    } 
	  }
	}
      } else {
	// no valid data for date
        if (seriesVal=="unknown") {
          include = true;
	}
      }
    } else if (seriesType=='governmenttype') {
      if (governmentTypeByCountry[countryName]==seriesVal) {
        include = true;
      }
    } else { // no valid selectType, include all 
      include = true;
    }

    if (include) {
      wbwSelectedMarkers.features.push(marker);
	    console.log("adding " + countryName + " " + baseName + " to wbwSelectedMarkers with length " + wbwSelectedMarkers.features.length);
      let listline = baseKey + " " + mi + " " + countryName + " " + baseName + " type " + lng + " " + lat;
      listHTML += listline + "<br />";
      numSelectedMarkers++;
      keylist[baseKey] = mi;
      mi++;
    }
  });

  // close out the country select list
  
  dashSelectionCountryHTML += '</option>';

  // reset previous map structures
	
  if (seriesInitialized) {
    wbwMap.removeLayer('base-points');
    wbwMap.removeSource('base-points');
	console.log("removing base points <<<<<<<<<<<<<<<<<<<<<<<<<<");
  }

  // add symbol layer containing selected layers to map

	console.log("adding base points >>>>>>>>>>>>: size of wbwSelectedMarkers is " + wbwSelectedMarkers.features.length);
  wbwMap.addSource('base-points', {
    'type': 'geojson',
    'data': wbwSelectedMarkers
  });

  wbwMap.addLayer({
    'id': 'base-points',
    'type': 'symbol',
    'source': 'base-points',
    'layout': {
      'icon-image': 'custom-base-marker',
      'icon-allow-overlap': true,
    }
  });

  wbwMap.on('click', 'base-points', (e) => {
	  console.log("base-points click is clicked!");
    createPopup(e);
  });

  wbwMap.on('mouseleave', 'base-points', () => {
    wbwMap.getCanvas().style.cursor = '';
  });
  seriesInitialized = true;

  // display list view
	
  jQuery("#wbw-no-bases-list-view").html(listHTML);
  console.log("createMarkerSeries: " + seriesType + " " + seriesVal + " valid: " + numMarkers + " invalid: " + numInvalidMarkers);

  // reset series index to begin traversing at beginning of series 

  mi = 0;
}

// run a new query

function runQuery(type=null,val=null) {
  if (!type) {
    type = 'all';
    val = 'all';
  }
  currentSelectionType = type;
  currentSelectionVal = val;
  createMarkerSeries(type,val);
  if (type=="all") {
    dashCurrentQueryHTML = "Showing all " + numSelectedMarkers + "results";
  } else {
    if (type=="country") {
      dashCurrentQueryHTML = numSelectedMarkers + " results found for Country: " + val;
    } else if (type=="governmenttype") {
      dashCurrentQueryHTML = numSelectedMarkers + " results found for Government Type: " + val;
    } else if (type=="openingdate") {
      dashCurrentQueryHTML = numSelectedMarkers + " results found for Opening Date: " + val;
    } else if (type=="personnel") {
      dashCurrentQueryHTML = numSelectedMarkers + " results found for Personnel in Country (est.):" + val;
    } else if (type=="land") {
      dashCurrentQueryHTML = numSelectedMarkers + " results found for Total Land in Country (est.): " + val;
    }
  }
  updateDashboardResults;
  visitBaseFromSeries();
}

// get values to run queries

function runQueryCountry() {
  let val = jQuery("#querycountry option:selected").text();
  if (val!="none") {
    runQuery("country",val);
  }
}

function runQueryGovernmentType() {
  let val = jQuery("#querygovernmenttype option:selected").text();
  if (val!="none") {
    runQuery("governmenttype",val);
  }
}

function runQueryOpeningDate() {
  let val = jQuery("#queryopeningdate option:selected").text();
  if (val!="none") {
    runQuery("openingdate",val);
  }
}

function runQueryPersonnel() {
  let val = jQuery("#querypersonnel option:selected").text();
  if (val!="none") {
    runQuery("personnel",val);
  }
}

function runQueryLand() {
  let val = jQuery("#queryland option:selected").text();
  if (val!="none") {
    runQuery("land",val);
  }
}

//
// travel to designated marker
//
// this function always sets all global variables for the new marker
//

function visitBase(mi=-1) {
	console.log("in visitBase mi is " + mi);

  // move to new position or next position in series

  if (mi >= 0) {
    moveInSeries(mi);
  } else {
    nextInSeries();
  } 

  // adjust settings based on marker type and series type
 
  if (mi==0) {
    thisZoom = 5;
  } else if (currentSelectionType=='country') {
    thisZoom = 7;
  } else if ((currentSelectionType=='governmenttype') ||
             (currentSelectionType=='openingdate') ||
             (currentSelectionType=='personnel') || 
             (currentSelectionType=='land')) { 
    thisZoom = 6;
  } else {
    thisZoom = 12;
  }

  // start with plain map view 

  removeSatellite();

  // slow fly 

  if (verifyCoordinates()) {
    wbwMap.flyTo({
      center: [ thisLng, thisLat ], 
      zoom: thisZoom,
      pitch: thisPitch,
      duration: 6000,
      bearing: thisBearing, 
      essential: true
    });
  }

  // if close view, add satellite 

  if (thisZoom > satelliteZoom) {
    addSatellite();
  }

  // update dashboard 
	
  updateDashboardResults();
}

// visit base from dashboard control

function visitBaseFromSeries(mi=-1) {
  jQuery('.mapboxgl-popup').remove();
	console.log("visitbasefromseries: removing popup");
  visitBase(mi);
}

// visit base by clicking on marker

function visitBaseFromMarker(baseKey) {
  newSeriesIndex = keylist[baseKey];
  visitBase(newSeriesIndex);
}

// cleanup incoming numerical data string

function cleanNumberString(i) {
  s = " " + i;
  let j = s.replaceAll(',','');
  let k = j.replaceAll(' ','');
  return k;
}

// callback function for country data

async function fetchCountryDataAndRun() {
  numCountries = 0;

  const countriesResponse = await fetch(countriesUrl);
  if (!countriesResponse.ok) {
    const message = `An error has occurred: ${countriesResponse.status}`;
    throw new Error(message);
  }

  const countriesData = await countriesResponse.json();
  countriesData.forEach(function(thisItem) {
    let countryName = thisItem.countryName;
    if (countryName) {
      let personnelEst = thisItem.personnelEst;
      let landEst = cleanNumberString(thisItem.landEst); 
      let governmentType = thisItem.governmentType; 

      personnelByCountry[countryName] = personnelEst;
      landByCountry[countryName] = landEst;
      governmentTypeByCountry[countryName] = governmentType;
      numCountries++;
    }
  });
  console.log("numCountries is " + numCountries);
  fetchBaseDataAndRun();
} 

// callback function to load main data source and then do everything else 

async function fetchBaseDataAndRun() {
  numMarkers = 0;

  // next load up bases data
	
  const basesResponse = await fetch(markersUrl);
  if (!basesResponse.ok) {
    const message = `An error has occurred: ${basesResponse.status}`;
    throw new Error(message);
  }

  const basesData = await basesResponse.json();
  basesData.features.forEach(function(thisItem) {
    let baseKey = thisItem.properties.baseKey;
    let baseName = thisItem.properties.baseName;
    let country = thisItem.properties.country;
    let coordinates = thisItem.geometry.coordinates;
    let lng = thisItem.geometry.coordinates[0];
    let lat = thisItem.geometry.coordinates[1];

    if (validateMarker(lng,lat,country,baseName)) {
      numMarkers++;
      wbwBaseMarkers.features.push(thisItem);
    } else {
      numInvalidMarkers++;
    }
  });

  // set up markers, dashboard and event handlers 
	
  if (numMarkers) {

    // asynchronously load marker image 

    wbwMap.loadImage('https://worldbeyondwar.org/wp-content/uploads/2022/09/wbw-mapbox-darkblue30-pin.png', 
	             (error, image) => {
      if (error) { 
	console.log("loadImage error");
	throw error;
      }
      wbwMap.addImage('custom-base-marker', image);
	   
      // define a selection for display and draw markers
			     
      createMarkerSeries('all','all');
      currentSelectionType = 'all';

      // add map features, resize, add logo

      wbwMap.setFog({
        "range": [0.8, 8],
        "color": "#dc9f9f",
        "horizon-blend": 0.5,
        "high-color": "#245bde",
        "space-color": "#000000",
        "star-intensity": 0.15
      });

      wbwMap.resize();

      jQuery(".mapboxgl-ctrl-bottom-left .mapboxgl-ctrl").html("<a href=\"https://worldbeyondwar.org\"><img width=\"80px\" src=\"https://worldbeyondwar.org/wp-content/uploads/2020/09/wbw-logo-small-black-trans.png\"></a>");

      // draw initial dashboard and fly to initial position on map
			     
      resetAll();
    });
  }
}

// 
// start here - create base map, then call async function to load data and manage display
//

let thisContainer = "wbw-wide-map";

jQuery(document).ready(function() {

  wbwMap = new mapboxgl.Map({
    container: thisContainer,
    style: 'mapbox://styles/marceliotstein/ckme0w4351bmp17pdpq8qkyvy',
    center: [thisLng,thisLat],
    pitch: thisPitch,
    bearing: thisBearing,
    zoom: thisZoom,
    projection: 'globe'
  });

  // add controls 

  wbwMap.addControl(new mapboxgl.NavigationControl());

  // build map
	
  wbwMap.on('load', function() {
    jQuery("#wbw-wide-map").show();

    // asynchronously load all data files
		     
    fetchCountryDataAndRun().catch(error => {
      console.log("data error: " + error.message);
      error.message;
    });
    console.log("returned from fetchdata");
  });
});

// end
