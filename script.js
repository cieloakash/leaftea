'use strict';

class Workout{
    
    date = new Date();
    id = (Date.now() + '').slice(-10);

    constructor(coords,distance,duration){
        this.coords = coords; // [lat,lng]
        this.distance = distance;
        this.duration = duration;
       
    }
    _setDescription(){
        
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on  ${months[this.date.getMonth()]} ${this.date.getDate()}`;
        console.log(this.description)
    }
}

class Running extends Workout{
    type = 'running';
    constructor(coords,distance,duration,cadence){
        super(coords,distance,duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }

    calcPace() {
        this.pace = this.duration/ this.distance;
        return this.pace;
    }
}




class Cycling  extends Workout{
    type = 'cycling';
    constructor(coords,distance,duration,elevationGain){
        super(coords,distance,duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed(){
        this.speed = this.distance/ (this.duration/60)
        return this.speed;
    }
}


const run1 = new Running([85,22], 2, 20,10);
const cycle1 = new Cycling([85,22], 8, 50,102);
console.log(run1,cycle1);




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
    #mapZoom = [13,18];
    #workouts = [];
    
    constructor(){
        this._getPosition();
        form.addEventListener('submit',this._newWorkout.bind(this));


        // get local storage
        this._getLocalStorage();
        inputType.addEventListener('change',this._toggleElevationField);
        containerWorkouts.addEventListener('click',this._moveToPopup.bind(this));

    }

    _getPosition(){
        if(navigator.geolocation)
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),function(){
                    alert("cant't read position...." )
            })
    }

    _loadMap(position){
            console.log(position);
            const {latitude} = position.coords;
            const {longitude} = position.coords;
            console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

            const coords = [latitude,longitude]
            console.log(this);
            this.#map = L.map('map').setView(coords, this.#mapZoom[0]);

            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.#map);

            this.#map.on('click',this._showForm.bind(this));

            // getting data from local storage and rendering on map
            this.#workouts.forEach(work => {
                this._renderWorkoutMarker(work);
            })
    }

    _showForm(mapE){
        this.#mapEvent= mapE
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _hideForm(){
        inputDistance.value= inputDuration.value= inputCadence.value= inputElevation.value = "";
        //  form.style.display = 'none';
        form.classList.add('hidden');
        // setTimeout(()=> (form.style.display = 'grid'),1000);
    }

    _toggleElevationField(){
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
    }

    _newWorkout(e){
         // stoping page from reloading on submiting form 
         e.preventDefault();

         const validInputs = (...inputs)=> inputs.every(inp => Number.isFinite(inp));
         const allPos = (...inputs)=>inputs.every(inp=> inp > 0);
        //   get data from form

         const type = inputType.value;
         const distance = +inputDistance.value;
         const duration = +inputDuration.value;
         const {lat,lng } = this.#mapEvent.latlng;
         let workout;

         if (type === 'running'){
            const cadence =  +inputCadence.value;
            // check for valid data
            if(
                // !Number.isFinite(distance)  || !Number.isFinite(duration) || !Number.isFinite(cadence)
                !validInputs(distance,duration,cadence) || !allPos(distance,duration,cadence))
                return alert('Number must be positive');
                workout = new Running([lat,lng],distance,duration,cadence); 
                
         }


         if(type === 'cycling'){
            const elevation = +inputElevation.value;
            if (!validInputs(distance,duration,elevation) || !allPos(distance,duration)){
                return alert('Number must be positive');
            }
            workout = new Cycling ([lat,lng],distance,duration,elevation);
         }

         
        //  add new object to workout array
         this.#workouts.push(workout);

         
        //  rendering the workout
         this._renderWorkoutMarker(workout);

        //  render workout in list
         this._renderWorkout(workout);

         // clearing the input form field after each addition
         
        //  hide form + clear input field
         this._hideForm()

        //  set local storage
          this._setLocalStorage();
         
        
    }
    _renderWorkoutMarker(workout){
        L.marker(workout.coords)
 
        .addTo(this.#map)
        .bindPopup(L.popup({
            maxWidth:300,
            minWidth:100,
            autoClose:false,
            closeOnClick:false,
            className:`${workout.type}-popup`,
        })).setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
        .openPopup();
    }
    _renderWorkout(workout){
        let html = `
            <li class="workout workout--${workout.type}" data-id=${workout.id}>
                <h2 class="workout__title">Running on April 14</h2>
                <div class="workout__details">
                    <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
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
            html +=`
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
        `
        }
        if(workout.type === 'cycling'){
            html +=`
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.speed.toFixed(1)}</span>
                    <span class="workout__unit">km/h</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">🚴‍♀️</span>
                    <span class="workout__value">${workout.elevationGain}</span>
                    <span class="workout__unit">m</span>
                </div>
                </li>
        `
        }
        form.insertAdjacentHTML('afterend',html);
    }

    _moveToPopup(e){
        const workoutEl = e.target.closest('.workout');
        if(!workoutEl)return ;
        console.log(workoutEl)
        const pointWork = this.#workouts.find(
            work=> work.id === workoutEl.dataset.id
        );
        console.log(pointWork);

        this.#map.setView(pointWork.coords,this.#mapZoom[1],{animate: true, pan:{duration:1,}});
    }
    _setLocalStorage(){
        localStorage.setItem('workout',JSON.stringify(this.#workouts))
    }
    _getLocalStorage(){
        const data = JSON.parse( localStorage.getItem('workout'));
        console.log(data);

        if(!data) return 

        this.#workouts = data;

        this.#workouts.forEach(work => {
            this._renderWorkout(work);
        })
    }
    reset(){
        localStorage.removeItem('workout');
        location.reload();
    }
}

const app = new App();

