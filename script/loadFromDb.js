
window.addEventListener("load", start);

let deletedIds = [];
let tempId;
let problems = [{}];
let userId = localStorage.getItem('user');
let superUserId = getUrlVars()["superuser"];
let runningProcesses = 0;

setInterval(dataGet, 10000);

function SHOW_problems_addedProblems_deletedIds_SHOW(){

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



function start() {
    console.log('start');
    tempId =1;
    getUrlVars();
        var qrcode = new QRCode(document.getElementById("qrcode"), {
            text: window.location.href,
        width: 128,
        height: 128,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
         });
    dataGet();
    document.querySelector("#closeDialog").addEventListener("click", closeDialog);
}





function dataGet(justAddedId){
    runningProcesses++;

    console.log("dataGet");
    disableInsert();
  
    fetch(dbUrl +"?metafields=true", {
        method: "get",
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "x-apikey": apikey,
            "cache-control": "no-cache"
        }
    })
        .then(e => e.json())
        .then(e => {
            problems = e;
            document.querySelector("#loading").classList.add("hide");
            
           
            // //tjek om de næste 2 linier virker
            // //remove just added problem
            // posJustAddedId = problems.map(function (element) { return element._id; }).indexOf(justAddedId);
            // problems.splice(posJustAddedId, 1);

            runningProcesses--;
            console.log("problems i dataGet, runningprocess", runningProcesses);
            console.table(problems);
            if (runningProcesses <= 0) {
                deletedIds = [];
                SHOW_problems_addedProblems_deletedIds_SHOW()
            }
          
        });
}


function dataInsert(body) {
    //console.log("dataInsert", body);
    runningProcesses++;
    disableInsert();
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

//remember to delete these
    console.log("problems");
    console.table(problems);
    console.log("deletd Ids");
    console.table(deletedIds);


    fetch(dbUrl, {
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
                userId = localStorage.getItem('user');
                document.querySelector("#insertDialogShow").removeEventListener("click", insertDialogShow);
                document.querySelector("#insertDialogShow").classList.add("disabled");
            } else {
            userId = localStorage.getItem('user');
            }
        });
}
function dataUpdate(event, body,  idProblemOwner, idProblemHelper  ){
    //console.log("dataUpdate: ", event,  body, updateId, deleteId);
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

    fetch(dbUrl + "/" + idProblemHelper, {
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
    //console.log("eventhandler", event, id);
    closeDialog();
    disableInsert();
    runningProcesses++;

    //RESETS, now normal users can insert again
    localStorage.removeItem("user");
    userId = localStorage.getItem('user');
    
    //add id to deleted id's
    deletedIds.push(id);
 
    SHOW_problems_addedProblems_deletedIds_SHOW();

         fetch(dbUrl + "/" + id, {

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
    fetch(dbUrl + "/" + id + "?metafields=true", {
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

    //update button gets id from helper
    document.querySelector("#updateBtn").dataset.id = idProblemHelper;
    let chosen = problems.filter(problem => problem._id === idProblemHelper);
    console.log("chosen: ", chosen)

    //content from helper is put in place
    document.querySelector("  [data-content=name]").value = chosen[0].problem_owner;
    document.querySelector("  [data-content=problem_short]").value = chosen[0].problem_short;
    document.querySelector("  [data-content=problem_long]").value = chosen[0].problem_long;

    


}
function format(date) {
   // console.log("date",date);

    




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
    if (userId != null && superUserId == null) {
        document.querySelector("#insertDialogShow").classList.add("disabled");
        document.querySelector("#insertDialogShow").removeEventListener("click", insertDialogShow);

    } 
    // else if (superUserId != null){
    //     document.querySelector("#insertDialogShow").classList.remove("disabled");
    //     document.querySelector("#insertDialogShow").addEventListener("click", insertDialogShow)
    // }
    
    else{
        document.querySelector("#insertDialogShow").classList.remove("disabled");
        document.querySelector("#insertDialogShow").addEventListener("click", insertDialogShow)
    };
}

// function problemsSort(){
//     problems.sort(function (a, b) {
//         var x = a.problem_added.toLowerCase();
//         var y = b.problem_added.toLowerCase();
//         if (x < y) { return -1; }
//         if (x > y) { return 1; }
//         return 0;
//     });
// }



///------------------------------------DOM funktioner-----------------------------------------------



function closeDialog() {
    //console.log("dialogClose");

    document.querySelector("#dialog").classList.add("hide");

   // document.querySelector("#insertBtn").classList.add("hide");
    //document.querySelector("#delete").classList.add("hide");

    document.querySelector("  [data-content=name]").value = "";
    document.querySelector("  [data-content=problem_short]").value = "";
    document.querySelector(" [data-content=problem_long]").value = "";

 


}

function buildBodyFromForm() {
    //console.log('insert');

    let problem_owner = document.querySelector("  [data-content=name]").value;
    let problem_short = document.querySelector("  [data-content=problem_short]").value;
    let problem_long = document.querySelector(" [data-content=problem_long]").value;
    const now = new Date();
    problem_added = now.toISOString();
    //2 next lines updates my problem
    let body = { "problem_owner": problem_owner, "problem_short": problem_short, "problem_long": problem_long, "problem_added": problem_added };



    dataInsert(body);


}

function insertDialogShow() {
    //console.log('insertDialogShow');

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


    let template = document.querySelector('#question');
    let template2 = document.querySelector('#solved_by');

    //question list
    let qList = document.querySelector("tbody");
    //solvedby list
    let dropdownList = document.querySelector("#selections");



 
        // Loop
    problems.forEach((el, i) => {
       // console.log("i er ", i);
        let clone = template.content.cloneNode(true);
        let clone2 = template2.content.cloneNode(true);

        clone.querySelector("[data-content=name]").textContent = el.problem_owner;
        clone.querySelector("[data-content=problem_short]").innerHTML = `<strong>${el.problem_short}</strong><br> ${el.problem_long} `;
        const date = new Date(el.problem_added);
        clone.querySelector("[data-content=timeInQue]").textContent = format(date);
        //console.log("id: ", el._id);
        clone.querySelector("[data-content=deleteList]").dataset.id = el._id;
// console.log("userId", userId)
//         console.log("el._id", el._id)
      



//--------------------------------------Klik på delete/update knap -------------------------------------- 

        clone.querySelector("[data-content=deleteList]").addEventListener("click", deleteDialogShow);
        clone.querySelector("[data-content=updateList]").addEventListener("click", updateDialogShow);
//--------------------------------------Klik på delete/update knap slut -------------------------------------- 




        clone2.querySelector("option").textContent = el.problem_owner + ": " + el.problem_short;
        clone2.querySelector("option").dataset.id = el._id;
        clone2.querySelector("option").value = el._id;

        if (userId != el._id && superUserId == null) {
            // console.log("userid3", userId);
            // console.log("el._id3", el._id)
           
            clone.querySelector("button.deleteList_1").remove();
            clone.querySelector("button.updateList_1").remove();
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
            //console.log('deleteFromQueDialog');

            //HIDE
            document.querySelector("#insertBtn").classList.add("hide");
            document.querySelector("#delete").classList.add("hide");


            //SHOW
            document.querySelector("#dialog").classList.remove("hide");
            document.querySelector("#updateBtn").classList.remove("hide");
            document.querySelector("#problem").classList.remove("hide");
            document.querySelector("#updateProblem").classList.remove("hide");

           


            //dialogClose();


            //document.querySelector("#updateBtn").addEventListener("click", updateProblem);

           
            //UPDATE parameters are send to updateRow
            var updateRow = (event) => {
                //
                let idProblemHelper = document.querySelector("#updateBtn").dataset.id;
                //console.log("this.dataset.id", this.dataset.id)

                let idProblemOwner = el._id;
                let problemOwnerAdded = el.problem_added;
                let problemHelper = document.querySelector("  [data-content=name]").value;
                let problemHelperShort = document.querySelector("  [data-content=problem_short]").value;
                let problemHelperLong = document.querySelector(" [data-content=problem_long]").value;

                //2 next lines updates my problem
                let bodyHelper = { "problem_owner": problemHelper, "problem_short": problemHelperShort, "problem_long": problemHelperLong, problem_added: problemOwnerAdded };


                dataUpdate(event, bodyHelper, idProblemOwner, idProblemHelper);
                

                document.querySelector("#updateBtn").removeEventListener('click', updateRow);
            };
            document.querySelector("#updateBtn").addEventListener('click', updateRow);




        }
    });

}
  //CHANGE dropdown with parameters
let dropdownListChosen = (event) => {
    console.log("HVORNÅR MON DENNE BLIVER KALDT?");
    let idProblemHelper = document.querySelector("#selections").value;
    dropdownListChosenRow(event, idProblemHelper);
    //console.log("id og problems: ", idProblemHelper, problems)
};