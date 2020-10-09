import { Component, OnInit } from '@angular/core';
import { ILITEAPI } from "geo/imapLiteApi-core.js";


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    ILITEAPI.init({
      "divId": "iapi",
      "width": 300,
      "height": 250
    });
  }




}
