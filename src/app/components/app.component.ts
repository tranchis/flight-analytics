import { Component, OnInit } from '@angular/core';


declare var mapboxgl: any;
declare var turf: any;

// import * as turf from '@turf/turf';

declare function require(arg:string): any;
const environment = require('../../assets/auth/token.json');
const airports = 'https://raw.githubusercontent.com/mishaldholakia/large-airports/master/airport.geojson'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'flight-analytics';
  ID = '';
  Ident = '';
  Name = '';
  Continent = '';
  ISO_Country = '';
  ISO_Region = '';
  Municipality ='';
  Scheduled_Service = '';
  GPS_Code = '';
  IATA_Code = '';
  Local_Code = '';
  source = [];
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

        map.on('click', 'airports', function(e) {
          console.log(e.features[0].properties);
          // console.log(e.features[0].properties.id);
          // console.log(e.features[0].geometry.coordinates);
          let tmpSource = e.features[0].geometry.coordinates
          this.source=[...tmpSource];
          console.log(this.source);
          this.ID = e.features[0].properties.id;
          this.Ident = e.features[0].properties.Ident;
          this.Name = e.features[0].properties.name;
          this.Continent = e.features[0].properties.continent;
          this.ISO_Country = e.features[0].properties.iso_country;
          this.ISO_Region = e.features[0].properties.region;
          this.Municipality = e.features[0].properties.municipality;
          this.Scheduled_Service = e.features[0].properties.scheduled_service;
          this.GPS_Code = e.features[0].properties.gps_code;
          this.IATA_Code = e.features[0].properties.iata_code;
          this.Local_Code = e.features[0].properties.local_code;
          let airportCode = e.features[0].properties.iata_code;
          
          var d = new Date();
          var date = d.getDate();
          var month = d.getMonth() + 1; // Since getMonth() returns month from 0-11 not 1-12
          var year = d.getFullYear();
          var dateStr = year.toString() + month.toString() + date.toString();
          // let url = `https://cors-anywhere.herokuapp.com/https://covid19-flight.atalaya.at/?airport=${airportCode}&date=${dateStr}`;
          let url = `https://cors-anywhere.herokuapp.com/https://covid19-flight.atalaya.at/?airport=${airportCode}&date=20200123`;
          console.log(url);
          fetch(url)
          .then((response) => {
            return response.json();
          }).then((data) => {
            console.log(data);
            data.forEach(element => {
            console.log(element);
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
            })
        })
        map.on('mouseenter', 'airports', function(e) {
          // Change the cursor style as a UI indicator.
          map.getCanvas().style.cursor = 'pointer';
        })
        map.on('mouseleave', 'airports', function() {
          map.getCanvas().style.cursor = '';
          });
      });

  }
}



        
