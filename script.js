'use strict';

class Workout{
    date = new Date();
    id = (Date.now() + '').slice(-10);
    clicks = 0;
    constructor(distance, duration, coords){
        // this.date = ...
        // this.id = ...
        this.distance = distance; // in km
        this.duration = duration; // in min
        this.coords = coords;
    }
    _description(){
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }

    click(){
        this.clicks++;
    }
}

class Running extends Workout{
    type = 'running';
    constructor(distance, duration, coords, cadence){
        super(distance, duration, coords);
        this.cadence = cadence;
        this.calcPace();
        this._description();
    }

    calcPace(){
        // min/km
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}


class Cycling extends Workout{
    type = 'cycling';
    constructor(distance, duration, coords, elevationGain){
        super(distance, duration, coords);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._description();
    }
    
    calcSpeed(){
        // km/h
        this.speed = this.distance / (this.duration/60);
        return this.speed;
    }
}
// const run1 = new Running(4, 34, [12,34], 178);
// console.log(run1);
// const cycle1 = new Cycling(4, 10, [12,34], 87);
// console.log(cycle1);

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App{
    #map;
    #mapEvent;
    workouts = [];
    zoomLevel = 13;
    constructor(){
        // Get Users Position
        this._getPosition();

        // get data from local storage
        this._getLocalStorage();

        // Attech event handlers
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    }
    
    _getPosition(){
        if(navigator.geolocation)
        navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function(){
                alert('Could not get your location');
            });
    }
        
    _loadMap(position){
        const {longitude} = position.coords;
        const {latitude} = position.coords;
        
        const coords = [latitude, longitude];
        this.#map = L.map('map').setView(coords, this.zoomLevel);
        // console.log(this);  
        
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',{ attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(this.#map);
        
        // Handling Click on Map
        this.#map.on('click', this._showForm.bind(this));

        // Rendering marker on map from local storage
        this.workouts.forEach(work=>{
            this._randerWorkoutMarker(work);
        })
    }

    _showForm(mapE){
        // console.log(this);
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
        // console.log(mapEvent);
    }
    _hideForm(){
        inputDistance.value = inputDuration.value = inputElevation.value = inputElevation.value = '';
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(()=>form.style.display = 'grid', 1000);
    }
    _toggleElevationField(){
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _randerWorkout(workout){
        let html = `
            <li class="workout workout--${workout.type}" data-id="${workout.id}">
                <h2 class="workout__title">${workout.description}</h2>
                <div class="workout__details">
                    <span class="workout__icon">${workout.type ==='running'?'🏃‍♂️':'🦶🏼'}</span>
                    <span class="workout__value">${workout.distance}</span>
                    <span class="workout__unit">km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⏱</span>
                    <span class="workout__value">${workout.duration}</span>
                    <span class="workout__unit">min</span>
                </div>
        `;

        if(workout.type === 'running'){
            html += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.pace.toFixed(1)}</span>
                    <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">🦶🏼</span>
                    <span class="workout__value">${workout.cadence}</span>
                    <span class="workout__unit">spm</span>
                </div>
            </li>
            `;
        }

        if(workout.type === 'cycling'){
            html += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.speed.toFixed(1)}</span>
                    <span class="workout__unit">km/h</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⛰</span>
                    <span class="workout__value">${workout.elevationGain}</span>
                    <span class="workout__unit">m</span>
                </div>
            </li>
            `;
        }

        containerWorkouts.insertAdjacentHTML('beforeend', html);
    }

    _newWorkout(e){
        e.preventDefault();

        // handler functions
        const isNumber = (...inputs) => inputs.every(inp=> Number.isFinite(inp));
        const allPositive = (...inputs) => inputs.every(inp=> inp > 0);
        const {lat, lng} = this.#mapEvent.latlng;
        
        // get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;

        let workout;
        // If Workout runing, create runing object
        if(type === 'running'){
            const cadence = +inputCadence.value;
            
            // check if data is valid
            if(
                // !Number.isFinite(distance) 
                // || !Number.isFinite(duration) 
                // || !Number.isFinite(cadence)
                
                !isNumber(distance, duration, cadence)
                || !allPositive(distance, duration, cadence)
            )
                return alert('Inputs have to be positive Numbers!');
            // console.log('running');
            workout = new Running(distance, duration, [lat, lng], cadence);
            // console.log(workout);
        }
        
        // If workout cycling, create cycling object
        if(type === 'cycling'){
            const elevation = +inputElevation.value;
            
            // check if data is valid
            if(
                !isNumber(distance, duration, elevation)
                || !allPositive(distance, duration) // elevation can be negative
            )
                return alert('Inputs have to be positive Numbers, but \'Elevation\' can be -ve');
                
            // console.log('cycling');
            workout = new Cycling(distance, duration, [lat, lng], elevation);
            // console.log(workout);
        }

        // Add new object to the work out array
        this.workouts.push(workout);
        // console.log(this.workouts);

        // Rander workout on map as marker

        // Rander workout on list 
        this._randerWorkout(workout);

        // Hide form and clear input fields
        this._hideForm();

        // Display Marker
        this._randerWorkoutMarker(workout);

        // Set local storage to all workouts
        this._setLocalStorage();
        
    }

    _randerWorkoutMarker(workout){
        L.marker(workout.coords)
        .addTo(this.#map)
        .bindPopup(
            L.popup({
                maxWidth: 250, 
                minWidth: 50,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`,
            })
        ).setPopupContent(`${workout.description}`)
        .openPopup();
    }

    _moveToPopup(e){
        const workoutEl = e.target.closest('.workout');
        // console.log(workoutEl);

        if(!workoutEl) return;

        const workout = this.workouts.
        find(works=> works.id === workoutEl.dataset.id);

        // console.log(workout);

        this.#map.setView(workout.coords, this.zoomLevel, {
            animate: true,
            pan: {
                duration: 1,
            }
        });

        // Using public interface 
        // now this function doesnot work because of local storage
        // workout.click();
    }

    _setLocalStorage(){
        localStorage.setItem('workouts', JSON.stringify(this.workouts));
    }

    _getLocalStorage(){
        const data = JSON.parse(localStorage.getItem('workouts'));

        if(!data) return;

        this.workouts = data;

        this.workouts.forEach(work=>{
            this._randerWorkout(work);
        });
    }

    reset(){
        localStorage.removeItem('workouts');
        location.reload();
    }
    
}
const app = new App();

