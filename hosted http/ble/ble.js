/*
A minimal Web Bluetooth connection example

*/

var myDevice;
var myService = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";           // ESP32 BLE service
var myCharacteristic = "beb5483e-36e1-4688-b7f5-ea07361b26a8";    // read from ESP32
var myCharacteristic1 = "beb5483e-36e1-4688-b7f5-ea07361b26a9";   // write to ESP32
var sendCharacteristic = null;
var connected = false;

var data = [];
var tempC = 0.0;
var tempF = 0.0;
var rh = 0.0;
var g;
var samples = 100;
var interval = 5000;
var intervalId;
var units = 0;

let encoder = new TextEncoder('utf-8');
let decoder = new TextDecoder('utf-8');

function connect(){
  navigator.bluetooth.requestDevice({
    // filters: [myFilters]       // filter devices
	filters: [
    {namePrefix: 'Integra'}
  ],
    optionalServices: [myService],
    acceptAllDevices: false
  })
  .then(function(device) {
    // save the device returned so you can disconnect later:
    myDevice = device;
    console.log(device);
	connected = true;
	data = [];
	$("#ble_icon").attr("src","ble/bluetooth.svg");
    // connect to the device once you find it:
    return device.gatt.connect();
  })
  .then(function(server) {
    // get the primary service:
    return server.getPrimaryService(myService);
  })
  .then(function(service) {
    // get the  characteristic:
    return service.getCharacteristics();
  })
  .then(function(characteristics) {
    // subscribe to the characteristic:
    //for (c in characteristics) {
      characteristics[0].startNotifications()
      .then(subscribeToChanges);
    //}
	console.log(characteristics[0]);
	sendCharacteristic = characteristics[1];
	console.log(characteristics[1]);
  })
  .catch(function(error) {
    // catch any errors:
    console.log('Connection failed!', error);
	connected = false;
  });
}

// subscribe to changes from the ESP32:
function subscribeToChanges(characteristic) {
  characteristic.oncharacteristicvaluechanged = handleData;
}

// handle incoming data:
function handleData(event) {
  // get the data buffer from the ESP32:
  var buf = new Uint8Array(event.target.value.buffer);
  //console.log(buf);
  var txt = decoder.decode(buf);
  //console.log(txt);
  processReceivedCommand(txt);
}

function processReceivedCommand(txt) {
	if (txt.includes("temp:")) {
		tempC = txt.substr(5);
		var tempFval = (parseFloat(tempC) *9/5) +32;
		tempFval = tempFval.toFixed(2);
		tempF = tempFval.toString();
		if (units == 0) {
			$("#tms").html(tempC + " °C");
		}
		else {
			$("#tms").html(tempF + " °F");
		}
	}
	 else if (txt.includes("rh:")) {
		rh = txt.substr(3);
		$("#rh").html(rh + " %");
	}
}

function SaveGraphSettingsButtonClicked() {
	samples = parseInt($('#inputNumSamples').val());
	interval = parseInt($('#inputInterval').val());
	units = parseInt($('#tempUnits').val());
	if (samples <= 1000 && samples >= 100 && interval <= 3600000 && interval >= 500) {
		localStorage.setItem('samples', $('#inputNumSamples').val());
		localStorage.setItem('interval', $('#inputInterval').val());
		localStorage.setItem('units', $('#tempUnits').val());
		updateWindowSize();
		data = [];
		clearInterval(intervalId);
		startInterval(interval);
	}
	else {
		alert("Values out of range \nSamples: 100 .. 1000\nInterval: 500 .. 3600000");
	}
}

function startInterval(_interval) {
	intervalId = setInterval(function() {
		if (connected) {
			if (units == 0) {data.push([new Date(), parseFloat(tempC), parseFloat(rh)]);}
			else {data.push([new Date(), parseFloat(tempF), parseFloat(rh)]);}
			if (data.length > samples) {data.shift();}
			if (data.length > 0) { console.log(data); g.updateOptions( { 'file': data } );}
		}
	}, _interval);
}

function updateWindowSize() {
	var wind = samples * interval/60000;
	wind = wind.toFixed(1);
	$('#graphtitle').text("Window Size: " + wind.toString() + " Min");
}

// disconnect function:
function disconnect() {
  if (myDevice) {
    // disconnect:
	connected = false;
	$("#ble_icon").attr("src","ble/bluetooth_inactive.svg");
    myDevice.gatt.disconnect();
  }
}

function getTimeStamp() {
	var currentdate = new Date(); 
	var dateStr = currentdate.toISOString().split('T')[0] + ' ' + currentdate.toTimeString().split(' ')[0]; 
	return dateStr;
}


$(document).ready(function() {
	
	$("#ble_icon").click(function(){
		if (connected) {
			var rowArray_out = [];
			let csvContent = "data:text/csv;charset=utf-8,";
			csvContent += "Time,Temp,RH\r\n";
			data.forEach(function(rowArray) {
				rowArray_out = rowArray.slice(); // copy array
				rowArray_out[0] = rowArray_out[0].toISOString().split('T')[0] + ' ' + rowArray_out[0].toTimeString().split(' ')[0]; 
				let row = rowArray_out.join(",");
				csvContent += row + "\r\n";
			});
			var encodedUri = encodeURI(csvContent);
			window.open(encodedUri);
		}
	});
	
	document.getElementById("connectBtn").addEventListener('click', event => {
		connect();
	});
	
	document.getElementById("disconnectBtn").addEventListener('click', event => {
		disconnect();
	});
	
	document.getElementById('btn_save_graph_settings').addEventListener('click', SaveGraphSettingsButtonClicked);
		
	if (localStorage.getItem('interval')) {
		interval = parseInt(localStorage.getItem('interval'));
	}
	if (localStorage.getItem('samples')) {
		samples = parseInt(localStorage.getItem('samples'));
	}
	if (localStorage.getItem('units')) {
		units = parseInt(localStorage.getItem('units'));
	}
	
	$('#inputNumSamples').val(samples);
	$('#inputInterval').val(interval);
	$('#tempUnits').val(units);
	updateWindowSize();
	
	g = new Dygraph(document.getElementById("div_g"), data,
		{
		drawPoints: true,
		showRoller: true,
		//valueRange: [0.0, 1.2],
		labels: ['Time', 'Temp', 'RH']
		});
	clearInterval(intervalId);
	startInterval(interval);
	
});