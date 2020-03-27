window.addEventListener("load", checkRoomExists);

let deletedIds = [];
let tempId;
let problems = [{}];
let rooms = [{}];
//I have set a localstorrage localStorage.getItem('user');

//let mySuperUserPassword = localStorage.getItem("superuserPassword");
let mySuperUserPassword ="";
let currentQueSuperUserPassword;
let runningProcesses = 0;

setInterval(dataGet, 10000);

const domData ={};
domData.roomName =document.querySelector("#createroom [data-create=room]");
domData.password = document.querySelector("#createroom  [data-create=room_password]")
//createRoomDomVars.button = document.querySelector("#createroom  button");
domData.buttons = document.querySelector("#createroom");

domData.UrlRoom;
domData.que = document.querySelector("#que");



function checkRoomExists() {
    console.log("checkRoomExists room ");
    // check that createRoomDomVars.roomName is not in database
    fetch(dbUrl + "/rooms", {
        method: "get",
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "x-apikey": apikey,
            "cache-control": "no-cache"
        }
    })
        .then(e => e.json())
        .then(e => {
            rooms = e;


            let myRooms = rooms.map(room => room.roomname);
          
            

            /*initiate the autocomplete function on the "inputRoom" element, and pass along the countries array as possible autocomplete values:*/
            autocomplete(document.getElementById("inputRoom"), myRooms);
            console.log("rooms.roomname", myRooms);


            let roomtaken = rooms.filter(room => room.roomname === getUrlVars()["room"]);
            //console.log("roomtaken:", roomtaken);

            if (roomtaken.length > 0) {
                //that is there is a room allready

                //SETS A VARIABLE
                domData.UrlRoom = getUrlVars()["room"];
                currentQueSuperUserPassword = roomtaken[0].password;

                //currentQueSuperUserPassword 
                if (localStorage.getItem("superuserPassword") === currentQueSuperUserPassword) {
                    //SETS A VARIABLE
                    mySuperUserPassword = currentQueSuperUserPassword;
                } else {
                    mySuperUserPassword = "";
                }
                start();

                //add current url to header
                document.querySelector("#que > table > caption > span").textContent = window.location.href;



                ////console.log("currentQueSuperUserPassword = roomtaken.password", currentQueSuperUserPassword, roomtaken.password);
                //return true;
            } else {

                //return false;
                window.history.pushState(location.pathname + "/index.html", "Title", location.pathname );
                start();


                //go to the frontpage
            }
        })



    //if room exixts write the name with a dash - allready exists and make red
};
function start() {
    console.log('start');
   
    //document.querySelector("#inputRoom").addEventListener('input', roomCheck);

    
    // document.querySelector("#gotoRoomBtn").classList.add("disabled");
    // document.querySelector("#gotoRoomBtn").disabled = true;
    // document.querySelector("#createRoomBtn").classList.add("disabled");
    // document.querySelector("#createRoomBtn").disabled = true;
    // document.querySelector("#adminRoomBtn").classList.add("disabled");
    // document.querySelector("#adminRoomBtn").disabled = true;


    document.querySelector("#inputRoom").oninput = sendValue;

    function sendValue(e){
        roomCheck(e.target.value);
    }
 
    //document.querySelector("#inputRoom").addEventListener("mouseleave", roomCheck);
    tempId =1;
    //getUrlVars();
       
    dataGet();
    document.querySelector("#closeDialog").addEventListener("click", closeDialog);
    roomIsSet();
}

function SHOW_problems_addedProblems_deletedIds_SHOW() {

    //-----------Generates problemsWithoutDeleteditems whitch is problems + addedproblems - deletedproblems
    let problemsWithoutDeleteditems = {};
    problemsWithoutDeleteditems = problems.filter(function (item) {

        return deletedIds.indexOf(item._id) == -1;
    });

    problemsWithoutDeleteditems.sort(function (a, b) {
        var x = a.problem_added.toLowerCase();
        var y = b.problem_added.toLowerCase();
        if (x < y) { return -1; }
        if (x > y) { return 1; }
        return 0;
    });

    domDeleteRows();
    //show all
    domShowContent(problemsWithoutDeleteditems);
    

}
function dataGet(justAddedId){
    //disableInsert();


    //to find currentQueSuperUserPassword
    

    runningProcesses++;

    console.log("dataGet");
    
  
    fetch(dbUrl+"/problems" +"?metafields=true", {
        method: "get",
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "x-apikey": apikey,
            "cache-control": "no-cache"
        }
    })
        .then(e => e.json())
        .then(e => {
            //only get current rooms problems
            problems = e.filter(element => element.room ===  getUrlVars()["room"]);
            //document.querySelector("#loading").classList.add("hide");


            //if superuserPassword exixts
            
            //hvis userid not in problems
            let myproblem = problems.filter(problem => problem._id == localStorage.getItem('user'))
            //console.log("userid : myproblem", localStorage.getItem('user'), myproblem.length);
            if (myproblem.length < 1) {
               localStorage.removeItem("user");
            }

            disableInsert();

            runningProcesses--;
            //console.log("problems i dataGet, runningprocess", runningProcesses);
            //console.table(problems);
            if (runningProcesses <= 0) {
                deletedIds = [];
                SHOW_problems_addedProblems_deletedIds_SHOW()
            }
          
        });
}
function dataInsert(body) {
    ////console.log("dataInsert", body);
    runningProcesses++;
   
    closeDialog();

    //-----------generate temp object that is a copy of body, but with a id and a timestamp and puts it in addedProblems
    const bodyTemp = JSON.parse(JSON.stringify(body));
    bodyTemp.problem_short = "OPDATERER";
    tempId = tempId + 1;
    bodyTemp._id = tempId;
    const now = new Date();
    bodyTemp.problem_added = now.toISOString();
    //addedProblems.push(bodyTemp);
    problems.push(bodyTemp);
    //-----------SLUT
    
 SHOW_problems_addedProblems_deletedIds_SHOW();


    //inserts the room into the body
    body.room = getUrlVars()["room"];




    fetch(dbUrl + "/problems", {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "x-apikey": apikey,
            "cache-control": "no-cache"
        },
        body: JSON.stringify(body),
        json: true
    }).then(e => e.json())
        .then(e => {
            let addedProblem =e;
            runningProcesses--;

            // dataProblemAddedOpdated will send dataGet()
            dataProblemAddedOpdated(addedProblem._id, addedProblem._created, "insert", bodyTemp._id)

            //set the userID equal to the current problems added
            if (localStorage.getItem('user')==null){
                localStorage.setItem("user", addedProblem._id);
             
                document.querySelector("#insertDialogShow").removeEventListener("click", insertDialogShow);
                document.querySelector("#insertDialogShow").classList.add("disabled");
            } 
           
          
        });
}
function dataUpdate(event, body,  idProblemOwner, idProblemHelper  ){
    ////console.log("dataUpdate: ", event,  body, updateId, deleteId);
    runningProcesses++;

    closeDialog();

    //if i update any other than my own 
    if (idProblemHelper != idProblemOwner) {
        dataDelete(event, idProblemOwner);
        deletedIds.push(idProblemOwner);
    } 
  
    //let updateIndex = problemsWithoutDeleteditems.indexOf(updateId);
    let updateIndex = problems.map(function (e) { return e._id; }).indexOf(idProblemHelper);
   

    problems[updateIndex].problem_owner = body.problem_owner;
    //problems[updateIndex].problem_short = body.problem_short;
    problems[updateIndex].problem_short = "OPDATERER";
    problems[updateIndex].problem_long = body.problem_long;
    problems[updateIndex].problem_added = body.problem_added;
   // problems[updateIndex]._created = "test";

    SHOW_problems_addedProblems_deletedIds_SHOW();

    fetch(dbUrl + "/problems" + "/" + idProblemHelper, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "x-apikey": apikey,
            "cache-control": "no-cache"
        },
        body: JSON.stringify(body),
        json: true
    }).then(e => e.json())
        .then(e => {
            let addedProblem = e;
            runningProcesses--;
             
            // dataProblemAddedOpdated will send dataGet()
            dataProblemAddedOpdated(addedProblem._id, body._created, "update")
    
            
        });
}
function dataDelete(event, id) {
    console.log("dataDelete" );
    closeDialog();
  
    runningProcesses++;

    //RESETS, now normal users can insert again
    localStorage.removeItem("user");
    //userId = localStorage.getItem('user');
    
    //add id to deleted id's
    deletedIds.push(id);
 
    SHOW_problems_addedProblems_deletedIds_SHOW();

    fetch(dbUrl + "/problems" + "/" + id, {

             method: "delete",
             headers: {
                 "Content-Type": "application/json; charset=utf-8",
                 "x-apikey": apikey,
                 "cache-control": "no-cache"
             }


         }) .then(e => e.json())
            .then(e => {
                runningProcesses--;
                 dataGet();
                    });
         
     
 }
function dataProblemAddedOpdated(id, date, method, addedProblemsId ) {
    //used to update a problem
    //function to keep track of added problems not in problems yet'
    runningProcesses++;

    if (method === "update") {
        //her skirer jeg rækkefølgen
        //Hvis det er en update, skal det nye øverst ellers nederst
    }

    let body = { "problem_added": date };
    fetch(dbUrl + "/problems" + "/" + id + "?metafields=true", {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "x-apikey": apikey,
            "cache-control": "no-cache"
        },
        body: JSON.stringify(body),
        json: true
    }).then(e => e.json())
        .then(e => {
            runningProcesses--;

            if (method === "insert") {
                //with an id, because the just added id should be removed from the local addedProblems
                //this is only when the problem is inserted
                dataGet(addedProblemsId);
            } else {
                dataGet();
            }

        });

}
function dropdownListChosenRow(event, idProblemHelper) {
    console.log("dropdownListChosenRow", idProblemHelper);
    //This function sets what happens on change of dropdown

    document.querySelector("#problem  [data-content=name]").classList.add("disabled_textfield");
    document.querySelector("#problem  [data-content=problem_short]").classList.remove("disabled_textfield");
    document.querySelector("#problem  [data-content=problem_long]").classList.remove("disabled_textfield");

    document.querySelector("#problem  [data-content=name]").disabled = true;
    document.querySelector("#problem  [data-content=problem_short]").disabled = false;
    document.querySelector("#problem  [data-content=problem_long]").disabled = false;

    //update button gets id from helper
    document.querySelector("#updateBtn").dataset.id = idProblemHelper;
    let chosen = problems.filter(problem => problem._id === idProblemHelper);
    //console.log("chosen: ", chosen)

    //content from helper is put in place
    document.querySelector("#problem  [data-content=name]").value = chosen[0].problem_owner;
    document.querySelector("#problem  [data-content=problem_short]").value = chosen[0].problem_short;
    document.querySelector("#problem  [data-content=problem_long]").value = chosen[0].problem_long;

    


}
function format(date) {
   // //console.log("date",date);

    




    const hours = date.getHours();
    const minutes = date.getMinutes();

    // if (isNaN(hours)) {
    //     return "OPDATERER";
    // }

   // return (1 + ((hours - 1) % 12)) + ":" + minutes.toString().padStart(2, "0") + " " + ((hours > 11) ? "PM" : "AM");
    return (1 + ((hours - 1) % 12)) + ":" + minutes.toString().padStart(2, "0") ;
}
function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        vars[key] = value;
    });
    return vars;
}
function disableInsert() {
    document.querySelector("#insertDialogShow").classList.add("disabled");
    document.querySelector("#insertDialogShow").removeEventListener("click", insertDialogShow);

    if (localStorage.getItem('user') === null || mySuperUserPassword != "") {
        document.querySelector("#insertDialogShow").classList.remove("disabled");
        document.querySelector("#insertDialogShow").addEventListener("click", insertDialogShow)

    } 
   
}

///------------------------------------DOM funktioner-----------------------------------------------

function closeDialog() {
    console.log("closeDialog");

    document.querySelector("#dialog").classList.add("hide");

    document.querySelector("  [data-content=name]").value = "";
    document.querySelector("  [data-content=problem_short]").value = "";
    document.querySelector(" [data-content=problem_long]").value = "";
}
function buildBodyFromForm() {
    //console.log('insert');
    if (mySuperUserPassword != "") {
        document.querySelector("#insertDialogShow").classList.remove("disabled");
        document.querySelector("#insertDialogShow").addEventListener("click", insertDialogShow)

    } 

    

    let problem_owner = document.querySelector("#problem  [data-content=name]").value;
    let problem_short = document.querySelector("#problem   [data-content=problem_short]").value;
    let problem_long = document.querySelector("#problem  [data-content=problem_long]").value;
    const now = new Date();
    problem_added = now.toISOString();
    //2 next lines updates my problem
    let body = { "problem_owner": problem_owner, "problem_short": problem_short, "problem_long": problem_long, "problem_added": problem_added };
    //console.log("buildBodyFromForm :body: ", body)


    dataInsert(body);


}

function enableInsertDialogShow(){
    document.querySelector("#problem  [data-content=name]").disabled = false;
    document.querySelector("#problem  [data-content=problem_short]").disabled = false;
    document.querySelector("#problem  [data-content=problem_long]").disabled = false;

    document.querySelector("#problem  [data-content=name]").value = "";
    document.querySelector("#problem  [data-content=problem_short]").value = "";
    document.querySelector("#problem  [data-content=problem_long]").value = "";

    document.querySelector("#problem  [data-content=name]").classList.remove("disabled_textfield");
    document.querySelector("#problem  [data-content=problem_short]").classList.remove("disabled_textfield");
    document.querySelector("#problem  [data-content=problem_long]").classList.remove("disabled_textfield");

}

function insertDialogShow() {
    console.log('insertDialogShow');

    enableInsertDialogShow()

  
    //SHOW
    document.querySelector("#dialog").classList.remove("hide");
    document.querySelector("#insertBtn").classList.remove("hide");
    document.querySelector("#updateProblem").classList.add("hide");
    document.querySelector("#problem").classList.remove("hide");
   

    //HIDE
    document.querySelector("#delete").classList.add("hide");
    document.querySelector("#updateBtn").classList.add("hide");
    
    //CLICK
    document.querySelector("#insertBtn").addEventListener("click", buildBodyFromForm);

    //DATA old id's deleted
    document.querySelector("#updateBtn").dataset.id = "";
   
}
function domDeleteRows(){
    //console.log("deleteRow");
  
    //document.querySelector(`.id_${id}`).remove();
    document.querySelectorAll("tbody > tr:nth-child(n+2)").forEach(e => e.remove());
    document.querySelectorAll('#selections option:nth-child(n+2)').forEach(e => e.remove());
    
}
function domShowContent(problems) {
    //console.log("showContent");
    // document.querySelector("#dialog").classList.add("hide");
    // document.querySelector("#delete").classList.add("hide");


    let templateProblem = document.querySelector('#question');
    let templateDropdown = document.querySelector('#solved_by');

    //question list
    let qList = document.querySelector("tbody");
    //solvedby list
    let dropdownList = document.querySelector("#selections");

    let currentProblem = problems.filter(problem => problem._id === localStorage.getItem('user'));
    
        // Loop
        problems.forEach((el, i) => {
        let clone = templateProblem.content.cloneNode(true);
        let clone2 = templateDropdown.content.cloneNode(true);

        clone.querySelector("[data-content=name]").textContent = el.problem_owner;
        clone.querySelector("[data-content=problem_short]").innerHTML = `<strong>${el.problem_short}</strong><br> ${el.problem_long} `;
        const date = new Date(el.problem_added);
        clone.querySelector("[data-content=timeInQue]").textContent = format(date);
        clone.querySelector("[data-content=deleteList]").dataset.id = el._id;

//--------------------------------------Klik på delete/update knap -------------------------------------- 

        clone.querySelector("[data-content=deleteList]").addEventListener("click", deleteDialogShow);
        clone.querySelector("[data-content=updateList]").addEventListener("click", updateDialogShow);
//--------------------------------------Klik på delete/update knap slut -------------------------------------- 


        
       
                clone2.querySelector("option").textContent = el.problem_owner + ": " + el.problem_short;
                clone2.querySelector("option").dataset.id = el._id;
                clone2.querySelector("option").value = el._id;
                 //remove options options if
            if (localStorage.getItem('user') != null && mySuperUserPassword == ""){
                if (el.problem_added < currentProblem[0].problem_added ) {
                        clone2.querySelector("option").remove();
                    }
            }

        //remove buttons
        if (localStorage.getItem('user') != el._id && mySuperUserPassword == "") {
           // clone.querySelector("button.deleteList_1").remove();
            //clone.querySelector("button.updateList_1").remove();
            clone.querySelector("[data-title=Update]").textContent="";
            clone.querySelector("[data-title=Fjern]").textContent="";
           
        }

        

        qList.appendChild(clone);
        dropdownList.appendChild(clone2);





      
        dropdownList.addEventListener("change", dropdownListChosen);
        // CHANGE dropdown SLUT

        function deleteDialogShow() {
           // console.log('deleteDialogShow');

            //console.log("HER KOMMER ID", this.dataset.id);
             
            //SHOW

            document.querySelector("#dialog").classList.remove("hide");
            document.querySelector("#delete").classList.remove("hide");
            

            //HIDE
            document.querySelector("#insertBtn").classList.add("hide");
            document.querySelector("#updateBtn").classList.add("hide");
            document.querySelector("#problem").classList.add("hide");
            document.querySelector("#updateProblem").classList.add("hide");
          
            
            //document.querySelector("#updateBtn").addEventListener("click", updateProblem);
           
            // Assign the listener callback to a variable, and remove ventlistener. 
            var deleteRow = (event) => {
                //console.log("remove eventlistener fra #removeProblem");
                document.querySelector("#removeProblem").removeEventListener('click', deleteRow);
        
                dataDelete(event, this.dataset.id);
                //console.log("HER KOMMER ID", this.dataset.id);
               // document.querySelector("#removeProblem").removeEventListener('click', deleteRow);
            };
            document.querySelector("#removeProblem").addEventListener('click', deleteRow);

           



      
        }

        function updateDialogShow() {
            console.log('updateDialogShow');

            //HIDE
            document.querySelector("#insertBtn").classList.add("hide");
            document.querySelector("#delete").classList.add("hide");


            //SHOW
            document.querySelector("#dialog").classList.remove("hide");
            document.querySelector("#updateBtn").classList.remove("hide");
            document.querySelector("#problem").classList.remove("hide");
            document.querySelector("#updateProblem").classList.remove("hide");

            document.querySelector("#problem  [data-content=name]").classList.add("disabled_textfield");
            document.querySelector("#problem  [data-content=problem_short]").classList.add("disabled_textfield");
            document.querySelector("#problem  [data-content=problem_long]").classList.add("disabled_textfield");

            document.querySelector("#problem  [data-content=name]").disabled = true;
            document.querySelector("#problem  [data-content=problem_short]").disabled = true;
            document.querySelector("#problem  [data-content=problem_long]").disabled = true;

            document.querySelector("#problem  [data-content=name]").value = "";
            document.querySelector("#problem  [data-content=problem_short]").value = "";
            document.querySelector("#problem  [data-content=problem_long]").value = "";

            
           


            //dialogClose();


            //document.querySelector("#updateBtn").addEventListener("click", updateProblem);

           
            //UPDATE parameters are send to updateRow
            var updateRow = (event) => {
                //
                let idProblemHelper = document.querySelector("#updateBtn").dataset.id;
                //console.log("this.dataset.id", this.dataset.id)

                let idProblemOwner = el._id;
                let problemOwnerAdded = el.problem_added;
                let problemHelper = document.querySelector("#problem  [data-content=name]").value;
                let problemHelperShort = document.querySelector(" #problem  [data-content=problem_short]").value;
                let problemHelperLong = document.querySelector("#problem  [data-content=problem_long]").value;

                //2 next lines updates my problem
                let bodyHelper = { "problem_owner": problemHelper, "problem_short": problemHelperShort, "problem_long": problemHelperLong, problem_added: problemOwnerAdded };


                dataUpdate(event, bodyHelper, idProblemOwner, idProblemHelper);
                

                document.querySelector("#updateBtn").removeEventListener('click', updateRow);
            };
            document.querySelector("#updateBtn").addEventListener('click', updateRow);




        }
    });

    document.querySelector("#loading").classList.add("hide");
}
  //CHANGE dropdown with parameters
let dropdownListChosen = (event) => {
    console.log("HVORNÅR MON DENNE BLIVER KALDT?");
    let idProblemHelper = document.querySelector("#selections").value;
    dropdownListChosenRow(event, idProblemHelper);
    //console.log("id og problems: ", idProblemHelper, problems)
};







function dataCreateRoom() {
    // check that createRoomDomVars.roomName is not in database
    document.querySelector("#createRoomBtn").removeEventListener("click", createRoom);

    document.querySelector("#loading").classList.remove("hide");

    

    fetch(dbUrl + "/rooms", {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "x-apikey": apikey,
            "cache-control": "no-cache"
        },
        body: JSON.stringify({
            "roomname": encodeURI(domData.roomName.value),
            "password": domData.password.value
        }),
        json: true
    }).then(e => e.json())
        .then(e => {
            //console.log("room insertet");

            //save superuserpassword in localstorrage
            localStorage.setItem("superuserPassword", domData.password.value);
            checkRoomExists();

            newUrlAndQr();
            roomIsSet();
        })




};

function newUrlAndQr() {
    newUrl();
    newQr();
    
}

function newUrl() {
    console.log("newUrl", domData.password.value);
    //when done set localStorage superuserPassword and redirect to an url *?room=reateRoomDomVars.roomName
    
    

    //næste linielaver ny url
    window.history.pushState("index.html", "Title", location.pathname +"?room=" + domData.roomName.value);
    //insert new url i variable
    domData.UrlRoom = getUrlVars()["room"];
}
function newQr() {//generate qr code

    document.getElementById("qrcode").textContent = "";
    if (getUrlVars()["room"] != undefined){

        var qrcode = new QRCode(document.getElementById("qrcode"), {
            text: window.location.href,
            width: 140,
            height: 140,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
}

function roomIsSet() {
    console.log("roomIsSet")
    //newUrlAndQr();
    newQr();

    if (domData.UrlRoom != null) {
        //console.log("roomIsSet room is:", createRoomDomVars.UrlRoom)
        //disable create room
        domData.buttons.classList.add("hide");
        //unhide table
        //console.log("remove hide from que");
        domData.que.classList.remove("hide");
        //hide table
    }
    else {
        //console.log("roomIsSet no room:")
        //enable create room
        setInterval(dataGet, 10000);
         domData.buttons.classList.remove("hide");
        //unhide table
        domData.que.classList.add("hide");
    }


}






function autocomplete(inp, arr) {
    /*the autocomplete function takes two arguments,
    the text field element and an array of possible autocompleted values:*/
    var currentFocus;
    /*execute a function when someone writes in the text field:*/
    inp.addEventListener("input", function (e) {
        var a, b, i, val = this.value;
        /*close any already open lists of autocompleted values*/
        closeAllLists();
        if (!val) { return false; }
        currentFocus = -1;
        /*create a DIV element that will contain the items (values):*/
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        /*append the DIV element as a child of the autocomplete container:*/
        this.parentNode.appendChild(a);
        /*for each item in the array...*/
        for (i = 0; i < arr.length; i++) {
            /*check if the item starts with the same letters as the text field value:*/
            if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                /*create a DIV element for each matching element:*/
                b = document.createElement("DIV");
                /*make the matching letters bold:*/
                b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
                b.innerHTML += arr[i].substr(val.length);
                /*insert a input field that will hold the current array item's value:*/
                b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                /*execute a function when someone clicks on the item value (DIV element):*/
                b.addEventListener("click", function (e) {
                    
                    /*insert the value for the autocomplete text field:*/
                    inp.value = this.getElementsByTagName("input")[0].value;
                    /*close the list of autocompleted values,
                    (or any other open lists of autocompleted values:*/
                    
                    closeAllLists();
                    
                    //alert(`${this.getElementsByTagName("input")[0].value}`);
                    roomCheck(this.getElementsByTagName("input")[0].value);
                    
               
                });
                a.appendChild(b);
                
            }
        }
    });
    /*execute a function presses a key on the keyboard:*/
    inp.addEventListener("keydown", function (e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
            /*If the arrow DOWN key is pressed,
            increase the currentFocus variable:*/
            currentFocus++;
            /*and and make the current item more visible:*/
            addActive(x);
        } else if (e.keyCode == 38) { //up
            /*If the arrow UP key is pressed,
            decrease the currentFocus variable:*/
            currentFocus--;
            /*and and make the current item more visible:*/
            addActive(x);
        } else if (e.keyCode == 13) {
            /*If the ENTER key is pressed, prevent the form from being submitted,*/
            //and send value
            
            e.preventDefault();
            

            if (currentFocus > -1) {
                /*and simulate a click on the "active" item:*/
                if (x) x[currentFocus].click();
            }
            roomCheck(e.target.value);
        }
    });


    function addActive(x) {
        /*a function to classify an item as "active":*/
        if (!x) return false;
        /*start by removing the "active" class on all items:*/
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        /*add class "autocomplete-active":*/
        x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x) {
        /*a function to remove the "active" class from all autocomplete items:*/
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }
    function closeAllLists(elmnt) {
        /*close all autocomplete lists in the document,
        except the one passed as an argument:*/
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }
    /*execute a function when someone clicks in the document:*/
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
       
      
    });
}

/*An array containing all the country names in the world:*/
//var countries = ["Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Anguilla", "Antigua & Barbuda", "Argentina", "Armenia", "Aruba", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bermuda", "Bhutan", "Bolivia", "Bosnia & Herzegovina", "Botswana", "Brazil", "British Virgin Islands", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde", "Cayman Islands", "Central Arfrican Republic", "Chad", "Chile", "China", "Colombia", "Congo", "Cook Islands", "Costa Rica", "Cote D Ivoire", "Croatia", "Cuba", "Curacao", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", "Falkland Islands", "Faroe Islands", "Fiji", "Finland", "France", "French Polynesia", "French West Indies", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Gibraltar", "Greece", "Greenland", "Grenada", "Guam", "Guatemala", "Guernsey", "Guinea", "Guinea Bissau", "Guyana", "Haiti", "Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Isle of Man", "Israel", "Italy", "Jamaica", "Japan", "Jersey", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Macau", "Macedonia", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Montserrat", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauro", "Nepal", "Netherlands", "Netherlands Antilles", "New Caledonia", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Puerto Rico", "Qatar", "Reunion", "Romania", "Russia", "Rwanda", "Saint Pierre & Miquelon", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "St Kitts & Nevis", "St Lucia", "St Vincent", "Sudan", "Suriname", "Swaziland", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor L'Este", "Togo", "Tonga", "Trinidad & Tobago", "Tunisia", "Turkey", "Turkmenistan", "Turks & Caicos", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States of America", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Virgin Islands (US)", "Yemen", "Zambia", "Zimbabwe"];

function roomCheck(e){
    //alert(e);
    document.querySelector("#adminRoomBtn").classList.add("disabled");
    document.querySelector("#adminRoomBtn").disabled = true;
    
    let myRooms = rooms.map(room => room.roomname);
    
    //console.log("e.value)", e.target.value);
    //check if dropdown of exixting rooms is gone
    if (myRooms.includes(e)){


        //then we have an exixting room

        // if room exists activate goto AND admin
        //if goto is activated goto URL +?room=xxxx
        //if admin clicked activate password with the text enter admin password
        console.log("existing ROOM");

        document.querySelector("#gotoRoomBtn").classList.remove("disabled");
        document.querySelector("#gotoRoomBtn").disabled = false;
        document.querySelector("#gotoRoomBtn").addEventListener("click", gotoRoom);


        document.querySelector("#createRoomBtn").classList.add("disabled");
        document.querySelector("#createRoomBtn").disabled = true;
        

        document.querySelector("#adminRoomBtn").classList.remove("disabled");
        document.querySelector("#adminRoomBtn").disabled = false;
        document.querySelector("#adminRoomBtn").addEventListener("click", adminRoom);

        document.querySelector("#room_password").classList.add("disabled_textfield");
        document.querySelector("#room_password").disabled = true;
        document.querySelector("#room_password").value = "";
        document.querySelector("#room_password").placeholder = "";


        
        


    } else{


        //Then we will create a new room
        // if room dont exist activat opret and dactivate others
        // when opret is clicked Activate password with the text "opret admin password"
        console.log("new ROOM");

        document.querySelector("#gotoRoomBtn").classList.add("disabled");
        document.querySelector("#gotoRoomBtn"). disabled = true;

        document.querySelector("#createRoomBtn").classList.remove("disabled");
        document.querySelector("#createRoomBtn").disabled =false;
        document.querySelector("#createRoomBtn").addEventListener("click", createRoom);
    



        document.querySelector("#adminRoomBtn").classList.add("disabled");
        document.querySelector("#adminRoomBtn").disabled = true;

        document.querySelector("#room_password").classList.remove("disabled_textfield");
        document.querySelector("#room_password").disabled = false;
        document.querySelector("#room_password").placeholder = "Opret password"
        

    }
   
    
    
            








}

function createRoom(){
    document.querySelector("#createRoomBtn").removeEventListener("click", createRoom);
    document.querySelector("#room_password").oninput = createRoom;
    

    if (document.querySelector("#room_password").value != "") {
        document.querySelector("#createRoomBtn").addEventListener("click", createRoom);
        document.querySelector("#createRoomBtn").classList.remove("disabled");
        document.querySelector("#createRoomBtn").disabled = false;

        document.querySelector("#createRoomBtn").addEventListener("click", dataCreateRoom);
        //dataCreateRoom();
    } else {
        document.querySelector("#room_password").classList.add("warning");
        document.querySelector("#createRoomBtn").classList.add("disabled");
        document.querySelector("#createRoomBtn").disabled = true;
    }
    
}

function gotoRoom() {
    document.querySelector("#loading").classList.remove("hide");
    console.log("gotoRoom");

    //nulstill superuser 
    localStorage.setItem("superuserPassword", "");


    window.history.pushState("index.html", "Title", location.pathname + "?room=" + domData.roomName.value);
    checkRoomExists();


}

function adminRoom(){
    //document.querySelector("#loading").classList.remove("hide");
    // domData.roomName.value
    // if document.querySelector("#room_password").value

    //document.querySelector("#room_password").focus();
    //document.querySelector("#room_password").select();



    let roomtaken = rooms.filter(room => room.roomname === domData.roomName.value);
    //console.log("roomtaken:", roomtaken);

    currentQueSuperUserPassword = roomtaken[0].password;

    
        


    document.querySelector("#room_password").classList.remove("disabled_textfield");
    document.querySelector("#room_password").disabled = false;
    document.querySelector("#room_password").placeholder = "Intast rummets password";
   // document.querySelector("#room_password").classList.add("warning");

    if (domData.password.value === currentQueSuperUserPassword) {
        //SETS A VARIABLE
        localStorage.setItem("superuserPassword", domData.password.value);
        console.log("nyt localstorrage af superuserpassword")
        document.querySelector("#loading").classList.remove("hide");
        window.history.pushState("index.html", "Title", location.pathname + "?room=" + domData.roomName.value);
        checkRoomExists();
    } else if (domData.password.value != "") {
        document.querySelector("#room_password").classList.add("warning");
        document.querySelector("#room_password").placeholder =  "FORKERT - prøv igen";
        document.querySelector("#room_password").value = "";
    }

   

    document.querySelector("#gotoRoomBtn").classList.add("disabled");
    document.querySelector("#gotoRoomBtn").disabled = true;
}



domData.roomName.addEventListener("click", clearFieldRoom);
domData.roomName.addEventListener("focusout", writeFieldRoom);

function clearFieldRoom() {
    console.log("clearFieldRoom");

    if (domData.roomName.value.includes("Intast rum") || domData.roomName.value.includes("allerede")) {
        domData.roomName.value = "";
        // createRoom.roomName.removeEventListener("click", clearFieldRoom);   
    }
}
function writeFieldRoom() {
    console.log("writeFieldRoom");
    if (domData.roomName.value === "") {
        domData.roomName.value = "Intast rum";
        //createRoom.roomName.removeEventListener("focusout", clearFieldRoom);
    }
}

domData.password.addEventListener("focusin", clearFieldPassword);
domData.password.addEventListener("focusout", writeFieldPassword);


function clearFieldPassword() {
    console.log("clearFieldPassword");
    //if (domData.password.value === "Opret password") {
        domData.password.value = "";
        domData.password.type = "password";
    domData.password.classList.remove("warning");
   // domData.password.placeholder = "Intast password";
    
        //createRoom.roomName.removeEventListener("click", clearFieldPassword);
    //}
}
function writeFieldPassword() {
    console.log("writeFieldPassword");
    if (domData.password.value === "") {
        domData.password.placeholder = "Opret password";
        //createRoom.roomName.removeEventListener("click", clearFieldPassword);
        domData.password.type = "text";
    }
}
//createRoomDomVars.button.addEventListener("click", createRoomCheckBefore);

// function createRoomCheckBefore() {
//     console.log("createRoomCheckBefore");

//     //check that both room and password is filled. Otherwise make them red
//     if (domData.password.value === "Opret password" || domData.roomName.value === "Intast rum") {
//         //console.log("either or");
//         if (domData.password.value === "Opret password") {
//             console.log("password not changed");
//             domData.password.classList.add("warning");
//         } else {
//             domData.password.classList.remove("warning");
//         }
//         if (domData.roomName.value === "Intast rum") {
//             // console.log("room not changed");
//             domData.roomName.classList.add("warning");

//         } else {
//             domData.roomName.classList.remove("warning");
//         }

//     } else {
//         domData.roomName.classList.remove("warning");
//         domData.password.classList.remove("warning");
//         //checkRoomExists(createRoomDomVars.roomName.value);


//         let roomscheck = rooms.filter(room => room.roomname === domData.roomName.value)


//         if (roomscheck.length > 0) {       //find ud af om rummet existerer
//             console.log("RUMMET EXISTERER ALLEREDE2");


//             domData.roomName.classList.add("warning");

//             //createRoomDomVars.roomName.vaule += " - Rummet eksisterer allerede";

//             domData.roomName.value += " - Rummet eksisterer allerede";

//         } else {

//             console.log("RUMMET EXISTERER IKKE ALLEREDE");
//             dataCreateRoom();

//         }
//     }





//     // if room dosent exist, make it
//     //put createRoomDomVars.roomName && createRoomDomVars.password in database

//     newUrlAndQr();


//     // roomIsSet();

// }