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
  var formPosition = "bottom"
  var initialPosition = "bottom"
  var recordID
  var allRecords = []
  var intervalId;
  var timer;

 


$(document).ready(function(){
    startTimer()
    toggleForm()
    togglePosition();
    ref.on('value', function(snapshot){
        var currentTime = moment().format("hh:mm:ss");
        $('#last-sync').html("Last Sync: " + currentTime)
      updateTable(snapshot)
    })

    $('#form-submit').on('click', function(){
            addTrain();
            toggleForm();
            togglePosition();
    })

    $('body').on('click', '.edit', function(){
        formMode = "edit";
        recordID = $(this).attr("id");
        // get row to highlight, need to work out logic to unhighlight
        var row = $(this).closest('tr')
        var rowidx = row.index()
        console.log(rowidx)
        row.css("background-color", "yellow")
      //  var table = $('#schedule-table')
      //  var thisRow = $(this).index()
       // var value = table.rows[thisRow].cells[0].text()
      //  alert(value)
        updateAllRecords();
        toggleForm();
        togglePosition();
        editRecord(recordID);
    })

    $('body').on('click', '.btnToggle', function(){
        formPosition = $(this).attr("id")
        initialPosition = formPosition
        togglePosition()
    })

  /*  $('#schedule-table-body').on('click', 'tr', function(e){
        alert($(e.currentTarget).index());
        var trainName = $(this).find('td:first').text()
        alert(trainName)
    }) */
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
        frequency: frequencyInput,
        editing: false
    };
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
    $('#schedule-table-body').empty();
    snapshot.forEach(function(childSnapshot){
        
        var childData = childSnapshot.val();
        var id = childSnapshot.key;
        
        if(id !== "lastUpdate"){
            
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
            var newRow = $('<tr>');
            // create a new cell for each value
            var trainNameCell = $('<td>').html(trainName);
            var destinationCell = $('<td>').html(destination);
            var frequencyCell = $('<td>').html(frequency);
            var nextArrivalCell = $('<td>').html(nextTrain)
            var timeToArrivalCell = $('<td>').html(timeToArrival);
            var editCell = $('<td>')
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

function calcTimes(first, frequency){
    var currentTime = moment();
    var convertedFirst = moment(first, "HH:mm").subtract(1, "years")
    var timeDifference = currentTime.diff(moment(convertedFirst), "minutes")
    var remainder = timeDifference % frequency;
    var minutesAway = frequency - remainder;
    var nextArrival = currentTime.add(minutesAway, "minutes")
    return nextArrival
}


function editRecord(recordID){

  ref.orderByKey().equalTo(recordID).on("child_changed", function(snapshot){
    console.log(snapshot.val())
        $('#input-train-name').val(snapshot.val().trainName)
        $('#input-destination').val(snapshot.val().destination)
        $('#input-first-train').val(snapshot.val().firstTrain)
        $('#input-frequency').val(snapshot.val().frequency)
   })
  
   ref.child(recordID).update({
       "editing": true
   })
   

}


function toggleForm(){
     
    var formTitle = $('#form-title')
    if(formMode === "edit"){
        formPosition = "right";
        formTitle.html("Editing Train Schedule")
        $('#form-submit').html("Update Train")
    } else {
        formPostion = initialPosition
        formTitle.html("Add Train to Schedule")
        $('#form-submit').html("Add Train")
    }
}


function togglePosition(){
    switch(formPosition){
        case "bottom":
            $('#main')
                .removeClass("container-fluid")
                .addClass("container")
            $('#schedule')
                .removeClass("col-xs-8")
                .addClass("col-xs-12")
                .appendTo($('#row-primary'))
            $('#form')
                .removeClass("col-xs-4")
                .addClass("col-xs-12")
                .appendTo($('#row-secondary'));
            break;

        case "right":
            $('#main')
                .removeClass("container")
                .addClass("container-fluid")
            $('#schedule')
                .removeClass("col-xs-12")
                .addClass("col-xs-8")
                .appendTo($('#row-primary'))
            $('#form')
                .removeClass("col-xs-12 pull-left")
                .addClass("col-xs-4 pull-right")
                .appendTo($('#row-primary'))
            break;

        case "left":
            $('#main')
                .removeClass("container")
                .addClass("container-fluid")
            $('#schedule')
                .removeClass("col-xs-12")
                .addClass("col-xs-8")
                .appendTo($('#row-primary'))
            $('#form')
                .removeClass("col-xs-12")
                .addClass("col-xs-4 pull-left")
                .prependTo($('#row-primary'))
            break;

        case "top":
            $('#main')
                .removeClass("container-fluid")
                .addClass("container")
            $('#schedule')
                .removeClass("col-xs-8")
                .addClass("col-xs-12")
                .appendTo($('#row-secondary'))
            $('#form')
                .removeClass("col-xs-4")
                .addClass("col-xs-12")
                .appendTo($('#row-primary'));
            break;

        default:
            return;
            

    }
}

function updateAllRecords(){
    for(i=0; i < allRecords.length; i++){
        ref.child(allRecords[i]).update({
            "editing": false
        })
    }
}


function startTimer(){
    clearInterval(intervalId)
    timer = 60;
    intervalId = setInterval(timerCountdown, 1000)

}

function timerCountdown(){
    timer--
    if(timer === 0){
        var currentTime = moment().format("hh:mm:ss")
        ref.update({lastUpdate: currentTime})
        startTimer()
        
    }
}