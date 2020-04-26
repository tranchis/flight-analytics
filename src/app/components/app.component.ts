import { Component, OnInit } from '@angular/core';
import {FormControl} from '@angular/forms';


declare var mapboxgl: any;
declare var turf: any;

declare function require(arg:string): any;
const environment = require('../../assets/auth/token.json');
const airports = 'https://raw.githubusercontent.com/mishaldholakia/large-airports/master/airport.geojson'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  public title = 'flight-analytics';
  source = [];
  minDate: Date;
  maxDate: Date;
  tmpDate = '';


  updateCalcs(event){
    var date_test = new Date(event.value);
    this.tmpDate = (date_test.getFullYear()).toString() + (('0' + (date_test.getMonth() + 1)).slice(-2)).toString() + (('0' + date_test.getDate()).slice(-2)).toString();
    console.log(this.tmpDate);
    localStorage.setItem('date', this.tmpDate);
  }

  constructor() {
    // Set the minimum to January 1st 20 years in the past and December 31st a year in the future.
    const currentYear = new Date().getFullYear();
    this.minDate = new Date(currentYear, 0, 1);
    this.maxDate = new Date(currentYear, 2, 31);
  }

  ngOnInit() {
    mapboxgl.accessToken =environment.access_token;
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v10',
        center: [-96, 37.8],
        zoom: 1,
        minZoom: 1,
      });
      
      map.on('load', function() {
        console.log(this.tmpDate); 
        window.setInterval(function() {
        map.getSource('airports').setData(airports);
        }, 2000);
        map.addSource('airports', { type: 'geojson', data: airports});
        map.addLayer({
          'id': 'airports',
          'source': 'airports',
          'type': 'symbol',
          'layout': {
          'icon-image': 'airport-15'
          }
          });
          // this.map.on('click', this.updateCalcs.bind(this));

        map.on('click', 'airports', function (e) {
          let tmpDate = localStorage.getItem('date');
          console.log(tmpDate);
          // console.log(e.features[0].properties);
          // console.log(e.features[0].properties.id);
          // console.log(e.features[0].geometry.coordinates);
          let tmpSource = e.features[0].geometry.coordinates
          this.source=[...tmpSource];
          // console.log(this.source);
          document.getElementById("id").innerHTML = e.features[0].properties.id;
          document.getElementById("ident").innerHTML = e.features[0].properties.Ident;
          document.getElementById("name").innerHTML = e.features[0].properties.name;
          document.getElementById("continent").innerHTML = e.features[0].properties.continent;
          document.getElementById("iso_country").innerHTML = e.features[0].properties.iso_country;
          document.getElementById("iso_region").innerHTML = e.features[0].properties.region;
          document.getElementById("municipality").innerHTML = e.features[0].properties.municipality;
          document.getElementById("scheduled_service").innerHTML = e.features[0].properties.scheduled_service;
          document.getElementById("gps_code").innerHTML = e.features[0].properties.gps_code;
          document.getElementById("iata_code").innerHTML = e.features[0].properties.iata_code;
          document.getElementById("local_code").innerHTML = e.features[0].properties.local_code;
          let airportCode = e.features[0].properties.iata_code;

          // let url = `https://cors-anywhere.herokuapp.com/https://covid19-flight.atalaya.at/?airport=${airportCode}&date=${dateStr}`;
          let url = `https://cors-anywhere.herokuapp.com/https://covid19-flight.atalaya.at/?airport=${airportCode}&date=${tmpDate}`;
          console.log(url);
          fetch(url)
          .then((response) => {
            return response.json();
          }).then((data) => {
            let tmpLength = Object.keys(data).length;
            // console.log(Object.keys(data).length);

            if(tmpLength>0){
              data.forEach(element => {
              // console.log(element);
              let destination = [element.longitude_deg, element.latitude_deg];
              var route = {
                'type': 'FeatureCollection',
                'features': [
                {
                  'type': 'Feature',
                  'geometry': {
                  'type': 'LineString',
                  'coordinates': [this.source, destination]
                  }
                }
              ]};
              
              var lineDistance = turf.lineDistance(route.features[0], 'kilometers');
              var arc = [];
              var steps = 500;
              
              // Draw an arc between the `origin` & `destination` of the two points
              for (var i = 0; i < lineDistance; i += lineDistance / steps) {
              var segment = turf.along(route.features[0], i, 'kilometers');
              arc.push(segment.geometry.coordinates);
              }
              
              // Update the route with calculated arc coordinates
              route.features[0].geometry.coordinates = arc;
                map.addSource(element.arrival_time+element.iata_code, {
                    'type': 'geojson',
                    'data': route
                  });
                
                map.addLayer({
                    'id': element.arrival_time+element.iata_code,
                    'source': element.arrival_time+element.iata_code,
                    'type': 'line',
                    'paint': {
                    'line-width': 2,
                    'line-color': '#007cbf'
                  }
                });
                setTimeout(() => {
                  map.removeLayer(element.arrival_time+element.iata_code);
                  map.removeSource(element.arrival_time+element.iata_code);
                }, 6000);
              });
          }
          else{
            document.getElementById("status").innerHTML = "No flight data found";
            setTimeout(() => {
              document.getElementById("status").innerHTML = "";
            }, 5000);
          }
            })
        })
        var popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false
          });
        map.on('mouseenter', 'airports', function(e) {
          // Change the cursor style as a UI indicator.
          map.getCanvas().style.cursor = 'pointer';
          let description = e.features[0].properties.name;
          let coordinates = e.features[0].geometry.coordinates.slice();
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            popup
            .setLngLat(coordinates)
            .setHTML(description)
            .addTo(map);
          // console.log(e.features[0].properties.name);
        })
        map.on('mouseleave', 'airports', function() {
          map.getCanvas().style.cursor = '';
          popup.remove();
          });
      });
  }
}