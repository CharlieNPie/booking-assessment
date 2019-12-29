// used to make https request
const https = require("https");

// used for writing json file
var fs = require('fs');

// express framework for API
var express = require('express')
var app = express()
var port = 3000

// command line arguments
var args = process.argv.slice(2);

// parse args for pickup and dropoff co-ordinates, number of people
var pickup = args[0];
var dropoff = args[1];
var numberOfPeople = args[2];

var names = ["dave", "eric", "jeff"]
var firms = [];

// object listing maximum number of people for each car
var carTypes = {
    STANDARD:4, 
    EXECUTIVE:4, 
    LUXURY:4, 
    PEOPLE_CARRIER:6, 
    LUXURY_PEOPLE_CARRIER:6, 
    MINIBUS:16
};

// iterate over each API to obtain data. 
var APIsProcessed = 0; // used as a counter
names.forEach((name) => {
    getFirmData(name);
})

// helper function, forms URL to be used by API request
function getURL(firm) {
    base_url = 'https://techtest.rideways.com'
    return `${base_url}/${firm}?pickup=${pickup}&dropoff=${dropoff}`;
}

// gets data of specified API
function getFirmData(name) {
    https.get(getURL(name), (resp) => {
        resp.setEncoding('utf8');
        resp.on('data', (body) => {
            respData = JSON.parse(body);
            if (resp.statusCode != 200) {
                console.log(`${respData.error} in ${name}: ${respData.message}. Please try again.`);
            }
            else {
                result = respData.options;
                for (var car in result) {
                    result[car]["supplier"] = name
                }
                firms.push.apply(firms, result);
            }
            APIsProcessed++;
            if (APIsProcessed == names.length) {
                getCheapestJourneys();
            }
        })
    })
}

// finds cheapest journeys for each type of vehicle
function getCheapestJourneys() {
    var carTypesProcessed = 0;
    listOfCheapestCars = [];

    for (var carType in carTypes) {
        var filterByCar = firms.filter(car => car.car_type == carType);
        if (filterByCar.length > 0) {
            var cheapestCar = filterByCar.reduce(function(prev, current) {
                return (prev.y < current.y) ? prev : current
            })
            listOfCheapestCars.push(cheapestCar);
        }
        carTypesProcessed ++;
        if(carTypesProcessed == Object.keys(carTypes).length) {
            printJourneys(listOfCheapestCars);
        }
    }
}

// function to print formatted journeys, suppliers and prices
function printJourneys(carData) {
    results = []
    carData.sort(function(a, b) {
        return b.price - a.price;
    })
    carData.forEach(function(value){
        if (numberOfPeople <= carTypes[value.car_type]) {
            results.push(value);
        }
    })
    results.forEach(function(value) {
        console.log(`${value.car_type} - ${value.supplier} - ${value.price}`);
    })
    formatJSON(results);  
}

//
// PART 2
//

// compiles output into JSON format to be returned via API and writes data to file
function formatJSON(cars) {
    var carsJSON = JSON.stringify(Object.assign({}, cars));
    fs.writeFile('taxi_data.json', carsJSON, function(err) {
        if (err) console.log(err);
        console.log("Data saved!")
    })
}

// get request for API, reads data from file
app.get('/list_cars', (req, res) => {
    fs.readFile( __dirname + "/" + "taxi_data.json", 'utf8', function (err, data) {
        res.end( data );
     });
})

// creates server on localhost:3000
var server = app.listen(port, function () {
   console.log("Example app listening at http://%s:%s", "localhost", port)
})

