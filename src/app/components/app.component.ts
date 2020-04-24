import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

declare var mapboxgl: any;
declare function require(arg:string): any;
const environment = require('../../assets/auth/token.json');
// const airports = require('../../assets/airport/updatedAirports.json')
// const airports = require('../../assets/airport/airport.geojson')
const airports = 'https://raw.githubusercontent.com/mishaldholakia/large-airports/master/airport.geojson'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'flight-analytics';
  ngOnInit() {
    mapboxgl.accessToken =environment.access_token;
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v10',
        center: [-96, 37.8],
        zoom: 1,
        minZoom: 1
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
          })

        });
  }
}
