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
    this.enableListings = (config.enableListings == false) ? false : true;
    this.enableDirections = (config.enableDirections == false) ? false : true;
    this.formatData = config.formatData || false;
    this._markers = [];
    this._data = [];
    this._directionsDiv = $('<div class="sgm-directions" style="display:none"><div class="mapp-route"><a href="#" class="mapp-myloc">My location</a><div><span class="mapp-dir-icon mapp-dir-a"></span><input class="mapp-dir-saddr" tabindex="1"><a href="#" class="mapp-dir-swap"><span class="mapp-dir-icon mapp-dir-arrows" title="Swap start and end">aaa</span></a></div><div class="mapp-dir-saddr-err"></div><div><span class="mapp-dir-icon mapp-dir-b"></span><input class="sgm-dir-daddr" tabindex="2"></div><div class="mapp-dir-daddr-err"></div></div><div style="margin-top: 10px;"><button class="mapp-dir-get">Get Directions</button><button class="mapp-dir-close">Close</button><span class="mapp-spinner" style="display:none"></span></div><div id="mapp-dir-renderer" class="mapp-dir-renderer" style="direction: ltr;"></div></div>');

        
    this._listingsDiv = $('<div class="sgm-listings"></div>');
    this._mapDiv = $('<div class="sgm-map"></div>');
    this.tplInfowindow = config.tplInfowindow || '';
    this.tplListing = config.tplListing || '';
    this.tplDirections = config.tplDirections || '';
    return this;
}

SocrataGoogleMaps.prototype.load = function(filter, cb) {
    var self = this;
    $.getJSON(this.baseUrl + '/resource/' + this.table + '.json', filter, function(data) {
        $.each(data, function (idx, record) {
            if(self.formatData) {
                $.each(self.formatData, function(fx, fd) {
                    switch(fd.type) {
                        case 'parse':
                            if(typeof eval('record.'+fd.field) != 'undefined') {
                                eval('record.'+fd.field+' = JSON.parse(record.'+fd.field+')' );
                                data[idx] = record;
                            }
                            break;
                    }
                });
            }
            if(self.enableDirections) {
                record = data[idx];
                record.enableDirections = self.enableDirections;
                data[idx] = record;
            }
        });
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
    
    this._listingsDiv.on('click', 'li span.get_directions', { parent: this }, function(ev, el) {
        self.setDirectionData(ev.data.parent._data[$(this).closest("li").data('idx')]);
//        ev.stopPropagation();
    });
    
    return this;
}

SocrataGoogleMaps.prototype.setDirectionData = function(record) {
    var self = this;
    //console.log("record: ", record);
    $('.sgm-dir-daddr').val(tmpl(self.tplDirections, record));
    $(".sgm-directions").show();
}

SocrataGoogleMaps.prototype.addMarker = function(record, idx) {
    var self = this;
    this._markers.push(new google.maps.Marker({
        position: new google.maps.LatLng(record.location_1.latitude, record.location_1.longitude),
        map: this._map
    }));
                       
    google.maps.event.addListener(this._markers[this._markers.length-1], 'click', function () {
        self._infoWindow.setContent(tmpl(self.tplInfowindow, record));
        self._infoWindow.open(self._map, this);
        self._map.setZoom(self.clickZoom);
        self._map.setCenter(this.getPosition());

        var pos = idx + 1;
        var ul = self._listingsDiv.find('ul');
        ul.animate({
            scrollTop: ul.find('li:nth-child(' + pos + ')').position().top - ul.find('li:first').position().top
        }, 'slow');
        self._listingsDiv.find('li').removeClass('selected');
        self._listingsDiv.find('li:nth-child(' + pos + ')').addClass('selected');
        
    });
}

SocrataGoogleMaps.prototype.addListing = function(record, idx) {
    if (this.enableListings) {
        var code = '<li data-idx=' + idx + '><div class="icon"><img title="" src="https://maps.google.com/intl/en_us/mapfiles/ms/micons/red-dot.png" style="" scale="0"></div><div class="">' + record.organization_name;
        if (this.enableDirections) {
            code += '<br><span class="get_directions">Get directons</span>';            
        }
        code += '</div></li>';
        var li = $(code);
        this._ul.append(li);
    }
}

SocrataGoogleMaps.prototype.render = function(div) {
    var self = this;

    this._infoWindow = new google.maps.InfoWindow();
//    google.maps.event.addListener(this._infoWindow, 'domready', function() {
//        $("span.get_directions").on('click', function(ev) {
//            console.log($(this));
//        });
//    })    

    $('#' + div).append(this._mapDiv);
    this._map = new google.maps.Map(this._mapDiv[0], {
        zoom: this.zoom,
        center: new google.maps.LatLng(this.center.lat, this.center.lng)
    });
    this._directionsDisplay = new google.maps.DirectionsRenderer();
    this._directionsService = new google.maps.DirectionsService();
    this._geocoder = new google.maps.Geocoder;

    if (this.enableDirections) {
        $('#' + div).append(this._directionsDiv);
        this._directionsDisplay.setPanel(self._directionsDiv.find(".mapp-dir-renderer")[0]);
        
        this._directionsDiv.on('click', 'button', function(ev, el) {
            var request = {
                destination: self._directionsDiv.find(".sgm-dir-daddr")[0].value,
                origin: self._directionsDiv.find(".mapp-dir-saddr")[0].value,
                travelMode: google.maps.TravelMode.DRIVING
            };
            self._directionsDisplay.setMap(null);
            self._directionsDisplay.setMap(self._map);
            self._directionsService.route(request, function(response, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                  // Display the route on the map.
                  self._directionsDisplay.setDirections(response);
                }
            });
        });
        this._directionsDiv.on('click', 'button.mapp-dir-close', function(ev, el) {
//            self._directionsDiv.find(".mapp-dir-saddr")[0].value = '';
            self._directionsDiv.find(".sgm-dir-daddr")[0].value = '';
            self._directionsDiv.find(".mapp-dir-renderer").empty();
            $(".sgm-directions").hide();
            self._directionsDisplay.setMap(null);

        });
        this._directionsDiv.on('click', 'a.mapp-dir-swap', function(ev, el) {
            var tmp = self._directionsDiv.find(".mapp-dir-saddr")[0].value;
            self._directionsDiv.find(".mapp-dir-saddr")[0].value = self._directionsDiv.find(".sgm-dir-daddr")[0].value;
            self._directionsDiv.find(".sgm-dir-daddr")[0].value = tmp;
        });
        this._directionsDiv.on('click', 'a.mapp-myloc', function(ev, el) {
             if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position, error){
                    console.log("error: ", error);
                    console.log("position: ", position);
                    if(position && position.coords && position.coords.latitude && position.coords.longitude) {
                        var latlng = {lat: parseFloat(position.coords.latitude), lng: parseFloat(position.coords.longitude)};
                        self._geocoder.geocode({'location': latlng}, function(results, status) {
                            if (status === google.maps.GeocoderStatus.OK) {
                                if (results[1] && results[1].formatted_address) {
                                    $(".mapp-dir-saddr").val(results[1].formatted_address);
                                }
                            }
                        });
                    }
                    
                });
            } else {
                console.log("Location not available!");
            }
        });

        
        
    }
    
    if (this.enableListings) {
        $('#' + div).append(this._listingsDiv);
        this._listingsDiv.append('<h3>Locations</h3>');
        this._ul = $('<ul/>');
        this._listingsDiv.append(this._ul);
    }
    
    return this;
}