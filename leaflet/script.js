'use strict';



// 全域變數
let map, mapEvent;

class Workout {
  date = new Date();
  id = +new Date() + '';
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
    // console.log("id",this.id);
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
  click() {
    this.clicks++;
  }
}
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.clacPace();
    console.log(Workout.description);
    this._setDescription();
  }

  clacPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    // km/h
    this.speed = this.distance / this.duration;
    return this.speed;
  }
}

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #workouts = [];
  // 私人屬性
  #map;
  #mapEvent;
  #mapZoomLevel = 13;
  // Prettier-ignore
  //自動觸發
  constructor() {
    // 取得api
    this._getPosition();

    // 從localStorage中取得資料
    this._getLocalStorage();
    // 提交網頁數據
    form.addEventListener('submit', this._newWorkout.bind(this));
    // 更改網頁輸入類型(騎車/跑步)
    inputType.addEventListener('change', this._toggleElevationField);
    // 點選workout裡的每一個，他會在地圖上一到最中間去顯示
    containerWorkouts.addEventListener('click', this._toMoveToPop.bind(this));
  }

  // 取api()
  _getPosition() {
    if (navigator) {
      // navigator.geolocation.getCurrentPosition(success, error)
      navigator.geolocation.getCurrentPosition(
        // prettier-ignore
        this._loadMap.bind(this), // 取api->成功
        // prettier-ignore
        function () {alert(123)} // 取api->失敗
      );
    }
  }
  // 取api->成功
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 13); //  用leaflet畫地圖
    // 增加地圖草稿
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // 在地圖上點選時觸發
    this.#map.on('click', this._showForm.bind(this));
        this.#workouts.forEach(i => {
          // this._renderWorkout(i);
          this._renderWorkoutMarker(i);
        });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hideForm() {
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = ''; // prettier-ignore
    form.style.display = "none"; //將填空區弄不見
    form.classList.add("hidden");
    setTimeout(() => { form.style.display="grid"},1000);// 把填空區弄回來(但這時候會因為“hidden”仍不會顯示)
  }


  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }
  //prettier-ignore
  _newWorkout(e) { // form 提交新數據
  const validInputs=(...input)=>{input.every(i=>Number.isFinite(i));}
  const allPositive=(...input)=>{input.every(i=>i>0)}


    e.preventDefault(); //防止數據刷掉
  // step1: get data from form.
  const type=inputType.value;
  const distance=+inputDistance.value;
  const duration=+inputDuration.value;
  const {lat,lng}=this.#mapEvent.latlng;
  let workout;

  // step2-1: if workout is Running, creat running object
  if (type=="running"){
    const cadence=+inputCadence.value;
    // step: check data if data is valid.
    // prettier-ignore
    workout=new Running([lat,lng],distance,duration,cadence);

  }
  // step2-2: if workout is cycling, creat cycling object 
  if(type=="cycling"){
    const elevation=+inputElevation.value;
    // step: check data if data is valid.
    workout=new Cycling([lat,lng],distance,duration,elevation);
  }
  console.log("11",workout);
  // step3: add new object to workout array.
  this.#workouts.push(workout);
  // step4: render workout marker on map.
  this._renderWorkoutMarker(workout);

  // step5: render workout on list. 
  this._renderWorkout(workout);

  // step6: hide & clear input field.
     
    this._hideForm();
    this._setLocalStorage();

  }
  _renderWorkoutMarker(workout) {
    console.log(workout);
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`
        ${workout.type == 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description} 
      `)
      .openPopup();
  }
  _renderWorkout(workout){
    // 增加workout的DOM
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${workout.type == 'running' ? '🏃‍♂️' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workoust__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;
    if (workout.type === "running") {
      html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
      `;
    } else {
      html += `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span classs="workout__unit">m</span>
          </div>
        </li> 
      `;
    }
    form.insertAdjacentHTML("afterend", html);
  }
  _toMoveToPop(e) {
    const workoutEl = e.target.closest(".workout");
    console.log(workoutEl);
    const workout = this.#workouts.find(i => i.id === workoutEl.dataset.id);
    
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration:1,
      }
    });

    // workout.click(); 
  }
  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(i => {
      this._renderWorkout(i);
      // this._renderWorkoutMarker(i);
    });
  }
}

const app = new App();

//
//
//
//
//
