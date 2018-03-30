// TODO: Add cancel button to editing form, add more styling


  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyBYbDtTYMoPdP4nm5-RtAebf0pLjX6PDVo",
    authDomain: "jp-gtcdc.firebaseapp.com",
    databaseURL: "https://jp-gtcdc.firebaseio.com",
    projectId: "jp-gtcdc",
    storageBucket: "jp-gtcdc.appspot.com",
    messagingSenderId: "113690363637"
  };
  
  firebase.initializeApp(config);
  var db = firebase.database();
  var ref = db.ref("/train-schedule");
  var formMode = "add"
  var formPosition = "bottom"
  var initialPosition = "bottom"
  var recordID;
  var allRecords = []
  var intervalId;
  var timer;

 


$(document).ready(function(){
    // set start position of panels, start timer
    $('.btnToggle').hide()
    startTimer()
    toggleForm()
    togglePosition();
    
    // firebase event listener
    ref.on('value', function(snapshot){
        var currentTime = moment().format("hh:mm:ss");
        $('#last-sync').html("Last Sync: " + currentTime)
      updateTable(snapshot)
    })

    // display positioning buttons on hover
    $('#toggle-container').hover(function(){
        $('.btnToggle').show()
        $('#toggle-container-span').hide()
    }, function(){
        $('.btnToggle').hide()
        $('#toggle-container-span').show()
    })

    // click event for adding/editing form
    $('#form-submit').on('click', function(){
            addTrain();
            toggleForm();
            togglePosition();
    })

    // click event for edit buttons
    $('table').on('click', '.edit', function(){
        formMode = "edit";
        recordID = $(this).attr("id");
        updateAllRecords();
        toggleForm();
        togglePosition();
        editRecord(recordID);
    })

    // click event for form positioning buttons
    $('body').on('click', '.btnToggle', function(){
        formPosition = $(this).attr("id")
        initialPosition = formPosition
        togglePosition()
    })

})

// function for adding or updating trains
function addTrain(){
    // get the textbox values
    var nameInput = $('#input-train-name').val();
    var destinationInput = $('#input-destination').val();
    var firstTrainInput = $('#input-first-train').val();
    var frequencyInput = $('#input-frequency').val();

    // make sure first run is in military time
    var validatedTime = validateTime(firstTrainInput)
    
    // data to send to firebase
    var postData = {
        trainName: nameInput,
        destination: destinationInput,
        firstTrain: firstTrainInput,
        frequency: frequencyInput,
        editing: false
    };

    // add or update train
    if(validatedTime){
        if(formMode === "add"){
            ref.push(postData);
        } else {
            ref.child(recordID).update(postData)
        }
        $('#input-train-name').val('');
        $('#input-destination').val('');
        $('#input-first-train').val('');
        $('#input-frequency').val('');
        formPosition = initialPosition
        formMode = "add"
    }
}


// validates first train time (military time)
function validateTime(time){
  //  var errorSpan = $('<span class="glyphicon glyphicon-remove form-control-feedback">')
    if(time.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]/)){
        $('#group-first-train').removeClass("has-error has-feedback")
     //   errorSpan.remove();
        return true;
    } else {
        $('#group-first-train').addClass("has-error has-feedback") //.append(errorSpan)
        return false;
    }
}


// updates the schedule table with firebase data
function updateTable(snapshot){
    // loop through snapshot and get each child
    $('#schedule-table-body').empty();
    snapshot.forEach(function(childSnapshot){
        // get child data and key of child
        var childData = childSnapshot.val();
        var id = childSnapshot.key;
        // exclude the child called "lastUpdate"
        if(id !== "lastUpdate"){
            // if child key doesn't exist in allRecords array, push it
            if(allRecords.indexOf(id) < 0){
                allRecords.push(id);
            }
        
            // assign each child value to appropriate vars
            var trainName = childData.trainName;
            var destination = childData.destination;
            var firstTrain = childData.firstTrain;
            var frequency = childData.frequency;
            // calculate next train
            var nextTrain = calcTimes(firstTrain, frequency)
            // calculate time to arrival, format it using moment.js
            var timeToArrival = moment(nextTrain, "hh:mm").fromNow();
            // format the arrival time
            nextTrain = nextTrain.format("hh:mm")
            
            // create a new table row
            var newRow = $('<tr>').attr("id", "tr" + id)
            // create a new cell for each value
            var trainNameCell = $('<td>').html(trainName);
            var destinationCell = $('<td>').html(destination);
            var frequencyCell = $('<td>').html(frequency);
            var nextArrivalCell = $('<td>').html(nextTrain)
            var timeToArrivalCell = $('<td>').html(timeToArrival);
            var editCell = $('<td>')
            // edit button uses child key (id) as it's id so we know which child to retrieve on click
            var editButton = $('<button class="btn btn-default edit">')
                        .attr('id', id)
                        .html("Edit")
                        .appendTo(editCell)

            // append the cells to the row
            newRow.append(trainNameCell, destinationCell, frequencyCell, nextArrivalCell, timeToArrivalCell, editCell)
            // append the row to the table body
            $('#schedule-table-body').append(newRow)
        }
    })
}


// calculates train times
function calcTimes(first, frequency){
    var currentTime = moment();
    var convertedFirst = moment(first, "HH:mm").subtract(1, "years")
    var timeDifference = currentTime.diff(moment(convertedFirst), "minutes")
    var remainder = timeDifference % frequency;
    var minutesAway = frequency - remainder;
    var nextArrival = currentTime.add(minutesAway, "minutes")
    return nextArrival
}


// gets the record based on the id of the button clicked
function editRecord(recordID){
    
  ref.orderByKey().equalTo(recordID).on("child_changed", function(snapshot){
    console.log(snapshot.val())
        $('#input-train-name').val(snapshot.val().trainName)
        $('#input-destination').val(snapshot.val().destination)
        $('#input-first-train').val(snapshot.val().firstTrain)
        $('#input-frequency').val(snapshot.val().frequency)
   })
  // change "editing" to true to trigger event listener
  // side note: it's bullshit I can't just query firebase and instead have to trigger an event like this
   ref.child(recordID).update({
       "editing": true
   })
}


// toggles the form between an "Add Train" and an "Edit Train" form
function toggleForm(){
    var formHeading = $('#form-heading')
    var formTitle = $('#form-title')
    if(formMode === "edit"){
        formPosition = "right";
        formTitle.html("Editing Train Schedule")
        $('#form-submit').html("Update Train")
        formHeading.css({
                'background': '#a63a50',
                'border-color': '#a63a50'
        }) 
    } else {
        formPostion = initialPosition
        formTitle.html("Add Train to Schedule")
        $('#form-submit').html("Add Train")
        formHeading.css({
        'background-color': '#546a7b',
        'border-color': '#546a7b'
        })
    }
}


// changes the position of the form by adding/removing bootstrap classes to elements
function togglePosition(){
    switch(formPosition){
        case "bottom":
            $('#main')
                .removeClass("container-fluid")
                .addClass("container")
            $('#schedule')
                .removeClass("col-md-8")
                .addClass("col-xs-12")
                .appendTo($('#row-primary'))
            $('#form')
                .removeClass("col-md-4")
                .addClass("col-xs-12 pull-right")
                .appendTo($('#row-secondary'));
            break;

        case "right":
            $('#main')
                .removeClass("container")
                .addClass("container-fluid")
            $('#schedule')
             //   .removeClass("col-xs-12")
                .addClass("col-md-8")
                .appendTo($('#row-primary'))
            $('#form')
                .removeClass("pull-left")
                .addClass("col-md-4 pull-right")
                .appendTo($('#row-primary'))
            break;

        case "left":
            $('#main')
                .removeClass("container")
                .addClass("container-fluid")
            $('#schedule')
             //   .removeClass("col-xs-12")
                .addClass("col-md-8")
                .appendTo($('#row-primary'))
            $('#form')
             //   .removeClass("col-xs-12")
                .addClass("col-md-4 pull-left")
                .prependTo($('#row-primary'))
            break;

        case "top":
            $('#main')
                .removeClass("container-fluid")
                .addClass("container")
            $('#schedule')
                .removeClass("col-md-8")
                .addClass("col-xs-12")
                .appendTo($('#row-secondary'))
            $('#form')
                .removeClass("col-md-4")
                .addClass("col-xs-12 pull-right")
                .appendTo($('#row-primary'));
            break;

        default:
            return;
    }
}


// updates each record to make sure editing=false. This is necessary so that changing editing=true
// will trigger the event to retrieve a child to edit. Again, it would be nice to be able to just query.
// this function could also be used for other mass updates if ever needed
function updateAllRecords(){
    for(i=0; i < allRecords.length; i++){
        ref.child(allRecords[i]).update({
            "editing": false
        })
    }
}


// starts a 60 second timer, used for auto updating
function startTimer(){
    clearInterval(intervalId)
    timer = 60;
    intervalId = setInterval(timerCountdown, 1000)
}

// countdown for timer
function timerCountdown(){
    timer--
    // when timer hits 0, update the "lastUpdate" record to trigger a value change, which updates the table
    if(timer === 0){
        var currentTime = moment().format("hh:mm:ss")
        ref.update({lastUpdate: currentTime})
        startTimer() 
    }
}