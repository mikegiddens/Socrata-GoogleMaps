// Javascript Tempaltes - https://github.com/blueimp/JavaScript-Templates
// License MIT
!function(e){"use strict";var n=function(e,t){var r=/[^\w\-\.:]/.test(e)?new Function(n.arg+",tmpl","var _e=tmpl.encode"+n.helper+",_s='"+e.replace(n.regexp,n.func)+"';return _s;"):n.cache[e]=n.cache[e]||n(n.load(e));return t?r(t,n):function(e){return r(e,n)}};n.cache={},n.load=function(e){return document.getElementById(e).innerHTML},n.regexp=/([\s'\\])(?!(?:[^{]|\{(?!%))*%\})|(?:\{%(=|#)([\s\S]+?)%\})|(\{%)|(%\})/g,n.func=function(e,n,t,r,c,u){return n?{"\n":"\\n","\r":"\\r","	":"\\t"," ":" "}[n]||"\\"+n:t?"="===t?"'+_e("+r+")+'":"'+("+r+"==null?'':"+r+")+'":c?"';":u?"_s+='":void 0},n.encReg=/[<>&"'\x00]/g,n.encMap={"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;","'":"&#39;"},n.encode=function(e){return(null==e?"":""+e).replace(n.encReg,function(e){return n.encMap[e]||""})},n.arg="o",n.helper=",print=function(s,e){_s+=e?(s==null?'':s):_e(s);},include=function(s,d){_s+=tmpl(s,d);}","function"==typeof define&&define.amd?define(function(){return n}):"object"==typeof module&&module.exports?module.exports=n:e.tmpl=n}(this);

SocrataGoogleMaps = function(config) {
    this.baseUrl = config.baseUrl;
    this.table = config.table;
    this.center = config.center || {
        lat: 39.4,
        lng: -104.9
    };
    this.zoom = config.zoom || 10;
    this.clickZoom = config.clickZoom || 15;
    this.enableListings = config.enableListings || true;
    this.enableDirections = config.enableDirections || true;
    this._markers = [];
    this._data = [];
    this._directionsDiv = $('<div class="sgm-directions"><div class="mapp-route"><a href="#" class="mapp-myloc">My location</a><div><span class="mapp-dir-icon mapp-dir-a"></span><input class="mapp-dir-saddr" tabindex="1"><a href="#" class="mapp-dir-swap"><span class="mapp-dir-icon mapp-dir-arrows" title="Swap start and end"></span></a></div><div class="mapp-dir-saddr-err"></div><div><span class="mapp-dir-icon mapp-dir-b"></span><input class="sgm-dir-daddr" tabindex="2"></div><div class="mapp-dir-daddr-err"></div></div></div>');

//    <div class="mapp-route">
//		<a href="#" class="mapp-myloc">My location</a>
//		<div>
//			<span class="mapp-dir-icon mapp-dir-a"></span>
//			<input class="mapp-dir-saddr" tabindex="1">
//			<a href="#" class="mapp-dir-swap"><span class="mapp-dir-icon mapp-dir-arrows" title="Swap start and end"></span></a>
//
//		</div>
//		<div class="mapp-dir-saddr-err"></div>
//
//		<div>
//			<span class="mapp-dir-icon mapp-dir-b"></span>
//			<input class="sgm-dir-daddr" tabindex="2">
//		</div>
//		<div class="mapp-dir-daddr-err"></div>
//	</div>
        
    this._listingsDiv = $('<div class="sgm-listings"></div>');
    this._mapDiv = $('<div class="sgm-map"></div>');
    this.tplInfowindow = config.tplInfowindow || '';
    this.tplListing = config.tplListing || '';
    this.tplDirections = config.tplDirections || '';
    return this;
}

//
//var markers = [];//some array
//var bounds = new google.maps.LatLngBounds();
//for (var i = 0; i < markers.length; i++) {
// bounds.extend(markers[i].getPosition());
//}
//map.fitBounds(bounds);

SocrataGoogleMaps.prototype.load = function(filter, cb) {
    var self = this;
    $.getJSON(this.baseUrl + '/resource/' + this.table + '.json', filter, function(data) {
        self.renderRecords(data);
        self._data = data;
        if (cb) {
            cb(self, data);
        }
    });
    return this;
}

SocrataGoogleMaps.prototype.getRecords = function(record) {
    return this._data;
}

SocrataGoogleMaps.prototype.renderRecords = function(data, status) {
    var self = this;
    $.each(data, function (idx, record) {
        self.addMarker(record, idx);
        self.addListing(record, idx);
    });
    this._listingsDiv.on('click', 'li', { parent: this }, function(ev, el) {
        var marker = $(this);
        google.maps.event.trigger(ev.data.parent._markers[ marker.data('idx') ], 'click');
        ev.data.parent._listingsDiv.find('li').removeClass('selected');
        marker.addClass('selected');
    });
    return this;
}

SocrataGoogleMaps.prototype.addMarker = function(record) {
    var self = this;
    
//            var address_txt = '';
//            var address_obj;
//            if (entry.location_1 && entry.location_1.human_address) {
//                address_obj = JSON.parse(entry.location_1.human_address);
//                (address_obj && address_obj.address) ? (address_txt = address_txt + address_obj.address + '<br>') : '';
//                var ar = [];
//                (address_obj && address_obj.city) ? (ar.push(address_obj.city)) : '';
//                var tmp = '';
//                (address_obj && address_obj.state) ? (tmp = tmp + address_obj.state + ' ') : '';
//                (address_obj && address_obj.zip) ? (tmp = tmp + address_obj.zip) : '';
//                if (tmp != '') {
//                    ar.push(tmp.trim());
//                }
//                if (ar.length) {
//                    address_txt = address_txt + ar.join(', ');
//                }
//            }

    var info = '';
    info += (record.organization_name) ? '<b>' + record.organization_name + '</b>' + '<br>' : '';
//    info += (address_txt != '') ? address_txt + '<br>' : '';
    info += (record.telephone) ? 'Phone: ' + record.telephone + '<br>' : '';
    info += (record.web_page_address && record.web_page_address.url) ? '<a target="_blank" href="' + record.web_page_address.url + '">' + record.web_page_address.url + '</a>' + '<br>' : '';
    info += (record.areas_served) ? 'Service Area: ' + record.areas_served + '<br>' : '';

    this._markers.push(new google.maps.Marker({
        position: new google.maps.LatLng(record.location_1.latitude, record.location_1.longitude),
        map: this._map
    }));
                       
    google.maps.event.addListener(this._markers[this._markers.length-1], 'click', function () {
        self._infoWindow.setContent(tmpl(self.tpl, record));
        self._infoWindow.open(self._map, this);
        self._map.setZoom(self.clickZoom);
        self._map.setCenter(this.getPosition());
    });
}

SocrataGoogleMaps.prototype.addListing = function(record, idx) {
    if (this.enableListings) {
        var code = '<li data-idx=' + idx + '><div class="icon"><img title="" src="https://maps.google.com/intl/en_us/mapfiles/ms/micons/red-dot.png" style="" scale="0"></div><div class="">' + record.organization_name;
        if (this.enableDirections) {
            code += '<br><span>Get directons</span>';            
        }
        code += '</div></li>';
        var li = $(code);
        this._ul.append(li);
    }
}

SocrataGoogleMaps.prototype.render = function(div) {

    this._infoWindow = new google.maps.InfoWindow();

    $('#' + div).append(this._mapDiv);
    this._map = new google.maps.Map(this._mapDiv[0], {
        zoom: this.zoom,
        center: new google.maps.LatLng(this.center.lat, this.center.lng)
    });

    if (this.enableDirections) {
        $('#' + div).append(this._directionsDiv);
    }
    
    if (this.enableListings) {
        $('#' + div).append(this._listingsDiv);
        this._ul = $('<ul/>');
        this._listingsDiv.append(this._ul);
    }
    
    return this;
}