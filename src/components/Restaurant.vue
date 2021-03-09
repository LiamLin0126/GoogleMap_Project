<template>
  <div>
    <h2 class="text-center text-secondary pb-2 ">找吃的</h2>

    <!--地圖呈現在此-->
    <div class="google-map mx-auto mb-5 " id="map"></div>
    <div class="outline d-flex justify-content-center mb-5">
      <div class="restaurant">
        <div class="table">
          <thead>
            <tr>
              <th>店名</th>
              <th
                class="click"
                @click="(sort = 'price_level'), (isReverse = !isReverse)"
              >
                價格水平
                <!-- isReverse 為反轉 className -->
                <span
                  class="icon"
                  :class="{ inverse: isReverse }"
                  v-if="sort == 'price_level'"
                >
                  <i class=" fas fa-angle-up text-success"></i>
                </span>
              </th>
              <th
                class="click"
                @click="(sort = 'rating'), (isReverse = !isReverse)"
              >
                評價
                <span
                  class="icon"
                  :class="{ inverse: isReverse }"
                  v-if="sort == 'rating'"
                >
                  <i class=" fas fa-angle-up text-success"></i>
                </span>
              </th>
              <th>距離</th>
              <th></th>
            </tr>
            <tr v-for="item in sortPlace">
              <td>{{ item.name }}</td>
              <td>{{ item.price_level }}</td>
              <td>{{ item.rating }}</td>
              <td>{{ calcDistance(item.geometry.location) }} km</td>
              <td>
                <div
                  class="btn btn-dark"
                  @click="
                    () => {
                      place_id = item.place_id;
                      showDetails();
                    }
                  "
                >
                  詳細內容
                </div>
              </td>
            </tr>
          </thead>
        </div>
        <div id="more" class="btn btn-primary">更多餐廳</div>
      </div>

      <div
        class="detailList ml-2 py-4 d-flex justify-content-around"
        v-if="Object.keys(details).length"
      >
        <div class=" infodata mt-3  mx-3 ">
          <div class="name ">
            <div class="d-flex">
              <h5>餐廳</h5>
              <div
                class="openLabel"
                v-if="
                  Object.keys(details).length && details.opening_hours.open_now
                "
              >
                營業中
              </div>
              <div class="closeLabel" v-else>休息中</div>
            </div>
            <p>{{ details.name }}</p>
          </div>
          <div class="price_level">
            <h5>價錢程度：</h5>
            <span v-for="i in details.price_level">$</span>
          </div>
          <div class="address">
            <h5>地址：</h5>
            <p>{{ details.formatted_address }}</p>
          </div>
          <div class="phoneNumber">
            <h5>電話：</h5>
            <p>{{ details.formatted_phone_number }}</p>
          </div>
          <div class="rating">
            <h5>評分：{{ details.rating }}</h5>
          </div>
          <hr />
          <div>
            <h5>行車路線</h5>
            <div class="DistanceBy">
              <div
                class="btn btn-primary"
                @click="DrawingRoute(details.geometry.location, 'WALKING')"
              >
                步行
              </div>
              <div
                class="btn btn-primary"
                @click="DrawingRoute(details.geometry.location, 'DRIVING')"
              >
                開車
              </div>
              <div
                class="btn btn-primary"
                @click="DrawingRoute(details.geometry.location, 'TRANSIT')"
              >
                大眾交通運輸
              </div>
            </div>
          </div>
        </div>
        <div class="reviews">
          <div
            class="reviewOfRating mb-2 px-2 py-2"
            v-for="item in details.reviews"
            :key="item.id"
          >
            <h6>
              姓名: <span>{{ item.author_name }}</span>
            </h6>
            <h6>
              評價：
              <span v-for="i in item.rating">&#x2605;</span>
            </h6>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.google-map {
  width: 70%;
  height: 500px;
}

.restaurant {
  max-height: 500px;
  overflow: scroll;
  .table {
    text-align: left;
  }
}

.detailList {
  border-radius: 5px;
  width: 800px;
  background: rgb(245, 180, 180);
  //   height: 500px;
  text-align: left;
  .infodata {
    .openLabel {
      margin-left: 20px;
      color: green;
    }
    .closeLabel {
      margin-left: 20px;
      color: blue;
    }
    width: 40%;
  }
  .reviews {
    width: 40%;
    .reviewOfRating {
      border: 2px solid blue;
      border-radius: 5px;
    }
  }
}
</style>

<script>
import axios from "axios";

export default {
  name: "Restaurants",
  data() {
    return {
      map: null,
      //預設經緯度在信義區附近
      lat: 0,
      lng: 0,
      marker: null,
      type: "restaurant",
      radius: 1,
      places: [],
      service: null,
      infowindow: null,
      place_id: "",
      details: {},
      bounds: {
        ne: 0,
        sw: 0
      },
      isReverse: false,
      sort: ""
    };
  },
  methods: {
    //建立地圖
    initMap() {
      const vm = this;
      navigator.geolocation.watchPosition(position => {
        console.log(position.coords);
        vm.lat = position.coords.latitude;
        vm.lng = position.coords.longitude;
        //初始化地圖
        vm.map = new google.maps.Map(document.getElementById("map"), {
          // 設定地圖的中心點經緯度位置
          center: {
            lat: vm.lat,
            lng: vm.lng
          },
          //設定地圖縮放比例 0-20
          zoom: 15,
          //設定是否呈現右下角街景小人
          streetViewControl: true,
          //設定是否讓使用者可以切換地圖樣式：一般、衛星地圖等
          mapTypeControl: false
        });

        const svgMarker = {
          path:
            "M10.453 14.016l6.563-6.609-1.406-1.406-5.156 5.203-2.063-2.109-1.406 1.406zM12 2.016q2.906 0 4.945 2.039t2.039 4.945q0 1.453-0.727 3.328t-1.758 3.516-2.039 3.070-1.711 2.273l-0.75 0.797q-0.281-0.328-0.75-0.867t-1.688-2.156-2.133-3.141-1.664-3.445-0.75-3.375q0-2.906 2.039-4.945t4.945-2.039z",
          fillColor: "purple",
          fillOpacity: 0.6,
          strokeWeight: 0,
          rotation: 0,
          scale: 2,
          anchor: new google.maps.Point(15, 30)
        };

        this.marker = new google.maps.Marker({
          icon: svgMarker,
          position: { lat: this.lat, lng: this.lng },
          map: this.map
        });

        google.maps.event.addListener(this.map, "bounds_changed", () => {
          this.bounds = this.map.getBounds();
          this.bounds.ne = this.bounds.getNorthEast();
          this.bounds.sw = this.bounds.getSouthWest();
          this.searchRestaurant();

          //do whatever you want with those bounds
        });
      });
    },

    createMarker(place) {
      const vm = this;
      let marker = new google.maps.Marker({
        map: vm.map,
        position: place.geometry.location,
        name: place.name,
        vicinity: place.vicinity
      });

      if (!vm.map.getBounds().contains(marker.getPosition())) {
        marker.setVisible(false);
      }
      let infowindow = new google.maps.InfoWindow();

      google.maps.event.addListener(marker, "click", () => {
        infowindow.setContent(
          `<div class="ui header">${marker.name}</div><br><p>${marker.vicinity}</p>`
        );
        infowindow.open(vm.map, marker);
      });
    },
    searchRestaurant() {
      const vm = this;
      vm.service = new google.maps.places.PlacesService(this.map);

      const moreButton = document.getElementById("more");
      let getNextPage;
      moreButton.onclick = function() {
        moreButton.disabled = true;

        if (getNextPage) {
          getNextPage();
        }
      };

      vm.service.nearbySearch(
        {
          bounds: this.bounds,
          type: ["restaurant"]
        },
        (results, status, pagination, pagetoken) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            console.log(results);
            this.places = results;
            for (var i = 0; i < 20; i++) {
              this.createMarker(results[i]);
            }

            moreButton.disabled = !pagination || !pagination.hasNextPage;

            if (pagination && pagination.hasNextPage) {
              getNextPage = () => {
                // Note: nextPage will call the same handler function as the initial call
                pagination.nextPage();
              };
            }
          }
        }
      );
    },
    showDetails() {
      const vm = this;
      let serviceDetails = new google.maps.places.PlacesService(vm.map);

      const request = {
        placeId: vm.place_id,
        fields: ["ALL"]
      };
      serviceDetails.getDetails(request, (place, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          place &&
          place.geometry &&
          place.geometry.location
        ) {
          console.log(place);
          this.details = place;
        }
      });
    },
    calcDistance(p2) {
      const vm = this;
      return (
        google.maps.geometry.spherical.computeDistanceBetween(
          new google.maps.LatLng(vm.lat, vm.lng),
          p2
        ) / 1000
      ).toFixed(2);
    },
    DrawingRoute(geometry, way) {
      let linecolor = "";
      if (way == "WALKING") {
        linecolor = "red";
      } else if (way == "DRIVING") {
        linecolor = "blue";
      } else {
        linecolor = "green";
      }

      const vm = this;
      let directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: { lat: this.lat, lng: this.lng },
          destination: geometry,
          travelMode: way,
          unitSystem: google.maps.UnitSystem.METRIC
        },
        function(response, status) {
          if (status !== google.maps.DistanceMatrixStatus.OK) {
            window.alert("Error was" + status);
          } else {
            console.log(response);
            let directionsDisplay = new google.maps.DirectionsRenderer({
              map: vm.map,
              directions: response,
              polylineOptions: {
                strokeColor: linecolor
              }
            });
          }
        }
      );
    }
  },
  computed: {
    sortPlace() {
      const vm = this;
      return vm.places.sort(function(a, b) {
        a = a[vm.sort];
        b = b[vm.sort];
        if (vm.isReverse) {
          return a - b;
        } else if (!vm.isReverse) {
          return b - a;
        } else {
          return;
        }
      });
    }
  },
  mounted() {
    this.initMap();
    // this.setMarker();
  }
};
</script>
