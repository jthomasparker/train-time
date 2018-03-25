/*
Make sure that your app suits this basic spec:

When adding trains, administrators should be able to submit the following:
Train Name
Destination
First Train Time -- in military time
Frequency -- in minutes
Code this app to calculate when the next train will arrive; this should be relative to the current time.
Users from many different machines must be able to view same train times.
Styling and theme are completely up to you. Get Creative*/


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
 


$(document).ready(function(){
    

    ref.on('value', function(snapshot){
      //  var data = snapshot.val();
      updateTable(snapshot)
    })

    $('#form-submit').on('click', function(){
        if(formMode === "add"){
            addTrain()
        } else {
            editTrain()
        }
    })
})

function addTrain(){
    var nameInput = $('#input-train-name').val();
    var destinationInput = $('#input-destination').val();
    var firstTrainInput = $('#input-first-train').val();
    var frequencyInput = $('#input-frequency').val();

    var validatedTime = validateTime(firstTrainInput)
    
    var postData = {
        trainName: nameInput,
        destination: destinationInput,
        firstTrain: firstTrainInput,
        frequency: frequencyInput
    };
    if(validatedTime){
        ref.push(postData);
    }
}


function validateTime(time){
    var errorSpan = $('<span class="glyphicon glyphicon-remove form-control-feedback">')
    if(time.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]/)){
        errorSpan.remove();
        $('#group-first-train').removeClass("has-error has-feedback")
        return true;
    } else {
        $('#group-first-train').addClass("has-error has-feedback").append(errorSpan)
        return false;
    }
}


function updateTable(snapshot){
    // loop through snapshot and get each child
    snapshot.forEach(function(childSnapshot){
        var childData = childSnapshot.val()
        
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
        var newRow = $('<tr>');
        // create a new cell for each value
        var trainNameCell = $('<td>').html(trainName);
        var destinationCell = $('<td>').html(destination);
        var frequencyCell = $('<td>').html(frequency);
        var nextArrivalCell = $('<td>').html(nextTrain)
        var timeToArrivalCell = $('<td>').html(timeToArrival);

        // append the cells to the row
        newRow.append(trainNameCell, destinationCell, frequencyCell, nextArrivalCell, timeToArrivalCell)
        // append the row to the table body
        $('#schedule-table-body').append(newRow)
    })
}

function calcTimes(first, frequency){
    var currentTime = moment();
    var convertedFirst = moment(first, "HH:mm").subtract(1, "years")
    var timeDifference = currentTime.diff(moment(convertedFirst), "minutes")
    var remainder = timeDifference % frequency;
    var minutesAway = frequency - remainder;
    var nextArrival = currentTime.add(minutesAway, "minutes")
    return nextArrival
  //  return moment(nextArrival) .format("hh:mm");
}